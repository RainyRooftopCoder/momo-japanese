/**
 * I-Adjective Conjugation App - い형용사 활용 학습 (리팩토링 버전)
 *
 * 특징:
 * - BaseGrammarApp을 상속받아 중복 코드 제거
 * - い형용사의 4가지 활용형 학습
 * - 실제 예문을 통한 학습
 * - 컴팩트한 인터페이스
 * - 터치 네비게이션
 */


class IAdjectiveApp extends window.GrammarShared.BaseGrammarApp {
    constructor() {
        const config = window.GrammarShared.MODULE_CONFIGS.iAdjective;
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
                    ${forms
                        .map(
                            (form) => `
                        <button class="form-btn ${form === this.selectedForm ? 'active' : ''}"
                                data-form="${form}">
                            <div class="form-name">${form}</div>
                        </button>
                    `
                        )
                        .join('')}
                </div>
            </div>
        `;

        formSelector.innerHTML = html;

        // 폼 선택 이벤트 바인딩
        formSelector.addEventListener('click', (e) => {
            if (e.target.classList.contains('form-btn') || e.target.closest('.form-btn')) {
                const btn = e.target.classList.contains('form-btn') ? e.target : e.target.closest('.form-btn');
                this.selectForm(btn.dataset.form);
            } else if (e.target.classList.contains('info-modal-btn') || e.target.closest('.info-modal-btn')) {
                this.openInfoModal();
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
        const conjugationData = adjective.conjugations[this.selectedForm];

        if (!conjugationData) {
            display.innerHTML = '<p>해당 활용형 데이터가 없습니다.</p>';
            return;
        }

        display.innerHTML = `
            <div class="verb-display">
                <div class="verb-counter">${indexInfo.current} / ${indexInfo.total}</div>

                <div class="verb-info">
                    <div class="verb-main">
                        <span class="verb-kanji">${adjective.adjective}</span>
                        <span class="verb-reading">${adjective.reading}</span>
                    </div>
                    <div class="verb-meaning">${adjective.meaning}</div>
                    <div class="verb-group">い형용사</div>
                </div>

                <div class="form-explanation">
                    <h4>${this.selectedForm}</h4>
                    <p>${this.getFormDescription(this.selectedForm)}</p>
                </div>

                <div class="conjugation-display">
                    <div class="conjugation-result">
                        <div class="stem-breakdown">
                            <span class="stem-part">${adjective.stem}</span>
                            <span class="ending-part">${this.getEndingForForm(adjective, this.selectedForm)}</span>
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
     * い형용사 활용형 생성
     * @param {Object} adjective - 형용사 객체
     * @param {string} formType - 활용형 타입
     * @returns {string} - 활용된 형용사
     */
    getConjugatedForm(adjective, formType) {
        if (!adjective || !adjective.adjective) return '';

        const adjectiveText = adjective.adjective;

        // い형용사인지 확인 (い로 끝나는지)
        if (!adjectiveText.endsWith('い')) {
            return adjectiveText; // い형용사가 아니면 원형 반환
        }

        const stem = adjectiveText.slice(0, -1); // い를 제거한 어간

        switch (formType) {
            case '현재형':
                return adjectiveText; // 원형

            case '과거형':
                return stem + 'かった';

            case '현재 부정형':
                return stem + 'くない';

            case '과거 부정형':
                return stem + 'くなかった';

            case '정중형':
                return adjectiveText + 'です';

            case '과거 정중형':
                return stem + 'かったです';

            default:
                return adjectiveText;
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

    /**
     * 형태별 어미 변화 가져오기
     */
    getEndingForForm(adjective, formType) {
        switch (formType) {
            case '현재형':
                return 'い';
            case '현재 부정형':
                return 'くない';
            case '과거형':
                return 'かった';
            case '과거 부정형':
                return 'くなかった';
            case '정중형':
                return 'いです';
            case '과거 정중형':
                return 'かったです';
            default:
                return 'い';
        }
    }

    /**
     * 형태 설명 가져오기
     */
    getFormDescription(formType) {
        const descriptions = {
            '현재형': '기본형으로 현재 상태를 나타냄',
            '현재 부정형': '현재 상태의 부정을 나타냄',
            '과거형': '과거 상태를 나타냄',
            '과거 부정형': '과거 상태의 부정을 나타냄',
            '정중형': '정중한 현재 상태를 나타냄',
            '과거 정중형': '정중한 과거 상태를 나타냄'
        };
        return descriptions[formType] || 'い형용사의 활용형';
    }

    /**
     * 활용형 강조 표시
     */
    highlightConjugation(sentence, conjugatedForm) {
        if (!conjugatedForm || !sentence.includes(conjugatedForm)) {
            return sentence;
        }
        return sentence.replace(new RegExp(conjugatedForm, 'g'), `<span class="highlight">${conjugatedForm}</span>`);
    }

    /**
     * 정보 모달 열기
     */
    openInfoModal() {
        window.GrammarShared.ModalManager.openModal('infoModal');
    }
}

// DOM이 로드된 후 앱 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.iAdjectiveApp = new IAdjectiveApp();
    });
} else {
    window.iAdjectiveApp = new IAdjectiveApp();
}