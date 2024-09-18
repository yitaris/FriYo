import { router } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Swiper from "react-native-swiper";
import { useRef, useState } from "react";
import { onboarding } from "@/constants";
import CustomButton from "@/components/CustomButton";
import { Dimensions } from "react-native";


const Onboarding = () => {
    const { width } = Dimensions.get('window');
    const swiperRef = useRef<Swiper>(null);
    const [activeIndex, setactiveIndex] = useState(0);
    const isLastSlide = activeIndex === onboarding.length - 1;
    return (
        <SafeAreaView className="flex h-full items-center justify-between bg-white">
            <TouchableOpacity
                onPress={() => {
                    router.replace("/(auth)/sign-up");
                }}
                className="w-full flex justify-end items-end p-5"
            >
                <Text className="text-black text-md font-JakartaBold">Skip</Text>
            </TouchableOpacity>
            <Swiper
                ref={swiperRef}
                loop={false}
                dot={<View className="w-[32px] h-[4px] mx-1 bg-[#FABC3F] rounded-full" />}
                activeDot={<View className="w-[32px] h-[4px] mx-1 bg-[#E85C0D] rounded-full" />}
                onIndexChanged={(index) => setactiveIndex(index)}
            >
                {onboarding.map((item) => (
                    <View key={item.id} className="flex items-center justify-center p-5">
                        <Image
                            source={item.image}
                            className="w-full h-[300px]"
                            resizeMode="contain"
                        />
                        <View className="flex flex-row items-center justify-center w-full mt-10">
                            <Text className="text-black text-3xl font-bold mx-10 text-center">{item.title}</Text>
                        </View>
                        <Text className="text-lg fonr-JakartaSemiBold text-center text-[#858585] mx-10 mt-3">{item.description}</Text>
                    </View>
                ))}
            </Swiper>

            <CustomButton
                title={isLastSlide ? "Başlayalım" : "İlerle"}
                onPress={() => isLastSlide
                    ? router.replace('/(auth)/sign-up')
                    : swiperRef.current?.scrollBy(1)}
                className="w-11/12 mt-10"
                style={{ backgroundColor: '#FABC3F' ,width:width/2}} // Rengi burada belirliyoruz
            />
        </SafeAreaView>
    );
};

export default Onboarding;