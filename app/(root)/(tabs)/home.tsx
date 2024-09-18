import { useUser } from "@clerk/clerk-expo";
import { useAuth } from "@clerk/clerk-expo";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useState, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useFetch } from "@/lib/fetch";
import { useLocationStore } from "@/store";
import { Ride } from "@/types/type";

const Home = () => {
  const { user } = useUser();
  const { signOut } = useAuth();

  const { setUserLocation, setDestinationLocation } = useLocationStore();

  const handleSignOut = () => {
    signOut();
    router.replace("/(auth)/sign-in");
  };

  const [hasPermission, setHasPermission] = useState<boolean>(false);

  const {
    data: recentRides,
    loading,
    error,
  } = useFetch<Ride[]>(`/(api)/ride/${user?.id}`);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setHasPermission(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});

      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords?.latitude!,
        longitude: location.coords?.longitude!,
      });

      setUserLocation({
        latitude: location.coords?.latitude,
        longitude: location.coords?.longitude,
        address: `${address[0].name}, ${address[0].region}`,
      });
    })();
  }, []);

  return (
    <View style={{ backgroundColor: '#general-500', padding: 25 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginVertical: 20,
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "800", // JakartaExtraBold font-weight alternative
          }}
        >
          Hoşgeldiniz {user?.firstName} 👋
        </Text>
      </View>
    </View>
  );
};

export default Home;
