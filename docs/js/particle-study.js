/**
 * Particle Study App - 조사 활용 학습
 *
 * 특징:
 * - 조사별 기능과 사용법 설명
 * - 실제 예문을 통한 학습
 * - 간단하고 직관적인 인터페이스
 */

class ParticleStudyApp {
    constructor() {
        this.particleData = null;
        this.currentParticleIndex = 0;
        this.currentExampleIndex = 0;

        this.init();
    }

    async init() {
        try {
            console.log('Initializing Particle Study App...');

            // 데이터 로드
            await this.loadParticleData();

            // 이벤트 바인딩
            this.bindEvents();

            // UI 초기화
            this.initializeUI();

            console.log('Particle Study App initialized successfully');
        } catch (error) {
            console.error('Error initializing Particle Study App:', error);
        }
    }

    /**
     * 조사 데이터 로드
     */
    async loadParticleData() {
        try {
            const response = await fetch('./json/particle_data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.particleData = data[0]; // 기본 조사 데이터

            console.log('Particle data loaded:', this.particleData);
        } catch (error) {
            console.error('Error loading particle data:', error);
            this.setupDefaultData();
        }
    }

    /**
     * 기본 데이터 설정 (파일 로드 실패 시)
     */
    setupDefaultData() {
        this.particleData = {
            title: "기본 조사 활용",
            description: "일본어의 주요 조사들과 그 기능을 학습합니다",
            particles: [
                {
                    particle: "は",
                    reading: "wa",
                    function: "주격 조사 (주제)",
                    description: "문장의 주제나 화제를 나타낸다.",
                    examples: [
                        {
                            sentence: "私は学生です。",
                            reading: "わたしはがくせいです。",
                            translation: "나는 학생입니다."
                        }
                    ]
                }
            ]
        };
    }

    /**
     * UI 초기화
     */
    initializeUI() {
        this.hideHeader(); // 헤더 숨기기
        this.createParticleSelector();
        this.createParticleDisplay();
    }

    /**
     * 헤더 숨기기
     */
    hideHeader() {
        const headerContainer = document.getElementById('particleHeader');
        if (headerContainer) {
            headerContainer.style.display = 'none';
        }
    }

    /**
     * 조사 선택기 생성
     */
    createParticleSelector() {
        const selectorContainer = document.getElementById('particleSelector');
        if (!selectorContainer) {
            console.log('Particle selector container not found');
            return;
        }

        selectorContainer.innerHTML = `
            <div class="particle-selector">
                <div class="selector-header">
                    <h3>조사 선택</h3>
                    <button class="info-modal-btn" onclick="particleStudyApp.openInfoModal()">
                        <span class="info-icon">ℹ️</span>
                        <span class="info-text">설명</span>
                    </button>
                </div>
                <div class="particle-buttons">
                    ${this.particleData.particles.map((particle, index) => `
                        <button class="particle-btn ${index === this.currentParticleIndex ? 'active' : ''}"
                                data-index="${index}">
                            <div class="particle-char">${particle.particle}</div>
                            <div class="particle-reading">${particle.reading}</div>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * 조사 표시 영역 생성
     */
    createParticleDisplay() {
        const displayContainer = document.getElementById('particleDisplay');
        if (!displayContainer) {
            console.log('Particle display container not found');
            return;
        }

        const currentParticle = this.particleData.particles[this.currentParticleIndex];
        const currentExample = currentParticle.examples[this.currentExampleIndex];

        displayContainer.innerHTML = `
            <div class="particle-display">
                <div class="particle-counter">${this.currentExampleIndex + 1}/${currentParticle.examples.length}</div>
                <div class="particle-info">
                    <div class="particle-main">
                        <span class="particle-large">${currentParticle.particle}</span>
                        <span class="particle-pronunciation">${currentParticle.reading}</span>
                    </div>
                    <div class="particle-function">${currentParticle.function}</div>
                </div>

                <div class="particle-explanation">
                    <h4>기능 설명</h4>
                    <p>${currentParticle.description}</p>
                    ${currentParticle.usage ? `<p class="usage-note"><strong>사용법:</strong> ${currentParticle.usage}</p>` : ''}
                </div>

                <div class="example-display">
                    <h4>예문</h4>
                    <div class="example-card">
                        <div class="example-sentence">${this.highlightParticle(currentExample.sentence, currentParticle.particle)}</div>
                        <div class="example-reading">${this.highlightParticle(currentExample.reading, currentParticle.reading)}</div>
                        <div class="example-translation">${currentExample.translation}</div>
                        ${currentExample.note ? `<div class="example-note">💡 ${currentExample.note}</div>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 조사 강조 표시
     */
    highlightParticle(text, particle) {
        return text.replace(new RegExp(particle, 'g'), `<span class="highlighted-particle">${particle}</span>`);
    }


    /**
     * 이벤트 바인딩
     */
    bindEvents() {
        // 조사 선택 이벤트
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('particle-btn') || e.target.closest('.particle-btn')) {
                const btn = e.target.classList.contains('particle-btn') ? e.target : e.target.closest('.particle-btn');
                const index = parseInt(btn.dataset.index);
                this.selectParticle(index);
            }
        });

        // 스와이프 네비게이션
        this.bindSwipeEvents();

        // 키보드 네비게이션
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.showPreviousExample();
            if (e.key === 'ArrowRight') this.showNextExample();
            if (e.key === 'ArrowUp') this.selectPreviousParticle();
            if (e.key === 'ArrowDown') this.selectNextParticle();
        });
    }

    /**
     * 조사 선택
     */
    selectParticle(index) {
        this.currentParticleIndex = index;
        this.currentExampleIndex = 0; // 새로운 조사 선택시 첫 번째 예문으로
        this.updateParticleSelector();
        this.createParticleDisplay();
    }

    /**
     * 조사 선택기 업데이트
     */
    updateParticleSelector() {
        const particleBtns = document.querySelectorAll('.particle-btn');
        particleBtns.forEach((btn, index) => {
            btn.classList.remove('active');
            if (index === this.currentParticleIndex) {
                btn.classList.add('active');
            }
        });
    }

    /**
     * 이전 예문 표시
     */
    showPreviousExample() {
        const currentParticle = this.particleData.particles[this.currentParticleIndex];
        if (this.currentExampleIndex > 0) {
            this.currentExampleIndex--;
            this.createParticleDisplay();
        }
    }

    /**
     * 다음 예문 표시
     */
    showNextExample() {
        const currentParticle = this.particleData.particles[this.currentParticleIndex];
        if (this.currentExampleIndex < currentParticle.examples.length - 1) {
            this.currentExampleIndex++;
            this.createParticleDisplay();
        }
    }

    /**
     * 이전 조사 선택
     */
    selectPreviousParticle() {
        if (this.currentParticleIndex > 0) {
            this.selectParticle(this.currentParticleIndex - 1);
        }
    }

    /**
     * 다음 조사 선택
     */
    selectNextParticle() {
        if (this.currentParticleIndex < this.particleData.particles.length - 1) {
            this.selectParticle(this.currentParticleIndex + 1);
        }
    }

    /**
     * 터치 및 스와이프 이벤트 바인딩
     */
    bindSwipeEvents() {
        let startX = 0;
        let startY = 0;
        let isSwipingHorizontally = false;
        let isSwiping = false;

        const particleDisplay = document.getElementById('particleDisplay');
        if (!particleDisplay) return;

        // 터치 시작
        particleDisplay.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isSwipingHorizontally = false;
            isSwiping = false;
        }, { passive: true });

        // 터치 이동
        particleDisplay.addEventListener('touchmove', (e) => {
            if (!startX || !startY) return;

            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;

            const diffX = Math.abs(currentX - startX);
            const diffY = Math.abs(currentY - startY);

            // 수평 스와이프 감지
            if (diffX > diffY && diffX > 10) {
                isSwipingHorizontally = true;
                isSwiping = true;
                e.preventDefault();
            } else if (diffY > 10) {
                // 수직 스크롤 감지
                isSwiping = true;
            }
        }, { passive: false });

        // 터치 종료
        particleDisplay.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;

            if (isSwipingHorizontally) {
                const endX = e.changedTouches[0].clientX;
                const diffX = startX - endX;

                // 최소 스와이프 거리 (뒤로가기만)
                if (Math.abs(diffX) > 50 && diffX < 0) {
                    // 왼쪽에서 오른쪽 스와이프 (뒤로가기)
                    window.threeStepNavigation?.showScreen('sub');
                }
            } else if (!isSwiping) {
                // 단순 터치 (스와이프가 아닌 경우) - 터치 위치에 따라 이전/다음
                const endX = e.changedTouches[0].clientX;
                const displayRect = particleDisplay.getBoundingClientRect();
                const centerX = displayRect.left + displayRect.width / 2;

                if (endX < centerX) {
                    // 왼쪽 터치 - 이전 예문
                    this.showPreviousExample();
                } else {
                    // 오른쪽 터치 - 다음 예문
                    this.showNextExample();
                }
            }

            // 초기화
            startX = 0;
            startY = 0;
            isSwipingHorizontally = false;
            isSwiping = false;
        }, { passive: true });
    }

    /**
     * 정보 모달 열기
     */
    openInfoModal() {
        const modal = document.getElementById('infoModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden'; // 스크롤 방지
        }
    }

    /**
     * 정보 모달 닫기
     */
    closeInfoModal() {
        const modal = document.getElementById('infoModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = ''; // 스크롤 복원
        }
    }

    /**
     * 모달 외부 클릭 시 닫기
     */
    bindModalEvents() {
        const modal = document.getElementById('infoModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                // 모달 외부(오버레이) 클릭 시 닫기
                if (e.target === modal) {
                    this.closeInfoModal();
                }
            });

            // ESC 키로 모달 닫기
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.classList.contains('active')) {
                    this.closeInfoModal();
                }
            });
        }
    }
}

// 조사 학습 앱 초기화
let particleStudyApp;
document.addEventListener('DOMContentLoaded', () => {
    particleStudyApp = new ParticleStudyApp();

    // 모달 이벤트 바인딩 (DOM 로드 후)
    setTimeout(() => {
        if (particleStudyApp) {
            particleStudyApp.bindModalEvents();
        }
    }, 100);
});