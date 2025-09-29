/**
 * Base Grammar App - 문법 학습 앱의 공통 기본 클래스 (글로벌 버전)
 * 모든 문법 학습 앱 (동사, 형용사, 명사, 조사)에서 상속받아 사용
 */

// 글로벌 네임스페이스 생성
window.GrammarShared = window.GrammarShared || {};

// ModalManager 클래스
window.GrammarShared.ModalManager = class ModalManager {
    static savedScrollTop = undefined;

    static openModal(modalId = 'infoModal', options = {}) {
        const modal = document.getElementById(modalId);
        if (modal) {
            if (options.saveScroll !== false) {
                this.savedScrollTop = window.pageYOffset || document.documentElement.scrollTop;
                document.body.style.position = 'fixed';
                document.body.style.top = `-${this.savedScrollTop}px`;
                document.body.style.width = '100%';
            }
            modal.classList.add('show');
        } else {
            console.error(`Modal element with ID '${modalId}' not found!`);
        }
    }

    static closeModal(modalId = 'infoModal', options = {}) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');

            if (options.restoreScroll !== false) {
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';

                if (this.savedScrollTop !== undefined) {
                    window.scrollTo(0, this.savedScrollTop);
                    this.savedScrollTop = undefined;
                }
            }
        }
    }

    static bindModalEvents(modalId = 'infoModal', closeCallback) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        // 모달 배경 클릭 시 닫기
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                if (closeCallback) {
                    closeCallback();
                } else {
                    this.closeModal(modalId);
                }
            }
        });

        // ESC 키로 모달 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('show')) {
                if (closeCallback) {
                    closeCallback();
                } else {
                    this.closeModal(modalId);
                }
            }
        });

        // 닫기 버튼 클릭 이벤트
        const closeButtons = modal.querySelectorAll('[data-modal-close], [data-action="close-info-modal"], .modal-close-btn');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (closeCallback) {
                    closeCallback();
                } else {
                    this.closeModal(modalId);
                }
            });
        });
    }
};

// TouchManager 클래스
window.GrammarShared.TouchManager = class TouchManager {
    static bindSwipeEvents(element, config = {}) {
        if (!element) {
            console.warn('TouchManager: No element provided for swipe binding');
            return;
        }

        const {
            onSwipeLeft,
            onSwipeRight,
            threshold = 50,
            maxVerticalDistance = 100,
            maxTime = 300,
            minStartX = 50
        } = config;

        let startX = 0;
        let startY = 0;
        let startTime = 0;

        // 터치 이벤트 처리
        element.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            startTime = Date.now();
        }, { passive: true });

        element.addEventListener('touchend', (e) => {
            if (!e.changedTouches || e.changedTouches.length === 0) return;

            const touch = e.changedTouches[0];
            const endX = touch.clientX;
            const endY = touch.clientY;
            const deltaTime = Date.now() - startTime;

            const deltaX = endX - startX;
            const deltaY = endY - startY;

            // 스와이프 조건 검사
            if (deltaTime > maxTime) return;
            if (Math.abs(deltaY) > maxVerticalDistance) return;
            if (Math.abs(deltaX) < threshold) return;

            // 왼쪽 스와이프 (다음)
            if (deltaX < -threshold && onSwipeLeft) {
                e.preventDefault();
                onSwipeLeft(e);
            }
            // 오른쪽 스와이프 (이전 또는 뒤로가기)
            else if (deltaX > threshold && onSwipeRight) {
                e.preventDefault();
                onSwipeRight(e);
            }
        }, { passive: false });

        // 마우스 이벤트 처리 (데스크톱 테스트용)
        let mouseStartX = 0;
        let mouseStartY = 0;
        let mouseStartTime = 0;
        let isMouseDown = false;

        element.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            mouseStartX = e.clientX;
            mouseStartY = e.clientY;
            mouseStartTime = Date.now();
        });

        element.addEventListener('mouseup', (e) => {
            if (!isMouseDown) return;
            isMouseDown = false;

            const deltaTime = Date.now() - mouseStartTime;
            const deltaX = e.clientX - mouseStartX;
            const deltaY = e.clientY - mouseStartY;

            // 스와이프 조건 검사
            if (deltaTime > maxTime) return;
            if (Math.abs(deltaY) > maxVerticalDistance) return;
            if (Math.abs(deltaX) < threshold) return;

            // 왼쪽 스와이프 (다음)
            if (deltaX < -threshold && onSwipeLeft) {
                e.preventDefault();
                onSwipeLeft(e);
            }
            // 오른쪽 스와이프 (이전 또는 뒤로가기)
            else if (deltaX > threshold && onSwipeRight) {
                e.preventDefault();
                onSwipeRight(e);
            }
        });

        element.addEventListener('mouseleave', () => {
            isMouseDown = false;
        });
    }

    static bindNavigationSwipe(element, prevCallback, nextCallback, options = {}) {
        this.bindSwipeEvents(element, {
            onSwipeLeft: nextCallback,
            onSwipeRight: prevCallback,
            threshold: options.threshold || 50,
            maxVerticalDistance: options.maxVerticalDistance || 100,
            maxTime: options.maxTime || 300
        });
    }

    static bindBackSwipe(element, callback, options = {}) {
        this.bindSwipeEvents(element, {
            onSwipeRight: callback,
            threshold: options.threshold || 50,
            maxVerticalDistance: options.maxVerticalDistance || 100,
            maxTime: options.maxTime || 300,
            minStartX: options.minStartX || 50
        });
    }
};

