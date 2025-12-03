import { View, StyleSheet } from 'react-native';

export default function Header() {
  return <View style={styles.header} />;
}

const styles = StyleSheet.create({
  header: { height: 60, backgroundColor: '#fff' },
});
