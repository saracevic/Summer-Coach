// AI Coach - Hint Generation System

// Topic-based hint patterns (Konu bazlı ipucu desenleri)
const hintPatterns = {
    'geometri': {
        'çevre': 'Çevre, şeklin dış sınırının toplam uzunluğudur. Karenin çevresini bulmak için tüm kenarları topla veya bir kenarı 4 ile çarp.',
        'alan': 'Alan, şeklin kapladığı yüzey miktarıdır. Düz şekiller için genellikle taban × yükseklik formülü kullanılır.',
        'daire': 'Dairenin çevresi = 2πr, alanı = πr² şeklindedir. π değerini soruda verilen değeri kullan.',
        'üçgen': 'Üçgenin alanı = (taban × yükseklik) / 2 formülüyle bulunur.',
        'dikdörtgen': 'Dikdörtgenin çevresi = 2(uzunluk + genişlik), alanı = uzunluk × genişlik'
    },
    'matematik': {
        'işlem': 'İşlem sırasını hatırla: Parantez → Üs/Kök → Çarpma/Bölme (soldan sağa) → Toplama/Çıkarma (soldan sağa)',
        'kesir': 'Kesirlerle işlem yaparken önce paydaları eşitle. Sonra paylar üzerinde işlemi yap.',
        'yüzde': 'Yüzde hesabı: (Sayı × Yüzde) / 100 formülüyle yapılır.',
        'denklem': 'Denklemi çözerken her iki tarafa da aynı işlemi uygula. Bilinmeyeni yalnız bırak.',
        'orant': 'Orantı: a/b = c/d ise a×d = b×c (çapraz çarpım)'
    },
    'fizik': {
        'hız': 'Hız = Mesafe / Zaman. Verilen değerleri formüle yerleştir.',
        'kuvvet': 'Kuvvet (F) = Kütle (m) × İvme (a). Newton\'ın 2. yasasını hatırla.',
        'enerji': 'Kinetik enerji = (1/2) × m × v². Potansiyel enerji = m × g × h',
        'iş': 'İş = Kuvvet × Mesafe × cos(θ)',
        'basınç': 'Basınç = Kuvvet / Alan'
    },
    'kimya': {
        'mol': 'Mol = Kütle / Molar kütle. Avogadro sayısı = 6.02 × 10²³',
        'denklem': 'Denklemdeki katsayıları dengele. Her element için atom sayısı eşit olmalı.',
        'pH': 'pH = -log[H⁺]. pH < 7 asidik, pH > 7 bazik, pH = 7 nötr',
        'yoğunluk': 'Yoğunluk = Kütle / Hacim',
        'konsantrasyon': 'Molarite = Mol sayısı / Litre cinsinden hacim'
    },
    'biyoloji': {
        'mitoz': 'Mitoz: Interfaz → Profaz → Metafaz → Anafaz → Telofaz. Hücreler 2n durumda kalır.',
        'mayoz': 'Mayoz: 2n durumundan n durumuna geçiş. Germ hücrelerinde gerçekleşir.',
        'fotosentez': 'Fotosentez: CO₂ + H₂O → Şeker + O₂. Işığı kullanarak yapılır.',
        'solunum': 'Solunum: Glikoz + O₂ → CO₂ + H₂O + Enerji (ATP)',
        'genetik': 'Gregor Mendel\'in kanunlarını hatırla. Genotip × Fenotip'
    },
    'tarih': {
        'osmanlı': 'Osmanlı İmparatorluğu 1299-1922 yılları arasında hüküm sürmüştür. Kurucusu Osman Bey\'dir.',
        'cumhuriyet': 'Türkiye Cumhuriyeti 23 Nisan 1920\'de kurulmuştur. Mustafa Kemal Atatürk kurucusudur.',
        'dünya': 'Dünya savaşı tarihleri: WWI (1914-1918), WWII (1939-1945)',
        'antikçağ': 'Antik Çağ medeniyetleri: Mısır, Mezopotamya, Yunan, Roma',
        'orta': 'Orta Çağ (5.-15. yüzyıllar) feodalizm çağıdır.'
    },
    'coğrafya': {
        'türkiye': 'Türkiye\'nin başkenti Ankara, en büyük şehri İstanbul\'dur.',
        'iklim': 'Iklim türleri: Tropikal, Kuraklık, Ilıman, Karasal, Kutupsal',
        'dağ': 'Dağlar, yüksekliğe göre sınıflandırılır. Türkiye\'nin en yüksek dağı Ağrı Dağı\'dır.',
        'nüfus': 'Nüfus yoğunluğu = Nüfus / Alanı. Türkiye\'nin nüfusu yaklaşık 85 milyondur.',
        'akarsu': 'Akarsu: Düşük yerden yüksek yere doğru akar. Türkiye\'nin en uzun akarsusu Kızılırmak\'tır.'
    },
    'edebiyat': {
        'sözcük': 'Sözcüğün anlamını bağlamdan çıkar. Eş anlamlı kelimeler kullan.',
        'cümle': 'Cümlenin yapı ve anlam bütünlüğünü kontrol et.',
        'şiir': 'Şiirde kafiye, ölçü, belagat araçları kullan.',
        'roman': 'Romanın öğeleri: Kahramanlar, Olay, Mekân, Zaman, Tema',
        'kültür': 'Kültür: Bir toplumun sanat, din, gelenek, değer yargılarının toplamı'
    }
};

