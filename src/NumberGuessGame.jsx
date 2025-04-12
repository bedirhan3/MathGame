import React, { useState, useEffect } from 'react';
import * as signalR from "@microsoft/signalr";
import './NumberGuessGame.css';

function NumberGuessGame() {
    const [hubConnection, setHubConnection] = useState(null);
    const [roomName, setRoomName] = useState('');
    const [message, setMessage] = useState('');
    const [guess, setGuess] = useState('');
    const [targetNumber, setTargetNumber] = useState(null);
    const [proximity, setProximity] = useState(0);
    const [scores, setScores] = useState({});
    const [isJoined, setIsJoined] = useState(false);
    const [isWaiting, setIsWaiting] = useState(true);
    const [waitingMessage, setWaitingMessage] = useState('');
    const [playerGuesses, setPlayerGuesses] = useState({});
    const [hasGuessedThisRound, setHasGuessedThisRound] = useState(false);

    const REQUIRED_PLAYERS = 3;

    useEffect(() => {
        const connection = new signalR.HubConnectionBuilder()
            // .withUrl("http://192.168.43.41:5000/chat") //REDMİ TEL
            .withUrl("http://10.0.28.107:5000/chat") //İBBWİFİ
            .withAutomaticReconnect()
            .build();

        connection.start()
            .then(() => {
                console.log("Connected!");
                setHubConnection(connection);
            })
            .catch(err => console.error("Connection failed: ", err));

        connection.on("ReceiveMessage", (sender, message) => {
            setMessage(message);

            // Parse the scores table if present
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

            // Parse player guesses if present
            if (message.includes("Bu turdaki tahminler:")) {
                const guessesObj = {};
                message.split('\n').slice(1).forEach(line => {
                    if (line && !line.includes("Doğru cevap")) {
                        const [id, guessValue] = line.split(': ');
                        guessesObj[id] = parseInt(guessValue);
                    }
                });
                setPlayerGuesses(guessesObj);
            }

            // Reset guess state for new round
            if (message.includes("Yeni tur başladı") ||
                message.includes("Yeni tur başlıyor") ||
                message.includes("doğru tahmin etti")) {
                setHasGuessedThisRound(false);
                setPlayerGuesses({});
                setGuess('');
                setProximity(0);
            }
        });

        connection.on("TargetNumber", (number) => {
            setTargetNumber(number);
        });

        connection.on("GuessProximity", (proximityPercentage) => {
            setProximity(proximityPercentage);
        });

        connection.on("WaitingStatus", (waiting, statusMessage) => {
            setIsWaiting(waiting);
            setWaitingMessage(statusMessage);
        });

        connection.on("UpdatePlayerCount", (playerCount, players) => {
            console.log("Player count updated:", playerCount);
            console.log("Players:", players);

            // Scores objesini güncelle
            const newScores = {};
            players.forEach(player => {
                newScores[player] = 0;
            });
            setScores(newScores);

            // Yeterli oyuncu varsa bekleme durumunu kaldır
            setIsWaiting(playerCount < REQUIRED_PLAYERS);
            setWaitingMessage(`${playerCount}/${REQUIRED_PLAYERS} oyuncu bağlandı`);
        });

        connection.on("NewRound", () => {
            setHasGuessedThisRound(false);
            setPlayerGuesses({});
            setGuess('');
            setProximity(0);
        });

        connection.on("UpdateGuesses", (guesses) => {
            setPlayerGuesses(guesses);
        });

        return () => {
            if (connection) {
                connection.stop();
            }
        };
    }, []);

    const joinRoom = async () => {
        if (hubConnection && roomName) {
            try {
                // Odaya katılmadan önce mevcut oyuncu sayısını kontrol et
                const currentPlayers = await hubConnection.invoke("GetCurrentPlayers", roomName);
                if (currentPlayers >= REQUIRED_PLAYERS) {
                    setMessage("Bu oda dolu!");
                    return;
                }

                await hubConnection.invoke("JoinRoom", roomName);
                setIsJoined(true);

                // Odaya katıldıktan sonra oyuncu sayısını güncelle
                await hubConnection.invoke("UpdateRoomPlayers", roomName);
            } catch (error) {
                console.error("Error joining room:", error);
                setMessage("Odaya katılırken bir hata oluştu.");
            }
        }
    };

    const submitGuess = async () => {
        if (hubConnection && roomName && guess && !hasGuessedThisRound && !isWaiting) {
            await hubConnection.invoke("MakeGuess", roomName, parseInt(guess));
            setGuess('');
            setHasGuessedThisRound(true);
        }
    };

    // Calculate how many players have guessed this round
    const getGuessCount = () => {
        return Object.keys(playerGuesses).length;
    };

    // Calculate how many players total are in the game
    const getPlayerCount = () => {
        return Object.keys(scores).length;
    };

    return (
        <div className="game-container">
            <div className="glass-container p-4">
                <h1 className="text-center mb-4">
                    <i className="bi bi-puzzle"></i> Number Guessing Game
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
                                <div className="col-md-4" key={playerId}>
                                    <div className={`player-card glass-card ${playerGuesses[playerId] ? 'has-guessed' : ''}`}>
                                        <div className="d-flex align-items-center">
                                            <div className="player-avatar">
                                                <i className="bi bi-person-circle"></i>
                                                <span className={`player-status ${playerGuesses[playerId] ? 'active' : ''}`}></span>
                                            </div>
                                            <div className="player-info">
                                                <h5 className="mb-0">Oyuncu {index + 1}</h5>
                                                <div className="score-badge">
                                                    <i className="bi bi-star-fill"></i>
                                                    <span>{score}</span>
                                                </div>
                                                {playerGuesses[playerId] && (
                                                    <div className="guess-badge">
                                                        <i className="bi bi-check-circle-fill"></i>
                                                        <span>Tahmin Yapıldı</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {isWaiting ? (
                            <div className="waiting-screen glass-card text-center p-5">
                                <div className="spinner-border text-primary mb-4" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <h3 className="mb-3">Oyuncular Bekleniyor</h3>
                                <p className="lead mb-0">{waitingMessage || `${Object.keys(scores).length}/${REQUIRED_PLAYERS} oyuncu bağlandı`}</p>
                                <p className="mt-3">Oyun başlamak için 3 oyuncu gerekiyor.</p>
                            </div>
                        ) : (
                            <div className="game-board glass-card">
                                <div className="guess-section">
                                    <h3 className="mb-4">Sayıyı Tahmin Et!</h3>

                                    <div className="guess-status mb-4">
                                        <div className="progress" style={{ height: '2rem' }}>
                                            <div
                                                className="progress-bar bg-info"
                                                role="progressbar"
                                                style={{ width: `${(getGuessCount() / getPlayerCount()) * 100}%` }}
                                                aria-valuenow={getGuessCount()}
                                                aria-valuemin="0"
                                                aria-valuemax={getPlayerCount()}
                                            >
                                                {getGuessCount()}/{getPlayerCount()} Oyuncu Tahmin Yaptı
                                            </div>
                                        </div>
                                    </div>

                                    {hasGuessedThisRound ? (
                                        <div className="alert alert-info">
                                            <i className="bi bi-info-circle me-2"></i>
                                            Bu tur için tahmininizi yaptınız. Diğer oyuncuların tahminlerini bekliyorsunuz.
                                        </div>
                                    ) : (
                                        <>
                                            <div className="progress mb-4" style={{ height: '2rem' }}>
                                                <div
                                                    className="progress-bar bg-success"
                                                    role="progressbar"
                                                    style={{ width: `${proximity}%` }}
                                                    aria-valuenow={proximity}
                                                    aria-valuemin="0"
                                                    aria-valuemax="100"
                                                >
                                                    {proximity}% Yakın
                                                </div>
                                            </div>

                                            <div className="input-group">
                                                <span className="input-group-text">
                                                    <i className="bi bi-123"></i>
                                                </span>
                                                <input
                                                    type="number"
                                                    className="form-control form-control-lg"
                                                    placeholder="1-100 arası tahmininizi girin"
                                                    value={guess}
                                                    onChange={(e) => setGuess(e.target.value)}
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter') {
                                                            submitGuess();
                                                        }
                                                    }}
                                                />
                                                <button
                                                    className="btn btn-success btn-lg"
                                                    onClick={submitGuess}
                                                >
                                                    <i className="bi bi-check-lg"></i> Tahmin Et
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {message && (
                                    <div className="message-section mt-4">
                                        <div className={`alert ${message.includes("Kazandınız") || message.includes("Tebrikler") ? "alert-success" :
                                            message.includes("Kaybettiniz") ? "alert-danger" :
                                                "alert-info"
                                            } mb-0`}>
                                            <i className="bi bi-info-circle me-2"></i>
                                            {message}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default NumberGuessGame;