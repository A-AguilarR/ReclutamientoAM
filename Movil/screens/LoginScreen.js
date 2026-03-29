import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { loginStyles as styles } from "../styles/Stylesheet";

export default function LoginScreen({ navigation }) {
  return (
    <View style={styles.container}>

      <Text style={styles.title}>Aptior - Módulo Empleados</Text>

      <TextInput
        placeholder="Correo"
        style={styles.input}
      />

      <TextInput
        placeholder="Contraseña"
        secureTextEntry
        style={styles.input}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Main")}
      >
        <Text style={styles.buttonText}>Iniciar sesión</Text>
      </TouchableOpacity>

    </View>
  );
}