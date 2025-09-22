/**
 * Sentence Completion - Noun Particle Learning App
 *
 * 특징:
 * - 문장 완성 방식으로 격조사 학습
 * - 실제 활용 상황에 초점
 * - 진도 추적 및 성취 시스템
 * - 단계별 난이도 조절
 */

class SentenceCompletionApp {
    constructor() {
        this.exerciseData = null;
        this.currentLevel = 'basic_particles_sentences'; // 기본, 중급, 고급
        this.currentExerciseIndex = 0;
        this.userProgress = {
            correctAnswers: 0,
            totalAnswers: 0,
            streak: 0,
            maxStreak: 0,
            completedLevels: [],
            score: 0
        };
        this.isAnswered = false;
        this.selectedAnswer = null;

        this.init();
    }

    async init() {
        try {
            console.log('Initializing Sentence Completion App...');

            // 연습 데이터 로드
            await this.loadExerciseData();

            // 이벤트 바인딩
            this.bindEvents();

            // UI 초기화
            this.initializeUI();

            console.log('Sentence Completion App initialized successfully');
        } catch (error) {
            console.error('Error initializing Sentence Completion App:', error);
        }
    }

    /**
     * 연습 데이터 로드
     */
    async loadExerciseData() {
        try {
            const response = await fetch('./data/vocabulary/jlpt/sentence_completion_exercises.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.exerciseData = await response.json();
            console.log('Exercise data loaded:', this.exerciseData);
        } catch (error) {
            console.error('Error loading exercise data:', error);
            this.setupDefaultExercises();
        }
    }

    /**
     * 기본 연습 문제 설정 (파일 로드 실패 시)
     */
    setupDefaultExercises() {
        this.exerciseData = [
            {
                id: "basic_particles_sentences",
                title: "기본 격조사 문장 완성",
                exercises: [
                    {
                        id: 1,
                        sentence: "私___学生です。",
                        sentenceReading: "わたし___がくせいです。",
                        translation: "나___학생입니다.",
                        correctParticle: "は",
                        explanation: "주제를 나타내는 は를 사용합니다.",
                        choices: ["は", "が", "을", "에"],
                        context: "자기소개",
                        difficulty: 1
                    }
                ]
            }
        ];
    }

    /**
     * UI 초기화
     */
    initializeUI() {
        this.createLevelSelector();
        this.createProgressBar();
        this.showCurrentExercise();
    }

    /**
     * 레벨 선택기 생성
     */
    createLevelSelector() {
        const levelSelector = document.getElementById('levelSelector');
        if (!levelSelector) {
            console.log('Level selector container not found');
            return;
        }

        const levels = this.exerciseData;

        levelSelector.innerHTML = `
            <div class="level-grid">
                ${levels.map(level => `
                    <button class="level-btn ${level.id === this.currentLevel ? 'active' : ''}"
                            data-level="${level.id}">
                        <div class="level-title">${level.title}</div>
                        <div class="level-difficulty">${level.difficulty}</div>
                        <div class="level-progress">
                            ${this.getLevelProgress(level.id)}/${level.exercises.length}
                        </div>
                    </button>
                `).join('')}
            </div>
        `;
    }

    /**
     * 진도 바 생성
     */
    createProgressBar() {
        const progressContainer = document.getElementById('progressContainer');
        if (!progressContainer) {
            console.log('Progress container not found');
            return;
        }

        const currentLevelData = this.getCurrentLevelData();
        const totalExercises = currentLevelData.exercises.length;
        const currentProgress = this.currentExerciseIndex + 1;

        progressContainer.innerHTML = `
            <div class="progress-header">
                <h2>${currentLevelData.title}</h2>
                <div class="progress-stats">
                    <span class="current-progress">${currentProgress}/${totalExercises}</span>
                    <span class="score">점수: ${this.userProgress.score}</span>
                    <span class="streak">연속: ${this.userProgress.streak}</span>
                </div>
            </div>

            <div class="progress-bar-container">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${(currentProgress / totalExercises) * 100}%"></div>
                </div>
            </div>
        `;
    }

    /**
     * 현재 연습 문제 표시
     */
    showCurrentExercise() {
        const exerciseContainer = document.getElementById('exerciseContainer');
        if (!exerciseContainer) {
            console.log('Exercise container not found');
            return;
        }

        const currentLevelData = this.getCurrentLevelData();
        const currentExercise = currentLevelData.exercises[this.currentExerciseIndex];

        if (!currentExercise) {
            this.showLevelComplete();
            return;
        }

        this.isAnswered = false;
        this.selectedAnswer = null;

        exerciseContainer.innerHTML = `
            <div class="exercise-card">
                <div class="exercise-header">
                    <div class="context-badge">${currentExercise.context}</div>
                    <div class="difficulty-stars">${'★'.repeat(currentExercise.difficulty)}</div>
                </div>

                <div class="sentence-display">
                    <div class="sentence-japanese">${this.formatSentenceWithBlank(currentExercise.sentence)}</div>
                    <div class="sentence-reading">${this.formatSentenceWithBlank(currentExercise.sentenceReading)}</div>
                    <div class="sentence-translation">${currentExercise.translation}</div>
                </div>

                <div class="choices-container">
                    <p class="instruction">올바른 격조사를 선택하세요:</p>
                    <div class="choices-grid">
                        ${currentExercise.choices.map((choice, index) => `
                            <button class="choice-btn" data-choice="${choice}" data-index="${index}">
                                <div class="choice-particle">${choice}</div>
                                <div class="choice-reading">${currentExercise.choicesReading ? currentExercise.choicesReading[index] : ''}</div>
                            </button>
                        `).join('')}
                    </div>
                </div>

                <div class="feedback-container" id="feedbackContainer" style="display: none;">
                    <!-- 피드백이 여기에 표시됩니다 -->
                </div>

                <div class="exercise-controls">
                    <button id="hintBtn" class="hint-btn">힌트</button>
                    <button id="nextBtn" class="next-btn" style="display: none;">다음 문제</button>
                </div>
            </div>
        `;

        this.bindExerciseEvents();
    }

    /**
     * 문장의 빈칸 포매팅
     */
    formatSentenceWithBlank(sentence) {
        return sentence.replace(/___/g, '<span class="blank-space">___</span>');
    }

    /**
     * 연습 문제 이벤트 바인딩
     */
    bindExerciseEvents() {
        // 선택지 클릭 이벤트
        const choiceBtns = document.querySelectorAll('.choice-btn');
        choiceBtns.forEach(btn => {
            btn.addEventListener('click', () => this.handleChoiceSelection(btn));
        });

        // 힌트 버튼
        const hintBtn = document.getElementById('hintBtn');
        if (hintBtn) {
            hintBtn.addEventListener('click', () => this.showHint());
        }

        // 다음 버튼
        const nextBtn = document.getElementById('nextBtn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextExercise());
        }
    }

    /**
     * 선택지 선택 처리
     */
    handleChoiceSelection(button) {
        if (this.isAnswered) return;

        const selectedChoice = button.dataset.choice;
        const currentLevelData = this.getCurrentLevelData();
        const currentExercise = currentLevelData.exercises[this.currentExerciseIndex];
        const isCorrect = selectedChoice === currentExercise.correctParticle;

        this.selectedAnswer = selectedChoice;
        this.isAnswered = true;

        // 모든 선택지 비활성화
        const allChoices = document.querySelectorAll('.choice-btn');
        allChoices.forEach(btn => btn.disabled = true);

        // 선택한 답안 표시
        button.classList.add(isCorrect ? 'correct' : 'incorrect');

        // 정답 표시 (틀렸을 경우)
        if (!isCorrect) {
            allChoices.forEach(btn => {
                if (btn.dataset.choice === currentExercise.correctParticle) {
                    btn.classList.add('correct');
                }
            });
        }

        // 피드백 표시
        this.showFeedback(isCorrect, currentExercise);

        // 진도 업데이트
        this.updateProgress(isCorrect);

        // 다음 버튼 표시
        document.getElementById('nextBtn').style.display = 'block';
    }

    /**
     * 피드백 표시
     */
    showFeedback(isCorrect, exercise) {
        const feedbackContainer = document.getElementById('feedbackContainer');

        const feedbackClass = isCorrect ? 'correct' : 'incorrect';
        const feedbackIcon = isCorrect ? '✓' : '✗';
        const feedbackTitle = isCorrect ? '정답입니다!' : '틀렸습니다.';

        feedbackContainer.innerHTML = `
            <div class="feedback ${feedbackClass}">
                <div class="feedback-header">
                    <span class="feedback-icon">${feedbackIcon}</span>
                    <span class="feedback-title">${feedbackTitle}</span>
                </div>

                <div class="feedback-content">
                    <div class="correct-answer">
                        정답: <strong>${exercise.correctParticle}</strong>
                        ${exercise.correctParticleReading ? `(${exercise.correctParticleReading})` : ''}
                    </div>

                    <div class="explanation">
                        <strong>설명:</strong> ${exercise.explanation}
                    </div>

                    <div class="complete-sentence">
                        <strong>완성된 문장:</strong><br>
                        ${exercise.sentence.replace('___', `<strong>${exercise.correctParticle}</strong>`)}<br>
                        <small>${exercise.translation.replace('___', exercise.correctParticle)}</small>
                    </div>
                </div>
            </div>
        `;

        feedbackContainer.style.display = 'block';

        // 성공 시 효과음이나 애니메이션 추가 가능
        if (isCorrect) {
            this.playSuccessAnimation();
        }
    }

    /**
     * 성공 애니메이션
     */
    playSuccessAnimation() {
        // 간단한 성공 효과
        const exerciseCard = document.querySelector('.exercise-card');
        if (exerciseCard) {
            exerciseCard.classList.add('success-pulse');
            setTimeout(() => {
                exerciseCard.classList.remove('success-pulse');
            }, 600);
        }
    }

    /**
     * 힌트 표시
     */
    showHint() {
        const currentLevelData = this.getCurrentLevelData();
        const currentExercise = currentLevelData.exercises[this.currentExerciseIndex];

        // 힌트를 토스트 메시지로 표시
        this.showToast(`💡 힌트: ${currentExercise.explanation}`);
    }

    /**
     * 진도 업데이트
     */
    updateProgress(isCorrect) {
        this.userProgress.totalAnswers++;

        if (isCorrect) {
            this.userProgress.correctAnswers++;
            this.userProgress.streak++;
            this.userProgress.score += 10 * this.userProgress.streak; // 연속 정답시 보너스

            if (this.userProgress.streak > this.userProgress.maxStreak) {
                this.userProgress.maxStreak = this.userProgress.streak;
            }
        } else {
            this.userProgress.streak = 0;
        }

        // 진도 바 업데이트
        this.createProgressBar();
    }

    /**
     * 다음 문제로 이동
     */
    nextExercise() {
        const currentLevelData = this.getCurrentLevelData();

        if (this.currentExerciseIndex < currentLevelData.exercises.length - 1) {
            this.currentExerciseIndex++;
            this.showCurrentExercise();
        } else {
            this.showLevelComplete();
        }
    }

    /**
     * 레벨 완료 화면
     */
    showLevelComplete() {
        const exerciseContainer = document.getElementById('exerciseContainer');
        const currentLevelData = this.getCurrentLevelData();

        const accuracy = Math.round((this.userProgress.correctAnswers / this.userProgress.totalAnswers) * 100);

        exerciseContainer.innerHTML = `
            <div class="level-complete">
                <div class="complete-header">
                    <h2>🎉 레벨 완료!</h2>
                    <p>${currentLevelData.title}</p>
                </div>

                <div class="complete-stats">
                    <div class="stat-item">
                        <div class="stat-number">${accuracy}%</div>
                        <div class="stat-label">정답률</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">${this.userProgress.maxStreak}</div>
                        <div class="stat-label">최대 연속</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">${this.userProgress.score}</div>
                        <div class="stat-label">총 점수</div>
                    </div>
                </div>

                <div class="complete-actions">
                    <button id="retryLevel" class="retry-btn">다시 도전</button>
                    <button id="nextLevel" class="next-level-btn">다음 레벨</button>
                    <button id="backToLevels" class="back-btn">레벨 선택</button>
                </div>
            </div>
        `;

        // 완료 이벤트 바인딩
        this.bindCompleteEvents();

        // 레벨 완료 기록
        if (!this.userProgress.completedLevels.includes(this.currentLevel)) {
            this.userProgress.completedLevels.push(this.currentLevel);
        }
    }

    /**
     * 완료 화면 이벤트 바인딩
     */
    bindCompleteEvents() {
        const retryBtn = document.getElementById('retryLevel');
        const nextBtn = document.getElementById('nextLevel');
        const backBtn = document.getElementById('backToLevels');

        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.retryLevel());
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextLevel());
        }

        if (backBtn) {
            backBtn.addEventListener('click', () => this.showLevelSelection());
        }
    }

    /**
     * 레벨 재시도
     */
    retryLevel() {
        this.currentExerciseIndex = 0;
        this.resetProgress();
        this.showCurrentExercise();
    }

    /**
     * 다음 레벨
     */
    nextLevel() {
        const currentIndex = this.exerciseData.findIndex(level => level.id === this.currentLevel);
        const nextIndex = currentIndex + 1;

        if (nextIndex < this.exerciseData.length) {
            this.currentLevel = this.exerciseData[nextIndex].id;
            this.currentExerciseIndex = 0;
            this.resetProgress();
            this.initializeUI();
        } else {
            this.showAllComplete();
        }
    }

    /**
     * 모든 레벨 완료
     */
    showAllComplete() {
        const exerciseContainer = document.getElementById('exerciseContainer');

        exerciseContainer.innerHTML = `
            <div class="all-complete">
                <h1>🏆 축하합니다!</h1>
                <p>모든 레벨을 완료했습니다!</p>
                <div class="final-stats">
                    <p>총 점수: ${this.userProgress.score}</p>
                    <p>최고 연속: ${this.userProgress.maxStreak}</p>
                </div>
                <button id="startOver" class="primary-btn">처음부터 다시</button>
            </div>
        `;

        document.getElementById('startOver').addEventListener('click', () => {
            this.resetAllProgress();
            this.showLevelSelection();
        });
    }

    /**
     * 진도 리셋
     */
    resetProgress() {
        this.userProgress.correctAnswers = 0;
        this.userProgress.totalAnswers = 0;
        this.userProgress.streak = 0;
        this.userProgress.score = 0;
    }

    /**
     * 전체 진도 리셋
     */
    resetAllProgress() {
        this.resetProgress();
        this.userProgress.maxStreak = 0;
        this.userProgress.completedLevels = [];
        this.currentLevel = this.exerciseData[0].id;
        this.currentExerciseIndex = 0;
    }

    /**
     * 레벨 선택 화면
     */
    showLevelSelection() {
        this.createLevelSelector();
        document.getElementById('exerciseContainer').innerHTML = '';
        document.getElementById('progressContainer').innerHTML = '';
    }

    /**
     * 이벤트 바인딩
     */
    bindEvents() {
        // 레벨 선택 이벤트
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('level-btn') || e.target.closest('.level-btn')) {
                const btn = e.target.classList.contains('level-btn') ? e.target : e.target.closest('.level-btn');
                const levelId = btn.dataset.level;
                this.selectLevel(levelId);
            }
        });
    }

    /**
     * 레벨 선택
     */
    selectLevel(levelId) {
        this.currentLevel = levelId;
        this.currentExerciseIndex = 0;
        this.resetProgress();
        this.initializeUI();
    }

    /**
     * 현재 레벨 데이터 가져오기
     */
    getCurrentLevelData() {
        return this.exerciseData.find(level => level.id === this.currentLevel);
    }

    /**
     * 레벨 진도 가져오기
     */
    getLevelProgress(levelId) {
        if (this.userProgress.completedLevels.includes(levelId)) {
            const levelData = this.exerciseData.find(level => level.id === levelId);
            return levelData ? levelData.exercises.length : 0;
        }
        return levelId === this.currentLevel ? this.currentExerciseIndex : 0;
    }

    /**
     * 토스트 메시지 표시
     */
    showToast(message) {
        // 기존 토스트 제거
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        // 새 토스트 생성
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 20px;
            border-radius: 25px;
            z-index: 1000;
            backdrop-filter: blur(10px);
            animation: fadeInOut 3s ease-in-out;
            font-size: 0.9rem;
            max-width: 80%;
            text-align: center;
        `;

        document.body.appendChild(toast);

        // 3초 후 자동 제거
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 3000);
    }
}

// 문장 완성 앱 초기화
let sentenceCompletionApp;
document.addEventListener('DOMContentLoaded', () => {
    sentenceCompletionApp = new SentenceCompletionApp();
});