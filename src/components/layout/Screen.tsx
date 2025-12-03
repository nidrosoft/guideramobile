import { View, StyleSheet } from 'react-native';

export default function Screen() {
  return <View style={styles.screen} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
});
