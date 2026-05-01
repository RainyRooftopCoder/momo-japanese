/**
 * PWA 설치 프롬프트 관리
 * 사용자 기기에 앱 설치 기능 제공
 */

// PWA 설치 프롬프트 처리
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // 기본 설치 프롬프트 방지
    e.preventDefault();
    deferredPrompt = e;

    // 설치 버튼 표시 (필요시)
    showInstallButton();
});

function showInstallButton() {
    // 설치 버튼을 표시하는 로직
    console.log('PWA 설치 가능');
}

// 앱이 설치된 후
window.addEventListener('appinstalled', (evt) => {
    console.log('PWA가 성공적으로 설치되었습니다');
});
