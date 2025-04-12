import React, { useState, useEffect } from 'react'
import * as signalR from "@microsoft/signalr";
import './mathgame2.css';

function MathGame2() {
    const [hubConnection, setHubConnection] = useState(null);
    const [roomName, setRoomName] = useState('');
    const [message, setMessage] = useState('');
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [correctAnswer, setCorrectAnswer] = useState('');
    const [scores, setScores] = useState({});
    const [isJoined, setIsJoined] = useState(false);

    useEffect(() => {
        const connection = new signalR.HubConnectionBuilder()
            .withUrl("https://crushy-backend-g0drd3dvddhjgyhk.canadacentral-01.azurewebsites.net/chat")
            .withAutomaticReconnect()
            .build();

        connection.start()
            .then(() => {
                console.log("Connected!");
                setHubConnection(connection);
            })
            .catch(err => console.error("Connection failed: ", err));

        connection.on("ReceiveMessage", (sender, message) => {
            console.log("Gönderen: " + sender + " Mesaj: " + message);
            setMessage(message);
            if (message.includes("Puan Tablosu")) {
                const scoresObj = {};
                message.split('\n').slice(1).forEach(line => {
                    if (line) {
                        const [id, score] = line.split(': ');
                        scoresObj[id] = parseInt(score);
                    }
                });
                setScores(scoresObj);
            }
        });






        connection.on("Question", (sender, questionText) => {
            console.log("New question:", questionText);
            setQuestion(questionText);
            const inputs = document.querySelectorAll('.answer-section input');
            for (let i = 0; i < inputs.length; i++) {
                inputs[i].value = '';
                inputs[i].focus();

            }

        });

        connection.on("CorrectAnswer", (sender, answer) => {
            console.log("Correct answer:", answer);
            setCorrectAnswer(answer);
        });

        return () => {
            if (connection) {
                connection.stop();
            }
        };
    }, []);

    const joinRoom = async () => {

        if (hubConnection && roomName) {
            await hubConnection.invoke("JoinRoom", roomName);
            setIsJoined(true);
        }
    };

    const submitAnswer = async () => {
        console.log("cevap doğruAS");
        playGame();
        await hubConnection.invoke("CorrectAnswer", roomName);
        setAnswer('');
        await hubConnection.invoke("GetScores", roomName);
    };

    const playGame = async () => {
        await hubConnection.invoke("PlayGame", roomName);
    }

    return (
        <div className="game-container">
            <div className="glass-container p-4">
                <h1 className="text-center mb-4">
                    <i className="bi bi-calculator"></i> Math Challenge
                </h1>

                {!isJoined ? (
                    <div className="join-section">
                        <div className="card glass-card">
                            <div className="card-body">
                                <h5 className="card-title mb-4">Oyuna Katıl</h5>
                                <div className="input-group">
                                    <span className="input-group-text">
                                        <i className="bi bi-door-open"></i>
                                    </span>
                                    <input
                                        type="text"
                                        className="form-control form-control-lg"
                                        placeholder="Oda adını girin"
                                        value={roomName}
                                        onChange={(e) => setRoomName(e.target.value)}
                                    />
                                    <button
                                        className="btn btn-primary btn-lg"
                                        onClick={joinRoom}
                                    >
                                        <i className="bi bi-play-fill"></i> Katıl
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="row g-4 mb-4">
                            {Object.entries(scores).map(([playerId, score], index) => (
                                <div className="col-md-6" key={playerId}>
                                    <div className="player-card glass-card">
                                        <div className="d-flex align-items-center">
                                            <div className="player-avatar">
                                                <i className="bi bi-person-circle"></i>
                                                <span className="player-status"></span>
                                            </div>
                                            <div className="player-info">
                                                <h5 className="mb-0">Oyuncu {index + 1}</h5>
                                                <div className="score-badge">
                                                    <i className="bi bi-star-fill"></i>
                                                    <span>{score}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="game-board glass-card">
                            <div className="question-section">
                                <h3 className="question-text">
                                    {question || "Soru bekleniyor..."}
                                </h3>
                                <div className="answer-section">
                                    <div className="input-group">
                                        <span className="input-group-text">
                                            <i className="bi bi-pencil-square"></i>
                                        </span>
                                        <input
                                            type="number"
                                            className="form-control form-control-lg"
                                            placeholder="Cevabınızı girin"
                                            onKeyUp={async (e) => {
                                                setAnswer(e.target.value);

                                                if (hubConnection && roomName && e.target.value == correctAnswer.toString()) {
                                                    console.log("cevap doğru");
                                                    await submitAnswer();
                                                }
                                            }}
                                        />
                                        <button
                                            className="btn btn-success btn-lg"
                                        // onClick={submitAnswer}
                                        >
                                            <i className="bi bi-check-lg"></i> Gönder
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {message && (
                                <div className="message-section">
                                    <div className={`alert ${message.includes("Kazandın") ? "alert-success" :
                                        message.includes("Kaybettiniz") ? "alert-danger" :
                                            "alert-info"
                                        } mb-0`}>
                                        <i className="bi bi-info-circle me-2"></i>
                                        {message}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default MathGame2