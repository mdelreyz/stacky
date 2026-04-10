import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Redirect, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/components/useColorScheme";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { NetworkProvider } from "@/contexts/NetworkContext";

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

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <NetworkProvider>
        <RootLayoutNav />
      </NetworkProvider>
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    // Keep splash screen visible while checking stored token
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        {!isAuthenticated ? (
          <>
            <Stack.Screen
              name="auth/login"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="auth/signup"
              options={{ headerShown: false }}
            />
          </>
        ) : (
          <>
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
              name="supplement/refill-request"
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
              name="profile/location"
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
            <Stack.Screen
              name="peptide/[id]"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="peptide/[id]/schedule"
              options={{ headerShown: false, presentation: "modal" }}
            />
            <Stack.Screen
              name="user-peptide/[id]"
              options={{ headerShown: false, presentation: "modal" }}
            />
            <Stack.Screen
              name="profile/edit"
              options={{ headerShown: false, presentation: "modal" }}
            />
            <Stack.Screen
              name="profile/preferences"
              options={{ headerShown: false, presentation: "modal" }}
            />
            <Stack.Screen
              name="profile/safety"
              options={{ headerShown: false, presentation: "modal" }}
            />
            <Stack.Screen
              name="recommendations"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="wizard"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="tracking"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="exercise/[id]"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="exercise/create"
              options={{ headerShown: false, presentation: "modal" }}
            />
            <Stack.Screen
              name="exercise/stats"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="workout-routine/create"
              options={{ headerShown: false, presentation: "modal" }}
            />
            <Stack.Screen
              name="workout-routine/[id]"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="exercise-regime/create"
              options={{ headerShown: false, presentation: "modal" }}
            />
            <Stack.Screen
              name="exercise-regime/[id]"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="workout-session/start"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="workout-session/[id]"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="gym-location/manage"
              options={{ headerShown: false, presentation: "modal" }}
            />
          </>
        )}
      </Stack>
    </ThemeProvider>
  );
}
