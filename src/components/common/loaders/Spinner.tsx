import { ActivityIndicator, StyleSheet } from 'react-native';

export default function Spinner() {
  return <ActivityIndicator style={styles.spinner} />;
}

const styles = StyleSheet.create({
  spinner: { padding: 16 },
});
