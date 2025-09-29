/**
 * Noun Forms Learning App - 명사 활용 학습 (리팩토링 버전)
 *
 * 특징:
 * - BaseGrammarApp을 상속받아 중복 코드 제거
 * - 명사의 4가지 활용형 학습 (です/である → じゃありません, でした, じゃありませんでした)
 * - 실제 예문을 통한 학습
 * - 컴팩트한 인터페이스
 * - 터치 네비게이션
 */

import { BaseGrammarApp } from '../shared/base-grammar-app.js';
import { getModuleConfig } from '../shared/module-configs.js';

class NounFormsApp extends BaseGrammarApp {
    constructor() {
        const config = getModuleConfig('nounForms');
        super(config);

        this.nounData = null; // BaseGrammarApp의 data와 동일하지만 명확성을 위해 유지
    }

    /**
     * 기본 데이터 설정 (데이터 로드 실패 시 사용)
     */
    setupDefaultData() {
        this.data = this.nounData = [this.config.defaultData];
    }

    /**
     * 데이터 로드 후 처리
     */
    async loadData() {
        await super.loadData();
        this.nounData = this.data;
    }

    /**
     * 폼 선택기 생성
     */
    createFormSelector() {
        const formSelector = document.getElementById('formSelector');
        if (!formSelector) return;

        const forms = this.config.forms;
        formSelector.innerHTML = `
            <div class="form-selector">
                <div class="selector-header">
                    <h3>활용 형태 선택</h3>
                    <button class="info-modal-btn" onclick="window.nounFormsApp.openInfoModal()">
                        <span class="info-icon">ℹ️</span>
                        <span class="info-text">설명</span>
                    </button>
                </div>
                <div class="form-buttons">
                    ${forms.map(form => `
                        <button class="form-btn ${form === this.selectedForm ? 'active' : ''}"
                                data-form="${form}">
                            <div class="form-name">${form}</div>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        // 폼 선택 이벤트 바인딩
        formSelector.addEventListener('click', (e) => {
            if (e.target.classList.contains('form-btn') || e.target.closest('.form-btn')) {
                const btn = e.target.classList.contains('form-btn') ? e.target : e.target.closest('.form-btn');
                this.selectForm(btn.dataset.form);
            }
        });
    }

    /**
     * 명사 디스플레이 생성
     */
    createDisplay() {
        this.createNounDisplay();
    }

    /**
     * 명사 디스플레이 생성
     */
    createNounDisplay() {
        if (!this.nounData || this.nounData.length === 0) {
            const display = document.getElementById(this.config.displayId);
            if (display) {
                display.innerHTML = '<p>명사 데이터를 불러올 수 없습니다.</p>';
            }
            return;
        }

        const noun = this.getCurrentItem();
        if (!noun) return;

        const display = document.getElementById(this.config.displayId);
        if (!display) return;

        const indexInfo = this.getIndexInfo();
        const conjugatedForm = this.getConjugatedForm(noun, this.selectedForm);

        display.innerHTML = `
            <div class="noun-container">
                <div class="noun-counter">
                    ${indexInfo.current} / ${indexInfo.total}
                </div>

                <div class="noun-main">
                    <div class="noun-original">
                        <span class="noun-text">${noun.noun}</span>
                        <span class="noun-reading">${noun.reading}</span>
                    </div>

                    <div class="noun-meaning">
                        ${noun.meaning}
                    </div>

                    <div class="noun-conjugated">
                        <div class="form-label">${this.selectedForm}</div>
                        <div class="conjugated-form">${conjugatedForm}</div>
                    </div>

                    ${noun.example ? `
                        <div class="noun-example">
                            <div class="example-label">예문</div>
                            <div class="example-text">
                                ${this.highlightText(noun.example, conjugatedForm, 'highlight')}
                            </div>
                            ${noun.example_meaning ? `
                                <div class="example-meaning">${noun.example_meaning}</div>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>

                <div class="noun-info">
                    <button class="info-btn" onclick="window.nounFormsApp.openInfoModal()">
                        ℹ️ 활용 정보
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * 명사 활용형 생성
     * @param {Object} noun - 명사 객체
     * @param {string} formType - 활용형 타입
     * @returns {string} - 활용된 명사
     */
    getConjugatedForm(noun, formType) {
        if (!noun || !noun.noun) return '';

        const nounStem = noun.noun; // 명사는 어간이 그대로

        switch (formType) {
            case '현재형':
                return nounStem + 'です'; // 기본형

            case '과거형':
                return nounStem + 'でした';

            case '현재 부정형':
                return nounStem + 'じゃありません';

            case '과거 부정형':
                return nounStem + 'じゃありませんでした';

            default:
                return nounStem + 'です';
        }
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
        this.createNounDisplay();
    }
}

// DOM이 로드된 후 앱 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.nounFormsApp = new NounFormsApp();
    });
} else {
    window.nounFormsApp = new NounFormsApp();
}