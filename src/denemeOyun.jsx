import React, { useState, useEffect } from 'react'
import * as signalR from "@microsoft/signalr";

function denemeOyun() {

    const [grupName, setGrupName] = useState("");
    const [hubConnection, setHubConnection] = useState(null);

    useEffect(()=>{
        bootSignalR();
        return ()=>{
            hubConnection.stop();
        }
    }, []);

    const bootSignalR = async ()=>{
        const connection = new signalR.HubConnectionBuilder()
        .withUrl("https://localhost:7061/chat")
        .withAutomaticReconnect()
        .build();


        await connection.start();
        console.log("Connected!");
        setHubConnection(connection);

          // Backend'den gelen mesajları dinle
          connection.on("ReceiveMessage", (sender, message) => {
            console.log(`Mesaj: ${message}`);
          });


    }

    const joinGame = async ()=>{
        await hubConnection.invoke('JoinRoom', grupName);
    }

  return (


    <div>
        <div className="container">
            <div className="row">
                <input value={grupName} onChange={(e)=>setGrupName(e.target.value)} type="text" className='form-control' />
                <button onClick={joinGame} className='btn btn-primary'>Gruba Katıl</button>
            </div>
        </div>
        <div className="profile-images d-flex justify-content-between">
            <div className="profile-image overflow-hidden border-radius-0">
                <img src="https://placehold.co/64x64" alt="player 1" />
                <p>0</p>
            </div>
            <div className="profile-image overflow-hidden border-radius-10">
                <img src="https://placehold.co/64x64" alt="player 2" />
                <p>0</p>
            </div>
        </div>
        <div className="question-container">
            <div className="question-text bg-success">
                <p>10 x 10 = ?</p>
                <input type="text" className='form-control' />

            </div>
        </div>
    </div>
  )
}

export default denemeOyun