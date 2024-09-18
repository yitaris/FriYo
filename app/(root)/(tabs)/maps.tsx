import * as Location from "expo-location";
import { router } from "expo-router";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import GoogleTextInput from "@/components/GoogleTextInput";
import Map from "@/components/Map";
import { icons, images } from "@/constants";
import { useLocationStore } from "@/store";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

const Home = () => {

  const { setUserLocation, setDestinationLocation } = useLocationStore();
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const { width, height } = Dimensions.get('window');
  //s snapPoints
  const snapPoints = useMemo(() => ['25%', '50%', '70%'], [])

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

  const handleDestinationPress = (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => {
    setDestinationLocation(location);

    router.push("/(root)/(tabs)/rides");
  };

  return (
    <GestureHandlerRootView style={{ height: '110%' }}>
      <View style={{ flex: 1, position: 'absolute', zIndex: 99, width: '90%',flexDirection:'column',alignSelf:'center',justifyContent:'space-between' }}>
        <View style={{ position: 'absolute', zIndex: 99, width: '80%', alignItems: 'center', top: 50 }}>
          <GoogleTextInput
            icon={icons.search}
            containerStyle="bg-white shadow-md shadow-neutral-300"
            handlePress={handleDestinationPress}
          />
        </View>
        <View style={{top:50,alignSelf:'flex-end',justifyContent:'center',alignItems:'center'}}>
          <TouchableOpacity
            style={{
              padding: 10,
              backgroundColor: 'white',
              borderRadius: 10, // Buton arka plan rengini ayarlayın
              width:50,
            }}
            onPress={() => { router.push('/(root)/(tabs)/home') }}
          >
            <Image
              source={icons.arrowRight}
              style={{ width: 30, height: 30 ,resizeMode:'cover'}}
            />
          </TouchableOpacity>
        </View>
      </View>
      {/*Map Kısmı */}
      <Map />
      <BottomSheet
        ref={bottomSheetRef}
        index={1}
        snapPoints={snapPoints}
        enablePanDownToClose={false}
        handleIndicatorStyle={{
          backgroundColor: '#FABC3F',
        }}
        handleStyle={{
          backgroundColor: '#1E201E',
          borderTopLeftRadius: 15,
          borderTopRightRadius: 15,
          height: 30,
          justifyContent: 'center'
        }}
      >
        <BottomSheetView style={{ flex: 1, padding: 24, backgroundColor: '#1E201E' }}>
          <Text style={{ color: 'white' }}>Awesome 🎉</Text>

        </BottomSheetView>
      </BottomSheet>
    </GestureHandlerRootView>
  );
};

export default Home;