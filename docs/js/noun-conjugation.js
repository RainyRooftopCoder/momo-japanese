/**
 * Noun Conjugation Learning App
 *
 * 특징:
 * - 명사와 격조사 조합 학습
 * - 실시간 문장 생성 및 연습
 * - 격조사별 기능 설명
 * - 진도 추적 및 통계
 */

class NounConjugationApp {
    constructor() {
        this.dbManager = null; // 기존 DB 매니저 사용
        this.conjugationPatterns = null;
        this.currentPattern = null;
        this.currentParticle = null;
        this.currentExampleIndex = 0;
        this.selectedNouns = [];
        this.practiceMode = 'explanation'; // 'explanation', 'practice', 'quiz'
        this.userProgress = {};

        this.init();
    }

    async init() {
        try {
            console.log('Initializing Noun Conjugation App...');

            // 격조사 패턴 데이터 로드
            await this.loadConjugationPatterns();

            // 이벤트 바인딩
            this.bindEvents();

            // UI 초기화
            this.initializeUI();

            console.log('Noun Conjugation App initialized successfully');
        } catch (error) {
            console.error('Error initializing Noun Conjugation App:', error);
        }
    }

    /**
     * 격조사 패턴 데이터 로드
     */
    async loadConjugationPatterns() {
        try {
            const response = await fetch('./json/noun_conjugation_patterns.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.conjugationPatterns = data[0]; // 기본 격조사 패턴

            console.log('Conjugation patterns loaded:', this.conjugationPatterns);
        } catch (error) {
            console.error('Error loading conjugation patterns:', error);
            // 기본 패턴 설정
            this.setupDefaultPatterns();
        }
    }

    /**
     * 기본 패턴 설정 (파일 로드 실패 시)
     */
    setupDefaultPatterns() {
        this.conjugationPatterns = {
            id: "basic_particles",
            name: "기본 격조사",
            particles: [
                {
                    particle: "は",
                    reading: "wa",
                    function: "주격(주제)",
                    description: "문장의 주제를 나타낸다",
                    examples: [
                        {
                            noun: "私",
                            reading: "わたし",
                            meaning: "나",
                            sentence: "私は学生です。",
                            sentenceReading: "わたしはがくせいです。",
                            translation: "나는 학생입니다."
                        }
                    ]
                },
                {
                    particle: "を",
                    reading: "o",
                    function: "목적격",
                    description: "동작의 대상을 나타낸다",
                    examples: [
                        {
                            noun: "本",
                            reading: "ほん",
                            meaning: "책",
                            sentence: "本を読みます。",
                            sentenceReading: "ほんをよみます。",
                            translation: "책을 읽습니다."
                        }
                    ]
                }
            ]
        };
    }

    /**
     * UI 초기화
     */
    initializeUI() {
        this.createParticleSelector();
        this.showParticleExplanation();
    }

    /**
     * 격조사 선택기 생성
     */
    createParticleSelector() {
        const selectorContainer = document.getElementById('particleSelector');
        if (!selectorContainer) {
            console.log('Particle selector container not found');
            return;
        }

        const particles = this.conjugationPatterns.particles;

        selectorContainer.innerHTML = `
            <div class="particle-grid">
                ${particles.map(particle => `
                    <button class="particle-btn" data-particle="${particle.particle}">
                        <div class="particle-main">${particle.particle}</div>
                        <div class="particle-reading">${particle.reading}</div>
                        <div class="particle-function">${particle.function}</div>
                    </button>
                `).join('')}
            </div>
        `;
    }

    /**
     * 격조사 설명 표시
     */
    showParticleExplanation(particleData = null) {
        const explanationContainer = document.getElementById('particleExplanation');
        if (!explanationContainer) {
            console.log('Explanation container not found');
            return;
        }

        if (!particleData) {
            // 첫 번째 격조사를 기본으로 표시
            particleData = this.conjugationPatterns.particles[0];
        }

        this.currentParticle = particleData;
        this.currentExampleIndex = 0;

        explanationContainer.innerHTML = `
            <div class="explanation-header">
                <h2>격조사 "${particleData.particle}" (${particleData.reading})</h2>
                <div class="function-badge">${particleData.function}</div>
            </div>

            <div class="description">
                <p>${particleData.description}</p>
            </div>

            <div class="examples-container">
                <h3>예문 (${this.currentExampleIndex + 1}/${particleData.examples.length})</h3>
                <div class="example-display" id="exampleDisplay">
                    ${this.renderExample(particleData.examples[this.currentExampleIndex])}
                </div>

                <div class="example-navigation">
                    <button id="prevExample" ${this.currentExampleIndex === 0 ? 'disabled' : ''}>이전 예문</button>
                    <button id="nextExample" ${this.currentExampleIndex === particleData.examples.length - 1 ? 'disabled' : ''}>다음 예문</button>
                </div>
            </div>

            <div class="practice-controls">
                <button id="startPractice" class="primary-btn">연습 시작</button>
                <button id="startQuiz" class="secondary-btn">퀴즈 시작</button>
            </div>
        `;

        this.bindExplanationEvents();
    }

    /**
     * 예문 렌더링
     */
    renderExample(example) {
        return `
            <div class="example-card">
                <div class="noun-info">
                    <div class="noun-display">
                        <span class="noun-kanji">${example.noun}</span>
                        <span class="noun-reading">${example.reading}</span>
                    </div>
                    <div class="noun-meaning">${example.meaning}</div>
                </div>

                <div class="sentence-info">
                    <div class="sentence-japanese">${example.sentence}</div>
                    <div class="sentence-reading">${example.sentenceReading}</div>
                    <div class="sentence-translation">${example.translation}</div>
                </div>

                <div class="particle-highlight">
                    <span>격조사: </span>
                    <span class="particle-emphasis">${this.currentParticle.particle}</span>
                    <span> (${this.currentParticle.reading})</span>
                </div>
            </div>
        `;
    }

    /**
     * 설명 화면 이벤트 바인딩
     */
    bindExplanationEvents() {
        // 예문 네비게이션
        const prevBtn = document.getElementById('prevExample');
        const nextBtn = document.getElementById('nextExample');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.showPreviousExample());
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.showNextExample());
        }

        // 연습 시작
        const startPracticeBtn = document.getElementById('startPractice');
        if (startPracticeBtn) {
            startPracticeBtn.addEventListener('click', () => this.startPractice());
        }

        // 퀴즈 시작
        const startQuizBtn = document.getElementById('startQuiz');
        if (startQuizBtn) {
            startQuizBtn.addEventListener('click', () => this.startQuiz());
        }
    }

    /**
     * 이전 예문 표시
     */
    showPreviousExample() {
        if (this.currentExampleIndex > 0) {
            this.currentExampleIndex--;
            this.updateExampleDisplay();
        }
    }

    /**
     * 다음 예문 표시
     */
    showNextExample() {
        if (this.currentExampleIndex < this.currentParticle.examples.length - 1) {
            this.currentExampleIndex++;
            this.updateExampleDisplay();
        }
    }

    /**
     * 예문 표시 업데이트
     */
    updateExampleDisplay() {
        const exampleDisplay = document.getElementById('exampleDisplay');
        const example = this.currentParticle.examples[this.currentExampleIndex];

        if (exampleDisplay) {
            exampleDisplay.innerHTML = this.renderExample(example);
        }

        // 네비게이션 버튼 상태 업데이트
        const prevBtn = document.getElementById('prevExample');
        const nextBtn = document.getElementById('nextExample');

        if (prevBtn) {
            prevBtn.disabled = this.currentExampleIndex === 0;
        }

        if (nextBtn) {
            nextBtn.disabled = this.currentExampleIndex === this.currentParticle.examples.length - 1;
        }

        // 카운터 업데이트
        const counter = document.querySelector('.examples-container h3');
        if (counter) {
            counter.textContent = `예문 (${this.currentExampleIndex + 1}/${this.currentParticle.examples.length})`;
        }
    }

    /**
     * 연습 모드 시작
     */
    startPractice() {
        this.practiceMode = 'practice';
        this.showPracticeMode();
    }

    /**
     * 퀴즈 모드 시작
     */
    startQuiz() {
        this.practiceMode = 'quiz';
        this.showQuizMode();
    }

    /**
     * 연습 모드 화면 표시
     */
    showPracticeMode() {
        const practiceContainer = document.getElementById('practiceContainer');
        if (!practiceContainer) {
            console.log('Practice container not found');
            return;
        }

        const examples = this.currentParticle.examples;

        practiceContainer.innerHTML = `
            <div class="practice-header">
                <h2>연습: ${this.currentParticle.particle} (${this.currentParticle.reading})</h2>
                <button id="backToExplanation" class="back-btn">← 설명으로 돌아가기</button>
            </div>

            <div class="practice-content">
                <p class="practice-instruction">
                    다음 문장에서 올바른 격조사를 선택하세요:
                </p>

                <div class="practice-questions">
                    ${examples.map((example, index) => `
                        <div class="practice-question" data-index="${index}">
                            <div class="question-sentence">
                                ${this.createPracticeQuestion(example)}
                            </div>
                            <div class="question-options">
                                ${this.createParticleOptions(example)}
                            </div>
                            <div class="question-feedback" id="feedback-${index}"></div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        this.bindPracticeEvents();
    }

    /**
     * 연습 문제 생성
     */
    createPracticeQuestion(example) {
        // 격조사를 빈칸으로 만든 문장 생성
        const sentence = example.sentence;
        const particle = this.currentParticle.particle;
        const questionSentence = sentence.replace(particle, '___');

        return `
            <div class="question-text">${questionSentence}</div>
            <div class="question-reading">${example.sentenceReading}</div>
            <div class="question-translation">"${example.translation}"</div>
        `;
    }

    /**
     * 격조사 선택지 생성
     */
    createParticleOptions(example) {
        const correctParticle = this.currentParticle.particle;
        const allParticles = this.conjugationPatterns.particles.map(p => p.particle);

        // 정답 + 2개의 오답 선택지
        const wrongParticles = allParticles.filter(p => p !== correctParticle).slice(0, 2);
        const options = [correctParticle, ...wrongParticles].sort(() => Math.random() - 0.5);

        return options.map(particle => `
            <button class="option-btn" data-particle="${particle}">
                ${particle}
            </button>
        `).join('');
    }

    /**
     * 퀴즈 모드 화면 표시
     */
    showQuizMode() {
        const quizContainer = document.getElementById('quizContainer');
        if (!quizContainer) {
            console.log('Quiz container not found');
            return;
        }

        // 모든 격조사에서 랜덤 문제 생성
        const allExamples = this.conjugationPatterns.particles.flatMap(particle =>
            particle.examples.map(example => ({...example, correctParticle: particle.particle}))
        );

        const shuffledExamples = allExamples.sort(() => Math.random() - 0.5).slice(0, 5);

        quizContainer.innerHTML = `
            <div class="quiz-header">
                <h2>격조사 퀴즈</h2>
                <button id="backToExplanation" class="back-btn">← 설명으로 돌아가기</button>
            </div>

            <div class="quiz-content">
                <div class="quiz-progress">
                    <span id="currentQuestion">1</span> / ${shuffledExamples.length}
                </div>

                <div class="quiz-question" id="quizQuestion">
                    ${this.renderQuizQuestion(shuffledExamples[0], 0)}
                </div>

                <div class="quiz-navigation">
                    <button id="prevQuizQuestion" disabled>이전</button>
                    <button id="nextQuizQuestion">다음</button>
                </div>

                <div class="quiz-score">
                    점수: <span id="currentScore">0</span> / ${shuffledExamples.length}
                </div>
            </div>
        `;

        this.quizData = {
            questions: shuffledExamples,
            currentIndex: 0,
            score: 0,
            answers: new Array(shuffledExamples.length).fill(null)
        };

        this.bindQuizEvents();
    }

    /**
     * 퀴즈 문제 렌더링
     */
    renderQuizQuestion(example, index) {
        const allParticles = this.conjugationPatterns.particles.map(p => p.particle);
        const correctParticle = example.correctParticle;
        const wrongParticles = allParticles.filter(p => p !== correctParticle).slice(0, 3);
        const options = [correctParticle, ...wrongParticles].sort(() => Math.random() - 0.5);

        const questionSentence = example.sentence.replace(correctParticle, '___');

        return `
            <div class="quiz-question-content">
                <div class="question-sentence">${questionSentence}</div>
                <div class="question-translation">"${example.translation}"</div>

                <div class="quiz-options">
                    ${options.map(particle => `
                        <button class="quiz-option-btn" data-particle="${particle}" data-question="${index}">
                            ${particle}
                        </button>
                    `).join('')}
                </div>

                <div class="quiz-feedback" id="quizFeedback-${index}"></div>
            </div>
        `;
    }

    /**
     * 이벤트 바인딩
     */
    bindEvents() {
        // 격조사 선택 이벤트
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('particle-btn')) {
                const particle = e.target.dataset.particle;
                this.selectParticle(particle);
            }
        });
    }

    /**
     * 연습 모드 이벤트 바인딩
     */
    bindPracticeEvents() {
        // 뒤로가기 버튼
        const backBtn = document.getElementById('backToExplanation');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                document.getElementById('practiceContainer').style.display = 'none';
                document.getElementById('particleExplanation').style.display = 'block';
            });
        }

        // 선택지 클릭 이벤트
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('option-btn')) {
                this.handlePracticeAnswer(e.target);
            }
        });
    }

    /**
     * 퀴즈 모드 이벤트 바인딩
     */
    bindQuizEvents() {
        // 뒤로가기 버튼
        const backBtn = document.getElementById('backToExplanation');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                document.getElementById('quizContainer').style.display = 'none';
                document.getElementById('particleExplanation').style.display = 'block';
            });
        }

        // 퀴즈 네비게이션
        const prevBtn = document.getElementById('prevQuizQuestion');
        const nextBtn = document.getElementById('nextQuizQuestion');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.showPrevQuizQuestion());
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.showNextQuizQuestion());
        }

        // 퀴즈 답변 클릭 이벤트
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('quiz-option-btn')) {
                this.handleQuizAnswer(e.target);
            }
        });
    }

    /**
     * 격조사 선택 처리
     */
    selectParticle(particleName) {
        const particleData = this.conjugationPatterns.particles.find(p => p.particle === particleName);
        if (particleData) {
            this.showParticleExplanation(particleData);

            // 버튼 활성화 상태 업데이트
            document.querySelectorAll('.particle-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector(`[data-particle="${particleName}"]`).classList.add('active');
        }
    }

    /**
     * 연습 답변 처리
     */
    handlePracticeAnswer(button) {
        const selectedParticle = button.dataset.particle;
        const correctParticle = this.currentParticle.particle;
        const questionIndex = button.closest('.practice-question').dataset.index;
        const feedbackEl = document.getElementById(`feedback-${questionIndex}`);

        // 모든 선택지 비활성화
        const allOptions = button.closest('.question-options').querySelectorAll('.option-btn');
        allOptions.forEach(btn => btn.disabled = true);

        if (selectedParticle === correctParticle) {
            button.classList.add('correct');
            feedbackEl.innerHTML = '<span class="correct">정답입니다! ✓</span>';
        } else {
            button.classList.add('incorrect');
            feedbackEl.innerHTML = `<span class="incorrect">틀렸습니다. 정답은 "${correctParticle}"입니다.</span>`;

            // 정답 표시
            allOptions.forEach(btn => {
                if (btn.dataset.particle === correctParticle) {
                    btn.classList.add('correct');
                }
            });
        }
    }

    /**
     * 퀴즈 답변 처리
     */
    handleQuizAnswer(button) {
        const selectedParticle = button.dataset.particle;
        const questionIndex = parseInt(button.dataset.question);
        const correctParticle = this.quizData.questions[questionIndex].correctParticle;
        const feedbackEl = document.getElementById(`quizFeedback-${questionIndex}`);

        // 답변 저장
        this.quizData.answers[questionIndex] = selectedParticle;

        // 모든 선택지 비활성화
        const allOptions = button.closest('.quiz-options').querySelectorAll('.quiz-option-btn');
        allOptions.forEach(btn => btn.disabled = true);

        if (selectedParticle === correctParticle) {
            button.classList.add('correct');
            feedbackEl.innerHTML = '<span class="correct">정답입니다! ✓</span>';
            if (this.quizData.answers[questionIndex] === correctParticle) {
                this.quizData.score++;
            }
        } else {
            button.classList.add('incorrect');
            feedbackEl.innerHTML = `<span class="incorrect">틀렸습니다. 정답은 "${correctParticle}"입니다.</span>`;

            // 정답 표시
            allOptions.forEach(btn => {
                if (btn.dataset.particle === correctParticle) {
                    btn.classList.add('correct');
                }
            });
        }

        // 점수 업데이트
        document.getElementById('currentScore').textContent = this.quizData.score;
    }

    /**
     * 이전 퀴즈 문제
     */
    showPrevQuizQuestion() {
        if (this.quizData.currentIndex > 0) {
            this.quizData.currentIndex--;
            this.updateQuizDisplay();
        }
    }

    /**
     * 다음 퀴즈 문제
     */
    showNextQuizQuestion() {
        if (this.quizData.currentIndex < this.quizData.questions.length - 1) {
            this.quizData.currentIndex++;
            this.updateQuizDisplay();
        }
    }

    /**
     * 퀴즈 화면 업데이트
     */
    updateQuizDisplay() {
        const currentIndex = this.quizData.currentIndex;
        const question = this.quizData.questions[currentIndex];

        document.getElementById('quizQuestion').innerHTML = this.renderQuizQuestion(question, currentIndex);
        document.getElementById('currentQuestion').textContent = currentIndex + 1;

        // 네비게이션 버튼 상태
        document.getElementById('prevQuizQuestion').disabled = currentIndex === 0;
        document.getElementById('nextQuizQuestion').disabled = currentIndex === this.quizData.questions.length - 1;
    }
}

// 명사 활용 앱 초기화
let nounConjugationApp;
document.addEventListener('DOMContentLoaded', () => {
    nounConjugationApp = new NounConjugationApp();
});