// Quand le DOM est complètement chargé, on initialise les éléments essentiels du jeu.
document.addEventListener('DOMContentLoaded', function() {
     // Ajoute dynamiquement les styles CSS au document pour personnaliser l'apparence du jeu
    addStyles();
    
    initDatabase();
    
    // Set up event listeners
    setupGame();
});

//Fonction qui ajoute dynamiquement les styles CSS nécessaires pour l'affichage du jeu
function addStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .battle-arena {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 1.5rem 0;
            padding: 1rem;
            background-color: var(--gray-light);
            border-radius: var(--border-radius);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            min-height: 120px;
        }
        
        .player-side, .computer-side {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 40%;
        }
        
        .player-avatar, .computer-avatar {
            background-color: var(--primary-color);
            color: white;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .versus {
            font-weight: 700;
            font-size: 1.2rem;
            color: var(--accent-color);
        }
        
        .choice-display {
            font-size: 3rem;
            min-height: 60px;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .choice-label {
            display: block;
            margin-top: 0.5rem;
            font-size: 0.8rem;
            color: var(--gray-dark);
        }
        
        .choice {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .streak-container {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            margin: 1rem 0;
            padding: 0.5rem;
            border-radius: var(--border-radius);
            background-color: var(--gray-light);
        }
        
        .streak-label {
            font-size: 0.9rem;
            color: var(--gray-dark);
        }
        
        .streak-counter {
            font-weight: 700;
            font-size: 1.2rem;
            color: var(--primary-color);
        }
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        .shake {
            animation: shake 0.5s ease-in-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .fade-in {
            animation: fadeIn 0.3s ease-in-out;
        }
        
        .button-group {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            margin-top: 1rem;
        }
        
        .selected {
            background-color: var(--success-color);
            transform: scale(1.1);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        
        .winner-highlight {
            box-shadow: 0 0 15px var(--success-color);
            animation: pulse 1s infinite;
        }
        
        .loser-highlight {
            opacity: 0.7;
        }
        
        @keyframes countdown {
            0% { transform: scale(1.5); opacity: 0; }
            20% { transform: scale(1); opacity: 1; }
            80% { transform: scale(1); opacity: 1; }
            100% { transform: scale(0.5); opacity: 0; }
        }
        
        .countdown {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 3rem;
            font-weight: 700;
            color: var(--accent-color);
            z-index: 10;
            animation: countdown 1s ease-in-out;
        }
    `;
    document.head.appendChild(style);// Injecte les styles dans la tête du document HTML
}

// Fonction pour initialiser les données du jeu dans localStorage si elles n'existent pas
function initDatabase() {
    if (typeof(Storage) === "undefined") {
        console.error("localStorage is not supported by your browser!");
        return;
    }
    
    // Initialise les score s'ils n'ont pas encore été enregistrés
    if (localStorage.getItem("rspScores") === null) {
        const scores = {
            player: 0,
            computer: 0,
            streak: 0,
            maxStreak: 0
        };
        localStorage.setItem("rspScores", JSON.stringify(scores));
    }
    
    updateScoreDisplay();
}

// Fonction pour afficher les scores actuels du joueur et de l'ordinateur
function updateScoreDisplay() {
    const scores = JSON.parse(localStorage.getItem("rspScores"));
    document.getElementById("player-score").textContent = scores.player;
    document.getElementById("computer-score").textContent = scores.computer;
    document.getElementById("streak-counter").textContent = scores.streak;
}

// Fonction pour mettre à jour les scores dans la base de données SQL après chaque partie
function updateScore(winner) {
    const scores = JSON.parse(localStorage.getItem("rspScores"));
    
    if (winner === "player") {
        scores.player += 1;
        scores.streak += 1;
        // Met à jour le record si la partie actuelle est meilleure
        if (scores.streak > scores.maxStreak) {
            scores.maxStreak = scores.streak;
        }
    } else if (winner === "computer") {
        scores.computer += 1;
        scores.streak = 0; // Remet les compteurs à 0 si perte
    }
    
    localStorage.setItem("rspScores", JSON.stringify(scores));
    updateScoreDisplay();
}

// Fonction pour configurer le jeu
function setupGame() {
    // Récupération des éléments du DOM nécessaires
    const choices = document.querySelectorAll('.choice');
    const result = document.getElementById('result');
    const gameStatus = document.getElementById('game-status');
    const resetButton = document.getElementById('reset-game');
    const playerChoiceDisplay = document.getElementById('player-choice-display');
    const computerChoiceDisplay = document.getElementById('computer-choice-display');
    const battleArena = document.getElementById('battle-arena');
    
    let isAnimating = false;
    
    // Ajouter des écouteurs d'événements pour chaque choix (pierre, papier, ciseaux
    choices.forEach(choice => {
        choice.addEventListener('click', function() {
            // Empêcher les clics pendant les animations
            if (isAnimating) return;
            isAnimating = true;
            
             // Réinitialiser les choix précédents et le résultat affiché
            resetSelections();
            
            // Mettre en surbrillance le choix sélectionné
            this.classList.add('selected');
            
             // Récupérer le choix du joueur
            const playerChoice = this.id;
            
            // Lancer le compte à rebours "Pierre, Feuille, Ciseaux"
            playCountdown().then(() => {
                const computerChoice = getComputerChoice();
                
               
                displayChoices(playerChoice, computerChoice);
                
                
                const gameResult = determineWinner(playerChoice, computerChoice);
                
                
                setTimeout(() => {
                    showResult(playerChoice, computerChoice, gameResult);
                    isAnimating = false;
                }, 800);
            });
        });
    });
    
    // Ajouter un écouteur d'événement au bouton de réinitialisation
    resetButton.addEventListener('click', function() {
        if (isAnimating) return;
        
        resetSelections();
        gameStatus.textContent = "Choose your move!";
        result.textContent = "";
        playerChoiceDisplay.innerHTML = "";
        computerChoiceDisplay.innerHTML = "";
    });
    
    // Ajouter des raccourcis clavier
    document.addEventListener('keydown', function(event) {
        if (isAnimating) return;
        
        const keyActions = {
            'r': () => document.getElementById('rock').click(),
            'p': () => document.getElementById('paper').click(),
            's': () => document.getElementById('scissors').click(),
            'Escape': () => window.location.href = 'game.html',
            ' ': () => resetButton.click()
        };
        
        if (keyActions[event.key]) {
            keyActions[event.key]();
            event.preventDefault();
        }
    });
    
    // Fonction qui lance l'animation du compte à rebours
    function playCountdown() {
        return new Promise(resolve => {
            const countdownElements = ['Rock', 'Paper', 'Scissors', 'Shoot!'];
            let index = 0;
            
            function showNext() {
                if (index >= countdownElements.length) {
                    resolve();
                    return;
                }
                
                // Créer et afficher l’élément de compte à rebours
                const countdownEl = document.createElement('div');
                countdownEl.className = 'countdown';
                countdownEl.textContent = countdownElements[index];
                document.body.appendChild(countdownEl);
                
                 // Supprimer l’élément après un court délai
                setTimeout(() => {
                    document.body.removeChild(countdownEl);
                    index++;
                    showNext();
                }, 600);
            }
            
            showNext();
        });
    }
    
    // Fonction pour réinitialiser les choix précédents
    function resetSelections() {
        choices.forEach(c => c.classList.remove('selected'));
        
        // Réinitialiser les couleurs de victoire/défaite dans l’arène
        const playerSide = document.querySelector('.player-side');
        const computerSide = document.querySelector('.computer-side');
        
        playerSide.classList.remove('winner-highlight', 'loser-highlight');
        computerSide.classList.remove('winner-highlight', 'loser-highlight');
    }
    
    // Fonction pour afficher les choix dans l’arène de combat
    function displayChoices(playerChoice, computerChoice) {
        // Associer les choix à des icônes
        const iconMap = {
            'rock': '<i class="fas fa-hand-rock fa-3x"></i>',
            'paper': '<i class="fas fa-hand-paper fa-3x"></i>',
            'scissors': '<i class="fas fa-hand-scissors fa-3x"></i>'
        };
        
        // Afficher le choix du joueur avec une animation
        playerChoiceDisplay.innerHTML = iconMap[playerChoice];
        playerChoiceDisplay.classList.add('fade-in');
        
        // Afficher le choix de l'ordinateur avec une animation
        computerChoiceDisplay.innerHTML = iconMap[computerChoice];
        computerChoiceDisplay.classList.add('fade-in');
        
        // Animation de tremblement de l’arène
        battleArena.classList.add('shake');
        
        // Supprimer les animations après leur fin
        setTimeout(() => {
            playerChoiceDisplay.classList.remove('fade-in');
            computerChoiceDisplay.classList.remove('fade-in');
            battleArena.classList.remove('shake');
        }, 500);
    }
}

// Fonction pour obtenir un choix aléatoire de l’ordinateur
function getComputerChoice() {
    const choices = ['rock', 'paper', 'scissors'];
    const randomIndex = Math.floor(Math.random() * 3);
    return choices[randomIndex];
}

// Fonction pour déterminer le gagnant
function determineWinner(playerChoice, computerChoice) {
    if (playerChoice === computerChoice) {
        return "draw";
    }
    
    if (
        (playerChoice === 'rock' && computerChoice === 'scissors') ||
        (playerChoice === 'paper' && computerChoice === 'rock') ||
        (playerChoice === 'scissors' && computerChoice === 'paper')
    ) {
        updateScore("player");
        return "player";
    } else {
        updateScore("computer");
        return "computer";
    }
}

// Fonction pour afficher le résultat du match
function showResult(playerChoice, computerChoice, result) {
    const resultDisplay = document.getElementById('result');
    const gameStatus = document.getElementById('game-status');
    const playerSide = document.querySelector('.player-side');
    const computerSide = document.querySelector('.computer-side');
    
     // Mettre en majuscule la première lettre des choix
    const playerChoiceFormatted = playerChoice.charAt(0).toUpperCase() + playerChoice.slice(1);
    const computerChoiceFormatted = computerChoice.charAt(0).toUpperCase() + computerChoice.slice(1);
    
    // Afficher les choix sélectionnés
    gameStatus.textContent = `You chose ${playerChoiceFormatted}, Computer chose ${computerChoiceFormatted}`;
    
    // Afficher le résultat avec un style approprié
    if (result === "draw") {
        resultDisplay.innerHTML = `<span class="result-draw">It's a draw!</span>`;
        resultDisplay.className = 'game-status result-animation';
    } else if (result === "player") {
        resultDisplay.innerHTML = `<span class="result-win">You win!</span>`;
        resultDisplay.className = 'game-status result-animation';
        
        // Mettre en valeur le gagnant
        playerSide.classList.add('winner-highlight');
        computerSide.classList.add('loser-highlight');
        
        // Jouer le son de victoire
        playSound('win');
    } else {
        resultDisplay.innerHTML = `<span class="result-lose">Computer wins!</span>`;
        resultDisplay.className = 'game-status result-animation';
        
        // // Mettre en valeur le gagnant
        computerSide.classList.add('winner-highlight');
        playerSide.classList.add('loser-highlight');
        
        // Jouer le son de défaite
        playSound('lose');
    }
    
   // Animation du compteur de série de victoires si le joueur gagne
    if (result === "player") {
        const streakCounter = document.getElementById('streak-counter');
        streakCounter.classList.add('winner');
        setTimeout(() => {
            streakCounter.classList.remove('winner');
        }, 1000);
    }
}

// Fonction pour jouer les effets sonores
function playSound(type) {
    console.log(`Playing ${type} sound effect`);
}
