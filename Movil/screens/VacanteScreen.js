import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import colors from "../constants/colors";

export default function VacanteScreen({ navigation }) {

  return (
    <View style={styles.container}>

      <Text style={styles.titulo}>Gerente de Calidad</Text>

      <Text style={styles.empresa}>Empresa: Brose</Text>

      <Text style={styles.seccion}>Descripción</Text>
      <Text style={styles.texto}>
        Responsable de garantizar el cumplimiento de estándares de calidad en
        los sistemas mecatrónicos fabricados por la empresa.
      </Text>

      <Text style={styles.seccion}>Requisitos</Text>
      <Text style={styles.texto}>
        - Ingeniería Industrial / Mecánica / Mecatrónica
        {"\n"}- Experiencia en industria automotriz
        {"\n"}- Conocimiento en IATF 16949
      </Text>

      <TouchableOpacity
        style={styles.boton}
        onPress={() => navigation.navigate("Postulación")}
      >
        <Text style={styles.botonTexto}>Postularse</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({

  container:{
    flex:1,
    backgroundColor:colors.background,
    padding:20
  },

  titulo:{
    fontSize:24,
    fontWeight:"bold",
    color:colors.primary,
    marginBottom:10
  },

  empresa:{
    fontSize:16,
    marginBottom:20
  },

  seccion:{
    fontSize:18,
    fontWeight:"bold",
    marginTop:10
  },

  texto:{
    fontSize:14,
    marginTop:5
  },

  boton:{
    marginTop:30,
    backgroundColor:colors.secondary,
    padding:15,
    borderRadius:10,
    alignItems:"center"
  },

  botonTexto:{
    color:colors.white,
    fontWeight:"bold"
  }

});