/**
 * AI Coach - Ana İpucu Oluşturma Fonksiyonu
 * @param {Object} question - Soru nesnesi
 * @returns {string} - AI tarafından oluşturulan ipucu
 */
function generateAIHint(question) {
    const questionText = question.text.toLowerCase();
    const topic = question.topic ? question.topic.toLowerCase() : 'genel';
    const explanation = question.explanation || '';

    // Adım 1: Soru türünü tanı
    const questionType = detectQuestionType(questionText);

    // Adım 2: İlgili konu alanını bul
    const subject = detectSubject(topic, questionText);

    // Adım 3: Spesifik ipucu oluştur
    let hint = generateSpecificHint(question, subject, questionType);

    // Adım 4: İpucuyu zenginleştir
    hint = enrichHint(hint, question);

    return hint;
}

/**
 * Soru türünü tanı (Matematik, Fen, Sosyal vb.)
 */
function detectQuestionType(questionText) {
    const patterns = {
        'calculation': /\b(hesapla|kaç|bul|sonuç|işlem|toplam)\b/i,
        'definition': /\b(nedir|ne|tanımla|açıkla|ne demek)\b/i,
        'comparison': /\b(fark|arası|arasında|karşılaştır|benzer|farklı)\b/i,
        'reason': /\b(niçin|neden|sebep|çünkü|sonuç olarak)\b/i,
        'example': /\b(örnek|örneğin|gibi|case)\b/i,
        'formula': /\b(formül|denklem|kural|kanun)\b/i
    };

    for (const [type, pattern] of Object.entries(patterns)) {
        if (pattern.test(questionText)) {
            return type;
        }
    }
    return 'general';
}

/**
 * İlgili konu alanını tespit et
 */
function detectSubject(topic, questionText) {
    const subjects = Object.keys(hintPatterns);
    const combined = (topic + ' ' + questionText).toLowerCase();

    for (const subject of subjects) {
        if (combined.includes(subject)) {
            return subject;
        }
    }
    return 'matematik'; // Varsayılan
}

/**
 * Spesifik ipucu oluştur
 */
function generateSpecificHint(question, subject, questionType) {
    const keywords = extractKeywords(question.text);
    let hint = '';

    // Konu bazlı ipucu bul
    if (hintPatterns[subject]) {
        for (const keyword of keywords) {
            const key = keyword.toLowerCase();
            if (hintPatterns[subject][key]) {
                hint = hintPatterns[subject][key];
                break;
            }
        }
    }

    // Eğer hint bulunamazsa, soru türüne göre ipucu oluştur
    if (!hint) {
        hint = generateHintByType(questionType, question, subject);
    }

    return hint;
}

/**
 * Soru türüne göre ipucu oluştur
 */
function generateHintByType(type, question, subject) {
    const hints = {
        'calculation': `Bu soru bir hesaplama sorusudur. Gerekli formülü yazın ve verilen değerleri yerine koyun. Adım adım hesap yapın.`,
        'definition': `Bu soru tanım veya açıklama sorusudur. Sorulan terimin temel özelliklerini ve tanımını hatırlamaya çalış.`,
        'comparison': `Bu soru karşılaştırma sorusudur. Her iki kavramın benzer ve farklı yönlerini listele.`,
        'reason': `Bu soru sebep-sonuç sorusudur. Neden-sonuç ilişkisini kurarak ilerle.`,
        'example': `Bu soru örnek sorusudur. Konuyla ilgili gerçek hayat örneklerini veya durumlarda düşün.`,
        'formula': `Bu soru formül veya kural sorusudur. İlgili formülü veya kuralı gözden geçir.`,
        'general': `Soruyu dikkatlice oku ve verilen seçenekleri analiz et. Her seçeneğin doğru/yanlış olup olmadığını değerlendir.`
    };

    return hints[type] || hints['general'];
}

