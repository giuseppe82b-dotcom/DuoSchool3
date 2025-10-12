// --- RIFERIMENTI A TUTTE LE SCHERMATE E AGLI ELEMENTI ---
const welcomeScreen = document.getElementById('welcome-screen');
const fileInputScreen = document.getElementById('file-input-screen');
const quizContainer = document.getElementById('quiz-container');
const timedChallengeIntroScreen = document.getElementById('timed-challenge-intro-screen');
const userDataScreen = document.getElementById('user-data-screen');
const finalScreen = document.getElementById('final-screen');

const startButton = document.getElementById('start-button');
const fileInput = document.getElementById('file-input');
const githubFilesDropdown = document.getElementById('github-files-dropdown');
const loadFromGithubButton = document.getElementById('load-from-github-button');
const startTimedChallengeButton = document.getElementById('start-timed-challenge-button');
const generateCertButton = document.getElementById('generate-cert-button');
const restartButton = document.getElementById('restart-button');
const continueButton = document.getElementById('continue-button');

const questionText = document.getElementById('question-text');
const answersContainer = document.getElementById('answers-container');
const feedbackContainer = document.getElementById('feedback-container');
const feedbackText = document.getElementById('feedback-text');
const progressBar = document.querySelector('.progress-bar');
const errorMessage = document.getElementById('error-message');
const githubErrorMessage = document.getElementById('github-error-message');
const correctImg = document.getElementById('correct-img');
const incorrectImg = document.getElementById('incorrect-img');
const timerContainer = document.getElementById('timer-container');
const timerBarProgress = document.getElementById('timer-bar-progress');

const questionImageContainer = document.getElementById('question-image-container');
const questionImage = document.getElementById('question-image');

// --- STATO DELL'APPLICAZIONE ---
let allQuestions = []; 
let practiceQueue = []; 
let timedQueue = []; 
let totalQuestionsInLesson = 0;
let currentQuestion = null;
let loadedFileName = ''; 
let isTimedMode = false;
let timerInterval = null;

// Variabili di stato per Abbinamenti
let selectedLeftItem = null;
let selectedRightItem = null;
let correctPairsMap = new Map();
let pairedItemCount = 0;


// --- NUOVA FUNZIONE PER RIPRODURRE I SUONI ---
function playSound(fileName) {
    try {
        const audio = new Audio(fileName);
        audio.play();
    } catch (e) {
        console.error(`Impossibile riprodurre il suono ${fileName}:`, e);
    }
}

// --- GESTIONE FLUSSO E TRANSIZIONI ---
startButton.addEventListener('click', () => {
    welcomeScreen.classList.add('hidden');
    fileInputScreen.classList.remove('hidden');
    loadGithubFiles();
});
startTimedChallengeButton.addEventListener('click', () => {
    timedChallengeIntroScreen.classList.add('hidden');
    quizContainer.classList.remove('hidden');
    startTimedChallenge();
});
generateCertButton.addEventListener('click', () => {
    const name = document.getElementById('cert-name').value.trim();
    const surname = document.getElementById('cert-surname').value.trim();
    const className = document.getElementById('cert-class').value.trim();
    if (!name || !surname) {
        alert("Per favore, inserisci nome e cognome.");
        return;
    }
    generateCertificate(name, surname, className);
    userDataScreen.classList.add('hidden');
    finalScreen.classList.remove('hidden');
});
restartButton.addEventListener('click', () => window.location.reload());

// --- LOGICA DI CARICAMENTO FILE ---
fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const questions = JSON.parse(e.target.result);
            initializeQuiz(questions, file.name);
        } catch (error) {
            errorMessage.textContent = `Errore nel file: ${error.message}`;
            errorMessage.classList.remove('hidden');
        }
    };
    reader.readAsText(file);
});
loadFromGithubButton.addEventListener('click', () => {
    const selectedUrl = githubFilesDropdown.value;
    const selectedOption = githubFilesDropdown.options[githubFilesDropdown.selectedIndex];
    if (!selectedUrl) {
        alert("Per favore, seleziona un file.");
        return;
    }
    const fileName = selectedOption.text;
    fetch(selectedUrl)
        .then(response => {
            if (!response.ok) throw new Error('Risposta di rete non valida.');
            return response.json();
        })
        .then(questions => {
            initializeQuiz(questions, `${fileName}.json`);
        })
        .catch(error => {
            githubErrorMessage.textContent = `Impossibile caricare il file: ${error.message}`;
            githubErrorMessage.classList.remove('hidden');
        });
});

