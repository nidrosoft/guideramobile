import { View, StyleSheet } from 'react-native';

export default function Dialog() {
  return <View style={styles.dialog} />;
}

const styles = StyleSheet.create({
  dialog: { padding: 24, backgroundColor: '#fff', borderRadius: 8 },
});
