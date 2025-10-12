document.addEventListener('DOMContentLoaded', () => {
    // --- STATO GLOBALE ---
    let questions = [];

    // --- RIFERIMENTI DOM ---
    const formMultipleChoice = document.getElementById('form-multiple-choice');
    const formTrueFalse = document.getElementById('form-true-false');
    const formSentenceRebuild = document.getElementById('form-sentence-rebuild');
    const formMatching = document.getElementById('form-matching'); // Nuovo riferimento
    
    const questionsPreview = document.getElementById('questions-preview');
    const generateJsonButton = document.getElementById('generate-json-button');
    const fileNameInput = document.getElementById('file-name');

    // --- FUNZIONI DI GESTIONE DEI MODULI ---

    // Aggiunge una nuova riga per un'opzione (Scelta Multipla)
    function addOptionInput(container) {
        const div = document.createElement('div');
        div.className = 'option-entry';
        const isFirstOption = container.children.length === 0;

        div.innerHTML = `
            <input type="text" placeholder="Testo opzione" class="option-text-input">
            <label class="radio-label">
                <input type="radio" name="correct-answer-${container.parentElement.id}" ${isFirstOption ? 'checked' : ''}>
                Corretta?
            </label>
            <button type="button" class="remove-option-button">X</button>
        `;
        container.appendChild(div);

        div.querySelector('.remove-option-button').addEventListener('click', () => {
            if (container.children.length > 2) div.remove();
            else alert("Sono necessarie almeno due opzioni.");
        });
    }

    // Aggiunge una nuova riga per una coppia (Abbinamenti)
    function addPairInput(container) {
        const div = document.createElement('div');
        div.className = 'pair-entry';
        div.innerHTML = `
            <input type="text" placeholder="Elemento A">
            <input type="text" placeholder="Elemento B">
            <button type="button" class="remove-option-button">X</button>
        `;
        container.appendChild(div);

        div.querySelector('.remove-option-button').addEventListener('click', () => {
            if (container.children.length > 2) div.remove();
            else alert("Sono necessarie almeno due coppie.");
        });
    }

    // --- GESTORE EVENTI PER OGNI MODULO ---

    // 1. Scelta Multipla
    const mcOptionsContainer = formMultipleChoice.querySelector('.options-container');
    formMultipleChoice.querySelector('.add-option-button').addEventListener('click', () => addOptionInput(mcOptionsContainer));
    formMultipleChoice.addEventListener('submit', (e) => {
        e.preventDefault();
        const questionText = formMultipleChoice.querySelector('.question-text').value.trim();
        const imageUrl = formMultipleChoice.querySelector('.image-url').value.trim();
        const time = parseInt(formMultipleChoice.querySelector('.time-minutes').value);

        const options = [];
        let correctAnswer = null;
        for (const entry of mcOptionsContainer.querySelectorAll('.option-entry')) {
            const textValue = entry.querySelector('.option-text-input').value.trim();
            if (!textValue) { alert("Tutte le opzioni devono avere un testo."); return; }
            options.push(textValue);
            if (entry.querySelector('input[type="radio"]').checked) correctAnswer = textValue;
        }

        if (options.length < 2 || !correctAnswer) { alert("Sono necessarie almeno due opzioni e una deve essere corretta."); return; }

        const newQuestion = { question: questionText, time, options, correctAnswer };
        if (imageUrl) newQuestion.imageUrl = imageUrl;
        questions.push(newQuestion);
        renderQuestionsPreview();
        formMultipleChoice.reset();
        mcOptionsContainer.innerHTML = '';
        addOptionInput(mcOptionsContainer);
        addOptionInput(mcOptionsContainer);
    });

    // 2. Vero/Falso
    formTrueFalse.addEventListener('submit', (e) => {
        e.preventDefault();
        const questionText = formTrueFalse.querySelector('.question-text').value.trim();
        const imageUrl = formTrueFalse.querySelector('.image-url').value.trim();
        const time = parseInt(formTrueFalse.querySelector('.time-minutes').value);
        const correctAnswer = formTrueFalse.querySelector('input[name="true-false-answer"]:checked').value;
        if (!questionText) { alert("Inserisci il testo della domanda."); return; }
        const newQuestion = { question: questionText, time, type: 'vero_falso', correctAnswer };
        if (imageUrl) newQuestion.imageUrl = imageUrl;
        questions.push(newQuestion);
        renderQuestionsPreview();
        formTrueFalse.reset();
    });

    // 3. Ricostruisci la Frase
    formSentenceRebuild.addEventListener('submit', (e) => {
        e.preventDefault();
        const questionText = formSentenceRebuild.querySelector('.question-text').value.trim();
        const imageUrl = formSentenceRebuild.querySelector('.image-url').value.trim();
        const time = parseInt(formSentenceRebuild.querySelector('.time-minutes').value);
        const sentence = formSentenceRebuild.querySelector('.sentence-text').value.trim();
        if (!questionText || !sentence) { alert("Inserisci sia la consegna che la frase corretta."); return; }
        const newQuestion = { question: questionText, time, type: 'ricostruisci_frase', sentence };
        if (imageUrl) newQuestion.imageUrl = imageUrl;
        questions.push(newQuestion);
        renderQuestionsPreview();
        formSentenceRebuild.reset();
    });
    
    // 4. Abbinamenti (NUOVO)
    const pairsContainer = formMatching.querySelector('.pairs-container');
    formMatching.querySelector('.add-pair-button').addEventListener('click', () => addPairInput(pairsContainer));
    formMatching.addEventListener('submit', (e) => {
        e.preventDefault();
        const questionText = formMatching.querySelector('.question-text').value.trim();
        const imageUrl = formMatching.querySelector('.image-url').value.trim();
        const time = parseInt(formMatching.querySelector('.time-minutes').value);
        
        const pairs = [];
        for (const entry of pairsContainer.querySelectorAll('.pair-entry')) {
            const inputs = entry.querySelectorAll('input[type="text"]');
            const val1 = inputs[0].value.trim();
            const val2 = inputs[1].value.trim();
            if (!val1 || !val2) { alert("Tutti i campi di una coppia devono essere compilati."); return; }
            pairs.push([val1, val2]);
        }
        
        if (pairs.length < 2) { alert("Sono necessarie almeno due coppie."); return; }

        const newQuestion = { question: questionText, time, type: 'abbinamenti', pairs };
        if (imageUrl) newQuestion.imageUrl = imageUrl;
        questions.push(newQuestion);
        renderQuestionsPreview();
        formMatching.reset();
        pairsContainer.innerHTML = '';
        addPairInput(pairsContainer);
        addPairInput(pairsContainer);
    });

    // --- FUNZIONI GLOBALI (Anteprima e Generazione JSON) ---
    function renderQuestionsPreview() {
        questionsPreview.innerHTML = questions.length === 0
            ? '<p class="empty-state">Nessuna domanda ancora aggiunta.</p>'
            : '';
        generateJsonButton.disabled = questions.length === 0;

        questions.forEach((q, index) => {
            const card = document.createElement('div');
            card.className = 'question-card';
            let details = '';

            if (q.type === 'vero_falso') {
                details = `<p><strong>Tipo:</strong> Vero/Falso<br><strong>Risposta:</strong> ${q.correctAnswer}</p>`;
            } else if (q.type === 'ricostruisci_frase') {
                details = `<p><strong>Tipo:</strong> Ricostruisci Frase<br><strong>Frase:</strong> ${q.sentence}</p>`;
            } else if (q.type === 'abbinamenti') { // NUOVO
                details = '<ul>' + q.pairs.map(p => `<li>${p[0]} → ${p[1]}</li>`).join('') + '</ul>';
            } else {
                details = '<ul>' + q.options.map(opt => `<li class="${opt === q.correctAnswer ? 'correct' : ''}">${opt}</li>`).join('') + '</ul>';
            }

            card.innerHTML = `
                <button class="delete-question-button" data-index="${index}">×</button>
                <h3>${index + 1}. ${q.question}</h3>
                ${details}
            `;
            questionsPreview.appendChild(card);
        });
    }

    questionsPreview.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-question-button')) {
            const index = parseInt(e.target.dataset.index, 10);
            questions.splice(index, 1);
            renderQuestionsPreview();
        }
    });

    generateJsonButton.addEventListener('click', () => {
        if (questions.length === 0) return;
        const fileName = (fileNameInput.value.trim().replace(/\s+/g, '_') || 'esercitazione') + '.json';
        const jsonContent = JSON.stringify(questions, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(link.href);
    });

    // Inizializza i campi dinamici per i moduli che ne hanno bisogno
    addOptionInput(mcOptionsContainer);
    addOptionInput(mcOptionsContainer);
    addPairInput(pairsContainer);
    addPairInput(pairsContainer);
});