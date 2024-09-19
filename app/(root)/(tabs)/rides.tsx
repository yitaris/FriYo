import React, { useState, useEffect } from 'react';
import { Text, View, TextInput, FlatList, Image, SafeAreaView, TouchableOpacity } from 'react-native';
import { useSupabase } from '@/context/SupabaseContext'; // Supabase bağlamını içe aktar
import { router } from 'expo-router';

const Rides = () => {
  const { findUsers } = useSupabase();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms sonra arama işlemi tetiklenecek
    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  useEffect(() => {
    const handleSearch = async () => {
      if (debouncedSearchTerm.trim() === '') {
        setSearchResults([]);
        return;
      }
      const results = await findUsers(debouncedSearchTerm);
      setSearchResults(results);
    };

    handleSearch();
  }, [debouncedSearchTerm]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a', padding: 20 }}>
      <View style={{ paddingVertical: 10 }}>
        {/* Arama Inputu */}
        <TextInput
          style={{
            height: 50,
            borderColor: '#555',
            borderWidth: 1,
            backgroundColor: '#2a2a2a',
            color: '#fff',
            borderRadius: 10,
            paddingHorizontal: 15,
            marginBottom: 20,
            fontSize: 16,
          }}
          placeholder="Search for users by username"
          placeholderTextColor="#888"
          value={searchTerm}
          onChangeText={(text) => setSearchTerm(text)}
        />

        {/* Arama Sonuçları */}
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#2a2a2a',
                borderRadius: 10,
                padding: 15,
                marginBottom: 15,
              }}
              onPress={() => router.push({
                pathname: '/(modals)\\userProfile',
                params: {
                    userId: item.id,
                }
            })} // Kullanıcıya tıklanıldığında profil sayfasına yönlendirme
            >
              {/* Profil Resmi */}
              <Image
                source={{ uri: item.avatar_url }}
                style={{ width: 60, height: 60, borderRadius: 30, marginRight: 15 }}
              />
              <View>
                {/* Kullanıcı Bilgileri */}
                <Text style={{ fontWeight: 'bold', color: '#fff', fontSize: 18 }}>{item.username}</Text>
                <Text style={{ color: '#aaa', fontSize: 14 }}>{item.first_name} {item.last_name}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <Text style={{ color: '#888', textAlign: 'center' }}>No results found for "{debouncedSearchTerm}"</Text>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

export default Rides;
