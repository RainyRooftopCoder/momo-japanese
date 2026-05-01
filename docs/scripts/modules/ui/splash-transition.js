/**
 * 스플래시 화면 전환 로직
 * 앱 시작 시 스플래시 화면을 표시하고 앱으로 전환
 */

console.log('Splash script loading...');

// 즉시 앱 컨테이너 숨기기
function hideAppContainer() {
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
        appContainer.style.cssText = 'display: none !important';
        console.log('Splash: App container hidden');
    }
}

// 앱 컨테이너 표시하기
function showAppContainer() {
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
        appContainer.style.cssText = 'display: block !important';
        console.log('Splash: App container shown');
    }
}

// 스플래시 전환 함수
function transitionToApp() {
    const splashScreen = document.getElementById('splashScreen');

    console.log('Splash: Starting transition to app');

    if (splashScreen) {
        // 부드러운 페이드아웃과 약간의 스케일 효과
        splashScreen.style.transition = 'opacity 1s ease-out, transform 1s ease-out';
        splashScreen.style.opacity = '0';
        splashScreen.style.transform = 'scale(1.05)';

        // 동시에 앱 컨테이너를 페이드인으로 표시
        setTimeout(function () {
            const appContainer = document.querySelector('.app-container');
            if (appContainer) {
                appContainer.style.cssText =
                    'display: block !important; opacity: 0; transition: opacity 0.5s ease-in';

                // 짧은 지연 후 페이드인
                setTimeout(function () {
                    appContainer.style.opacity = '1';
                }, 50);
            }

            splashScreen.remove(); // 완전히 DOM에서 제거
            console.log('Splash: Transition complete - app should be visible');
        }, 800);
    } else {
        showAppContainer();
    }
}

// 즉시 앱 컨테이너 숨기기
hideAppContainer();

// DOM 로드 시 스플래시 시작
document.addEventListener('DOMContentLoaded', function () {
    console.log('Splash: DOM loaded, setting up splash');

    const splashScreen = document.getElementById('splashScreen');

    if (splashScreen) {
        // 스플래시 화면 설정
        splashScreen.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 60%, #fd79a8 100%) !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            z-index: 99999 !important;
            overflow: hidden !important;
            visibility: visible !important;
            opacity: 1 !important;
        `;

        console.log('Splash: Splash screen configured');

        // 2.8초 후 자동 전환
        let transitioned = false;
        setTimeout(function () {
            if (!transitioned) {
                transitioned = true;
                transitionToApp();
            }
        }, 1900);

        // 클릭으로 즉시 전환
        splashScreen.addEventListener('click', function () {
            if (!transitioned) {
                transitioned = true;
                console.log('Splash: User clicked, smooth transition');

                // 클릭시에도 부드러운 페이드아웃
                splashScreen.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
                splashScreen.style.opacity = '0';
                splashScreen.style.transform = 'scale(1.03)';

                setTimeout(function () {
                    const appContainer = document.querySelector('.app-container');
                    if (appContainer) {
                        appContainer.style.cssText =
                            'display: block !important; opacity: 0; transition: opacity 0.4s ease-in';

                        setTimeout(function () {
                            appContainer.style.opacity = '1';
                        }, 50);
                    }

                    splashScreen.remove();
                    console.log('Splash: Click transition complete');
                }, 500);
            }
        });
    } else {
        console.error('Splash: Splash screen not found');
        showAppContainer();
    }
});
