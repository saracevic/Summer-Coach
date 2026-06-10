// ===== GLOBAL VARIABLES =====
let questions = [];
let currentQuestionIndex = 0;
let userAnswers = {};
let hintUsed = {};

console.log('✅ app.js loaded successfully!');

// ===== FILE UPLOAD HANDLER =====
function handleFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!file) {
        alert('Lütfen bir dosya seçin!');
        return;
    }

    if (file.type === 'application/pdf') {
        extractQuestionsFromPDF(file);
    } else if (file.type === 'application/json') {
        loadQuestionsFromJSON(file);
    } else {
        alert('Lütfen PDF veya JSON dosyası seçin!');
    }
}

// ===== EXTRACT QUESTIONS FROM PDF =====
async function extractQuestionsFromPDF(file) {
    try {
        console.log('Starting PDF extraction...');
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let pdfText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            pdfText += textContent.items.map(item => item.str).join(' ') + '\n';
        }

        console.log('PDF text extracted. Length:', pdfText.length);
        questions = parsePDFText(pdfText);
        
        if (questions.length > 0) {
            console.log('✅ ' + questions.length + ' soru bulundu!');
            startQuiz();
        } else {
            console.log('❌ Sorular bulunamadı. Demo soruları yükleniyor...');
            alert('PDF\'den sorular çıkarılamadı. Demo soruları yükleniyor...');
            loadDemoQuestions();
        }
    } catch (error) {
        console.error('PDF error:', error);
        alert('PDF hatası: ' + error.message);
        loadDemoQuestions();
    }
}

// ===== PARSE PDF TEXT =====
function parsePDFText(text) {
    const questions = [];
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    let currentQuestion = null;
    let qNum = 1;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Detect question: "1.", "2." etc
        if (line.match(/^\d+[.)]/)) {
            // Save previous question
            if (currentQuestion && currentQuestion.options.length === 4) {
                questions.push(currentQuestion);
            }
            
            // Create new question
            const qMatch = line.match(/^\d+[.)]\s+(.+)/);
            currentQuestion = {
                id: qNum++,
                text: qMatch ? qMatch[1] : line,
                options: [],
                correctAnswer: 'A',
                topic: 'Matematik',
                explanation: 'Çözüm için AI ipucunu kullan.'
            };
        }
        // Detect option: "A)", "B)" etc
        else if (currentQuestion && line.match(/^[A-D][.)]\s+/)) {
            const optMatch = line.match(/^([A-D])[.)]\s+(.+)/);
            if (optMatch) {
                currentQuestion.options.push({
                    letter: optMatch[1],
                    text: optMatch[2]
                });
            }
        }
        // Detect answer: "Cevap:" etc
        else if (currentQuestion && (line.toLowerCase().includes('cevap') || line.toLowerCase().includes('doğru'))) {
            const ansMatch = line.match(/[A-D]/);
            if (ansMatch) {
                currentQuestion.correctAnswer = ansMatch[0];
            }
        }
    }
    
    // Save last question
    if (currentQuestion && currentQuestion.options.length === 4) {
        questions.push(currentQuestion);
    }
    
    return questions;
}

// ===== LOAD JSON =====
async function loadQuestionsFromJSON(file) {
    try {
        const text = await file.text();
        questions = JSON.parse(text);
        
        if (Array.isArray(questions) && questions.length > 0) {
            console.log('✅ ' + questions.length + ' soru JSON\'dan yüklendi!');
            startQuiz();
        } else {
            alert('JSON formatı geçersiz!');
            loadDemoQuestions();
        }
    } catch (error) {
        console.error('JSON error:', error);
        alert('JSON hatası: ' + error.message);
        loadDemoQuestions();
    }
}

// ===== LOAD DEMO QUESTIONS =====
function loadDemoQuestions() {
    console.log('Loading demo questions...');
    
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
            topic: 'Coğrafya',
            explanation: 'Ankara 1923\'ten beri Türkiye\'nin başkenti.'
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
            topic: 'Matematik - İşlem Sırası',
            explanation: 'Önce çarpma: 2 + (2×3) = 2 + 6 = 8'
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
            explanation: 'Alan = π × r² = 3.14 × 49 = 153.86 cm²'
        },
        {
            id: 5,
            text: "Osmanlı İmparatorluğu hangi yıl kurulmuştur?",
            options: [
                { letter: 'A', text: '1299' },
                { letter: 'B', text: '1453' },
                { letter: 'C', text: '1682' },
                { letter: 'D', text: '1923' }
            ],
            correctAnswer: 'A',
            topic: 'Tarih',
            explanation: 'Osmanlı İmparatorluğu 1299\'da Osman Bey tarafından kurulmuştur.'
        }
    ];

    console.log('✅ Demo soruları yüklendi!');
    startQuiz();
}

