import React from "react";
import { StyleSheet, View } from "react-native";
import { Tabs } from "expo-router";

import { colors } from "@/constants/Colors";
import { OfflineBanner } from "@/components/OfflineBanner";

export default function TabLayout() {
  return (
    <View style={styles.container}>
      <OfflineBanner />
      <Tabs
        screenOptions={{
          tabBarPosition: "top",
          tabBarActiveTintColor: colors.primaryDarker,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarActiveBackgroundColor: "rgba(255,255,255,0.72)",
          tabBarInactiveBackgroundColor: "transparent",
          tabBarStyle: styles.tabBar,
          tabBarItemStyle: styles.tabItem,
          tabBarLabelStyle: styles.tabLabel,
          headerShown: false,
          sceneStyle: styles.scene,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Today",
          }}
        />
        <Tabs.Screen
          name="protocols"
          options={{
            title: "Protocols",
          }}
        />
        <Tabs.Screen
          name="exercise"
          options={{
            title: "Exercise",
          }}
        />
        <Tabs.Screen
          name="nutrition"
          options={{
            title: "Nutrition",
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  scene: {
    backgroundColor: colors.backgroundSecondary,
  },
  tabBar: {
    backgroundColor: "rgba(246,249,252,0.9)",
    borderBottomWidth: 1,
    borderTopWidth: 0,
    borderBottomColor: "rgba(255,255,255,0.94)",
    marginHorizontal: 12,
    marginTop: 12,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 8,
    height: 70,
    borderRadius: 22,
    elevation: 0,
    shadowColor: colors.primaryDarker,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.94)",
  },
  tabItem: {
    borderRadius: 16,
    marginHorizontal: 4,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "none",
  },
});
