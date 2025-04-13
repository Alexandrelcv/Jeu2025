document.addEventListener('DOMContentLoaded', function() {
    // Initialisation du jeu
    initDatabase();
    const game = new SnakeGame();
    game.init();
});

// Initialisation de la base de données
function initDatabase() {
    // Vérifier si localStorage est supporté
    if (typeof(Storage) === "undefined") {
        console.error("localStorage n'est pas supporté par votre navigateur!");
        return;
    }

    // Initialiser le high score dans localStorage s'il n'existe pas
    if (localStorage.getItem("snakeHighScore") === null) {
        localStorage.setItem("snakeHighScore", "0");
    }

    // Mise à jour de l'affichage du high score
    document.getElementById("high-score").textContent = localStorage.getItem("snakeHighScore");
}

// Class principale du jeu Snake
class SnakeGame {
    constructor() {
        // Éléments du DOM
        this.canvas = document.getElementById("game-canvas");
        this.ctx = this.canvas.getContext("2d");
        this.gameStatus = document.getElementById("game-status");
        this.scoreDisplay = document.getElementById("score");
        this.highScoreDisplay = document.getElementById("high-score");
        this.resetButton = document.getElementById("reset-game");

        // Boutons de difficulté
        this.speedButtons = {
            easy: document.getElementById("speed-easy"),
            medium: document.getElementById("speed-medium"),
            hard: document.getElementById("speed-hard")
        };

        // Boutons de contrôle tactile
        this.controlButtons = {
            up: document.getElementById("up-btn"),
            down: document.getElementById("down-btn"),
            left: document.getElementById("left-btn"),
            right: document.getElementById("right-btn")
        };

        // Configuration du jeu
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.blockSize = 20; // taille d'un bloc
        this.widthInBlocks = Math.floor(this.width / this.blockSize);
        this.heightInBlocks = Math.floor(this.height / this.blockSize);
        this.gameSpeed = {
            easy: 180,
            medium: 120,
            hard: 80
        };

        // État du jeu
        this.currentDifficulty = "medium";
        this.score = 0;
        this.snake = null;
        this.food = null;
        this.obstacles = [];
        this.gameInterval = null;
        this.gameRunning = false;
        this.gameOver = false;
        this.frameCount = 0;

        // Couleurs
        this.colors = {
            snakeHead: "#4361ee",
            snakeBody: "#5a75f6",
            food: "#f72585",
            obstacle: "#ef476f",
            gridLine: "rgba(0, 0, 0, 0.05)",
            background: "#f8f9fa"
        };
    }

    init() {
        // Initialiser les éléments du jeu
        this.snake = new Snake(this);
        this.food = new Food(this);

        // Générer quelques obstacles aléatoires (niveau de difficulté supplémentaire)
        this.generateObstacles(3);

        // Ajouter les event listeners
        document.addEventListener("keydown", this.handleKeyPress.bind(this));
        this.resetButton.addEventListener("click", this.resetGame.bind(this));

        // Ajouter les listeners pour les boutons de difficulté
        this.speedButtons.easy.addEventListener("click", () => this.setDifficulty("easy"));
        this.speedButtons.medium.addEventListener("click", () => this.setDifficulty("medium"));
        this.speedButtons.hard.addEventListener("click", () => this.setDifficulty("hard"));

        // Ajouter les listeners pour les boutons de contrôle tactile
        this.controlButtons.up.addEventListener("click", () => {
            if (this.gameRunning) this.snake.setDirection("up");
        });
        this.controlButtons.down.addEventListener("click", () => {
            if (this.gameRunning) this.snake.setDirection("down");
        });
        this.controlButtons.left.addEventListener("click", () => {
            if (this.gameRunning) this.snake.setDirection("left");
        });
        this.controlButtons.right.addEventListener("click", () => {
            if (this.gameRunning) this.snake.setDirection("right");
        });

        // Dessiner l'état initial du jeu
        this.draw();
    }

