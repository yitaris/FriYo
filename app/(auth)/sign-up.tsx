import { useState } from "react";
import OAut from "@/components/OAuth";
import { Link, router } from "expo-router";
import { icons, images } from "@/constants";
import { useSignUp } from "@clerk/clerk-expo";
import InputField from "@/components/InputField";
import ReactNativeModal from "react-native-modal";
import CustomButton from "@/components/CustomButton";
import { Alert, Image, ScrollView, Text, View, TouchableOpacity } from "react-native";
import { fetchAPI } from "@/lib/fetch";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[A-Z])(?=.*\W).{6,}$/;
const usernameRegex = /^.{3,16}$/;
const nameRegex = /^[a-zA-Z0-9]{3,16}$/;  // Sadece harf ve sayı kabul eden regex
const showPassIcon = require('@/assets/images/showpass.png');
const hidePassIcon = require('@/assets/images/showpassopen.png');


const SignUp = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [showSuccessModal, setshowSuccessModal] = useState(false);
  const [showPassword, setShowPassword] = useState(true)
  const [showRePassword, setShowRePassword] = useState(true)
  const [form, setform] = useState({
    firstName: '',
    lastName: '',
    name: '',
    email: '',
    password: '',
    repassword: '',  // Tekrar şifre kontrolü için
  });

  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    name: '',
    email: '',
    password: '',
    repassword: '',
  });

  const [verification, setVerification] = useState({
    state: "default",
    error: "",
    code: ""
  });

  const validateForm = () => {
    let isValid = true;
    let newErrors = {
      firstName: '',
      lastName: '',
      name: '',
      email: '',
      password: '',
      repassword: ''
    };

    if (!nameRegex.test(form.firstName)) {
      newErrors.firstName = "Adınız en az 3, en fazla 16 karakter olmalı, sadece harf ve rakam içermelidir.";
      isValid = false;
    }
    if (!nameRegex.test(form.lastName)) {
      newErrors.lastName = "Soyadınız en az 3, en fazla 16 karakter olmalı, sadece harf ve rakam içermelidir.";
      isValid = false;
    }

    if (!usernameRegex.test(form.name)) {
      newErrors.name = "Kullanıcı adı en az 3, en fazla 16 karakter olmalıdır.";
      isValid = false;
    }
    if (!emailRegex.test(form.email)) {
      newErrors.email = "Lütfen geçerli bir e-posta adresi girin.";
      isValid = false;
    }
    if (!passwordRegex.test(form.password)) {
      newErrors.password = "Şifre en az 6 karakter olmalı, bir büyük harf ve bir özel karakter içermelidir.";
      isValid = false;
    }
    if (form.password !== form.repassword) {
      newErrors.repassword = "Şifreler uyuşmuyor.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const onSignUpPress = async () => {
    if (!isLoaded) return;
      const errorTranslations: { [key: string]: string } = {
      "That username is taken. Please try another.": "Bu Kullanıcı Adı Daha Önceden Alınmış. Lütfen Başka Kullanıcı Adı Seçiniz.",
      "That email address is taken. Please try another.": "Bu Email Adresi Daha Önceden Alınmış. Lütfen Başka Email Giriniz.",
      "Password is too short": "Şifre çok kısa.",
      // Diğer hata mesajlarını buraya ekleyebilirsiniz
    };

    if (!validateForm()) {
      return;
    }

    try {
      await signUp.create({
        emailAddress: form.email,
        password: form.password,
        username: form.name, // Kullanıcı adı ekleniyor
        firstName: form.firstName, // Ad
        lastName: form.lastName, 
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      setVerification({
        ...verification,
        state: "pending",
      });
    } catch (err: any) {
      let errorMessage = err.errors[0].longMessage;
    
      // Eğer hata mesajı için bir Türkçe çeviri varsa onu kullan
      if (errorTranslations[errorMessage]) {
        errorMessage = errorTranslations[errorMessage];
      }
    
      Alert.alert("Hata", errorMessage);
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded) return;

    try {
      const completeSignUp = await signUp
        .attemptEmailAddressVerification({
          code: verification.code,
        });

      if (completeSignUp.status === 'complete') {
        await fetchAPI('/(api)/user', {
          method: "POST",
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            clerkId: completeSignUp.createdUserId,
          }),
        });

        await setActive({ session: completeSignUp.createdSessionId });
        setVerification({ ...verification, state: "success" });
      } else {
        setVerification({ ...verification, error: "Verification Failed", state: "failed" });
      }
    } catch (err: any) {
      setVerification({ ...verification, error: err.errors[0].longMessage, state: "failed" });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <Text style={{ justifyContent: 'center', marginTop: 50, fontSize: 30, fontWeight: '600', padding: 30, alignSelf: 'flex-start' }}>Kaydol</Text>
      <ScrollView
        style={{ flex: 1, paddingHorizontal:10 }}
        contentContainerStyle={{ height:'160%' }} // İçeriğin tam olarak kaydırılabilir olmasını sağlar
      >
        <View className="flex-1 bg-white">
          <View className="p-5">
          <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between'}}>
            <TouchableOpacity style={{ flex: 1, marginRight: 10 }}>
              <InputField
                label="Adınız"
                placeholder="Adınız"
                placeholderTextColor={'grey'}
                cursorColor={'#FABC3F'}
                value={form.firstName}
                onChangeText={(value) => setform({ ...form, firstName: value })}
              />
              {errors.firstName ? <Text style={{ color: 'red' }}>{errors.firstName}</Text> : null}
            </TouchableOpacity>
            
            <TouchableOpacity style={{ flex: 1, marginLeft: 10 }}>
              <InputField
                label="Soy Adınız"
                placeholder="Soy Adınız"
                placeholderTextColor={'grey'}
                cursorColor={'#FABC3F'}
                value={form.lastName}
                onChangeText={(value) => setform({ ...form, lastName: value })}
              />
              {errors.firstName ? <Text style={{ color: 'red' }}>{errors.firstName}</Text> : null}
            </TouchableOpacity>
          </View>

            <InputField
              label="Kullanıcı Adı"
              placeholder="Kullanıcı adı"
              placeholderTextColor={'grey'}
              cursorColor={'#FABC3F'}
              icon={icons.person}
              value={form.name}
              onChangeText={(value) => setform({ ...form, name: value })}
              style={{}}
            />
            {errors.name ? <Text style={{ color: 'red' }}>{errors.name}</Text> : null}

            <InputField
              label="Email"
              placeholder="E-postanızı giriniz"
              placeholderTextColor={'grey'}
              icon={icons.email}
              value={form.email}
              onChangeText={(value) => setform({ ...form, email: value })}
              style={{ borderRadius: 25 }}
            />
            {errors.email ? <Text style={{ color: 'red' }}>{errors.email}</Text> : null}

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
            {errors.password ? <Text style={{ color: 'red' }}>{errors.password}</Text> : null}

            <View style={{ flexDirection: 'column', position: 'relative' }}>
              <InputField
                label="Tekrar Şifre"
                placeholder="Şifreyi tekrar giriniz"
                placeholderTextColor={'grey'}
                icon={icons.lock}
                secureTextEntry={showRePassword}
                value={form.repassword}
                onChangeText={(value) => setform({ ...form, repassword: value })}
                style={{ borderRadius: 25 }}
              />
              <TouchableOpacity
                onPress={() => setShowRePassword(!showRePassword)}
                style={{
                  position: 'absolute',
                  right: 20, // Sağdan biraz boşluk bırakılıyor
                  top: '50%', // Ortalamak için top %50
                  transform: [{ translateY: -6 }], // Görselin dikey olarak ortalanması için
                }}
              >
                <Image
                  source={showRePassword ? showPassIcon : hidePassIcon}
                  style={{ width: 50, height: 50, resizeMode: 'cover' }}
                />
              </TouchableOpacity>
            </View>
            {errors.repassword ? <Text style={{ color: 'red' }}>{errors.repassword}</Text> : null}
            <CustomButton
              title="Kaydol"
              onPress={onSignUpPress}
              className="mt-6"
              style={{ backgroundColor: '#FABC3F', width: '50%', alignSelf: 'center' }}
            />

            <OAut />

            <Link
              href="/sign-in"
              className="text-lg text-center text-general-200 mt-6"
            >
              <Text>Zaten hesabınız var mı?{" "}</Text>
              <Text className="text-primary-500">Giriş Yap</Text>
            </Link>
          </View>

          <ReactNativeModal
            isVisible={verification.state === "pending"}
            onModalHide={() => {
              if (verification.state === "success") setshowSuccessModal(true);
            }}
          >
            <View className="bg-white px-7 py-9 rounded-2xl min-h-[300px]" style={{marginBottom:150}}>
              <Text className="text-2xl font-JakartaExtraBold mb-2">
                Doğrulama
              </Text>
              <Text className="font-Jakarta mb-5">
                Hesabınıza Doğrulama kodu gönderdik {form.email}
              </Text>

              <InputField
                label="Kod"
                icon={icons.lock}
                placeholder="123456"
                value={verification.code}
                keyboardType="numeric"
                onChangeText={(code) => setVerification({ ...verification, code })}
                style={{ borderRadius: 25 }}
              />

              {verification.error && (
                <Text className="text-red-500 text-sm mt-1">
                  {verification.error}
                </Text>
              )}

              <CustomButton
                title="Kodu Doğrula"
                onPress={onPressVerify}
                className="mt-5 bg-success-500"
                style={{ backgroundColor: '#FABC3F' }}
              />
            </View>
          </ReactNativeModal>
          <ReactNativeModal isVisible={showSuccessModal}>
            <View className="bg-white px-7 py-9 rounded-2xl min-h-[300px]">
              <Image
                source={images.check}
                className="w-[110px] h-[110px] mx-auto my-5"
              />
              <Text className="text-3xl font-JakartaBold text-center">
                Onaylandı
              </Text>
              <Text className="text-base text-gray-400 font-Jakarta text-center mt-2">
                Hesabınız başarıyla oluşturuldu.
              </Text>

              <CustomButton
                title="Anasayfa"
                onPress={() => {
                  setshowSuccessModal(false);
                  router.push("/(root)/(tabs)/home");
                }}
                className="mt-5"
                style={{ backgroundColor: '#FABC3F',width:'60%',alignSelf:'center' }}
              />
            </View>
          </ReactNativeModal>
        </View>
      </ScrollView>
    </View>
  );
};

export default SignUp;
