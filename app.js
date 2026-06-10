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

// Extract Questions from PDF - ADVANCED VERSION
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

        console.log('=== PDF TEXT EXTRACTED ===');
        console.log('Total text length:', pdfText.length);
        console.log('First 1000 chars:', pdfText.substring(0, 1000));
        console.log('========================');

        // Try multiple parsing strategies
        questions = parseQuestionsAdvanced(pdfText);
        
        if (questions.length === 0) {
            console.warn('No questions found with standard parsing. Trying alternative methods...');
            // Try finding any numbered patterns
            questions = parseQuestionsGeneric(pdfText);
        }
        
        if (questions.length === 0) {
            alert('❌ PDF\'den sorular çıkarılamadı.\n\n' +
                  'LÜTFEN PDF\'nin şu formatta olduğundan emin olun:\n\n' +
                  '1. Soru metni burada olur...\n' +
                  'A) Seçenek A\n' +
                  'B) Seçenek B\n' +
                  'C) Seçenek C\n' +
                  'D) Seçenek D\n' +
                  'Cevap: A\n\n' +
                  '2. Sonraki soru...\n\n' +
                  'Konsolda PDF metnini kontrol edin (F12)');
            console.error('Full extracted text:', pdfText);
        } else {
            console.log(`✅ ${questions.length} soru başarıyla çıkartıldı!`);
            startQuiz();
        }
    } catch (error) {
        console.error('PDF okuma hatası:', error);
        alert('PDF dosyası okunamadı: ' + error.message);
    }
}

// Advanced Question Parser
function parseQuestionsAdvanced(text) {
    const questions = [];
    
    // Normalize text
    text = text.replace(/\r\n/g, '\n').replace(/\s+/g, ' ');
    
    // Split by common question starters
    let parts = text.split(/\n+/);
    parts = parts.map(p => p.trim()).filter(p => p.length > 0);
    
    console.log('Total lines after split:', parts.length);
    
    let currentQuestion = null;
    let lineIndex = 0;
    
    while (lineIndex < parts.length) {
        const line = parts[lineIndex];
        
        // Detect question start: "1.", "1)", "1 .", etc
        const questionMatch = line.match(/^(\d+)\s*[.)]\s+(.+)/);
        
        if (questionMatch) {
            // Save previous question if valid
            if (currentQuestion && isValidQuestion(currentQuestion)) {
                questions.push(currentQuestion);
            }
            
            currentQuestion = {
                id: questions.length + 1,
                text: questionMatch[2].trim(),
                options: [],
                correctAnswer: null,
                topic: 'Matematik',
                explanation: 'Çözüm için AI ipucunu kullan.'
            };
            
            lineIndex++;
            
            // Collect next lines as options or cevap
            while (lineIndex < parts.length) {
                const nextLine = parts[lineIndex];
                
                // Check if it's an option: "A)", "a)", "A.", etc
                if (nextLine.match(/^[A-Da-d][.)]\s+.+/)) {
                    const optMatch = nextLine.match(/^([A-Da-d])[.)]\s+(.+)/);
                    if (optMatch) {
                        currentQuestion.options.push({
                            letter: optMatch[1].toUpperCase(),
                            text: optMatch[2].trim()
                        });
                    }
                    lineIndex++;
                } 
                // Check if it's an answer: "Cevap:", "Doğru:", "Answer:"
                else if (nextLine.match(/^(cevap|doğru|answer|correct)[\s:]/i)) {
                    const ansMatch = nextLine.match(/[A-D]/i);
                    if (ansMatch) {
                        currentQuestion.correctAnswer = ansMatch[0].toUpperCase();
                    }
                    lineIndex++;
                    break; // Move to next question
                }
                // Check if next line is a new question
                else if (nextLine.match(/^\d+\s*[.)]/)) {
                    break;
                }
                // Skip empty or irrelevant lines
                else if (nextLine.length < 3 || nextLine.match(/^[\s\-=]+$/)) {
                    lineIndex++;
                } 
                // Otherwise accumulate to question text if no options yet
                else if (currentQuestion.options.length === 0) {
                    currentQuestion.text += ' ' + nextLine;
                    lineIndex++;
                }
                else {
                    break;
                }
            }
        } else {
            lineIndex++;
        }
    }
    
    // Save last question
    if (currentQuestion && isValidQuestion(currentQuestion)) {
        questions.push(currentQuestion);
    }
    
    console.log(`Advanced parser found: ${questions.length} questions`);
    return questions;
}

// Generic Parser (finds any numbered items with A, B, C, D)
function parseQuestionsGeneric(text) {
    const questions = [];
    
    // Find all sections that start with numbers
    const numberPattern = /(\d+)\s*[.)]\s+([^]*?)(?=\d+\s*[.)]\s+|$)/g;
    let match;
    let questionNumber = 1;
    
    while ((match = numberPattern.exec(text)) !== null) {
        const content = match[2].trim();
        const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        
        if (lines.length >= 4) {
            const question = {
                id: questionNumber++,
                text: lines[0],
                options: [],
                correctAnswer: 'A',
                topic: 'Test Sorusu',
                explanation: 'Çözüm için AI ipucunu kullan.'
            };
            
            // Extract options
            for (let i = 1; i < lines.length; i++) {
                const optMatch = lines[i].match(/^([A-D])[.)]\s+(.+)/i);
                if (optMatch) {
                    question.options.push({
                        letter: optMatch[1].toUpperCase(),
                        text: optMatch[2]
                    });
                }
            }
            
            if (question.options.length === 4) {
                questions.push(question);
            }
        }
    }
    
    console.log(`Generic parser found: ${questions.length} questions`);
    return questions;
}

// Validate question
function isValidQuestion(q) {
    return q.text && 
           q.text.trim().length > 5 && 
           q.options && 
           q.options.length === 4 &&
           q.correctAnswer && 
           ['A', 'B', 'C', 'D'].includes(q.correctAnswer);
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
            text: "Bir karenin bir kenarı 5 cm ise, çevresi kaç cm'dir?",
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
            text: "Türkiye'nin başkenti neresidir?",
            options: [
                { letter: 'A', text: 'İstanbul' },
                { letter: 'B', text: 'Ankara' },
                { letter: 'C', text: 'İzmir' },
                { letter: 'D', text: 'Bursa' }
            ],
            correctAnswer: 'B',
            topic: 'Coğrafya - Türkiye'nin Başkenti',
            explanation: 'Ankara, 1923 yılından beri Türkiye'nin başkenti olarak görev yapmaktadır.'
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
            text: "Bir dairenin yarıçapı 7 cm ise, alanı kaç cm²'dir? (π ≈ 3.14)",
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
