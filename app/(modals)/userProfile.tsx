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
import { SupabaseClient } from "@supabase/supabase-js";

const Page = () => {
  const snapPoints = useMemo(() => ["20", "50%", "90%"], []);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const ownUser = useUser();
  const { userId } = useLocalSearchParams();
  const { fetchUsersData, setNotifications, deleteNotifications, unfollowUser, fetchFollowData } = useSupabase();
  const [userData, setUserData] = useState(null); // State to store user data
  const [loading, setLoading] = useState(true); // Loading state
  const [buttonText, setButtonText] = useState("");
  const [isRequestSent, setIsRequestSent] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);


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
  }, [userId]);

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

  return (
    <GestureHandlerRootView style={{ height: "100%", backgroundColor: "white" }}>
      <ScrollView style={styles.container}>
        {/* Top Section */}
        <View style={styles.profileHeader}>
          {/* Profile Image */}
          <Image
            source={{
              uri: userData.avatar_url,
            }}
            style={styles.profileImage}
          />

          {/* User Info */}
          <View style={styles.userInfo}>
            <Text style={styles.nameText}>
              {userData.first_name} {userData.last_name}
            </Text>
            <Text style={styles.usernameText}>@{userData.username}</Text>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{followerCount}</Text>
            <Text style={styles.statLabel}>takip</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{followingCount}</Text>
            <Text style={styles.statLabel}>takipçi</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Başarımlar</Text>
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

        {/* Additional Info */}
        <View style={styles.additionalInfo}>
          <Text style={{ fontSize: 24, fontWeight: "600", marginBottom: 10 }}>Hakkımda</Text>
          <Text style={styles.bioText}>
            Ben {userData.username} merhabalar react native developer'ım Hakkımda kısmına mesaj yazmaktayım
          </Text>
        </View>

        <View style={styles.additionalInfo}>
          <Text style={{ fontSize: 24, fontWeight: "600", marginBottom: 10 }}>Abonelere Özel</Text>
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
          <View></View>
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
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  profileImage: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    borderWidth: 2,
    borderColor: "#FABC3F",
  },
  userInfo: {
    marginLeft: 20,
  },
  nameText: {
    fontSize: 28,
    fontWeight: "600",
    color: "#1E201E",
  },
  usernameText: {
    fontSize: 16,
    color: "grey",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
  },
  statBox: {
    alignItems: "center",
    marginHorizontal: 20,
    width: 90,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1E201E",
  },
  statLabel: {
    fontSize: 14,
    color: "grey",
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
