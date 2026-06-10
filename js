// Global Variables
let questions = [];
let currentQuestionIndex = 0;
let userAnswers = {};
let hintUsed = {};

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    console.log('Summer Coach loaded successfully!');
});

// Handle File Upload
async function handleFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!file) {
        alert('Lütfen bir dosya seçin!');
        return;
    }

    if (file.type === 'application/pdf') {
        await extractQuestionsFromPDF(file);
    } else if (file.type === 'application/json') {
        await loadQuestionsFromJSON(file);
    } else {
        alert('Lütfen PDF veya JSON dosyası seçin!');
    }
}

// Extract Questions from PDF
async function extractQuestionsFromPDF(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let pdfText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            pdfText += textContent.items.map(item => item.str).join(' ') + '\n';
        }

        questions = parsePDFText(pdfText);
        
        if (questions.length === 0) {
            alert('PDF\'den sorular çıkarılamadı. Lütfen format kontrol edin.');
            loadDemoQuestions();
        } else {
            startQuiz();
        }
    } catch (error) {
        console.error('PDF okuma hatası:', error);
        alert('PDF dosyası okunamadı: ' + error.message);
    }
}

// Parse PDF Text to Questions
function parsePDFText(text) {
    // Format: "1.Soru metni\nA) Seçenek A\nB) Seçenek B\nC) Seçenek C\nD) Seçenek D\nCevap: A"
    const questions = [];
    const questionPatterns = text.split(/\d+\.\s+(?=[A-ZÇĞİÖŞÜ])/i).slice(1);

    questionPatterns.forEach((pattern, index) => {
        const lines = pattern.split('\n').filter(line => line.trim());
        
        if (lines.length >= 4) {
            const questionText = lines[0].trim();
            const options = [];
            let answer = 'A';
            let topic = 'Konu';

            lines.forEach((line, i) => {
                if (line.match(/^[A-D]\)/)) {
                    const letter = line.charAt(0);
                    const text = line.substring(3).trim();
                    options.push({ letter, text });
                }
                if (line.toLowerCase().includes('cevap') || line.toLowerCase().includes('doğru')) {
                    const match = line.match(/[A-D]/);
                    if (match) answer = match[0];
                }
                if (line.toLowerCase().includes('konu') || line.toLowerCase().includes('başlık')) {
                    topic = line.substring(line.indexOf(':') + 1).trim();
                }
            });

            if (options.length === 4) {
                questions.push({
                    id: index + 1,
                    text: questionText,
                    options: options,
                    correctAnswer: answer,
                    topic: topic,
                    explanation: 'Bu konuda çalışma yapınız.'
                });
            }
        }
    });

    return questions.length > 0 ? questions : [];
}

// Load Questions from JSON
async function loadQuestionsFromJSON(file) {
    try {
        const text = await file.text();
        questions = JSON.parse(text);
        
        // Validate JSON format
        if (!Array.isArray(questions) || questions.length === 0) {
            throw new Error('JSON formatı geçersiz');
        }

        startQuiz();
    } catch (error) {
        console.error('JSON okuma hatası:', error);
        alert('JSON dosyası okunamadı: ' + error.message);
    }
}

