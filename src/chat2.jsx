import React from 'react'
import * as signalR from "@microsoft/signalr";
import { HubConnectionBuilder } from "@microsoft/signalr";
import { useEffect, useState } from 'react';




function chat2() {
    const [messages, setMessages] = useState([]);
    const [hubConnection, setHubConnection] = useState(null);
    const [message, setMessage] = useState([]);
    const [name, setName] = useState("");

    useEffect(() => {
        bootSignalR();
        return () => {
            hubConnection.stop();
        };
    }, []);

    async function bootSignalR() {
        try {
            const connection = new signalR.HubConnectionBuilder()
                .withUrl("https://localhost:7061/chat")
                .withAutomaticReconnect()
                .build();

            await connection.start();
            console.log("Connected!");
            setHubConnection(connection);

            connection.on("UserConnected", function (user) {
                console.log(user + " bağlandı");
            });

            connection.on("MessageRecevied", function (id, user, message) {
                console.log(user + " : " + message);

                // Mesajları state'e ekle
                setMessages((prevMessages) => [
                    ...prevMessages,
                    { id, user, message }
                ]);
            });


        } catch (error) {
            console.error("SignalR bağlantı hatası:", error);
        }
    }
    async function sendMessage() {
        try {
            await hubConnection.invoke("SendMessage", name, message); // Doğru method adı kullanılıyor mu kontrol edin.
            console.log(name + " : " + message);
            setMessage(""); // Mesajı sıfırla
        } catch (error) {
            console.error("Mesaj gönderilemedi:", error);
        }
    }

    return (
        <div className="chat-container" style={{
            maxWidth: '800px',
            margin: '20px auto',
            backgroundColor: '#1a1a1a',
            borderRadius: '12px',
            boxShadow: '0 0 20px rgba(0,0,0,0.3)',
            height: '80vh',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <div className="chat-header" style={{
                background: 'linear-gradient(45deg, #2196F3, #1976D2)',
                padding: '20px',
                borderRadius: '12px 12px 0 0',
                color: 'white'
            }}>
                <h2 style={{ margin: 0 }}>Real-Time Chat</h2>
            </div>

            <div className="user-info" style={{
                padding: '15px',
                borderBottom: '1px solid #333'
            }}>
                <input
                    type="text"
                    className="name-input"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                        width: '80%',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid #444',
                        backgroundColor: '#2d2d2d',
                        color: 'white'
                    }}
                />
            </div>

            <div className="messages-container" style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column-reverse'
            }}>
                <div className="message-list">
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            style={{
                                marginBottom: '15px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: msg.user === name ? 'flex-end' : 'flex-start'
                            }}
                        >
                            <span style={{
                                fontSize: '0.8em',
                                color: '#888',
                                marginBottom: '4px'
                            }}>
                                {msg.user}
                            </span>
                            <div style={{
                                backgroundColor: msg.user === name ? '#2196F3' : '#424242',
                                padding: '10px 15px',
                                borderRadius: msg.user === name ? '15px 15px 0 15px' : '15px 15px 15px 0',
                                maxWidth: '70%',
                                wordBreak: 'break-word',
                                color: msg.user === name ? 'white' : '#fff'
                            }}>
                                {msg.message}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="message-input-container" style={{
                padding: '20px',
                borderTop: '1px solid #333',
                display: 'flex',
                gap: '10px'
            }}>
                <input
                    type="text"
                    className="message-input"
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '25px',
                        border: '1px solid #444',
                        backgroundColor: '#2d2d2d',
                        color: 'white',
                        fontSize: '16px'
                    }}
                />
                <button
                    onClick={sendMessage}
                    style={{
                        padding: '12px 25px',
                        borderRadius: '25px',
                        border: 'none',
                        backgroundColor: '#2196F3',
                        color: 'white',
                        cursor: 'pointer',
                        transition: 'background-color 0.3s',
                        fontSize: '16px',
                        fontWeight: 'bold'
                    }}
                >
                    Send
                </button>
            </div>
        </div>
    )
}

export default chat2