import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import OAut from "@/components/OAuth";
import { icons, images } from "@/constants";
import { Link, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Image, ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useSignIn } from '@clerk/clerk-expo'

const showPassIcon = require('@/assets/images/showpass.png');
const hidePassIcon = require('@/assets/images/showpassopen.png');

const SignIn = () => {
  const { signIn, setActive, isLoaded } = useSignIn()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(true)
  const [form, setform] = useState({
    email: '',
    password: '',
  });

  const onSignInPress = useCallback(async () => {
    if (!isLoaded) {
      return
    }

    try {
      const signInAttempt = await signIn.create({
        identifier: form.email,
        password: form.password,
      })

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId })
        router.replace('/')
      } else {
        // See https://clerk.com/docs/custom-flows/error-handling
        // for more info on error handling
        console.error(JSON.stringify(signInAttempt, null, 2))
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2))
    }
  }, [isLoaded, form.email, form.password])

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Text style={{ justifyContent: 'center', marginTop: 50, fontSize: 30, fontWeight: '600', padding: 30, alignSelf: 'flex-start' }}>Giriş Yap</Text>
      <ScrollView className="flex-1 bg-white">
        <View className="flex-1 bg-white">
          <View className="p-5">
            <InputField
              label="Email"
              placeholder="Enter Your Email"
              placeholderTextColor={'grey'}
              icon={icons.email}
              value={form.email}
              onChangeText={(value) => setform({ ...form, email: value })}
            />
            <View style={{ flexDirection: 'column', position: 'relative' }}>
              <InputField
                label="Şifre"
                placeholder="Şifrenizi giriniz"
                placeholderTextColor={'grey'}
                icon={icons.lock}
                secureTextEntry={showPassword}
                value={form.password}
                onChangeText={(value) => setform({ ...form, password: value })}
                style={{ borderRadius: 25 }}
              />
              {/* Şifre göster/gizle ikonu */}
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 20, // Sağdan biraz boşluk bırakılıyor
                  top: '50%', // Ortalamak için top %50
                  transform: [{ translateY: -6 }], // Görselin dikey olarak ortalanması için
                }}
              >
                <Image
                  source={showPassword ? showPassIcon : hidePassIcon}
                  style={{ width: 50, height: 50, resizeMode: 'cover' }}
                />
              </TouchableOpacity>
            </View>

            <CustomButton
              title="Giriş Yap"
              onPress={onSignInPress}
              className="mt-6"
              style={{width:'50%',alignSelf:'center',backgroundColor:'#FABC3F'}}
            />

            <OAut />

            <Link
              href="/sign-up"
              className="text-lg text-center text-general-200 mt-10"
            >
              <Text>Hesabınız yok mu?{" "}</Text>
              <Text className="text-primary-500">Kaydol</Text>
            </Link>
          </View>

          {/* Verification modal */}
        </View>
      </ScrollView>
    </View>
  );
};

export default SignIn;