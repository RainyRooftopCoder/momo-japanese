/**
 * Na-Adjective Conjugation App - な형용사 활용 학습
 *
 * 특징:
 * - な형용사의 6가지 활용형 학습
 * - 실제 예문을 통한 학습
 * - 컴팩트한 인터페이스
 */

class NaAdjectiveApp {
    constructor() {
        this.adjectiveData = null;
        this.currentAdjectiveIndex = 0;
        this.selectedForm = '현재 긍정'; // 기본 선택 형태

        this.init();
    }

    async init() {
        try {
            console.log('Initializing Na-Adjective App...');

            // 데이터 로드
            await this.loadAdjectiveData();

            // 이벤트 바인딩
            this.bindEvents();

            // UI 초기화
            this.initializeUI();

            console.log('Na-Adjective App initialized successfully');
        } catch (error) {
            console.error('Error initializing Na-Adjective App:', error);
        }
    }

    /**
     * な형용사 데이터 로드
     */
    async loadAdjectiveData() {
        try {
            const response = await fetch('./data/vocabulary/jlpt/na_adjective_data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.adjectiveData = data[0]; // 기본 な형용사 데이터

            console.log('Na-Adjective data loaded:', this.adjectiveData);
        } catch (error) {
            console.error('Error loading na-adjective data:', error);
            this.setupDefaultData();
        }
    }

    /**
     * 기본 데이터 설정 (파일 로드 실패 시)
     */
    setupDefaultData() {
        this.adjectiveData = {
            title: "な형용사 활용",
            description: "な형용사의 다양한 활용형을 학습합니다",
            conjugationTypes: [
                {
                    formType: "현재 긍정",
                    ending: "だ",
                    description: "기본형으로 현재 상태를 나타냄"
                }
            ],
            examples: [
                {
                    adjective: "静か",
                    stem: "静か",
                    reading: "しずか",
                    meaning: "조용하다",
                    conjugations: {
                        "현재 긍정": {
                            form: "静かだ",
                            reading: "しずかだ",
                            translation: "조용하다"
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
        this.createAdjectiveDisplay();
    }

    /**
     * 헤더 숨기기
     */
    hideHeader() {
        const headerContainer = document.getElementById('naAdjectiveHeader');
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
                    <button class="info-modal-btn" data-action="open-info-modal">
                        <span class="info-icon">ℹ️</span>
                        <span class="info-text">설명</span>
                    </button>
                </div>
                <div class="form-buttons">
                    ${this.adjectiveData.conjugationTypes.map(form => `
                        <button class="form-btn ${form.formType === this.selectedForm ? 'active' : ''}"
                                data-form="${form.formType}">
                            <div class="form-name">${form.formType}</div>
                            <div class="form-ending">${form.ending}</div>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * 형용사 표시 영역 생성
     */
    createAdjectiveDisplay() {
        const displayContainer = document.getElementById('adjectiveDisplay');
        if (!displayContainer) {
            console.log('Adjective display container not found');
            return;
        }

        const currentAdjective = this.adjectiveData.examples[this.currentAdjectiveIndex];
        const selectedFormData = this.adjectiveData.conjugationTypes.find(f => f.formType === this.selectedForm);
        const conjugationData = currentAdjective.conjugations[this.selectedForm];
        const totalAdjectives = this.adjectiveData.examples.length;

        displayContainer.innerHTML = `
            <div class="adjective-display">
                <div class="adjective-counter">${this.currentAdjectiveIndex + 1}/${totalAdjectives}</div>
                <div class="adjective-info">
                    <div class="adjective-main">
                        <span class="adjective-kanji">${currentAdjective.adjective}</span>
                        <span class="adjective-reading">${currentAdjective.reading}</span>
                    </div>
                    <div class="adjective-meaning">${currentAdjective.meaning}</div>
                </div>

                <div class="form-explanation">
                    <h4>${this.selectedForm} (${selectedFormData.ending})</h4>
                    <p>${selectedFormData.description}</p>
                    ${selectedFormData.usage ? `<p class="usage-note"><strong>사용법:</strong> ${selectedFormData.usage}</p>` : ''}
                </div>

                <div class="conjugation-display">
                    <div class="conjugation-result">
                        <div class="stem-breakdown">
                            <span class="stem-part">${currentAdjective.stem}</span>
                            <span class="ending-part">${selectedFormData.ending}</span>
                            <span class="arrow">→</span>
                            <span class="result-part">${conjugationData.form}</span>
                        </div>

                        <div class="result-info">
                            <div class="result-reading">${conjugationData.reading}</div>
                            <div class="result-translation">${conjugationData.translation}</div>
                        </div>
                    </div>

                    <div class="example-sentence">
                        <h4>예문</h4>
                        <div class="sentence-card">
                            <div class="sentence-japanese">${this.highlightConjugation(conjugationData.example, conjugationData.form)}</div>
                            <div class="sentence-reading">${conjugationData.exampleReading}</div>
                            <div class="sentence-translation">${conjugationData.exampleTranslation}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 활용형 강조 표시
     */
    highlightConjugation(sentence, conjugatedForm) {
        const currentAdjective = this.adjectiveData.examples[this.currentAdjectiveIndex];
        const stem = currentAdjective.stem;

        // な형용사의 다양한 활용형을 찾기 위한 패턴들
        const patterns = [
            `${stem}だ`,
            `${stem}です`,
            `${stem}ではない`,
            `${stem}ではありません`,
            `${stem}だった`,
            `${stem}でした`,
            `${stem}ではなかった`,
            `${stem}ではありませんでした`,
            `${stem}に`,
            `${stem}な`
        ];

        let highlightedSentence = sentence;

        // 가장 긴 패턴부터 매칭하여 중복 하이라이트 방지
        patterns.sort((a, b) => b.length - a.length);

        for (const pattern of patterns) {
            if (highlightedSentence.includes(pattern)) {
                highlightedSentence = highlightedSentence.replace(
                    new RegExp(pattern, 'g'),
                    `<span class="highlighted-conjugation">${pattern}</span>`
                );
                break; // 첫 번째 매칭에서 중단
            }
        }

        return highlightedSentence;
    }

    /**
     * 이벤트 바인딩
     */
    bindEvents() {
        console.log('Binding events for NaAdjectiveApp');

        // 기존 이벤트 리스너 제거 (중복 방지)
        if (this.clickHandler) {
            document.removeEventListener('click', this.clickHandler);
        }
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
        }

        // 클릭 이벤트 핸들러
        this.clickHandler = (e) => {
            const characterScreen = document.getElementById('characterScreen');
            const naAdjectiveScreen = document.getElementById('naAdjectiveScreen');

            if (!characterScreen || !naAdjectiveScreen || !characterScreen.contains(naAdjectiveScreen)) {
                return;
            }

            if (e.target.classList.contains('form-btn') || e.target.closest('.form-btn')) {
                const btn = e.target.classList.contains('form-btn') ? e.target : e.target.closest('.form-btn');
                const formType = btn.dataset.form;
                this.selectForm(formType);
            }

            // 정보 모달 버튼 이벤트
            if (naAdjectiveScreen.contains(e.target) && e.target.closest('.info-modal-btn[data-action="open-info-modal"]')) {
                console.log('Na-Adjective Info modal button clicked');
                e.preventDefault();
                this.openInfoModal();
            }

            // 모달 닫기 버튼 이벤트
            if (naAdjectiveScreen.contains(e.target) && e.target.closest('.modal-close-btn[data-action="close-info-modal"]')) {
                console.log('Na-Adjective Modal close button clicked');
                e.preventDefault();
                this.closeInfoModal();
            }
        };

        // 키보드 이벤트 핸들러
        this.keyHandler = (e) => {
            const characterScreen = document.getElementById('characterScreen');
            const naAdjectiveScreen = document.getElementById('naAdjectiveScreen');

            if (!characterScreen || !naAdjectiveScreen || !characterScreen.contains(naAdjectiveScreen)) {
                return;
            }

            if (e.key === 'ArrowLeft') this.showPreviousAdjective();
            if (e.key === 'ArrowRight') this.showNextAdjective();
        };

        // 이벤트 리스너 등록
        document.addEventListener('click', this.clickHandler);
        document.addEventListener('keydown', this.keyHandler);

        console.log('Event listeners registered for NaAdjectiveApp');

        // 터치 및 스와이프 네비게이션
        this.bindSwipeEvents();
    }

    /**
     * 활용 형태 선택
     */
    selectForm(formType) {
        this.selectedForm = formType;
        this.updateFormSelector();
        this.createAdjectiveDisplay();
    }

    /**
     * 형태 선택기 업데이트
     */
    updateFormSelector() {
        const formBtns = document.querySelectorAll('.form-btn');
        formBtns.forEach(btn => {
            btn.classList.remove('show');
            if (btn.dataset.form === this.selectedForm) {
                btn.classList.add('show');
            }
        });
    }

    /**
     * 이전 형용사 표시
     */
    showPreviousAdjective() {
        if (this.currentAdjectiveIndex > 0) {
            this.currentAdjectiveIndex--;
            this.createAdjectiveDisplay();
        }
    }

    /**
     * 다음 형용사 표시
     */
    showNextAdjective() {
        if (this.currentAdjectiveIndex < this.adjectiveData.examples.length - 1) {
            this.currentAdjectiveIndex++;
            this.createAdjectiveDisplay();
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

        const adjectiveDisplay = document.getElementById('adjectiveDisplay');
        if (!adjectiveDisplay) return;

        // 터치 시작
        adjectiveDisplay.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isSwipingHorizontally = false;
            isSwiping = false;
        }, { passive: true });

        // 터치 이동
        adjectiveDisplay.addEventListener('touchmove', (e) => {
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
        adjectiveDisplay.addEventListener('touchend', (e) => {
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
                const displayRect = adjectiveDisplay.getBoundingClientRect();
                const centerX = displayRect.left + displayRect.width / 2;

                if (endX < centerX) {
                    // 왼쪽 터치 - 이전 형용사
                    this.showPreviousAdjective();
                } else {
                    // 오른쪽 터치 - 다음 형용사
                    this.showNextAdjective();
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
        console.log('openInfoModal called');
        const modal = document.getElementById('infoModal');
        console.log('Modal element found:', modal);
        if (modal) {
            console.log('Adding show class to modal');

            // 스크롤 위치 저장
            this.savedScrollTop = window.pageYOffset || document.documentElement.scrollTop;

            modal.classList.add('show');

            // body 스크롤 방지 (더 안전한 방법)
            document.body.style.position = 'fixed';
            document.body.style.top = `-${this.savedScrollTop}px`;
            document.body.style.width = '100%';

            console.log('Modal should be visible now');
        } else {
            console.error('Modal element not found!');
        }
    }

    /**
     * 정보 모달 닫기
     */
    closeInfoModal() {
        const modal = document.getElementById('infoModal');
        if (modal) {
            modal.classList.remove('show');

            // body 스크롤 복원 (더 안전한 방법)
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';

            // 저장된 스크롤 위치로 복원
            if (this.savedScrollTop !== undefined) {
                window.scrollTo(0, this.savedScrollTop);
                this.savedScrollTop = undefined;
            }
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
                if (e.key === 'Escape' && modal.classList.contains('show')) {
                    this.closeInfoModal();
                }
            });
        }
    }
}

// な형용사 활용 앱 초기화
let naAdjectiveApp;
document.addEventListener('DOMContentLoaded', () => {
    naAdjectiveApp = new NaAdjectiveApp();

    // 모달 이벤트 바인딩 (DOM 로드 후)
    setTimeout(() => {
        if (naAdjectiveApp) {
            naAdjectiveApp.bindModalEvents();
        }
    }, 100);
});