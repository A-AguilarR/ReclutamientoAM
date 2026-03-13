import { View, Text, StyleSheet } from "react-native";
import colors from "../constants/colors";

export default function NotificacionesScreen(){

  return(
    <View style={styles.container}>

      <View style={styles.notification}>
        <Text>Nueva vacante disponible</Text>
      </View>

      <View style={styles.notification}>
        <Text>Tu postulación fue recibida</Text>
      </View>

    </View>
  )
}

const styles = StyleSheet.create({

  container:{
    flex:1,
    backgroundColor:colors.background,
    padding:15
  },

  notification:{
    backgroundColor:colors.white,
    padding:20,
    borderRadius:10,
    marginBottom:10
  }

});