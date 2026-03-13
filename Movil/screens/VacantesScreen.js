import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import colors from "../constants/colors";

const vacantes = [
  { id:1, puesto:"Gerente de Calidad", empresa:"Brose" },
  { id:2, puesto:"Ingeniero de Producción", empresa:"Brose" },
];

export default function VacantesScreen({ navigation }){

    const renderItem = ({item}) => (
    <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("Vacante")}
    >
        <Text style={styles.puesto}>{item.puesto}</Text>
        <Text style={styles.empresa}>{item.empresa}</Text>
    </TouchableOpacity>
    );

    return(
        <View style={styles.container}>
            <FlatList
                data={vacantes}
                renderItem={renderItem}
                keyExtractor={(item)=>item.id.toString()}
        />
        </View>
    )
}

const styles = StyleSheet.create({

  container:{
    flex:1,
    backgroundColor:colors.background,
    padding:15
  },

  card:{
    backgroundColor:colors.white,
    padding:20,
    borderRadius:10,
    marginBottom:15,
    elevation:3
  },

  puesto:{
    fontSize:18,
    fontWeight:"bold",
    color:colors.primary
  },

  empresa:{
    fontSize:14,
    color:colors.text
  }

});