import { View, StyleSheet } from 'react-native';

export default function Container() {
  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
