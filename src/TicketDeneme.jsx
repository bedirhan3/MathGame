import React, { useEffect, useState } from 'react'
import * as signalR from "@microsoft/signalr";

function TicketDeneme() {
    const [users, setUsers] = useState(["Ahmet", "Mehmet"]);
    const [hubConnection, setHubConnection] = useState(null);

    useEffect(() => {
        const connection = new signalR.HubConnectionBuilder()
            .withUrl("http://localhost:5000/chat")
            .withAutomaticReconnect()
            .build();

        connection.start()
            .then(() => {
                console.log("Connected!");
                setHubConnection(connection);

                // Bağlantı sağlandıktan sonra event listener ekleyelim.
                connection.on("UserTyping", (message) => {
                    console.log(message);
                    setUsers(message);
                });
                connection.on("TypingStopped", (userList)=>{
                    setUsers(userList);
                })
            })
            .catch(err => console.error("Connection failed: ", err));

        return () => {
            connection.stop(); // Cleanup
        };
    }, []);

    useEffect(() => {
        if (!hubConnection) return;

        hubConnection.onclose(async () => {
            console.log("Bağlantı kapandı, tekrar bağlanılıyor...");
            await hubConnection.start();
        });

    }, [hubConnection]);

    const focus = () => {
        if (hubConnection) {
            hubConnection.invoke("StartTyping", "8")
                .catch(err => console.error("Invoke hatası:", err));
        } else {
            console.error("Hub bağlantısı hazır değil!");
        }
    };

    const blur = ()=>{
        hubConnection.invoke("StopTyping","8");
    }

    return (
        <div>
            <h2 className='text-center'>Deneme</h2>
            <input type="text" onFocus={focus} onBlur={blur} className='form-control mt-4' style={{ border: "1px solid black" }} />
          {users.length> 0 && (
            <p>{users.map((a) => a + ",")} yazıyor...</p>
          )}  
        </div>
    );
}

export default TicketDeneme;
