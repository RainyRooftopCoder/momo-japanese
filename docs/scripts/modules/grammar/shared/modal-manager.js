/**
 * Modal Manager - 모달 관리 공통 유틸리티
 * 모든 문법 학습 앱에서 사용하는 모달 기능을 통합 관리
 */

export class ModalManager {
    static savedScrollTop = undefined;

    /**
     * 모달 열기
     * @param {string} modalId - 모달 엘리먼트 ID (기본값: 'infoModal')
     * @param {Object} options - 옵션 설정
     * @param {boolean} options.saveScroll - 스크롤 위치 저장 여부 (기본값: true)
     */
    static openModal(modalId = 'infoModal', options = {}) {
        const modal = document.getElementById(modalId);
        if (modal) {
            if (options.saveScroll !== false) {
                this.savedScrollTop = window.pageYOffset || document.documentElement.scrollTop;
                document.body.style.position = 'fixed';
                document.body.style.top = `-${this.savedScrollTop}px`;
                document.body.style.width = '100%';
            }
            modal.classList.add('show');
        } else {
            console.error(`Modal element with ID '${modalId}' not found!`);
        }
    }

    /**
     * 모달 닫기
     * @param {string} modalId - 모달 엘리먼트 ID (기본값: 'infoModal')
     * @param {Object} options - 옵션 설정
     * @param {boolean} options.restoreScroll - 스크롤 위치 복원 여부 (기본값: true)
     */
    static closeModal(modalId = 'infoModal', options = {}) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');

            if (options.restoreScroll !== false) {
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';

                if (this.savedScrollTop !== undefined) {
                    window.scrollTo(0, this.savedScrollTop);
                    this.savedScrollTop = undefined;
                }
            }
        }
    }

    /**
     * 모달 이벤트 바인딩
     * @param {string} modalId - 모달 엘리먼트 ID
     * @param {Function} closeCallback - 모달 닫기 콜백 함수
     */
    static bindModalEvents(modalId = 'infoModal', closeCallback) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        // 모달 배경 클릭 시 닫기
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                if (closeCallback) {
                    closeCallback();
                } else {
                    this.closeModal(modalId);
                }
            }
        });

        // ESC 키로 모달 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('show')) {
                if (closeCallback) {
                    closeCallback();
                } else {
                    this.closeModal(modalId);
                }
            }
        });

        // 닫기 버튼 클릭 이벤트
        const closeButtons = modal.querySelectorAll('[data-modal-close]');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (closeCallback) {
                    closeCallback();
                } else {
                    this.closeModal(modalId);
                }
            });
        });
    }
}