/**
 * MATH 4 KIDS - Main JavaScript File
 * Jeu éducatif pour apprendre les mathématiques
 * Version 2.0
 */

// ==================== VARIABLES GLOBALES ====================
let score = 0;              // Score total de bonnes réponses
let attempts = 0;           // Nombre total de tentatives
let streak = 0;             // Nombre de bonnes réponses consécutives
let currentResult = null;   // Résultat correct de l'opération actuelle
let currentOperation = null; // Opération en cours (+, -, ×, ÷)
let difficulty = 1;         // Niveau de difficulté (1: Facile, 2: Moyen, 3: Difficile)
let soundEnabled = true;    // État du son (activé/désactivé)

// ==================== ÉLÉMENTS DOM ====================
// Éléments de l'équation
const num1El = document.getElementById('num1');
const num2El = document.getElementById('num2');
const operationEl = document.getElementById('operation');
const messageEl = document.getElementById('message');
const equationEl = document.getElementById('equation');

// Éléments des statistiques
const scoreEl = document.getElementById('score');
const attemptsEl = document.getElementById('attempts');
const accuracyEl = document.getElementById('accuracy');
const streakEl = document.getElementById('streak');
const streakBox = document.getElementById('streakBox');

// Contrôles
const soundToggle = document.getElementById('soundToggle');

// Boutons de solution
const sol1 = document.getElementById('sol1');
const sol2 = document.getElementById('sol2');
const sol3 = document.getElementById('sol3');
const solutions = [sol1, sol2, sol3];

// ==================== FONCTIONS AUDIO ====================

/**
 * Joue un son en utilisant la Web Audio API
 * @param {string} type - Type de son ('correct' ou 'wrong')
 */
function playSound(type) {
    if (!soundEnabled) return;
    
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        if (type === 'correct') {
            // Son de réussite (note Do, son doux)
            oscillator.frequency.value = 523.25;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        } else {
            // Son d'erreur (note basse, son rugueux)
            oscillator.frequency.value = 200;
            oscillator.type = 'sawtooth';
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        }
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
        console.log('Audio non supporté:', error);
    }
}

/**
 * Toggle l'état du son
 */
function toggleSound() {
    soundEnabled = !soundEnabled;
    soundToggle.textContent = soundEnabled ? '🔊' : '🔇';
    
    // Petit feedback visuel
    soundToggle.style.transform = 'scale(1.2)';
    setTimeout(() => {
        soundToggle.style.transform = 'scale(1)';
    }, 200);
}

// ==================== FONCTIONS DE JEU ====================

/**
 * Obtient le nombre maximum selon le niveau de difficulté
 * @returns {number} Nombre maximum
 */
function getMaxNumber() {
    switch(difficulty) {
        case 1: return 9;   // Facile
        case 2: return 20;  // Moyen
        case 3: return 50;  // Difficile
        default: return 9;
    }
}

/**
 * Génère une nouvelle opération mathématique
 * @param {string} op - Opérateur (+, -, ×, ÷)
 */
