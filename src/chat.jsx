import React, { useState, useEffect } from "react";
import * as signalR from "@microsoft/signalr";

const Chat = () => {
    const [connection, setConnection] = useState(null);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [selectedUser, setSelectedUser] = useState("Ahmet");
    const users = ["Ahmet", "Meltem"];

    useEffect(() => {
        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl("https://localhost:7061/chat")
            .withAutomaticReconnect()
            .build();

        setConnection(newConnection);
    }, []);

    useEffect(() => {
        if (connection) {
            connection
                .start()
                .then(() => {
                    console.log("Connected!");

                    connection.on("ReceiveMessage", (messageUser, message) => {
                        if (messageUser !== selectedUser) {
                            console.log("Yeni mesaj alındı:");
                            console.log(`Gönderen: ${messageUser}`);
                            console.log(`Mesaj: ${message}`);
                            console.log("------------------------");
                        }
                        setMessages(prevMessages => [...prevMessages, { user: messageUser, message, timestamp: new Date() }]);
                    });
                })
                .catch((error) => console.error("Connection failed: ", error));
        }
    }, [connection, selectedUser]);

    const sendMessage = async () => {
        if (connection && message.trim()) {
            try {
                await connection.send("SendMessage", selectedUser, message);
                setMessage("");
            } catch (error) {
                console.error("Mesaj gönderilemedi:", error);
            }
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    };

    return (
        <div className="chat-container">
            <h1>Chat Application</h1>
            <div className="user-selection">
                <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                >
                    {users.map(user => (
                        <option key={user} value={user}>{user}</option>
                    ))}
                </select>
            </div>
            <div className="message-container">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`message ${msg.user === selectedUser ? 'sent' : 'received'}`}
                    >
                        <strong>{msg.user}:</strong> {msg.message}
                        <span className="timestamp">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                    </div>
                ))}
            </div>
            <div className="input-container">
                <input
                    type="text"
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                />
                <button onClick={sendMessage}>Send</button>
            </div>
        </div>
    );
};

export default Chat;
