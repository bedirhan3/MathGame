import { HubConnectionBuilder } from '@microsoft/signalr';
import React, { useState, useEffect } from 'react'
import * as signalR from "@microsoft/signalr";


function schat4() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [hubConnection, setHubConnection] = useState(null);
    useEffect(() => {
        setMessages([
            { id: 1, text: 'Merhaba!', sender: 'ahmet' },
            { id: 2, text: 'Merhaba!', sender: 'mehmet' }, 
            { id: 3, text: 'Nasılsın?', sender: 'ahmet' },
            { id: 4, text: 'İyiyim, teşekkürler!', sender: 'mehmet' },
        ]);
        bootSignalR();

        return () => {
            hubConnection.stop();
        };
    }, []);

    const bootSignalR = async ()=>{
        const connection = new HubConnectionBuilder()
        .withUrl('https://localhost:7061/chat')
        .build();

        await connection.start();
        console.log('Connected!');
        setHubConnection(connection);

        connection.on("UserConnected", function (user) {
            console.log(user + " bağlandı");
        });

        connection.on('MessageRecevied', function (id, user, message){
            console.log(id + " " + user + " : " + message);
            setMessages([...messages, { id, user, message }]);
        });
    }

    const sendMessage = async ()=>{
        await hubConnection.invoke('SendMessage', "ahmet", input);
        setInput('');
    }

  return (
    <div>
        <h1>Chat 4 </h1>
        <div className='chat-container'>

            {messages.map((message) => (
                <div key={message.id} className='message'>
                    <strong>{message.sender}:</strong> {message.text}
                </div>
            ))}

            <input className='form-control' type='text' value={input} onChange={(e)=>setInput(e.target.value)} />
            <button className='btn btn-primary' onClick={sendMessage}>Gönder</button>
        </div>
    </div>
  )
}

export default schat4   