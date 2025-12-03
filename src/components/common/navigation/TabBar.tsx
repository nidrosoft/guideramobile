import { View, StyleSheet } from 'react-native';

export default function TabBar() {
  return <View style={styles.tabBar} />;
}

const styles = StyleSheet.create({
  tabBar: { height: 60, backgroundColor: '#fff' },
});
