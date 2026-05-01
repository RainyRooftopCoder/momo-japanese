/**
 * PWA 서비스 워커 등록 및 관리
 * 오프라인 기능 및 캐싱 전략 구현
 */

// 서비스 워커 지원 확인 및 등록
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        navigator.serviceWorker
            .register('./sw.js')
            .then(function (registration) {
                console.log('ServiceWorker 등록 성공:', registration.scope);

                // 업데이트 확인
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // 새 버전 사용 가능 알림
                                if (confirm('새 버전이 사용 가능합니다. 업데이트하시겠습니까?')) {
                                    window.location.reload();
                                }
                            }
                        });
                    }
                });
            })
            .catch(function (error) {
                console.log('ServiceWorker 등록 실패:', error);
            });
    });
}
