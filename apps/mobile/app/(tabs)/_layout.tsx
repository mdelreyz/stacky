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
          tabBarActiveBackgroundColor: colors.white,
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
    backgroundColor: colors.infoLighter,
    borderBottomWidth: 1,
    borderTopWidth: 0,
    borderBottomColor: colors.borderLight,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    height: 72,
    elevation: 0,
    shadowColor: colors.primaryDarker,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
  },
  tabItem: {
    borderRadius: 14,
    marginHorizontal: 4,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "none",
  },
});
