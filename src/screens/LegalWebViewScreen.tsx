import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { COLORS } from '../theme/colors';

type RouteParams = { url: string; title?: string };

export const LegalWebViewScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { url, title } = route.params as RouteParams;
  const webRef = useRef<WebView>(null);

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolbarBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.toolbarTitle} numberOfLines={1}>
          {title || 'Legal'}
        </Text>
        <View style={styles.toolbarRight} />
      </View>
      <WebView
        ref={webRef}
        source={{ uri: url }}
        startInLoadingState
        style={styles.web}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 8,
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
  },
  toolbarBtn: {
    padding: 8,
  },
  toolbarTitle: {
    flex: 1,
    color: COLORS.white,
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 16,
  },
  toolbarRight: { width: 30 },
  web: { flex: 1, backgroundColor: '#fff' },
});

export default LegalWebViewScreen;

