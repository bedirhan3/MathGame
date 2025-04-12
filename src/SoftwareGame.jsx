import React, { useState, useEffect } from 'react'
import './SoftwareGame.css'
import { BsPerson, BsLock } from 'react-icons/bs'
import { HubConnectionBuilder } from '@microsoft/signalr'

function SoftwareGame() {
    const [hubConnection, setHubConnection] = useState(null);
    const [username, setUsername] = useState('ahmet-akın')
    const [password, setPassword] = useState('123')
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [selectedTeam, setSelectedTeam] = useState(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const [oldActivePlayer, setOldActivePlayer] = useState({})
    const [teams, setTeams] = useState([
        { id: 1, fullname: 'Murat', players: [] },
        { id: 2, fullname: 'Erhan', players: [] },
        { id: 3, fullname: 'Eren', players: [] },
        { id: 4, fullname: 'Ege', players: [] },
        { id: 5, fullname: 'Eray', players: [] }
    ])
    const [currentQuestion, setCurrentQuestion] = useState({
        question: "     ",
        options: ["6, 5", "5, 5", "6, 6", "5, 6"],
        correctAnswer: "6, 5"
    })
    const [gameStarted, setGameStarted] = useState(false)

    useEffect(() => {
        const newConnection = new HubConnectionBuilder()
            .withUrl("https://localhost:7061/chat")
            .withAutomaticReconnect()
            .build();

        setHubConnection(newConnection);

        newConnection.on("UserConnected", (message) => {
            console.log(message);
        });
        newConnection.on("UserDisconnected", (key) => {
            debugger;
            let editedKey = key.split(",")[0].split(":")[1];
            const team = teams.find(t => 
                t.player.some(player => player === oldPlayer[key].group)
              );            let deleted = team.players.indexOf(editedKey)
            team.players.splice(deleted,1);
        });

        newConnection.on("UserLogin", (teamName, username, oldPlayer) => {
            console.log("UserLogin triggered");
            if (teamName !== "Kullanıcı bulunamadı") {
                console.log("Team Name: " + teamName + "\nUsername: " + username);

                if (!oldPlayer || Object.keys(oldPlayer).length === 0) {
                    console.log("Old Player is empty");
                    return;
                }
        
                for (let key in oldPlayer) {
                    let editedKey = key.split(",")[0].split(":")[1];
                    console.log("Processing key:", key);
                    const team = teams.find(t => t.fullname === oldPlayer[key].group);
                    if (oldPlayer[key].connection != "disc") {
                        if (!team) {
                            console.log("Team not found for:", oldPlayer[key].group);
                            continue;
                        }
                        if (!team.players.includes(editedKey)) {
                            team.players.push(editedKey);
                            console.log(editedKey + " eklendi");
                        } else {
                            console.log(editedKey + " eklenmedi");
                        }
                    }
                    else if (oldPlayer[key].connection === "disc") {
                        if (team && team.players.includes(editedKey)) {
                            let deletedIndex = team.players.indexOf(editedKey);
                            if (deletedIndex !== -1) {
                                team.players.splice(deletedIndex, 1);
                                console.log(editedKey + " silindi");
                            }
                        } else {
                           console.log("Silinecek oyuncu bulunamadı ya da team null");
                        }
                    }

                }
        
                console.log("For loop completed");
        
                const team = teams.find(t => t.fullname === teamName);
                if (!team) {
                    console.log("Selected team not found for:", teamName);
                    return;
                }
        
                setSelectedTeam(team);
                console.log("Selected team set");
        
                setIsLoggedIn(true);
                console.log("Login status updated");
            }
        });

        newConnection.start()
            .then(() => console.log("SignalR Bağlantısı kuruldu"))
            .catch(err => console.error('Bağlantı hatası:', err));

        return () => {
            if (newConnection) {
                newConnection.stop();
            }
        };
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault()
        if (username && password) {
            await hubConnection.invoke("JoinGame", username, password)
        } else {
            alert('Please enter username and password')
        }
    }

    const handleAnswerSelect = (index) => {
        // Answer selection logic here
        console.log("Selected answer index:", index);
    }

    if (!isLoggedIn) {
        return (
            <div className="software-game-container">
                <div className="login-container">
                    <h2 className="mb-4">
                        <i className="bi bi-code-square me-2"></i>
                        Software Game
                    </h2>
                    <form onSubmit={handleLogin}>
                        <div className="login-form-group">
                            <label className="d-flex align-items-center">
                                <BsPerson className="me-2" /> Username
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter username"
                            />
                        </div>
                        <div className="login-form-group">
                            <label className="d-flex align-items-center">
                                <BsLock className="me-2" /> Password
                            </label>
                            <input
                                type="password"
                                className="form-control"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password"
                            />
                        </div>
                        <button type="submit" className="login-btn">
                            <i className="bi bi-box-arrow-in-right me-2"></i>
                            Login
                        </button>
                    </form>
                </div>
            </div>
        )
    }

    return (
        <div className="software-game-container">
            <div className="game-layout">
                {/* Sidebar */}
                <div className="sidebar">
                    <h3 className="sidebar-title">
                        <i className="fas fa-users me-2"></i>
                        Teams
                    </h3>
                    <div className="teams-list">
                        {teams.map(team => (
                            <div
                                key={team.id}
                                className={`team-item ${selectedTeam?.id === team.id ? 'active' : ''}`}
                                onClick={() => setSelectedTeam(team)}
                            >
                                <i className="fas fa-user-friends me-2"></i>
                                {team.fullname}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="main-content">
                    <div className="row">
                        {/* Team Players Section */}
                        <div className="col-md-4">
                            <div className="players-section">
                                <h4 className="section-title">
                                    <i className="fas fa-users me-2"></i>
                                    {selectedTeam ? `${selectedTeam.fullname} Players` : 'Select a Team'}
                                </h4>
                                {selectedTeam && (
                                    <div className="players-list">
                                        {selectedTeam.players.map((player, index) => (
                                            <div key={index} className="player-card text-capitalize">
                                                <i className="fas fa-user-circle me-2"></i>
                                                {player.split('-')[0] + " " + player.split('-')[1]}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Question Section */}
                        <div className="col-md-8">
                            <div className="question-section">
                                {!gameStarted ? (
                                    <div className="game-waiting">
                                        <div className="waiting-content">
                                            <i className="fas fa-hourglass-half waiting-icon"></i>
                                            <h2>Game Starting Soon!</h2>
                                            <p>Oyun başlamak üzere, lütfen bekleyiniz...</p>
                                            <div className="waiting-info">
                                                <div className="info-item">
                                                    <i className="fas fa-users"></i>
                                                    <span>Waiting for players...</span>
                                                </div>
                                                <div className="info-item">
                                                    <i className="fas fa-clock"></i>
                                                    <span>Duration: 30 mins</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="question-header">
                                            <h4 className="section-title">
                                                <i className="fas fa-code me-2"></i>
                                                Coding Challenge
                                            </h4>
                                            <div className="timer">
                                                <i className="fas fa-clock me-2"></i>
                                                Time Left: 2:30
                                            </div>
                                        </div>
                                        <div className="question-card">
                                            <div className="question-info">
                                                <span className="question-number">Question #1</span>
                                                <span className="question-points">Points: 100</span>
                                            </div>
                                            <pre className="question-code">
                                                {currentQuestion.question}
                                            </pre>
                                            <div className="options-container">
                                                {currentQuestion.options.map((option, index) => (
                                                    <button
                                                        key={index}
                                                        className="option-btn"
                                                        onClick={() => handleAnswerSelect(index)}
                                                    >
                                                        <span className="option-letter">
                                                            {String.fromCharCode(65 + index)}
                                                        </span>
                                                        {option}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {username == "bedirhan-damar" ? (<div className='row d-flex flex-row-reverse me-2 py-5'>
                        <button type='button' className='btn btn-success w-25'>Start Game</button>
                    </div>) : null}
                </div>
            </div>
        </div>
    )
}

export default SoftwareGame