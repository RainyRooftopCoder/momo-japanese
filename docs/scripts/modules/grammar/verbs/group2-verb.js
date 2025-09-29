/**
 * Group2 Verb Conjugation App - 2그룹동사 활용 학습 (글로벌 버전)
 *
 * 특징:
 * - BaseGrammarApp을 상속받아 중복 코드 제거
 * - 2그룹동사(る동사)의 6가지 활용형 학습
 * - 실제 예문을 통한 학습
 * - 컴팩트한 인터페이스
 * - 터치 네비게이션
 */

class Group2VerbApp extends window.GrammarShared.BaseGrammarApp {
    constructor() {
        const config = window.GrammarShared.MODULE_CONFIGS.group2Verb;
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
        const conjugationData = verb.conjugations[this.selectedForm];

        if (!conjugationData) {
            display.innerHTML = '<p>해당 활용형 데이터가 없습니다.</p>';
            return;
        }

        display.innerHTML = `
            <div class="verb-display">
                <div class="verb-counter">${indexInfo.current} / ${indexInfo.total}</div>

                <div class="verb-info">
                    <div class="verb-main">
                        <span class="verb-kanji">${verb.verb}</span>
                        <span class="verb-reading">${verb.reading}</span>
                    </div>
                    <div class="verb-meaning">${verb.meaning}</div>
                    <div class="verb-group">${verb.group}</div>
                </div>

                <div class="form-explanation">
                    <h4>${this.selectedForm}</h4>
                    <p>${this.getFormDescription(this.selectedForm)}</p>
                </div>

                <div class="conjugation-display">
                    <div class="conjugation-result">
                        <div class="stem-breakdown">
                            <span class="stem-part">${verb.stem}</span>
                            <span class="ending-part">${this.getEndingForForm(verb, this.selectedForm)}</span>
                            <span class="arrow">→</span>
                            <span class="result-part">${conjugationData.form}</span>
                        </div>

                        <div class="result-info">
                            <div class="result-reading">${conjugationData.reading}</div>
                            <div class="result-translation">${conjugationData.translation}</div>
                        </div>
                    </div>

                    <div class="example-sentence">
                        <div class="sentence-card">
                            <div class="sentence-japanese">${this.highlightConjugation(
                                conjugationData.example,
                                conjugationData.form
                            )}</div>
                            <div class="sentence-reading">${conjugationData.exampleReading}</div>
                            <div class="sentence-translation">${conjugationData.exampleTranslation}</div>
                        </div>
                    </div>
                </div>

            </div>
        `;
    }

    /**
     * 2그룹동사 활용형 생성
     * @param {Object} verb - 동사 객체
     * @param {string} formType - 활용형 타입
     * @returns {string} - 활용된 동사
     */
    getConjugatedForm(verb, formType) {
        if (!verb || !verb.verb) return '';

        // 2그룹 동사는 る를 제거하여 어간 추출
        const verbStem = verb.verb.endsWith('る') ? verb.verb.slice(0, -1) : verb.verb;

        switch (formType) {
            case '현재형':
                return verb.verb; // 원형

            case '과거형':
                return verbStem + 'た';

            case '현재 부정형':
                return verbStem + 'ない';

            case '과거 부정형':
                return verbStem + 'なかった';

            case '정중형':
                return verbStem + 'ます';

            case '과거 정중형':
                return verbStem + 'ました';

            default:
                return verb.verb;
        }
    }

    /**
     * 폼 선택기 업데이트
     */
    updateFormSelector() {
        const formButtons = document.querySelectorAll('.form-btn');
        formButtons.forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.form === this.selectedForm);
        });
    }

    /**
     * 디스플레이 업데이트
     */
    updateDisplay() {
        this.createVerbDisplay();
    }

    /**
     * 동사 어간 추출
     */
    getVerbStem(verb) {
        const verbText = verb.verb || verb.hanja;
        return verbText && verbText.endsWith('る') ? verbText.slice(0, -1) : verbText;
    }

    /**
     * 형태별 어미 변화 가져오기
     */
    getEndingForForm(verb, formType) {
        const verbText = verb.verb;
        if (!verbText) return '';

        switch (formType) {
            case '현재형':
                return 'る';
            case '과거형':
                return 'た';
            case '현재 부정형':
                return 'ない';
            case '과거 부정형':
                return 'なかった';
            case '정중형':
                return 'ます';
            case '과거 정중형':
                return 'ました';
            default:
                return 'る';
        }
    }

    /**
     * 형태 설명 가져오기
     */
    getFormDescription(formType) {
        const descriptions = {
            현재형: '기본형으로 현재나 미래를 나타냄',
            과거형: '과거의 동작이나 상태를 나타냄',
            '현재 부정형': '동작의 부정을 나타냄',
            '과거 부정형': '과거의 부정을 나타냄',
            정중형: '정중한 표현으로 존댓말',
            '과거 정중형': '정중한 과거 표현',
        };
        return descriptions[formType] || '2그룹동사의 활용형';
    }

    /**
     * 활용형 읽기 생성
     */
    getConjugatedReading(verb, formType) {
        const reading = verb.reading || verb.hiragana;
        if (!reading) return '';

        const stem = reading.endsWith('る') ? reading.slice(0, -1) : reading;
        return stem + this.getEndingForForm(verb, formType);
    }

    /**
     * 활용형 의미 생성
     */
    getConjugatedMeaning(verb, formType) {
        const baseMeaning = verb.meaning || verb.mean;
        const formMeanings = {
            현재형: baseMeaning,
            과거형: baseMeaning + '했다',
            '현재 부정형': baseMeaning + '하지 않다',
            '과거 부정형': baseMeaning + '하지 않았다',
            정중형: baseMeaning + '합니다',
            '과거 정중형': baseMeaning + '했습니다',
        };
        return formMeanings[formType] || baseMeaning;
    }

    /**
     * 예문 생성
     */
    generateExample(verb, conjugatedForm) {
        return `${conjugatedForm}。`;
    }

    /**
     * 예문 읽기 생성
     */
    generateExampleReading(verb, conjugatedForm) {
        return `${this.getConjugatedReading(verb, this.selectedForm)}。`;
    }

    /**
     * 예문 의미 생성
     */
    generateExampleMeaning(verb, conjugatedForm) {
        return `${this.getConjugatedMeaning(verb, this.selectedForm)}.`;
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
        window.group2VerbApp = new Group2VerbApp();
    });
} else {
    window.group2VerbApp = new Group2VerbApp();
}