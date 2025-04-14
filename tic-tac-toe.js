document.addEventListener('DOMContentLoaded', function() {
    // Initialiser la base de données pour stocker les scores de jeu
    initDatabase();
    
    // Démarrer le jeu de morpion (Tic-Tac-Toe)
    startTicTacToe();
});

// Initialiser la base de données
function initDatabase() {
    // Vérifier si localStorage est pris en charge
    if (typeof(Storage) === "undefined") {
        console.error("localStorage n'est pas pris en charge par votre navigateur !");
        return;
    }
    
    // Initialiser les scores dans localStorage s'ils n'existent pas
    if (localStorage.getItem("ticTacToeScores") === null) {
        const scores = {
            playerX: 0,
            playerO: 0
        };
        localStorage.setItem("ticTacToeScores", JSON.stringify(scores));
    }
    
    // Mettre à jour l'affichage des scores
    updateScoreDisplay();
}

// Mettre à jour l'affichage des scores à partir de localStorage
function updateScoreDisplay() {
    const scores = JSON.parse(localStorage.getItem("ticTacToeScores"));
    document.getElementById("score-x").textContent = scores.playerX;
    document.getElementById("score-o").textContent = scores.playerO;
}

// Fonction pour mettre à jour le score dans localStorage
function updateScore(winner) {
    const scores = JSON.parse(localStorage.getItem("ticTacToeScores"));
    
    if (winner === "X") {
        scores.playerX += 1;
    } else if (winner === "O") {
        scores.playerO += 1;
    }
    
    localStorage.setItem("ticTacToeScores", JSON.stringify(scores));
    updateScoreDisplay();
}

function startTicTacToe() {
    const board = document.getElementById("game-container");
    const statusDisplay = document.getElementById("game-status");
    const resetButton = document.getElementById("reset-game");
    
    board.style.display = "grid";
    board.style.gridTemplateColumns = "repeat(3, 100px)";
    
    let gameState = ["", "", "", "", "", "", "", "", ""];
    let currentPlayer = "X";
    let gameActive = true;
    let winningCells = [];
    
    // Créer les cases du plateau de jeu
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.setAttribute("data-cell-index", i);
        cell.addEventListener("click", () => handleCellClick(cell));
        
        // Ajouter un effet de survol pour afficher le symbole du joueur actuel
        cell.addEventListener("mouseenter", () => {
            if (gameState[i] === "" && gameActive) {
                cell.innerHTML = `<span style="opacity: 0.3">${currentPlayer}</span>`;
            }
        });
        
        cell.addEventListener("mouseleave", () => {
            if (gameState[i] === "") {
                cell.innerHTML = "";
            }
        });
        
        board.appendChild(cell);
    }
    
    // Fonction pour gérer les clics sur une case
    function handleCellClick(clickedCell) {
        const cellIndex = parseInt(clickedCell.getAttribute("data-cell-index"));
        
        // Vérifier si la case est déjà jouée ou si le jeu est terminé
        if (gameState[cellIndex] !== "" || !gameActive) {
            return;
        }
        
        // Mettre à jour l'état du jeu avec le symbole du joueur actuel
        gameState[cellIndex] = currentPlayer;
        clickedCell.innerHTML = currentPlayer;
        
        // Ajouter une petite animation au symbole placé
        clickedCell.classList.add("placed");
        setTimeout(() => {
            clickedCell.classList.remove("placed");
        }, 300);
        
        // Vérifier si quelqu’un a gagné ou si le jeu est un match nul
        if (checkWinner()) {
            statusDisplay.innerHTML = `<span class="result-animation result-win">Joueur ${currentPlayer} a gagné !</span>`;
            statusDisplay.classList.add("winner");
            gameActive = false;
            updateScore(currentPlayer);
            
            // Mettre en surbrillance les cases gagnantes
            highlightWinningCells();
            return;
        }
        
        if (isDraw()) {
            statusDisplay.innerHTML = `<span class="result-animation result-draw">Match nul !</span>`;
            gameActive = false;
            return;
        }
        
        // Changer de joueur
        currentPlayer = currentPlayer === "X" ? "O" : "X";
        statusDisplay.textContent = `Au tour du joueur ${currentPlayer}`;
    }
    
    // Fonction pour mettre en surbrillance les cases gagnantes
    function highlightWinningCells() {
        const cells = document.querySelectorAll(".cell");
        winningCells.forEach(index => {
            cells[index].classList.add("winner");
        });
    }
    
    // Fonction pour vérifier s’il y a un gagnant
    function checkWinner() {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],  // lignes
            [0, 3, 6], [1, 4, 7], [2, 5, 8],  // colonnes
            [0, 4, 8], [2, 4, 6]              // diagonales
        ];
        
        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (gameState[a] && gameState[a] === gameState[b] && gameState[b] === gameState[c]) {
                winningCells = pattern;
                return true;
            }
        }
        
        return false;
    }
    
    // Fonction pour vérifier si la partie est un match nul
    function isDraw() {
        return gameState.every(cell => cell !== "");
    }
    
    // Fonction pour réinitialiser la partie
    function resetGame() {
        // Ajouter un petit délai pour une meilleure transition
        if (!gameActive) {
            statusDisplay.classList.remove("winner");
            
            // Supprimer la surbrillance des cases gagnantes
            if (winningCells.length > 0) {
                const cells = document.querySelectorAll(".cell");
                winningCells.forEach(index => {
                    cells[index].classList.remove("winner");
                });
                winningCells = [];
            }
        }
        
        gameState = ["", "", "", "", "", "", "", "", ""];
        currentPlayer = "X";
        gameActive = true;
        statusDisplay.textContent = `Au tour du joueur ${currentPlayer}`;
        
        // Effacer les cases avec un effet fondu
        document.querySelectorAll(".cell").forEach(cell => {
            cell.classList.add("fade-out");
            setTimeout(() => {
                cell.innerHTML = "";
                cell.classList.remove("fade-out");
            }, 200);
        });
    }
    
    // Ajouter un écouteur d’événement au bouton de réinitialisation
    resetButton.addEventListener("click", resetGame);
    
    // Ajouter des raccourcis clavier
    document.addEventListener("keydown", function(event) {
        // Appuyer sur 'R' pour réinitialiser la partie
        if (event.key === "r" || event.key === "R") {
            resetGame();
        }
        
        // Appuyer sur 'Échap' pour revenir au menu
        if (event.key === "Escape") {
            window.location.href = 'game.html';
        }
        
        // Touches numériques 1-9 pour jouer (disposition du pavé numérique)
        const numpadMapping = {
            "7": 0, "8": 1, "9": 2,
            "4": 3, "5": 4, "6": 5,
            "1": 6, "2": 7, "3": 8
        };
        
        if (gameActive && numpadMapping[event.key] !== undefined) {
            const cellIndex = numpadMapping[event.key];
            if (gameState[cellIndex] === "") {
                const cells = document.querySelectorAll(".cell");
                handleCellClick(cells[cellIndex]);
            }
        }
    });
}

// Ajouter ces styles pour prendre en charge les nouvelles fonctionnalités
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = `
        .cell.placed {
            transform: scale(1.2);
            transition: transform 0.2s;
        }
        
        .cell.fade-out {
            opacity: 0;
            transition: opacity 0.2s;
        }
        
        .button-group {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            margin-top: 1.5rem;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        .winner {
            animation: pulse 1s infinite;
        }
    `;
    document.head.appendChild(style);
});
