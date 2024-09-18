import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Button,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { defaultStyles } from "@/styles/Styles";
import Colors from "@/styles/Colors";
import { icons, images } from "@/constants";

const Page = () => {
  const { signOut, isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [userName, setUserName] = useState(user?.username ?? "");
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [email, setEmail] = useState(
    user?.emailAddresses[0].emailAddress ?? ""
  );
  const [edit, setEdit] = useState(false);

  useEffect(() => {
    // Diğer kullanıcı bilgilerini güncelle
    setUserName(user?.username ?? "");
    setFirstName(user?.firstName ?? "");
    setLastName(user?.lastName ?? "");
    setEmail(user?.emailAddresses[0].emailAddress ?? "");
  }, [user]);

  const onSaveUser = async () => {
    try {
      await user?.update({
        firstName,
        lastName,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setEdit(false);
    }
  };

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
      await user?.setProfileImage({
        file: base64Image, // base64 formatında resmi yükle
      });
    } else {
      console.log("Kullanıcı resmi iptal etti.");
    }
  };

  return (
    <SafeAreaView style={defaultStyles.container}>
      <View style={styles.headerContainer}>
      <TouchableOpacity
        onPress={() =>{signOut().then(()=> {router.push("/(auth)/sign-in")});
      }}
          style={{
            justifyContent: "center",
            alignItems: 'center',
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: "#fff",
            // Shadow styling for iOS
            shadowColor: "#000",
            shadowOffset: { width: 4, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
            // Shadow styling for Android
            elevation: 10,
          }}
      >
        <Image source={icons.arrowLeft} style={{ width: 50, height: 50 }} />
      </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default Page;

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#fff",
    alignItems: "center",
    width:'90%',
    alignSelf:'center',
    gap: 14,
    padding: 10,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: {
      width: 1,
      height: 2,
    },
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 16,
    backgroundColor: Colors.grey,
  },
  editRow: {
    flex: 1,
    flexDirection: "row-reverse",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    height: 60,
  },
});
