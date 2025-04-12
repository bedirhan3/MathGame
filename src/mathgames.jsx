import React, { useState, useEffect } from 'react';
import { HubConnectionBuilder } from '@microsoft/signalr';

function MathGame() {
    const [connection, setConnection] = useState(null);
    const [gameState, setGameState] = useState('initial'); // initial, waiting, playing, finished
    const [question, setQuestion] = useState({ num1: 0, num2: 0 });
    const [answer, setAnswer] = useState('');
    const [message, setMessage] = useState('');
    const [canAnswer, setCanAnswer] = useState(true);

    useEffect(() => {
        // SignalR bağlantısını kurma
        const newConnection = new HubConnectionBuilder()
            .withUrl("https://localhost:7061/chat")
            .withAutomaticReconnect()
            .build();

        setConnection(newConnection);

        // Event handlers
        newConnection.on("WaitingForOpponent", () => {
            setGameState('waiting');
            setMessage('Rakip bekleniyor...');
            // Soru ve cevabı sıfırla
            setQuestion({ num1: 0, num2: 0 });
            setAnswer('');
            setCanAnswer(true);
        });

        newConnection.on("OpponentFound", () => {
            setGameState('playing');
            setMessage('Rakip bulundu! Oyun başlıyor...');
        });

        newConnection.on("NewQuestion", (num1, num2) => {
            console.log("Yeni soru alındı:", num1, num2);
            setGameState('playing');
            setQuestion({ num1, num2 });
            setMessage('Çarpım sonucunu bul! Hızlı ol!');
            setAnswer('');
            setCanAnswer(true);
        });

        newConnection.on("OpponentAnswered", () => {
            setMessage('Rakip cevap verdi! Çok geç kaldın!');
            setCanAnswer(false);
        });

        newConnection.on("IncorrectAnswer", () => {
            setMessage('Yanlış cevap, rakibin cevap verme şansı var!');
            setCanAnswer(false);
        });

        newConnection.on("BothIncorrect", () => {
            setMessage('İkiniz de yanlış cevap verdiniz. Yeni soru geliyor!');
            setCanAnswer(true);
        });

        newConnection.on("GameOver", (result) => {
            setGameState('finished');
            setMessage(result);
            setCanAnswer(true);
        });

        // Bağlantıyı başlat
        newConnection.start()
            .then(() => {
                console.log("SignalR Bağlantısı kuruldu");
            })
            .catch(err => console.error('Bağlantı hatası:', err));

        return () => {
            if (newConnection) {
                newConnection.stop();
            }
        };
    }, []);

    const joinGame = async () => {
        try {
            await connection.invoke("JoinGame");
            setGameState('waiting');
        } catch (err) {
            console.error('Oyuna katılma hatası:', err);
        }
    };

    const submitAnswer = async () => {
        if (!answer || !canAnswer) {
            setMessage('Cevap veremezsiniz!');
            return;
        }

        try {
            await connection.invoke("SubmitAnswer", parseInt(answer));
        } catch (err) {
            console.error('Cevap gönderme hatası:', err);
            setMessage('Cevap gönderilirken bir hata oluştu!');
        }
    };

    return (
        <div className="math-game">
            <h2>Matematik Oyunu</h2>

            {gameState === 'initial' && (
                <button onClick={joinGame}>Oyuna Katıl</button>
            )}

            {gameState === 'waiting' && (
                <div>
                    <p>{message}</p>
                    <div className="loading-spinner"></div>
                </div>
            )}

            {gameState === 'playing' && (
                <div>
                    <p>{message}</p>
                    <div className="question">
                        {question.num1} × {question.num2} = ?
                    </div>
                    <input
                        type="number"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Cevabınızı girin"
                        disabled={!canAnswer}
                    />
                    <button onClick={submitAnswer} disabled={!canAnswer}>
                        Cevabı Gönder
                    </button>
                </div>
            )}

            {gameState === 'finished' && (
                <div>
                    <p>{message}</p>
                    <button onClick={joinGame}>Yeni Oyun</button>
                </div>
            )}
        </div>
    );
}

export default MathGame;
