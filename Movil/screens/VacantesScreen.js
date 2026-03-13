import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { vacantesStyles as styles } from "../styles/Stylesheet";

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

