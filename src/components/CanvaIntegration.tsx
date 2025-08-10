import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { canvaService } from '../services/canvaService';

interface CanvaDesign {
  id: string;
  title: string;
  thumbnail?: {
    url: string;
  };
  urls?: {
    edit_url: string;
    view_url: string;
  };
}

interface CanvaTemplate {
  id: string;
  title: string;
  description?: string;
  thumbnail?: {
    url: string;
  };
  tags?: string[];
}

export const CanvaIntegration: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [designs, setDesigns] = useState<CanvaDesign[]>([]);
  const [templates, setTemplates] = useState<CanvaTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'designs' | 'templates'>('templates');

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    setIsAuthenticated(canvaService.isAuthenticated());
  };

  const handleAuthentication = async () => {
    try {
      const authUrl = canvaService.getAuthorizationUrl();
      const supported = await Linking.canOpenURL(authUrl);
      
      if (supported) {
        await Linking.openURL(authUrl);
        // Note: In a real app, you'd handle the callback URL through deep linking
        Alert.alert(
          'Authorization',
          'Please complete the authorization in your browser, then return to the app.',
          [
            {
              text: 'I\'ve completed authorization',
              onPress: () => {
                // In a real implementation, you'd get the auth code from the callback
                checkAuthStatus();
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Cannot open Canva authorization URL');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to start authentication process');
    }
  };

  const loadDesigns = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const userDesigns = await canvaService.getUserDesigns(20);
      setDesigns(userDesigns);
    } catch (error) {
      Alert.alert('Error', 'Failed to load designs');
    } finally {
      setLoading(false);
    }
  };

  const loadBarberTemplates = async () => {
    setLoading(true);
    try {
      const barberTemplates = await canvaService.searchBarberTemplates('barber salon beauty');
      setTemplates(barberTemplates);
    } catch (error) {
      Alert.alert('Error', 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFromTemplate = async (templateId: string) => {
    if (!isAuthenticated) {
      Alert.alert('Authentication Required', 'Please sign in to Canva first');
      return;
    }

    setLoading(true);
    try {
      const newDesign = await canvaService.createDesignFromTemplate(
        templateId,
        'Barber Buddy Design'
      );
      
      const editUrl = await canvaService.getDesignEditUrl(newDesign.id);
      
      Alert.alert(
        'Design Created',
        'Your design has been created! Would you like to edit it now?',
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Edit Now',
            onPress: async () => {
              const supported = await Linking.canOpenURL(editUrl);
              if (supported) {
                await Linking.openURL(editUrl);
              }
            }
          }
        ]
      );
      
      // Refresh designs list
      loadDesigns();
    } catch (error) {
      Alert.alert('Error', 'Failed to create design from template');
    } finally {
      setLoading(false);
    }
  };

  const handleEditDesign = async (designId: string) => {
    try {
      const editUrl = await canvaService.getDesignEditUrl(designId);
      const supported = await Linking.canOpenURL(editUrl);
      
      if (supported) {
        await Linking.openURL(editUrl);
      } else {
        Alert.alert('Error', 'Cannot open Canva editor');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open design for editing');
    }
  };

  const handleSignOut = async () => {
    await canvaService.signOut();
    setIsAuthenticated(false);
    setDesigns([]);
  };

  const renderDesignItem = ({ item }: { item: CanvaDesign }) => (
    <TouchableOpacity
      style={styles.designItem}
      onPress={() => handleEditDesign(item.id)}
    >
      {item.thumbnail?.url && (
        <Image source={{ uri: item.thumbnail.url }} style={styles.thumbnail} />
      )}
      <View style={styles.designInfo}>
        <Text style={styles.designTitle}>{item.title}</Text>
        <Text style={styles.editText}>Tap to edit in Canva</Text>
      </View>
    </TouchableOpacity>
  );

  const renderTemplateItem = ({ item }: { item: CanvaTemplate }) => (
    <TouchableOpacity
      style={styles.templateItem}
      onPress={() => handleCreateFromTemplate(item.id)}
    >
      {item.thumbnail?.url && (
        <Image source={{ uri: item.thumbnail.url }} style={styles.thumbnail} />
      )}
      <View style={styles.templateInfo}>
        <Text style={styles.templateTitle}>{item.title}</Text>
        {item.description && (
          <Text style={styles.templateDescription}>{item.description}</Text>
        )}
        <Text style={styles.createText}>Tap to create</Text>
      </View>
    </TouchableOpacity>
  );

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.authContainer}>
          <Text style={styles.title}>Canva Design Tools</Text>
          <Text style={styles.subtitle}>
            Create professional designs for your barber business
          </Text>
          <TouchableOpacity
            style={styles.authButton}
            onPress={handleAuthentication}
          >
            <Text style={styles.authButtonText}>Connect to Canva</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Canva Design Tools</Text>
        <TouchableOpacity onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'templates' && styles.activeTab]}
          onPress={() => {
            setActiveTab('templates');
            loadBarberTemplates();
          }}
        >
          <Text style={[styles.tabText, activeTab === 'templates' && styles.activeTabText]}>
            Templates
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'designs' && styles.activeTab]}
          onPress={() => {
            setActiveTab('designs');
            loadDesigns();
          }}
        >
          <Text style={[styles.tabText, activeTab === 'designs' && styles.activeTabText]}>
            My Designs
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00d4ff" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={activeTab === 'designs' ? designs : templates}
          renderItem={activeTab === 'designs' ? renderDesignItem : renderTemplateItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  signOutText: {
    color: '#ff4757',
    fontSize: 16,
  },
  authButton: {
    backgroundColor: '#00d4ff',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  authButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#00d4ff',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#00d4ff',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  listContainer: {
    padding: 10,
  },
  designItem: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 5,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  templateItem: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 5,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  thumbnail: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  designInfo: {
    padding: 10,
  },
  templateInfo: {
    padding: 10,
  },
  designTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  templateTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  templateDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  editText: {
    fontSize: 12,
    color: '#00d4ff',
  },
  createText: {
    fontSize: 12,
    color: '#00d4ff',
    fontWeight: 'bold',
  },
});