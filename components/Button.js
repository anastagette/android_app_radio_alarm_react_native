import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import React from 'react';


export default function ({ onPress, title }) {
  return (
    <TouchableOpacity
      style={[styles.container, styles.fillContainer]}
      onPress={onPress}
      underlayColor='#fff'>
      <Text
        style={[styles.buttonText, styles.fillText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    margin: 10,
    paddingLeft: 20,
    paddingRight: 20,
    borderWidth: 2,
    borderColor: `#000080`,
    borderRadius: 25
  },
  fillContainer: {
    backgroundColor: `#000080`,
  },
  normalContainer: {
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontWeight: 'bold'
  },
  fillText: {
    color: 'white',
  },
  normalText: {
    color: `#000080`
  }
});