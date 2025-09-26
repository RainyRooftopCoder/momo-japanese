/**
 * Practice Module - 연습 기능 모듈
 * 다양한 연습 모드를 제공합니다.
 */

class Practice {
    constructor() {
        this.dbManager = null;
        this.speechSynthesis = null;
        this.vocabularyGroups = [];
        this.currentMode = null;
        this.currentQuestions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.totalQuestions = 0;
        this.startTime = null;
        this.stats = {
            correct: 0,
            incorrect: 0,
            streak: 0,
            bestStreak: 0,
        };

        this.initializeReferences();
    }

    /**
     * 참조 초기화
     */
    initializeReferences() {
        // DB 매니저 참조
        if (window.wordAppV3 && window.wordAppV3.dbManager) {
            this.dbManager = window.wordAppV3.dbManager;
        } else if (window.dbManager) {
            this.dbManager = window.dbManager;
        }

        // 음성 합성 모듈 초기화
        if (window.speechManager) {
            this.speechSynthesis = window.speechManager;
        } else if (window.SpeechSynthesisManager) {
            this.speechSynthesis = new window.SpeechSynthesisManager();
        } else if (window.speechSynthesis) {
            this.speechSynthesis = window.speechSynthesis;
        }
    }

    /**
     * 연습 화면 초기화
     */
    async init() {
        console.log('Initializing practice module...');
        await this.loadVocabularyData();
        await this.loadPracticeTemplate();
        this.setupEventListeners();
        this.showModeSelection();
    }

    /**
     * 연습 템플릿 로드
     */
    async loadPracticeTemplate() {
        try {
            // 연습 화면이 활성화된 상태에서만 템플릿 로드
            const practiceScreen = document.getElementById('practiceScreen');
            if (!practiceScreen || !practiceScreen.classList.contains('active')) {
                console.log('Practice screen not active, skipping template load');
                return;
            }

            const container = document.querySelector('#practiceScreen .practice-container');
            if (!container) {
                console.error('Practice container not found in practice screen');
                return;
            }

            // 템플릿 로더를 사용해서 practice.html 내용 로드
            if (window.templateLoader) {
                const content = await window.templateLoader.loadTemplate('pages/practice');
                container.innerHTML = content;
                console.log('Practice template loaded successfully');
            } else {
                console.warn('Template loader not available, loading practice template directly');
                const response = await fetch('./templates/pages/practice.html');
                const content = await response.text();
                container.innerHTML = content;
            }
        } catch (error) {
            console.error('Error loading practice template:', error);
            // 기본 템플릿 로드 실패시 직접 HTML 생성
            this.loadFallbackTemplate();
        }
    }

    /**
     * 대체 템플릿 로드
     */
    loadFallbackTemplate() {
        const container = document.querySelector('#practiceScreen .practice-container');
        if (!container) {
            console.error('Practice container not found for fallback template');
            return;
        }
        container.innerHTML = `
            <section class="practice-header">
                <h1 class="page-title">💪 연습</h1>
                <p class="page-subtitle">다양한 방식으로 학습한 내용을 연습해보세요</p>
            </section>
            <section class="practice-modes">
                <div class="mode-group">
                    <h2 class="group-title">🎯 단어 퀴즈</h2>
                    <div class="mode-grid">
                        <button class="mode-card" data-mode="word-quiz-easy">
                            <div class="mode-icon">🌱</div>
                            <div class="mode-title">기초 퀴즈</div>
                            <div class="mode-desc">쉬운 단어로 시작</div>
                            <div class="mode-difficulty">초급</div>
                        </button>
                        <button class="mode-card" data-mode="word-quiz-medium">
                            <div class="mode-icon">🌿</div>
                            <div class="mode-title">중급 퀴즈</div>
                            <div class="mode-desc">적당한 난이도</div>
                            <div class="mode-difficulty">중급</div>
                        </button>
                        <button class="mode-card" data-mode="word-quiz-hard">
                            <div class="mode-icon">🌳</div>
                            <div class="mode-title">고급 퀴즈</div>
                            <div class="mode-desc">도전적인 단어</div>
                            <div class="mode-difficulty">고급</div>
                        </button>
                    </div>
                </div>
                <div class="mode-group">
                    <h2 class="group-title">⚡ 속도 연습</h2>
                    <div class="mode-grid">
                        <button class="mode-card" data-mode="speed-meaning">
                            <div class="mode-icon">💡</div>
                            <div class="mode-title">의미 맞추기</div>
                            <div class="mode-desc">뜻 찾기 게임</div>
                            <div class="mode-time">60초</div>
                        </button>
                    </div>
                </div>
            </section>
        `;
    }

    /**
     * 단어장 데이터 로드
     */
    async loadVocabularyData() {
        try {
            if (!this.dbManager) {
                console.warn('DB Manager not available, using demo data');
                this.vocabularyGroups = this.getDemoVocabulary();
                return;
            }

            // getAvailableCategories 메서드 사용
            const categories = await this.dbManager.getAvailableCategories();
            if (categories) {
                // 카테고리를 그룹 형태로 변환
                this.vocabularyGroups = this.convertCategoriesToGroups(categories);
            } else {
                this.vocabularyGroups = [];
            }
            console.log('Loaded vocabulary groups:', this.vocabularyGroups.length);
        } catch (error) {
            console.error('Error loading vocabulary data:', error);
            this.vocabularyGroups = this.getDemoVocabulary();
        }
    }

    /**
     * 카테고리를 그룹 형태로 변환
     */
    convertCategoriesToGroups(categories) {
        const groups = [];

        // JLPT 레벨별 그룹 생성
        if (categories.jlpt) {
            categories.jlpt.forEach((jlptLevel) => {
                if (jlptLevel.count > 0) {
                    groups.push({
                        id: `jlpt-${jlptLevel.name}`,
                        name: `JLPT ${jlptLevel.displayName}`,
                        type: 'jlpt',
                        level: jlptLevel.name,
                        wordCount: jlptLevel.count,
                    });
                }
            });
        }

        // 품사별 그룹 생성
        if (categories.partOfSpeech) {
            categories.partOfSpeech.forEach((pos) => {
                if (pos.count > 0) {
                    groups.push({
                        id: `pos-${pos.name}`,
                        name: pos.displayName,
                        type: 'partOfSpeech',
                        category: pos.name,
                        wordCount: pos.count,
                    });
                }
            });
        }

        return groups;
    }