// Load Demo Questions
function loadDemoQuestions() {
    questions = [
        {
            id: 1,
            text: "Bir karenin bir kenarı 5 cm ise, çevresi kaç cm\'dir?",
            options: [
                { letter: 'A', text: '10 cm' },
                { letter: 'B', text: '15 cm' },
                { letter: 'C', text: '20 cm' },
                { letter: 'D', text: '25 cm' }
            ],
            correctAnswer: 'C',
            topic: 'Geometri - Çevre Hesabı',
            explanation: 'Karenin çevresi = 4 × kenar uzunluğu. Çevre = 4 × 5 = 20 cm'
        },
        {
            id: 2,
            text: "Türkiye\'nin başkenti neresidir?",
            options: [
                { letter: 'A', text: 'İstanbul' },
                { letter: 'B', text: 'Ankara' },
                { letter: 'C', text: 'İzmir' },
                { letter: 'D', text: 'Bursa' }
            ],
            correctAnswer: 'B',
            topic: 'Coğrafya - Türkiye\'nin Başkenti',
            explanation: 'Ankara, 1923 yılından beri Türkiye\'nin başkenti olarak görev yapmaktadır.'
        },
        {
            id: 3,
            text: "2 + 2 × 3 işleminin sonucu nedir?",
            options: [
                { letter: 'A', text: '8' },
                { letter: 'B', text: '12' },
                { letter: 'C', text: '6' },
                { letter: 'D', text: '9' }
            ],
            correctAnswer: 'A',
            topic: 'Matematik - İşlem Sırası (BODMAS)',
            explanation: 'İşlem sırasına göre önce çarpma yapılır: 2 + (2×3) = 2 + 6 = 8'
        },
        {
            id: 4,
            text: "Bir dairenin yarıçapı 7 cm ise, alanı kaç cm²\'dir? (π ≈ 3.14)",
            options: [
                { letter: 'A', text: '153.86 cm²' },
                { letter: 'B', text: '142.2 cm²' },
                { letter: 'C', text: '165.2 cm²' },
                { letter: 'D', text: '176.5 cm²' }
            ],
            correctAnswer: 'A',
            topic: 'Geometri - Daire Alanı',
            explanation: 'Dairenin alanı = π × r². Alan = 3.14 × 7² = 3.14 × 49 = 153.86 cm²'
        },
        {
            id: 5,
            text: "Osmanlı İmparatorluğu kaç yılında kurulmuştur?",
            options: [
                { letter: 'A', text: '1299' },
                { letter: 'B', text: '1453' },
                { letter: 'C', text: '1682' },
                { letter: 'D', text: '1923' }
            ],
            correctAnswer: 'A',
            topic: 'Tarih - Osmanlı İmparatorluğu',
            explanation: 'Osmanlı İmparatorluğu 1299 yılında Osman Bey tarafından kurulmuştur.'
        }
    ];

    startQuiz();
}

// Start Quiz
function startQuiz() {
    // Initialize answers and hints
    userAnswers = {};
    hintUsed = {};
    currentQuestionIndex = 0;

    questions.forEach(q => {
        userAnswers[q.id] = null;
        hintUsed[q.id] = false;
    });

    // Hide upload section and show quiz section
    document.getElementById('uploadSection').style.display = 'none';
    document.getElementById('quizSection').style.display = 'block';
    document.getElementById('resultsSection').style.display = 'none';

    // Update total questions
    document.getElementById('totalQuestions').textContent = questions.length;

    // Display first question
    displayQuestion();
}

// Display Current Question
function displayQuestion() {
    const question = questions[currentQuestionIndex];
    const questionNumber = currentQuestionIndex + 1;

    // Update counter and progress
    document.getElementById('currentQuestion').textContent = questionNumber;
    const progress = (currentQuestionIndex / questions.length) * 100;
    document.getElementById('progressFill').style.width = progress + '%';

    // Update question text
    document.getElementById('questionText').textContent = `${questionNumber}. ${question.text}`;

    // Update options
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';

    question.options.forEach(option => {
        const optionEl = document.createElement('div');
        optionEl.className = 'option';
        optionEl.innerHTML = `
            <div class="option-letter">${option.letter}</div>
            <div>${option.text}</div>
        `;

        if (userAnswers[question.id] === option.letter) {
            optionEl.classList.add('selected');
        }

        optionEl.onclick = () => selectAnswer(option.letter);
        optionsContainer.appendChild(optionEl);
    });

    // Clear hint
    document.getElementById('hintBox').style.display = 'none';
    document.getElementById('hintText').textContent = '';

    // Update navigation buttons
    document.getElementById('prevBtn').disabled = currentQuestionIndex === 0;
    document.getElementById('nextBtn').textContent = 
        currentQuestionIndex === questions.length - 1 ? 'Sonuçları Gör' : 'Sonraki →';

    // Update answer summary
    updateAnswerSummary();
}

