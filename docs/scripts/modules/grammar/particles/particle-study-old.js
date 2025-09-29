/**
 * Particle Study App - 조사 학습 (리팩토링 버전)
 *
 * 특징:
 * - BaseGrammarApp을 상속받아 중복 코드 제거
 * - 조사별 기능과 사용법 설명
 * - 실제 예문을 통한 학습
 * - 컴팩트한 인터페이스
 * - 터치 네비게이션
 */

import { BaseGrammarApp } from '../shared/base-grammar-app.js';
import { getModuleConfig } from '../shared/module-configs.js';

class ParticleStudyApp extends BaseGrammarApp {
    constructor() {
        const config = getModuleConfig('particleStudy');
        super(config);

        this.particleData = null; // BaseGrammarApp의 data와 동일하지만 명확성을 위해 유지
    }

    /**
     * 기본 데이터 설정 (데이터 로드 실패 시 사용)
     */
    setupDefaultData() {
        this.data = this.particleData = [this.config.defaultData];
    }

    /**
     * 데이터 로드 후 처리
     */
    async loadData() {
        await super.loadData();
        this.particleData = this.data;
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
                    <button class="info-modal-btn" onclick="window.particleStudyApp.openInfoModal()">
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
     * 조사 디스플레이 생성
     */
    createDisplay() {
        this.createParticleDisplay();
    }

    /**
     * 조사 디스플레이 생성
     */
    createParticleDisplay() {
        if (!this.particleData || this.particleData.length === 0) {
            const display = document.getElementById(this.config.displayId);
            if (display) {
                display.innerHTML = '<p>조사 데이터를 불러올 수 없습니다.</p>';
            }
            return;
        }

        const particle = this.getCurrentItem();
        if (!particle) return;

        const display = document.getElementById(this.config.displayId);
        if (!display) return;

        const indexInfo = this.getIndexInfo();
        const usageExample = this.getUsageExample(particle, this.selectedForm);

        display.innerHTML = `
            <div class="particle-container">
                <div class="particle-counter">
                    ${indexInfo.current} / ${indexInfo.total}
                </div>

                <div class="particle-main">
                    <div class="particle-original">
                        <span class="particle-text">${particle.particle}</span>
                        <span class="particle-reading">${particle.reading}</span>
                    </div>

                    <div class="particle-meaning">
                        ${particle.meaning}
                    </div>

                    <div class="particle-usage">
                        <div class="form-label">${this.selectedForm}</div>
                        <div class="usage-description">${particle.usage || '조사의 기본 사용법'}</div>
                        <div class="usage-example">${usageExample}</div>
                    </div>

                    ${particle.example ? `
                        <div class="particle-example">
                            <div class="example-label">예문</div>
                            <div class="example-text">
                                ${this.highlightText(particle.example, particle.particle, 'highlight')}
                            </div>
                            ${particle.example_meaning ? `
                                <div class="example-meaning">${particle.example_meaning}</div>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>

                <div class="particle-info">
                    <button class="info-btn" onclick="window.particleStudyApp.openInfoModal()">
                        ℹ️ 활용 정보
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * 조사 사용 예시 생성
     * @param {Object} particle - 조사 객체
     * @param {string} formType - 사용 예시 타입
     * @returns {string} - 사용 예시
     */
    getUsageExample(particle, formType) {
        if (!particle || !particle.particle) return '';

        const particleName = particle.particle;

        // 간단한 사용 예시들
        const examples = {
            '기본형': `${particleName}의 기본 사용법`,
            '활용예시1': `${particleName}를 사용한 첫 번째 예시`,
            '활용예시2': `${particleName}를 사용한 두 번째 예시`,
            '활용예시3': `${particleName}를 사용한 세 번째 예시`
        };

        return examples[formType] || examples['기본형'];
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
        this.createParticleDisplay();
    }
}

// DOM이 로드된 후 앱 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.particleStudyApp = new ParticleStudyApp();
    });
} else {
    window.particleStudyApp = new ParticleStudyApp();
}