// 모듈 설정
window.GrammarShared.MODULE_CONFIGS = {
    group1Verb: {
        dataPath: './data/vocabulary/jlpt/group1_verb_data.json',
        defaultForm: '현재형',
        screenId: 'group1VerbScreen',
        headerId: 'group1VerbHeader',
        displayId: 'verbDisplay',
        itemType: 'verb',
        itemTypeKorean: '동사',
        category: 'Group 1 동사',
        forms: ['현재형', '과거형', '부정형', '과거부정형', 'ます형', 'て형'],
        defaultData: {
            verb: '書く',
            stem: '書',
            reading: 'かく',
            meaning: '쓰다',
            group: 'く동사',
            conjugations: {
                '현재형': {
                    form: '書く',
                    reading: 'かく',
                    translation: '쓰다',
                    example: '手紙を書く。',
                    exampleReading: 'てがみをかく。',
                    exampleTranslation: '편지를 쓴다.'
                }
            }
        }
    },
    group2Verb: {
        dataPath: './data/vocabulary/jlpt/group2_verb_data.json',
        defaultForm: '현재형',
        screenId: 'group2VerbScreen',
        headerId: 'group2VerbHeader',
        displayId: 'verbDisplay',
        itemType: 'verb',
        itemTypeKorean: '동사',
        category: 'Group 2 동사',
        forms: ['현재형', '과거형', '현재 부정형', '과거 부정형', '정중형', '과거 정중형'],
        defaultData: {
            verb: '見る',
            reading: 'みる',
            meaning: '보다',
            group: 2,
            jlpt_level: 'N5'
        }
    },
    group3Verb: {
        dataPath: './data/vocabulary/jlpt/group3_verb_data.json',
        defaultForm: '현재형',
        screenId: 'group3VerbScreen',
        headerId: 'group3VerbHeader',
        displayId: 'verbDisplay',
        itemType: 'verb',
        itemTypeKorean: '동사',
        category: 'Group 3 동사',
        forms: ['현재형', '과거형', '현재 부정형', '과거 부정형', '정중형', '과거 정중형'],
        defaultData: {
            verb: '来る',
            reading: 'くる',
            meaning: '오다',
            group: 3,
            jlpt_level: 'N5'
        }
    },
    iAdjective: {
        dataPath: './data/vocabulary/jlpt/i_adjective_data.json',
        defaultForm: '현재형',
        screenId: 'iAdjectiveScreen',
        headerId: 'iAdjectiveHeader',
        displayId: 'adjectiveDisplay',
        itemType: 'adjective',
        itemTypeKorean: 'い형용사',
        category: 'い형용사',
        forms: ['현재형', '과거형', '현재 부정형', '과거 부정형', '정중형', '과거 정중형'],
        defaultData: {
            adjective: '大きい',
            stem: '大き',
            reading: 'おおき',
            meaning: '크다',
            conjugations: {
                '현재형': {
                    form: '大きい',
                    reading: 'おおきい',
                    translation: '크다',
                    example: 'この部屋は大きいです。',
                    exampleReading: 'このへやはおおきいです。',
                    exampleTranslation: '이 방은 큽니다.'
                }
            }
        }
    },
    naAdjective: {
        dataPath: './data/vocabulary/jlpt/na_adjective_data.json',
        defaultForm: '현재형',
        screenId: 'naAdjectiveScreen',
        headerId: 'naAdjectiveHeader',
        displayId: 'adjectiveDisplay',
        itemType: 'adjective',
        itemTypeKorean: 'な형용사',
        category: 'な형용사',
        forms: ['현재형', '과거형', '현재 부정형', '과거 부정형', '정중형', '과거 정중형'],
        defaultData: {
            adjective: '静か',
            stem: '静か',
            reading: 'しずか',
            meaning: '조용하다',
            conjugations: {
                '현재형': {
                    form: '静かだ',
                    reading: 'しずかだ',
                    translation: '조용하다',
                    example: 'この図書館は静かです。',
                    exampleReading: 'このとしょかんはしずかです。',
                    exampleTranslation: '이 도서관은 조용합니다.'
                }
            }
        }
    },
    nounForms: {
        dataPath: './data/vocabulary/jlpt/jlpt_n5_words_unified.json',
        defaultForm: '현재형',
        screenId: 'nounFormsScreen',
        headerId: 'nounFormsHeader',
        displayId: 'nounDisplay',
        itemType: 'noun',
        itemTypeKorean: '명사',
        category: '명사 활용',
        forms: ['현재형', '과거형', '현재 부정형', '과거 부정형'],
        defaultData: {
            hanja: '学生',
            hiragana: 'がくせい',
            mean: '학생',
            partOfSpeech: '명사'
        }
    },
    particleStudy: {
        dataPath: './data/vocabulary/jlpt/particle_data.json',
        defaultForm: 'は',
        screenId: 'particleStudyScreen',
        headerId: 'particleStudyHeader',
        displayId: 'particleDisplay',
        itemType: 'particle',
        itemTypeKorean: '조사',
        category: '조사 학습',
        forms: ['は', 'が', 'を', 'に', 'で'],
        defaultData: {
            particle: 'は',
            reading: 'wa',
            meaning: '~는/은 (주제 표시)',
            usage: '주제를 나타내는 조사',
            jlpt_level: 'N5'
        }
    },
    nounConjugation: {
        dataPath: './data/vocabulary/jlpt/jlpt_n5_words_unified.json',
        defaultForm: '기본형',
        screenId: 'nounConjugationScreen',
        headerId: 'nounConjugationHeader',
        displayId: 'nounConjugationDisplay',
        itemType: 'nounConjugation',
        itemTypeKorean: '명사',
        category: '명사 변화',
        forms: ['기본형', '복수형', '정중형', '높임형'],
        defaultData: {
            hanja: '先生',
            hiragana: 'せんせい',
            mean: '선생님',
            partOfSpeech: '명사'
        }
    }
};

