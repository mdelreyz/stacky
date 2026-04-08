import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/components/useColorScheme";
import { AuthProvider } from "@/contexts/AuthContext";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "auth/login",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen
          name="auth/login"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="auth/signup"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="supplement/add"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen
          name="supplement/[id]"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="supplement/[id]/schedule"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen
          name="medication/add"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen
          name="medication/[id]"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="medication/[id]/schedule"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen
          name="nutrition/add"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen
          name="nutrition/[id]"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen
          name="therapy/[id]"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="therapy/[id]/schedule"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen
          name="user-supplement/[id]"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen
          name="user-medication/[id]"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen
          name="user-therapy/[id]"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen
          name="protocol/add"
          options={{ headerShown: false, presentation: "modal" }}
        />
        <Stack.Screen
          name="protocol/[id]"
          options={{ headerShown: false, presentation: "modal" }}
        />
      </Stack>
    </ThemeProvider>
  );
}
