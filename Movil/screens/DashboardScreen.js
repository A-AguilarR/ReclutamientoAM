import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center"
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1976D2",
    marginBottom: 20
  },
  button: {
    backgroundColor: "#D32F2F",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold"
  }
});