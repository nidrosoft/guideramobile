import { View, StyleSheet } from 'react-native';

export default function BaseCard() {
  return <View style={styles.card} />;
}

const styles = StyleSheet.create({
  card: { padding: 16, backgroundColor: '#fff' },
});
