// Game State
let gameState = {
    board: ['', '', '', '', '', '', '', '', ''],
    currentPlayer: 'X',
    gameActive: true,
    player1: { name: 'Player 1', symbol: 'X', roundsWon: 0 },
    player2: { name: 'Player 2', symbol: 'O', roundsWon: 0 },
    roundHistory: [],
    matchId: null
};

const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

// DOM Elements
const screens = {
    start: document.getElementById('startScreen'),
    name: document.getElementById('nameScreen'),
    load: document.getElementById('loadScreen'),
    game: document.getElementById('gameScreen'),
    winner: document.getElementById('winnerScreen')
};

const cells = document.querySelectorAll('.cell');
const statusDisplay = document.getElementById('status');

// Initialize
function init() {
    // Menu buttons
    document.getElementById('newGameBtn').addEventListener('click', showNameScreen);
    document.getElementById('loadGameBtn').addEventListener('click', showLoadScreen);
    
    // Name screen
    document.getElementById('startMatchBtn').addEventListener('click', startNewMatch);
    document.getElementById('backToMenuBtn').addEventListener('click', () => showScreen('start'));
    
    // Load screen
    document.getElementById('backToMenuFromLoad').addEventListener('click', () => showScreen('start'));
    
    // Game buttons
    document.getElementById('restart').addEventListener('click', nextRound);
    document.getElementById('saveGame').addEventListener('click', saveGame);
    document.getElementById('quitGame').addEventListener('click', quitGame);
    
    // Winner screen
    document.getElementById('newMatchBtn').addEventListener('click', showNameScreen);
    document.getElementById('backToMenuFromWinner').addEventListener('click', () => showScreen('start'));
    
    // Cell clicks
    cells.forEach(cell => cell.addEventListener('click', handleCellClick));
    
    // Show start screen
    showScreen('start');
}

// Screen Management
function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    screens[screenName].classList.add('active');
}

function showNameScreen() {
    document.getElementById('player1Name').value = '';
    document.getElementById('player2Name').value = '';
    showScreen('name');
}

function showLoadScreen() {
    displaySavedGames();
    showScreen('load');
}

// Start New Match
function startNewMatch() {
    const p1Name = document.getElementById('player1Name').value.trim() || 'Player 1';
    const p2Name = document.getElementById('player2Name').value.trim() || 'Player 2';
    
    gameState = {
        board: ['', '', '', '', '', '', '', '', ''],
        currentPlayer: 'X',
        gameActive: true,
        player1: { name: p1Name, symbol: 'X', roundsWon: 0 },
        player2: { name: p2Name, symbol: 'O', roundsWon: 0 },
        roundHistory: [],
        matchId: Date.now()
    };
    
    updatePlayerDisplay();
    resetBoard();
    showScreen('game');
}

// Load Game
function displaySavedGames() {
    const savedGames = getSavedGames();
    const container = document.getElementById('savedGamesList');
    
    if (savedGames.length === 0) {
        container.innerHTML = '<div class="no-saved-games">No saved games found</div>';
        return;
    }
    
    container.innerHTML = savedGames.map((game, index) => `
        <div class="saved-game-item" onclick="loadGame(${index})">
            <h3>${game.player1.name} vs ${game.player2.name}</h3>
            <p>Score: ${game.player1.roundsWon} - ${game.player2.roundsWon}</p>
            <p>Saved: ${new Date(game.matchId).toLocaleString()}</p>
            <button class="delete-btn" onclick="event.stopPropagation(); deleteGame(${index})">Delete</button>
        </div>
    `).join('');
}

function loadGame(index) {
    const savedGames = getSavedGames();
    gameState = savedGames[index];
    gameState.gameActive = true;
    
    updatePlayerDisplay();
    resetBoard();
    updateHistory();
    showScreen('game');
}

function deleteGame(index) {
    const savedGames = getSavedGames();
    savedGames.splice(index, 1);
    localStorage.setItem('ticTacToeSaves', JSON.stringify(savedGames));
    displaySavedGames();
}

// Save/Load Functions
function saveGame() {
    const savedGames = getSavedGames();
    
    // Check if this match already exists
    const existingIndex = savedGames.findIndex(g => g.matchId === gameState.matchId);
    
    if (existingIndex !== -1) {
        savedGames[existingIndex] = gameState;
    } else {
        savedGames.push(gameState);
    }
    
    localStorage.setItem('ticTacToeSaves', JSON.stringify(savedGames));
    alert('Game saved successfully!');
}

function getSavedGames() {
    const saved = localStorage.getItem('ticTacToeSaves');
    return saved ? JSON.parse(saved) : [];
}

