import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { recordingService } from '../services/recording-service';

const HomeScreen = () => {
  const navigation = useNavigation();
  const [recordings, setRecordings] = useState([]);
  
  useEffect(() => {
    // Add mock recordings for demo
    recordingService.addMockRecordings().then(() => {
      // Load recordings
      loadRecordings();
    });
  }, []);
  
  const loadRecordings = () => {
    const data = recordingService.getRecordings();
    setRecordings(data);
  };
  
  const handleRecordPress = () => {
    navigation.navigate('Recording');
  };
  
  const handleSettingsPress = () => {
    navigation.navigate('Settings');
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Janaru</Text>
        <TouchableOpacity style={styles.settingsButton} onPress={handleSettingsPress}>
          <Text style={styles.settingsButtonText}>Settings</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Recent vents</Text>
        
        {recordings.length === 0 ? (
          <Text style={styles.emptyText}>No recordings yet. Tap the record button to start.</Text>
        ) : (
          <FlatList
            data={recordings}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.recordingItem}
                onPress={() => navigation.navigate('Tasks', { recordingId: item.id })}
              >
                <Text style={styles.recordingTitle}>{item.title}</Text>
                <Text style={styles.recordingDate}>{formatDate(item.date)}</Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>
      
      <View style={styles.recordingArea}>
        <TouchableOpacity style={styles.recordButton} onPress={handleRecordPress}>
          <View style={styles.recordIcon} />
        </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#d6ceb9',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#005e46',
  },
  settingsButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#005e46',
  },
  settingsButtonText: {
    fontSize: 14,
    color: '#005e46',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 32,
  },
  recordingItem: {
    paddingVertical: 16,
  },
  recordingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  recordingDate: {
    fontSize: 14,
    color: '#666666',
  },
  separator: {
    height: 1,
    backgroundColor: '#d6ceb9',
  },
  recordingArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f5827a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  recordIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f5827a',
  },
});

export default HomeScreen;