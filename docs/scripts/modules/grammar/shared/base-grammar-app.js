/**
 * Base Grammar App - 문법 학습 앱의 공통 기본 클래스
 * 모든 문법 학습 앱 (동사, 형용사, 명사, 조사)에서 상속받아 사용
 */

import { ModalManager } from './modal-manager.js';
import { TouchManager } from './touch-manager.js';

export class BaseGrammarApp {
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

    /**
     * 설정 검증
     * @param {Object} config - 앱 설정
     */
    validateConfig(config) {
        const required = ['dataPath', 'screenId', 'displayId', 'itemType'];
        for (const key of required) {
            if (!config[key]) {
                throw new Error(`BaseGrammarApp: Required config property '${key}' is missing`);
            }
        }
    }

    /**
     * 앱 초기화
     */
    async init() {
        try {
            await this.loadData();
            this.initializeUI();
            this.bindEvents();
            this.hideHeader();
        } catch (error) {
            console.error(`${this.config.itemType} 앱 초기화 실패:`, error);
            this.setupDefaultData();
            this.initializeUI();
            this.bindEvents();
            this.hideHeader();
        }
    }

    /**
     * 데이터 로드 (서브클래스에서 구현)
     */
    async loadData() {
        try {
            const response = await fetch(this.config.dataPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.data = await response.json();
        } catch (error) {
            console.error(`데이터 로드 실패 (${this.config.dataPath}):`, error);
            throw error;
        }
    }

    /**
     * 기본 데이터 설정 (서브클래스에서 구현)
     */
    setupDefaultData() {
        throw new Error('setupDefaultData() must be implemented by subclass');
    }

    /**
     * UI 초기화
     */
    initializeUI() {
        this.createFormSelector();
        this.createDisplay();
        this.bindModalEvents();
    }

    /**
     * 헤더 숨기기
     */
    hideHeader() {
        const header = document.querySelector('header');
        if (header) {
            header.style.display = 'none';
        }
    }

    /**
     * 폼 선택기 생성 (서브클래스에서 구현)
     */
    createFormSelector() {
        throw new Error('createFormSelector() must be implemented by subclass');
    }

    /**
     * 디스플레이 생성 (서브클래스에서 구현)
     */
    createDisplay() {
        throw new Error('createDisplay() must be implemented by subclass');
    }

    /**
     * 이벤트 바인딩
     */
    bindEvents() {
        this.bindKeyboardEvents();
        this.bindSwipeEvents();
    }

    /**
     * 키보드 이벤트 바인딩
     */
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

    /**
     * 스와이프 이벤트 바인딩
     */
    bindSwipeEvents() {
        const screenElement = document.getElementById(this.config.screenId);
        if (screenElement) {
            TouchManager.bindNavigationSwipe(
                screenElement,
                () => this.showPrevious(), // 우측 스와이프 - 이전
                () => this.showNext(),     // 좌측 스와이프 - 다음
                {
                    threshold: 50,
                    maxVerticalDistance: 100,
                    maxTime: 300
                }
            );

            // 뒤로가기 스와이프 (우측에서 시작하는 스와이프)
            TouchManager.bindBackSwipe(
                screenElement,
                () => this.goBack(),
                {
                    threshold: 50,
                    minStartX: window.innerWidth * 0.8 // 화면 우측 20% 영역에서 시작
                }
            );
        }
    }

    /**
     * 모달 이벤트 바인딩
     */
    bindModalEvents() {
        ModalManager.bindModalEvents('infoModal', () => this.closeInfoModal());
    }

    /**
     * 이전 항목 표시
     */
    showPrevious() {
        if (!this.data || this.data.length === 0) return;

        this.currentIndex = this.currentIndex > 0 ? this.currentIndex - 1 : this.data.length - 1;
        this.updateDisplay();
    }

    /**
     * 다음 항목 표시
     */
    showNext() {
        if (!this.data || this.data.length === 0) return;

        this.currentIndex = this.currentIndex < this.data.length - 1 ? this.currentIndex + 1 : 0;
        this.updateDisplay();
    }

    /**
     * 폼 선택
     * @param {string} formType - 선택할 폼 타입
     */
    selectForm(formType) {
        this.selectedForm = formType;
        this.updateFormSelector();
        this.updateDisplay();
    }

    /**
     * 폼 선택기 업데이트 (서브클래스에서 구현)
     */
    updateFormSelector() {
        throw new Error('updateFormSelector() must be implemented by subclass');
    }

    /**
     * 디스플레이 업데이트 (서브클래스에서 구현)
     */
    updateDisplay() {
        throw new Error('updateDisplay() must be implemented by subclass');
    }

    /**
     * 정보 모달 열기
     */
    openInfoModal() {
        ModalManager.openModal('infoModal');
    }

    /**
     * 정보 모달 닫기
     */
    closeInfoModal() {
        ModalManager.closeModal('infoModal');
    }

    /**
     * 뒤로가기
     */
    goBack() {
        if (window.navigation && window.navigation.showScreen) {
            window.navigation.showScreen('home');
        } else {
            window.history.back();
        }
    }

    /**
     * 현재 항목 가져오기
     */
    getCurrentItem() {
        if (!this.data || this.data.length === 0) return null;
        return this.data[this.currentIndex];
    }

    /**
     * 인덱스 정보 가져오기
     */
    getIndexInfo() {
        return {
            current: this.currentIndex + 1,
            total: this.data ? this.data.length : 0
        };
    }

    /**
     * 텍스트 하이라이트
     * @param {string} text - 전체 텍스트
     * @param {string} target - 하이라이트할 부분
     * @param {string} className - 하이라이트 CSS 클래스명
     */
    highlightText(text, target, className = 'highlight') {
        if (!target || !text.includes(target)) return text;
        return text.replace(new RegExp(target, 'g'), `<span class="${className}">${target}</span>`);
    }

    /**
     * 정리 작업 (메모리 누수 방지)
     */
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

    /**
     * 소멸자 (앱 교체 시 호출)
     */
    destroy() {
        this.cleanup();

        // 헤더 복원
        const header = document.querySelector('header');
        if (header) {
            header.style.display = '';
        }
    }
}