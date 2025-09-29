/**
 * UI Generator - 공통 UI 컴포넌트 생성 유틸리티
 * 문법 학습 앱에서 사용하는 공통 UI 요소들을 생성
 */

export class UIGenerator {
    /**
     * 폼 선택기 버튼 생성
     * @param {Array} forms - 폼 목록
     * @param {string} selectedForm - 현재 선택된 폼
     * @param {Function} onFormSelect - 폼 선택 콜백 함수
     * @returns {string} - 생성된 HTML 문자열
     */
    static createFormSelector(forms, selectedForm, onFormSelect) {
        if (!forms || forms.length === 0) return '';

        return forms.map(form => {
            const isActive = form === selectedForm ? 'active' : '';
            return `<button class="form-btn ${isActive}" data-form="${form}">${form}</button>`;
        }).join('');
    }

    /**
     * 카운터 표시 생성
     * @param {number} current - 현재 번호
     * @param {number} total - 전체 개수
     * @returns {string} - 생성된 HTML 문자열
     */
    static createCounter(current, total) {
        return `<span class="counter">${current} / ${total}</span>`;
    }

    /**
     * 정보 버튼 생성
     * @param {Function} onClick - 클릭 콜백 함수
     * @returns {string} - 생성된 HTML 문자열
     */
    static createInfoButton(onClick) {
        return `<button class="info-btn" data-action="info">ℹ️ 활용 정보</button>`;
    }

    /**
     * 네비게이션 버튼 생성
     * @param {Object} config - 네비게이션 설정
     * @param {boolean} config.showPrev - 이전 버튼 표시 여부
     * @param {boolean} config.showNext - 다음 버튼 표시 여부
     * @param {Function} config.onPrev - 이전 버튼 콜백
     * @param {Function} config.onNext - 다음 버튼 콜백
     * @returns {string} - 생성된 HTML 문자열
     */
    static createNavigationButtons(config = {}) {
        const { showPrev = true, showNext = true, onPrev, onNext } = config;

        let html = '<div class="navigation-buttons">';

        if (showPrev) {
            html += '<button class="nav-btn prev-btn" data-action="prev">이전</button>';
        }

        if (showNext) {
            html += '<button class="nav-btn next-btn" data-action="next">다음</button>';
        }

        html += '</div>';

        return html;
    }

    /**
     * 텍스트 하이라이트 적용
     * @param {string} text - 전체 텍스트
     * @param {string|Array} targets - 하이라이트할 단어/구문
     * @param {string} className - CSS 클래스명
     * @returns {string} - 하이라이트가 적용된 HTML 문자열
     */
    static highlightText(text, targets, className = 'highlight') {
        if (!text || !targets) return text;

        const targetArray = Array.isArray(targets) ? targets : [targets];
        let result = text;

        targetArray.forEach(target => {
            if (target && result.includes(target)) {
                const regex = new RegExp(target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                result = result.replace(regex, `<span class="${className}">${target}</span>`);
            }
        });

        return result;
    }

    /**
     * 로딩 스피너 생성
     * @param {string} message - 로딩 메시지
     * @returns {string} - 생성된 HTML 문자열
     */
    static createLoadingSpinner(message = '로딩 중...') {
        return `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p class="loading-message">${message}</p>
            </div>
        `;
    }

    /**
     * 에러 메시지 생성
     * @param {string} message - 에러 메시지
     * @param {Function} onRetry - 재시도 콜백 함수
     * @returns {string} - 생성된 HTML 문자열
     */
    static createErrorMessage(message, onRetry) {
        const retryButton = onRetry ?
            '<button class="retry-btn" data-action="retry">다시 시도</button>' : '';

        return `
            <div class="error-container">
                <div class="error-icon">⚠️</div>
                <p class="error-message">${message}</p>
                ${retryButton}
            </div>
        `;
    }

    /**
     * 빈 상태 메시지 생성
     * @param {string} message - 빈 상태 메시지
     * @param {string} icon - 표시할 아이콘
     * @returns {string} - 생성된 HTML 문자열
     */
    static createEmptyState(message = '데이터가 없습니다', icon = '📚') {
        return `
            <div class="empty-state">
                <div class="empty-icon">${icon}</div>
                <p class="empty-message">${message}</p>
            </div>
        `;
    }

    /**
     * 토스트 메시지 표시
     * @param {string} message - 토스트 메시지
     * @param {string} type - 토스트 타입 (success, error, info, warning)
     * @param {number} duration - 표시 시간 (밀리초)
     */
    static showToast(message, type = 'info', duration = 3000) {
        // 기존 토스트 제거
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        // 새 토스트 생성
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        // 스타일 적용
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: 'bold',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease-in-out'
        });

        // 타입별 배경색 설정
        const colors = {
            success: '#4CAF50',
            error: '#F44336',
            warning: '#FF9800',
            info: '#2196F3'
        };
        toast.style.backgroundColor = colors[type] || colors.info;

        // DOM에 추가
        document.body.appendChild(toast);

        // 애니메이션 적용
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 10);

        // 자동 제거
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    /**
     * 확인 대화상자 생성
     * @param {string} message - 확인 메시지
     * @param {Function} onConfirm - 확인 콜백
     * @param {Function} onCancel - 취소 콜백
     * @param {Object} options - 추가 옵션
     */
    static showConfirmDialog(message, onConfirm, onCancel, options = {}) {
        const {
            title = '확인',
            confirmText = '확인',
            cancelText = '취소',
            confirmClass = 'btn-primary',
            cancelClass = 'btn-secondary'
        } = options;

        // 오버레이 생성
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';
        Object.assign(overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '10001'
        });

        // 대화상자 생성
        const dialog = document.createElement('div');
        dialog.className = 'confirm-dialog';
        dialog.innerHTML = `
            <div class="dialog-header">
                <h3>${title}</h3>
            </div>
            <div class="dialog-body">
                <p>${message}</p>
            </div>
            <div class="dialog-footer">
                <button class="dialog-btn ${cancelClass}" data-action="cancel">${cancelText}</button>
                <button class="dialog-btn ${confirmClass}" data-action="confirm">${confirmText}</button>
            </div>
        `;

        Object.assign(dialog.style, {
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            minWidth: '300px',
            maxWidth: '400px',
            margin: '20px'
        });

        // 이벤트 리스너 추가
        dialog.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action === 'confirm') {
                overlay.remove();
                if (onConfirm) onConfirm();
            } else if (action === 'cancel') {
                overlay.remove();
                if (onCancel) onCancel();
            }
        });

        // 오버레이 클릭 시 취소
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
                if (onCancel) onCancel();
            }
        });

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // 포커스 설정
        const confirmBtn = dialog.querySelector(`[data-action="confirm"]`);
        if (confirmBtn) confirmBtn.focus();
    }
}