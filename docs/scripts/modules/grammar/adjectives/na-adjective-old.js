/**
 * Na-Adjective Conjugation App - な형용사 활용 학습 (리팩토링 버전)
 *
 * 특징:
 * - BaseGrammarApp을 상속받아 중복 코드 제거
 * - な형용사의 4가지 활용형 학습
 * - 실제 예문을 통한 학습
 * - 컴팩트한 인터페이스
 * - 터치 네비게이션
 */

import { BaseGrammarApp } from '../shared/base-grammar-app.js';
import { getModuleConfig } from '../shared/module-configs.js';

class NaAdjectiveApp extends BaseGrammarApp {
    constructor() {
        const config = getModuleConfig('naAdjective');
        super(config);

        this.adjectiveData = null; // BaseGrammarApp의 data와 동일하지만 명확성을 위해 유지
    }

    /**
     * 기본 데이터 설정 (데이터 로드 실패 시 사용)
     */
    setupDefaultData() {
        this.data = this.adjectiveData = [this.config.defaultData];
    }

    /**
     * 데이터 로드 후 처리
     */
    async loadData() {
        await super.loadData();
        this.adjectiveData = this.data;
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
                    <button class="info-modal-btn" onclick="window.naAdjectiveApp.openInfoModal()">
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
     * 형용사 디스플레이 생성
     */
    createDisplay() {
        this.createAdjectiveDisplay();
    }

    /**
     * 형용사 디스플레이 생성
     */
    createAdjectiveDisplay() {
        if (!this.adjectiveData || this.adjectiveData.length === 0) {
            const display = document.getElementById(this.config.displayId);
            if (display) {
                display.innerHTML = '<p>형용사 데이터를 불러올 수 없습니다.</p>';
            }
            return;
        }

        const adjective = this.getCurrentItem();
        if (!adjective) return;

        const display = document.getElementById(this.config.displayId);
        if (!display) return;

        const indexInfo = this.getIndexInfo();
        const conjugatedForm = this.getConjugatedForm(adjective, this.selectedForm);

        display.innerHTML = `
            <div class="adjective-container">
                <div class="adjective-counter">
                    ${indexInfo.current} / ${indexInfo.total}
                </div>

                <div class="adjective-main">
                    <div class="adjective-original">
                        <span class="adjective-text">${adjective.adjective}</span>
                        <span class="adjective-reading">${adjective.reading}</span>
                    </div>

                    <div class="adjective-meaning">
                        ${adjective.meaning}
                    </div>

                    <div class="adjective-conjugated">
                        <div class="form-label">${this.selectedForm}</div>
                        <div class="conjugated-form">${conjugatedForm}</div>
                    </div>

                    ${adjective.example ? `
                        <div class="adjective-example">
                            <div class="example-label">예문</div>
                            <div class="example-text">
                                ${this.highlightText(adjective.example, conjugatedForm, 'highlight')}
                            </div>
                            ${adjective.example_meaning ? `
                                <div class="example-meaning">${adjective.example_meaning}</div>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>

                <div class="adjective-info">
                    <button class="info-btn" onclick="window.naAdjectiveApp.openInfoModal()">
                        ℹ️ 활용 정보
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * な형용사 활용형 생성
     * @param {Object} adjective - 형용사 객체
     * @param {string} formType - 활용형 타입
     * @returns {string} - 활용된 형용사
     */
    getConjugatedForm(adjective, formType) {
        if (!adjective || !adjective.adjective) return '';

        const adjectiveStem = adjective.adjective; // な형용사는 어간이 그대로

        switch (formType) {
            case '현재형':
                return adjectiveStem + 'だ'; // 기본형

            case '과거형':
                return adjectiveStem + 'だった';

            case '현재 부정형':
                return adjectiveStem + 'じゃない';

            case '과거 부정형':
                return adjectiveStem + 'じゃなかった';

            default:
                return adjectiveStem + 'だ';
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
        this.createAdjectiveDisplay();
    }
}

// DOM이 로드된 후 앱 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.naAdjectiveApp = new NaAdjectiveApp();
    });
} else {
    window.naAdjectiveApp = new NaAdjectiveApp();
}