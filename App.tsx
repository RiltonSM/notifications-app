import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Alert, Button, StyleSheet, View, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  })
})

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  
  useEffect(() => {
    async function configurePushNotifications() {
      const { status } = await Notifications.getPermissionsAsync()
      console.log(status)
      let finalStatus = status

      if (finalStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
      }

      if (finalStatus !== 'granted') {
        Alert.alert('Failed to get push token for push notification!')
        return
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      })
      setExpoPushToken(token.data)
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.DEFAULT,
        })
      }
    }

    configurePushNotifications()
    
  }, [])


  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log(notification)
    })

    const subscription2 = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log(response)
    })

    return () => {
      subscription.remove()
      subscription2.remove() 
    }
  }, [])

  async function verifyNotificationPermission() {
    const hasPermission = await Notifications.getPermissionsAsync()

    if (hasPermission.status !== 'granted') {
      const status = await Notifications.requestPermissionsAsync()
      return status.granted
    }
    return true
  }
  function scheduleNotificationHandler() {
    const hasPermission = verifyNotificationPermission()
    if (!hasPermission) {
      return
    }
    Notifications.scheduleNotificationAsync({
      content: {
        title: 'You have a new notification',
        body: '👋',
        data: { userName: 'Test' },
      },
      trigger: { seconds: 5 },
    })
  }

  const sendPushNotificationHandler = async () => {
    fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: expoPushToken,
        title: 'Test',
        body: 'Test'
      })
    })
  }

  return (
    <View style={styles.container}>
      <Button title='Notification' onPress={scheduleNotificationHandler}/>
      <Button title='Send Push' onPress={sendPushNotificationHandler}/>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});