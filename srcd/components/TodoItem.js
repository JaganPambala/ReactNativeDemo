import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

const TodoItem = ({ todoItem, onDelete, onEdit }) => {
  const taskText = todoItem?.value ?? todoItem;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{taskText}</Text>

      <View style={styles.iconContainer}>
        {/* Delete Icon */}
        <TouchableOpacity 
          onPress={() => onDelete(todoItem)}
          style={styles.iconButton}
        >
          <Icon name="delete" size={22} color="#dc2626" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 14,
    marginVertical: 6,
    borderRadius: 8,
    backgroundColor: "#f2f4f7",
    borderLeftWidth: 4,
    borderLeftColor: "#4f46e5",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  text: {
    fontSize: 16,
    color: "#111827",
    flex: 1,
  },
  iconContainer: {
    flexDirection: "row",
    marginLeft: 10,
  },
  iconButton: {
    marginLeft: 12,
  },
});

export default TodoItem;
