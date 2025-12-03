import { TouchableOpacity, StyleSheet } from 'react-native';

export default function EmergencyButton() {
  return <TouchableOpacity style={styles.button} />;
}

const styles = StyleSheet.create({
  button: { padding: 16, backgroundColor: '#ff0000' },
});
