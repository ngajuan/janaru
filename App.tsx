import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

export default function App() {
  const [count, setCount] = React.useState(0);
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Janaru Demo</Text>
      <Text style={styles.counter}>Tasks created: {count}</Text>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={() => setCount(count + 1)}
      >
        <Text style={styles.buttonText}>Create Demo Task</Text>
      </TouchableOpacity>
      
      {count > 0 && (
        <View style={styles.taskList}>
          <Text style={styles.sectionTitle}>High Priority Tasks:</Text>
          {Array.from({ length: count }).map((_, i) => (
            <View key={i} style={styles.task}>
              <Text style={styles.taskText}>Demo Task {i + 1}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f0e7',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#005e46',
    marginBottom: 20,
  },
  counter: {
    fontSize: 18,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#005e46',
    padding: 15,
    borderRadius: 10,
    marginBottom: 30,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskList: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  task: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    width: '100%',
  },
  taskText: {
    fontSize: 16,
  },
});