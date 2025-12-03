import { View, StyleSheet } from 'react-native';

export default function Select() {
  return <View style={styles.select} />;
}

const styles = StyleSheet.create({
  select: { padding: 12, borderWidth: 1, borderColor: '#ddd' },
});
