import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';

const HomeScreen = () => {
  const [taskCount, setTaskCount] = useState(0);
  
  const handleCreateDemoTasks = () => {
    // Simulate creating tasks
    setTaskCount(prevCount => prevCount + 3);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Janaru Demo</Text>
      </View>
      
      <View style={styles.content}>
        <TouchableOpacity style={styles.demoButton} onPress={handleCreateDemoTasks}>
          <Text style={styles.buttonText}>Create Demo Tasks</Text>
        </TouchableOpacity>
        
        <Text style={styles.taskCounter}>Tasks created: {taskCount}</Text>
        
        <View style={styles.taskSection}>
          <Text style={styles.sectionTitle}>High Priority Tasks</Text>
          <View style={styles.taskItem}>
            <Text style={styles.taskTitle}>Example High Priority Task</Text>
            <Text style={styles.taskDate}>Today</Text>
          </View>
        </View>
        
        <View style={styles.taskSection}>
          <Text style={styles.sectionTitle}>Medium Priority Tasks</Text>
          <View style={styles.taskItem}>
            <Text style={styles.taskTitle}>Example Medium Priority Task</Text>
            <Text style={styles.taskDate}>Next week</Text>
          </View>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#d6ceb9',
    marginTop: 40, // To account for iOS status bar
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#005e46',
  },
  content: {
    padding: 16,
  },
  demoButton: {
    backgroundColor: '#005e46',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskCounter: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  taskSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  taskItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  taskDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});

export default HomeScreen;