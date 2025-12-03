import { TouchableOpacity, StyleSheet } from 'react-native';

export default function IconButton() {
  return <TouchableOpacity style={styles.button} />;
}

const styles = StyleSheet.create({
  button: { padding: 8 },
});
