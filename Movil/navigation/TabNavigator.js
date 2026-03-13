import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import Dashboard from "../screens/DashboardScreen";
import Vacantes from "../screens/VacantesScreen";
import Notificaciones from "../screens/NotificacionesScreen";
import Postulacion from "../screens/PostulacionScreen";

const Tab = createBottomTabNavigator();

export default function TabNavigator(){
  return(
    <Tab.Navigator>
      <Tab.Screen name="Dashboard" component={Dashboard} />
      <Tab.Screen name="Vacantes" component={Vacantes} />
      <Tab.Screen name="Notificaciones" component={Notificaciones} />
      <Tab.Screen name="Postulacion" component={Postulacion} />
    </Tab.Navigator>
  )
}