    generateObstacles(count) {
        this.obstacles = [];

        // Générer des obstacles aléatoires
        for (let i = 0; i < count; i++) {
            let obstaclePosition;
            let validPosition = false;

            // S'assurer que l'obstacle n'est pas sur le serpent ou la nourriture
            while (!validPosition) {
                obstaclePosition = {
                    x: Math.floor(Math.random() * this.widthInBlocks),
                    y: Math.floor(Math.random() * this.heightInBlocks)
                };

                // Vérifier si la position est valide
                validPosition = true;

                // Vérifier si l'obstacle serait sur le serpent
                for (const segment of this.snake.segments) {
                    if (segment.x === obstaclePosition.x && segment.y === obstaclePosition.y) {
                        validPosition = false;
                        break;
                    }
                }

                // Vérifier si l'obstacle serait sur la nourriture
                if (validPosition && this.food &&
                    this.food.position.x === obstaclePosition.x &&
                    this.food.position.y === obstaclePosition.y) {
                    validPosition = false;
                }

                // Vérifier si l'obstacle serait sur un autre obstacle
                if (validPosition) {
                    for (const obstacle of this.obstacles) {
                        if (obstacle.x === obstaclePosition.x && obstacle.y === obstaclePosition.y) {
                            validPosition = false;
                            break;
                        }
                    }
                }
            }

            this.obstacles.push(obstaclePosition);
        }
    }

    setDifficulty(difficulty) {
        // Changer la difficulté seulement si le jeu n'est pas en cours
        if (this.gameRunning) {
            this.pauseGame();
        }

        this.currentDifficulty = difficulty;

        // Mettre à jour les styles des boutons
        Object.keys(this.speedButtons).forEach(key => {
            this.speedButtons[key].classList.remove("active");
        });
        this.speedButtons[difficulty].classList.add("active");

        // Générer plus ou moins d'obstacles selon la difficulté
        this.generateObstacles(difficulty === "easy" ? 2 : difficulty === "medium" ? 4 : 6);

        // Mettre à jour le statut du jeu
        this.gameStatus.textContent = `Difficulté définie sur ${difficulty}. Appuyez sur Espace pour démarrer`;

        // Redessiner le jeu
        this.draw();
    }

    handleKeyPress(event) {
        const key = event.key;

        // Démarrer Mettre en pause le jeu avec la barre d'espace
        if (key === " ") {
            if (this.gameOver) {
                this.resetGame();
            } else {
                if (this.gameRunning) {
                    this.pauseGame();
                } else {
                    this.startGame();
                }
            }
            event.preventDefault();
            return;
        }

        // Gérer les changements de direction avec les touches fléchées ou WASD
        if (this.gameRunning) {
            const keyActions = {
                "ArrowLeft": () => this.snake.setDirection("left"),
                "ArrowUp": () => this.snake.setDirection("up"),
                "ArrowRight": () => this.snake.setDirection("right"),
                "ArrowDown": () => this.snake.setDirection("down"),
                "q": () => this.snake.setDirection("left"),
                "z": () => this.snake.setDirection("up"),
                "d": () => this.snake.setDirection("right"),
                "s": () => this.snake.setDirection("down"),
                "Q": () => this.snake.setDirection("left"),
                "Z": () => this.snake.setDirection("up"),
                "D": () => this.snake.setDirection("right"),
                "S": () => this.snake.setDirection("down")
            };

            if (keyActions[key]) {
                keyActions[key]();
                event.preventDefault();
            }
        }

        // Réinitialiser le jeu avec la touche 'R'
        if (key === "r" || key === "R") {
            this.resetGame();
            event.preventDefault();
        }

        // Retour au menu avec la touche 'Escape'
        if (key === "Escape") {
            window.location.href = 'game.html';
            event.preventDefault();
        }
    }

    startGame() {
        this.gameRunning = true;
        this.gameStatus.textContent = "Jeu en cours";

        // Démarrer la boucle de jeu avec la vitesse actuelle
        this.gameInterval = setInterval(() => {
            this.update();
            this.draw();
        }, this.gameSpeed[this.currentDifficulty]);
    }

    pauseGame() {
        this.gameRunning = false;
        this.gameStatus.textContent = "Jeu en pause. Appuyez sur Espace pour continuer";
        clearInterval(this.gameInterval);
    }

    update() {
        if (this.gameOver) return;

        this.frameCount++;

        // Déplacer le serpent
        this.snake.advance();

        // Vérifier les collisions avec lui-même ou les obstacles
        if (this.checkCollision()) {
            this.endGame();
            return;
        }

        // Vérifier les collisions avec la nourriture
        if (this.snake.isEatingFood(this.food)) {
            // Ajouter un effet d'animation au score
            this.animateScore();

            // Incrémenter le score
            this.score++;
            this.scoreDisplay.textContent = this.score;

            // Faire grandir le serpent
            this.snake.ateFood = true;

            // Générer une nouvelle nourriture
            this.food.setNewPosition();

            // Mettre à jour le high score si nécessaire
            this.updateHighScore();

            // Ajout d'un obstacle tous les 5 points en mode difficile
            if (this.currentDifficulty === "hard" && this.score % 5 === 0) {
                this.generateObstacles(this.obstacles.length + 1);
            }
        }
    }

