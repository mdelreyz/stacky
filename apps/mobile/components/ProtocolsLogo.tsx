import { View, StyleSheet } from "react-native";

import { colors } from "@/constants/Colors";

interface ProtocolsLogoProps {
  size?: number;
}

export function ProtocolsLogo({ size = 40 }: ProtocolsLogoProps) {
  const layerHeight = size * 0.22;
  const layerGap = size * 0.08;
  const borderRadius = size * 0.15;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size * 0.25,
        },
      ]}
      accessibilityRole="image"
      accessibilityLabel="Protocols logo"
    >
      <View style={[styles.glow, { width: size * 0.86, height: size * 0.86, borderRadius: size * 0.43 }]} />
      <View style={[styles.ring, { borderRadius: size * 0.25 }]} />
      <View
        style={[
          styles.highlight,
          {
            width: size * 0.44,
            height: size * 0.44,
            borderRadius: size * 0.22,
          },
        ]}
      />
      <View
        style={[
          styles.layer,
          {
            width: size * 0.55,
            height: layerHeight,
            borderRadius,
            backgroundColor: "rgba(255,255,255,0.9)",
            marginBottom: layerGap,
          },
        ]}
      />
      <View
        style={[
          styles.layer,
          {
            width: size * 0.45,
            height: layerHeight,
            borderRadius,
            backgroundColor: "rgba(255,255,255,0.65)",
            marginBottom: layerGap,
          },
        ]}
      />
      <View
        style={[
          styles.layer,
          {
            width: size * 0.35,
            height: layerHeight,
            borderRadius,
            backgroundColor: "rgba(255,255,255,0.4)",
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.38)",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 6,
  },
  glow: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  ring: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  highlight: {
    position: "absolute",
    top: -4,
    right: -2,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  layer: {
    alignSelf: "center",
  },
});