// BaseGrammarApp 클래스
window.GrammarShared.BaseGrammarApp = class BaseGrammarApp {
    constructor(config) {
        this.config = config;
        this.data = null;
        this.currentIndex = 0;
        this.selectedForm = config.defaultForm || '현재형';
        this.savedScrollTop = undefined;
        this.clickHandler = null;
        this.keyHandler = null;

        // 설정 검증
        this.validateConfig(config);

        // 초기화
        this.init();
    }

    validateConfig(config) {
        const required = ['dataPath', 'screenId', 'displayId', 'itemType'];
        for (const key of required) {
            if (!config[key]) {
                throw new Error(`BaseGrammarApp: Required config property '${key}' is missing`);
            }
        }
    }

    async init() {
        try {
            await this.loadData();
            this.initializeUI();
            this.bindEvents();
            this.hideHeader();
            this.updateDisplay(); // 초기 화면 표시
        } catch (error) {
            console.error(`${this.config.itemType} 앱 초기화 실패:`, error);
            this.setupDefaultData();
            this.initializeUI();
            this.bindEvents();
            this.hideHeader();
            this.updateDisplay(); // 초기 화면 표시
        }
    }

    async loadData() {
        try {
            const response = await fetch(this.config.dataPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const jsonData = await response.json();

            // 문법 데이터 구조 처리: examples 배열을 사용하거나 JLPT 데이터 필터링
            if (jsonData.length > 0 && jsonData[0].examples) {
                // 동사/형용사 특정 데이터 구조
                this.data = jsonData[0].examples;
            } else if (Array.isArray(jsonData) && jsonData.some(item => item.partOfSpeech)) {
                // JLPT 통합 데이터에서 필터링
                this.data = jsonData.filter(item =>
                    item.partOfSpeech === this.config.itemTypeKorean ||
                    (this.config.itemType === 'nounConjugation' && item.partOfSpeech === '명사')
                );
            } else {
                // 일반 배열 데이터
                this.data = jsonData;
            }
        } catch (error) {
            console.error(`데이터 로드 실패 (${this.config.dataPath}):`, error);
            throw error;
        }
    }

    setupDefaultData() {
        throw new Error('setupDefaultData() must be implemented by subclass');
    }

    initializeUI() {
        this.createFormSelector();
        this.createDisplay();
        this.bindModalEvents();
    }

    hideHeader() {
        // 문법 화면에서는 헤더를 숨기지 않음 - 네비게이션을 위해 필요
        // const header = document.querySelector('header');
        // if (header) {
        //     header.style.display = 'none';
        // }
    }

    createFormSelector() {
        throw new Error('createFormSelector() must be implemented by subclass');
    }

    createDisplay() {
        throw new Error('createDisplay() must be implemented by subclass');
    }

    updateDisplay() {
        throw new Error('updateDisplay() must be implemented by subclass');
    }

    bindEvents() {
        this.bindKeyboardEvents();
        this.bindSwipeEvents();
    }

    bindKeyboardEvents() {
        this.keyHandler = (e) => {
            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.showPrevious();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.showNext();
                    break;
            }
        };

        document.addEventListener('keydown', this.keyHandler);
    }

    bindSwipeEvents() {
        const displayElement = document.getElementById(this.config.displayId);
        if (displayElement) {
            // 왼쪽/오른쪽 터치로 단어 이동 (스와이프 아님)
            this.bindTapNavigation(displayElement);
        }

        // 전체 화면에서 뒤로가기 스와이프만
        const screenElement = document.getElementById(this.config.screenId);
        if (screenElement) {
            window.GrammarShared.TouchManager.bindBackSwipe(
                screenElement,
                () => this.goBack(),
                {
                    threshold: 50,
                    minStartX: window.innerWidth * 0.8
                }
            );
        }
    }

    bindTapNavigation(element) {
        element.addEventListener('click', (e) => {
            const rect = element.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const centerX = rect.width / 2;

            if (clickX < centerX) {
                // 왼쪽 터치 - 이전 단어
                this.showPrevious();
            } else {
                // 오른쪽 터치 - 다음 단어
                this.showNext();
            }
        });

        // 터치 이벤트도 동일하게 처리
        element.addEventListener('touchend', (e) => {
            e.preventDefault(); // 클릭 이벤트 중복 방지

            const rect = element.getBoundingClientRect();
            const touch = e.changedTouches[0];
            const touchX = touch.clientX - rect.left;
            const centerX = rect.width / 2;

            if (touchX < centerX) {
                // 왼쪽 터치 - 이전 단어
                this.showPrevious();
            } else {
                // 오른쪽 터치 - 다음 단어
                this.showNext();
            }
        });
    }

    bindModalEvents() {
        window.GrammarShared.ModalManager.bindModalEvents('infoModal', () => this.closeInfoModal());
    }

    closeInfoModal() {
        window.GrammarShared.ModalManager.closeModal('infoModal');
    }

    goBack() {
        // 뒤로가기 기능 - 서브클래스에서 오버라이드 가능
        if (window.threeStepNavigation) {
            window.threeStepNavigation.showScreen('sub');
        }
    }

    showPrevious() {
        if (!this.data || this.data.length === 0) return;

        this.currentIndex = this.currentIndex > 0 ? this.currentIndex - 1 : this.data.length - 1;
        this.updateDisplay();
    }

    showNext() {
        if (!this.data || this.data.length === 0) return;

        this.currentIndex = this.currentIndex < this.data.length - 1 ? this.currentIndex + 1 : 0;
        this.updateDisplay();
    }

    selectForm(formType) {
        this.selectedForm = formType;
        this.updateFormSelector();
        this.updateDisplay();
    }

    updateFormSelector() {
        throw new Error('updateFormSelector() must be implemented by subclass');
    }

    updateDisplay() {
        throw new Error('updateDisplay() must be implemented by subclass');
    }

    openInfoModal() {
        window.GrammarShared.ModalManager.openModal('infoModal');
    }

    closeInfoModal() {
        window.GrammarShared.ModalManager.closeModal('infoModal');
    }

    goBack() {
        if (window.navigation && window.navigation.showScreen) {
            window.navigation.showScreen('home');
        } else {
            window.history.back();
        }
    }

    getCurrentItem() {
        if (!this.data || this.data.length === 0) return null;
        return this.data[this.currentIndex];
    }

    getIndexInfo() {
        return {
            current: this.currentIndex + 1,
            total: this.data ? this.data.length : 0
        };
    }

    highlightText(text, target, className = 'highlight') {
        if (!target || !text.includes(target)) return text;
        return text.replace(new RegExp(target, 'g'), `<span class="${className}">${target}</span>`);
    }

    cleanup() {
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
            this.keyHandler = null;
        }

        if (this.clickHandler) {
            document.removeEventListener('click', this.clickHandler);
            this.clickHandler = null;
        }
    }

    destroy() {
        this.cleanup();

        // 헤더 복원
        const header = document.querySelector('header');
        if (header) {
            header.style.display = '';
        }
    }
};