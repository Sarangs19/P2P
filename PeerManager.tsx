import React, {useEffect, useRef, useState} from 'react';
import { StyleSheet, View, Text, AppState, FlatList, Button } from 'react-native';
import RNFS from "react-native-fs";
// Import methods from the library
import { discoverPeers, subscribeDiscoverPeer, receiveMessage, receiveFile, sendMessageTo, sendFileTo } from '@arekjaar/react-native-transfer-big-files';
import realmUser, { User } from '../db/User';
import JSZip from 'jszip';
import { unzip } from 'react-native-zip-archive';
import { addUser } from '../db/User';

//{"deviceName":"realme C55","modelName":"RMX3710","productName":"REE2ADL1","type":1,"ipAddress":"192.168.0.103"}
export default function PeerManager() : any {
  // State variables
  const [peers, setPeers] = useState<any>([]);
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState('');
  const [received, setReceived] = useState('');
  const [start, setStart] = useState(false);
  const [selectedPeer, setSelectedPeer] = useState<any>(null);

  // Subscribe to discover peers event
async function getData() {
 
  let dd = await discoverPeers();
  console.log("discoverPeers =>", dd);
}
let myinterval = useRef<NodeJS.Timeout | null>(null);


  useEffect(() => {
    try {
      if(start==true){
          myinterval.current = setInterval(getData, 1500);
       
        const discoverPeerSubscription = subscribeDiscoverPeer((peers) => {
          console.log("discoverPeerSubscription =>", peers);
          setPeers(JSON.parse(peers));
          clearIntervalRef(myinterval.current);
        });

        return () => {
          clearIntervalRef(myinterval.current)
          discoverPeerSubscription.remove();
          };
      }else{
        console.log("clearIntervalRef =>");
        clearIntervalRef(myinterval.current)
      }
     
  
  } catch (error) {
    console.log("error discoverPeers =>", error);
  }
  }, [start]);

  
function clearIntervalRef(myinterval: NodeJS.Timeout | null) {
    if (myinterval) {
      clearInterval(myinterval);
      myinterval = null;
    }
  }
 
  const sendData = async (item: any) => {
    try {
      console.log("sendData =>", "66");
   
    // Extract data from Realm DB
    const users = realmUser.objects<User>("User").map(user => ({
      userId: user.userId,
      username: user.username,
      email: user.email,
      dateJoined: user.dateJoined,
    }));

     // Compress the data
     const zip = new JSZip();
     zip.file("users.json", JSON.stringify(users));
 
     // Generate ZIP file as base64
     const zipData = await zip.generateAsync({ type: "base64" });
     const path = `${RNFS.DocumentDirectoryPath}/data.zip`;
 
     // Write the base64 data to a file
     await RNFS.writeFile(path, zipData, "base64");
     console.log("sendData =>", "86");

    // Send the file to the selected peer
      const sendzipData = await sendFileTo(path, item?.ipAddress);
      console.log("sendzipData =>", sendzipData);

    
      console.log("sendData =>", "94");
    
  } catch (error) {
    console.warn("error sendData =>", error);
  }
  };
  


  const handleReceivedFile = async (filePath: string) => {
    try {
      // Unzip if it's a ZIP file
      const unzippedPath = await unzip(filePath, RNFS.DocumentDirectoryPath);
      const receivedJsonPath = `${unzippedPath}/userData.json`;

      // Read and parse the received JSON data
      const receivedData = await RNFS.readFile(receivedJsonPath, "utf8");
      const users: User[] = JSON.parse(receivedData);

      // Insert data into the Realm DB
      realmUser.write(() => {
        users.forEach((user) => {
          realmUser.create("User", user, Realm.UpdateMode.Modified);
        });
      });
      console.log("Data successfully inserted into Realm DB.");
    } catch (error) {
      console.error("Failed to process received file:", error);
    }
  };

  const startReceivingData = async () => {
    const destinationPath = RNFS.DocumentDirectoryPath + "/receivedUserData.zip";
    
    try {
      const fileRC = await receiveFile(destinationPath, "TestUser", false);
      console.error("receiveFile:", fileRC);

    } catch (error) {
      console.error("Failed to receive file:", error);
    }
  };


  // Render method
 return(
  <View>
     <Button disabled={start} title="Start Searching" onPress={() => {setStart(true)}} />
      <View style={{margin:10}} />
     <Button disabled={!start} title="Stop Searching" onPress={() => {setStart(false)}} />
     <View style={{margin:10}} />
  <Text>Nearby Devices:</Text>
  <FlatList
    data={peers}
    keyExtractor={(item : any) => item.peerID}
    renderItem={({ item }) => (
      <View style={{ padding: 10}}>
        <Text style={{fontSize:16, backgroundColor: 'green', color:'white', padding: 10}}
        >{item.deviceName} - {item.productName}</Text>
        <Button  title="Send Zip File" onPress={() => {
          addUser("Sarnf", "sss@gmail.com");
          setSelectedPeer(item);
          sendData(item);
          
        }} />
        <Button title="Receive User Data" onPress={startReceivingData} />
      </View>
    )}
  />
</View>
 )
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    color: '#000000'
  },
});

