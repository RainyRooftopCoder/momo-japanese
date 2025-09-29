/**
 * Group1 Verb Conjugation App - 1그룹동사 활용 학습 (리팩토링 버전)
 *
 * 특징:
 * - BaseGrammarApp을 상속받아 중복 코드 제거
 * - 1그룹동사(う동사)의 6가지 활용형 학습
 * - 실제 예문을 통한 학습
 * - 컴팩트한 인터페이스
 * - 터치 네비게이션
 */

import { BaseGrammarApp } from '../shared/base-grammar-app.js';
import { getModuleConfig } from '../shared/module-configs.js';

class Group1VerbApp extends BaseGrammarApp {
    constructor() {
        const config = getModuleConfig('group1Verb');
        super(config);

        this.verbData = null; // BaseGrammarApp의 data와 동일하지만 명확성을 위해 유지
    }

    /**
     * 기본 데이터 설정 (데이터 로드 실패 시 사용)
     */
    setupDefaultData() {
        this.data = this.verbData = [this.config.defaultData];
    }

    /**
     * 데이터 로드 후 처리
     */
    async loadData() {
        await super.loadData();
        this.verbData = this.data;
    }

    /**
     * 폼 선택기 생성
     */
    createFormSelector() {
        const formSelector = document.getElementById('formSelector');
        if (!formSelector) return;

        const forms = this.config.forms;
        formSelector.innerHTML = forms.map(form => {
            const isActive = form === this.selectedForm ? 'active' : '';
            return `<button class="form-btn ${isActive}" data-form="${form}">${form}</button>`;
        }).join('');

        // 폼 선택 이벤트 바인딩
        formSelector.addEventListener('click', (e) => {
            if (e.target.classList.contains('form-btn')) {
                this.selectForm(e.target.dataset.form);
            }
        });
    }

    /**
     * 동사 디스플레이 생성
     */
    createDisplay() {
        this.createVerbDisplay();
    }

    /**
     * 동사 디스플레이 생성
     */
    createVerbDisplay() {
        if (!this.verbData || this.verbData.length === 0) {
            const display = document.getElementById(this.config.displayId);
            if (display) {
                display.innerHTML = '<p>동사 데이터를 불러올 수 없습니다.</p>';
            }
            return;
        }

        const verb = this.getCurrentItem();
        if (!verb) return;

        const display = document.getElementById(this.config.displayId);
        if (!display) return;

        const indexInfo = this.getIndexInfo();
        const conjugatedForm = this.getConjugatedForm(verb, this.selectedForm);

        display.innerHTML = `
            <div class="verb-container">
                <div class="verb-counter">
                    ${indexInfo.current} / ${indexInfo.total}
                </div>

                <div class="verb-main">
                    <div class="verb-original">
                        <span class="verb-text">${verb.verb}</span>
                        <span class="verb-reading">${verb.reading}</span>
                    </div>

                    <div class="verb-meaning">
                        ${verb.meaning}
                    </div>

                    <div class="verb-conjugated">
                        <div class="form-label">${this.selectedForm}</div>
                        <div class="conjugated-form">${conjugatedForm}</div>
                    </div>

                    ${verb.example ? `
                        <div class="verb-example">
                            <div class="example-label">예문</div>
                            <div class="example-text">
                                ${this.highlightText(verb.example, conjugatedForm, 'highlight')}
                            </div>
                            ${verb.example_meaning ? `
                                <div class="example-meaning">${verb.example_meaning}</div>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>

                <div class="verb-info">
                    <button class="info-btn" onclick="window.group1VerbApp.openInfoModal()">
                        ℹ️ 활용 정보
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * 1그룹동사 활용형 생성
     * @param {Object} verb - 동사 객체
     * @param {string} formType - 활용형 타입
     * @returns {string} - 활용된 동사
     */
    getConjugatedForm(verb, formType) {
        if (!verb || !verb.verb) return '';

        const verbStem = verb.verb.slice(0, -1); // 마지막 문자 제거하여 어간 추출
        const ending = verb.verb.slice(-1); // 마지막 문자 (う단 동사의 어미)

        switch (formType) {
            case '현재형':
                return verb.verb; // 원형

            case '과거형':
                return this.getPastForm(verbStem, ending);

            case '현재 부정형':
                return this.getNegativeForm(verbStem, ending);

            case '과거 부정형':
                return this.getPastNegativeForm(verbStem, ending);

            case '정중형':
                return this.getPoliteForm(verbStem, ending);

            case '과거 정중형':
                return this.getPastPoliteForm(verbStem, ending);

            default:
                return verb.verb;
        }
    }

    /**
     * 과거형 생성
     */
    getPastForm(stem, ending) {
        const pastEndings = {
            'う': 'った', 'つ': 'った', 'る': 'った',
            'む': 'んだ', 'ぶ': 'んだ', 'ぬ': 'んだ',
            'く': 'いた', 'ぐ': 'いだ',
            'す': 'した'
        };
        return stem + (pastEndings[ending] || 'った');
    }

    /**
     * 부정형 생성
     */
    getNegativeForm(stem, ending) {
        const negativeEndings = {
            'う': 'わない', 'つ': 'たない', 'る': 'らない',
            'む': 'まない', 'ぶ': 'ばない', 'ぬ': 'なない',
            'く': 'かない', 'ぐ': 'がない', 'す': 'さない'
        };
        return stem + (negativeEndings[ending] || 'わない');
    }

    /**
     * 과거 부정형 생성
     */
    getPastNegativeForm(stem, ending) {
        return this.getNegativeForm(stem, ending).replace('ない', 'なかった');
    }

    /**
     * 정중형 생성
     */
    getPoliteForm(stem, ending) {
        const politeEndings = {
            'う': 'います', 'つ': 'ちます', 'る': 'ります',
            'む': 'みます', 'ぶ': 'びます', 'ぬ': 'にます',
            'く': 'きます', 'ぐ': 'ぎます', 'す': 'します'
        };
        return stem + (politeEndings[ending] || 'います');
    }

    /**
     * 과거 정중형 생성
     */
    getPastPoliteForm(stem, ending) {
        return this.getPoliteForm(stem, ending).replace('ます', 'ました');
    }

    /**
     * 폼 선택기 업데이트
     */
    updateFormSelector() {
        const formButtons = document.querySelectorAll('.form-btn');
        formButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.form === this.selectedForm);
        });
    }

    /**
     * 디스플레이 업데이트
     */
    updateDisplay() {
        this.createVerbDisplay();
    }
}

// DOM이 로드된 후 앱 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.group1VerbApp = new Group1VerbApp();
    });
} else {
    window.group1VerbApp = new Group1VerbApp();
}