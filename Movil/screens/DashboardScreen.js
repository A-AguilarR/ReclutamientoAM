import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { dashboardStyles as styles } from "../styles/Stylesheet";

export default function DashboardScreen({ navigation }) {
  const handleLogout = () => {
    const parentNavigation = navigation.getParent();

    if (parentNavigation) {
      parentNavigation.reset({
        index: 0,
        routes: [{ name: "Login" }]
      });
      return;
    }

    navigation.navigate("Login");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}
