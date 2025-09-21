/**
 * Group3 Verb Conjugation App - 3그룹동사 활용 학습
 *
 * 특징:
 * - 3그룹동사(불규칙동사)의 6가지 활용형 학습
 * - 実제 예문을 통한 학습
 * - 컴팩트한 인터페이스
 * - 터치 네비게이션
 */

class Group3VerbApp {
    constructor() {
        this.verbData = null;
        this.currentVerbIndex = 0;
        this.selectedForm = '현재형'; // 기본 선택 형태

        this.init();
    }

    async init() {
        try {
            console.log('Initializing Group3 Verb App...');

            // 데이터 로드
            await this.loadVerbData();

            // 이벤트 바인딩
            this.bindEvents();

            // UI 초기화
            this.initializeUI();

            console.log('Group3 Verb App initialized successfully');
        } catch (error) {
            console.error('Error initializing Group3 Verb App:', error);
        }
    }

    /**
     * 3그룹동사 데이터 로드
     */
    async loadVerbData() {
        try {
            const response = await fetch('./json/group3_verb_data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.verbData = data[0]; // 기본 3그룹동사 데이터

            console.log('Group3 Verb data loaded:', this.verbData);
        } catch (error) {
            console.error('Error loading group3 verb data:', error);
            this.setupDefaultData();
        }
    }

    /**
     * 기본 데이터 설정 (파일 로드 실패 시)
     */
    setupDefaultData() {
        this.verbData = {
            title: "3그룹동사 활용",
            description: "3그룹동사(불규칙동사)의 다양한 활용형을 학습합니다",
            conjugationTypes: [
                {
                    formType: "현재형",
                    ending: "る/う",
                    description: "기본형으로 현재나 미래를 나타냄"
                }
            ],
            examples: [
                {
                    verb: "する",
                    stem: "し",
                    reading: "する",
                    meaning: "하다",
                    group: "불규칙동사",
                    conjugations: {
                        "현재형": {
                            form: "する",
                            reading: "する",
                            translation: "하다",
                            example: "勉強をする。",
                            exampleReading: "べんきょうをする。",
                            exampleTranslation: "공부를 한다."
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
        this.createVerbDisplay();
    }

    /**
     * 헤더 숨기기
     */
    hideHeader() {
        const headerContainer = document.getElementById('group3VerbHeader');
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
                    <button class="info-modal-btn" onclick="group3VerbApp.openInfoModal()">
                        <span class="info-icon">ℹ️</span>
                        <span class="info-text">설명</span>
                    </button>
                </div>
                <div class="form-buttons">
                    ${this.verbData.conjugationTypes.map(form => `
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
     * 동사 표시 영역 생성
     */
    createVerbDisplay() {
        const displayContainer = document.getElementById('verbDisplay');
        if (!displayContainer) {
            console.log('Verb display container not found');
            return;
        }

        const currentVerb = this.verbData.examples[this.currentVerbIndex];
        const selectedFormData = this.verbData.conjugationTypes.find(f => f.formType === this.selectedForm);
        const conjugationData = currentVerb.conjugations[this.selectedForm];
        const totalVerbs = this.verbData.examples.length;

        displayContainer.innerHTML = `
            <div class="verb-display">
                <div class="verb-counter">${this.currentVerbIndex + 1}/${totalVerbs}</div>
                <div class="verb-info">
                    <div class="verb-main">
                        <span class="verb-kanji">${currentVerb.verb}</span>
                        <span class="verb-reading">${currentVerb.reading}</span>
                    </div>
                    <div class="verb-meaning">${currentVerb.meaning}</div>
                    <div class="verb-group">${currentVerb.group}</div>
                </div>

                <div class="form-explanation">
                    <h4>${this.selectedForm} (${selectedFormData.ending})</h4>
                    <p>${selectedFormData.description}</p>
                    ${selectedFormData.usage ? `<p class="usage-note"><strong>사용법:</strong> ${selectedFormData.usage}</p>` : ''}
                </div>

                <div class="conjugation-display">
                    <div class="conjugation-result">
                        <div class="stem-breakdown">
                            <span class="stem-part">${currentVerb.stem}</span>
                            <span class="ending-part">${this.getEndingForForm(currentVerb, this.selectedForm)}</span>
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
     * 형태별 어미 변화 가져오기 (3그룹동사 특화 - 불규칙)
     */
    getEndingForForm(verb, formType) {
        const verbBase = verb.verb;

        if (verbBase === 'する') {
            switch (formType) {
                case '현재형': return '';
                case '과거형': return 'た';
                case '부정형': return 'ない';
                case '과거부정형': return 'なかった';
                case 'ます형': return 'ます';
                case 'て형': return 'て';
                default: return '';
            }
        } else if (verbBase === '来る') {
            switch (formType) {
                case '현재형': return '';
                case '과거형': return 'た';
                case '부정형': return 'ない';
                case '과거부정형': return 'なかった';
                case 'ます형': return 'ます';
                case 'て형': return 'て';
                default: return '';
            }
        } else {
            // 기타 불규칙동사
            switch (formType) {
                case '현재형': return '';
                case '과거형': return 'た';
                case '부정형': return 'ない';
                case '과거부정형': return 'なかった';
                case 'ます형': return 'ます';
                case 'て형': return 'て';
                default: return '';
            }
        }
    }

    /**
     * 활용형 강조 표시
     */
    highlightConjugation(sentence, conjugatedForm) {
        if (!conjugatedForm || !sentence.includes(conjugatedForm)) {
            return sentence;
        }

        return sentence.replace(
            new RegExp(conjugatedForm, 'g'),
            `<span class="highlighted-conjugation">${conjugatedForm}</span>`
        );
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

        // 터치 및 스와이프 네비게이션
        this.bindSwipeEvents();

        // 키보드 네비게이션
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.showPreviousVerb();
            if (e.key === 'ArrowRight') this.showNextVerb();
        });
    }

    /**
     * 활용 형태 선택
     */
    selectForm(formType) {
        this.selectedForm = formType;
        this.updateFormSelector();
        this.createVerbDisplay();
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
     * 이전 동사 표시
     */
    showPreviousVerb() {
        if (this.currentVerbIndex > 0) {
            this.currentVerbIndex--;
            this.createVerbDisplay();
        }
    }

    /**
     * 다음 동사 표시
     */
    showNextVerb() {
        if (this.currentVerbIndex < this.verbData.examples.length - 1) {
            this.currentVerbIndex++;
            this.createVerbDisplay();
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

        const verbDisplay = document.getElementById('verbDisplay');
        if (!verbDisplay) return;

        // 터치 시작
        verbDisplay.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isSwipingHorizontally = false;
            isSwiping = false;
        }, { passive: true });

        // 터치 이동
        verbDisplay.addEventListener('touchmove', (e) => {
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
        verbDisplay.addEventListener('touchend', (e) => {
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
                const displayRect = verbDisplay.getBoundingClientRect();
                const centerX = displayRect.left + displayRect.width / 2;

                if (endX < centerX) {
                    // 왼쪽 터치 - 이전 동사
                    this.showPreviousVerb();
                } else {
                    // 오른쪽 터치 - 다음 동사
                    this.showNextVerb();
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
}

// Group3VerbApp 클래스를 전역으로 노출
window.Group3VerbApp = Group3VerbApp;

// 3그룹동사 활용 앱 초기화
let group3VerbApp;
document.addEventListener('DOMContentLoaded', () => {
    group3VerbApp = new Group3VerbApp();

    // 모달 이벤트 바인딩 (DOM 로드 후)
    setTimeout(() => {
        if (group3VerbApp) {
            group3VerbApp.bindModalEvents();
        }
    }, 100);
});