// ===== START QUIZ =====
function startQuiz() {
    console.log('Quiz starting with ' + questions.length + ' questions');
    
    userAnswers = {};
    hintUsed = {};
    currentQuestionIndex = 0;

    questions.forEach(q => {
        userAnswers[q.id] = null;
        hintUsed[q.id] = false;
    });

    document.getElementById('uploadSection').style.display = 'none';
    document.getElementById('quizSection').style.display = 'block';
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('totalQuestions').textContent = questions.length;

    displayQuestion();
}

// ===== DISPLAY QUESTION =====
function displayQuestion() {
    if (questions.length === 0) return;
    
    const question = questions[currentQuestionIndex];
    const qNum = currentQuestionIndex + 1;

    document.getElementById('currentQuestion').textContent = qNum;
    document.getElementById('progressFill').style.width = (currentQuestionIndex / questions.length * 100) + '%';
    document.getElementById('questionText').textContent = qNum + '. ' + question.text;

    const container = document.getElementById('optionsContainer');
    container.innerHTML = '';

    question.options.forEach(opt => {
        const div = document.createElement('div');
        div.className = 'option';
        if (userAnswers[question.id] === opt.letter) {
            div.classList.add('selected');
        }
        div.innerHTML = '<div class="option-letter">' + opt.letter + '</div><div>' + opt.text + '</div>';
        div.onclick = () => selectAnswer(opt.letter);
        container.appendChild(div);
    });

    document.getElementById('hintBox').style.display = 'none';
    document.getElementById('prevBtn').disabled = currentQuestionIndex === 0;
    document.getElementById('nextBtn').textContent = 
        currentQuestionIndex === questions.length - 1 ? 'Sonuçları Gör' : 'Sonraki →';
    
    const answered = Object.values(userAnswers).filter(a => a !== null).length;
    document.getElementById('answerSummary').textContent = 'Cevaplanan: ' + answered + ' / ' + questions.length;
}

// ===== SELECT ANSWER =====
function selectAnswer(letter) {
    const question = questions[currentQuestionIndex];
    userAnswers[question.id] = letter;
    
    const options = document.querySelectorAll('.option');
    options.forEach(opt => {
        opt.classList.remove('selected', 'correct', 'wrong');
        const optLetter = opt.querySelector('.option-letter').textContent;
        
        if (letter === optLetter) {
            opt.classList.add('selected');
        }
        if (optLetter === question.correctAnswer) {
            opt.classList.add('correct');
        }
        if (letter === optLetter && letter !== question.correctAnswer) {
            opt.classList.add('wrong');
        }
    });
}

// ===== GET HINT =====
function getHint() {
    const question = questions[currentQuestionIndex];
    
    if (hintUsed[question.id]) {
        alert('Bu soru için zaten ipucu kullandınız!');
        return;
    }

    hintUsed[question.id] = true;
    const hint = generateAIHint(question);
    
    document.getElementById('hintText').textContent = hint;
    document.getElementById('hintBox').style.display = 'block';
    document.getElementById('hintBox').scrollIntoView({ behavior: 'smooth' });
}

// ===== NAVIGATION =====
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
        showResults();
    }
}

// ===== SHOW RESULTS =====
function showResults() {
    const correct = Object.keys(userAnswers).filter(qId => {
        const q = questions.find(x => x.id == qId);
        return q && userAnswers[qId] === q.correctAnswer;
    }).length;

    const wrong = questions.length - correct;
    const percent = Math.round(correct / questions.length * 100);

    document.getElementById('correctCount').textContent = correct;
    document.getElementById('wrongCount').textContent = wrong;
    document.getElementById('totalCount').textContent = questions.length;
    document.getElementById('scorePercentage').textContent = percent;

    let reviewHTML = '';
    questions.forEach(q => {
        const userAns = userAnswers[q.id];
        const isCorrect = userAns === q.correctAnswer;
        const userText = q.options.find(o => o.letter === userAns)?.text || 'Cevap yok';
        const correctText = q.options.find(o => o.letter === q.correctAnswer)?.text || '';

        reviewHTML += '<div class="review-item ' + (isCorrect ? 'correct' : 'wrong') + '">' +
            '<strong>' + q.id + '. ' + q.text + '</strong>' +
            '<p><strong>Senin cevabın:</strong> ' + (userAns ? userAns + ') ' + userText : 'Boş') + '</p>' +
            (isCorrect ? '' : '<p><strong>Doğru cevap:</strong> ' + q.correctAnswer + ') ' + correctText + '</p>') +
            '<p><strong>Konu:</strong> ' + q.topic + '</p>' +
            '</div>';
    });

    document.getElementById('resultsReview').innerHTML = reviewHTML;
    document.getElementById('quizSection').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'block';
    window.scrollTo(0, 0);
}

// ===== RESTART =====
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
