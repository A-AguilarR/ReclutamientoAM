import { View, Text, TouchableOpacity } from "react-native";
import { vacanteStyles as styles } from "../styles/Stylesheet";

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
        onPress={() => navigation.navigate("Postulacion")}
      >
        <Text style={styles.botonTexto}>Postularse</Text>
      </TouchableOpacity>

    </View>
  );
}