    checkCollision() {
        const head = this.snake.segments[0];

        // Vérifier la collision avec les murs
        if (this.currentDifficulty !== "easy") { // En mode facile, les murs sont traversables
            if (head.x < 0 || head.x >= this.widthInBlocks ||
                head.y < 0 || head.y >= this.heightInBlocks) {
                return true;
            }
        }

        // Vérifier la collision avec le corps du serpent
        for (let i = 1; i < this.snake.segments.length; i++) {
            if (this.snake.segments[i].x === head.x && this.snake.segments[i].y === head.y) {
                return true;
            }
        }

        // Vérifier la collision avec les obstacles
        for (const obstacle of this.obstacles) {
            if (obstacle.x === head.x && obstacle.y === head.y) {
                return true;
            }
        }

        return false;
    }

    animateScore() {
        // Ajouter une classe d'animation à l'affichage du score
        this.scoreDisplay.classList.add("score-animation");

        // Supprimer la classe après la fin de l'animation
        setTimeout(() => {
            this.scoreDisplay.classList.remove("score-animation");
        }, 500);
    }

    draw() {
        // Effacer le canvas
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Dessiner la grille optionnelle pour une meilleure visibilité
        this.drawGrid();

        // Dessiner les obstacles
        this.drawObstacles();

        // Dessiner le serpent et la nourriture
        this.snake.draw();
        this.food.draw(this.frameCount % 60 < 30); // Faire "pulser" la nourriture

        // Dessiner la bordure
        this.drawBorder();
    }

    drawGrid() {
        this.ctx.strokeStyle = this.colors.gridLine;
        this.ctx.lineWidth = 0.5;

        // Dessiner les lignes verticales
        for (let x = 0; x <= this.width; x += this.blockSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }

        // Dessiner les lignes horizontales
        for (let y = 0; y <= this.height; y += this.blockSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }

    drawObstacles() {
        this.ctx.fillStyle = this.colors.obstacle;

        for (const obstacle of this.obstacles) {
            const x = obstacle.x * this.blockSize;
            const y = obstacle.y * this.blockSize;

            // Dessiner un obstacle avec un petit effet visuel
            this.ctx.beginPath();
            this.ctx.rect(x + 2, y + 2, this.blockSize - 4, this.blockSize - 4);
            this.ctx.fill();

            // Ajouter un motif en X à l'obstacle
            this.ctx.strokeStyle = "rgba(0,0,0,0.2)";
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(x + 4, y + 4);
            this.ctx.lineTo(x + this.blockSize - 4, y + this.blockSize - 4);
            this.ctx.moveTo(x + this.blockSize - 4, y + 4);
            this.ctx.lineTo(x + 4, y + this.blockSize - 4);
            this.ctx.stroke();
        }
    }

    drawBorder() {
        this.ctx.strokeStyle = "#4361ee";
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(0, 0, this.width, this.height);
    }

    endGame() {
        this.gameRunning = false;
        this.gameOver = true;
        clearInterval(this.gameInterval);

        // Effet de flash pour le statut du jeu
        this.gameStatus.classList.add("game-over-flash");
        this.gameStatus.textContent = "Game Over! Appuyez sur Espace pour recommencer";

        // Jouer l'animation de mort
        this.snake.playDeathAnimation(() => {
            // Animation terminée
        });
    }

    resetGame() {
        // Effacer tout intervalle en cours
        clearInterval(this.gameInterval);

        // Réinitialiser l'état du jeu
        this.score = 0;
        this.scoreDisplay.textContent = "0";
        this.gameOver = false;
        this.gameRunning = false;
        this.gameStatus.textContent = `Appuyez sur Espace pour démarrer (difficulté: ${this.currentDifficulty})`;
        this.gameStatus.classList.remove("game-over-flash");

        // Créer un nouveau serpent et une nouvelle nourriture
        this.snake = new Snake(this);
        this.food = new Food(this);

        // Générer de nouveaux obstacles
        this.generateObstacles(this.currentDifficulty === "easy" ? 2 :
            this.currentDifficulty === "medium" ? 4 : 6);

        // Redessiner le jeu
        this.draw();
    }

    updateHighScore() {
        const highScore = parseInt(localStorage.getItem("snakeHighScore"));
        if (this.score > highScore) {
            localStorage.setItem("snakeHighScore", this.score.toString());
            this.highScoreDisplay.textContent = this.score;

            // Ajouter une animation au high score
            this.highScoreDisplay.classList.add("score-animation");

            // Supprimer la classe après l'animation
            setTimeout(() => {
                this.highScoreDisplay.classList.remove("score-animation");
            }, 500);
        }
    }
}

// Classe Serpent
class Snake {
    constructor(game) {
        this.game = game;
        this.segments = [
            { x: 7, y: 5 },
            { x: 6, y: 5 },
            { x: 5, y: 5 }
        ];
        this.direction = "right";
        this.nextDirection = "right";
        this.ateFood = false;
        this.isDying = false;
        this.deathStep = 0;
    }