// Game Logic
function handleCellClick(event) {
    const cell = event.target;
    const index = parseInt(cell.getAttribute('data-index'));
    
    if (gameState.board[index] !== '' || !gameState.gameActive) return;
    
    updateCell(cell, index);
    checkResult();
}

function updateCell(cell, index) {
    gameState.board[index] = gameState.currentPlayer;
    cell.textContent = gameState.currentPlayer;
    cell.classList.add('taken', gameState.currentPlayer.toLowerCase());
}

function checkResult() {
    let roundWon = false;
    let winningCombination = [];
    
    for (let condition of winningConditions) {
        const [a, b, c] = condition;
        if (gameState.board[a] && 
            gameState.board[a] === gameState.board[b] && 
            gameState.board[a] === gameState.board[c]) {
            roundWon = true;
            winningCombination = condition;
            break;
        }
    }
    
    if (roundWon) {
        const winner = gameState.currentPlayer === 'X' ? gameState.player1 : gameState.player2;
        winner.roundsWon++;
        
        statusDisplay.textContent = `${winner.name} wins this round!`;
        gameState.gameActive = false;
        highlightWinningCells(winningCombination);
        
        gameState.roundHistory.push({
            winner: winner.name,
            type: 'win'
        });
        
        updatePlayerDisplay();
        updateHistory();
        
        // Check if match is won
        if (winner.roundsWon >= 5) {
            setTimeout(() => showWinnerScreen(), 2000);
        }
        
        return;
    }
    
    if (!gameState.board.includes('')) {
        statusDisplay.textContent = "It's a Draw!";
        gameState.gameActive = false;
        
        gameState.roundHistory.push({
            winner: 'Draw',
            type: 'draw'
        });
        
        updateHistory();
        return;
    }
    
    gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
    const currentPlayerObj = gameState.currentPlayer === 'X' ? gameState.player1 : gameState.player2;
    statusDisplay.textContent = `${currentPlayerObj.name}'s Turn`;
}

function highlightWinningCells(combination) {
    combination.forEach(index => {
        cells[index].classList.add('winner');
    });
}

function nextRound() {
    resetBoard();
}

function resetBoard() {
    gameState.board = ['', '', '', '', '', '', '', '', ''];
    gameState.currentPlayer = 'X';
    gameState.gameActive = true;
    
    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('taken', 'x', 'o', 'winner');
    });
    
    statusDisplay.textContent = `${gameState.player1.name}'s Turn`;
}

function updatePlayerDisplay() {
    document.getElementById('p1Name').textContent = gameState.player1.name;
    document.getElementById('p2Name').textContent = gameState.player2.name;
    document.getElementById('p1Rounds').textContent = gameState.player1.roundsWon;
    document.getElementById('p2Rounds').textContent = gameState.player2.roundsWon;
}

function updateHistory() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = gameState.roundHistory.map((round, index) => `
        <div class="history-item">
            Round ${index + 1}: ${round.winner === 'Draw' ? 'Draw' : round.winner + ' won'}
        </div>
    `).join('');
}

function showWinnerScreen() {
    const winner = gameState.player1.roundsWon >= 5 ? gameState.player1 : gameState.player2;
    const loser = winner === gameState.player1 ? gameState.player2 : gameState.player1;
    
    document.getElementById('matchWinnerName').textContent = `${winner.name} Wins!`;
    document.getElementById('matchWinnerScore').textContent = 
        `${winner.roundsWon} - ${loser.roundsWon}`;
    
    const totalRounds = gameState.roundHistory.length;
    const draws = gameState.roundHistory.filter(r => r.type === 'draw').length;
    
    document.getElementById('finalStats').innerHTML = `
        <div class="stat-row">
            <span>Total Rounds:</span>
            <span>${totalRounds}</span>
        </div>
        <div class="stat-row">
            <span>${gameState.player1.name}:</span>
            <span>${gameState.player1.roundsWon} wins</span>
        </div>
        <div class="stat-row">
            <span>${gameState.player2.name}:</span>
            <span>${gameState.player2.roundsWon} wins</span>
        </div>
        <div class="stat-row">
            <span>Draws:</span>
            <span>${draws}</span>
        </div>
    `;
    
    showScreen('winner');
    
    // Delete saved game if exists
    const savedGames = getSavedGames();
    const index = savedGames.findIndex(g => g.matchId === gameState.matchId);
    if (index !== -1) {
        savedGames.splice(index, 1);
        localStorage.setItem('ticTacToeSaves', JSON.stringify(savedGames));
    }
}

function quitGame() {
    if (confirm('Are you sure you want to quit? Make sure to save your game first!')) {
        showScreen('start');
    }
}

// Make functions globally accessible
window.loadGame = loadGame;
window.deleteGame = deleteGame;

// Start the app
init();