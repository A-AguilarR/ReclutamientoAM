import { StyleSheet } from "react-native";
import colors from "../constants/colors";

export const loginStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    padding: 25
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.primary,
    textAlign: "center",
    marginBottom: 40
  },
  input: {
    backgroundColor: colors.white,
    padding: 15,
    borderRadius: 10,
    marginBottom: 15
  },
  button: {
    backgroundColor: colors.secondary,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold"
  }
});

export const dashboardStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center"
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 20
  },
  button: {
    backgroundColor: colors.secondary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold"
  }
});

export const vacantesStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 15
  },
  card: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3
  },
  puesto: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primary
  },
  empresa: {
    fontSize: 14,
    color: colors.text
  }
});

export const notificacionesStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 15
  },
  notification: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 10,
    marginBottom: 10
  }
});

export const postulacionStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 20
  },
  input: {
    backgroundColor: colors.white,
    padding: 15,
    borderRadius: 10,
    marginBottom: 15
  },
  textArea: {
    height: 100,
    textAlignVertical: "top"
  },
  boton: {
    backgroundColor: colors.secondary,
    padding: 15,
    borderRadius: 10,
    alignItems: "center"
  },
  botonTexto: {
    color: colors.white,
    fontWeight: "bold"
  }
});

export const vacanteStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 10
  },
  empresa: {
    fontSize: 16,
    marginBottom: 20
  },
  seccion: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10
  },
  texto: {
    fontSize: 14,
    marginTop: 5
  },
  boton: {
    marginTop: 30,
    backgroundColor: colors.secondary,
    padding: 15,
    borderRadius: 10,
    alignItems: "center"
  },
  botonTexto: {
    color: colors.white,
    fontWeight: "bold"
  }
});