// Select Answer
function selectAnswer(letter) {
    const question = questions[currentQuestionIndex];
    userAnswers[question.id] = letter;
    
    // Visual feedback
    const options = document.querySelectorAll('.option');
    options.forEach(opt => {
        opt.classList.remove('selected');
        if (opt.querySelector('.option-letter').textContent === letter) {
            opt.classList.add('selected');
        }
    });

    // Show immediate feedback
    setTimeout(() => {
        showAnswerFeedback();
    }, 300);
}

// Show Answer Feedback
function showAnswerFeedback() {
    const question = questions[currentQuestionIndex];
    const userAnswer = userAnswers[question.id];
    const correctAnswer = question.correctAnswer;
    const options = document.querySelectorAll('.option');

    options.forEach(opt => {
        const letter = opt.querySelector('.option-letter').textContent;
        
        if (letter === correctAnswer) {
            opt.classList.add('correct');
        }
        if (letter === userAnswer && userAnswer !== correctAnswer) {
            opt.classList.add('wrong');
        }
    });
}

// Update Answer Summary
function updateAnswerSummary() {
    const answeredCount = Object.values(userAnswers).filter(a => a !== null).length;
    const summary = document.getElementById('answerSummary');
    summary.textContent = `Cevaplanan: ${answeredCount} / ${questions.length}`;
}

// Get AI Hint
function getHint() {
    const question = questions[currentQuestionIndex];
    
    if (hintUsed[question.id]) {
        alert('Bu soru için zaten ipucu kullandınız!');
        return;
    }

    hintUsed[question.id] = true;
    const hint = generateAIHint(question);
    
    const hintBox = document.getElementById('hintBox');
    const hintText = document.getElementById('hintText');
    
    hintText.textContent = hint;
    hintBox.style.display = 'block';
    hintBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Navigate Questions
function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
        window.scrollTo(0, 0);
    }
}

function nextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
        window.scrollTo(0, 0);
    } else {
        // Show results
        showResults();
    }
}

// Show Results
function showResults() {
    const correctCount = Object.keys(userAnswers).filter(qId => {
        const question = questions.find(q => q.id == qId);
        return question && userAnswers[qId] === question.correctAnswer;
    }).length;

    const wrongCount = questions.length - correctCount;
    const scorePercentage = Math.round((correctCount / questions.length) * 100);

    // Update results display
    document.getElementById('correctCount').textContent = correctCount;
    document.getElementById('wrongCount').textContent = wrongCount;
    document.getElementById('totalCount').textContent = questions.length;
    document.getElementById('scorePercentage').textContent = scorePercentage;

    // Build review
    const reviewHTML = questions.map(question => {
        const userAnswer = userAnswers[question.id];
        const isCorrect = userAnswer === question.correctAnswer;
        const userAnswerText = question.options.find(o => o.letter === userAnswer)?.text || 'Cevap yok';
        const correctAnswerText = question.options.find(o => o.letter === question.correctAnswer)?.text || '';

        return `
            <div class="review-item ${isCorrect ? 'correct' : 'wrong'}">
                <strong>${question.id}. ${question.text}</strong>
                <p><strong>Senin cevabın:</strong> ${userAnswer ? userAnswer + ') ' + userAnswerText : 'Boş'}</p>
                ${!isCorrect ? `<p><strong>Doğru cevap:</strong> ${question.correctAnswer}) ${correctAnswerText}</p>` : ''}
                <p><strong>Konu:</strong> ${question.topic}</p>
                <p><strong>Açıklama:</strong> ${question.explanation}</p>
            </div>
        `;
    }).join('');

    document.getElementById('resultsReview').innerHTML = reviewHTML;

    // Show results section
    document.getElementById('quizSection').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'block';
    window.scrollTo(0, 0);
}

// Restart Quiz
function restartQuiz() {
    document.getElementById('uploadSection').style.display = 'block';
    document.getElementById('quizSection').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('fileInput').value = '';
    questions = [];
    userAnswers = {};
    hintUsed = {};
    currentQuestionIndex = 0;
}
