import { ActivityIndicator, StyleSheet, View } from "react-native";
import { LoginScreen } from "../src/screens/LoginScreen";
import { PwaWorkspaceScreen } from "../src/screens/PwaWorkspaceScreen";
import { useSession } from "../src/lib/session";

export default function IndexScreen() {
  const { isLoading, session } = useSession();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#0f172a" />
      </View>
    );
  }

  return session ? <PwaWorkspaceScreen /> : <LoginScreen />;
}

const styles = StyleSheet.create({
  loading: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    flex: 1,
    justifyContent: "center",
  },
});
