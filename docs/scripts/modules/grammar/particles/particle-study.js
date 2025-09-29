/**
 * Particle Study App - 조사 학습 (리팩토링 버전)
 *
 * 특징:
 * - BaseGrammarApp을 상속받아 중복 코드 제거
 * - 조사별 선택 방식
 * - 실제 예문을 통한 학습
 * - 컴팩트한 인터페이스
 * - 터치 네비게이션
 */

class ParticleStudyApp extends window.GrammarShared.BaseGrammarApp {
    constructor() {
        const config = window.GrammarShared.MODULE_CONFIGS.particleStudy;
        super(config);

        this.particleData = null;
        this.selectedParticle = 'は'; // 선택된 조사
        this.selectedForm = 'は'; // BaseGrammarApp 호환성
        this.currentExampleIndex = 0; // 현재 예시 인덱스
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
     * 조사 선택기 생성
     */
    createFormSelector() {
        const formSelector = document.getElementById('formSelector');
        if (!formSelector) return;

        const particles = ['は', 'が', 'を', 'に', 'で'];

        const html = `
            <div class="form-selector">
                <div class="selector-header">
                    <h3>조사 선택</h3>
                    <button class="info-modal-btn" data-action="open-info-modal">
                        <span class="info-icon">ℹ️</span>
                        <span class="info-text">설명</span>
                    </button>
                </div>
                <div class="form-buttons">
                    ${particles
                        .map(
                            (particle) => `
                        <button class="form-btn ${particle === this.selectedParticle ? 'active' : ''}"
                                data-form="${particle}">
                            <div class="form-name">${particle}</div>
                        </button>
                    `
                        )
                        .join('')}
                </div>
            </div>
        `;

        formSelector.innerHTML = html;

        // 조사 선택 이벤트 바인딩
        formSelector.addEventListener('click', (e) => {
            if (e.target.classList.contains('form-btn') || e.target.closest('.form-btn')) {
                const btn = e.target.classList.contains('form-btn') ? e.target : e.target.closest('.form-btn');
                this.selectParticle(btn.dataset.form);
            } else if (e.target.classList.contains('info-modal-btn') || e.target.closest('.info-modal-btn')) {
                this.openInfoModal();
            }
        });
    }

    /**
     * 조사 선택
     */
    selectParticle(particle) {
        this.selectedParticle = particle;
        this.selectedForm = particle; // BaseGrammarApp 호환성
        this.currentExampleIndex = 0; // 새 조사 선택시 첫 번째 예시로 리셋
        this.updateFormSelector();
        this.updateDisplay();
    }

    /**
     * 폼 선택 (BaseGrammarApp 호환)
     */
    selectForm(form) {
        this.selectParticle(form);
    }

    /**
     * 조사 디스플레이 생성
     */
    createDisplay() {
        // 선택된 조사의 데이터 찾기
        const particleInfo = this.getParticleData(this.selectedParticle);
        if (!particleInfo) {
            const display = document.getElementById(this.config.displayId);
            if (display) {
                display.innerHTML = '<p>해당 조사 데이터가 없습니다: ' + this.selectedParticle + '</p>';
            }
            return;
        }

        const display = document.getElementById(this.config.displayId);
        if (!display) return;

        // 현재 예시 데이터
        const examples = Object.values(particleInfo.forms);
        const currentExample = examples[this.currentExampleIndex] || examples[0];

        display.innerHTML = `
            <div class="verb-display">

                <div class="verb-info">
                    <div class="verb-main">
                        <span class="verb-kanji">${particleInfo.particle}</span>
                        <span class="verb-reading">${particleInfo.reading}</span>
                    </div>
                    <div class="verb-meaning">${particleInfo.meaning}</div>
                    <div class="verb-group">조사</div>
                </div>

                <div class="form-explanation">
                    <h4>${particleInfo.usage}</h4>
                    <p>${currentExample.description}</p>
                </div>

                <div class="conjugation-display">

                    <div class="example-sentence">
                        <h4>예문</h4>
                        <div class="sentence-card">
                            <div class="sentence-japanese">${this.highlightParticle(
                                currentExample.example,
                                particleInfo.particle
                            )}</div>
                            <div class="sentence-reading">${currentExample.exampleReading}</div>
                            <div class="sentence-translation">${currentExample.exampleTranslation}</div>
                        </div>
                    </div>
                </div>

            </div>
        `;
    }

    /**
     * 선택된 조사의 데이터 가져오기
     */
    getParticleData(particle) {
        // 기본 데이터 제공
        const defaultData = {
            は: {
                particle: 'は',
                reading: 'wa',
                meaning: '주격 조사 (주제)',
                usage: '문장의 주제나 화제를 나타냄',
                forms: {
                    기본형: {
                        description: '주제를 강조하거나 대조할 때 사용',
                        example: '私は学生です。',
                        exampleReading: 'わたしはがくせいです。',
                        exampleTranslation: '나는 학생입니다.',
                        note: '자기소개할 때 주제를 나타냄',
                    },
                    활용예시1: {
                        description: '일반적인 사실이나 특징을 나타냄',
                        example: '桜は美しいです。',
                        exampleReading: 'さくらはうつくしいです。',
                        exampleTranslation: '벚꽃은 아름답습니다.',
                        note: '일반적인 사실 표현',
                    },
                    활용예시2: {
                        description: '시간 표현과 함께 사용',
                        example: '今日は暖かいです。',
                        exampleReading: 'きょうはあたたかいです。',
                        exampleTranslation: '오늘은 따뜻합니다.',
                        note: '시간 표현에서의 주제',
                    },
                    활용예시3: {
                        description: '대조를 강조할 때 사용',
                        example: '私は行きますが、田中さんは行きません。',
                        exampleReading: 'わたしはいきますが、たなかさんはいきません。',
                        exampleTranslation: '나는 가지만, 다나카씨는 가지 않습니다.',
                        note: '대조 강조',
                    },
                },
            },
            が: {
                particle: 'が',
                reading: 'ga',
                meaning: '주격 조사 (주어)',
                usage: '문장의 주어를 나타냄',
                forms: {
                    기본형: {
                        description: '새로운 정보의 주어를 나타냄',
                        example: '猫が走っています。',
                        exampleReading: 'ねこがはしっています。',
                        exampleTranslation: '고양이가 뛰고 있습니다.',
                        note: '동작의 주체를 명확히 나타냄',
                    },
                    활용예시1: {
                        description: '의문사와 함께 사용',
                        example: '誰が来ましたか？',
                        exampleReading: 'だれがきましたか？',
                        exampleTranslation: '누가 왔습니까?',
                        note: '의문사와 함께 사용',
                    },
                    활용예시2: {
                        description: '좋아하는 대상을 나타냄',
                        example: '私は日本語が好きです。',
                        exampleReading: 'わたしはにほんごがすきです。',
                        exampleTranslation: '나는 일본어를 좋아합니다.',
                        note: '좋아하는 대상 표시',
                    },
                    활용예시3: {
                        description: '능력이나 가능성을 나타냄',
                        example: '田中さんは英語が話せます。',
                        exampleReading: 'たなかさんはえいごがはなせます。',
                        exampleTranslation: '다나카씨는 영어를 할 수 있습니다.',
                        note: '능력 표현',
                    },
                },
            },
            を: {
                particle: 'を',
                reading: 'o',
                meaning: '목적격 조사',
                usage: '동작의 대상(목적어)을 나타냄',
                forms: {
                    기본형: {
                        description: '타동사의 목적어를 나타냄',
                        example: '本を読みます。',
                        exampleReading: 'ほんをよみます。',
                        exampleTranslation: '책을 읽습니다.',
                        note: '동작의 직접 목적어',
                    },
                    활용예시1: {
                        description: '통과하는 장소를 나타냄',
                        example: '公園を散歩します。',
                        exampleReading: 'こうえんをさんぽします。',
                        exampleTranslation: '공원을 산책합니다.',
                        note: '통과하는 장소 표시',
                    },
                    활용예시2: {
                        description: '출발점을 나타냄',
                        example: '家を出ます。',
                        exampleReading: 'いえをでます。',
                        exampleTranslation: '집을 나갑니다.',
                        note: '출발점 표시',
                    },
                    활용예시3: {
                        description: '시간의 경과를 나타냄',
                        example: '一時間を過ごしました。',
                        exampleReading: 'いちじかんをすごしました。',
                        exampleTranslation: '한 시간을 보냈습니다.',
                        note: '시간 경과 표현',
                    },
                },
            },
            に: {
                particle: 'に',
                reading: 'ni',
                meaning: '방향/시간/목적 조사',
                usage: '방향, 시간, 목적, 존재 장소 등을 나타냄',
                forms: {
                    기본형: {
                        description: '이동의 목적지를 나타냄',
                        example: '学校に行きます。',
                        exampleReading: 'がっこうにいきます。',
                        exampleTranslation: '학교에 갑니다.',
                        note: '이동의 목적지',
                    },
                    활용예시1: {
                        description: '시간을 나타냄',
                        example: '3時に会います。',
                        exampleReading: 'さんじにあいます。',
                        exampleTranslation: '3시에 만납니다.',
                        note: '시간 표현',
                    },
                    활용예시2: {
                        description: '존재 장소를 나타냄',
                        example: '机の上に本があります。',
                        exampleReading: 'つくえのうえにほんがあります。',
                        exampleTranslation: '책상 위에 책이 있습니다.',
                        note: '존재 장소',
                    },
                    활용예시3: {
                        description: '동작의 목적을 나타냄',
                        example: '映画を見に行きます。',
                        exampleReading: 'えいがをみにいきます。',
                        exampleTranslation: '영화를 보러 갑니다.',
                        note: '목적 표현',
                    },
                },
            },
            で: {
                particle: 'で',
                reading: 'de',
                meaning: '수단/장소 조사',
                usage: '동작이 일어나는 장소나 수단, 방법을 나타냄',
                forms: {
                    기본형: {
                        description: '동작이 일어나는 장소를 나타냄',
                        example: '図書館で勉強します。',
                        exampleReading: 'としょかんでべんきょうします。',
                        exampleTranslation: '도서관에서 공부합니다.',
                        note: '동작 장소',
                    },
                    활용예시1: {
                        description: '이동 수단을 나타냄',
                        example: '電車で行きます。',
                        exampleReading: 'でんしゃでいきます。',
                        exampleTranslation: '전차로 갑니다.',
                        note: '이동 수단',
                    },
                    활용예시2: {
                        description: '도구나 수단을 나타냄',
                        example: '箸で食べます。',
                        exampleReading: 'はしでたべます。',
                        exampleTranslation: '젓가락으로 먹습니다.',
                        note: '도구 표현',
                    },
                    활용예시3: {
                        description: '재료나 원료를 나타냄',
                        example: '木で作りました。',
                        exampleReading: 'きでつくりました。',
                        exampleTranslation: '나무로 만들었습니다.',
                        note: '재료 표현',
                    },
                },
            },
        };

        // 먼저 기본 데이터에서 찾기
        if (defaultData[particle]) {
            return defaultData[particle];
        }

        // JSON에서 데이터 로드 시도
        if (!this.particleData || this.particleData.length === 0) return null;

        const data = this.particleData[0]; // 첫 번째 데이터 그룹
        if (!data.examples) return null;

        return data.examples.find((p) => p.particle === particle);
    }

    /**
     * 현재 항목 가져오기 (BaseGrammarApp 호환)
     */
    getCurrentItem() {
        return this.getParticleData(this.selectedParticle);
    }

    /**
     * 인덱스 정보 가져오기 (BaseGrammarApp 호환)
     */
    getIndexInfo() {
        const particleInfo = this.getParticleData(this.selectedParticle);
        if (!particleInfo) return { current: 1, total: 1 };

        const examples = Object.values(particleInfo.forms);
        return {
            current: this.currentExampleIndex + 1,
            total: examples.length,
        };
    }

    /**
     * 다음 예시로 이동
     */
    nextItem() {
        const particleInfo = this.getParticleData(this.selectedParticle);
        if (!particleInfo) return;

        const examples = Object.values(particleInfo.forms);
        if (this.currentExampleIndex < examples.length - 1) {
            this.currentExampleIndex++;
            this.updateDisplay();
        }
    }

    /**
     * 이전 예시로 이동
     */
    previousItem() {
        if (this.currentExampleIndex > 0) {
            this.currentExampleIndex--;
            this.updateDisplay();
        }
    }

    /**
     * 폼 선택기 업데이트
     */
    updateFormSelector() {
        const formButtons = document.querySelectorAll('.form-btn');
        formButtons.forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.form === this.selectedParticle);
        });
    }

    /**
     * 디스플레이 업데이트
     */
    updateDisplay() {
        this.createDisplay();
    }

    /**
     * 조사 강조 표시
     */
    highlightParticle(sentence, particle) {
        if (!particle || !sentence.includes(particle)) {
            return sentence;
        }
        return sentence.replace(new RegExp(particle, 'g'), `<span class="highlight">${particle}</span>`);
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
        window.particleStudyApp = new ParticleStudyApp();
    });
} else {
    window.particleStudyApp = new ParticleStudyApp();
}
