import { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { vacantesStyles as styles } from "../styles/Stylesheet";

const API_URL = "http://192.168.100.9:8000/api";

export default function VacantesScreen({ navigation, route }) {
  const [vacantes, setVacantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token, id_empleado } = route.params ?? {};

  useFocusEffect(
  useCallback(() => {
    setLoading(true);
        fetch(`${API_URL}/vacantes-elegibles?id_empleado=${id_empleado}`, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        })
        .then((res) => res.json())
        .then((data) => {
            setVacantes(data);
            setLoading(false);
        })
        .catch(() => setLoading(false));
    }, [])
    );

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("Vacante", { vacante: item, token })}
    >
      <Text style={styles.puesto}>{item.titulo}</Text>
      <Text style={styles.empresa}>{item.nombre_area}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>Eres elegible para alguna de las siguientes vacantes.</Text>
      </View>
      <FlatList
        data={vacantes}
        renderItem={renderItem}
        keyExtractor={(item) => item.id_vacante.toString()}
      />
    </View>
  );
}