function generateOperation(op) {
    currentOperation = op;
    const maxNum = getMaxNumber();
    let n1, n2, result;

    // Met à jour l'interface pour montrer l'opération active
    document.querySelectorAll('.op').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-op="${op}"]`).classList.add('active');

    // Génère les nombres selon l'opération
    switch(op) {
        case '+':
            // Addition simple
            n1 = Math.floor(Math.random() * maxNum) + 1;
            n2 = Math.floor(Math.random() * maxNum) + 1;
            result = n1 + n2;
            break;
            
        case '-':
            // Soustraction (toujours positive)
            n1 = Math.floor(Math.random() * maxNum) + 1;
            n2 = Math.floor(Math.random() * n1) + 1; // n2 toujours <= n1
            result = n1 - n2;
            break;
            
        case '×':
            // Multiplication (nombres plus petits pour éviter de trop grands résultats)
            const multMax = difficulty === 1 ? 9 : difficulty === 2 ? 12 : 15;
            n1 = Math.floor(Math.random() * multMax) + 1;
            n2 = Math.floor(Math.random() * multMax) + 1;
            result = n1 * n2;
            break;
            
        case '÷':
            // Division (toujours avec résultat entier)
            const divMax = difficulty === 1 ? 9 : 12;
            n2 = Math.floor(Math.random() * divMax) + 1;
            const multiplier = Math.floor(Math.random() * divMax) + 1;
            n1 = n2 * multiplier; // Garantit une division exacte
            result = n1 / n2;
            break;
            
        default:
            console.error('Opération non reconnue:', op);
            return;
    }

    // Met à jour l'affichage
    num1El.textContent = n1;
    num2El.textContent = n2;
    operationEl.textContent = op;
    currentResult = result;

    // Cache le message de bienvenue et affiche l'équation
    messageEl.style.display = 'none';
    equationEl.style.display = 'flex';

    // Génère les options de réponse
    generateSolutions(result);
}

/**
 * Génère 3 solutions dont une correcte et deux incorrectes
 * @param {number} correctAnswer - La réponse correcte
 */
function generateSolutions(correctAnswer) {
    // Place aléatoirement la bonne réponse
    const correctIndex = Math.floor(Math.random() * 3);
    const usedNumbers = new Set([correctAnswer]);
    
    // Plage pour générer les mauvaises réponses (proches de la bonne)
    const range = difficulty === 1 ? 10 : difficulty === 2 ? 20 : 30;

    solutions.forEach((sol, index) => {
        // Retire les classes de feedback précédentes
        sol.classList.remove('correct', 'wrong');
        
        if (index === correctIndex) {
            // Place la bonne réponse
            sol.textContent = correctAnswer;
        } else {
            // Génère une mauvaise réponse unique
            let wrongAnswer;
            let attempts = 0;
            const maxAttempts = 50;
            
            do {
                const offset = Math.floor(Math.random() * range) - Math.floor(range / 2);
                wrongAnswer = correctAnswer + offset;
                
                // Évite les nombres négatifs
                if (wrongAnswer < 0) {
                    wrongAnswer = Math.abs(wrongAnswer);
                }
                
                attempts++;
                
                // Sécurité : si on ne trouve pas de nombre unique après 50 essais
                if (attempts >= maxAttempts) {
                    wrongAnswer = correctAnswer + (index === 0 ? range : -range);
                    break;
                }
            } while (usedNumbers.has(wrongAnswer));
            
            usedNumbers.add(wrongAnswer);
            sol.textContent = wrongAnswer;
        }
    });
}

/**
 * Gère la réponse de l'utilisateur
 * @param {number} answer - La réponse choisie
 * @param {HTMLElement} buttonEl - Le bouton cliqué
 */
function handleAnswer(answer, buttonEl) {
    // Incrémente le compteur de tentatives
    attempts++;
    attemptsEl.textContent = attempts;

    if (answer === currentResult) {
        // ✅ BONNE RÉPONSE
        score++;
        streak++;
        
        // Met à jour l'affichage
        scoreEl.textContent = score;
        streakEl.textContent = streak;
        
        // Affiche le streak si >= 3
        if (streak >= 3) {
            streakBox.style.display = 'flex';
        } else {
            streakBox.style.display = 'none';
        }

        // Feedback visuel et sonore
        buttonEl.classList.add('correct');
        playSound('correct');

        // Génère une nouvelle question après un délai
        setTimeout(() => {
            generateOperation(currentOperation);
        }, 800);
        
    } else {
        // ❌ MAUVAISE RÉPONSE
        streak = 0;
        streakBox.style.display = 'none';

        // Feedback visuel et sonore
        buttonEl.classList.add('wrong');
        playSound('wrong');

        // Retire l'animation après un délai
        setTimeout(() => {
            buttonEl.classList.remove('wrong');
        }, 500);
    }

    // Calcule et affiche le pourcentage de réussite
    updateAccuracy();
}

/**
 * Met à jour le pourcentage de réussite
 */
function updateAccuracy() {
    if (attempts === 0) {
        accuracyEl.textContent = '0';
        return;
    }
    
    const accuracy = Math.round((score / attempts) * 100);
    accuracyEl.textContent = accuracy;
    
    // Change la couleur selon la précision
    const statBox = accuracyEl.parentElement;
    if (accuracy >= 80) {
        statBox.style.background = 'rgba(0, 184, 148, 0.3)'; // Vert
    } else if (accuracy >= 60) {
        statBox.style.background = 'rgba(253, 203, 110, 0.3)'; // Jaune
    } else {
        statBox.style.background = 'rgba(255, 255, 255, 0.2)'; // Par défaut
    }
}

/**
 * Change le niveau de difficulté
 * @param {number} level - Niveau (1, 2 ou 3)
 */
function changeDifficulty(level) {
    difficulty = level;
    
    // Met à jour l'interface
    document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-level="${level}"]`).classList.add('active');
    
    // Régénère l'opération si une est en cours
    if (currentOperation) {
        generateOperation(currentOperation);
    }
}

// ==================== EVENT LISTENERS ====================

// Boutons d'opérations
document.getElementById('add').addEventListener('click', () => generateOperation('+'));
document.getElementById('subtract').addEventListener('click', () => generateOperation('-'));
document.getElementById('multiply').addEventListener('click', () => generateOperation('×'));
document.getElementById('divide').addEventListener('click', () => generateOperation('÷'));

// Boutons de solutions
solutions.forEach(sol => {
    sol.addEventListener('click', () => {
        // Vérifie qu'une opération est en cours et que le bouton a une valeur
        if (currentResult !== null && sol.textContent) {
            handleAnswer(Number(sol.textContent), sol);
        }
    });
});

// Boutons de difficulté
document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const level = Number(btn.dataset.level);
        changeDifficulty(level);
    });
});

// Toggle du son
soundToggle.addEventListener('click', toggleSound);

// Support du clavier (optionnel)
document.addEventListener('keydown', (e) => {
    // Touches 1, 2, 3 pour sélectionner les réponses
    if (e.key === '1' && solutions[0].textContent) {
        handleAnswer(Number(solutions[0].textContent), solutions[0]);
    } else if (e.key === '2' && solutions[1].textContent) {
        handleAnswer(Number(solutions[1].textContent), solutions[1]);
    } else if (e.key === '3' && solutions[2].textContent) {
        handleAnswer(Number(solutions[2].textContent), solutions[2]);
    }
});

// ==================== INITIALISATION ====================

/**
 * Fonction d'initialisation appelée au chargement de la page
 */
function init() {
    console.log('🎓 Math 4 Kids - Version 2.0');
    console.log('Jeu chargé avec succès !');
    
    // Réinitialise les stats
    updateAccuracy();
}

// Lance l'initialisation quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
