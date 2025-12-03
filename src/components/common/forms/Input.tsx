import { TextInput, StyleSheet } from 'react-native';

export default function Input() {
  return <TextInput style={styles.input} />;
}

const styles = StyleSheet.create({
  input: { padding: 12, borderWidth: 1, borderColor: '#ddd' },
});
