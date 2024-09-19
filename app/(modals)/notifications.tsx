import React, { useEffect, useState } from "react";
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { useSupabase } from "@/context/SupabaseContext";
import { ActivityIndicator } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";

const NotificationsPage = () => {
  const { showNotifications, followUser, deleteNotifications,resendNotifications } = useSupabase();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = useUser();
  const ownId = user?.user?.id;

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      const notificationData = await showNotifications(ownId);
      setNotifications(notificationData);
      setLoading(false);
    };
    fetchNotifications();
  }, []);

  const handleAccept = async (followerId, followingId,username,avatar,messages,title) => {
    await followUser(followerId, followingId);
    await deleteNotifications(followerId, followingId);
    await resendNotifications(followerId,followingId,username,avatar,messages,title);
    // Kabul edildikten sonra bildirimi sil
    setNotifications(prevNotifications =>
      prevNotifications.filter(notification => notification.from !== followerId)
    );
  };

  const handleReject = async (followerId, followingId) => {
    await deleteNotifications(followerId, followingId);
    // Reddedilen bildirimi listeden kaldır
    setNotifications(prevNotifications =>
      prevNotifications.filter(notification => notification.from !== followerId)
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FABC3F" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {notifications.map((notification, index) => (
        <View key={index} style={styles.notificationCard}>

                <TouchableOpacity style={{flexDirection:'row'}} onPress={() => {router.push({pathname:'/(modals)\\userProfile',params:{userId:notification.id}})}}>
                 <Image source={{ uri: notification.avatar_url }} style={styles.profileImage} />
                 <View style={styles.notificationInfo}>
                   <Text style={styles.notificationType}>{notification.type}</Text>
                   <View style={{flexDirection:'row'}}>
                   <Text style={[styles.username,{marginRight:5}]}>@{notification.username}</Text>
                   {notification.type=== "Takip isteği kabul edildi" && (
                    <View>
                        <Text style={{color:'white'}}>{notification.message}</Text>
                    </View>
                   )}
                   </View>
                   <Text style={styles.date}>{new Date(notification.date).toLocaleDateString()}</Text>
                 </View>
                 
          {/* Butonları bildirim kartının yanına yerleştirin */}
          {notification.type === "Takip isteği" && (
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => handleAccept(notification.from, ownId,user?.user?.username,user?.user?.imageUrl,"takip isteğinizi kabul etti","Takip isteği kabul edildi")}
              >
                <Text style={styles.buttonText}>Kabul Et</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rejectButton}
                onPress={() => handleReject(notification.from, ownId)}
              >
                <Text style={styles.buttonText}>Reddet</Text>
              </TouchableOpacity>
            </View>
          )}
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
};

export default NotificationsPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationCard: {
    flexDirection: "row", // Yatay hizalama için flexDirection'ı 'row' yapıyoruz
    alignItems: "center",
    paddingVertical:15,
    marginBottom: 15,
    backgroundColor: "transparent",
    borderBottomWidth:0.5,
    borderColor:'#FABC3F',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    borderWidth:2,
    borderColor:'#FABC3F'
  },
  notificationInfo: {
    flex: 1, // İçeriği esnetiyoruz, böylece butonlara yer açılıyor
    backgroundColor:'transparent'
  },
  notificationType: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 5,
    color:'white'
  },
  username: {
    fontSize: 14,
    color: "#FABC3F",
  },
  date: {
    fontSize: 12,
    color: "#fff",
  },
  buttonsContainer: {
    flexDirection: "row", // Butonları yatay hizalamak için
    marginLeft: 10, // Butonlar ile metin arasında boşluk
    alignItems:'center'
  },
  acceptButton: {
    backgroundColor: "#FABC3F",
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  rejectButton: {
    backgroundColor: "#E85C0D",
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
