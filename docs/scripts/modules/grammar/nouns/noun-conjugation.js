/**
 * Noun Conjugation App - 명사 활용 학습 (리팩토링 버전)
 *
 * 특징:
 * - BaseGrammarApp을 상속받아 중복 코드 제거
 * - 명사의 다양한 변화형 학습
 * - 실제 예문을 통한 학습
 * - 컴팩트한 인터페이스
 * - 터치 네비게이션
 */


class NounConjugationApp extends window.GrammarShared.BaseGrammarApp {
    constructor() {
        const config = window.GrammarShared.MODULE_CONFIGS.nounConjugation;
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
        // N5 데이터에서 명사만 필터링
        if (this.data && Array.isArray(this.data)) {
            this.nounData = this.data.filter(item =>
                item.partOfSpeech === '명사' ||
                item.partOfSpeech === '대명사'
            ).slice(0, 20); // 처음 20개만 사용
        } else {
            this.nounData = this.data;
        }
        this.data = this.nounData;
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
     * 명사 변화 디스플레이 생성
     */
    createDisplay() {
        this.createNounConjugationDisplay();
    }

    /**
     * 명사 변화 디스플레이 생성
     */
    createNounConjugationDisplay() {
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
            <div class="noun-conjugation-container">
                <div class="noun-counter">
                    ${indexInfo.current} / ${indexInfo.total}
                </div>

                <div class="noun-main">
                    <div class="noun-original">
                        <span class="noun-text">${noun.hanja || noun.noun}</span>
                        <span class="noun-reading">${noun.hiragana || noun.reading}</span>
                    </div>

                    <div class="noun-meaning">
                        ${noun.mean || noun.meaning}
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
                    <button class="info-btn" onclick="window.nounConjugationApp.openInfoModal()">
                        ℹ️ 활용 정보
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * 명사 변화형 생성
     * @param {Object} noun - 명사 객체
     * @param {string} formType - 변화형 타입
     * @returns {string} - 변화된 명사
     */
    getConjugatedForm(noun, formType) {
        if (!noun || !(noun.hanja || noun.noun)) return '';

        const nounText = noun.hanja || noun.noun;

        switch (formType) {
            case '기본형':
                return nounText; // 원형

            case '복수형':
                return this.getPluralForm(noun);

            case '존댓말':
                return this.getHonorificForm(noun);

            case '높임말':
                return this.getRespectfulForm(noun);

            default:
                return nounText;
        }
    }

    /**
     * 복수형 생성
     */
    getPluralForm(noun) {
        const nounText = noun.noun;

        // 일본어에는 일반적인 복수형이 없지만, 일부 명사는 복수 표현이 있음
        const pluralForms = {
            '人': '人たち', // 사람 -> 사람들
            '子供': '子供たち', // 어린이 -> 어린이들
            '学生': '学生たち', // 학생 -> 학생들
            '先生': '先生方', // 선생님 -> 선생님들
            '友達': '友達', // 친구 (복수 같음)
            '本': '本', // 책 (복수 같음)
        };

        return pluralForms[nounText] || nounText;
    }

    /**
     * 존댓말 형성
     */
    getHonorificForm(noun) {
        const nounText = noun.noun;

        // 존댓말 접두사 お/ご 붙이기
        const honorificForms = {
            '名前': 'お名前', // 이름 -> 성함
            '家': 'お宅', // 집 -> 댁
            '金': 'お金', // 돈 -> 돈 (존댓말)
            '時間': 'お時間', // 시간 -> 시간 (존댓말)
            '仕事': 'お仕事', // 일 -> 일 (존댓말)
            '食事': 'お食事', // 식사 -> 식사 (존댓말)
            '勉強': 'ご勉強', // 공부 -> 공부 (존댓말)
            '結婚': 'ご結婚', // 결혼 -> 결혼 (존댓말)
        };

        return honorificForms[nounText] || 'お' + nounText;
    }

    /**
     * 높임말 형성
     */
    getRespectfulForm(noun) {
        const nounText = noun.noun;

        // 높임말 형태
        const respectfulForms = {
            '父': 'お父様', // 아버지 -> 아버님
            '母': 'お母様', // 어머니 -> 어머님
            '先生': '先生', // 선생님 (이미 높임말)
            '社長': '社長', // 사장 (이미 높임말)
            '部長': '部長', // 부장 (이미 높임말)
            '課長': '課長', // 과장 (이미 높임말)
        };

        return respectfulForms[nounText] || nounText + '様';
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
        this.createNounConjugationDisplay();
    }
}

// DOM이 로드된 후 앱 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.nounConjugationApp = new NounConjugationApp();
    });
} else {
    window.nounConjugationApp = new NounConjugationApp();
}