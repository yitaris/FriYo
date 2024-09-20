import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import React, { useEffect, useState, useMemo, useRef } from "react";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import Colors from "@/styles/Colors";
import { icons, images } from "@/constants";
import { GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useSupabase } from "@/context/SupabaseContext";

const Page = () => {
  const { updateCard, fetchFollowData } = useSupabase();
  const snapPoints = useMemo(() => ['20', '50%', '90%'], [])
  const bottomSheetRef = useRef<BottomSheet>(null);
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const [userName, setUserName] = useState(user?.username ?? "");
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [email, setEmail] = useState(
    user?.emailAddresses[0].emailAddress ?? ""
  );

  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    // Diğer kullanıcı bilgilerini güncelle
    setUserName(user?.username ?? "");
    setFirstName(user?.firstName ?? "");
    setLastName(user?.lastName ?? "");
    setEmail(user?.emailAddresses[0].emailAddress ?? "");
    const fetchFollowCounts = async () => {
      try {
        if (user?.id) {
          const followData = await fetchFollowData(user?.id);

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
  }, [user]);

  const onCaptureImage = async () => {
    // İzinleri kontrol et
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("Permission to access camera roll is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.75,
      base64: true, // Base64 formatında döndürecek
    });

    if (!result.canceled) {
      // Android'de base64 işlenirken sorun yaşamamak için tam URI oluşturuyoruz.
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;

      // Bu noktada base64 verisini doğru şekilde işlemiş olursunuz
      // Bu veriyi kullanarak profil resmini güncelleyebilirsiniz.
      try {
        // Update image in Clerk
        await user?.setProfileImage({
          file: base64Image, // Upload base64 image to Clerk
        });

        // After updating the image, Clerk automatically updates the `user` object.
        // The updated user profile URL should now be available in `user.profileImageUrl`.
        const refreshedUser = await user?.reload();
        const profileUrl = refreshedUser?.externalAccounts[0]?.imageUrl ?? refreshedUser?.imageUrl;

        // Check if the profile URL was successfully retrieved
        if (profileUrl) {
          // Update the avatar_url in Supabase
          const supabaseResponse = await updateCard(profileUrl, user?.id); // Assuming updateCard updates the user's avatar in Supabase

          if (supabaseResponse) {
            console.log("Profile image updated successfully in Supabase");
          }
        } else {
          console.error("Error: Failed to retrieve updated profile image URL from Clerk");
        }
      } catch (error) {
        console.error("Error updating profile image:", error);
      }
    } else {
      console.log("Kullanıcı resmi iptal etti.");
    }
  };

  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  };

  return (
    <GestureHandlerRootView style={{ height: '100%', backgroundColor: 'white' }}>
      <ScrollView style={styles.container}>


        <View style={styles.profileHeader}>
          <View>
            <Text style={styles.statNumber}>{followerCount}</Text>
            <Text style={styles.statLabel}>Takip</Text>
          </View>
          <View>
            <TouchableOpacity onPress={onCaptureImage}>
              <Image
                source={{
                  uri: user?.externalAccounts[0]?.imageUrl ?? user?.imageUrl,
                }}
                style={styles.profileImage}
              />
            </TouchableOpacity>
            <Text style={styles.nameText}>
              {capitalizeFirstLetter(firstName)} {capitalizeFirstLetter(lastName)}
            </Text>
            <Text style={styles.usernameText}>@{userName}</Text>

          </View>
          <View>
            <Text style={styles.statNumber}>{followingCount}</Text>
            <Text style={styles.statLabel}>Takip</Text>
          </View>
        </View>


        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.editProfileButton}>
            <Text style={styles.buttonText}>Profili Düzenle</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bu alan alt sheet kısmıdır */}
      <BottomSheet
        ref={bottomSheetRef}
        index={1}
        snapPoints={snapPoints}
        enablePanDownToClose={false}
        handleIndicatorStyle={{
          backgroundColor: '#FABC3F',
        }}
        backgroundStyle={{
          backgroundColor: '#1E201E',  // Change this color to what you need
          borderTopRightRadius: 50,
          borderTopLeftRadius: 50,
        }}
        handleStyle={{
          backgroundColor: 'transparent',
          height: 50,
        }}
      >
        <BottomSheetView style={{ flex: 1, backgroundColor: '#1E201E' }}>
          <View>

          </View>
        </BottomSheetView>
      </BottomSheet>
    </GestureHandlerRootView >
  );
};

export default Page;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
    paddingHorizontal: 10
  },
  editProfileButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 100,
    width: '48%',
    alignItems: 'center',
  },
  messageButton: {
    backgroundColor: '#FABC3F',
    paddingHorizontal: 30,
    borderRadius: 100,
    paddingVertical: 15,
    width: '48%',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    color: '#1E201E',
    fontWeight: '600',
  },
  additionalInfo: {
    marginTop: 20,
    padding: 12
  },
  bioText: {
    fontSize: 16,
    color: '#1E201E',
  },
});
