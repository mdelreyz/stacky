import { useEffect, useState, type ReactNode } from "react";
import {
  Animated,
  Easing,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export function FadeInView({
  children,
  style,
  duration = 280,
  offset = 18,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  duration?: number;
  offset?: number;
}) {
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [duration, progress]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [offset, 0],
  });

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [{ translateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
