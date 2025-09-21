/**
 * Noun Forms Learning App - 평서체/경어체 명사 활용
 *
 * 특징:
 * - 명사의 평서체/경어체 변화 학습
 * - 간단하고 직관적인 인터페이스
 * - 상황별 사용법 설명
 */

class NounFormsApp {
    constructor() {
        this.formsData = null;
        this.currentNounIndex = 0;
        this.selectedForm = '현재 긍정'; // 기본 선택 형태

        this.init();
    }

    async init() {
        try {
            console.log('Initializing Noun Forms App...');

            // 데이터 로드
            await this.loadFormsData();

            // 이벤트 바인딩
            this.bindEvents();

            // UI 초기화
            this.initializeUI();

            console.log('Noun Forms App initialized successfully');
        } catch (error) {
            console.error('Error initializing Noun Forms App:', error);
        }
    }

    /**
     * 명사 활용 데이터 로드
     */
    async loadFormsData() {
        try {
            const response = await fetch('./json/noun_forms_data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.formsData = data[0]; // 기본 명사 활용 데이터

            console.log('Forms data loaded:', this.formsData);
        } catch (error) {
            console.error('Error loading forms data:', error);
            this.setupDefaultData();
        }
    }

    /**
     * 기본 데이터 설정 (파일 로드 실패 시)
     */
    setupDefaultData() {
        this.formsData = {
            title: "기본 명사 활용",
            description: "명사를 평서체와 경어체로 활용하는 방법을 학습합니다",
            forms: [
                {
                    formType: "현재 긍정",
                    casual: "だ",
                    polite: "です",
                    description: "현재 상태를 나타내는 긍정형"
                }
            ],
            examples: [
                {
                    noun: "学生",
                    reading: "がくせい",
                    meaning: "학생",
                    forms: {
                        "현재 긍정": {
                            casual: "学生だ",
                            polite: "学生です",
                            translation: "(나는) 학생이다 / (나는) 학생입니다"
                        }
                    }
                }
            ]
        };
    }

    /**
     * UI 초기화
     */
    initializeUI() {
        this.hideHeader(); // 헤더 숨기기
        this.createFormSelector();
        this.createNounDisplay();
    }

    /**
     * 헤더 숨기기
     */
    hideHeader() {
        const headerContainer = document.getElementById('nounFormsHeader');
        if (headerContainer) {
            headerContainer.style.display = 'none';
        }
    }

    /**
     * 활용 형태 선택기 생성
     */
    createFormSelector() {
        const selectorContainer = document.getElementById('formSelector');
        if (!selectorContainer) {
            console.log('Form selector container not found');
            return;
        }

        selectorContainer.innerHTML = `
            <div class="form-selector">
                <div class="selector-header">
                    <h3>활용 형태 선택</h3>
                    <button class="info-modal-btn" onclick="nounFormsApp.openInfoModal()">
                        <span class="info-icon">ℹ️</span>
                        <span class="info-text">설명</span>
                    </button>
                </div>
                <div class="form-buttons">
                    ${this.formsData.forms.map(form => `
                        <button class="form-btn ${form.formType === this.selectedForm ? 'active' : ''}"
                                data-form="${form.formType}">
                            <div class="form-name">${form.formType}</div>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * 명사 표시 영역 생성
     */
    createNounDisplay() {
        const displayContainer = document.getElementById('nounDisplay');
        if (!displayContainer) {
            console.log('Noun display container not found');
            return;
        }

        const currentNoun = this.formsData.examples[this.currentNounIndex];
        const selectedFormData = this.formsData.forms.find(f => f.formType === this.selectedForm);

        const totalNouns = this.formsData.examples.length;

        displayContainer.innerHTML = `
            <div class="noun-display">
                <div class="noun-counter">${this.currentNounIndex + 1}/${totalNouns}</div>
                <div class="noun-info">
                    <div class="noun-main">
                        <span class="noun-kanji">${currentNoun.noun}</span>
                        <button class="speech-btn speech-noun-btn" title="명사 음성 듣기">🔊</button>
                        <span class="noun-reading">${currentNoun.reading}</span>
                    </div>
                    <div class="noun-meaning">${currentNoun.meaning}</div>
                </div>

                <div class="form-explanation">
                    <h4>${this.selectedForm}</h4>
                    <p>${selectedFormData.description}</p>
                    ${selectedFormData.usage ? `<p class="usage-note"><strong>사용법:</strong> ${selectedFormData.usage}</p>` : ''}
                </div>

                <div class="conjugation-display">
                    <div class="conjugation-pair">
                        <div class="casual-form">
                            <div class="form-label">평문체 (친근한 상황)</div>
                            <div class="form-text">
                                ${currentNoun.forms[this.selectedForm].casual}
                                <button class="speech-btn speech-btn-small speech-casual-btn" title="평문체 음성 듣기">🔊</button>
                            </div>
                            <div class="form-korean">${this.getKoreanTranslation(currentNoun.forms[this.selectedForm].casual)}</div>
                        </div>
                        <div class="polite-form">
                            <div class="form-label">경어체 (정중한 상황)</div>
                            <div class="form-text">
                                ${currentNoun.forms[this.selectedForm].polite}
                                <button class="speech-btn speech-btn-small speech-polite-btn" title="경어체 음성 듣기">🔊</button>
                            </div>
                            <div class="form-korean">${this.getKoreanTranslation(currentNoun.forms[this.selectedForm].polite)}</div>
                        </div>
                    </div>
                    <div class="translation">
                        <strong>번역:</strong> ${currentNoun.forms[this.selectedForm].translation}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 한글 번역 생성
     */
    getKoreanTranslation(japaneseForm) {
        // 명사 부분을 제거하고 활용 부분만 번역
        const currentNoun = this.formsData.examples[this.currentNounIndex];
        const nounPart = currentNoun.noun;
        const conjugationPart = japaneseForm.replace(nounPart, '');

        const translations = {
            'だ': '이다/다',
            'です': '입니다',
            'じゃない': '이/가 아니다',
            'ではない': '이/가 아니다',
            'じゃありません': '이/가 아닙니다',
            'ではありません': '이/가 아닙니다',
            'だった': '이었다/였다',
            'でした': '이었습니다/였습니다',
            'じゃなかった': '이/가 아니었다',
            'ではなかった': '이/가 아니었다',
            'じゃありませんでした': '이/가 아니었습니다',
            'ではありませんでした': '이/가 아니었습니다',
            'だろう': '일 것이다',
            'でしょう': '일 것입니다'
        };

        return `${currentNoun.meaning} + ${translations[conjugationPart] || conjugationPart}`;
    }


    /**
     * 이벤트 바인딩
     */
    bindEvents() {
        // 활용 형태 선택 이벤트
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('form-btn') || e.target.closest('.form-btn')) {
                const btn = e.target.classList.contains('form-btn') ? e.target : e.target.closest('.form-btn');
                const formType = btn.dataset.form;
                this.selectForm(formType);
            }
        });

        // 스와이프 네비게이션
        this.bindSwipeEvents();

        // 키보드 네비게이션
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.showPreviousNoun();
            if (e.key === 'ArrowRight') this.showNextNoun();
        });

        // 음성 버튼 이벤트
        this.bindSpeechEvents();
    }

    /**
     * 활용 형태 선택
     */
    selectForm(formType) {
        this.selectedForm = formType;
        this.updateFormSelector();
        this.createNounDisplay();
    }

    /**
     * 형태 선택기 업데이트
     */
    updateFormSelector() {
        const formBtns = document.querySelectorAll('.form-btn');
        formBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.form === this.selectedForm) {
                btn.classList.add('active');
            }
        });
    }

    /**
     * 이전 명사 표시
     */
    showPreviousNoun() {
        if (this.currentNounIndex > 0) {
            this.currentNounIndex--;
            this.createNounDisplay();
        }
    }

    /**
     * 다음 명사 표시
     */
    showNextNoun() {
        if (this.currentNounIndex < this.formsData.examples.length - 1) {
            this.currentNounIndex++;
            this.createNounDisplay();
        }
    }

    /**
     * 터치 및 스와이프 이벤트 바인딩
     */
    bindSwipeEvents() {
        let startX = 0;
        let startY = 0;
        let isSwipingHorizontally = false;
        let isSwiping = false;

        const nounDisplay = document.getElementById('nounDisplay');
        if (!nounDisplay) return;

        // 터치 시작
        nounDisplay.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isSwipingHorizontally = false;
            isSwiping = false;
        }, { passive: true });

        // 터치 이동
        nounDisplay.addEventListener('touchmove', (e) => {
            if (!startX || !startY) return;

            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;

            const diffX = Math.abs(currentX - startX);
            const diffY = Math.abs(currentY - startY);

            // 수평 스와이프 감지
            if (diffX > diffY && diffX > 10) {
                isSwipingHorizontally = true;
                isSwiping = true;
                e.preventDefault();
            } else if (diffY > 10) {
                // 수직 스크롤 감지
                isSwiping = true;
            }
        }, { passive: false });

        // 터치 종료
        nounDisplay.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;

            if (isSwipingHorizontally) {
                const endX = e.changedTouches[0].clientX;
                const diffX = startX - endX;

                // 최소 스와이프 거리 (뒤로가기만)
                if (Math.abs(diffX) > 50 && diffX < 0) {
                    // 왼쪽에서 오른쪽 스와이프 (뒤로가기)
                    window.threeStepNavigation?.showScreen('sub');
                }
            } else if (!isSwiping) {
                // 단순 터치 (스와이프가 아닌 경우) - 터치 위치에 따라 이전/다음
                const endX = e.changedTouches[0].clientX;
                const displayRect = nounDisplay.getBoundingClientRect();
                const centerX = displayRect.left + displayRect.width / 2;

                if (endX < centerX) {
                    // 왼쪽 터치 - 이전 명사
                    this.showPreviousNoun();
                } else {
                    // 오른쪽 터치 - 다음 명사
                    this.showNextNoun();
                }
            }

            // 초기화
            startX = 0;
            startY = 0;
            isSwipingHorizontally = false;
            isSwiping = false;
        }, { passive: true });
    }

    /**
     * 정보 모달 열기
     */
    openInfoModal() {
        const modal = document.getElementById('infoModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden'; // 스크롤 방지
        }
    }

    /**
     * 정보 모달 닫기
     */
    closeInfoModal() {
        const modal = document.getElementById('infoModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = ''; // 스크롤 복원
        }
    }

    /**
     * 모달 외부 클릭 시 닫기
     */
    bindModalEvents() {
        const modal = document.getElementById('infoModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                // 모달 외부(오버레이) 클릭 시 닫기
                if (e.target === modal) {
                    this.closeInfoModal();
                }
            });

            // ESC 키로 모달 닫기
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.classList.contains('active')) {
                    this.closeInfoModal();
                }
            });
        }
    }

    /**
     * 음성 버튼 이벤트 바인딩
     */
    bindSpeechEvents() {
        // 명사 음성 버튼
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('speech-noun-btn')) {
                e.preventDefault();
                e.stopPropagation();
                this.speakCurrentNoun();
            } else if (e.target.classList.contains('speech-casual-btn')) {
                e.preventDefault();
                e.stopPropagation();
                this.speakCasualForm();
            } else if (e.target.classList.contains('speech-polite-btn')) {
                e.preventDefault();
                e.stopPropagation();
                this.speakPoliteForm();
            }
        });
    }

    /**
     * 현재 명사 음성 재생
     */
    async speakCurrentNoun() {
        if (!this.formsData || !window.speechManager) {
            console.warn('No data or speech manager not available');
            return;
        }

        const speechBtn = document.querySelector('.speech-noun-btn');

        // 이미 재생 중이면 중복 실행 방지
        if (speechBtn && speechBtn.classList.contains('speaking')) {
            console.log('Speech already in progress, ignoring click');
            return;
        }

        try {
            const currentNoun = this.formsData.examples[this.currentNounIndex];
            const textToSpeak = currentNoun.noun;

            // 버튼 상태 변경 및 비활성화
            if (speechBtn) {
                speechBtn.classList.add('speaking');
                speechBtn.textContent = '🔈';
                speechBtn.disabled = true;
            }

            await window.speechManager.speak(textToSpeak, { rate: 0.7 });

            console.log('Noun speech completed');
        } catch (error) {
            console.error('Error speaking noun:', error);
            // interrupted 오류가 아닌 경우만 알림 표시
            if (error !== 'interrupted') {
                alert('음성 재생에 실패했습니다.');
            }
        } finally {
            // 버튼 상태 복원
            if (speechBtn) {
                speechBtn.classList.remove('speaking');
                speechBtn.textContent = '🔊';
                speechBtn.disabled = false;
            }
        }
    }

    /**
     * 평문체 활용형 음성 재생
     */
    async speakCasualForm() {
        if (!this.formsData || !window.speechManager) {
            console.warn('No data or speech manager not available');
            return;
        }

        const speechBtn = document.querySelector('.speech-casual-btn');

        // 이미 재생 중이면 중복 실행 방지
        if (speechBtn && speechBtn.classList.contains('speaking')) {
            console.log('Speech already in progress, ignoring click');
            return;
        }

        try {
            const currentNoun = this.formsData.examples[this.currentNounIndex];
            const formData = currentNoun.forms[this.selectedForm];
            const textToSpeak = formData.casual;

            // 버튼 상태 변경 및 비활성화
            if (speechBtn) {
                speechBtn.classList.add('speaking');
                speechBtn.textContent = '🔈';
                speechBtn.disabled = true;
            }

            await window.speechManager.speak(textToSpeak, { rate: 0.7 });

            console.log('Casual form speech completed');
        } catch (error) {
            console.error('Error speaking casual form:', error);
            // interrupted 오류가 아닌 경우만 알림 표시
            if (error !== 'interrupted') {
                alert('음성 재생에 실패했습니다.');
            }
        } finally {
            // 버튼 상태 복원
            if (speechBtn) {
                speechBtn.classList.remove('speaking');
                speechBtn.textContent = '🔊';
                speechBtn.disabled = false;
            }
        }
    }

    /**
     * 경어체 활용형 음성 재생
     */
    async speakPoliteForm() {
        if (!this.formsData || !window.speechManager) {
            console.warn('No data or speech manager not available');
            return;
        }

        const speechBtn = document.querySelector('.speech-polite-btn');

        // 이미 재생 중이면 중복 실행 방지
        if (speechBtn && speechBtn.classList.contains('speaking')) {
            console.log('Speech already in progress, ignoring click');
            return;
        }

        try {
            const currentNoun = this.formsData.examples[this.currentNounIndex];
            const formData = currentNoun.forms[this.selectedForm];
            const textToSpeak = formData.polite;

            // 버튼 상태 변경 및 비활성화
            if (speechBtn) {
                speechBtn.classList.add('speaking');
                speechBtn.textContent = '🔈';
                speechBtn.disabled = true;
            }

            await window.speechManager.speak(textToSpeak, { rate: 0.7 });

            console.log('Polite form speech completed');
        } catch (error) {
            console.error('Error speaking polite form:', error);
            // interrupted 오류가 아닌 경우만 알림 표시
            if (error !== 'interrupted') {
                alert('음성 재생에 실패했습니다.');
            }
        } finally {
            // 버튼 상태 복원
            if (speechBtn) {
                speechBtn.classList.remove('speaking');
                speechBtn.textContent = '🔊';
                speechBtn.disabled = false;
            }
        }
    }
}

// 명사 활용 앱 초기화
let nounFormsApp;
document.addEventListener('DOMContentLoaded', () => {
    nounFormsApp = new NounFormsApp();

    // 모달 이벤트 바인딩 (DOM 로드 후)
    setTimeout(() => {
        if (nounFormsApp) {
            nounFormsApp.bindModalEvents();
        }
    }, 100);
});