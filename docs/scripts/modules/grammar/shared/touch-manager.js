/**
 * Touch Manager - 터치/스와이프 이벤트 관리 공통 유틸리티
 * 모든 문법 학습 앱에서 사용하는 스와이프 기능을 통합 관리
 */

export class TouchManager {
    /**
     * 스와이프 이벤트 바인딩
     * @param {HTMLElement} element - 이벤트를 바인딩할 엘리먼트
     * @param {Object} config - 스와이프 설정
     * @param {Function} config.onSwipeLeft - 왼쪽 스와이프 콜백
     * @param {Function} config.onSwipeRight - 오른쪽 스와이프 콜백
     * @param {number} config.threshold - 스와이프 감지 최소 거리 (기본값: 50)
     * @param {number} config.maxVerticalDistance - 세로 이동 최대 허용 거리 (기본값: 100)
     * @param {number} config.maxTime - 스와이프 최대 시간 (기본값: 300ms)
     * @param {number} config.minStartX - 시작 X 좌표 최소값 (기본값: 50)
     */
    static bindSwipeEvents(element, config = {}) {
        if (!element) {
            console.warn('TouchManager: No element provided for swipe binding');
            return;
        }

        const {
            onSwipeLeft,
            onSwipeRight,
            threshold = 50,
            maxVerticalDistance = 100,
            maxTime = 300,
            minStartX = 50
        } = config;

        let startX = 0;
        let startY = 0;
        let startTime = 0;

        // 터치 이벤트 처리
        element.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            startTime = Date.now();
        }, { passive: true });

        element.addEventListener('touchend', (e) => {
            if (!e.changedTouches || e.changedTouches.length === 0) return;

            const touch = e.changedTouches[0];
            const endX = touch.clientX;
            const endY = touch.clientY;
            const deltaTime = Date.now() - startTime;

            const deltaX = endX - startX;
            const deltaY = endY - startY;

            // 스와이프 조건 검사
            if (deltaTime > maxTime) return;
            if (Math.abs(deltaY) > maxVerticalDistance) return;
            if (Math.abs(deltaX) < threshold) return;

            // 왼쪽 스와이프 (다음)
            if (deltaX < -threshold && onSwipeLeft) {
                e.preventDefault();
                onSwipeLeft(e);
            }
            // 오른쪽 스와이프 (이전 또는 뒤로가기)
            else if (deltaX > threshold && onSwipeRight) {
                e.preventDefault();
                onSwipeRight(e);
            }
        }, { passive: false });

        // 마우스 이벤트 처리 (데스크톱 테스트용)
        let mouseStartX = 0;
        let mouseStartY = 0;
        let mouseStartTime = 0;
        let isMouseDown = false;

        element.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            mouseStartX = e.clientX;
            mouseStartY = e.clientY;
            mouseStartTime = Date.now();
        });

        element.addEventListener('mouseup', (e) => {
            if (!isMouseDown) return;
            isMouseDown = false;

            const deltaTime = Date.now() - mouseStartTime;
            const deltaX = e.clientX - mouseStartX;
            const deltaY = e.clientY - mouseStartY;

            // 스와이프 조건 검사
            if (deltaTime > maxTime) return;
            if (Math.abs(deltaY) > maxVerticalDistance) return;
            if (Math.abs(deltaX) < threshold) return;

            // 왼쪽 스와이프 (다음)
            if (deltaX < -threshold && onSwipeLeft) {
                e.preventDefault();
                onSwipeLeft(e);
            }
            // 오른쪽 스와이프 (이전 또는 뒤로가기)
            else if (deltaX > threshold && onSwipeRight) {
                e.preventDefault();
                onSwipeRight(e);
            }
        });

        element.addEventListener('mouseleave', () => {
            isMouseDown = false;
        });
    }

    /**
     * 뒤로가기 스와이프 이벤트 바인딩 (우측에서 좌측으로 스와이프)
     * @param {HTMLElement} element - 이벤트를 바인딩할 엘리먼트
     * @param {Function} callback - 뒤로가기 콜백 함수
     * @param {Object} options - 추가 옵션
     */
    static bindBackSwipe(element, callback, options = {}) {
        this.bindSwipeEvents(element, {
            onSwipeRight: callback,
            threshold: options.threshold || 50,
            maxVerticalDistance: options.maxVerticalDistance || 100,
            maxTime: options.maxTime || 300,
            minStartX: options.minStartX || 50
        });
    }

    /**
     * 네비게이션 스와이프 이벤트 바인딩 (좌우 스와이프로 이전/다음)
     * @param {HTMLElement} element - 이벤트를 바인딩할 엘리먼트
     * @param {Function} prevCallback - 이전 콜백 함수 (우측 스와이프)
     * @param {Function} nextCallback - 다음 콜백 함수 (좌측 스와이프)
     * @param {Object} options - 추가 옵션
     */
    static bindNavigationSwipe(element, prevCallback, nextCallback, options = {}) {
        this.bindSwipeEvents(element, {
            onSwipeLeft: nextCallback,
            onSwipeRight: prevCallback,
            threshold: options.threshold || 50,
            maxVerticalDistance: options.maxVerticalDistance || 100,
            maxTime: options.maxTime || 300
        });
    }
}