import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import colors from "../constants/colors";

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
    marginBottom:20
  },

  input:{
    backgroundColor:colors.white,
    padding:15,
    borderRadius:10,
    marginBottom:15
  },

  textArea:{
    height:100,
    textAlignVertical:"top"
  },

  boton:{
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