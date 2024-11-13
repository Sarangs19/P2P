import React, { useEffect, useState } from 'react';
import { View, Text, Button } from 'react-native';
import dgram from 'react-native-udp';
import { zip, unzip } from 'react-native-zip-archive';
import realmUser, { User } from '../db/User';
import Realm from 'realm';
import JSZip from 'jszip';
import RNFS from "react-native-fs";
import UdpSocket from 'react-native-udp/lib/types/UdpSocket';
const { createSocket } = dgram;

const PORT = 12345; // Define a consistent port for discovery and data transfer
const LOCAL_IP_ADDRESS = '192.168.0.103';
const PeerDiscovery: React.FC = () => {
  const [socket, setSocket] = useState<any>(null);
  let  newSocket: UdpSocket ;
  useEffect(() => {
     newSocket = createSocket({
        type: 'udp4',
        debug: true,
      });

      newSocket.bind(PORT, LOCAL_IP_ADDRESS, () => {
        console.log(`Socket bound to ${LOCAL_IP_ADDRESS}:${PORT}`);
      });
   // newSocket.bind(PORT);
    //newSocket.setBroadcast(true);
    setSocket(newSocket);
    newSocket.on('message', async (msg: Buffer) => {
      console.log('Message received:', msg.toString());
      if (msg.toString() === 'REQUEST_DATA') {
        if (!newSocket) {
          console.error("Socket is not initialized.");
          return;
        }
        console.log("sendData =>", "35");
       // await sendData();

        try {
          const message = Buffer.from("REQUEST_DATA");
    
          newSocket.send(
            message,
            0,
            message.length,
            PORT,
            LOCAL_IP_ADDRESS,
            (err: any) => {
              if (err) console.error("Error sending data:", err);
              else console.log("Data sent successfully.");
            }
          );
        } catch (error) {
          console.error("Error in sendData:", error);
        }
      } else {
        await receiveData(msg.toString());
      }
    });

    

    return () => {
      newSocket.close();
    };
  }, []);

  const sendData = async () => {
   
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
        // const sendzipData = await sendFileTo(path, item?.ipAddress);
        // console.log("sendzipData =>", sendzipData);
  

          newSocket.send('Hello World!', undefined, undefined, PORT, LOCAL_IP_ADDRESS, function(err: any) {
            if (err) {
              console.log('Message sent err!!!', err);
            }
        
            console.log('Message sent!');
          })
        
        
       

        // socket.send(path, PORT, 'broadcast', BROADCAST_ADDRESS, (err: any) => {
        //     if (err) console.error(err);
        //   });
      
        console.log("sendData =>", "94");
      
    } catch (error) {
      console.warn("error sendData =>", error);
    }

    
  };

  const receiveData = async (data: string) => {
    const zipPath = `${Realm.defaultPath}/receivedUserData.zip`;

    await RNFS.writeFile(zipPath, data, "base64");

    //RNFS.writeFile(zipPath, data);
    const unzippedPath = await unzip(zipPath, `${Realm.defaultPath}/`);

    const userData = JSON.parse(await RNFS.readFile(unzippedPath));
    const realm = new Realm({ schema: [User] });

    realm.write(() => {
      userData.forEach((user: any) => {
        realm.create('User', {
          userId: user.userId,
          username: user.username,
          email: user.email,
          dateJoined: new Date(user.dateJoined),
        }, Realm.UpdateMode.Modified);
      });
    });
  };

  return (
    <View>
      <Text>Peer Discovery and Data Transfer</Text>
      <Button title="Request Data from Peer" onPress={() => socket.send('REQUEST_DATA', PORT, 'broadcast')} />
    </View>
  );
};

export default PeerDiscovery;
