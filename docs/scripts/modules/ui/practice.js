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
            bestStreak: 0
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

            const groups = await this.dbManager.getAllGroups();
            this.vocabularyGroups = groups || [];
            console.log('Loaded vocabulary groups:', this.vocabularyGroups.length);
        } catch (error) {
            console.error('Error loading vocabulary data:', error);
            this.vocabularyGroups = this.getDemoVocabulary();
        }
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
                    { word: '学生', reading: 'がくせい', meaning: '학생', level: 'easy' }
                ]
            },
            {
                id: 2,
                name: '음식 관련',
                words: [
                    { word: '食べ物', reading: 'たべもの', meaning: '음식', level: 'medium' },
                    { word: 'レストラン', reading: 'レストラン', meaning: '레스토랑', level: 'medium' },
                    { word: '美味しい', reading: 'おいしい', meaning: '맛있다', level: 'medium' },
                    { word: '料理', reading: 'りょうり', meaning: '요리', level: 'medium' }
                ]
            }
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
            bestStreak: 0
        };

        // 모드별 문제 생성
        switch (mode) {
            case 'word-quiz-easy':
                this.currentQuestions = this.generateWordQuiz('easy', 10);
                break;
            case 'word-quiz-medium':
                this.currentQuestions = this.generateWordQuiz('medium', 15);
                break;
            case 'word-quiz-hard':
                this.currentQuestions = this.generateWordQuiz('hard', 20);
                break;
            case 'speed-meaning':
                this.currentQuestions = this.generateSpeedQuiz(20);
                break;
            case 'sentence-completion-grammar':
                this.showComingSoon('문법 완성 연습');
                return;
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
    }

    /**
     * 단어 퀴즈 문제 생성
     */
    generateWordQuiz(difficulty, count) {
        const allWords = [];

        // 모든 단어장의 단어 수집
        this.vocabularyGroups.forEach(group => {
            if (group.words) {
                group.words.forEach(word => {
                    if (!difficulty || word.level === difficulty ||
                        (difficulty === 'easy' && !word.level)) {
                        allWords.push(word);
                    }
                });
            }
        });

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
            } while (usedWords.has(randomWord.word) && attempts < 50);

            if (!usedWords.has(randomWord.word)) {
                usedWords.add(randomWord.word);

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
        const options = [correctWord.meaning];
        const usedMeanings = new Set([correctWord.meaning]);

        // 다른 뜻 3개 추가
        while (options.length < 4) {
            const randomWord = allWords[Math.floor(Math.random() * allWords.length)];
            if (!usedMeanings.has(randomWord.meaning)) {
                options.push(randomWord.meaning);
                usedMeanings.add(randomWord.meaning);
            }
        }

        // 옵션 섞기
        for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
        }

        return {
            word: correctWord.word,
            reading: correctWord.reading,
            correctAnswer: correctWord.meaning,
            options: options,
            type: 'multiple-choice'
        };
    }

    /**
     * 속도 퀴즈 문제 생성
     */
    generateSpeedQuiz(count) {
        return this.generateWordQuiz('easy', count);
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

        container.innerHTML = `
            <div class="question-container">
                <div class="question-header">
                    <div class="progress-info">
                        <span class="question-number">${this.currentQuestionIndex + 1} / ${this.totalQuestions}</span>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(this.currentQuestionIndex / this.totalQuestions) * 100}%"></div>
                        </div>
                        <span class="score">점수: ${this.score}</span>
                    </div>
                    <button class="end-practice-btn" title="연습 종료">×</button>
                </div>

                <div class="question-content">
                    <div class="word-display">
                        <div class="word-text">${question.word}</div>
                        ${question.reading !== question.word ? `<div class="word-reading">${question.reading}</div>` : ''}
                        <button class="play-sound-btn" title="발음 듣기">🔊</button>
                    </div>

                    <div class="question-text">이 단어의 뜻은 무엇일까요?</div>

                    <div class="answers-grid">
                        ${question.options.map((option, index) => `
                            <button class="answer-btn" data-answer="${option}">
                                <span class="option-number">${index + 1}</span>
                                <span class="option-text">${option}</span>
                            </button>
                        `).join('')}
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
     * 답변 처리
     */
    handleAnswer(answerBtn) {
        if (answerBtn.classList.contains('disabled')) return;

        const selectedAnswer = answerBtn.dataset.answer;
        const question = this.currentQuestions[this.currentQuestionIndex];
        const isCorrect = selectedAnswer === question.correctAnswer;

        // 모든 답변 버튼 비활성화
        const answerBtns = document.querySelectorAll('.answer-btn');
        answerBtns.forEach(btn => {
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
        const resultHtml = `
            <div class="result-display ${isCorrect ? 'correct' : 'incorrect'}">
                <div class="result-icon">${isCorrect ? '✅' : '❌'}</div>
                <div class="result-message">
                    ${isCorrect ? '정답입니다!' : '틀렸습니다'}
                </div>
                <div class="word-explanation">
                    <div class="word-info">
                        <span class="word">${question.word}</span>
                        <span class="reading">${question.reading}</span>
                    </div>
                    <div class="meaning">${question.correctAnswer}</div>
                </div>
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
                    <button class="btn-primary" onclick="window.practice.restartPractice()">
                        다시 연습하기
                    </button>
                    <button class="btn-secondary" onclick="window.practice.showModeSelection(); window.practice.init();">
                        다른 모드 선택
                    </button>
                    <button class="btn-tertiary" onclick="window.practice.navigateToPracticeMenu()">
                        연습 메뉴로
                    </button>
                    <button class="btn-tertiary" onclick="window.practice.navigateToHome()">
                        홈으로 돌아가기
                    </button>
                </div>
            </div>
        `;

        // 홈 대시보드 통계 업데이트
        this.updateDashboardStats();
        this.currentMode = null;
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
                score: this.score
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
                    modesPlayed: new Set()
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
                    modesPlayed: Array.from(dayStats.modesPlayed)
                }
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

            const recentSessions = practiceHistory.filter(session =>
                new Date(session.timestamp) >= cutoffDate
            );

            const stats = {
                totalSessions: recentSessions.length,
                totalQuestions: recentSessions.reduce((sum, s) => sum + s.totalQuestions, 0),
                totalCorrect: recentSessions.reduce((sum, s) => sum + s.correctAnswers, 0),
                totalTimeSpent: recentSessions.reduce((sum, s) => sum + s.timeSpent, 0),
                averageAccuracy: 0,
                bestStreak: Math.max(...recentSessions.map(s => s.bestStreak), 0),
                favoriteMode: this.getMostPlayedMode(recentSessions)
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
                favoriteMode: null
            };
        }
    }

    /**
     * 가장 많이 플레이한 모드 조회
     */
    getMostPlayedMode(sessions) {
        const modeCount = {};
        sessions.forEach(session => {
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
        const maxTime = 300; // 최대 스와이프 시간 (ms)
        const maxVerticalDistance = 100; // 수직 이동 허용 범위

        // 터치 시작
        const handleTouchStart = (e) => {
            if (e.touches.length !== 1) return;

            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            startTime = Date.now();
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

            // 오른쪽으로 스와이프 (뒤로가기) - 조건 완화
            if (deltaX > threshold &&
                Math.abs(deltaY) < maxVerticalDistance &&
                deltaTime < maxTime) { // startX 조건 제거하여 어디서든 스와이프 가능

                console.log('Swipe back detected, going back to practice menu');
                e.preventDefault();
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
            if (deltaX > threshold &&
                Math.abs(deltaY) < maxVerticalDistance &&
                deltaTime < maxTime * 2) { // 마우스는 시간을 더 여유롭게

                console.log('Mouse swipe back detected, going to home');
                this.goBackToHome();
            }
        };

        // 이벤트 리스너 추가
        practiceScreen.addEventListener('touchstart', handleTouchStart.bind(this), { passive: true });
        practiceScreen.addEventListener('touchend', handleTouchEnd.bind(this), { passive: true });

        // 데스크톱 테스트용 마우스 이벤트
        practiceScreen.addEventListener('mousedown', handleMouseDown.bind(this));
        practiceScreen.addEventListener('mouseup', handleMouseUp.bind(this));

        console.log('Swipe back gesture initialized for practice screen');
    }

    /**
     * 연습 메뉴로 돌아가기
     */
    goBackToPracticeMenu() {
        // 연습 중인 경우 확인
        if (this.currentMode && this.currentQuestions.length > 0) {
            if (confirm('연습을 중단하고 연습 메뉴로 돌아가시겠습니까?')) {
                this.currentMode = null;
                this.currentQuestions = [];
                this.navigateToPracticeMenu();
            }
        } else {
            this.navigateToPracticeMenu();
        }
    }

    /**
     * 연습 메뉴로 네비게이션
     */
    navigateToPracticeMenu() {
        // 연습 세션만 리셋 (화면 내용은 유지)
        this.resetSession();
        // 다른 화면 오염 방지
        this.cleanupOtherScreens();

        // 연습 메뉴 화면 다시 로드
        this.init();

        if (window.navigation) {
            window.navigation.showScreen('practice');
        } else {
            console.error('Navigation not available');
        }
    }

    /**
     * 홈 화면으로 네비게이션
     */
    navigateToHome() {
        // 연습 세션만 리셋 (화면 내용은 유지)
        this.resetSession();
        // 다른 화면 오염 방지
        this.cleanupOtherScreens();

        if (window.navigation) {
            window.navigation.showScreen('home');
        } else {
            console.error('Navigation not available');
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
            bestStreak: 0
        };
    }

    /**
     * 다른 화면 오염 정리 (연습 화면 제외)
     */
    cleanupOtherScreens() {
        console.log('Cleaning up practice content from other screens...');

        // 다른 화면에 있을 수 있는 practice-container만 정리
        const allPracticeContainers = document.querySelectorAll('.practice-container');
        allPracticeContainers.forEach(container => {
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

    if (practiceScreen && practiceScreen.classList.contains('active') &&
        practiceContainer && !window.practice) {
        console.log('Initializing practice...');
        window.practice = new Practice();
        window.practice.init();
    }
}

// 연습 화면으로 전환될 때 호출되는 함수
window.initPracticeScreen = function() {
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