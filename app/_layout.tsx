import 'react-native-reanimated';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { LogBox,StatusBar } from 'react-native';
import { tokenCache } from '@/lib/auth';
import * as SplashScreen from 'expo-splash-screen';
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo'
import { SupabaseProvider } from '@/context/SupabaseContext'; // Adjust the path as needed
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

SplashScreen.preventAutoHideAsync();

LogBox.ignoreLogs(["Clerk:"]);

export default function RootLayout() {
  const [loaded] = useFonts({
    "Jakarta-Bold": require("../assets/fonts/PlusJakartaSans-Bold.ttf"),
    "Jakarta-ExtraBold": require("../assets/fonts/PlusJakartaSans-ExtraBold.ttf"),
    "Jakarta-ExtraLight": require("../assets/fonts/PlusJakartaSans-ExtraLight.ttf"),
    "Jakarta-Light": require("../assets/fonts/PlusJakartaSans-Light.ttf"),
    "Jakarta-Medium": require("../assets/fonts/PlusJakartaSans-Medium.ttf"),
    "Jakarta-Regular": require("../assets/fonts/PlusJakartaSans-Regular.ttf"),
    "Jakarta-SemiBold": require("../assets/fonts/PlusJakartaSans-SemiBold.ttf"),
});

if (!publishableKey) {
  throw new Error(
    'Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env',
  );
}

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <SupabaseProvider>
      <StatusBar
        barStyle="dark-content" // Saat ve ikonların rengi (siyah)
        backgroundColor="#000" // Status bar arka planı (siyah)
      />
      <ClerkLoaded>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(root)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
        <Stack.Screen
        name="(modals)/mapsModal"
        options={{
          presentation: "modal",
          title: "Giriş Yap",}}
      />
      </Stack>
        </ClerkLoaded>
        </SupabaseProvider>
      </ClerkProvider>
      );
}
