import { icons } from "@/constants";
import { Tabs,useRouter } from "expo-router";
import { Image, View, Animated ,TouchableOpacity,Text} from "react-native";
import React, { useRef } from "react";
import { ImageSourcePropType } from "react-native";

const TabIcon = ({
  source,
  focused,
}: {
  source: ImageSourcePropType;
  focused: boolean;
}) => {
  // Animasyon için scale, opacity ve translateY değerleri
  const scale = useRef(new Animated.Value(focused ? 1.2 : 1)).current;
  const opacity = useRef(new Animated.Value(focused ? 1 : 0.6)).current;
  const translateY = useRef(new Animated.Value(focused ? -15 : 0)).current; // Daha fazla yukarı çıkma
  
  // focused değiştiğinde animasyonu başlat
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: focused ? 1.2 : 1,
        duration: 300, // Yumuşak geçiş için süreyi artır
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: focused ? 1 : 0.6,
        duration: 300, // Aynı şekilde opacity için de süreyi artır
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: focused ? -3 : 0, // Daha fazla yukarı çıkma
        duration: 300, // Yumuşak geçiş
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale }, { translateY }], // translateY animasyonu
          opacity,
        },
        {
          justifyContent: "center",
          alignItems: "center",
        },
      ]}
    >
      <View
        style={{
          borderColor: focused ? "white" : "transparent", // Yalnızca seçilince turuncu
          borderRadius: 10, // Kenar yuvarlama
          borderBottomWidth:7,
          width: 50,
          height: 50,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Image
          source={source}
          tintColor="white"
          resizeMode="contain"
          style={{ width: 24, height: 24 }} // İkon boyutu
        />
      </View>
    </Animated.View>
  );
};

const Layout = () => (
  <Tabs
    initialRouteName="index"
    screenOptions={{
      tabBarActiveTintColor: "white",
      tabBarInactiveTintColor: "white",
      tabBarShowLabel: false,
      tabBarStyle: {
        backgroundColor: "rgba(250, 188, 63, 1)",
        borderRadius: 20,
        paddingBottom: 0,
        overflow: "hidden",
        marginHorizontal: 20,
        marginBottom: 20,
        height: 70,
        justifyContent: "space-between",
        alignItems: "center",
        flexDirection: "row",
        position: "absolute",
      },
    }}
  >
    <Tabs.Screen
    name="imagePage"
    options={{
      title: "Gönderi",
      headerTitleStyle:{color:'white'},
      tabBarStyle: { display: 'none' },
      headerShown: true,
      headerShadowVisible:false,
      headerStyle: {
        backgroundColor:'#1a1a1a'
      },
      headerLeft: () => {
        const router = useRouter();
        return (
          <TouchableOpacity
          onPress={()=>{router.back()}}
          style={{padding:12}}
          >
            <Image
              source={icons.arrowLeft}
              style={{width:50,height:50}}
            />
          </TouchableOpacity>
        );
      },
      tabBarIcon: ({ focused }) => <TabIcon focused={focused} source={icons.profile} />,
    }}
    />
  </Tabs>
);

export default Layout;