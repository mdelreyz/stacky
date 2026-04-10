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
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  layer: {
    alignSelf: "center",
  },
});
