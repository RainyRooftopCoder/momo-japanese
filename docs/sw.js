const CACHE_NAME = 'momo-japanese-v1.1.0';
const OFFLINE_URL = './offline.html';

// 캐시할 리소스 목록
const urlsToCache = [
    './',
    './index.html',
    './manifest.json',

    // CSS 파일들
    './styles/base/reset.css',
    './styles/base/variables.css',
    './styles/themes/glassmorphism.css',
    './styles/components/navigation.css',
    './styles/components/modal.css',
    './styles/pages/home.css',
    './styles/pages/practice.css',
    './styles/pages/settings.css',

    // Core JavaScript 파일들
    './scripts/core/database.js',
    './scripts/core/app.js',

    // Audio 모듈
    './scripts/modules/audio/speech-synthesis.js',
    './scripts/modules/audio/grammar-speech.js',

    // Grammar 모듈들
    './scripts/modules/grammar/verbs/group1-verb.js',
    './scripts/modules/grammar/verbs/group2-verb.js',
    './scripts/modules/grammar/verbs/group3-verb.js',
    './scripts/modules/grammar/adjectives/i-adjective.js',
    './scripts/modules/grammar/adjectives/na-adjective.js',
    './scripts/modules/grammar/nouns/noun-conjugation.js',
    './scripts/modules/grammar/nouns/noun-forms.js',
    './scripts/modules/grammar/particles/particle-study.js',

    // Games 모듈
    './scripts/modules/games/sentence-completion.js',

    // UI 모듈들
    './scripts/modules/ui/template-loader.js',
    './scripts/modules/ui/navigation.js',
    './scripts/modules/ui/home-dashboard.js',
    './scripts/modules/ui/my-vocabulary.js',
    './scripts/modules/ui/practice.js',
    './scripts/modules/ui/settings.js',

    // 템플릿 파일들
    './templates/components/header.html',
    './templates/pages/main-category-screen.html',
    './templates/pages/sub-category-screen.html',
    './templates/pages/hiragana-screen.html',
    './templates/pages/katakana-screen.html',
    './templates/pages/dakuten-screen.html',
    './templates/pages/youon-screen.html',

    // 데이터 파일들
    './data/vocabulary/jlpt/jlpt_n1_words_unified.json',
    './data/vocabulary/jlpt/jlpt_n4_words_unified.json',
    './data/vocabulary/jlpt/jlpt_n5_words_unified.json',

    // 아이콘들
    './assets/icons/momo_logo.png',
    './assets/icons/home_black_icon.png',
    './assets/icons/setting_black_icon.png',
    './assets/icons/search_black_icon.png',
    './assets/icons/arrow_left_black_icon.png',
    './assets/icons/data_write_black_icon.png',
    './assets/icons/trash_black_icon.png',

    // PWA 아이콘들
    './assets/icons/pwa-192x192.png',
    './assets/icons/pwa-512x512.png',
];

// 서비스 워커 설치 이벤트
self.addEventListener('install', (event) => {
    console.log('[SW] 서비스 워커 설치 중...');

    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] 캐시 열기 성공');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('[SW] 모든 리소스 캐시 완료');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] 캐시 중 오류 발생:', error);
            })
    );
});

// 서비스 워커 활성화 이벤트
self.addEventListener('activate', (event) => {
    console.log('[SW] 서비스 워커 활성화 중...');

    event.waitUntil(
        caches
            .keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // 이전 버전의 캐시 삭제
                        if (cacheName !== CACHE_NAME) {
                            console.log('[SW] 이전 캐시 삭제:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[SW] 서비스 워커 활성화 완료');
                return self.clients.claim();
            })
    );
});

// 네트워크 요청 가로채기 (Cache First 전략)
self.addEventListener('fetch', (event) => {
    // GET 요청만 처리
    if (event.request.method !== 'GET') return;

    // Chrome extension 요청 무시
    if (event.request.url.startsWith('chrome-extension://')) return;

    event.respondWith(
        caches.match(event.request).then((response) => {
            // 캐시에서 발견되면 캐시된 버전 반환
            if (response) {
                return response;
            }

            // 캐시에 없으면 네트워크에서 가져오기
            return fetch(event.request.clone())
                .then((response) => {
                    // 유효한 응답이 아니면 그대로 반환
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // 응답을 캐시에 저장
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });

                    return response;
                })
                .catch(() => {
                    // 네트워크 실패 시 오프라인 페이지 반환 (HTML 요청인 경우)
                    if (event.request.destination === 'document') {
                        return caches.match(OFFLINE_URL);
                    }
                });
        })
    );
});

// 백그라운드 동기화 (선택사항)
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        console.log('[SW] 백그라운드 동기화 실행');
        event.waitUntil(doBackgroundSync());
    }
});

function doBackgroundSync() {
    // 백그라운드에서 수행할 작업 (예: 오프라인에서 저장된 데이터 동기화)
    return Promise.resolve();
}

// 푸시 알림 처리 (선택사항)
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: './assets/icons/momo_logo.png',
            badge: './assets/icons/pwa-192x192.png',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: data.primaryKey,
            },
        };

        event.waitUntil(self.registration.showNotification(data.title, options));
    }
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(clients.openWindow('/'));
});

console.log('[SW] 서비스 워커 등록 완료');
