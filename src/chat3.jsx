import React, { useState, useEffect } from 'react';
import { HubConnectionBuilder } from '@microsoft/signalr';

function Chat3() {
    const [connection, setConnection] = useState(null);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [username, setUsername] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');

    // Sabit grup listesi
    const groups = [
        { id: 'group1', name: 'Spor Grubu' },
        { id: 'group2', name: 'Teknoloji Grubu' },
        { id: 'group3', name: 'Müzik Grubu' },
        { id: 'group4', name: 'Sinema Grubu' },
        { id: 'group5', name: 'Kitap Grubu' }
    ];

    useEffect(() => {
        // SignalR bağlantısını kurma
        const newConnection = new HubConnectionBuilder()
            .withUrl('https://localhost:7061/chat') // Backend URL'inizi buraya yazın
            .withAutomaticReconnect()
            .build();

        setConnection(newConnection);
    }, []);

    useEffect(() => {
        if (connection) {
            connection.start()
                .then(() => {
                    console.log('SignalR Bağlantısı kuruldu!');

                    // Mesaj alma olayını dinleme
                    connection.on('ReceiveMessage', (user, message) => {
                        setMessages(prevMessages => [...prevMessages, { user, message }]);
                    });
                })
                .catch(err => console.error('Bağlantı hatası:', err));
        }
    }, [connection]);

    const joinGroup = async (groupId) => {
        if (connection && username) {
            try {
                await connection.invoke('JoinGroup', groupId);
                setSelectedGroup(groupId);
            } catch (err) {
                console.error(err);
            }
        } else {
            alert('Lütfen önce kullanıcı adı girin!');
        }
    };

    const leaveGroup = async () => {
        if (connection && selectedGroup) {
            try {
                await connection.invoke('LeaveGroup', selectedGroup);
                setSelectedGroup('');
                setMessages([]);
            } catch (err) {
                console.error(err);
            }
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (connection && message && selectedGroup) {
            try {
                await connection.invoke('SendMessageToGroup', selectedGroup, username, message);
                setMessage('');
            } catch (err) {
                console.error(err);
            }
        }
    };

    return (
        <div className="container">
            <h1>Grup Sohbetleri</h1>

            {/* Kullanıcı adı girişi */}
            <div className="user-input">
                <input
                    type="text"
                    placeholder="Kullanıcı adınız"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
            </div>

            {/* Grup listesi */}
            <div className="groups">
                <h2>Gruplar</h2>
                {groups.map(group => (
                    <button
                        key={group.id}
                        onClick={() => joinGroup(group.id)}
                        disabled={selectedGroup === group.id}
                    >
                        {group.name}
                    </button>
                ))}
                {selectedGroup && (
                    <button onClick={leaveGroup}>Gruptan Ayrıl</button>
                )}
            </div>

            {/* Mesaj listesi */}
            {selectedGroup && (
                <div className="chat-area">
                    <div className="messages">
                        {messages.map((msg, index) => (
                            <div key={index} className="message">
                                <strong>{msg.user}:</strong> {msg.message}
                            </div>
                        ))}
                    </div>

                    {/* Mesaj gönderme formu */}
                    <form onSubmit={sendMessage}>
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Mesajınızı yazın..."
                        />
                        <button type="submit">Gönder</button>
                    </form>
                </div>
            )}
        </div>
    );
}

export default Chat3;