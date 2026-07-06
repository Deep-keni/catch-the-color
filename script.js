// script.js - Core Game Logic for "Catch the Color"

// 1. Game Configuration
const colors = [
    { name: 'red', hex: '#ff4d4d' },
    { name: 'blue', hex: '#0077ff' },
    { name: 'green', hex: '#2ecc71' },
    { name: 'yellow', hex: '#f1c40f' },
    { name: 'purple', hex: '#9b59b6' }
];

let score = 0;
let currentTarget = null;
let gameActive = false;
let startTime = 0;
let spawnTimeout = null;
let timerInterval = null;

// Target Generation Tracking to prevent race conditions
let targetGeneration = 0;

// Metrics for Reaction Time
let totalReactionTime = 0; // Sum of reaction times in ms
let correctTaps = 0; // Number of correct taps

// 2. DOM Elements
const gameArea = document.getElementById('game-area');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const targetBox = document.getElementById('target-box');
const finalScoreElement = document.getElementById('final-score');

// 3. Game Initialization
function init() {
    if (window.location.pathname.includes('game.html')) {
        startGame();
    } else if (window.location.pathname.includes('result.html')) {
        showResults();
    }
}

function startGame() {
    score = 0;
    correctTaps = 0;
    totalReactionTime = 0;
    targetGeneration = 0;
    gameActive = true;
    startTime = Date.now();
    updateScore(0);
    pickNewTarget();
    
    if (timerElement) {
        timerElement.innerText = "0.0";
    }
    
    // Live timer update loop (every 100ms)
    timerInterval = setInterval(() => {
        if (gameActive) {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            if (timerElement) timerElement.innerText = elapsed;
        }
    }, 100);
    
    // Start recursive spawning loop
    triggerNextSpawn();
}

function triggerNextSpawn() {
    if (!gameActive) return;
    
    // Difficulty Scaling for Spawning Delay:
    // Base delay starts at 1000ms and drops by 25ms per point (minimum 400ms)
    // Random range starts at 500ms and drops by 15ms per point (minimum 200ms)
    const baseSpawnDelay = Math.max(400, 1000 - score * 25);
    const randomSpawnRange = Math.max(200, 500 - score * 15);
    const delay = Math.random() * randomSpawnRange + baseSpawnDelay;
    
    spawnTimeout = setTimeout(() => {
        if (gameActive) {
            spawnCircle();
            triggerNextSpawn();
        }
    }, delay);
}

// 4. Game Logic Functions

function pickNewTarget() {
    targetGeneration++;
    const randomIndex = Math.floor(Math.random() * colors.length);
    currentTarget = colors[randomIndex];
    
    if (targetBox) {
        targetBox.style.backgroundColor = currentTarget.hex;
        targetBox.style.boxShadow = `0 0 15px ${currentTarget.hex}`;
    }
}

function spawnCircle() {
    if (!gameArea) return;

    const circle = document.createElement('div');
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    circle.className = 'circle';
    circle.style.backgroundColor = randomColor.hex;
    circle.style.boxShadow = `0 0 20px ${randomColor.hex}`;
    
    const circleSize = 80;
    const headerHeight = 110;
    
    // Avoid overlap: generate random positions and check against existing circles
    const existingCircles = document.querySelectorAll('.circle');
    let x = 0;
    let y = 0;
    let attempts = 0;
    let overlap = false;
    
    do {
        overlap = false;
        const maxX = window.innerWidth - circleSize - 20;
        const maxY = window.innerHeight - circleSize - 20;
        x = Math.random() * Math.max(10, maxX) + 10;
        y = Math.random() * Math.max(headerHeight, maxY - headerHeight) + headerHeight;
        
        for (let other of existingCircles) {
            const ox = parseFloat(other.style.left);
            const oy = parseFloat(other.style.top);
            
            const dx = x - ox;
            const dy = y - oy;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < circleSize) {
                overlap = true;
                break;
            }
        }
        attempts++;
    } while (overlap && attempts < 15);
    
    circle.style.left = `${x}px`;
    circle.style.top = `${y}px`;
    
    // Save metadata on dataset to ensure absolute correctness and avoid closure bugs
    const spawnTargetName = currentTarget.name;
    const spawnedGen = targetGeneration;
    const spawnTime = Date.now();
    const isTargetAtSpawn = (randomColor.name === spawnTargetName);
    
    circle.dataset.color = randomColor.name;
    circle.dataset.spawnTime = spawnTime;
    circle.dataset.generation = spawnedGen;
    circle.dataset.isTargetAtSpawn = isTargetAtSpawn ? "true" : "false";
    
    // Handle Click
    circle.onclick = (e) => {
        e.stopPropagation();
        const clickedColorName = circle.dataset.color;
        const circleSpawnTime = parseInt(circle.dataset.spawnTime, 10);
        handleCircleClick(clickedColorName, circle, circleSpawnTime);
    };
    
    gameArea.appendChild(circle);
    
    // Difficulty Scaling for Circle Lifetime (Visible Time):
    // Starts at 1000ms and drops by 20ms per point (minimum 450ms)
    const lifetime = Math.max(450, 1000 - score * 20);
    
    // Auto-remove after calculated lifetime (Missed)
    setTimeout(() => {
        if (circle.parentElement && gameActive) {
            const currentGen = targetGeneration;
            const wasTarget = (circle.dataset.isTargetAtSpawn === "true");
            const circleGen = parseInt(circle.dataset.generation, 10);
            
            // End game ONLY if the circle matched target at spawn, and target hasn't changed since
            if (wasTarget && circleGen === currentGen) {
                endGame('Missed the target color!');
            } else {
                // Animate fadeOut for non-target circles that naturally expire
                circle.style.pointerEvents = 'none';
                circle.style.animation = 'fadeOut 0.2s ease-in forwards';
                setTimeout(() => {
                    if (circle.parentElement) {
                        circle.remove();
                    }
                }, 200);
            }
        }
    }, lifetime);
}

