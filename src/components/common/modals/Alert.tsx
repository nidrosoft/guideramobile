import { View, StyleSheet } from 'react-native';

export default function Alert() {
  return <View style={styles.alert} />;
}

const styles = StyleSheet.create({
  alert: { padding: 16, backgroundColor: '#fff' },
});
