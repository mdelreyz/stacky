import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

interface AmbientBackdropProps {
  canvasStyle?: StyleProp<ViewStyle>;
}

export function AmbientBackdrop({ canvasStyle }: AmbientBackdropProps) {
  return (
    <View pointerEvents="none" style={[styles.canvas, canvasStyle]}>
      <View style={styles.blueGlow} />
      <View style={styles.cyanGlow} />
      <View style={styles.warmGlow} />
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    position: "absolute",
    top: -28,
    left: -56,
    right: -56,
    height: 760,
  },
  blueGlow: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "rgba(125,177,225,0.16)",
    top: 0,
    left: -18,
  },
  cyanGlow: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: "rgba(128,220,225,0.16)",
    top: 220,
    right: -8,
  },
  warmGlow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: "rgba(255,194,116,0.12)",
    top: 360,
    left: 60,
  },
});
