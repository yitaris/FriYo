import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState, useMemo, useRef } from "react";
import Colors from "@/styles/Colors";
import { icons, images } from "@/constants";
import { GestureHandlerRootView, ScrollView } from "react-native-gesture-handler";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useLocalSearchParams } from "expo-router";
import { useSupabase } from "@/context/SupabaseContext"; // Supabase bağlamını içe aktar
import { useUser } from "@clerk/clerk-expo";
import { client } from "@/utils/supabaseClient"

const Page = () => {
  const snapPoints = useMemo(() => ["20", "50%", "90%"], []);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const ownUser = useUser();
  const { userId } = useLocalSearchParams();
  const { fetchUsersData, setNotifications, deleteNotifications, unfollowUser, fetchFollowData,getUserImages } = useSupabase();
  const [userData, setUserData] = useState(null); // State to store user data
  const [loading, setLoading] = useState(true); // Loading state
  const [buttonText, setButtonText] = useState("");
  const [isRequestSent, setIsRequestSent] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [userImage,setUserImage] = useState([]);

  const handleFollow = async (followerId, followingId, profilePicture, username) => {
    if (isFollowing) {
      // Handle unfollow
      await unfollowUser(followerId, followingId);
      setButtonText("Takip Et");
      setIsFollowing(false);
      setIsRequestSent(false); // Reset the request status as well
    } else if (isRequestSent) {
      // Cancel the follow request
      await deleteNotifications(followerId, followingId);
      setButtonText("Arkadaş Ekle");
      setIsRequestSent(false);
    } else {
      // Send a follow request
      await setNotifications(followerId, followingId, profilePicture, username);
      setButtonText("İstek Gönderildi");
      setIsRequestSent(true);
    }
  };

  useEffect(() => {
    const getUserData = async () => {
      if (userId) {
        setLoading(true);
        const data = await fetchUsersData(userId);
        const fetchFollowCounts = async () => {
          try {
            if (userId) {
              // Takipçi ve takip edilen verilerini çek
              const followData = await fetchFollowData(userId);

              if (followData) {
                setFollowerCount(followData.followers.length); // Takipçi sayısını ayarla
                setFollowingCount(followData.following.length); // Takip edilen sayısını ayarla
              }
            }
          } catch (error) {
            console.error("Error fetching follow data:", error);
          }
        };
        fetchFollowCounts();
        if (data) {
          setUserData(data[0]); // Assuming you return an array
          // Check if your ID is in the following list
          const isAlreadyFollowing = data[0]?.followers?.includes(ownUser?.user?.id);
          setIsFollowing(isAlreadyFollowing);
          setIsRequestSent(isAlreadyFollowing);
          setButtonText(isAlreadyFollowing ? "Takibi Bırak" : "Takip Et");
        }
        setLoading(false);
      }
    };
    getUserData();
    fetchUserImages();
  }, [userId]);

  const fetchUserImages = async () => {
    setLoading(true);
    try {
      const imageUrls = await getUserImages(userId); // Kullanıcı resimlerini al
      setUserImage(imageUrls); // Resimleri state'e kaydet
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#FABC3F" />
      </View>
    );
  }

  if (!userData) {
    return <Text>User not found</Text>;
  }


  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  };

  return (
    <GestureHandlerRootView style={{ height: "100%", backgroundColor: "white" }}>
      <ScrollView style={styles.container}>

        <View style={styles.profileHeader}>
          <View>
            <Text style={styles.statNumber}>{followerCount}</Text>
            <Text style={styles.statLabel}>Takip</Text>
          </View>
          <View>
            <Image
              source={{
                uri: userData.avatar_url,
              }}
              style={styles.profileImage}
            />
            <Text style={styles.nameText}>
              {capitalizeFirstLetter(userData.first_name)} {capitalizeFirstLetter(userData.last_name)}
            </Text>
            <Text style={styles.usernameText}>@{userData.username}</Text>

          </View>
          <View>
            <Text style={styles.statNumber}>{followingCount}</Text>
            <Text style={styles.statLabel}>Takip</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => handleFollow(ownUser?.user?.id, userId, ownUser?.user?.imageUrl, ownUser?.user?.username)}
          >
            <Text style={styles.buttonText}>{buttonText}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.messageButton}>
            <Text style={styles.buttonText}>Sohbet Et</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={1}
        snapPoints={snapPoints}
        enablePanDownToClose={false}
        handleIndicatorStyle={{
          backgroundColor: "#FABC3F",
        }}
        backgroundStyle={{
          backgroundColor: "#1E201E",
          borderTopRightRadius: 50,
          borderTopLeftRadius: 50,
        }}
        handleStyle={{
          backgroundColor: "transparent",
          height: 50,
        }}
      >
        <BottomSheetView style={{ flex: 1, backgroundColor: "#1E201E" }}>
        <View style={{flexDirection:'row',alignItems:'baseline',justifyContent:'center',height:70}}>
            <TouchableOpacity style={{marginRight:10,backgroundColor:'#FABC3F',padding:10,width:'25%',borderRadius:'10'}}>
              <Text style={{textAlign:'center',fontSize:15,fontWeight:'500'}}>Posts</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{marginRight:10,backgroundColor:'#FABC3F',padding:10,width:'30%',borderRadius:'10'}}>
              <Text style={{textAlign:'center',fontSize:15,fontWeight:'500'}}>Ücretli içerik</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{marginRight:10,backgroundColor:'#FABC3F',padding:10,width:'25%',borderRadius:'10'}}>
              <Text style={{textAlign:'center',fontSize:15,fontWeight:'500'}}>Reels</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{}}>
              {/* Yükleniyor simgesi */}
              {loading && <ActivityIndicator size="large" color="#FABC3F" />}

              {/* Yüklenen resimleri göster */}
              {!loading && userImage.length > 0 && (
                <View style={{ 
                  flexDirection: 'row', 
                  flexWrap: 'wrap', // Satırın taşması durumunda alt satıra geçmesini sağlar
                  justifyContent: 'flex-start' // Resimler sola hizalanacak
                }}>
                  {userImage.map((imageUrl, index) => (
                    <View key={index} style={{ 
                      width: '30%', // Ekranın %30'unu kaplar (3 tane sığdırmak için)
                      marginBottom: 10, // Altına boşluk bırakır
                      marginHorizontal: 5
                    }}>
                      <Image
                        source={{ uri: imageUrl }}
                        style={{
                          width: '100%', // Kapladığı alanı tamamen doldurur
                          height: 115, // Her resmin yüksekliği
                          borderRadius: 10,
                        }}
                        resizeMode="cover"
                      />
                    </View>
                  ))}
                </View>
              )}

              {/* Eğer resim yoksa mesaj göster */}
              {!loading && userImage.length === 0 && (
                <Text style={{ textAlign: 'center', color: 'white', marginTop: 20 }}>
                  Henüz resim yüklenmedi.
                </Text>
              )}
            </ScrollView>
        </BottomSheetView>
      </BottomSheet>
    </GestureHandlerRootView>
  );
};

export default Page;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#FABC3F',
  },
  nameText: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: '#1E201E',
  },
  usernameText: {
    fontSize: 15,
    textAlign: 'center',
    color: '#a9a9a9s',
  },
  statsContainer: {
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  statBox: {
    alignItems: 'center',
    marginHorizontal: 20,
    width: 90
  },
  statNumber: {
    textAlign: 'center',
    fontSize: 19,
    fontWeight: '800',
    color: '#1E201E',
  },
  statLabel: {
    fontSize: 14,
    color: 'gray',
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 20,
  },
  editProfileButton: {
    backgroundColor: "#FABC3F",
    padding: 10,
    borderRadius: 8,
    width: "45%",
    alignItems: "center",
  },
  messageButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#FABC3F",
    padding: 10,
    borderRadius: 8,
    width: "45%",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    color: "#1E201E",
    fontWeight: "600",
  },
  additionalInfo: {
    marginTop: 20,
    padding: 12,
  },
  bioText: {
    fontSize: 16,
    color: "#1E201E",
  },
});