function handleCircleClick(clickedColorName, element, spawnTime) {
    if (!gameActive) return;
    
    if (clickedColorName === currentTarget.name) {
        // Correct Hit!
        const tapTime = Date.now();
        const reaction = tapTime - spawnTime;
        totalReactionTime += reaction;
        correctTaps++;
        
        score++;
        updateScore(score);
        
        // Play disappear animation, disable pointer events to prevent duplicate clicks
        element.style.pointerEvents = 'none';
        element.style.animation = 'fadeOut 0.2s cubic-bezier(0.6, -0.28, 0.735, 0.045) forwards';
        setTimeout(() => {
            if (element.parentElement) {
                element.remove();
            }
        }, 200);
        
        pickNewTarget();
    } else {
        // Wrong Color!
        endGame('Wrong color tapped!');
    }
}

function updateScore(newScore) {
    if (scoreElement) scoreElement.innerText = newScore;
}

function endGame(reason) {
    gameActive = false;
    if (spawnTimeout) clearTimeout(spawnTimeout);
    if (timerInterval) clearInterval(timerInterval);
    
    // Clear the board
    if (gameArea) gameArea.innerHTML = '';
    
    const survivalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    const avgReactionTime = correctTaps > 0 ? (totalReactionTime / correctTaps / 1000).toFixed(3) : 'N/A';
    
    // Save/Update High Score in localStorage
    const currentHighScore = localStorage.getItem('highScore') || 0;
    if (score > parseInt(currentHighScore, 10)) {
        localStorage.setItem('highScore', score);
    }
    
    // Save current game run details to localStorage
    localStorage.setItem('finalScore', score);
    localStorage.setItem('survivalTime', survivalTime);
    localStorage.setItem('avgReactionTime', avgReactionTime);
    localStorage.setItem('gameOverReason', reason);
    
    // Redirect to results page
    window.location.href = 'result.html';
}

function showResults() {
    const finalScore = localStorage.getItem('finalScore') || 0;
    const survivalTime = localStorage.getItem('survivalTime') || '0.00';
    const avgReactionTime = localStorage.getItem('avgReactionTime') || 'N/A';
    const reason = localStorage.getItem('gameOverReason') || 'Unknown';
    const highScore = localStorage.getItem('highScore') || 0;
    
    if (finalScoreElement) {
        finalScoreElement.innerText = finalScore;
    }
    
    // Dynamically assign reflex performance rating based on final score
    let rating = 'Beginner 🐢';
    const parsedScore = parseInt(finalScore, 10);
    if (parsedScore >= 20) {
        rating = 'Light Speed ⚡';
    } else if (parsedScore >= 12) {
        rating = 'Cheetah 🐆';
    } else if (parsedScore >= 7) {
        rating = 'Ninja 🥷';
    } else if (parsedScore >= 3) {
        rating = 'Human 🚶';
    }
    
    const statsDiv = document.getElementById('game-stats');
    if (statsDiv) {
        statsDiv.innerHTML = `
            <div class="gameOver-reason">${reason}</div>
            <div class="stats-grid">
                <div class="stat-card">
                    <span class="stat-label">Reaction Time</span>
                    <span class="stat-value">${avgReactionTime}${avgReactionTime !== 'N/A' ? 's' : ''}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-label">Survival Time</span>
                    <span class="stat-value">${survivalTime}s</span>
                </div>
                <div class="stat-card" style="grid-column: span 2;">
                    <span class="stat-label">Personal Best (High Score)</span>
                    <span class="stat-value" style="color: #ffd700;">🏆 ${highScore}</span>
                </div>
            </div>
            <div class="rating-badge">${rating}</div>
        `;
    }
}

// Start the script
document.addEventListener('DOMContentLoaded', init);
