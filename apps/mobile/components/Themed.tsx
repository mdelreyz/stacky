import { Text as DefaultText, View as DefaultView } from "react-native";

import { colors } from "@/constants/Colors";

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type TextProps = ThemeProps & DefaultText["props"];
export type ViewProps = ThemeProps & DefaultView["props"];

export function Text(props: TextProps) {
  const { style, lightColor, ...otherProps } = props;
  return <DefaultText style={[{ color: lightColor ?? colors.textPrimary }, style]} {...otherProps} />;
}

export function View(props: ViewProps) {
  const { style, lightColor, ...otherProps } = props;
  return <DefaultView style={[{ backgroundColor: lightColor ?? colors.background }, style]} {...otherProps} />;
}