function initializeQuiz(loadedQuestions, fileName) {
    if (!Array.isArray(loadedQuestions) || loadedQuestions.length === 0) {
        throw new Error("Il file JSON è vuoto o non ha un formato valido.");
    }
    allQuestions = [...loadedQuestions];
    practiceQueue = [...allQuestions];
    totalQuestionsInLesson = allQuestions.length;
    loadedFileName = fileName;
    fileInputScreen.classList.add('hidden');
    quizContainer.classList.remove('hidden');
    startStandardQuiz();
}

function loadGithubFiles() {
    const githubUsername = "giuseppe82b-dotcom";
    const githubRepo = "DuoSchool3";
    const folderPath = "Materiali_json";
    const apiUrl = `https://api.github.com/repos/${githubUsername}/${githubRepo}/contents/${folderPath}`;
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) throw new Error('Controlla i dettagli della repository (username/repo) e che la cartella esista.');
            return response.json();
        })
        .then(files => {
            if (!Array.isArray(files)) throw new Error("Il percorso specificato non è una cartella o è vuoto.");
            const materials = {};
            files.forEach(file => {
                if (file.type === 'file' && file.name.endsWith('.json')) {
                    const parts = file.name.split('_');
                    if (parts.length > 1) {
                        const subject = parts[0];
                        if (!materials[subject]) materials[subject] = [];
                        materials[subject].push(file);
                    }
                }
            });
            for (const subject in materials) {
                const optgroup = document.createElement('optgroup');
                optgroup.label = subject;
                materials[subject].forEach(file => {
                    const option = document.createElement('option');
                    option.value = file.download_url;
                    option.textContent = file.name.substring(subject.length + 1).replace('.json', '');
                    optgroup.appendChild(option);
                });
                githubFilesDropdown.appendChild(optgroup);
            }
        })
        .catch(error => {
            githubErrorMessage.textContent = `Errore: ${error.message}`;
            githubErrorMessage.classList.remove('hidden');
        });
}

// --- LOGICA DEL QUIZ ---
continueButton.addEventListener('click', () => {
    if (isTimedMode) {
        if (timedQueue.length > 0) {
            loadNextQuestion();
        } else {
            playSound('timer.mp3');
            quizContainer.classList.add('hidden');
            userDataScreen.classList.remove('hidden');
        }
    } else {
        if (practiceQueue.length > 0) {
            loadNextQuestion();
        } else {
            playSound('livello.mp3');
            quizContainer.classList.add('hidden');
            timedChallengeIntroScreen.classList.remove('hidden');
        }
    }
});
function startStandardQuiz() {
    isTimedMode = false;
    progressBar.style.width = '0%';
    timerContainer.classList.add('hidden');
    progressBar.parentElement.classList.remove('hidden');
    loadNextQuestion();
}
function startTimedChallenge() {
    isTimedMode = true;
    timedQueue = [...allQuestions];
    progressBar.parentElement.classList.add('hidden');
    timerContainer.classList.remove('hidden');
    loadNextQuestion();
}

