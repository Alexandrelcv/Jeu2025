document.addEventListener('DOMContentLoaded', function() {
    // Initialize database for storing game scores
    initDatabase();
    
    // Start the Tic-Tac-Toe game
    startTicTacToe();
});

// Initialize the database
function initDatabase() {
    // Check if localStorage is supported
    if (typeof(Storage) === "undefined") {
        console.error("localStorage is not supported by your browser!");
        return;
    }
    
    // Initialize scores in localStorage if they don't exist
    if (localStorage.getItem("ticTacToeScores") === null) {
        const scores = {
            playerX: 0,
            playerO: 0
        };
        localStorage.setItem("ticTacToeScores", JSON.stringify(scores));
    }
    
    // Update the score display
    updateScoreDisplay();
}

// Update score display from localStorage
function updateScoreDisplay() {
    const scores = JSON.parse(localStorage.getItem("ticTacToeScores"));
    document.getElementById("score-x").textContent = scores.playerX;
    document.getElementById("score-o").textContent = scores.playerO;
}

// Function to update the score in localStorage
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
    
    // Create the game board cells
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.setAttribute("data-cell-index", i);
        cell.addEventListener("click", () => handleCellClick(cell));
        
        // Add hover effect to show current player's mark
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
    
    // Function to handle cell clicks
    function handleCellClick(clickedCell) {
        const cellIndex = parseInt(clickedCell.getAttribute("data-cell-index"));
        
        // Check if cell is already played or game is not active
        if (gameState[cellIndex] !== "" || !gameActive) {
            return;
        }
        
        // Update the game state with the current player's mark
        gameState[cellIndex] = currentPlayer;
        clickedCell.innerHTML = currentPlayer;
        
        // Add a little animation to the placed mark
        clickedCell.classList.add("placed");
        setTimeout(() => {
            clickedCell.classList.remove("placed");
        }, 300);
        
        // Check if someone won or the game is a draw
        if (checkWinner()) {
            statusDisplay.innerHTML = `<span class="result-animation result-win">Player ${currentPlayer} wins!</span>`;
            statusDisplay.classList.add("winner");
            gameActive = false;
            updateScore(currentPlayer);
            
            // Highlight the winning cells
            highlightWinningCells();
            return;
        }
        
        if (isDraw()) {
            statusDisplay.innerHTML = `<span class="result-animation result-draw">Game ended in a draw!</span>`;
            gameActive = false;
            return;
        }
        
        // Switch players
        currentPlayer = currentPlayer === "X" ? "O" : "X";
        statusDisplay.textContent = `Player ${currentPlayer}'s turn`;
    }
    
    // Function to highlight winning cells
    function highlightWinningCells() {
        const cells = document.querySelectorAll(".cell");
        winningCells.forEach(index => {
            cells[index].classList.add("winner");
        });
    }
    
    // Function to check for a winner
    function checkWinner() {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],  // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8],  // columns
            [0, 4, 8], [2, 4, 6]              // diagonals
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
    
    // Function to check if the game is a draw
    function isDraw() {
        return gameState.every(cell => cell !== "");
    }
    
    // Function to reset the game
    function resetGame() {
        // Add a small delay to allow for better transition
        if (!gameActive) {
            statusDisplay.classList.remove("winner");
            
            // Clear winning cells highlight
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
        statusDisplay.textContent = `Player ${currentPlayer}'s turn`;
        
        // Clear cells with a fade effect
        document.querySelectorAll(".cell").forEach(cell => {
            cell.classList.add("fade-out");
            setTimeout(() => {
                cell.innerHTML = "";
                cell.classList.remove("fade-out");
            }, 200);
        });
    }
    
    // Add event listener to reset button
    resetButton.addEventListener("click", resetGame);
    
    // Add keyboard shortcuts
    document.addEventListener("keydown", function(event) {
        // Press 'R' to reset the game
        if (event.key === "r" || event.key === "R") {
            resetGame();
        }
        
        // Press 'Esc' to go back to the menu
        if (event.key === "Escape") {
            window.location.href = 'game.html';
        }
        
        // Number keys 1-9 to make moves (numpad layout)
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

// Add these styles to support the new features
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