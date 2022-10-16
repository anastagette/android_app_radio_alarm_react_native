import { Modal, FlatList, SafeAreaView, StatusBar, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from "react";
import Button from './components/Button';
import SwitchButton from './components/SwitchButton';
import SelectableButtons from './components/SelectableButtons';
import * as SQLite from 'expo-sqlite';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';


function openDatabase() {

  const db = SQLite.openDatabase("dbRA.db");
  return db;
}

const db = openDatabase();


const radioList = [
  { title: "Vivaldi", uri: "http://23.82.11.87:8928/stream" },
  { title: "Hits of Bollywood", uri: "http://198.50.156.92:8255/stream" },
  { title: "Metal", uri: "http://51.255.8.139:8738/stream" }
];


const Item = ({ item, onPress, onPressSwitchButton, isEnabled, backgroundColor, textColor }) => (
  <TouchableOpacity onPress={onPress} style={styles.item}>
    <Text style={styles.title}>{item.title}</Text>
    <SwitchButton onPressSwitchButton={onPressSwitchButton} isEnabled={isEnabled}/>
  </TouchableOpacity>
);

export default function App() {

  const [items, setItems] = useState(null);
  const [forceUpdate, forceUpdateId] = useForceUpdate();
  const [radio, setRadio] = useState(null);
  const [radioUri, setRadioUri] = useState(null);
  const [visibleAlarm, setVisibleAlarm] = useState(false);
  const [currentTime, setCurrentTime] = useState(null);
  const [sound, setSound] = useState(null);


  //Ringing alarm

  useEffect(() => {
    Notifications.addNotificationReceivedListener(notification => {

      playSound(notification.request.content.data.radioUri);
      setVisibleAlarm(true);
      setCurrentTime(notification.request.content.data.time);

    });
  }, [])


  //Database services

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        "create table if not exists alarms (id integer primary key not null, " 
        + "title text, radio text, radioUri text, notificationId text, enabled int);"
      );
    });
  }, []);

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        "select * from alarms;",
        [],
        (_, { rows: { _array } }) => setItems(_array)
      );
    });
  }, []);

  const addItem = (time, radio, radioUri) => {
    if (radio === null) {
      return false;
    };

    newNotification(time, radioUri).then(notificationId => {
      db.transaction(
        (tx) => {
          tx.executeSql("insert into alarms (title, radio, radioUri, notificationId, enabled) "
            + "values (?, ?, ?, ?, 1)", [time, radio, radioUri, notificationId]);
          tx.executeSql("select * from alarms",
            [],
            (_, { rows: { _array } }) => setItems(_array)
          );
        },
        null,
        forceUpdate
      );
    });
  };

  const deleteItem = (itemId) => {
    db.transaction(
      (tx) => {
        tx.executeSql("select notificationId from alarms where id = ?;",
          [itemId],
          (_, { rows: { _array } }) =>
            Notifications.cancelScheduledNotificationAsync(Object.values(_array[0])[0])
        );
      },
      null,
      forceUpdate
    )
    db.transaction(
      (tx) => {
        tx.executeSql("delete from alarms where id = ?;", [itemId]);
        tx.executeSql("select * from alarms",
          [],
          (_, { rows: { _array } }) => setItems(_array)
        );
      },
      null,
      forceUpdate
    );
  }; 

  const updateOnSwitch = (itemId, enabled) => {
    db.transaction(
      (tx) => {
        tx.executeSql(`update alarms set enabled = ${enabled ? 1 : 0} where id = ?;`,
          [itemId],
        );
        tx.executeSql("select * from alarms",
          [],
          (_, { rows: { _array } }) => setItems(_array)
        );
      },
      null,
      forceUpdate
    )

    if (enabled) {
      db.transaction(
        (tx) => {
          tx.executeSql("select title, radioUri from alarms where id = ?;",
            [itemId],
            (_, { rows: { _array } }) =>
              newNotification(Object.values(_array[0])[0],
                Object.values(_array[0])[1]).then(notificationId => {
                  db.transaction(
                    (tx) => {
                      tx.executeSql(`update alarms set `
                        + `notificationId = "${notificationId}" where id = ?;`,
                        [itemId],
                      );
                      tx.executeSql("select * from alarms",
                        [],
                        (_, { rows: { _array } }) => setItems(_array)
                      );
                    },
                    null,
                    forceUpdate
                  )
              }
          ));
        },
        null,
        forceUpdate
      )
    }
    else {
      db.transaction(
        (tx) => {
          tx.executeSql("select notificationId from alarms where id = ?;",
            [itemId],
            (_, { rows: { _array } }) =>
              Notifications.cancelScheduledNotificationAsync(Object.values(_array[0])[0])
          );
        },
        null,
        forceUpdate
      )
    }
  }


  //Notifications and radio playing

  async function newNotification(time, radioUri) {

    let notificationTime = time.split(':');
    let notificationHour = Number(notificationTime[0]);
    let notificationMinute = Number(notificationTime[1]);

    const schedulingOptions = {
      content: {
        title: 'Alarm',
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        color: "blue",
        data: {
          time: time,
          radioUri: radioUri
        }
      },
      trigger: {
        hour: notificationHour,
        minute: notificationMinute,
        repeats: true
      },
    };

    const notificationId = String(
      await Notifications.scheduleNotificationAsync(
      schedulingOptions,
    ));

    console.log(notificationId)

    return notificationId;
  };

  async function playSound(radioUri) {

    console.log('Loading Sound');
    const { sound } = await Audio.Sound.createAsync(
      { uri: radioUri }
    );
    setSound(sound);

    console.log('Playing Sound');
    await sound.playAsync();
  }

  async function dismissAlarm() {

    await sound.unloadAsync();
    setVisibleAlarm(false);
  }


  //Time picker

  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);

  let defaultTime = `${date.getHours() < 10 ? '0' + date.getHours() : date.getHours()}`
    + `:${date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()}`;

  const [time, setTime] = useState(defaultTime);

  const onChange = (event, selectedDate) => {
    setShow(false);
    const currentDate = selectedDate || date;
    setDate(currentDate);

    let tempDate = new Date(currentDate);
    let fTime = `${tempDate.getHours() < 10 ? '0' + tempDate.getHours() : tempDate.getHours()}`
      + `:${tempDate.getMinutes() < 10 ? '0' + tempDate.getMinutes() : tempDate.getMinutes()}`;
    setTime(fTime);
  };


  const renderItem = ({ item }) => {
    return (
      <Item
        item={item}
        onPress={() => deleteItem(item.id)}
        onPressSwitchButton={(value) => updateOnSwitch(item.id, value)}
        isEnabled={item.enabled == 1}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.timeContainer} onPress={() => setShow(true)}>
          <Text style={styles.clockText}>
            {time}
          </Text>
        </TouchableOpacity>
        {show && (
          <DateTimePicker
            testID='dateTimePicker'
            value={date}
            mode={'time'}
            is24Hour={true}
            display='default'
            onChange={onChange}
          />)}
        <SelectableButtons
          radioList={radioList}
          onPressSelectableButton={(r, rUri) => { setRadio(r); setRadioUri(rUri) }} />
        <Button
          onPress={() => {
            addItem(time, radio, radioUri);
            setTime(defaultTime);
          }}
          title={'Add'}
        />
      </View>
      <View style={styles.listContainer}>
        <FlatList
          key={`${forceUpdateId}`}
          data={items}
          renderItem={renderItem}
        />
      </View>
      <Modal visible={visibleAlarm} dismissable={false} >
        <View style={styles.modalView}>
          <Text style={styles.clockText}>{currentTime}</Text>
          <Text style={styles.title}>Alarm</Text>
          <Button
            onPress={() => {
              dismissAlarm();
            }}
            title={'Stop'}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
};

function useForceUpdate() {
  const [value, setValue] = useState(0);
  return [() => setValue(value + 1), value];
}

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      marginTop: StatusBar.currentHeight || 0
    },
    item: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 15,
      marginVertical: 8,
      marginHorizontal: 16,
      borderRadius: 15,
      alignItems: 'center',
      backgroundColor: '#add8e6'
    },
    title: {
      fontSize: 32,
      textColor: 'black'
    },
    buttonsContainer: {
      flex: 1,
      justifyContent: 'flex-start',
      alignItems: 'center',
      top: 30
    },
    listContainer: {
      flex: 2
    },
    timeContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    },
    clockText: {
      color: 'black',
      fontWeight: 'bold',
      fontSize: 70
    },
    modalView: {
      alignItems: 'center',
      top: 200
    },
  });