// --- Logica per "Abbinamenti" ---
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// ===== INIZIO MODIFICA CORRETTIVA =====
function checkMatch() {
    if (!selectedLeftItem || !selectedRightItem) return;

    const leftText = selectedLeftItem.textContent;
    const rightText = selectedRightItem.textContent;

    if (correctPairsMap.get(leftText) === rightText) {
        // Coppia corretta
        playSound('corretta.mp3');
        selectedLeftItem.classList.remove('selected');
        selectedRightItem.classList.remove('selected');
        selectedLeftItem.classList.add('paired-correct');
        selectedRightItem.classList.add('paired-correct');
        pairedItemCount += 2;

        selectedLeftItem = null;
        selectedRightItem = null;

        // Se tutte le coppie sono state trovate
        if (pairedItemCount === correctPairsMap.size * 2) {
            // Usa un breve ritardo per dare il tempo di vedere l'ultimo abbinamento
            setTimeout(() => {
                showSentenceFeedback(true);
            }, 500);
        }
    } else {
        // Coppia errata: resetta l'esercizio
        playSound('errata.mp3');
        selectedLeftItem.classList.add('paired-incorrect');
        selectedRightItem.classList.add('paired-incorrect');

        // Disabilita ulteriori click mentre si attende il reset
        document.querySelectorAll('.matching-item').forEach(item => item.style.pointerEvents = 'none');

        // Aggiungi la domanda di nuovo in coda per la ripetizione (solo in modalità pratica)
        if (!isTimedMode) {
            practiceQueue.push(currentQuestion);
        }

        setTimeout(() => {
            alert("Hai commesso un errore! Questo esercizio verrà ricaricato per permetterti di riprovare.");
            createMatchingUI(); // Ricarica l'interfaccia per la domanda corrente
        }, 1000); // 1 secondo di ritardo per mostrare l'errore
    }
}
// ===== FINE MODIFICA CORRETTIVA =====

function createMatchingUI() {
    answersContainer.innerHTML = '';
    answersContainer.classList.remove('answers-grid', 'true-false-layout', 'sentence-rebuild-container');
    
    selectedLeftItem = null;
    selectedRightItem = null;
    pairedItemCount = 0;
    correctPairsMap = new Map(currentQuestion.pairs);

    const leftColumnItems = shuffleArray(currentQuestion.pairs.map(p => p[0]));
    const rightColumnItems = shuffleArray(currentQuestion.pairs.map(p => p[1]));

    const container = document.createElement('div');
    container.className = 'matching-container';

    const leftColumn = document.createElement('div');
    leftColumn.className = 'matching-column';
    const rightColumn = document.createElement('div');
    rightColumn.className = 'matching-column';

    leftColumnItems.forEach(text => {
        const item = document.createElement('div');
        item.textContent = text;
        item.classList.add('matching-item');
        item.addEventListener('click', () => {
            if (item.classList.contains('paired-correct')) return;
            if (selectedLeftItem) selectedLeftItem.classList.remove('selected');
            selectedLeftItem = item;
            item.classList.add('selected');
            checkMatch();
        });
        leftColumn.appendChild(item);
    });

    rightColumnItems.forEach(text => {
        const item = document.createElement('div');
        item.textContent = text;
        item.classList.add('matching-item');
        item.addEventListener('click', () => {
            if (item.classList.contains('paired-correct')) return;
            if (selectedRightItem) selectedRightItem.classList.remove('selected');
            selectedRightItem = item;
            item.classList.add('selected');
            checkMatch();
        });
        rightColumn.appendChild(item);
    });

    container.appendChild(leftColumn);
    container.appendChild(rightColumn);
    answersContainer.appendChild(container);
}

