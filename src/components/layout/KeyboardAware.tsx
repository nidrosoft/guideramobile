import { KeyboardAvoidingView, StyleSheet } from 'react-native';

export default function KeyboardAware() {
  return <KeyboardAvoidingView style={styles.container} />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
