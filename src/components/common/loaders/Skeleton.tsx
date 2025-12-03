import { View, StyleSheet } from 'react-native';

export default function Skeleton() {
  return <View style={styles.skeleton} />;
}

const styles = StyleSheet.create({
  skeleton: { height: 20, backgroundColor: '#e0e0e0', borderRadius: 4 },
});
