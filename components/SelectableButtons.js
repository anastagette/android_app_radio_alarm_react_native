import React, { useState } from "react";
import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity } from "react-native";


const Item = ({ item, onPress, backgroundColor, textColor }) => (
  <TouchableOpacity onPress={onPress} style={[styles.item, backgroundColor]}>
    <Text style={[styles.title, textColor]}>{item.title}</Text>
  </TouchableOpacity>
);

const SelectableButtons = (props) => {
  const [selectedItem, setSelectedItem] = useState(null);

  const onPress = (item) => {
    setSelectedItem(item.title);
    props.onPressSelectableButton(item.title, item.uri)
  }

  const renderItem = ({ item }) => {
    const backgroundColor = item.title === selectedItem ? "#000080" : "#b0c4de";
    const color = item.title === selectedItem ? 'white' : '#000080';

    return (
      <Item
        item={item}
        onPress={() => onPress(item)}
        backgroundColor={{ backgroundColor }}
        textColor={{ color }}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={props.radioList}
        renderItem={renderItem}
        keyExtractor={(item) => item.title}
        extraData={selectedItem}
        horizontal={true}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  item: {
    padding: 10,
    margin: 10,
    paddingLeft: 20,
    paddingRight: 20,
    borderWidth: 2,
    borderColor: `#000080`,
    borderRadius: 25
  },
  title: {
    fontWeight: 'bold'
  },
});

export default SelectableButtons;