function createTrueFalseButtons() {
    answersContainer.innerHTML = '';
    answersContainer.classList.add('true-false-layout', 'answers-grid');
    const trueButton = document.createElement('button');
    trueButton.textContent = 'VERO';
    trueButton.classList.add('answer-button', 'true-false-button', 'true-button');
    trueButton.addEventListener('click', () => selectAnswer(trueButton, 'Vero'));
    const falseButton = document.createElement('button');
    falseButton.textContent = 'FALSO';
    falseButton.classList.add('answer-button', 'true-false-button', 'false-button');
    falseButton.addEventListener('click', () => selectAnswer(falseButton, 'Falso'));
    answersContainer.appendChild(trueButton);
    answersContainer.appendChild(falseButton);
}
function createSentenceRebuildUI() {
    answersContainer.innerHTML = '';
    answersContainer.classList.remove('answers-grid', 'true-false-layout');
    answersContainer.classList.add('sentence-rebuild-container');

    const dropZone = document.createElement('div');
    dropZone.id = 'sentence-drop-zone';
    const wordBank = document.createElement('div');
    wordBank.id = 'word-bank';
    const checkButton = document.createElement('button');
    checkButton.id = 'check-sentence-button';
    checkButton.textContent = 'Verifica';
    checkButton.classList.add('action-button');

    const words = currentQuestion.sentence.split(' ');
    const shuffledWords = [...words].sort(() => Math.random() - 0.5);

    shuffledWords.forEach(word => {
        const wordPill = document.createElement('div');
        wordPill.textContent = word;
        wordPill.classList.add('word-pill');
        wordPill.draggable = true;
        wordPill.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', e.target.textContent);
            setTimeout(() => e.target.classList.add('dragging'), 0);
        });
        wordPill.addEventListener('dragend', (e) => e.target.classList.remove('dragging'));
        wordBank.appendChild(wordPill);
    });

    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const wordText = e.dataTransfer.getData('text/plain');
        const originalPill = Array.from(wordBank.children).find(p => p.textContent === wordText && !p.classList.contains('hidden'));
        if (originalPill) {
            originalPill.classList.add('hidden');
            const newPill = document.createElement('div');
            newPill.textContent = wordText;
            newPill.classList.add('word-pill');
            dropZone.appendChild(newPill);
        }
    });
    
    checkButton.addEventListener('click', () => {
        const userAnswer = Array.from(dropZone.children).map(pill => pill.textContent).join(' ');
        const isCorrect = userAnswer === currentQuestion.sentence;
        showSentenceFeedback(isCorrect);
    });

    answersContainer.appendChild(dropZone);
    answersContainer.appendChild(wordBank);
    answersContainer.appendChild(checkButton);
}
function showSentenceFeedback(isCorrect) {
    if (document.getElementById('check-sentence-button')) {
        document.getElementById('check-sentence-button').classList.add('hidden');
    }
    feedbackContainer.classList.remove('correct-feedback', 'incorrect-feedback');
    continueButton.classList.remove('correct', 'incorrect');
    
    if (isCorrect) {
        playSound('corretta.mp3');
        feedbackText.textContent = "Corretto!";
        feedbackContainer.classList.add('correct-feedback');
        continueButton.classList.add('correct');
        correctImg.classList.remove('hidden');
    } else {
        playSound('errata.mp3');
        if (!isTimedMode) practiceQueue.push(currentQuestion);
        feedbackText.textContent = `Risposta esatta: "${currentQuestion.sentence || currentQuestion.correctAnswer}"`;
        feedbackContainer.classList.add('incorrect-feedback');
        continueButton.classList.add('incorrect');
        incorrectImg.classList.remove('hidden');
    }
    
    feedbackContainer.classList.remove('hidden');
    if (!isTimedMode) updateProgressBar();
}

function loadNextQuestion() {
    feedbackContainer.classList.add('hidden');
    correctImg.classList.add('hidden');
    incorrectImg.classList.add('hidden');
    answersContainer.innerHTML = '';
    answersContainer.className = 'answers-grid';
    
    questionImageContainer.classList.add('hidden');
    questionImage.src = '';
    
    currentQuestion = isTimedMode ? timedQueue.shift() : practiceQueue.shift();
    questionText.textContent = currentQuestion.question;

    if (currentQuestion.imageUrl && currentQuestion.imageUrl.trim() !== '') {
        questionImage.src = currentQuestion.imageUrl;
        questionImageContainer.classList.remove('hidden');
    }
    
    if (isTimedMode) {
        startTimer(currentQuestion.time || 1);
    }

    if (currentQuestion.type === 'vero_falso') {
        createTrueFalseButtons();
    } else if (currentQuestion.type === 'ricostruisci_frase') {
        createSentenceRebuildUI();
    } else if (currentQuestion.type === 'abbinamenti') {
        createMatchingUI();
    } else {
        currentQuestion.options.forEach(option => {
            const button = document.createElement('button');
            button.textContent = option;
            button.classList.add('answer-button');
            button.addEventListener('click', () => selectAnswer(button, option));
            answersContainer.appendChild(button);
        });
    }
}

