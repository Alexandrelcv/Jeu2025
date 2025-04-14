// Base de données pour les jeux avec support IndexedDB et fallback localStorage
// Version simplifiée mais fiable

(function() {
    // Vérifier si IndexedDB est supporté
    const useIndexedDB = window.indexedDB !== undefined;
    
    // Constantes et configuration
    const DB_NAME = 'JeuxDB';
    const DB_VERSION = 1;
    const STORES = {
        TIC_TAC_TOE: 'ticTacToe',
        SNAKE: 'snake',
        RSP: 'rsp'
    };
    
    let dbPromise = null;
    
    // Initialiser la base de données immédiatement au chargement du script
    initDatabaseInternal();
    
    // Fonction interne d'initialisation
    function initDatabaseInternal() {
        // Si IndexedDB n'est pas supporté, on utilise localStorage
        if (!useIndexedDB) {
            console.log("IndexedDB non supporté, utilisation de localStorage");
            return Promise.resolve();
        }
        
        // Initialiser IndexedDB si ce n'est pas déjà fait
        if (!dbPromise) {
            dbPromise = new Promise((resolve, reject) => {
                const request = indexedDB.open(DB_NAME, DB_VERSION);
                
                request.onupgradeneeded = function(event) {
                    const db = event.target.result;
                    
                    // Créer les object stores s'ils n'existent pas
                    if (!db.objectStoreNames.contains(STORES.TIC_TAC_TOE)) {
                        db.createObjectStore(STORES.TIC_TAC_TOE);
                    }
                    if (!db.objectStoreNames.contains(STORES.SNAKE)) {
                        db.createObjectStore(STORES.SNAKE);
                    }
                    if (!db.objectStoreNames.contains(STORES.RSP)) {
                        db.createObjectStore(STORES.RSP);
                    }
                };
                
                request.onerror = function(event) {
                    console.error("Erreur d'ouverture de la base de données", event.target.error);
                    reject(event.target.error);
                };
                
                request.onsuccess = function(event) {
                    const db = event.target.result;
                    resolve(db);
                    
                    // Migrer les données de localStorage si nécessaire
                    migrateFromLocalStorage();
                };
            });
        }
        
        return dbPromise;
    }
    
    // Pour compatibilité, retourner simplement la promesse existante
    window.initDatabase = function() {
        return initDatabaseInternal();
    };
    
    // Fonction pour migrer les données de localStorage
    function migrateFromLocalStorage() {
        // Tic-Tac-Toe
        if (localStorage.getItem("ticTacToeScores")) {
            try {
                const scores = JSON.parse(localStorage.getItem("ticTacToeScores"));
                setData(STORES.TIC_TAC_TOE, "scores", scores);
            } catch (e) {
                console.error("Erreur lors de la migration des scores Tic-Tac-Toe", e);
            }
        }
        
        // Snake
        if (localStorage.getItem("snakeHighScore")) {
            try {
                const highScore = parseInt(localStorage.getItem("snakeHighScore"));
                setData(STORES.SNAKE, "highScore", { score: highScore });
            } catch (e) {
                console.error("Erreur lors de la migration du high score Snake", e);
            }
        }
        
        // RSP
        if (localStorage.getItem("rspScores")) {
            try {
                const scores = JSON.parse(localStorage.getItem("rspScores"));
                setData(STORES.RSP, "scores", scores);
            } catch (e) {
                console.error("Erreur lors de la migration des scores RSP", e);
            }
        }
    }
    
    // Fonction générique pour récupérer des données
    function getData(storeName, key) {
        // Si IndexedDB n'est pas supporté, utiliser localStorage
        if (!useIndexedDB) {
            if (storeName === STORES.TIC_TAC_TOE && key === "scores") {
                const data = localStorage.getItem("ticTacToeScores");
                return Promise.resolve(data ? JSON.parse(data) : { playerX: 0, playerO: 0 });
            } else if (storeName === STORES.SNAKE && key === "highScore") {
                const score = localStorage.getItem("snakeHighScore") || "0";
                return Promise.resolve({ score: parseInt(score) });
            } else if (storeName === STORES.RSP && key === "scores") {
                const data = localStorage.getItem("rspScores");
                return Promise.resolve(data ? JSON.parse(data) : { player: 0, computer: 0, streak: 0, maxStreak: 0 });
            }
            return Promise.resolve(null);
        }
        
        return dbPromise.then(db => {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(storeName, 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.get(key);
                
                request.onsuccess = function() {
                    resolve(request.result);
                };
                
                request.onerror = function(event) {
                    console.error('Erreur lors de la récupération de données', event.target.error);
                    reject(event.target.error);
                };
            });
        }).catch(error => {
            console.error('Erreur avec la base de données', error);
            return null;
        });
    }
    
    // Fonction générique pour stocker des données
    function setData(storeName, key, value) {
        // Si IndexedDB n'est pas supporté, utiliser localStorage
        if (!useIndexedDB) {
            if (storeName === STORES.TIC_TAC_TOE && key === "scores") {
                localStorage.setItem("ticTacToeScores", JSON.stringify(value));
                return Promise.resolve(value);
            } else if (storeName === STORES.SNAKE && key === "highScore") {
                localStorage.setItem("snakeHighScore", value.score.toString());
                return Promise.resolve(value);
            } else if (storeName === STORES.RSP && key === "scores") {
                localStorage.setItem("rspScores", JSON.stringify(value));
                return Promise.resolve(value);
            }
            return Promise.resolve(null);
        }
        
        return dbPromise.then(db => {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.put(value, key);
                
                request.onsuccess = function() {
                    resolve(value);
                };
                
                request.onerror = function(event) {
                    console.error('Erreur lors du stockage de données', event.target.error);
                    reject(event.target.error);
                };
            });
        }).catch(error => {
            console.error('Erreur avec la base de données', error);
            return null;
        });
    }
    
    // Fonctions pour Tic-Tac-Toe
    window.getTicTacToeScores = function(callback) {
        getData(STORES.TIC_TAC_TOE, "scores")
            .then(scores => {
                if (!scores) {
                    scores = { playerX: 0, playerO: 0 };
                    setData(STORES.TIC_TAC_TOE, "scores", scores);
                }
                callback(scores);
            })
            .catch(error => {
                console.error('Erreur lors de la récupération des scores Tic-Tac-Toe', error);
                callback({ playerX: 0, playerO: 0 });
            });
    };
    
    window.updateTicTacToeScore = function(winner, callback) {
        getData(STORES.TIC_TAC_TOE, "scores")
            .then(scores => {
                if (!scores) {
                    scores = { playerX: 0, playerO: 0 };
                }
                
                if (winner === "X") {
                    scores.playerX += 1;
                } else if (winner === "O") {
                    scores.playerO += 1;
                }
                
                return setData(STORES.TIC_TAC_TOE, "scores", scores).then(() => scores);
            })
            .then(scores => {
                if (callback) callback(scores);
            })
            .catch(error => {
                console.error('Erreur lors de la mise à jour des scores Tic-Tac-Toe', error);
                if (callback) callback({ playerX: 0, playerO: 0 });
            });
    };
    
    // Fonctions pour Snake
    window.getSnakeHighScore = function(callback) {
        getData(STORES.SNAKE, "highScore")
            .then(data => {
                const highScore = data ? data.score : 0;
                callback(highScore);
            })
            .catch(error => {
                console.error('Erreur lors de la récupération du high score Snake', error);
                callback(0);
            });
    };
    
    window.updateSnakeHighScore = function(score, callback) {
        getData(STORES.SNAKE, "highScore")
            .then(data => {
                const currentHighScore = data ? data.score : 0;
                
                if (score > currentHighScore) {
                    return setData(STORES.SNAKE, "highScore", { score: score })
                        .then(() => {
                            if (callback) callback(true, score);
                            return true;
                        });
                } else {
                    if (callback) callback(false, currentHighScore);
                    return false;
                }
            })
            .catch(error => {
                console.error('Erreur lors de la mise à jour du high score Snake', error);
                if (callback) callback(false, 0);
            });
    };
    
    // Fonctions pour RSP
    window.getRSPScores = function(callback) {
        getData(STORES.RSP, "scores")
            .then(scores => {
                if (!scores) {
                    scores = { player: 0, computer: 0, streak: 0, maxStreak: 0 };
                    setData(STORES.RSP, "scores", scores);
                }
                callback(scores);
            })
            .catch(error => {
                console.error('Erreur lors de la récupération des scores RSP', error);
                callback({ player: 0, computer: 0, streak: 0, maxStreak: 0 });
            });
    };
    
    window.updateRSPScore = function(winner, callback) {
        getData(STORES.RSP, "scores")
            .then(scores => {
                if (!scores) {
                    scores = { player: 0, computer: 0, streak: 0, maxStreak: 0 };
                }
                
                if (winner === "player") {
                    scores.player += 1;
                    scores.streak += 1;
                    if (scores.streak > scores.maxStreak) {
                        scores.maxStreak = scores.streak;
                    }
                } else if (winner === "computer") {
                    scores.computer += 1;
                    scores.streak = 0;
                }
                
                return setData(STORES.RSP, "scores", scores).then(() => scores);
            })
            .then(scores => {
                if (callback) callback(scores);
            })
            .catch(error => {
                console.error('Erreur lors de la mise à jour des scores RSP', error);
                if (callback) callback({ player: 0, computer: 0, streak: 0, maxStreak: 0 });
            });
    };
    
    // Fonction pour récupérer toutes les statistiques
    window.getAllGameStats = function(callback) {
        const stats = {};
        let completed = 0;
        
        // Tic-Tac-Toe
        window.getTicTacToeScores(function(scores) {
            stats.ticTacToe = scores;
            checkComplete();
        });
        
        // Snake
        window.getSnakeHighScore(function(highScore) {
            stats.snake = { highScore: highScore };
            checkComplete();
        });
        
        // RSP
        window.getRSPScores(function(scores) {
            stats.rsp = scores;
            checkComplete();
        });
        
        function checkComplete() {
            completed++;
            if (completed === 3) {
                callback(stats);
            }
        }
    };
})();