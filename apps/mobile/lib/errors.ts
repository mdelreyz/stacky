import { Alert, Platform } from "react-native";

export function showError(message: string) {
  if (Platform.OS === "web") {
    window.alert(message);
  } else {
    Alert.alert("Error", message);
  }
}