/**
 * Anahtar sözcükleri çıkar
 */
function extractKeywords(text) {
    const words = text.toLowerCase()
        .split(/[\s,?.!:;()-]+/)
        .filter(word => word.length > 3);
    return words;
}

/**
 * İpucunu zenginleştir (Formüller, örnekler, vb.)
 */
function enrichHint(hint, question) {
    const questionText = question.text.toLowerCase();
    let enriched = hint;

    // Sayısal sorulara formül ekle
    if (questionText.includes('kaç') || questionText.includes('hesapla')) {
        enriched += '\n\n💡 İpucu: Önce neyin sorulduğunu anla, sonra gerekli formülü uygula.';
    }

    // Seçenek eliminasyonu
    const options = question.options;
    if (options.length === 4) {
        const unreasonableOptions = identifyUnreasonableOptions(question, options);
        if (unreasonableOptions.length > 0) {
            enriched += `\n\n💡 İpucu: Seçenekleri dikkatli incele. Açıkça yanlış olan seçenekleri eleyerek başla.`;
        }
    }

    // Konu bağlantısı
    if (question.topic) {
        enriched += `\n\n📚 Konu: ${question.topic} - Bu konuda daha fazla çalışma yap.`;
    }

    return enriched;
}

/**
 * Mantıksız seçenekleri tespit et
 */
function identifyUnreasonableOptions(question, options) {
    const unreasonable = [];
    const text = question.text.toLowerCase();

    options.forEach(option => {
        const optionText = option.text.toLowerCase();
        
        // Hiç alakasız görünen seçenekler
        if ((text.includes('kaç') || text.includes('hesapla')) && 
            !option.text.match(/\d/) && 
            !option.text.includes('%')) {
            unreasonable.push(option.letter);
        }
    });

    return unreasonable;
}

/**
 * Adaptif İpucu - Seviye Ayarla
 */
function generateAdaptiveHint(question, difficulty = 'medium') {
    let baseHint = generateAIHint(question);
    
    if (difficulty === 'easy') {
        // Daha basit ve yönlendirici
        baseHint += '\n\n💡 Basit ipucu: Sorunun anahtar sözcüklerine odaklan.';
    } else if (difficulty === 'hard') {
        // Daha az yönlendirici
        baseHint += '\n\n💡 Bilgi: Bu konuyla ilgili tüm yönleri incelemelisin.';
    }
    
    return baseHint;
}

/**
 * Hatalı cevaplar için rehabilitasyon ipucu
 */
function generateCorrectionHint(question, userAnswer) {
    const correctAnswer = question.correctAnswer;
    const userOption = question.options.find(o => o.letter === userAnswer);
    const correctOption = question.options.find(o => o.letter === correctAnswer);

    if (userAnswer === correctAnswer) {
        return '✅ Doğru! Tebrikler!';
    }

    let hint = `❌ Yanlış cevap. Tekrar deneyelim!\n\n`;
    hint += `Senin seçmiş olduğun cevap: ${userAnswer}) ${userOption?.text}\n`;
    hint += `Doğru cevap: ${correctAnswer}) ${correctOption?.text}\n\n`;
    hint += generateAIHint(question);

    return hint;
}

/**
 * Soru Zorluk Seviyesini Tespit Et
 */
function detectQuestionDifficulty(question) {
    const text = question.text.toLowerCase();
    const wordCount = text.split(' ').length;
    
    if (wordCount < 10 && !text.includes('ve') && !text.includes('aynı zamanda')) {
        return 'easy';
    } else if (wordCount < 20) {
        return 'medium';
    } else {
        return 'hard';
    }
}

// Tüm hint fonksiyonlarını dışa aktar
window.generateAIHint = generateAIHint;
window.generateAdaptiveHint = generateAdaptiveHint;
window.generateCorrectionHint = generateCorrectionHint;
window.detectQuestionDifficulty = detectQuestionDifficulty;
