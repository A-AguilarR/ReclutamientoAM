import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { postulacionStyles as styles } from "../styles/Stylesheet";

export default function PostulacionScreen(){

  return(
    <View style={styles.container}>

      <Text style={styles.titulo}>Postulación</Text>

      <TextInput
        placeholder="Nombre completo"
        style={styles.input}
      />

      <TextInput
        placeholder="Correo electrónico"
        style={styles.input}
      />

      <TextInput
        placeholder="Teléfono"
        style={styles.input}
      />

      <TextInput
        placeholder="Experiencia relevante"
        style={[styles.input, styles.textArea]}
        multiline
      />

      <TouchableOpacity style={styles.boton}>
        <Text style={styles.botonTexto}>Enviar Postulación</Text>
      </TouchableOpacity>

    </View>
  )
}