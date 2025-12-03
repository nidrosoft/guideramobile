import { SafeAreaView, StyleSheet } from 'react-native';

export default function SafeArea() {
  return <SafeAreaView style={styles.safeArea} />;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
});