function selectAnswer(button, selectedOption) {
    if (isTimedMode) clearInterval(timerInterval);
    document.querySelectorAll('.answer-button').forEach(btn => btn.classList.add('disabled'));
    const isCorrect = selectedOption === currentQuestion.correctAnswer;
    feedbackContainer.classList.remove('correct-feedback', 'incorrect-feedback');
    continueButton.classList.remove('correct', 'incorrect');
    if (isCorrect) {
        playSound('corretta.mp3');
        button.classList.add('correct');
        feedbackText.textContent = "Corretto!";
        feedbackContainer.classList.add('correct-feedback');
        continueButton.classList.add('correct');
        correctImg.classList.remove('hidden');
    } else {
        playSound('errata.mp3');
        if (!isTimedMode) practiceQueue.push(currentQuestion);
        button.classList.add('incorrect');
        feedbackText.textContent = `Risposta esatta: "${currentQuestion.correctAnswer}"`;
        feedbackContainer.classList.add('incorrect-feedback');
        continueButton.classList.add('incorrect');
        incorrectImg.classList.remove('hidden');
        document.querySelectorAll('.answer-button').forEach(btn => {
            if (btn.textContent === currentQuestion.correctAnswer) btn.classList.add('correct');
        });
        if (isTimedMode) {
            continueButton.classList.add('hidden');
            setTimeout(() => {
                alert("Hai sbagliato! Devi ricominciare il test dall'inizio.");
                window.location.reload();
            }, 1000);
        }
    }
    feedbackContainer.classList.remove('hidden');
    if (!isTimedMode) updateProgressBar();
}
function updateProgressBar() {
    const questionsAnsweredCorrectly = totalQuestionsInLesson - new Set(practiceQueue.map(q => q.question)).size;
    const progressPercentage = (questionsAnsweredCorrectly / totalQuestionsInLesson) * 100;
    progressBar.style.width = `${progressPercentage}%`;
}
function startTimer(minutes) {
    const totalSeconds = minutes * 60;
    let secondsRemaining = totalSeconds;
    timerBarProgress.style.transition = 'none';
    timerBarProgress.style.width = '100%';
    void timerBarProgress.offsetWidth; 
    timerBarProgress.style.transition = `width ${totalSeconds}s linear`;
    timerBarProgress.style.width = '0%';
    timerInterval = setInterval(() => {
        secondsRemaining--;
        if (secondsRemaining < 0) {
            clearInterval(timerInterval);
            alert("Tempo scaduto! Devi ricominciare il test dall'inizio.");
            window.location.reload();
        }
    }, 1000);
}
function generateCertificate(name, surname, className) {
    const canvas = document.createElement('canvas');
    canvas.width = 800; canvas.height = 565;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#58cc02'; ctx.lineWidth = 10;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    ctx.fillStyle = '#4c4c4c'; ctx.font = 'bold 50px Nunito, sans-serif';
    ctx.textAlign = 'center'; ctx.fillText('CONGRATULAZIONI', canvas.width / 2, 100);
    ctx.fillStyle = '#1cb0f6'; ctx.font = 'bold 40px Nunito, sans-serif';
    ctx.fillText(`${name.toUpperCase()} ${surname.toUpperCase()}`, canvas.width / 2, 180);
    if (className) {
        ctx.fillStyle = '#777777'; ctx.font = 'bold 24px Nunito, sans-serif';
        ctx.fillText(`Classe: ${className}`, canvas.width / 2, 230);
    }
    ctx.fillStyle = '#4c4c4c'; ctx.font = 'bold 24px Nunito, sans-serif';
    ctx.fillText("HAI CONCLUSO L'ESERCITAZIONE", canvas.width / 2, 320);
    ctx.font = 'bold 28px Nunito, sans-serif'; ctx.fillText(loadedFileName, canvas.width / 2, 370);
    const today = new Date().toLocaleDateString('it-IT');
    ctx.fillStyle = '#777777'; ctx.font = '20px Nunito, sans-serif';
    ctx.fillText(today, canvas.width / 2, 450);
    const link = document.createElement('a');
    link.download = `Attestato-${name}-${surname}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

}
