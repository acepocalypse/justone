document.addEventListener('DOMContentLoaded', () => {

    // --- WORD LIST ---
    const wordList = [
        "Apple", "Music", "Beach", "Brain", "Bread", "Brush", "Chair", "Cheese", "Cloud", "Diamond",
        "Dream", "Earth", "Flame", "Flower", "Forest", "Hammer", "Heart", "Island", "Jelly", "Kitten",
        "Lemon", "Magic", "Monkey", "Night", "Ocean", "Pillow", "Queen", "Rainbow", "River", "Robot",
        "Scissors", "Shark", "Snake", "Spider", "Spoon", "Storm", "Sword", "Table", "Tears", "Tiger",
        "Toast", "Train", "Turtle", "Unicorn", "Water", "Whale", "Wheel", "Window", "Yacht", "Zebra",
        "Castle", "Dragon", "Wizard", "Knight", "Planet", "Rocket", "Anchor", "Bicycle", "Camera", "Candle",
        "Chocolate", "Clown", "Coffee", "Dolphin", "Engine", "Feather", "Guitar", "Jungle", "Kangaroo",
        "Library", "Meteor", "Monster", "Mountain", "Octopus", "Penguin", "Pirate", "Pyramid", "Satellite",
        "Telescope", "Vampire", "Volcano", "Watch", "Dinosaur", "Elephant", "Fire", "Ice", "King", "Leaf"
    ];

    // --- GAME STATE ---
    let state = {};

    // --- DOM ELEMENTS ---
    const screens = {
        setup: document.getElementById('setup-screen'),
        roundStart: document.getElementById('round-start-screen'),
        clueGiving: document.getElementById('clue-giving-screen'),
        individualClue: document.getElementById('individual-clue-screen'),
        clueReveal: document.getElementById('clue-reveal-screen'),
        guessing: document.getElementById('guessing-screen'),
        roundEnd: document.getElementById('round-end-screen'),
        gameOver: document.getElementById('game-over-screen')
    };
    
    const ui = {
        score: document.getElementById('score-display'),
        round: document.getElementById('round-display'),
        playerCountInput: document.getElementById('player-count'),
        roundStartTitle: document.getElementById('round-start-title'),
        secretWordDisplay: document.getElementById('secret-word-display'),
        individualSecretWord: document.getElementById('individual-secret-word'),
        currentCluePlayer: document.getElementById('current-clue-player'),
        individualClueInput: document.getElementById('individual-clue-input'),
        clueDisplayContainer: document.getElementById('clue-display-container'),
        readyForGuessBtn: document.getElementById('ready-for-guess-btn'),
        guessingPlayerName: document.getElementById('guessing-player-name'),
        validCluesContainer: document.getElementById('valid-clues-container'),
        playerGuessInput: document.getElementById('player-guess-input'),
        resultMessage: document.getElementById('result-message'),
        endSecretWord: document.getElementById('end-secret-word'),
        endPlayerGuess: document.getElementById('end-player-guess'),
        finalScore: document.getElementById('final-score'),
        finalRating: document.getElementById('final-rating'),
        themeInput: document.getElementById('theme-input'),
        loadingMessage: document.getElementById('loading-message')
    };

    // --- EVENT LISTENERS ---
    document.getElementById('start-game-btn').addEventListener('click', startGame);
    document.getElementById('show-word-btn').addEventListener('click', showClueGiving);
    document.getElementById('start-individual-clues-btn').addEventListener('click', startIndividualClues);
    document.getElementById('submit-individual-clue-btn').addEventListener('click', submitIndividualClue);
    document.getElementById('skip-individual-clue-btn').addEventListener('click', skipIndividualClue);
    ui.readyForGuessBtn.addEventListener('click', showGuessing);
    document.getElementById('submit-guess-btn').addEventListener('click', () => processGuess(false));
    document.getElementById('pass-btn').addEventListener('click', () => processGuess(true));
    document.getElementById('next-round-btn').addEventListener('click', nextRound);
    document.getElementById('play-again-btn').addEventListener('click', () => switchScreen('setup'));

    // Add event listeners for word source selection
    document.querySelectorAll('input[name="word-source"]').forEach(radio => {
        radio.addEventListener('change', toggleThemeInput);
    });

    // Add override event listener
    document.getElementById('override-btn').addEventListener('click', overrideGuess);

    // --- TIMER FUNCTIONALITY ---
    let gameTimer = {
        active: false,
        timeLeft: 0,
        interval: null,
        currentElement: null,
        currentCircle: null,
        onExpire: null,
        warningThreshold: 10,
        criticalThreshold: 5
    };

    // Add timer event listeners
    document.querySelectorAll('input[name="timer-setting"]').forEach(radio => {
        radio.addEventListener('change', toggleTimerDetails);
    });

    function toggleTimerDetails() {
        const timerDetails = document.getElementById('timer-details');
        const selectedTimer = document.querySelector('input[name="timer-setting"]:checked').value;
        
        if (selectedTimer === 'standard') {
            timerDetails.style.display = 'block';
        } else {
            timerDetails.style.display = 'none';
        }
    }

    function startTimer(duration, elementId, onExpireCallback) {
        stopTimer(); // Clear any existing timer
        
        const timerEnabled = document.querySelector('input[name="timer-setting"]:checked').value === 'standard';
        if (!timerEnabled) return;

        gameTimer.active = true;
        gameTimer.timeLeft = duration;
        gameTimer.currentElement = document.getElementById(elementId);
        gameTimer.currentCircle = gameTimer.currentElement.querySelector('.timer-circle');
        gameTimer.onExpire = onExpireCallback;

        // Show timer display
        gameTimer.currentElement.style.display = 'flex';
        updateTimerDisplay();

        gameTimer.interval = setInterval(() => {
            gameTimer.timeLeft--;
            updateTimerDisplay();

            if (gameTimer.timeLeft <= 0) {
                stopTimer();
                if (gameTimer.onExpire) {
                    gameTimer.onExpire();
                }
            }
        }, 1000);
    }

    function stopTimer() {
        if (gameTimer.interval) {
            clearInterval(gameTimer.interval);
            gameTimer.interval = null;
        }
        
        gameTimer.active = false;
        
        // Hide all timer displays
        document.querySelectorAll('.timer-display').forEach(timer => {
            timer.style.display = 'none';
        });
        
        // Reset timer circle classes
        document.querySelectorAll('.timer-circle').forEach(circle => {
            circle.classList.remove('warning', 'critical');
        });
    }

    function updateTimerDisplay() {
        if (!gameTimer.currentElement || !gameTimer.currentCircle) return;

        const timerTextElement = gameTimer.currentElement.querySelector('[id^="timer-text"]');
        if (timerTextElement) {
            timerTextElement.textContent = gameTimer.timeLeft;
        }

        // Update visual state based on time remaining
        gameTimer.currentCircle.classList.remove('warning', 'critical');
        
        if (gameTimer.timeLeft <= gameTimer.criticalThreshold) {
            gameTimer.currentCircle.classList.add('critical');
            // Play sound effect for critical time (if audio is available)
            playTimerSound('critical');
        } else if (gameTimer.timeLeft <= gameTimer.warningThreshold) {
            gameTimer.currentCircle.classList.add('warning');
            // Play sound effect for warning time (if audio is available)
            if (gameTimer.timeLeft === gameTimer.warningThreshold) {
                playTimerSound('warning');
            }
        }
    }

    function playTimerSound(type) {
        // Simple audio feedback using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            if (type === 'critical') {
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.1);
            } else if (type === 'warning') {
                oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.15);
            }
        } catch (error) {
            // Audio not supported, fail silently
        }
    }

    // --- GAME LOGIC WITH TIMER INTEGRATION ---

    function switchScreen(screenName) {
        Object.values(screens).forEach(screen => screen.classList.remove('active'));
        screens[screenName].classList.add('active');
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // Function to calculate edit distance (Levenshtein distance)
    function editDistance(str1, str2) {
        const len1 = str1.length;
        const len2 = str2.length;
        
        // Create a matrix to store distances
        const matrix = Array(len1 + 1).fill().map(() => Array(len2 + 1).fill(0));
        
        // Initialize first row and column
        for (let i = 0; i <= len1; i++) matrix[i][0] = i;
        for (let j = 0; j <= len2; j++) matrix[0][j] = j;
        
        // Fill the matrix
        for (let i = 1; i <= len1; i++) {
            for (let j = 1; j <= len2; j++) {
                if (str1[i - 1] === str2[j - 1]) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j] + 1,     // deletion
                        matrix[i][j - 1] + 1,     // insertion
                        matrix[i - 1][j - 1] + 1  // substitution
                    );
                }
            }
        }
        
        return matrix[len1][len2];
    }

    // Function to check if guess is close enough to the target word
    function isCloseEnough(guess, target) {
        // Normalize both strings (lowercase, trim)
        const normalizedGuess = guess.toLowerCase().trim();
        const normalizedTarget = target.toLowerCase().trim();
        
        // Exact match
        if (normalizedGuess === normalizedTarget) {
            return true;
        }
        
        // Calculate edit distance
        const distance = editDistance(normalizedGuess, normalizedTarget);
        
        // Allow 1-2 character differences based on word length
        const maxAllowedDistance = normalizedTarget.length <= 4 ? 1 : 2;
        
        return distance <= maxAllowedDistance;
    }

    // Function to check if clue is a single word
    function isSingleWord(clue) {
        // Trim the clue and check for spaces, tabs, or other whitespace
        const trimmedClue = clue.trim();
        
        // Check if empty
        if (trimmedClue === '') {
            return false;
        }
        
        // Check for any whitespace characters (spaces, tabs, newlines, etc.)
        if (/\s/.test(trimmedClue)) {
            return false;
        }
        
        // Check for common separators that might indicate multiple words
        if (/[-_\/\\]/.test(trimmedClue)) {
            return false;
        }
        
        return true;
    }

    // Function to check if clue is too similar to the secret word
    function isClueValid(clue, secretWord) {
        // Normalize both strings
        const normalizedClue = clue.toLowerCase().trim();
        const normalizedSecret = secretWord.toLowerCase().trim();
        
        // Don't allow exact matches
        if (normalizedClue === normalizedSecret) {
            return false;
        }
        
        // Don't allow clues that are just the plural/singular form
        if (normalizedClue + 's' === normalizedSecret || normalizedSecret + 's' === normalizedClue) {
            return false;
        }
        
        // Don't allow clues that are too similar (within edit distance of 2)
        const distance = editDistance(normalizedClue, normalizedSecret);
        if (distance <= 2) {
            return false;
        }
        
        // Don't allow clues that contain the secret word or vice versa
        if (normalizedClue.includes(normalizedSecret) || normalizedSecret.includes(normalizedClue)) {
            return false;
        }
        
        return true;
    }

    function toggleThemeInput() {
        const themeSection = document.getElementById('theme-input-section');
        const selectedSource = document.querySelector('input[name="word-source"]:checked').value;
        
        if (selectedSource === 'theme') {
            themeSection.style.display = 'block';
            ui.themeInput.focus();
        } else {
            themeSection.style.display = 'none';
        }
    }    async function generateCustomWords(theme) {
        try {
            const response = await fetch('https://cheerful-flow-production.up.railway.app/generate-words', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ theme: theme })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.words;
        } catch (error) {
            console.error('Error generating custom words:', error);
            throw error;
        }
    }

    async function initGame() {
        const playerCount = parseInt(ui.playerCountInput.value);
        if (isNaN(playerCount) || playerCount < 3 || playerCount > 7) {
            alert("Please enter a number of players between 3 and 7.");
            return null;
        }

        const selectedSource = document.querySelector('input[name="word-source"]:checked').value;
        const timerEnabled = document.querySelector('input[name="timer-setting"]:checked').value === 'standard';
        let wordsToUse = [...wordList];

        if (selectedSource === 'theme') {
            const theme = ui.themeInput.value.trim();
            if (!theme) {
                alert("Please enter a theme for custom words.");
                return null;
            }

            try {
                ui.loadingMessage.style.display = 'block';
                document.getElementById('start-game-btn').disabled = true;
                document.getElementById('start-game-btn').textContent = 'Generating...';
                
                const customWords = await generateCustomWords(theme);
                wordsToUse = customWords;
                
                console.log(`Generated ${customWords.length} words for theme "${theme}"`);
            } catch (error) {
                alert(`Failed to generate custom words: ${error.message}. Using default words instead.`);
                wordsToUse = [...wordList];
            } finally {
                ui.loadingMessage.style.display = 'none';
                document.getElementById('start-game-btn').disabled = false;
                document.getElementById('start-game-btn').textContent = 'Start Game';
            }
        }

        const shuffledDeck = [...wordsToUse];
        shuffleArray(shuffledDeck);
        
        return {
            playerCount: playerCount,
            players: Array.from({ length: playerCount }, (_, i) => `Player ${i + 1}`),
            score: 0,
            round: 0,
            guesserIndex: -1,
            deck: shuffledDeck.slice(0, 13),
            currentWord: null,
            clues: [],
            currentClueGiverIndex: 0,
            clueGivers: [],
            timerEnabled: timerEnabled
        };
    }

    async function startGame() {
        const newState = await initGame();
        if (newState) {
            state = newState;
            nextRound();
        }
    }
    
    function nextRound() {
        if (state.round >= 13) {
            showGameOver();
            return;
        }
        state.round++;
        state.guesserIndex = (state.guesserIndex + 1) % state.playerCount;
        state.currentWord = state.deck[state.round - 1];
        state.clues = [];
        
        // Set up clue givers for this round
        state.clueGivers = [];
        for (let i = 0; i < state.playerCount; i++) {
            if (i !== state.guesserIndex) {
                state.clueGivers.push(i);
            }
        }
        state.currentClueGiverIndex = 0;
        
        updateStats();
        
        ui.roundStartTitle.innerHTML = `Round ${state.round} - <span>${state.players[state.guesserIndex]}</span> is the Guesser!`;
        switchScreen('roundStart');
    }
    
    function updateStats() {
        ui.score.textContent = `Score: ${state.score}`;
        ui.round.textContent = `Round: ${state.round} / 13`;
    }

    function showClueGiving() {
        ui.secretWordDisplay.textContent = state.currentWord;
        switchScreen('clueGiving');
    }

    function startIndividualClues() {
        state.currentClueGiverIndex = 0;
        showNextClueGiver();
    }

    function showNextClueGiver() {
        if (state.currentClueGiverIndex >= state.clueGivers.length) {
            revealClues();
            return;
        }

        const currentPlayerIndex = state.clueGivers[state.currentClueGiverIndex];
        ui.currentCluePlayer.textContent = `${state.players[currentPlayerIndex]}`;
        ui.individualSecretWord.textContent = state.currentWord;
        ui.individualClueInput.value = '';
        ui.individualClueInput.focus();
        
        switchScreen('individualClue');
        
        // Start clue timer (30 seconds)
        if (state.timerEnabled) {
            startTimer(30, 'timer-display-individual', () => {
                // Timer expired - automatically skip this clue
                skipIndividualClue();
            });
        }
    }

    function submitIndividualClue() {
        stopTimer(); // Stop the timer when clue is submitted
        
        const clue = ui.individualClueInput.value.trim();
        const currentPlayerIndex = state.clueGivers[state.currentClueGiverIndex];
        
        if (clue !== "") {
            // Check if it's a single word
            if (!isSingleWord(clue)) {
                alert('Clues must be exactly one word! No spaces, hyphens, or other separators allowed.');
                ui.individualClueInput.focus();
                // Restart timer if enabled
                if (state.timerEnabled) {
                    startTimer(30, 'timer-display-individual', () => {
                        skipIndividualClue();
                    });
                }
                return;
            }
            
            // Validate clue before accepting it
            if (!isClueValid(clue, state.currentWord)) {
                alert(`"${clue}" is too similar to the secret word! Please choose a different clue.`);
                ui.individualClueInput.focus();
                // Restart timer if enabled
                if (state.timerEnabled) {
                    startTimer(30, 'timer-display-individual', () => {
                        skipIndividualClue();
                    });
                }
                return;
            }
            
            state.clues.push({
                playerIndex: currentPlayerIndex,
                clue: clue,
                valid: true
            });
        }
        
        state.currentClueGiverIndex++;
        showNextClueGiver();
    }

    function skipIndividualClue() {
        stopTimer(); // Stop the timer when skipping
        state.currentClueGiverIndex++;
        showNextClueGiver();
    }

    function revealClues() {
        // Auto-invalidate duplicates
        const clueCounts = {};
        state.clues.forEach(c => {
            const normalizedClue = c.clue.toLowerCase();
            clueCounts[normalizedClue] = (clueCounts[normalizedClue] || 0) + 1;
        });
        
        state.clues.forEach(c => {
            if (clueCounts[c.clue.toLowerCase()] > 1) {
                c.valid = false;
            }
        });

        renderCluesForComparison();
        switchScreen('clueReveal');
    }

    function renderCluesForComparison() {
        ui.clueDisplayContainer.innerHTML = '';
        const clueGiverColors = ['#3498db', '#2ecc71', '#f1c40f', '#e67e22', '#9b59b6', '#1abc9c'];

        state.clues.forEach((clueData, index) => {
            const clueCard = document.createElement('div');
            clueCard.className = 'clue-card';
            clueCard.textContent = clueData.clue;
            const color = clueGiverColors[(clueData.playerIndex > state.guesserIndex ? clueData.playerIndex-1 : clueData.playerIndex) % clueGiverColors.length];
            clueCard.style.borderColor = color;
            
            if (!clueData.valid) {
                clueCard.classList.add('invalid');
            }
            
            clueCard.addEventListener('click', () => {
                clueData.valid = !clueData.valid;
                clueCard.classList.toggle('invalid');
                checkIfReadyForGuess();
            });
            ui.clueDisplayContainer.appendChild(clueCard);
        });
        checkIfReadyForGuess();
    }
    
    function checkIfReadyForGuess() {
        const validClues = state.clues.filter(c => c.valid);
        if (validClues.length === 0) {
            ui.readyForGuessBtn.textContent = "All Clues Invalid - Pass Turn";
        } else {
            ui.readyForGuessBtn.textContent = "Guesser is Ready";
        }
    }

    function showGuessing() {
        ui.guessingPlayerName.innerHTML = `<span>${state.players[state.guesserIndex]}</span>, it's your turn to guess!`;
        ui.validCluesContainer.innerHTML = '';
        ui.playerGuessInput.value = '';

        const validClues = state.clues.filter(c => c.valid);
        
        if (validClues.length === 0) {
            setTimeout(() => processGuess(true, true), 500);
            return;
        }

        validClues.forEach(clueData => {
            const clueCard = document.createElement('div');
            clueCard.className = 'clue-card';
            clueCard.textContent = clueData.clue;
            clueCard.style.cursor = 'default';
            ui.validCluesContainer.appendChild(clueCard);
        });
        
        switchScreen('guessing');
        
        // Start guess timer (90 seconds)
        if (state.timerEnabled) {
            startTimer(90, 'timer-display-guess', () => {
                // Timer expired - automatically pass
                processGuess(true, false, true); // true for isPass, false for wasForcedPass, true for timerExpired
            });
        }
    }

    function processGuess(isPass, wasForcedPass = false, timerExpired = false) {
        stopTimer(); // Stop the timer when processing guess
        
        const guess = ui.playerGuessInput.value.trim();
        let correct = false;
        let wasOverridden = false;

        ui.endSecretWord.textContent = state.currentWord;
        
        if (isPass) {
            if (timerExpired) {
                ui.resultMessage.textContent = "Time's Up!";
            } else if (wasForcedPass) {
                ui.resultMessage.textContent = "No Valid Clues!";
            } else {
                ui.resultMessage.textContent = "You chose to pass.";
            }
            ui.resultMessage.className = 'result-message pass';
            ui.endPlayerGuess.textContent = '---';
            document.getElementById('override-btn').style.display = 'none';
        } else {
            correct = isCloseEnough(guess, state.currentWord);
            if (correct) {
                state.score++;
                // Show different messages based on exactness
                if (guess.toLowerCase().trim() === state.currentWord.toLowerCase()) {
                    ui.resultMessage.textContent = "Correct!";
                } else {
                    ui.resultMessage.textContent = "Close enough!";
                }
                ui.resultMessage.className = 'result-message correct';
                document.getElementById('override-btn').style.display = 'none';
            } else {
                ui.resultMessage.textContent = "Incorrect!";
                ui.resultMessage.className = 'result-message incorrect';
                // Show override button for incorrect guesses
                document.getElementById('override-btn').style.display = 'inline-flex';
            }
            ui.endPlayerGuess.textContent = `"${guess}"`;
        }

        // Store current round data for potential override
        state.currentRoundData = {
            guess: guess,
            isPass: isPass,
            wasForcedPass: wasForcedPass,
            timerExpired: timerExpired,
            wasCorrect: correct,
            wasOverridden: false
        };

        updateStats();
        
        if(state.round >= 13) {
            document.getElementById('next-round-btn').textContent = "Show Final Score";
        } else {
            document.getElementById('next-round-btn').textContent = "Next Round";
        }
        
        switchScreen('roundEnd');
    }

    function overrideGuess() {
        if (state.currentRoundData && !state.currentRoundData.wasCorrect && !state.currentRoundData.wasOverridden) {
            // Award the point
            state.score++;
            state.currentRoundData.wasOverridden = true;
            
            // Update the UI
            ui.resultMessage.textContent = "Overridden as Correct!";
            ui.resultMessage.className = 'result-message correct';
            
            // Hide the override button
            document.getElementById('override-btn').style.display = 'none';
            
            // Update stats display
            updateStats();
            
            // Add a small visual feedback
            const overrideMsg = document.createElement('p');
            overrideMsg.textContent = 'Players judged this guess as acceptable.';
            overrideMsg.style.fontStyle = 'italic';
            overrideMsg.style.color = 'var(--text-secondary)';
            overrideMsg.style.marginTop = 'var(--space-4)';
            overrideMsg.style.fontSize = 'var(--text-base)';
            
            const card = document.querySelector('#round-end-screen .card');
            card.appendChild(overrideMsg);
            
            // Remove the message after moving to next round
            setTimeout(() => {
                if (overrideMsg.parentNode) {
                    overrideMsg.remove();
                }
            }, 100);
        }
    }

});