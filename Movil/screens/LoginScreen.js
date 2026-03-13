import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import colors from "../constants/colors";

export default function LoginScreen({ navigation }) {
  return (
    <View style={styles.container}>

      <Text style={styles.title}>Sistema de Reclutamiento</Text>

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

const styles = StyleSheet.create({

  container:{
    flex:1,
    backgroundColor: colors.background,
    justifyContent:"center",
    padding:25
  },

  title:{
    fontSize:28,
    fontWeight:"bold",
    color: colors.primary,
    textAlign:"center",
    marginBottom:40
  },

  input:{
    backgroundColor: colors.white,
    padding:15,
    borderRadius:10,
    marginBottom:15
  },

  button:{
    backgroundColor: colors.secondary,
    padding:15,
    borderRadius:10,
    alignItems:"center",
    marginTop:10
  },

  buttonText:{
    color:colors.white,
    fontSize:16,
    fontWeight:"bold"
  }

});