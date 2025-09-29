/**
 * Noun Forms App - 명사 활용 학습 (리팩토링 버전)
 *
 * 특징:
 * - BaseGrammarApp을 상속받아 중복 코드 제거
 * - 명사의 4가지 활용형 학습
 * - 실제 예문을 통한 학습
 * - 컴팩트한 인터페이스
 * - 터치 네비게이션
 */


class NounFormsApp extends window.GrammarShared.BaseGrammarApp {
    constructor() {
        const config = window.GrammarShared.MODULE_CONFIGS.nounForms;
        super(config);

        this.nounData = null; // BaseGrammarApp의 data와 동일하지만 명확성을 위해 유지
    }

    /**
     * UI 초기화 (헤더 포함)
     */
    initializeUI() {
        this.createHeader();
        this.createFormSelector();
        this.createDisplay();
        this.bindModalEvents();
    }

    /**
     * 헤더 생성
     */
    createHeader() {
        const header = document.getElementById(this.config.headerId);
        if (!header) return;

        header.innerHTML = `
            <div class="forms-header">
                <h1>평서체/경어체 명사 활용</h1>
                <div class="description">일본어 명사의 다양한 활용형을 학습합니다</div>
                <div class="explanation">
                    명사는 평문체와 경어체로 구분되며, 각각 현재/과거, 긍정/부정의 형태가 있습니다.
                    상황과 관계에 따라 적절한 형태를 선택하여 사용해야 합니다.
                </div>
            </div>
        `;
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

        const html = `
            <div class="form-selector">
                <div class="selector-header">
                    <h3>명사 활용형 선택</h3>
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
        const casualForm = this.getCasualForm(noun, this.selectedForm);
        const politeForm = this.getPoliteForm(noun, this.selectedForm);

        display.innerHTML = `
            <div class="noun-display">
                <div class="noun-counter">
                    ${indexInfo.current} / ${indexInfo.total}
                </div>

                <div class="noun-info">
                    <div class="noun-main">
                        <span class="noun-kanji">${noun.hanja || noun.noun}</span>
                        <span class="noun-reading">${noun.hiragana || noun.reading}</span>
                    </div>
                    <div class="noun-meaning">${noun.mean || noun.meaning}</div>
                    <div class="noun-group">명사</div>
                </div>

                <div class="form-explanation">
                    <h4>${this.selectedForm}</h4>
                    <p>${this.getFormDescription(this.selectedForm)}</p>
                </div>

                <div class="conjugation-display">
                    <div class="conjugation-pair">
                        <div class="casual-form">
                            <div class="form-label">평문체</div>
                            <div class="form-text">${casualForm}</div>
                            <div class="form-korean">${this.getCasualMeaning(this.selectedForm)}</div>
                        </div>
                        <div class="polite-form">
                            <div class="form-label">경어체</div>
                            <div class="form-text">${politeForm}</div>
                            <div class="form-korean">${this.getPoliteMeaning(this.selectedForm)}</div>
                        </div>
                    </div>

                    <div class="translation">
                        <strong>한국어:</strong> ${noun.mean || noun.meaning}${this.getKoreanEnding(this.selectedForm)}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 평문체 활용형 생성
     */
    getCasualForm(noun, formType) {
        if (!noun || !(noun.hanja || noun.noun)) return '';
        const nounText = noun.hanja || noun.noun;

        switch (formType) {
            case '현재형':
                return nounText + 'だ';
            case '과거형':
                return nounText + 'だった';
            case '현재 부정형':
                return nounText + 'じゃない';
            case '과거 부정형':
                return nounText + 'じゃなかった';
            default:
                return nounText + 'だ';
        }
    }

    /**
     * 경어체 활용형 생성
     */
    getPoliteForm(noun, formType) {
        if (!noun || !(noun.hanja || noun.noun)) return '';
        const nounText = noun.hanja || noun.noun;

        switch (formType) {
            case '현재형':
                return nounText + 'です';
            case '과거형':
                return nounText + 'でした';
            case '현재 부정형':
                return nounText + 'じゃありません';
            case '과거 부정형':
                return nounText + 'じゃありませんでした';
            default:
                return nounText + 'です';
        }
    }

    /**
     * 평문체 의미
     */
    getCasualMeaning(formType) {
        switch (formType) {
            case '현재형':
                return '~이다/~다';
            case '과거형':
                return '~이었다/~였다';
            case '현재 부정형':
                return '~이 아니다';
            case '과거 부정형':
                return '~이 아니었다';
            default:
                return '~이다';
        }
    }

    /**
     * 경어체 의미
     */
    getPoliteMeaning(formType) {
        switch (formType) {
            case '현재형':
                return '~입니다';
            case '과거형':
                return '~이었습니다/~였습니다';
            case '현재 부정형':
                return '~이 아닙니다';
            case '과거 부정형':
                return '~이 아니었습니다';
            default:
                return '~입니다';
        }
    }

    /**
     * 한국어 어미
     */
    getKoreanEnding(formType) {
        switch (formType) {
            case '현재형':
                return '이다/입니다';
            case '과거형':
                return '이었다/이었습니다';
            case '현재 부정형':
                return '이 아니다/이 아닙니다';
            case '과거 부정형':
                return '이 아니었다/이 아니었습니다';
            default:
                return '이다/입니다';
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

    /**
     * 형태별 어미 변화 가져오기
     */
    getEndingForForm(noun, formType) {
        switch (formType) {
            case '기본형':
                return '';
            case '복수형':
                return 'たち';
            case '정중형':
                return 'さん';
            case '높임형':
                return '様';
            default:
                return '';
        }
    }

    /**
     * 형태 설명 가져오기
     */
    getFormDescription(formType) {
        const descriptions = {
            '현재형': '현재 상태나 사실을 나타내는 형태',
            '과거형': '과거의 상태나 사실을 나타내는 형태',
            '현재 부정형': '현재 상태의 부정을 나타내는 형태',
            '과거 부정형': '과거 상태의 부정을 나타내는 형태'
        };
        return descriptions[formType] || '명사의 기본 형태';
    }

    /**
     * 활용형 읽기 생성
     */
    getConjugatedReading(noun, formType) {
        const reading = noun.hiragana || noun.reading;
        return reading + this.getEndingForForm(noun, formType);
    }

    /**
     * 활용형 의미 생성
     */
    getConjugatedMeaning(noun, formType) {
        const baseMeaning = noun.mean || noun.meaning;
        const formMeanings = {
            '기본형': baseMeaning,
            '복수형': baseMeaning + '들',
            '정중형': baseMeaning + '님',
            '높임형': baseMeaning + '님'
        };
        return formMeanings[formType] || baseMeaning;
    }

    /**
     * 예문 생성
     */
    generateExample(noun, conjugatedForm) {
        return `${conjugatedForm}です。`;
    }

    /**
     * 예문 읽기 생성
     */
    generateExampleReading(noun, conjugatedForm) {
        return `${this.getConjugatedReading(noun, this.selectedForm)}です。`;
    }

    /**
     * 예문 의미 생성
     */
    generateExampleMeaning(noun, conjugatedForm) {
        return `${this.getConjugatedMeaning(noun, this.selectedForm)}입니다.`;
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
        window.nounFormsApp = new NounFormsApp();
    });
} else {
    window.nounFormsApp = new NounFormsApp();
}