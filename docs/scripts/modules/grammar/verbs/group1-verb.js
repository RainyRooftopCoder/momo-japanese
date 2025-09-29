/**
 * Group1 Verb Conjugation App - 1그룹동사 활용 학습 (글로벌 버전)
 *
 * 특징:
 * - BaseGrammarApp을 상속받아 중복 코드 제거
 * - 1그룹동사(う동사)의 6가지 활용형 학습
 * - 실제 예문을 통한 학습
 * - 컴팩트한 인터페이스
 * - 터치 네비게이션
 */

class Group1VerbApp extends window.GrammarShared.BaseGrammarApp {
    constructor() {
        const config = window.GrammarShared.MODULE_CONFIGS.group1Verb;
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
            う: 'った',
            つ: 'った',
            る: 'った',
            む: 'んだ',
            ぶ: 'んだ',
            ぬ: 'んだ',
            く: 'いた',
            ぐ: 'いだ',
            す: 'した',
        };
        return stem + (pastEndings[ending] || 'った');
    }

    /**
     * 부정형 생성
     */
    getNegativeForm(stem, ending) {
        const negativeEndings = {
            う: 'わない',
            つ: 'たない',
            る: 'らない',
            む: 'まない',
            ぶ: 'ばない',
            ぬ: 'なない',
            く: 'かない',
            ぐ: 'がない',
            す: 'さない',
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
            う: 'います',
            つ: 'ちます',
            る: 'ります',
            む: 'みます',
            ぶ: 'びます',
            ぬ: 'にます',
            く: 'きます',
            ぐ: 'ぎます',
            す: 'します',
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
        return verbText ? verbText.slice(0, -1) : '';
    }

    /**
     * 형태별 어미 변화 가져오기
     */
    getEndingForForm(verb, formType) {
        const verbText = verb.verb;
        if (!verbText) return '';

        const baseEnding = verbText.slice(-1);

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
     * 형태 설명 가져오기
     */
    getFormDescription(formType) {
        const descriptions = {
            현재형: '기본형으로 현재나 미래를 나타냄',
            과거형: '과거의 동작이나 상태를 나타냄',
            부정형: '동작의 부정을 나타냄',
            과거부정형: '과거의 부정을 나타냄',
            ます형: '정중한 표현으로 존댓말',
            て형: '연결형, 진행형, 명령형 등에 사용',
        };
        return descriptions[formType] || '1그룹동사의 활용형';
    }

    /**
     * 활용형 읽기 생성
     */
    getConjugatedReading(verb, formType) {
        const reading = verb.reading || verb.hiragana;
        if (!reading) return '';

        const stem = reading.slice(0, -1);
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
        window.group1VerbApp = new Group1VerbApp();
    });
} else {
    window.group1VerbApp = new Group1VerbApp();
}
