/**
 * 스플래시 화면 관리 클래스
 */
class SplashManager {
    constructor() {
        this.splashScreen = null;
        this.appContainer = null;
        this.isShowing = false;

        this.init();
    }

    init() {
        // DOM 요소 참조
        this.splashScreen = document.getElementById('splashScreen');
        this.appContainer = document.querySelector('.app-container');

        if (!this.splashScreen) {
            console.error('Splash screen element not found');
            return;
        }

        console.log('Splash screen initialized');

        // 앱 컨테이너 초기에 숨기기
        if (this.appContainer) {
            this.appContainer.style.display = 'none';
            this.appContainer.classList.remove('visible');
        }

        // 스플래시 화면 강제 표시
        this.splashScreen.style.display = 'flex';
        this.splashScreen.style.visibility = 'visible';
        this.splashScreen.style.opacity = '1';

        // 스플래시 화면 표시
        this.showSplash();
    }

    /**
     * 스플래시 화면 표시
     */
    showSplash() {
        console.log('Showing splash screen');
        this.isShowing = true;

        // 스플래시 화면 표시
        this.splashScreen.style.display = 'flex';

        // 3초 후에 앱으로 전환 (애니메이션 완료 + 약간의 대기시간)
        setTimeout(() => {
            this.hideSplash();
        }, 3000);
    }

    /**
     * 스플래시 화면 숨기기 및 앱 표시
     */
    hideSplash() {
        if (!this.isShowing) return;

        console.log('Hiding splash screen');

        // 페이드아웃 애니메이션 클래스 추가
        this.splashScreen.classList.add('fade-out');

        // 애니메이션 완료 후 스플래시 화면 제거 및 앱 표시
        setTimeout(() => {
            this.splashScreen.style.display = 'none';
            if (this.appContainer) {
                this.appContainer.style.display = 'block';
                this.appContainer.classList.add('visible');
            }
            this.isShowing = false;

            // 앱 로드 완료 이벤트 발생
            window.dispatchEvent(new CustomEvent('appLoaded'));
            console.log('App loaded after splash');
        }, 800); // CSS fadeOut 애니메이션 시간과 일치
    }

    /**
     * 스플래시 화면 강제 숨기기 (예: 사용자가 탭한 경우)
     */
    forceHide() {
        if (this.isShowing) {
            this.hideSplash();
        }
    }
}

// 스플래시 매니저 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.splashManager = new SplashManager();

    // 스플래시 화면 클릭 시 앱으로 즉시 전환 (선택사항)
    const splashScreen = document.getElementById('splashScreen');
    if (splashScreen) {
        splashScreen.addEventListener('click', () => {
            console.log('Splash screen clicked, skipping to app');
            window.splashManager.forceHide();
        });
    }
});