    draw() {
        // Si le serpent est en train de mourir, afficher l'animation spéciale
        if (this.isDying) {
            this.drawDyingSnake();
            return;
        }

        // Dessiner chaque segment du serpent
        this.segments.forEach((segment, index) => {
            this.drawSegment(segment, index === 0);
        });
    }

    drawSegment(segment, isHead) {
        const ctx = this.game.ctx;
        const blockSize = this.game.blockSize;

        // Calculer la position
        const x = segment.x * blockSize;
        const y = segment.y * blockSize;

        // Déterminer les couleurs en fonction de la position dans le serpent
        const headColor = this.game.colors.snakeHead;
        const bodyColor = isHead ? headColor : this.getBodyColor(segment, this.segments.indexOf(segment));

        // Dessiner le segment (rectangle arrondi pour une meilleure apparence)
        ctx.fillStyle = bodyColor;
        this.roundRect(ctx, x + 1, y + 1, blockSize - 2, blockSize - 2, 4);

        // Ajouter des détails pour la tête
        if (isHead) {
            ctx.fillStyle = "#FFF";

            // Ajuster la position des yeux en fonction de la direction
            let eyeX1, eyeY1, eyeX2, eyeY2;
            const eyeSize = blockSize / 4;

            switch (this.direction) {
                case "right":
                    eyeX1 = x + blockSize * 0.7;
                    eyeY1 = y + blockSize * 0.25;
                    eyeX2 = x + blockSize * 0.7;
                    eyeY2 = y + blockSize * 0.65;
                    break;
                case "left":
                    eyeX1 = x + blockSize * 0.3;
                    eyeY1 = y + blockSize * 0.25;
                    eyeX2 = x + blockSize * 0.3;
                    eyeY2 = y + blockSize * 0.65;
                    break;
                case "up":
                    eyeX1 = x + blockSize * 0.25;
                    eyeY1 = y + blockSize * 0.3;
                    eyeX2 = x + blockSize * 0.65;
                    eyeY2 = y + blockSize * 0.3;
                    break;
                case "down":
                    eyeX1 = x + blockSize * 0.25;
                    eyeY1 = y + blockSize * 0.7;
                    eyeX2 = x + blockSize * 0.65;
                    eyeY2 = y + blockSize * 0.7;
                    break;
            }

            // Dessiner les yeux
            ctx.beginPath();
            ctx.arc(eyeX1, eyeY1, eyeSize / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(eyeX2, eyeY2, eyeSize / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Fonction d'aide pour dessiner des rectangles arrondis
    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
    }

    // Fonction pour obtenir des couleurs dégradées pour le corps du serpent
    getBodyColor(segment, index) {
        // Créer un dégradé de la couleur primaire à la couleur secondaire en fonction de la position
        const length = this.segments.length;
        const position = index / length;

        // Dégradé de couleur de la tête à la queue
        const r = Math.floor(67 + (33 * position)); // De 67 (primaire) à 100 (queue)
        const g = Math.floor(97 + (53 * position)); // De 97 à 150
        const b = Math.floor(238 - (138 * position)); // De 238 à 100

        return `rgb(${r}, ${g}, ${b})`;
    }

    // Dessiner le serpent dans son animation de mort
    drawDyingSnake() {
        const ctx = this.game.ctx;
        const blockSize = this.game.blockSize;

        // Faire disparaître les segments de la queue à la tête
        this.segments.forEach((segment, index) => {
            // Ignorer les segments qui ont déjà "disparu" dans l'animation
            if (index > this.segments.length - this.deathStep) {
                return;
            }

            const x = segment.x * blockSize;
            const y = segment.y * blockSize;

            // Rendre les segments plus transparents au fur et à mesure de l'animation
            const opacity = 1 - (this.deathStep / (this.segments.length + 5));

            // Dessiner le segment avec une opacité décroissante
            ctx.fillStyle = index === 0
                ? `rgba(67, 97, 238, ${opacity})`
                : `rgba(100, 150, 100, ${opacity})`;

            this.roundRect(ctx, x + 1, y + 1, blockSize - 2, blockSize - 2, 4);
        });

        // Faire avancer l'animation de mort
        this.deathStep++;
    }

    // Démarrer l'animation de mort
    playDeathAnimation(callback) {
        this.isDying = true;
        this.deathStep = 0;

        // Créer une boucle d'animation
        const animateFrame = () => {
            this.game.draw();

            if (this.deathStep <= this.segments.length + 5) {
                requestAnimationFrame(animateFrame);
            } else {
                this.isDying = false;
                if (callback) callback();
            }
        };

        // Démarrer l'animation
        animateFrame();
    }

    advance() {
        // Ignorer si le serpent est en train de mourir
        if (this.isDying) return;

        // Mettre à jour la direction
        this.direction = this.nextDirection;

        // Calculer la nouvelle position de la tête
        const head = { ...this.segments[0] };

        // Déplacer la tête en fonction de la direction
        switch (this.direction) {
            case "right":
                head.x = (head.x + 1) % this.game.widthInBlocks;
                break;
            case "left":
                head.x = (head.x - 1 + this.game.widthInBlocks) % this.game.widthInBlocks;
                break;
            case "up":
                head.y = (head.y - 1 + this.game.heightInBlocks) % this.game.heightInBlocks;
                break;
            case "down":
                head.y = (head.y + 1) % this.game.heightInBlocks;
                break;
        }

        // Ajouter la nouvelle tête aux segments
        this.segments.unshift(head);

        // Si le serpent n'a pas mangé, supprimer la queue
        if (!this.ateFood) {
            this.segments.pop();
        } else {
            this.ateFood = false;
        }
    }

    setDirection(newDirection) {
        // Empêcher les virages à 180 degrés
        const opposites = {
            "left": "right",
            "right": "left",
            "up": "down",
            "down": "up"
        };

        if (newDirection !== opposites[this.direction]) {
            this.nextDirection = newDirection;
        }
    }

    isEatingFood(food) {
        const head = this.segments[0];
        return head.x === food.position.x && head.y === food.position.y;
    }
}

// Classe Nourriture
class Food {
    constructor(game) {
        this.game = game;
        this.position = { x: 0, y: 0 };
        this.setNewPosition();
    }

    draw(glow = false) {
        const ctx = this.game.ctx;
        const blockSize = this.game.blockSize;

        // Calculer la position
        const x = this.position.x * blockSize;
        const y = this.position.y * blockSize;

        // Ajouter un effet de lueur
        if (glow) {
            ctx.shadowColor = 'rgba(255, 0, 0, 0.6)';
            ctx.shadowBlur = 15;
        }

        // Dessiner la nourriture (pomme)
        ctx.fillStyle = this.game.colors.food;
        ctx.beginPath();
        ctx.arc(x + blockSize / 2, y + blockSize / 2, blockSize / 2 - 2, 0, Math.PI * 2);
        ctx.fill();

        // Réinitialiser l'ombre
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        // Ajouter un effet brillant à la pomme
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.beginPath();
        ctx.arc(x + blockSize / 3, y + blockSize / 3, blockSize / 6, 0, Math.PI * 2);
        ctx.fill();

        // Ajouter une tige
        ctx.fillStyle = "#006400";
        ctx.fillRect(x + blockSize / 2 - 1, y + 2, 2, blockSize / 5);

        // Ajouter une feuille
        ctx.fillStyle = "#32CD32";
        ctx.beginPath();
        ctx.ellipse(x + blockSize / 2 + 4, y + blockSize / 8, 3, 5, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
    }

    setNewPosition() {
        const maxX = this.game.widthInBlocks - 1;
        const maxY = this.game.heightInBlocks - 1;

        // Générer une position aléatoire
        let newPosition;
        let validPosition;

        // S'assurer que la nourriture n'apparaît pas sur le serpent ou un obstacle
        do {
            validPosition = true;
            newPosition = {
                x: Math.floor(Math.random() * maxX),
                y: Math.floor(Math.random() * maxY)
            };

            // Vérifier si la position est sur le serpent
            for (const segment of this.game.snake.segments) {
                if (segment.x === newPosition.x && segment.y === newPosition.y) {
                    validPosition = false;
                    break;
                }
            }

            // Vérifier si la position est sur un obstacle
            if (validPosition) {
                for (const obstacle of this.game.obstacles) {
                    if (obstacle.x === newPosition.x && obstacle.y === newPosition.y) {
                        validPosition = false;
                        break;
                    }
                }
            }

        } while (!validPosition);

        this.position = newPosition;
    }
}