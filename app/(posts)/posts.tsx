import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity, Image, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSupabase } from "@/context/SupabaseContext";
import { icons } from "@/constants";
import { useAuth, useUser } from "@clerk/clerk-expo";

const page = () => {
  const { userData,index,id } = useLocalSearchParams();
  const user = JSON.parse(userData);
  const [loading, setLoading] = useState(false);
  const { getUserImages } = useSupabase();
  const [image, setImage] = useState([]);

  // Bileşen yüklendiğinde resimleri çek
  useEffect(() => {
    if (id) {
      fetchUserImages();
    }
  }, [id]); // id değiştiğinde veya tanımlandığında resimleri çek
  

  const fetchUserImages = async () => {
    setLoading(true);
    try {
      console.log({id})
      const imageUrls = await getUserImages(id); // Kullanıcı resimlerini al
      setImage(imageUrls); // Resimleri state'e kaydet
    } catch (error) {
      console.error("Error fetching images:", error);
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

  return (
    <View style={{ flex: 1, backgroundColor: "#1a1a1a" }}>
      <ScrollView style={{ width: "100%" }}>
        {/* Yüklenen resimleri göster */}
        {!loading && image.length > 0 && (
          <View style={{ 
            flexDirection: 'column', // Resimleri sütun olarak hizala
            justifyContent: 'flex-start', // Resimleri üstte hizala
            alignItems: 'center', // Ortala
          }}>
            {image.map((imageUrl, index) => (
              <View key={index} style={{ 
                width: '100%', // Ekranın %100'ünü kaplar
                marginBottom: 10, // Altına boşluk bırakır
                alignItems: 'center', // Ortala
              }}>
                <TouchableOpacity>
                  <Image
                    source={{ uri: imageUrl }}
                    style={{
                      width: '100%', // Görsel genişliği
                      height: 300, // Her resmin yüksekliği
                      borderRadius: 10,
                    }}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={{
                opacity: 0.5,
                borderWidth: 0.5,
                borderColor: "#FABC3F",
                width: "90%",
                height: 300,
                borderRadius: 10,
                marginBottom: 10,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                source={icons.plusIcon}
                style={{ width: 50, height: 50, opacity: 0.5 }}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Eğer resim yoksa mesaj göster */}
        {!loading && image.length === 0 && (
          <View style={{ alignItems: "center", width: "100%" }}>
            <TouchableOpacity
              style={{
                opacity: 0.5,
                borderWidth: 0.5,
                borderColor: "#FABC3F",
                width: "90%",
                height: 300,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                source={icons.plusIcon}
                style={{ width: 50, height: 50, opacity: 0.5 }}
              />
            </TouchableOpacity>
            <Text style={{ textAlign: "center", color: "white", marginTop: 20 }}>
              Henüz resim yüklenmedi.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default page;
