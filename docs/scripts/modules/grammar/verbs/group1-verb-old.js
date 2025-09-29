/**
 * Group1 Verb Conjugation App - 1그룹동사 활용 학습
 *
 * 특징:
 * - 1그룹동사(う동사)의 6가지 활용형 학습
 * - 실제 예문을 통한 학습
 * - 컴팩트한 인터페이스
 * - 터치 네비게이션
 */

class Group1VerbApp {
    constructor() {
        this.verbData = null;
        this.currentVerbIndex = 0;
        this.selectedForm = '현재형'; // 기본 선택 형태

        this.init();
    }

    async init() {
        try {
            console.log('Initializing Group1 Verb App...');
            console.log('현재 DOM 상태 확인:');
            console.log('- infoModal 존재:', !!document.getElementById('infoModal'));
            console.log('- formSelector 존재:', !!document.getElementById('formSelector'));
            console.log('- verbDisplay 존재:', !!document.getElementById('verbDisplay'));

            // 데이터 로드
            await this.loadVerbData();
            console.log('데이터 로드 완료');

            // 이벤트 바인딩
            this.bindEvents();
            console.log('이벤트 바인딩 완료');

            // UI 초기화
            this.initializeUI();
            console.log('UI 초기화 완료');

            console.log('Group1 Verb App initialized successfully');
        } catch (error) {
            console.error('Error initializing Group1 Verb App:', error);
        }
    }

    /**
     * 1그룹동사 데이터 로드
     */
    async loadVerbData() {
        try {
            const response = await fetch('./data/vocabulary/jlpt/group1_verb_data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.verbData = data[0]; // 기본 1그룹동사 데이터

            console.log('Group1 Verb data loaded:', this.verbData);
        } catch (error) {
            console.error('Error loading group1 verb data:', error);
            this.setupDefaultData();
        }
    }

    /**
     * 기본 데이터 설정 (파일 로드 실패 시)
     */
    setupDefaultData() {
        this.verbData = {
            title: "1그룹동사 활용",
            description: "1그룹동사(う동사)의 다양한 활용형을 학습합니다",
            conjugationTypes: [
                {
                    formType: "현재형",
                    ending: "う",
                    description: "기본형으로 현재나 미래를 나타냄"
                }
            ],
            examples: [
                {
                    verb: "書く",
                    stem: "書",
                    reading: "かく",
                    meaning: "쓰다",
                    group: "く동사",
                    conjugations: {
                        "현재형": {
                            form: "書く",
                            reading: "かく",
                            translation: "쓰다",
                            example: "手紙を書く。",
                            exampleReading: "てがみをかく。",
                            exampleTranslation: "편지를 쓴다."
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
        const headerContainer = document.getElementById('group1VerbHeader');
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

        const html = `
            <div class="form-selector">
                <div class="selector-header">
                    <h3>활용 형태 선택</h3>
                    <button class="info-modal-btn" data-action="open-info-modal">
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

        selectorContainer.innerHTML = html;
        console.log('Form selector HTML created, checking for info button...');

        // 설명 버튼이 올바르게 생성되었는지 확인
        setTimeout(() => {
            const infoBtn = selectorContainer.querySelector('.info-modal-btn[data-action="open-info-modal"]');
            console.log('Info button found after creation:', !!infoBtn);
            if (infoBtn) {
                console.log('Info button attributes:', {
                    'data-action': infoBtn.getAttribute('data-action'),
                    'class': infoBtn.className,
                    'text': infoBtn.textContent.trim()
                });
            }
        }, 100);
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
     * 형태별 어미 변화 가져오기
     */
    getEndingForForm(verb, formType) {
        const verbType = verb.group;
        const baseEnding = verb.verb.slice(-1);

        switch (formType) {
            case '현재형':
                return baseEnding;
            case '과거형':
                if (baseEnding === 'く') return 'いた';
                if (baseEnding === 'ぐ') return 'いだ';
                if (baseEnding === 'む' || baseEnding === 'ぶ' || baseEnding === 'ぬ') return 'んだ';
                if (baseEnding === 'す') return 'した';
                if (baseEnding === 'つ' || baseEnding === 'る' || baseEnding === 'う') return 'った';
                return 'た';
            case '부정형':
                return 'ない';
            case '과거부정형':
                return 'なかった';
            case 'ます형':
                return 'ます';
            case 'て형':
                if (baseEnding === 'く') return 'いて';
                if (baseEnding === 'ぐ') return 'いで';
                if (baseEnding === 'む' || baseEnding === 'ぶ' || baseEnding === 'ぬ') return 'んで';
                if (baseEnding === 'す') return 'して';
                if (baseEnding === 'つ' || baseEnding === 'る' || baseEnding === 'う') return 'って';
                return 'て';
            default:
                return baseEnding;
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
        console.log('Binding events for Group1VerbApp');

        // 기존 이벤트 리스너 제거 (중복 방지)
        if (this.clickHandler) {
            document.removeEventListener('click', this.clickHandler);
        }
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
        }

        // 클릭 이벤트 핸들러 (this 바인딩)
        this.clickHandler = (e) => {
            // characterScreen이 현재 활성화되고 group1VerbScreen이 있는 상태에서만 이벤트 처리
            const characterScreen = document.getElementById('characterScreen');
            const group1VerbScreen = document.getElementById('group1VerbScreen');

            if (!characterScreen || !group1VerbScreen || !characterScreen.contains(group1VerbScreen)) {
                return;
            }

            if (e.target.classList.contains('form-btn') || e.target.closest('.form-btn')) {
                const btn = e.target.classList.contains('form-btn') ? e.target : e.target.closest('.form-btn');
                const formType = btn.dataset.form;
                this.selectForm(formType);
            }

            // 정보 모달 버튼 이벤트 - group1VerbScreen 내부에서만
            if (group1VerbScreen.contains(e.target) && e.target.closest('.info-modal-btn[data-action="open-info-modal"]')) {
                console.log('Group1 Info modal button clicked');
                e.preventDefault();
                this.openInfoModal();
            }

            // 모달 닫기 버튼 이벤트 - group1의 모달에서만
            if (group1VerbScreen.contains(e.target) && e.target.closest('.modal-close-btn[data-action="close-info-modal"]')) {
                console.log('Group1 Modal close button clicked');
                e.preventDefault();
                this.closeInfoModal();
            }
        };

        // 키보드 이벤트 핸들러
        this.keyHandler = (e) => {
            const characterScreen = document.getElementById('characterScreen');
            const group1VerbScreen = document.getElementById('group1VerbScreen');

            if (!characterScreen || !group1VerbScreen || !characterScreen.contains(group1VerbScreen)) {
                return;
            }

            if (e.key === 'ArrowLeft') this.showPreviousVerb();
            if (e.key === 'ArrowRight') this.showNextVerb();
        };

        // 이벤트 리스너 등록
        document.addEventListener('click', this.clickHandler);
        document.addEventListener('keydown', this.keyHandler);

        console.log('Event listeners registered for Group1VerbApp');

        // 터치 및 스와이프 네비게이션
        this.bindSwipeEvents();
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

// Group1VerbApp 클래스를 전역으로 노출
window.Group1VerbApp = Group1VerbApp;

// 1그룹동사 활용 앱 초기화
let group1VerbApp;
document.addEventListener('DOMContentLoaded', () => {
    group1VerbApp = new Group1VerbApp();

    // 모달 이벤트 바인딩 (DOM 로드 후)
    setTimeout(() => {
        if (group1VerbApp) {
            group1VerbApp.bindModalEvents();
        }
    }, 100);
});