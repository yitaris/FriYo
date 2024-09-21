import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { useUser } from '@clerk/clerk-expo';
import { useSupabase } from '@/context/SupabaseContext';

const list = () => {
  const { user } = useUser();
  const { addPosts, getUserImages } = useSupabase();
  const [loading, setLoading] = useState(false); // Yükleme durumu için state
  const [images, setImages] = useState([]); // Yüklenen resim URL'lerini tutmak için state

  const onSelectImage = async () => {
    setLoading(true); // Yüklemeye başlarken loading state true
    try {
      const options = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
      };

      const result = await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled) {
        const img = result.assets[0];
        const base64 = await FileSystem.readAsStringAsync(img.uri, { encoding: 'base64' });
        const filePath = `${user?.id}/${new Date().getTime()}.${img.type === 'image' ? 'png' : 'mp4'}`;
        const contentType = img.type === 'image' ? 'image/png' : 'video/mp4';
        
        await addPosts(filePath, base64, contentType);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setLoading(false); // İşlem tamamlandığında loading state false
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Yüklenen resimleri göster */}
        {images.map((imageUrl, index) => (
          <Image
            key={index}
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ))}
      </ScrollView>

      {/* Yükleniyor simgesi */}
      {loading && <ActivityIndicator size="large" color="#2b825b" style={styles.loading} />}

      {/* FAB to add images */}
      <TouchableOpacity onPress={onSelectImage} style={styles.fab} disabled={loading}>
        <Ionicons name="camera-outline" size={30} color={'#fff'} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#151515',
  },
  fab: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 70,
    position: 'absolute',
    backgroundColor: '#2b825b',
    borderRadius: 100,
  },
  loading: {
    position: 'absolute',
    top: '50%',
    left: '50%',
  },
  image: {
    width: '100%',
    height: 200,
    marginBottom: 10,
  },
});

export default list;
