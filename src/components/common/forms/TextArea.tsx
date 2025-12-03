import { TextInput, StyleSheet } from 'react-native';

export default function TextArea() {
  return <TextInput style={styles.textarea} multiline />;
}

const styles = StyleSheet.create({
  textarea: { padding: 12, borderWidth: 1, borderColor: '#ddd', minHeight: 100 },
});
