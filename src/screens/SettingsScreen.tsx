import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Switch, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const [googleConnected, setGoogleConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  
  useEffect(() => {
    // Check if Google account is connected (for demo, assume not connected)
    setGoogleConnected(false);
  }, []);
  
  const handleGoogleConnect = async () => {
    setLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      setGoogleConnected(true);
      setLoading(false);
    }, 1500);
  };
  
  const handleGoogleDisconnect = async () => {
    setLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      setGoogleConnected(false);
      setLoading(false);
    }, 1500);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>
      
      <View style={styles.content}>
        {/* Connected Accounts Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connected Accounts</Text>
          
          <View style={styles.accountCard}>
            <View style={styles.accountInfo}>
              <Text style={styles.accountLabel}>Google Calendar</Text>
              
              {loading ? (
                <ActivityIndicator size="small" color="#005e46" />
              ) : googleConnected ? (
                <View>
                  <Text style={styles.accountEmail}>letters.ngo@gmail.com</Text>
                  <TouchableOpacity onPress={handleGoogleDisconnect}>
                    <Text style={styles.disconnectText}>Disconnect</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.connectButton} onPress={handleGoogleConnect}>
                  <Text style={styles.connectButtonText}>Connect</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
        
        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>Enable Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: "#d6ceb9", true: "#005e46" }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>Dark Mode</Text>
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: "#d6ceb9", true: "#005e46" }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
        
        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>1.0.0 (Demo)</Text>
          </View>
          
          <TouchableOpacity style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Privacy Policy</Text>
            <Text style={styles.linkText}>View</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Terms of Service</Text>
            <Text style={styles.linkText}>View</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f0e7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#d6ceb9',
  },
  backButton: {
    fontSize: 16,
    color: '#005e46',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#005e46',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  accountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
  },
  accountInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountLabel: {
    fontSize: 16,
    color: '#333333',
  },
  accountEmail: {
    fontSize: 14,
    color: '#666666',
  },
  disconnectText: {
    fontSize: 14,
    color: 'red',
    marginTop: 4,
  },
  connectButton: {
    backgroundColor: '#005e46',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  connectButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  preferenceLabel: {
    fontSize: 16,
    color: '#333333',
  },
  aboutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  aboutLabel: {
    fontSize: 16,
    color: '#333333',
  },
  aboutValue: {
    fontSize: 14,
    color: '#666666',
  },
  linkText: {
    fontSize: 14,
    color: '#005e46',
    fontWeight: 'bold',
  },
});

export default SettingsScreen;