    /**
     * 데모 단어장 데이터
     */
    getDemoVocabulary() {
        return [
            {
                id: 1,
                name: '기초 일본어',
                words: [
                    { word: 'こんにちは', reading: 'こんにちは', meaning: '안녕하세요', level: 'easy' },
                    { word: 'ありがとう', reading: 'ありがとう', meaning: '고맙습니다', level: 'easy' },
                    { word: '学校', reading: 'がっこう', meaning: '학교', level: 'easy' },
                    { word: '先生', reading: 'せんせい', meaning: '선생님', level: 'easy' },
                    { word: '学生', reading: 'がくせい', meaning: '학생', level: 'easy' },
                ],
            },
            {
                id: 2,
                name: '음식 관련',
                words: [
                    { word: '食べ物', reading: 'たべもの', meaning: '음식', level: 'medium' },
                    { word: 'レストラン', reading: 'レストラン', meaning: '레스토랑', level: 'medium' },
                    { word: '美味しい', reading: 'おいしい', meaning: '맛있다', level: 'medium' },
                    { word: '料理', reading: 'りょうり', meaning: '요리', level: 'medium' },
                ],
            },
        ];
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 스와이프 뒤로가기 이벤트 설정
        this.setupSwipeBackGesture();

        // 연습 모드 카드 클릭 이벤트
        document.addEventListener('click', (e) => {
            const modeCard = e.target.closest('.mode-card[data-mode]');
            if (modeCard) {
                const mode = modeCard.dataset.mode;
                this.startPracticeMode(mode);
            }

            // 답변 선택 이벤트
            const answerBtn = e.target.closest('.answer-btn');
            if (answerBtn && this.currentMode) {
                this.handleAnswer(answerBtn);
            }

            // 다음 문제 버튼
            const nextBtn = e.target.closest('.next-question-btn');
            if (nextBtn && this.currentMode) {
                this.nextQuestion();
            }

            // 연습 종료 버튼
            const endBtn = e.target.closest('.end-practice-btn');
            if (endBtn && this.currentMode) {
                this.endPractice();
            }
        });

        // 키보드 단축키
        document.addEventListener('keydown', (e) => {
            if (this.currentMode && this.currentQuestions.length > 0) {
                if (e.key >= '1' && e.key <= '4') {
                    const index = parseInt(e.key) - 1;
                    const answerBtns = document.querySelectorAll('.answer-btn');
                    if (answerBtns[index]) {
                        this.handleAnswer(answerBtns[index]);
                    }
                }
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const nextBtn = document.querySelector('.next-question-btn');
                    if (nextBtn && !nextBtn.disabled) {
                        this.nextQuestion();
                    }
                }
            }
        });
    }

    /**
     * 연습 모드 선택 화면 표시
     */
    showModeSelection() {
        const container = document.querySelector('.practice-container');
        if (container) {
            container.scrollTop = 0;
        }
        // 화면 상단으로 스크롤
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * 연습 컨테이너 생성
     */
    createPracticeContainer() {
        const practiceScreen = document.getElementById('practiceScreen');
        if (!practiceScreen) {
            console.error('Practice screen not found');
            return;
        }

        // 기존 내용 모두 지우고 연습 컨테이너 생성
        practiceScreen.innerHTML = '<div class="practice-container"></div>';
        console.log('Practice container created');
    }

    /**
     * 연습 모드 시작
     */
    async startPracticeMode(mode) {
        console.log('Starting practice mode:', mode);
        this.currentMode = mode;
        this.score = 0;
        this.currentQuestionIndex = 0;
        this.startTime = Date.now();
        this.stats = {
            correct: 0,
            incorrect: 0,
            streak: 0,
            bestStreak: 0,
        };

        // 연습 컨테이너 생성
        this.createPracticeContainer();

        // 모드별 문제 생성
        switch (mode) {
            case 'word-quiz-easy':
                this.currentQuestions = await this.generateWordQuiz('easy', 10);
                break;
            case 'word-quiz-medium':
                this.currentQuestions = await this.generateWordQuiz('medium', 15);
                break;
            case 'word-quiz-hard':
                this.currentQuestions = await this.generateWordQuiz('hard', 20);
                break;
            case 'speed-meaning':
                this.currentQuestions = await this.generateSpeedQuiz(20);
                break;
            case 'conversation-shopping':
                this.currentQuestions = this.generateConversationQuiz('shopping');
                break;
            case 'conversation-direction':
                this.currentQuestions = this.generateConversationQuiz('direction');
                break;
            case 'conversation-restaurant':
                this.currentQuestions = this.generateConversationQuiz('restaurant');
                break;
            case 'conversation-hotel':
                this.currentQuestions = this.generateConversationQuiz('hotel');
                break;
            case 'sentence-completion-grammar':
                this.currentQuestions = this.generateSentenceCompletionQuiz('grammar', 50);
                break;
            case 'sentence-completion-vocabulary':
                this.currentQuestions = this.generateSentenceCompletionQuiz('vocabulary', 100);
                break;
            case 'sentence-completion-mixed':
                this.currentQuestions = this.generateSentenceCompletionQuiz('mixed', 20);
                break;
            default:
                this.showComingSoon(mode);
                return;
        }

        this.totalQuestions = this.currentQuestions.length;
        if (this.totalQuestions === 0) {
            this.showNoWordsMessage();
            return;
        }

        this.showQuestion();
        // 화면 상단으로 스크롤
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * 단어 퀴즈 문제 생성
     */
    async generateWordQuiz(difficulty, count) {
        let allWords = [];

        try {
            if (this.dbManager) {
                // 데이터베이스에서 단어 가져오기
                const filters = {};

                // 난이도에 따른 JLPT 레벨 설정
                if (difficulty === 'easy') {
                    filters.jlptLevel = 'n5';
                } else if (difficulty === 'medium') {
                    filters.jlptLevel = 'n4';
                } else if (difficulty === 'hard') {
                    filters.jlptLevel = 'n3';
                }

                allWords = await this.dbManager.getRandomWords(filters, count * 2); // 여유있게 가져오기
            } else {
                // 데모 데이터 사용
                this.vocabularyGroups.forEach((group) => {
                    if (group.words) {
                        group.words.forEach((word) => {
                            if (!difficulty || word.level === difficulty || (difficulty === 'easy' && !word.level)) {
                                allWords.push(word);
                            }
                        });
                    }
                });
            }
        } catch (error) {
            console.error('Error getting words from database:', error);
            // 오류 발생시 데모 데이터 사용
            allWords = this.getDemoVocabulary().flatMap((group) => group.words || []);
        }

        if (allWords.length === 0) {
            return [];
        }

        // 랜덤하게 문제 선택
        const questions = [];
        const usedWords = new Set();

        for (let i = 0; i < Math.min(count, allWords.length); i++) {
            let randomWord;
            let attempts = 0;

            do {
                randomWord = allWords[Math.floor(Math.random() * allWords.length)];
                attempts++;
            } while (usedWords.has(randomWord.hanja || randomWord.word) && attempts < 50);

            if (!usedWords.has(randomWord.hanja || randomWord.word)) {
                usedWords.add(randomWord.hanja || randomWord.word);

                // 4지선다 문제 생성
                const question = this.createMultipleChoiceQuestion(randomWord, allWords);
                questions.push(question);
            }
        }

        return questions;
    }

    /**
     * 4지선다 문제 생성
     */
    createMultipleChoiceQuestion(correctWord, allWords) {
        // 데이터베이스 구조에 맞게 필드 접근
        const correctMeaning = correctWord.mean || correctWord.meaning;
        const wordText = correctWord.hanja || correctWord.word;
        const readingText = correctWord.hiragana || correctWord.reading;

        const options = [correctMeaning];
        const usedMeanings = new Set([correctMeaning]);

        // 다른 뜻 3개 추가
        while (options.length < 4 && allWords.length > options.length) {
            const randomWord = allWords[Math.floor(Math.random() * allWords.length)];
            const randomMeaning = randomWord.mean || randomWord.meaning;

            if (randomMeaning && !usedMeanings.has(randomMeaning)) {
                options.push(randomMeaning);
                usedMeanings.add(randomMeaning);
            }
        }

        // 옵션이 4개 미만인 경우 더미 옵션 추가
        while (options.length < 4) {
            options.push(`선택지 ${options.length + 1}`);
        }

        // 옵션 섞기
        for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
        }

        return {
            word: wordText,
            reading: readingText,
            correctAnswer: correctMeaning,
            options: options,
            type: 'multiple-choice',
        };
    }

    /**
     * 속도 퀴즈 문제 생성
     */
    async generateSpeedQuiz(count) {
        return await this.generateWordQuiz('easy', count);
    }

    /**
     * 회화 연습 문제 생성
     */
    generateConversationQuiz(situation) {
        const scenarios = this.getConversationScenarios(situation);
        const questions = [];

        scenarios.forEach((scenario, index) => {
            // 각 대화에서 빈 칸 문제 생성
            scenario.dialogue.forEach((line, lineIndex) => {
                if (line.type === 'response') {
                    questions.push({
                        id: `${situation}-${index}-${lineIndex}`,
                        situation: situation,
                        scenarioTitle: scenario.title,
                        context: scenario.context,
                        dialogue: scenario.dialogue.slice(0, lineIndex + 1),
                        question: line.korean,
                        correctAnswer: line.japanese,
                        options: this.generateConversationOptions(line.japanese, situation),
                        type: 'conversation',
                    });
                }
            });
        });

        // 문제들을 랜덤하게 섞기
        for (let i = questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [questions[i], questions[j]] = [questions[j], questions[i]];
        }

        return questions.slice(0, 10); // 최대 10문제
    }

    /**
     * 회화 시나리오 데이터 생성
     */
    getConversationScenarios(situation) {
        const scenarios = {
            shopping: [
                {
                    title: '옷 쇼핑',
                    context: '백화점에서 옷을 살 때',
                    dialogue: [
                        {
                            type: 'staff',
                            japanese: 'いらっしゃいませ。何かお探しですか？',
                            korean: '어서오세요. 찾으시는 것이 있으신가요?',
                        },
                        { type: 'response', japanese: 'シャツを探しています。', korean: '셔츠를 찾고 있습니다.' },
                        {
                            type: 'staff',
                            japanese: 'どのようなシャツをお探しですか？',
                            korean: '어떤 셔츠를 찾으시나요?',
                        },
                        { type: 'response', japanese: '白いシャツをお願いします。', korean: '흰 셔츠를 부탁합니다.' },
                    ],
                },
                {
                    title: '가격 문의',
                    context: '상품 가격을 물어볼 때',
                    dialogue: [
                        {
                            type: 'customer',
                            japanese: 'すみません、これはいくらですか？',
                            korean: '죄송합니다, 이것은 얼마인가요?',
                        },
                        { type: 'staff', japanese: '3000円です。', korean: '3000엔입니다.' },
                        {
                            type: 'response',
                            japanese: '少し高いですね。安くなりませんか？',
                            korean: '조금 비싸네요. 좀 더 싸게 할 수 없나요?',
                        },
                    ],
                },
                {
                    title: '사이즈 확인',
                    context: '옷 사이즈를 확인할 때',
                    dialogue: [
                        {
                            type: 'response',
                            japanese: 'この服のサイズはありますか？',
                            korean: '이 옷의 사이즈가 있나요?',
                        },
                        {
                            type: 'staff',
                            japanese: 'どちらのサイズをお探しですか？',
                            korean: '어느 사이즈를 찾으시나요?',
                        },
                        { type: 'response', japanese: 'Mサイズをお願いします。', korean: 'M사이즈를 부탁합니다.' },
                    ],
                },
                {
                    title: '시착 요청',
                    context: '옷을 입어볼 때',
                    dialogue: [
                        { type: 'response', japanese: '試着できますか？', korean: '시착할 수 있나요?' },
                        {
                            type: 'staff',
                            japanese: 'はい、こちらの試着室をお使いください。',
                            korean: '네, 이쪽 탈의실을 사용하세요.',
                        },
                        { type: 'response', japanese: 'ありがとうございます。', korean: '감사합니다.' },
                    ],
                },
                {
                    title: '신발 쇼핑',
                    context: '신발을 살 때',
                    dialogue: [
                        { type: 'staff', japanese: '靴をお探しですか？', korean: '신발을 찾으시나요?' },
                        {
                            type: 'response',
                            japanese: 'はい、スニーカーを探しています。',
                            korean: '네, 운동화를 찾고 있습니다.',
                        },
                        { type: 'staff', japanese: '足のサイズは？', korean: '발 사이즈는?' },
                        { type: 'response', japanese: '25センチです。', korean: '25센티입니다.' },
                    ],
                },
                {
                    title: '색상 선택',
                    context: '상품의 색상을 고를 때',
                    dialogue: [
                        { type: 'staff', japanese: 'どの色がお好みですか？', korean: '어떤 색을 좋아하시나요?' },
                        { type: 'response', japanese: '黒い色はありますか？', korean: '검은색이 있나요?' },
                        { type: 'staff', japanese: 'はい、こちらにございます。', korean: '네, 여기 있습니다.' },
                    ],
                },
                {
                    title: '계산하기',
                    context: '물건값을 계산할 때',
                    dialogue: [
                        { type: 'response', japanese: 'これをください。', korean: '이것을 주세요.' },
                        { type: 'staff', japanese: '全部で5000円です。', korean: '전체 5000엔입니다.' },
                        { type: 'response', japanese: 'カードで払います。', korean: '카드로 결제하겠습니다.' },
                    ],
                },
                {
                    title: '포장 요청',
                    context: '선물용 포장을 요청할 때',
                    dialogue: [
                        {
                            type: 'response',
                            japanese: 'プレゼント用に包んでもらえますか？',
                            korean: '선물용으로 포장해 주실 수 있나요?',
                        },
                        { type: 'staff', japanese: 'はい、少しお待ちください。', korean: '네, 잠시만 기다려 주세요.' },
                        { type: 'response', japanese: 'ありがとうございます。', korean: '감사합니다.' },
                    ],
                },
                {
                    title: '반품 문의',
                    context: '상품을 반품하고 싶을 때',
                    dialogue: [
                        { type: 'response', japanese: 'これを返品したいです。', korean: '이것을 반품하고 싶습니다.' },
                        { type: 'staff', japanese: 'レシートはお持ちですか？', korean: '영수증을 갖고 계시나요?' },
                        { type: 'response', japanese: 'はい、ここにあります。', korean: '네, 여기 있습니다.' },
                    ],
                },
                {
                    title: '세일 정보',
                    context: '세일 여부를 문의할 때',
                    dialogue: [
                        { type: 'response', japanese: 'セールはいつまでですか？', korean: '세일은 언제까지인가요?' },
                        { type: 'staff', japanese: '来週の日曜日までです。', korean: '다음주 일요일까지입니다.' },
                        { type: 'response', japanese: 'わかりました。', korean: '알겠습니다.' },
                    ],
                },
            ],
            direction: [
                {
                    title: '역까지 가는 길',
                    context: '기차역까지 가는 길을 물어볼 때',
                    dialogue: [
                        {
                            type: 'tourist',
                            japanese: 'すみません、駅はどこですか？',
                            korean: '죄송합니다, 역은 어디인가요?',
                        },
                        {
                            type: 'local',
                            japanese: 'まっすぐ行って、信号を右に曲がってください。',
                            korean: '똑바로 가서, 신호등에서 우회전하세요.',
                        },
                        {
                            type: 'response',
                            japanese: 'ありがとうございます。歩いてどのくらいかかりますか？',
                            korean: '감사합니다. 걸어서 얼마나 걸리나요?',
                        },
                    ],
                },
                {
                    title: '지하철 타는 법',
                    context: '지하철 이용법을 물어볼 때',
                    dialogue: [
                        {
                            type: 'response',
                            japanese: '地下鉄の乗り方を教えてください。',
                            korean: '지하철 타는 방법을 가르쳐 주세요.',
                        },
                        {
                            type: 'staff',
                            japanese: '切符を買って、改札を通ってください。',
                            korean: '표를 사서 개찰구를 통과하세요.',
                        },
                        { type: 'response', japanese: '切符はどこで買えますか？', korean: '표는 어디서 살 수 있나요?' },
                    ],
                },
                {
                    title: '병원 찾기',
                    context: '병원을 찾을 때',
                    dialogue: [
                        { type: 'response', japanese: '病院はどこにありますか？', korean: '병원은 어디에 있나요?' },
                        {
                            type: 'local',
                            japanese: 'あの角を左に曲がって、2つ目の信号です。',
                            korean: '저 모퉁이를 좌회전해서 두 번째 신호등입니다.',
                        },
                        { type: 'response', japanese: '遠いですか？', korean: '멀어요?' },
                    ],
                },
                {
                    title: '화장실 찾기',
                    context: '화장실 위치를 물어볼 때',
                    dialogue: [
                        { type: 'response', japanese: 'トイレはどこですか？', korean: '화장실은 어디인가요?' },
                        {
                            type: 'staff',
                            japanese: 'あちらの階段を上がって右です。',
                            korean: '저쪽 계단을 올라가서 오른쪽입니다.',
                        },
                        { type: 'response', japanese: 'ありがとうございます。', korean: '감사합니다.' },
                    ],
                },
                {
                    title: '버스 정류장 찾기',
                    context: '버스 정류장을 찾을 때',
                    dialogue: [
                        { type: 'response', japanese: 'バス停はどちらですか？', korean: '버스 정류장은 어디인가요?' },
                        {
                            type: 'local',
                            japanese: '道路を渡った向こう側にあります。',
                            korean: '길을 건너 저편에 있습니다.',
                        },
                        {
                            type: 'response',
                            japanese: '何番のバスに乗ればいいですか？',
                            korean: '몇 번 버스를 타면 됩니까?',
                        },
                    ],
                },
                {
                    title: 'ATM 찾기',
                    context: 'ATM을 찾을 때',
                    dialogue: [
                        { type: 'response', japanese: 'ATMはありますか？', korean: 'ATM이 있나요?' },
                        { type: 'staff', japanese: 'コンビニの中にあります。', korean: '편의점 안에 있습니다.' },
                        { type: 'response', japanese: 'コンビニはどこですか？', korean: '편의점은 어디인가요?' },
                    ],
                },
                {
                    title: '관광지 가는 길',
                    context: '관광지로 가는 길을 물어볼 때',
                    dialogue: [
                        {
                            type: 'response',
                            japanese: '東京タワーはどう行けばいいですか？',
                            korean: '도쿄타워는 어떻게 가면 되나요?',
                        },
                        { type: 'local', japanese: '地下鉄で3駅です。', korean: '지하철로 3역입니다.' },
                        { type: 'response', japanese: '何線に乗ればいいですか？', korean: '몇 호선을 타면 되나요?' },
                    ],
                },
                {
                    title: '길을 잃었을 때',
                    context: '길을 잃고 도움을 요청할 때',
                    dialogue: [
                        { type: 'response', japanese: '道に迷いました。', korean: '길을 잃었습니다.' },
                        { type: 'local', japanese: 'どちらに行きたいですか？', korean: '어디로 가고 싶으세요?' },
                        { type: 'response', japanese: '新宿駅に行きたいです。', korean: '신주쿠역에 가고 싶습니다.' },
                    ],
                },
            ],
            restaurant: [
                {
                    title: '메뉴 주문',
                    context: '레스토랑에서 음식을 주문할 때',
                    dialogue: [
                        { type: 'staff', japanese: 'ご注文はお決まりですか？', korean: '주문은 정하셨나요?' },
                        { type: 'response', japanese: 'ラーメンをお願いします。', korean: '라멘을 부탁합니다.' },
                        { type: 'staff', japanese: '飲み物はいかがですか？', korean: '음료는 어떠세요?' },
                        { type: 'response', japanese: '水をお願いします。', korean: '물을 부탁합니다.' },
                    ],
                },
                {
                    title: '계산하기',
                    context: '식사 후 계산할 때',
                    dialogue: [
                        { type: 'response', japanese: 'お会計をお願いします。', korean: '계산을 부탁합니다.' },
                        { type: 'staff', japanese: '1500円になります。', korean: '1500엔입니다.' },
                        { type: 'response', japanese: 'カードで払えますか？', korean: '카드로 낼 수 있나요?' },
                    ],
                },
                {
                    title: '예약하기',
                    context: '레스토랑을 예약할 때',
                    dialogue: [
                        { type: 'response', japanese: '予約をしたいのですが。', korean: '예약을 하고 싶은데요.' },
                        { type: 'staff', japanese: '何名様ですか？', korean: '몇 분이신가요?' },
                        { type: 'response', japanese: '2名です。', korean: '2명입니다.' },
                    ],
                },
                {
                    title: '메뉴 추천 요청',
                    context: '메뉴 추천을 받고 싶을 때',
                    dialogue: [
                        { type: 'response', japanese: 'おすすめは何ですか？', korean: '추천 메뉴는 무엇인가요?' },
                        { type: 'staff', japanese: '今日は魚がおいしいです。', korean: '오늘은 생선이 맛있습니다.' },
                        { type: 'response', japanese: 'それをお願いします。', korean: '그것으로 부탁합니다.' },
                    ],
                },
                {
                    title: '알레르기 문의',
                    context: '알레르기가 있어서 문의할 때',
                    dialogue: [
                        { type: 'response', japanese: '卵は入っていますか？', korean: '계란이 들어있나요?' },
                        { type: 'staff', japanese: 'はい、入っています。', korean: '네, 들어있습니다.' },
                        { type: 'response', japanese: '卵なしでできますか？', korean: '계란 없이 만들 수 있나요?' },
                    ],
                },
                {
                    title: '맛 조절 요청',
                    context: '음식의 매운 정도를 조절할 때',
                    dialogue: [
                        { type: 'staff', japanese: '辛さはいかがしますか？', korean: '매운 정도는 어떻게 하시겠어요?' },
                        {
                            type: 'response',
                            japanese: 'あまり辛くしないでください。',
                            korean: '너무 맵게 하지 말아 주세요.',
                        },
                        { type: 'staff', japanese: 'わかりました。', korean: '알겠습니다.' },
                    ],
                },
                {
                    title: '추가 주문',
                    context: '음식을 더 주문하고 싶을 때',
                    dialogue: [
                        {
                            type: 'response',
                            japanese: 'サラダも追加でお願いします。',
                            korean: '샐러드도 추가로 부탁합니다.',
                        },
                        { type: 'staff', japanese: 'かしこまりました。', korean: '알겠습니다.' },
                        { type: 'response', japanese: 'ありがとうございます。', korean: '감사합니다.' },
                    ],
                },
                {
                    title: '테이블 요청',
                    context: '특정 테이블을 요청할 때',
                    dialogue: [
                        { type: 'response', japanese: '窓際の席はありますか？', korean: '창가 자리가 있나요?' },
                        {
                            type: 'staff',
                            japanese: '申し訳ございませんが、満席です。',
                            korean: '죄송하지만, 만석입니다.',
                        },
                        {
                            type: 'response',
                            japanese: 'それでは、どこでも大丈夫です。',
                            korean: '그러면, 어디든 괜찮습니다.',
                        },
                    ],
                },
                {
                    title: '대기시간 문의',
                    context: '대기시간을 물어볼 때',
                    dialogue: [
                        { type: 'response', japanese: 'どのくらい待ちますか？', korean: '얼마나 기다리나요?' },
                        { type: 'staff', japanese: '20分ほどお待ちください。', korean: '20분 정도 기다려 주세요.' },
                        { type: 'response', japanese: 'わかりました。', korean: '알겠습니다.' },
                    ],
                },
                {
                    title: '포장 주문',
                    context: '음식을 포장해서 가져갈 때',
                    dialogue: [
                        { type: 'response', japanese: '持ち帰りでお願いします。', korean: '포장으로 부탁합니다.' },
                        { type: 'staff', japanese: '何分ほどかかります。', korean: '몇 분 정도 걸립니다.' },
                        { type: 'response', japanese: 'ここで待ちます。', korean: '여기서 기다리겠습니다.' },
                    ],
                },
                {
                    title: '물 요청',
                    context: '물을 더 달라고 할 때',
                    dialogue: [
                        {
                            type: 'response',
                            japanese: 'お水をもう一杯お願いします。',
                            korean: '물을 한 잔 더 부탁합니다.',
                        },
                        { type: 'staff', japanese: 'はい、すぐにお持ちします。', korean: '네, 곧 갖다드리겠습니다.' },
                        { type: 'response', japanese: 'ありがとうございます。', korean: '감사합니다.' },
                    ],
                },
                {
                    title: '화장실 위치',
                    context: '식당에서 화장실 위치를 물어볼 때',
                    dialogue: [
                        { type: 'response', japanese: 'トイレはどちらですか？', korean: '화장실은 어디인가요?' },
                        {
                            type: 'staff',
                            japanese: '奥の廊下を左に行ってください。',
                            korean: '안쪽 복도를 왼쪽으로 가세요.',
                        },
                        { type: 'response', japanese: 'ありがとうございます。', korean: '감사합니다.' },
                    ],
                },
            ],
            hotel: [
                {
                    title: '체크인',
                    context: '호텔에서 체크인할 때',
                    dialogue: [
                        { type: 'response', japanese: 'チェックインをお願いします。', korean: '체크인을 부탁합니다.' },
                        { type: 'staff', japanese: 'お名前をお聞かせください。', korean: '성함을 알려주세요.' },
                        {
                            type: 'response',
                            japanese: '田中です。予約しています。',
                            korean: '다나카입니다. 예약했습니다.',
                        },
                    ],
                },
                {
                    title: '시설 문의',
                    context: '호텔 시설에 대해 문의할 때',
                    dialogue: [
                        {
                            type: 'response',
                            japanese: 'WiFiのパスワードを教えてください。',
                            korean: 'WiFi 비밀번호를 가르쳐 주세요.',
                        },
                        { type: 'staff', japanese: 'hotel123です。', korean: 'hotel123입니다.' },
                        { type: 'response', japanese: '朝食は何時からですか？', korean: '아침식사는 몇 시부터인가요?' },
                    ],
                },
                {
                    title: '룸서비스',
                    context: '룸서비스를 주문할 때',
                    dialogue: [
                        {
                            type: 'response',
                            japanese: 'ルームサービスをお願いします。',
                            korean: '룸서비스를 부탁합니다.',
                        },
                        { type: 'staff', japanese: '何をお持ちしましょうか？', korean: '무엇을 갖다드릴까요?' },
                        { type: 'response', japanese: 'コーヒーをお願いします。', korean: '커피를 부탁합니다.' },
                    ],
                },
                {
                    title: '체크아웃',
                    context: '호텔에서 체크아웃할 때',
                    dialogue: [
                        {
                            type: 'response',
                            japanese: 'チェックアウトをお願いします。',
                            korean: '체크아웃을 부탁합니다.',
                        },
                        { type: 'staff', japanese: 'お部屋番号は？', korean: '방 번호는?' },
                        { type: 'response', japanese: '305号室です。', korean: '305호실입니다.' },
                    ],
                },
                {
                    title: '청소 요청',
                    context: '방 청소를 요청할 때',
                    dialogue: [
                        { type: 'response', japanese: '部屋の掃除をお願いします。', korean: '방 청소를 부탁합니다.' },
                        { type: 'staff', japanese: '今すぐでしょうか？', korean: '지금 바로 하시겠어요?' },
                        { type: 'response', japanese: 'はい、お願いします。', korean: '네, 부탁합니다.' },
                    ],
                },
                {
                    title: '짐 보관',
                    context: '짐을 맡기고 싶을 때',
                    dialogue: [
                        {
                            type: 'response',
                            japanese: '荷物を預かってもらえますか？',
                            korean: '짐을 맡아주실 수 있나요?',
                        },
                        {
                            type: 'staff',
                            japanese: 'もちろんです。こちらへどうぞ。',
                            korean: '물론입니다. 이쪽으로 주세요.',
                        },
                        { type: 'response', japanese: 'ありがとうございます。', korean: '감사합니다.' },
                    ],
                },
            ],
        };

        return scenarios[situation] || [];
    }

    /**
     * 회화 선택지 생성
     */
    generateConversationOptions(correctAnswer, situation) {
        const commonPhrases = {
            shopping: ['買い物をしています。', 'お金がありません。', '店を探しています。', '商品を見ています。'],
            direction: ['道がわかりません。', '地図を見ています。', 'タクシーを呼んでください。', 'バスはどこですか？'],
            restaurant: [
                'お腹が空いています。',
                'メニューを見せてください。',
                '予約していません。',
                '料理を作っています。',
            ],
            hotel: ['部屋を掃除してください。', '荷物を運んでください。', 'タオルをください。', '鍵をなくしました。'],
        };

        const options = [correctAnswer];
        const availableOptions = commonPhrases[situation] || commonPhrases.shopping;

        // 정답이 아닌 3개 선택지 추가
        const shuffled = [...availableOptions].filter((option) => option !== correctAnswer);
        for (let i = 0; i < Math.min(3, shuffled.length); i++) {
            options.push(shuffled[i]);
        }

        // 부족한 선택지는 일반적인 표현으로 채우기
        while (options.length < 4) {
            options.push(`선택지 ${options.length}`);
        }

        // 옵션 섞기
        for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
        }

        return options;
    }

    /**
     * 문장 완성 퀴즈 문제 생성
     */
    generateSentenceCompletionQuiz(type, count) {
        let allProblems = [];

        if (type === 'grammar') {
            allProblems = this.getGrammarCompletionProblems();
        } else if (type === 'vocabulary') {
            allProblems = this.getVocabularyCompletionProblems();
        } else if (type === 'mixed') {
            const grammarProblems = this.getGrammarCompletionProblems();
            const vocabularyProblems = this.getVocabularyCompletionProblems();
            allProblems = [...grammarProblems, ...vocabularyProblems];
        }

        // 문제들을 랜덤하게 섞기
        for (let i = allProblems.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allProblems[i], allProblems[j]] = [allProblems[j], allProblems[i]];
        }

        return allProblems.slice(0, Math.min(count, allProblems.length));
    }

    /**
     * 문법 완성 문제 데이터
     */
    getGrammarCompletionProblems() {
        const problems = [
            {
                sentence: '私は毎日学校___行きます。',
                correctAnswer: 'に',
                options: ['に', 'で', 'を', 'は'],
                explanation: '「行く」は移動動사이므로 목적지를 나타낼 때 조사 「に」를 사용합니다.',
                type: 'sentence-completion',
                category: 'grammar',
                grammarPoint: '조사 に/で',
            },
            {
                sentence: '友達___電話をかけました。',
                correctAnswer: 'に',
                options: ['に', 'で', 'を', 'が'],
                explanation: '「電話をかける」에서 상대방을 나타낼 때는 조사 「に」를 사용합니다.',
                type: 'sentence-completion',
                category: 'grammar',
                grammarPoint: '조사 に',
            },
            {
                sentence: '昨日映画___見ました。',
                correctAnswer: 'を',
                options: ['を', 'が', 'に', 'で'],
                explanation: '타동사 「見る」의 목적어를 나타낼 때는 조사 「を」을 사용합니다.',
                type: 'sentence-completion',
                category: 'grammar',
                grammarPoint: '조사 を',
            },
            {
                sentence: '図書館___本を読みます。',
                correctAnswer: 'で',
                options: ['で', 'に', 'を', 'が'],
                explanation: '동작이 일어나는 장소를 나타낼 때는 조사 「で」를 사용합니다.',
                type: 'sentence-completion',
                category: 'grammar',
                grammarPoint: '조사 で',
            },
            {
                sentence: '雨___降っています。',
                correctAnswer: 'が',
                options: ['が', 'を', 'に', 'で'],
                explanation: '자동사 「降る」의 주어를 나타낼 때는 조사 「が」를 사용합니다.',
                type: 'sentence-completion',
                category: 'grammar',
                grammarPoint: '조사 が',
            },
            {
                sentence: '明日東京___行く予定です。',
                correctAnswer: 'に',
                options: ['に', 'で', 'を', 'へ'],
                explanation:
                    '목적지를 나타낼 때는 「に」 또는 「へ」를 사용하는데, 여기서는 「に」가 더 자연스럽습니다.',
                type: 'sentence-completion',
                category: 'grammar',
                grammarPoint: '방향 조사',
            },
            {
                sentence: 'コーヒー___飲みたいです。',
                correctAnswer: 'を',
                options: ['を', 'が', 'に', 'で'],
                explanation: '「飲む」의 목적어를 나타낼 때는 조사 「を」을 사용합니다.',
                type: 'sentence-completion',
                category: 'grammar',
                grammarPoint: '희망 표현의 목적어',
            },
            {
                sentence: '新しい車___欲しいです。',
                correctAnswer: 'が',
                options: ['が', 'を', 'に', 'で'],
                explanation: '「欲しい」는 형용사이므로 목적어에 조사 「が」를 사용합니다.',
                type: 'sentence-completion',
                category: 'grammar',
                grammarPoint: '희망 표현 が/を',
            },
            {
                sentence: '日本語___勉強しています。',
                correctAnswer: 'を',
                options: ['を', 'が', 'に', 'で'],
                explanation: '「勉強する」의 목적어를 나타낼 때는 조사 「を」을 사용합니다.',
                type: 'sentence-completion',
                category: 'grammar',
                grammarPoint: '동작의 목적어',
            },
            {
                sentence: '先生___質問をしました。',
                correctAnswer: 'に',
                options: ['に', 'で', 'を', 'が'],
                explanation: '「質問する」에서 질문을 받는 사람을 나타낼 때는 조사 「に」를 사용합니다.',
                type: 'sentence-completion',
                category: 'grammar',
                grammarPoint: '상대방 표시',
            },
        ];

        return problems;
    }

    /**
     * 단어 완성 문제 데이터
     */
    getVocabularyCompletionProblems() {
        const problems = [
            {
                sentence: '毎朝___を飲みます。',
                correctAnswer: 'コーヒー',
                options: ['コーヒー', 'パン', '新聞', '音楽'],
                explanation: "아침에 '마시는' 것은 커피입니다. 「飲む」와 어울리는 단어를 선택해야 합니다.",
                type: 'sentence-completion',
                category: 'vocabulary',
                grammarPoint: '동사와 어울리는 명사',
            },
            {
                sentence: '図書館で___を読みます。',
                correctAnswer: '本',
                options: ['本', '音楽', '料理', '運動'],
                explanation: "도서관에서 '읽는' 것은 책입니다. 장소와 동작에 어울리는 명사를 선택해야 합니다.",
                type: 'sentence-completion',
                category: 'vocabulary',
                grammarPoint: '장소와 어울리는 행동',
            },
            {
                sentence: '友達と___を見ました。',
                correctAnswer: '映画',
                options: ['映画', '勉強', '料理', '掃除'],
                explanation: "친구와 함께 '보는' 것은 영화입니다. 「見る」동사와 자연스럽게 어울립니다.",
                type: 'sentence-completion',
                category: 'vocabulary',
                grammarPoint: '동사의 목적어',
            },
            {
                sentence: 'レストランで___を食べました。',
                correctAnswer: '料理',
                options: ['料理', '本', '映画', '音楽'],
                explanation: "레스토랑에서 '먹는' 것은 요리입니다. 장소와 동작이 일치합니다.",
                type: 'sentence-completion',
                category: 'vocabulary',
                grammarPoint: '장소에 따른 행동',
            },
            {
                sentence: '音楽を___ます。',
                correctAnswer: '聞き',
                options: ['聞き', '食べ', '読み', '書き'],
                explanation: "음악은 '듣는' 것입니다. 「聞く」가 정답입니다.",
                type: 'sentence-completion',
                category: 'vocabulary',
                grammarPoint: '명사와 어울리는 동사',
            },
            {
                sentence: '手紙を___ました。',
                correctAnswer: '書き',
                options: ['書き', '聞き', '飲み', '見'],
                explanation: "편지는 '쓰는' 것입니다. 「書く」가 정답입니다.",
                type: 'sentence-completion',
                category: 'vocabulary',
                grammarPoint: '목적어와 동사의 관계',
            },
            {
                sentence: '新しい___を買いました。',
                correctAnswer: '服',
                options: ['服', '天気', '時間', '気分'],
                explanation: "새로운 것을 '산다'면 옷이 가장 자연스럽습니다.",
                type: 'sentence-completion',
                category: 'vocabulary',
                grammarPoint: '동사와 어울리는 명사',
            },
            {
                sentence: '毎日___をします。',
                correctAnswer: '運動',
                options: ['運動', '天気', '時計', '色'],
                explanation: "매일 '하는' 것 중에서 운동이 가장 적절합니다. 「する」동사와 어울립니다.",
                type: 'sentence-completion',
                category: 'vocabulary',
                grammarPoint: 'サ변동사',
            },
            {
                sentence: '今日は___がいいです。',
                correctAnswer: '天気',
                options: ['天気', '勉強', '料理', '掃除'],
                explanation: "'좋다'고 표현하는 것 중에서 날씨가 가장 자연스럽습니다.",
                type: 'sentence-completion',
                category: 'vocabulary',
                grammarPoint: '형용사와 어울리는 명사',
            },
            {
                sentence: '___で買い物をしました。',
                correctAnswer: 'デパート',
                options: ['デパート', '授業', '宿題', '質問'],
                explanation: '쇼핑을 하는 장소는 백화점입니다. 장소를 나타내는 명사를 선택해야 합니다.',
                type: 'sentence-completion',
                category: 'vocabulary',
                grammarPoint: '행동과 장소',
            },
        ];

        return problems;
    }

    /**
     * 문제 표시
     */
    showQuestion() {
        if (this.currentQuestionIndex >= this.currentQuestions.length) {
            this.showResults();
            return;
        }

        const question = this.currentQuestions[this.currentQuestionIndex];
        const container = document.querySelector('.practice-container');

        if (question.type === 'conversation') {
            this.showConversationQuestion(question, container);
        } else if (question.type === 'sentence-completion') {
            this.showSentenceCompletionQuestion(question, container);
        } else {
            this.showWordQuestion(question, container);
        }

        // 화면 상단으로 스크롤
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * 단어 퀴즈 문제 표시
     */
    showWordQuestion(question, container) {
        container.innerHTML = `
            <div class="question-container">
                <div class="question-content">
                    <div class="question-progress">
                        <span class="question-number">${this.currentQuestionIndex + 1} / ${this.totalQuestions}</span>
                        <div class="context-info">
                            <div class="context-title">단어 퀴즈</div>
                        </div>
                        <button class="end-practice-btn" title="연습 종료">×</button>
                    </div>

                    <div class="word-display">
                        <div class="word-text">${question.word}</div>
                        ${
                            question.reading !== question.word
                                ? `<div class="word-reading">${question.reading}</div>`
                                : ''
                        }
                        <button class="play-sound-btn" title="발음 듣기">🔊</button>
                    </div>

                    <div class="question-text">이 단어의 뜻은 무엇일까요?</div>

                    <div class="answers-grid">
                        ${question.options
                            .map(
                                (option, index) => `
                            <button class="answer-btn" data-answer="${option}">
                                <span class="option-number">${index + 1}</span>
                                <span class="option-text">${option}</span>
                            </button>
                        `
                            )
                            .join('')}
                    </div>
                </div>

                <div class="question-footer">
                    <div class="stats-display">
                        <span class="correct-count">정답: ${this.stats.correct}</span>
                        <span class="streak-count">연속: ${this.stats.streak}</span>
                    </div>
                </div>
            </div>
        `;

        // 발음 재생 이벤트
        const playBtn = container.querySelector('.play-sound-btn');
        if (playBtn && this.speechSynthesis) {
            playBtn.addEventListener('click', () => {
                this.playPronunciation(question.word, question.reading);
            });
        }
    }

    /**
     * 회화 연습 문제 표시
     */
    showConversationQuestion(question, container) {
        const situationIcons = {
            shopping: '🛒',
            direction: '🗺️',
            restaurant: '🍽️',
            hotel: '🏨',
        };

        container.innerHTML = `
            <div class="question-container conversation-question">
                <div class="question-content">
                    <div class="question-progress">
                        <span class="question-number">${this.currentQuestionIndex + 1} / ${this.totalQuestions}</span>
                        <div class="context-info">
                            <span class="situation-icon">${situationIcons[question.situation] || '💬'}</span>
                            <div class="context-text">
                                <div class="context-title">${question.scenarioTitle}</div>
                                <div class="context-desc">${question.context}</div>
                            </div>
                        </div>
                        <button class="end-practice-btn" title="연습 종료">×</button>
                    </div>

                    <div class="conversation-context">

                    <div class="dialogue-display">
                        ${question.dialogue
                            .map((line, index) => {
                                if (line.type === 'response' && index === question.dialogue.length - 1) {
                                    return `
                                    <div class="dialogue-line user-response">
                                        <div class="speaker">나</div>
                                        <div class="speech-bubble response-bubble">
                                            <div class="korean-text">${line.korean}</div>
                                            <div class="question-mark">❓</div>
                                        </div>
                                    </div>
                                `;
                                } else {
                                    const speakerName =
                                        line.type === 'staff'
                                            ? '직원'
                                            : line.type === 'local'
                                            ? '현지인'
                                            : line.type === 'customer'
                                            ? '고객'
                                            : '상대방';
                                    return `
                                    <div class="dialogue-line ${line.type}">
                                        <div class="speaker">${speakerName}</div>
                                        <div class="speech-bubble">
                                            <div class="japanese-text">${line.japanese}</div>
                                            <div class="korean-text">${line.korean}</div>
                                        </div>
                                    </div>
                                `;
                                }
                            })
                            .join('')}
                    </div>

                    <div class="question-text">일본어로 어떻게 말해야 할까요?</div>

                    <div class="answers-grid">
                        ${question.options
                            .map(
                                (option, index) => `
                            <button class="answer-btn" data-answer="${option}">
                                <span class="option-number">${index + 1}</span>
                                <span class="option-text">${option}</span>
                            </button>
                        `
                            )
                            .join('')}
                    </div>
                </div>

                <div class="question-footer">
                    <div class="stats-display">
                        <span class="correct-count">정답: ${this.stats.correct}</span>
                        <span class="streak-count">연속: ${this.stats.streak}</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 문장 완성 문제 표시
     */
    showSentenceCompletionQuestion(question, container) {
        const categoryIcons = {
            grammar: '📝',
            vocabulary: '💭',
        };

        // 문장에서 빈칸 부분을 강조 표시
        const displaySentence = question.sentence.replace('___', '<span class="blank-space">___</span>');

        container.innerHTML = `
            <div class="question-container sentence-completion-question">
                <div class="question-content">
                    <div class="question-progress">
                        <span class="question-number">${this.currentQuestionIndex + 1} / ${this.totalQuestions}</span>
                        <div class="context-info">
                            <span class="category-icon">${categoryIcons[question.category] || '📝'}</span>
                            <div class="context-text">
                                <div class="context-title">${
                                    question.category === 'grammar' ? '문법 완성' : '단어 완성'
                                }</div>
                                <div class="context-desc">${question.grammarPoint}</div>
                            </div>
                        </div>
                        <button class="end-practice-btn" title="연습 종료">×</button>
                    </div>

                    <div class="completion-context">

                    <div class="sentence-display">
                        <div class="sentence-text">${displaySentence}</div>
                    </div>

                    <div class="question-text">빈칸에 알맞은 ${
                        question.category === 'grammar' ? '조사나 어미' : '단어'
                    }를 선택하세요</div>

                    <div class="answers-grid">
                        ${question.options
                            .map(
                                (option, index) => `
                            <button class="answer-btn" data-answer="${option}">
                                <span class="option-number">${index + 1}</span>
                                <span class="option-text">${option}</span>
                            </button>
                        `
                            )
                            .join('')}
                    </div>
                </div>

                <div class="question-footer">
                    <div class="stats-display">
                        <span class="correct-count">정답: ${this.stats.correct}</span>
                        <span class="streak-count">연속: ${this.stats.streak}</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 답변 처리
     */
    handleAnswer(answerBtn) {
        if (answerBtn.classList.contains('disabled')) return;

        const selectedAnswer = answerBtn.dataset.answer;
        const question = this.currentQuestions[this.currentQuestionIndex];
        const isCorrect = selectedAnswer === question.correctAnswer;

        // 모든 답변 버튼 비활성화
        const answerBtns = document.querySelectorAll('.answer-btn');
        answerBtns.forEach((btn) => {
            btn.classList.add('disabled');
            if (btn.dataset.answer === question.correctAnswer) {
                btn.classList.add('correct');
            } else if (btn === answerBtn && !isCorrect) {
                btn.classList.add('incorrect');
            }
        });

        // 점수 및 통계 업데이트
        if (isCorrect) {
            this.score += 10;
            this.stats.correct++;
            this.stats.streak++;
            this.stats.bestStreak = Math.max(this.stats.bestStreak, this.stats.streak);
        } else {
            this.stats.incorrect++;
            this.stats.streak = 0;
        }

        // 결과 표시 및 다음 버튼 추가
        setTimeout(() => {
            this.showQuestionResult(isCorrect, question);
        }, 1000);
    }

    /**
     * 문제 결과 표시
     */
    showQuestionResult(isCorrect, question) {
        const container = document.querySelector('.question-content');

        let explanationHtml = '';
        if (question.type === 'conversation') {
            explanationHtml = `
                <div class="conversation-explanation">
                    <div class="situation-info">
                        <div class="situation-title">${question.scenarioTitle}</div>
                        <div class="situation-desc">${question.context}</div>
                    </div>
                    <div class="correct-phrase">
                        <div class="japanese-answer">${question.correctAnswer}</div>
                        <div class="korean-meaning">${question.question}</div>
                    </div>
                </div>
            `;
        } else if (question.type === 'sentence-completion') {
            const completedSentence = question.sentence.replace(
                '___',
                `<span class="correct-answer-highlight">${question.correctAnswer}</span>`
            );
            explanationHtml = `
                <div class="completion-explanation">
                    <div class="completed-sentence">
                        <div class="sentence-result">${completedSentence}</div>
                        <div class="grammar-point">${question.grammarPoint}</div>
                    </div>
                    <div class="explanation-text">${question.explanation}</div>
                </div>
            `;
        } else {
            explanationHtml = `
                <div class="word-explanation">
                    <div class="word-info">
                        <span class="word">${question.word || ''}</span>
                        <span class="reading">${question.reading || ''}</span>
                    </div>
                    <div class="meaning">${question.correctAnswer}</div>
                </div>
            `;
        }

        const resultHtml = `
            <div class="result-display ${isCorrect ? 'correct' : 'incorrect'}">
                <div class="result-icon">${isCorrect ? '✅' : '❌'}</div>
                <div class="result-message">
                    ${isCorrect ? '정답입니다!' : '틀렸습니다'}
                </div>
                ${explanationHtml}
                <button class="next-question-btn">
                    ${this.currentQuestionIndex + 1 >= this.totalQuestions ? '결과 보기' : '다음 문제'}
                </button>
            </div>
        `;

        container.innerHTML = resultHtml;

        // 점수 업데이트
        const scoreElement = document.querySelector('.score');
        if (scoreElement) {
            scoreElement.textContent = `점수: ${this.score}`;
        }

        // 다음 문제 버튼에 직접 이벤트 리스너 추가
        const nextButton = container.querySelector('.next-question-btn');
        if (nextButton) {
            console.log('Next button found, adding click listener');
            nextButton.addEventListener('click', (e) => {
                console.log('Next button clicked!', e);
                e.preventDefault();
                e.stopPropagation();
                this.nextQuestion();
            });
        } else {
            console.error('Next button not found!');
        }
    }

    /**
     * 다음 문제로 이동
     */
    nextQuestion() {
        console.log('Moving to next question. Current index:', this.currentQuestionIndex);
        this.currentQuestionIndex++;
        console.log('New question index:', this.currentQuestionIndex, 'Total:', this.totalQuestions);
        this.showQuestion();
        // 화면 상단으로 스크롤
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * 연습 종료
     */
    endPractice() {
        if (confirm('연습을 중단하고 연습 메뉴로 돌아가시겠습니까?')) {
            this.currentMode = null;
            this.currentQuestions = [];
            this.navigateToPracticeMenu();
        }
    }

    /**
     * 결과 화면 표시
     */
    showResults() {
        const container = document.querySelector('.practice-container');
        const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);
        const accuracy = this.totalQuestions > 0 ? Math.round((this.stats.correct / this.totalQuestions) * 100) : 0;

        container.innerHTML = `
            <div class="results-container">
                <div class="results-header">
                    <h2>연습 완료! 🎉</h2>
                    <div class="final-score">${this.score}점</div>
                </div>

                <div class="results-stats">
                    <div class="stat-item">
                        <div class="stat-number">${this.stats.correct}</div>
                        <div class="stat-label">정답</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">${this.stats.incorrect}</div>
                        <div class="stat-label">오답</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">${accuracy}%</div>
                        <div class="stat-label">정확도</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">${this.stats.bestStreak}</div>
                        <div class="stat-label">최대 연속</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">${timeSpent}초</div>
                        <div class="stat-label">소요 시간</div>
                    </div>
                </div>

                <div class="results-actions">
                    <div class="btn-row">
                        <button class="btn-tertiary" onclick="window.practice.navigateToPracticeMenu()">
                            연습 메뉴
                        </button>
                        <button class="btn-tertiary" onclick="window.practice.navigateToHome()">
                            홈
                        </button>
                    </div>
                </div>
            </div>
        `;

        // 홈 대시보드 통계 업데이트
        this.updateDashboardStats();

        // 학습 활동 기록
        if (window.homeDashboard && this.totalQuestions > 0) {
            window.homeDashboard.recordLearningActivity('practice_complete', 1);
        }

        this.currentMode = null;

        // 화면 상단으로 스크롤
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * 연습 재시작
     */
    restartPractice() {
        this.startPracticeMode(this.currentMode);
    }

    /**
     * 발음 재생
     */
    playPronunciation(word, reading) {
        if (!this.speechSynthesis) return;

        try {
            if (this.speechSynthesis.speak) {
                // Custom speech manager
                this.speechSynthesis.speak(reading || word, 'ja-JP');
            } else if (this.speechSynthesis.getVoices) {
                // Browser speech synthesis
                const utterance = new SpeechSynthesisUtterance(reading || word);
                utterance.lang = 'ja-JP';
                utterance.rate = 0.8;
                this.speechSynthesis.speak(utterance);
            }
        } catch (error) {
            console.error('Error playing pronunciation:', error);
        }
    }

    /**
     * 대시보드 통계 업데이트
     */
    updateDashboardStats() {
        // 홈 대시보드 실시간 통계 업데이트
        if (window.homeDashboard && window.homeDashboard.updateStudyProgress) {
            window.homeDashboard.updateStudyProgress('practice', 1);
            window.homeDashboard.updateStudyProgress('words', this.stats.correct);
        }

        // 연습 세션 기록 저장
        this.savePracticeSession();
    }

    /**
     * 연습 세션 기록 저장
     */
    savePracticeSession() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const sessionData = {
                date: today,
                timestamp: Date.now(),
                mode: this.currentMode,
                totalQuestions: this.totalQuestions,
                correctAnswers: this.stats.correct,
                incorrectAnswers: this.stats.incorrect,
                accuracy: this.totalQuestions > 0 ? Math.round((this.stats.correct / this.totalQuestions) * 100) : 0,
                bestStreak: this.stats.bestStreak,
                timeSpent: Math.floor((Date.now() - this.startTime) / 1000),
                score: this.score,
            };

            // 기존 연습 기록 가져오기
            const practiceHistory = JSON.parse(localStorage.getItem('practiceHistory') || '[]');

            // 새 세션 추가
            practiceHistory.push(sessionData);

            // 최대 100개 세션만 유지
            if (practiceHistory.length > 100) {
                practiceHistory.splice(0, practiceHistory.length - 100);
            }

            // 저장
            localStorage.setItem('practiceHistory', JSON.stringify(practiceHistory));

            // 오늘의 연습 통계 업데이트
            this.updateTodayPracticeStats(sessionData);

            console.log('Practice session saved:', sessionData);
        } catch (error) {
            console.error('Error saving practice session:', error);
        }
    }

    /**
     * 오늘의 연습 통계 업데이트
     */
    updateTodayPracticeStats(sessionData) {
        try {
            const today = sessionData.date;
            const todayStats = JSON.parse(localStorage.getItem('todayPracticeStats') || '{}');

            if (!todayStats[today]) {
                todayStats[today] = {
                    sessions: 0,
                    totalQuestions: 0,
                    correctAnswers: 0,
                    totalTimeSpent: 0,
                    totalScore: 0,
                    bestAccuracy: 0,
                    bestStreak: 0,
                    modesPlayed: new Set(),
                };
            }

            const dayStats = todayStats[today];
            dayStats.sessions += 1;
            dayStats.totalQuestions += sessionData.totalQuestions;
            dayStats.correctAnswers += sessionData.correctAnswers;
            dayStats.totalTimeSpent += sessionData.timeSpent;
            dayStats.totalScore += sessionData.score;
            dayStats.bestAccuracy = Math.max(dayStats.bestAccuracy, sessionData.accuracy);
            dayStats.bestStreak = Math.max(dayStats.bestStreak, sessionData.bestStreak);
            dayStats.modesPlayed.add(sessionData.mode);

            // Set을 배열로 변환해서 저장
            const statsToSave = {
                ...todayStats,
                [today]: {
                    ...dayStats,
                    modesPlayed: Array.from(dayStats.modesPlayed),
                },
            };

            localStorage.setItem('todayPracticeStats', JSON.stringify(statsToSave));
        } catch (error) {
            console.error('Error updating today practice stats:', error);
        }
    }

    /**
     * 연습 통계 조회
     */
    getPracticeStats(days = 7) {
        try {
            const practiceHistory = JSON.parse(localStorage.getItem('practiceHistory') || '[]');
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            const recentSessions = practiceHistory.filter((session) => new Date(session.timestamp) >= cutoffDate);

            const stats = {
                totalSessions: recentSessions.length,
                totalQuestions: recentSessions.reduce((sum, s) => sum + s.totalQuestions, 0),
                totalCorrect: recentSessions.reduce((sum, s) => sum + s.correctAnswers, 0),
                totalTimeSpent: recentSessions.reduce((sum, s) => sum + s.timeSpent, 0),
                averageAccuracy: 0,
                bestStreak: Math.max(...recentSessions.map((s) => s.bestStreak), 0),
                favoriteMode: this.getMostPlayedMode(recentSessions),
            };

            if (stats.totalQuestions > 0) {
                stats.averageAccuracy = Math.round((stats.totalCorrect / stats.totalQuestions) * 100);
            }

            return stats;
        } catch (error) {
            console.error('Error getting practice stats:', error);
            return {
                totalSessions: 0,
                totalQuestions: 0,
                totalCorrect: 0,
                totalTimeSpent: 0,
                averageAccuracy: 0,
                bestStreak: 0,
                favoriteMode: null,
            };
        }
    }

    /**
     * 가장 많이 플레이한 모드 조회
     */
    getMostPlayedMode(sessions) {
        const modeCount = {};
        sessions.forEach((session) => {
            modeCount[session.mode] = (modeCount[session.mode] || 0) + 1;
        });

        let mostPlayed = null;
        let maxCount = 0;

        for (const [mode, count] of Object.entries(modeCount)) {
            if (count > maxCount) {
                maxCount = count;
                mostPlayed = mode;
            }
        }

        return mostPlayed;
    }

    /**
     * 준비중 메시지 표시
     */
    showComingSoon(modeName) {
        const container = document.querySelector('.practice-container');
        container.innerHTML = `
            <div class="coming-soon-container">
                <div class="coming-soon-content">
                    <div class="coming-soon-icon">🚧</div>
                    <h2>준비 중입니다</h2>
                    <p><strong>${modeName}</strong> 기능은 곧 추가될 예정입니다!</p>
                    <button class="btn-primary" onclick="window.practice.showModeSelection(); window.practice.init();">
                        다른 모드 선택
                    </button>
                </div>
            </div>
        `;
        // 화면 상단으로 스크롤
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * 단어 없음 메시지 표시
     */
    showNoWordsMessage() {
        const container = document.querySelector('.practice-container');
        container.innerHTML = `
            <div class="no-words-container">
                <div class="no-words-content">
                    <div class="no-words-icon">📚</div>
                    <h2>연습할 단어가 없습니다</h2>
                    <p>먼저 단어장에 단어를 추가해주세요.</p>
                    <div class="no-words-actions">
                        <button class="btn-primary" onclick="window.practice.cleanupOtherScreens(); if(window.navigation) window.navigation.showScreen('vocabulary')">
                            단어장으로 가기
                        </button>
                        <button class="btn-secondary" onclick="window.practice.showModeSelection(); window.practice.init();">
                            모드 선택으로 돌아가기
                        </button>
                    </div>
                </div>
            </div>
        `;
        // 화면 상단으로 스크롤
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * 스와이프 뒤로가기 제스처 설정
     */
    setupSwipeBackGesture() {
        const practiceScreen = document.getElementById('practiceScreen');
        if (!practiceScreen) return;

        let startX = 0;
        let startY = 0;
        let startTime = 0;
        const threshold = 100; // 최소 스와이프 거리
        const maxTime = 500; // 최대 스와이프 시간 (ms) - 300에서 500으로 증가
        const maxVerticalDistance = 100; // 수직 이동 허용 범위

        // 터치 시작
        const handleTouchStart = (e) => {
            if (e.touches.length !== 1) return;

            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            startTime = Date.now();
            console.log('Touch start:', { startX, startY, startTime });
        };

        // 터치 끝
        const handleTouchEnd = (e) => {
            if (e.changedTouches.length !== 1) return;

            const touch = e.changedTouches[0];
            const endX = touch.clientX;
            const endY = touch.clientY;
            const endTime = Date.now();

            const deltaX = endX - startX;
            const deltaY = endY - startY;
            const deltaTime = endTime - startTime;

            // 디버깅 로그 추가
            console.log('Touch end:', {
                startX, startY, endX, endY,
                deltaX, deltaY, deltaTime,
                threshold, maxVerticalDistance, maxTime,
                conditions: {
                    deltaXCheck: deltaX > threshold,
                    deltaYCheck: Math.abs(deltaY) < maxVerticalDistance,
                    timeCheck: deltaTime < maxTime
                }
            });

            // 오른쪽으로 스와이프 (뒤로가기) - 조건 완화
            if (deltaX > threshold && Math.abs(deltaY) < maxVerticalDistance && deltaTime < maxTime) {
                // startX 조건 제거하여 어디서든 스와이프 가능

                console.log('Swipe back detected, going back to practice menu');
                if (e.cancelable) {
                    e.preventDefault();
                }
                this.goBackToPracticeMenu();
            }
        };

        // 마우스 이벤트 (데스크톱 테스트용)
        let mouseStartX = 0;
        let mouseStartY = 0;
        let mouseStartTime = 0;
        let isMouseDown = false;

        const handleMouseDown = (e) => {
            if (e.clientX > 50) return; // 화면 왼쪽 끝에서만

            isMouseDown = true;
            mouseStartX = e.clientX;
            mouseStartY = e.clientY;
            mouseStartTime = Date.now();
        };

        const handleMouseUp = (e) => {
            if (!isMouseDown) return;
            isMouseDown = false;

            const deltaX = e.clientX - mouseStartX;
            const deltaY = e.clientY - mouseStartY;
            const deltaTime = Date.now() - mouseStartTime;

            // 오른쪽으로 드래그 (뒤로가기)
            if (deltaX > threshold && Math.abs(deltaY) < maxVerticalDistance && deltaTime < maxTime * 2) {
                // 마우스는 시간을 더 여유롭게

                console.log('Mouse swipe back detected, going to home');
                this.goBackToHome();
            }
        };

        // 이벤트 리스너 추가
        practiceScreen.addEventListener('touchstart', handleTouchStart.bind(this), { passive: true });
        practiceScreen.addEventListener('touchend', handleTouchEnd.bind(this));

        // 데스크톱 테스트용 마우스 이벤트
        practiceScreen.addEventListener('mousedown', handleMouseDown.bind(this));
        practiceScreen.addEventListener('mouseup', handleMouseUp.bind(this));

        console.log('Swipe back gesture initialized for practice screen');
    }

    /**
     * 연습 메뉴로 돌아가기 (상황에 따라 홈 또는 연습 메뉴)
     */
    goBackToPracticeMenu() {
        console.log('goBackToPracticeMenu called', {
            currentMode: this.currentMode,
            questionsLength: this.currentQuestions?.length || 0
        });

        // 연습 중인 경우 - 연습 메뉴로 돌아가기
        if (this.currentMode && this.currentQuestions.length > 0) {
            console.log('Practice in progress, showing confirmation');
            if (confirm('연습을 중단하고 연습 메뉴로 돌아가시겠습니까?')) {
                console.log('User confirmed, navigating to practice menu');
                this.currentMode = null;
                this.currentQuestions = [];
                this.navigateToPracticeMenu();
            } else {
                console.log('User cancelled navigation');
            }
        } else {
            // 연습 메뉴(카테고리 선택) 화면에서는 홈으로 이동
            console.log('In practice menu, navigating to home');
            this.navigateToHome();
        }
    }

    /**
     * 연습 메뉴로 네비게이션
     */
    navigateToPracticeMenu() {
        console.log('navigateToPracticeMenu called');
        console.log('Current mode:', this.currentMode);
        console.log('Is in practice session:', !!(this.currentMode && this.currentQuestions.length > 0));

        // 연습 세션 상태 확인
        const practiceContainer = document.querySelector('.practice-container');
        console.log('Practice container exists:', !!practiceContainer);

        // 연습 세션만 리셋
        console.log('Resetting session...');
        this.resetSession();

        // 다른 화면 오염 방지
        console.log('Cleaning up other screens...');
        this.cleanupOtherScreens();

        // 연습 메뉴 화면 다시 로드 (원본 HTML 내용 복원)
        console.log('Reinitializing practice screen with menu...');
        this.loadPracticeMenu();
    }

    /**
     * 연습 메뉴 로드 (원본 HTML 복원)
     */
    async loadPracticeMenu() {
        const practiceScreen = document.getElementById('practiceScreen');
        if (!practiceScreen) {
            console.error('Practice screen not found');
            return;
        }

        try {
            // 템플릿 로더를 통해 원본 연습 메뉴 HTML 로드
            if (window.templateLoader) {
                const practiceHTML = await window.templateLoader.loadTemplate('pages/practice');
                practiceScreen.innerHTML = practiceHTML;
                console.log('Practice menu loaded successfully');

                // 이벤트 리스너만 다시 바인딩 (init 대신 setupEventListeners만 호출)
                this.setupEventListeners();
            } else {
                console.error('TemplateLoader not available');
            }
        } catch (error) {
            console.error('Error loading practice menu:', error);
        }
    }

    /**
     * 홈 화면으로 네비게이션
     */
    navigateToHome() {
        console.log('navigateToHome called');

        // 연습 세션 완전 초기화 (화면 내용도 초기화)
        this.resetSession();
        this.cleanupOtherScreens();

        // 연습 화면을 초기 상태로 복원
        this.resetPracticeScreen();

        if (window.navigation) {
            console.log('Calling navigation.showScreen("home")');
            window.navigation.showScreen('home');
        } else {
            console.error('Navigation not available');
        }
    }

    /**
     * 연습 화면을 초기 상태로 복원
     */
    async resetPracticeScreen() {
        const practiceScreen = document.getElementById('practiceScreen');
        if (!practiceScreen) {
            console.error('Practice screen not found');
            return;
        }

        try {
            // 템플릿 로더를 통해 원본 연습 메뉴 HTML 로드
            if (window.templateLoader) {
                const practiceHTML = await window.templateLoader.loadTemplate('pages/practice');
                practiceScreen.innerHTML = practiceHTML;
                console.log('Practice screen reset to initial state');

                // 이벤트 리스너 다시 바인딩
                this.setupEventListeners();
            } else {
                console.error('TemplateLoader not available');
            }
        } catch (error) {
            console.error('Error resetting practice screen:', error);
        }
    }

    /**
     * 연습 세션 리셋 (화면 내용 유지)
     */
    resetSession() {
        console.log('Resetting practice session...');

        // 현재 모드 및 진행상황만 리셋
        this.currentMode = null;
        this.currentQuestions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.stats = {
            correct: 0,
            incorrect: 0,
            streak: 0,
            bestStreak: 0,
        };
    }

    /**
     * 다른 화면 오염 정리 (연습 화면 제외)
     */
    cleanupOtherScreens() {
        console.log('Cleaning up practice content from other screens...');

        // 다른 화면에 있을 수 있는 practice-container만 정리
        const allPracticeContainers = document.querySelectorAll('.practice-container');
        allPracticeContainers.forEach((container) => {
            // 연습 화면이 아닌 곳에 있는 컨테이너만 정리
            if (!container.closest('#practiceScreen')) {
                container.innerHTML = '';
                console.log('Cleaned practice content from non-practice screen');
            }
        });
    }

    /**
     * 완전 정리 (모든 내용 제거) - 필요시에만 사용
     */
    cleanup() {
        console.log('Full cleanup of practice screen...');

        this.resetSession();

        // 연습 화면 컨테이너도 완전히 정리
        const practiceContainer = document.querySelector('#practiceScreen .practice-container');
        if (practiceContainer) {
            practiceContainer.innerHTML = '';
        }

        this.cleanupOtherScreens();
    }
}

// 전역 객체로 등록
window.Practice = Practice;

// 연습 화면이 활성화될 때만 초기화
function initPractice() {
    const practiceScreen = document.querySelector('#practiceScreen');
    const practiceContainer = document.querySelector('#practiceScreen .practice-container');

    if (practiceScreen && practiceScreen.classList.contains('active') && practiceContainer && !window.practice) {
        console.log('Initializing practice...');
        window.practice = new Practice();
        window.practice.init();
    }
}

// 연습 화면으로 전환될 때 호출되는 함수
window.initPracticeScreen = function () {
    console.log('Practice screen activated, initializing...');
    if (!window.practice) {
        window.practice = new Practice();
        window.practice.init();
    }
};

// 템플릿 로드 완료 후 초기화 (기존 로직은 제거)
window.addEventListener('templatesLoaded', () => {
    // Practice는 화면 전환시에만 초기화
});

// DOM 로드 후에도 시도 (fallback) - 더 이상 자동 초기화하지 않음
document.addEventListener('DOMContentLoaded', () => {
    // Practice는 화면 전환시에만 초기화
});
