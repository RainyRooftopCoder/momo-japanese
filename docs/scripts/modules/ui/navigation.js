/**
 * 3단계 화면 네비게이션 로직
 * Template 기반 구조로 구현
 */
class ThreeStepNavigation {
    constructor() {
        this.currentMainCategory = '';
        this.currentSubCategory = '';
        this.screens = {
            home: 'homeScreen',
            main: 'mainCategoryScreen',
            sub: 'subCategoryScreen',
            word: 'wordScreen',
            character: 'characterScreen',
            searchResults: 'searchResultsScreen',
            myVocabulary: 'myVocabularyScreen',
        };
        this.isInitialized = false;

        this.init();
    }

    async init() {
        try {
            console.log('Initializing Three-Step Navigation...');

            // 템플릿 로드 대기
            await this.waitForTemplateLoader();

            // 템플릿들 렌더링
            await this.renderAllTemplates();

            // 이벤트 바인딩
            this.bindEvents();

            // 첫 화면 표시
            this.showScreen('home');

            this.isInitialized = true;
            console.log('Three-Step Navigation initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Three-Step Navigation:', error);
        }
    }

    /**
     * TemplateLoader 로드 대기
     */
    async waitForTemplateLoader() {
        let attempts = 0;
        while (!window.templateLoader && attempts < 50) {
            await new Promise((resolve) => setTimeout(resolve, 100));
            attempts++;
        }

        if (!window.templateLoader) {
            throw new Error('TemplateLoader not available');
        }
    }

    /**
     * DOM 요소가 존재할 때까지 대기 후 콜백 실행
     */
    waitForElementAndInitialize(elementId, callback, maxAttempts = 50) {
        console.log(`Waiting for element: ${elementId}`);

        // DOM이 완전히 렌더링될 때까지 기다림
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                let attempts = 0;
                const checkElement = () => {
                    const element = document.getElementById(elementId);
                    console.log(`Attempt ${attempts + 1}: Element ${elementId} ${element ? 'found' : 'not found'}`);

                    if (element) {
                        console.log(`Element ${elementId} found, executing callback`);
                        callback();
                    } else if (attempts < maxAttempts) {
                        attempts++;
                        setTimeout(checkElement, 50); // 50ms로 단축
                    } else {
                        console.error(`Element ${elementId} not found after ${maxAttempts} attempts`);
                        console.log('Available elements with IDs:');
                        const allElements = document.querySelectorAll('[id]');
                        allElements.forEach(el => console.log(`- ${el.id}`));
                        // 요소를 찾지 못해도 콜백 실행 (fallback)
                        callback();
                    }
                };
                checkElement();
            });
        });
    }

    /**
     * 모든 템플릿 렌더링
     */
    async renderAllTemplates() {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) {
            throw new Error('Main content container not found');
        }

        // 헤더 렌더링
        await renderTemplate('header-container', 'components/header');

        // 화면 템플릿들 렌더링
        const templates = ['home', 'main-category-screen', 'sub-category-screen', 'word-screen', 'search-results-screen'];

        let combinedHTML = '';
        for (const template of templates) {
            console.log(`Loading template: ${template}`);
            try {
                const html = await loadTemplate(template);
                console.log(`Template ${template} loaded, length: ${html.length}`);
                combinedHTML += html;
            } catch (error) {
                console.error(`Failed to load template ${template}:`, error);
            }
        }

        // 기존에 있는 화면들은 보존하고 새로운 것만 추가
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = combinedHTML;

        const existingScreenIds = ['homeScreen', 'mainCategoryScreen', 'subCategoryScreen'];

        // 기존에 있는 화면들은 템플릿에서 제거
        existingScreenIds.forEach(screenId => {
            const existingScreen = document.getElementById(screenId);
            const newScreen = tempContainer.querySelector(`#${screenId}`);

            if (existingScreen && newScreen) {
                console.log(`Preserving existing ${screenId}`);
                newScreen.remove();
            }
        });

        // 나머지 새로운 화면들만 추가
        const children = Array.from(tempContainer.children);
        children.forEach(child => {
            console.log('Adding screen:', child.id);
            mainContent.appendChild(child);
        });

        // 홈 화면이 제대로 로드되었는지 확인
        const homeScreen = document.getElementById('homeScreen');
        console.log('Home screen after template load:', !!homeScreen);
        if (homeScreen) {
            console.log('Home screen HTML length:', homeScreen.innerHTML.length);
        } else {
            console.warn('Home screen not found after template load, creating fallback');
            // 홈 화면이 없으면 직접 생성
            const fallbackHomeScreen = document.createElement('div');
            fallbackHomeScreen.id = 'homeScreen';
            fallbackHomeScreen.className = 'screen';
            fallbackHomeScreen.innerHTML = `
                <div class="home-container">
                    <section class="welcome-section">
                        <h1 class="welcome-title">안녕하세요! 🌸</h1>
                        <p class="welcome-subtitle">오늘도 일본어 공부를 시작해보세요</p>
                    </section>
                    <section class="quick-start">
                        <h2 class="section-title">🚀 빠른 시작</h2>
                        <div class="quick-actions">
                            <button class="quick-btn" data-action="random-study">
                                <div class="quick-icon">📚</div>
                                <span>단어 학습</span>
                            </button>
                            <button class="quick-btn" data-action="quiz">
                                <div class="quick-icon">🎯</div>
                                <span>퀴즈</span>
                            </button>
                            <button class="quick-btn" data-action="review">
                                <div class="quick-icon">🔄</div>
                                <span>복습</span>
                            </button>
                        </div>
                    </section>
                </div>
            `;
            mainContent.insertBefore(fallbackHomeScreen, mainContent.firstChild);
            console.log('Fallback home screen created');
        }

        // Character screen 컨테이너 미리 생성
        const characterScreen = document.createElement('div');
        characterScreen.id = 'characterScreen';
        characterScreen.className = 'screen';
        mainContent.appendChild(characterScreen);

        console.log('All templates rendered successfully');
        console.log('Main content HTML:', mainContent.innerHTML.length, 'characters');

        // 템플릿 로드 완료 이벤트 발생
        window.dispatchEvent(new CustomEvent('templatesLoaded'));

        // 템플릿 렌더링 후 이벤트 다시 바인딩
        setTimeout(() => {
            this.bindSwipeEvents();
            this.bindEvents(); // 모든 이벤트 다시 바인딩
        }, 100);
    }

    /**
     * 이벤트 바인딩
     */
    bindEvents() {
        // 홈 화면 빠른 시작 버튼들 (중복 바인딩 방지)
        document.querySelectorAll('[data-action]:not([data-bound])').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const action = e.target.closest('[data-action]').dataset.action;
                this.handleQuickAction(action);
            });
            btn.setAttribute('data-bound', 'true');
        });

        // 첫번째 화면 - 큰 카테고리 버튼들 (중복 바인딩 방지)
        document.querySelectorAll('[data-category]:not([data-bound])').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                this.currentMainCategory = e.target.dataset.category;
                this.showSubCategories(this.currentMainCategory);
            });
            btn.setAttribute('data-bound', 'true');
        });

        // 뒤로가기 버튼들 (backToSubBtn만 유지)
        const backToSubBtn = document.getElementById('backToSubBtn');

        if (backToSubBtn) {
            backToSubBtn.addEventListener('click', () => {
                this.showScreen('sub');
            });
        }

        // 스와이프 이벤트 바인딩 (모든 화면)
        this.bindSwipeEvents();
        this.bindAllScreenSwipeEvents();

        // 하단 네비게이션 이벤트 바인딩
        this.bindBottomNavEvents();

        // 검색 이벤트 바인딩
        this.bindSearchEvents();

        console.log('Navigation events bound successfully');
    }

    /**
     * 홈 화면 빠른 시작 액션 처리
     */
    handleQuickAction(action) {
        console.log('Quick action:', action);

        switch (action) {
            case 'random-study':
                // 랜덤 단어 학습 - 메인 카테고리 화면으로 이동
                this.showScreen('main');
                break;
            case 'quiz':
                // 홈 대시보드의 퀴즈 기능 호출
                if (window.homeDashboard) {
                    window.homeDashboard.handleQuickAction('quiz');
                } else {
                    this.showToast('🎯 퀴즈 기능은 추후 업데이트 예정입니다!');
                }
                break;
            case 'review':
                // 홈 대시보드의 복습 기능 호출
                if (window.homeDashboard) {
                    window.homeDashboard.handleQuickAction('review');
                } else {
                    this.showToast('🔄 복습 기능은 추후 업데이트 예정입니다!');
                }
                break;
            case 'my-vocabulary':
                // 나의 단어장 기능 호출
                if (window.homeDashboard) {
                    window.homeDashboard.handleQuickAction('my-vocabulary');
                } else {
                    this.showToast('📖 나의 단어장 기능을 로드할 수 없습니다!');
                }
                break;
            default:
                console.warn('Unknown quick action:', action);
        }
    }

    /**
     * 모든 화면에 스와이프 이벤트 바인딩
     */
    bindAllScreenSwipeEvents() {
        // 메인 카테고리 화면 (홈으로 돌아가기)
        this.bindScreenSwipeBack('mainCategoryScreen', 'home');

        // 서브 카테고리 화면 (홈으로 돌아가기)
        this.bindScreenSwipeBack('subCategoryScreen', 'home');

        console.log('All screen swipe events bound');
    }

    /**
     * 특정 화면에 뒤로가기 스와이프 바인딩
     */
    bindScreenSwipeBack(screenId, targetScreen) {
        const screen = document.getElementById(screenId);
        if (!screen) {
            console.log(`Screen ${screenId} not found for swipe binding`);
            return;
        }

        // 이미 바인딩된 경우 중복 방지
        if (screen.dataset.swipeBackBound) {
            console.log(`Swipe already bound for ${screenId}`);
            return;
        }

        let startX = 0;
        let startY = 0;
        let isSwipingHorizontally = false;

        console.log(`Binding swipe back events to ${screenId} -> ${targetScreen}`);

        // 터치 시작
        screen.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isSwipingHorizontally = false;
        }, { passive: true });

        // 터치 이동
        screen.addEventListener('touchmove', (e) => {
            if (!startX || !startY) return;

            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const diffX = currentX - startX;
            const diffY = currentY - startY;

            // 왼쪽에서 오른쪽 스와이프만 허용 (뒤로가기)
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10 && diffX > 0) {
                isSwipingHorizontally = true;
                e.preventDefault();

                // 시각적 피드백
                const movePercent = Math.min(diffX / 150, 0.3);
                const opacity = 1 - movePercent;

                screen.style.transform = `translateX(${diffX * 0.2}px)`;
                screen.style.opacity = opacity;
            }
        }, { passive: false });

        // 터치 종료
        screen.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;

            const endX = e.changedTouches[0].clientX;
            const diffX = endX - startX;

            // 화면 원래 상태로 복원
            screen.style.transform = '';
            screen.style.opacity = '';
            screen.style.transition = 'all 0.3s ease';

            setTimeout(() => {
                screen.style.transition = '';
            }, 300);

            // 스와이프 처리 (왼쪽→오른쪽만)
            if (isSwipingHorizontally && diffX > 50) {
                console.log(`Swiping right on ${screenId} - going to ${targetScreen}`);
                this.showScreen(targetScreen);
            }

            // 초기화
            startX = 0;
            startY = 0;
            isSwipingHorizontally = false;
        }, { passive: true });

        // 터치 취소
        screen.addEventListener('touchcancel', (e) => {
            screen.style.transform = '';
            screen.style.opacity = '';
            startX = 0;
            startY = 0;
            isSwipingHorizontally = false;
        }, { passive: true });

        // 마우스 이벤트도 추가 (데스크탑 테스트용)
        let mouseStartX = 0;
        let isMouseSwiping = false;

        screen.addEventListener('mousedown', (e) => {
            mouseStartX = e.clientX;
            isMouseSwiping = true;
            e.preventDefault();
        });

        screen.addEventListener('mousemove', (e) => {
            if (!isMouseSwiping) return;

            const diffX = e.clientX - mouseStartX;
            if (diffX > 10) {
                // 시각적 피드백
                const movePercent = Math.min(diffX / 150, 0.3);
                const opacity = 1 - movePercent;

                screen.style.transform = `translateX(${diffX * 0.2}px)`;
                screen.style.opacity = opacity;
            }
        });

        screen.addEventListener('mouseup', (e) => {
            if (!isMouseSwiping) return;

            const diffX = e.clientX - mouseStartX;

            // 화면 원래 상태로 복원
            screen.style.transform = '';
            screen.style.opacity = '';
            screen.style.transition = 'all 0.3s ease';

            setTimeout(() => {
                screen.style.transition = '';
            }, 300);

            // 스와이프 처리
            if (diffX > 80) {
                console.log(`Mouse swiping right on ${screenId} - going to ${targetScreen}`);
                this.showScreen(targetScreen);
            }

            isMouseSwiping = false;
            mouseStartX = 0;
        });

        screen.addEventListener('mouseleave', (e) => {
            if (isMouseSwiping) {
                screen.style.transform = '';
                screen.style.opacity = '';
                isMouseSwiping = false;
                mouseStartX = 0;
            }
        });

        // 바인딩 완료 표시
        screen.dataset.swipeBackBound = 'true';
        console.log(`Swipe back events bound to ${screenId}`);
    }

    /**
     * 스와이프 이벤트 바인딩 (2번째 화면용)
     */
    bindSwipeEvents() {
        // 스와이프 변수들
        this.startX = 0;
        this.startY = 0;
        this.endX = 0;
        this.endY = 0;

        const subCategoryScreen = document.getElementById('subCategoryScreen');
        if (!subCategoryScreen) {
            console.log('Sub category screen not found, will bind swipe events later');
            return;
        }

        // 이미 바인딩되었으면 중복 방지
        if (subCategoryScreen.dataset.swipeBound) {
            console.log('Swipe events already bound to sub category screen');
            return;
        }

        let isSwipingHorizontally = false;

        console.log('Binding swipe events to sub category screen');

        // 터치 시작
        subCategoryScreen.addEventListener(
            'touchstart',
            (e) => {
                this.startX = e.touches[0].clientX;
                this.startY = e.touches[0].clientY;
                isSwipingHorizontally = false;
                console.log('Sub screen touch start:', this.startX, this.startY);
            },
            { passive: true }
        );

        // 터치 이동 중
        subCategoryScreen.addEventListener(
            'touchmove',
            (e) => {
                if (!this.startX) return;

                const currentX = e.touches[0].clientX;
                const currentY = e.touches[0].clientY;
                const diffX = currentX - this.startX;
                const diffY = currentY - this.startY;

                // 왼쪽에서 오른쪽 스와이프만 허용 (이전 화면으로)
                if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10 && diffX > 0) {
                    isSwipingHorizontally = true;
                    e.preventDefault();

                    // 시각적 피드백 (확대 효과 제거)
                    const movePercent = Math.min(diffX / 150, 0.3);
                    const opacity = 1 - movePercent;

                    subCategoryScreen.style.transform = `translateX(${diffX * 0.2}px)`;
                    subCategoryScreen.style.opacity = opacity;
                }
            },
            { passive: false }
        );

        // 터치 종료
        subCategoryScreen.addEventListener(
            'touchend',
            (e) => {
                if (e.changedTouches && e.changedTouches.length > 0) {
                    this.endX = e.changedTouches[0].clientX;
                    this.endY = e.changedTouches[0].clientY;
                }

                // 화면 원래 상태로 복원
                subCategoryScreen.style.transform = '';
                subCategoryScreen.style.opacity = '';
                subCategoryScreen.style.transition = 'all 0.3s ease';

                setTimeout(() => {
                    subCategoryScreen.style.transition = '';
                }, 300);

                // 스와이프 처리 (왼쪽→오른쪽만)
                if (isSwipingHorizontally) {
                    this.handleSubScreenSwipe();
                }

                // 초기화
                this.startX = 0;
                this.startY = 0;
                this.endX = 0;
                this.endY = 0;
                isSwipingHorizontally = false;
            },
            { passive: true }
        );

        // 터치 취소
        subCategoryScreen.addEventListener(
            'touchcancel',
            (e) => {
                subCategoryScreen.style.transform = '';
                subCategoryScreen.style.opacity = '';
                this.startX = 0;
                this.startY = 0;
                this.endX = 0;
                this.endY = 0;
                isSwipingHorizontally = false;
            },
            { passive: true }
        );

        // 바인딩 완료 표시
        subCategoryScreen.dataset.swipeBound = 'true';
        console.log('Swipe events bound successfully to sub category screen');
    }

    /**
     * 2번째 화면 스와이프 처리 (왼쪽→오른쪽만, 첫 번째 화면으로)
     */
    handleSubScreenSwipe() {
        const deltaX = this.endX - this.startX;

        console.log('Handling sub screen swipe:', {
            deltaX,
            startX: this.startX,
            endX: this.endX,
        });

        // 최소 스와이프 거리
        const minSwipeDistance = 50;

        // 왼쪽에서 오른쪽 스와이프만 처리 (홈 화면으로)
        if (deltaX > minSwipeDistance) {
            console.log('Swiping right on sub screen - going back to home screen');
            this.showScreen('home');
        }
    }

    /**
     * 화면 전환
     */
    showScreen(screenName) {
        if (!this.isInitialized) {
            console.warn('Navigation not initialized yet');
            return;
        }

        const screenIds = Object.values(this.screens);

        // 모든 화면 숨기기
        screenIds.forEach((screenId) => {
            const screen = document.getElementById(screenId);
            if (screen) {
                screen.classList.remove('active');
            }
        });

        // 선택된 화면 보이기
        const targetScreenId = this.screens[screenName];
        const targetScreen = document.getElementById(targetScreenId);

        console.log(`Looking for screen: ${screenName} -> ${targetScreenId}`);
        console.log(`Target screen found:`, !!targetScreen);
        if (!targetScreen) {
            console.error(`Available screens:`, Object.keys(this.screens).map(key => ({
                key,
                id: this.screens[key],
                exists: !!document.getElementById(this.screens[key])
            })));
        }

        if (targetScreen) {
            targetScreen.classList.add('active');
            console.log(`Added 'active' class to ${targetScreenId}`);
            console.log(`Target screen classes: ${targetScreen.className}`);
            console.log(`Target screen display style: ${window.getComputedStyle(targetScreen).display}`);

            // 스크롤 위치를 상단으로 리셋
            this.resetScreenScroll(targetScreen);

            // 페이드인 효과
            targetScreen.classList.add('fade-in');
            setTimeout(() => {
                targetScreen.classList.remove('fade-in');
            }, 300);
        } else {
            console.error(`Screen ${screenName} (${targetScreenId}) not found`);
        }

        // JPG 버튼 표시/숨기기 제어
        this.toggleJpgButton(screenName);

        // 헤더 제목 업데이트
        this.updateHeaderTitle(screenName);

        // 검색 결과 화면인 경우 스와이프 이벤트 바인딩
        if (screenName === 'searchResults') {
            // 약간의 지연을 두어 DOM이 완전히 렌더링된 후 바인딩
            setTimeout(() => {
                this.bindSearchSwipeEvents();
            }, 100);
        }

        console.log(`Switched to screen: ${screenName}`);
    }

    /**
     * 화면 스크롤 위치 리셋
     */
    resetScreenScroll(screen) {
        // 메인 화면 스크롤 리셋
        screen.scrollTop = 0;

        // 전체 페이지 스크롤 리셋
        window.scrollTo(0, 0);

        // 화면 내의 모든 스크롤 가능한 요소들 리셋
        const scrollableElements = screen.querySelectorAll(
            '.scrollable, .content, .category-list, .search-results-list'
        );
        scrollableElements.forEach((element) => {
            element.scrollTop = 0;
        });

        console.log('Screen scroll positions reset');
    }

    /**
     * 헤더 제목 업데이트
     */
    updateHeaderTitle(screenName) {
        const appTitle = document.getElementById('app-title');
        if (!appTitle) return;

        let title = 'もも 일본어 단어장'; // 기본 제목

        if (screenName === 'sub') {
            // 2번째 화면: 메인 카테고리에 따른 제목
            const categoryTitles = {
                jpCharacter: '일본어 문자',
                grammar: '문법',
                jlpt: 'JLPT 단어',
                partOfSpeech: '품사별 단어',
                theme: '주제별 단어',
            };
            title = categoryTitles[this.currentMainCategory] || title;
        } else if (screenName === 'word') {
            // 3번째 화면: 서브 카테고리에 따른 제목
            if (this.currentMainCategory === 'jlpt') {
                title = `JLPT ${this.currentSubCategory}`;
            } else if (this.currentMainCategory === 'partOfSpeech') {
                title = `${this.currentSubCategory} 단어`;
            } else if (this.currentMainCategory === 'theme') {
                title = `${this.currentSubCategory} 단어`;
            } else if (this.currentMainCategory === 'grammar') {
                title = `${this.currentSubCategory}`;
            }
        } else if (screenName === 'character') {
            // 문자 학습 화면: 선택된 문자 타입
            title = this.currentSubCategory || '일본어 문자';
        }

        appTitle.textContent = title;
        console.log(`Header title updated to: ${title}`);
    }

    /**
     * 검색 이벤트 바인딩
     */
    bindSearchEvents() {
        const searchInput = document.getElementById('search-input');
        const searchBtn = document.getElementById('search-execute-btn');
        const backToMainBtn = document.getElementById('backToMainBtn');

        if (searchInput && searchBtn) {
            // 검색 버튼 클릭 이벤트
            searchBtn.addEventListener('click', () => {
                this.performSearch();
            });

            // Enter 키 검색
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });

            console.log('Search events bound successfully');
        }

        // 검색 결과 화면의 뒤로가기 버튼
        if (backToMainBtn) {
            backToMainBtn.addEventListener('click', () => {
                this.showScreen('home');
            });
        }

        // 검색 화면 스와이프 이벤트 바인딩
        this.bindSearchSwipeEvents();
    }

    /**
     * 검색 화면 스와이프 이벤트 바인딩
     */
    bindSearchSwipeEvents() {
        const searchResultsScreen = document.getElementById('searchResultsScreen');
        if (!searchResultsScreen) {
            console.log('Search results screen not found, will bind swipe events later');
            return;
        }

        // 이미 바인딩된 경우 중복 방지
        if (searchResultsScreen.dataset.swipeBound) {
            return;
        }

        let startX = 0;
        let startY = 0;
        let endX = 0;
        let endY = 0;
        let isSwipingHorizontally = false;

        console.log('Binding swipe events to search results screen');

        // 터치 시작
        searchResultsScreen.addEventListener(
            'touchstart',
            (e) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                isSwipingHorizontally = false;
                console.log('Search touch start:', startX, startY);
            },
            { passive: true }
        );

        // 터치 이동 중
        searchResultsScreen.addEventListener(
            'touchmove',
            (e) => {
                if (!startX) return;

                const currentX = e.touches[0].clientX;
                const currentY = e.touches[0].clientY;
                const diffX = currentX - startX;
                const diffY = currentY - startY;

                // 왼쪽에서 오른쪽 스와이프만 허용 (이전 화면으로)
                if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10 && diffX > 0) {
                    isSwipingHorizontally = true;
                    e.preventDefault();

                    // 시각적 피드백 - 전체 화면에 적용 (오른쪽 스와이프만)
                    const movePercent = Math.min(diffX / 150, 0.3);
                    const opacity = 1 - movePercent;

                    searchResultsScreen.style.transform = `translateX(${diffX * 0.2}px)`;
                    searchResultsScreen.style.opacity = opacity;
                }
            },
            { passive: false }
        );

        // 터치 종료
        searchResultsScreen.addEventListener(
            'touchend',
            (e) => {
                if (e.changedTouches && e.changedTouches.length > 0) {
                    endX = e.changedTouches[0].clientX;
                    endY = e.changedTouches[0].clientY;
                }

                // 화면 원래 상태로 복원
                searchResultsScreen.style.transform = '';
                searchResultsScreen.style.opacity = '';
                searchResultsScreen.style.transition = 'all 0.3s ease';

                setTimeout(() => {
                    searchResultsScreen.style.transition = '';
                }, 300);

                // 스와이프 처리 (왼쪽→오른쪽만)
                if (isSwipingHorizontally) {
                    this.handleSearchSwipe(startX, endX);
                }

                // 초기화
                startX = 0;
                startY = 0;
                endX = 0;
                endY = 0;
                isSwipingHorizontally = false;
            },
            { passive: true }
        );

        // 터치 취소
        searchResultsScreen.addEventListener(
            'touchcancel',
            (e) => {
                searchResultsScreen.style.transform = '';
                searchResultsScreen.style.opacity = '';
                startX = 0;
                startY = 0;
                endX = 0;
                endY = 0;
                isSwipingHorizontally = false;
            },
            { passive: true }
        );

        // 중복 바인딩 방지 마크 설정
        searchResultsScreen.dataset.swipeBound = 'true';
    }

    /**
     * 검색 화면 스와이프 처리 (왼쪽→오른쪽만, 이전 화면으로)
     */
    handleSearchSwipe(startX, endX) {
        const deltaX = endX - startX;

        console.log('Handling search swipe:', {
            deltaX,
            startX,
            endX,
        });

        // 최소 스와이프 거리
        const minSwipeDistance = 50;

        // 왼쪽에서 오른쪽 스와이프만 처리 (이전 화면으로)
        if (deltaX > minSwipeDistance) {
            console.log('Swiping right - going back to home screen');
            // 홈 화면으로 돌아가기
            this.showScreen('home');
        }
    }

    /**
     * 검색 실행
     */
    async performSearch() {
        const searchInput = document.getElementById('search-input');
        const searchTerm = searchInput?.value?.trim();

        if (!searchTerm) {
            alert('검색어를 입력해주세요.');
            return;
        }

        try {
            // 로딩 표시
            this.showSearchLoading(true);

            // 검색 실행
            const dbManager = window.wordAppV3?.dbManager;
            if (!dbManager) {
                throw new Error('데이터베이스가 준비되지 않았습니다.');
            }

            const searchResults = await dbManager.searchWords(searchTerm, { limit: 50 });

            // 검색 히스토리 저장 (선택적)
            try {
                await dbManager.saveSearchHistory(searchTerm, searchResults.length);
            } catch (historyError) {
                console.warn('Failed to save search history:', historyError);
                // 검색 히스토리 저장 실패해도 검색은 계속 진행
            }

            // 검색 결과 표시
            await this.showSearchResults(searchTerm, searchResults);
        } catch (error) {
            console.error('Search error:', error);
            alert('검색 중 오류가 발생했습니다: ' + error.message);
        } finally {
            this.showSearchLoading(false);
        }
    }

    /**
     * 검색 결과 화면 표시
     */
    async showSearchResults(searchTerm, results) {
        // 검색 결과 화면으로 전환
        this.showScreen('searchResults');

        // 검색 정보 업데이트
        const searchQuery = document.getElementById('searchQuery');
        const searchStats = document.getElementById('searchStats');

        if (searchQuery) {
            searchQuery.textContent = `"${searchTerm}" 검색 결과`;
        }

        if (searchStats) {
            searchStats.textContent = `${results.length}개의 결과`;
        }

        // 결과 표시
        const searchResultsList = document.getElementById('searchResultsList');
        const noResults = document.getElementById('noResults');

        if (results.length === 0) {
            // 결과 없음
            if (searchResultsList) searchResultsList.style.display = 'none';
            if (noResults) noResults.style.display = 'flex';
        } else {
            // 결과 있음
            if (noResults) noResults.style.display = 'none';
            if (searchResultsList) {
                searchResultsList.style.display = 'flex';
                this.renderSearchResults(results);
            }
        }
    }

    /**
     * 검색 결과 렌더링
     */
    renderSearchResults(results) {
        const searchResultsList = document.getElementById('searchResultsList');
        const template = document.getElementById('searchResultItemTemplate');

        if (!searchResultsList || !template) {
            console.error('Search results elements not found');
            return;
        }

        // 기존 결과 클리어
        searchResultsList.innerHTML = '';

        results.forEach((result, index) => {
            const clone = template.content.cloneNode(true);

            // 데이터 설정
            const item = clone.querySelector('.search-result-item');
            item.dataset.wordId = result.id;

            // 텍스트 내용 설정
            const resultHanja = clone.querySelector('.result-hanja');
            const resultHiragana = clone.querySelector('.result-hiragana');
            const resultMeaning = clone.querySelector('.result-meaning');
            const resultJlpt = clone.querySelector('.result-jlpt');
            const resultPos = clone.querySelector('.result-pos');
            const matchType = clone.querySelector('.match-type');
            const matchScore = clone.querySelector('.match-score');

            if (resultHanja) resultHanja.textContent = result.hanja || '-';
            if (resultHiragana) resultHiragana.textContent = result.hiragana || '';
            if (resultMeaning) resultMeaning.textContent = result.mean || '';
            if (resultJlpt) resultJlpt.textContent = result.jlptLevel || '';
            if (resultPos) resultPos.textContent = result.partOfSpeech || '';

            // 주제 정보 추가
            const resultThemes = clone.querySelector('.result-themes');
            if (resultThemes && result.themes && result.themes.length > 0) {
                resultThemes.textContent = result.themes.slice(0, 2).join(', '); // 최대 2개만 표시
            }

            // 매치 정보 (주석 처리 - 필요 없는 기능)
            // if (matchType && result.matchType?.length > 0) {
            //     matchType.textContent = this.getMatchTypeLabel(result.matchType[0]);
            // }
            // if (matchScore) {
            //     matchScore.textContent = `점수: ${result.matchScore}`;
            // }

            // 예문 설정
            const resultExamples = clone.querySelector('.result-examples');
            const hasExample1 = result.jpExample1 || result.koExample1;
            const hasExample2 = result.jpExample2 || result.koExample2;

            if (hasExample1 || hasExample2) {
                // 첫 번째 예문
                if (hasExample1) {
                    const jpExample = clone.querySelector('.jp-example');
                    const koExample = clone.querySelector('.ko-example');

                    if (jpExample) jpExample.textContent = result.jpExample1 || '';
                    if (koExample) koExample.textContent = result.koExample1 || '';
                }

                // 두 번째 예문
                if (hasExample2) {
                    const jpExample2 = clone.querySelector('.jp-example-2');
                    const koExample2 = clone.querySelector('.ko-example-2');
                    const exampleItem2 = clone.querySelector('.example-item-2');

                    if (jpExample2) jpExample2.textContent = result.jpExample2 || '';
                    if (koExample2) koExample2.textContent = result.koExample2 || '';
                    if (exampleItem2) exampleItem2.style.display = 'block';
                }
            } else {
                if (resultExamples) resultExamples.style.display = 'none';
            }

            // 이벤트 바인딩
            this.bindSearchResultEvents(clone, result);

            searchResultsList.appendChild(clone);
        });

        console.log(`Rendered ${results.length} search results`);
    }

    /**
     * 검색 결과 아이템 이벤트 바인딩
     */
    bindSearchResultEvents(element, wordData) {
        const expandBtn = element.querySelector('.expand-btn');
        const studyBtn = element.querySelector('.study-btn');
        const resultExamples = element.querySelector('.result-examples');

        // 예문 펼치기/접기
        if (expandBtn && resultExamples) {
            expandBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isExpanded = resultExamples.style.display !== 'none';

                if (isExpanded) {
                    resultExamples.style.display = 'none';
                    expandBtn.classList.remove('expanded');
                } else {
                    resultExamples.style.display = 'block';
                    expandBtn.classList.add('expanded');
                }
            });
        }

        // 학습하기 버튼
        if (studyBtn) {
            studyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.startWordStudyFromSearch(wordData);
            });
        }

        // 아이템 클릭으로 예문 토글
        const item = element.querySelector('.search-result-item');
        if (item) {
            item.addEventListener('click', () => {
                if (expandBtn) expandBtn.click();
            });
        }
    }

    /**
     * 검색 결과에서 단어 학습 시작
     */
    async startWordStudyFromSearch(wordData) {
        try {
            // 단어 배열 형태로 변환
            const wordArray = [wordData];

            // WordApp에 단어 전달
            if (window.wordAppV3) {
                await window.wordAppV3.setWordsAndStart(wordArray);
                this.showScreen('word');
            } else {
                throw new Error('WordApp이 준비되지 않았습니다.');
            }
        } catch (error) {
            console.error('Error starting word study from search:', error);
            alert('단어 학습을 시작할 수 없습니다: ' + error.message);
        }
    }

    /**
     * 매치 타입 라벨 반환
     */
    getMatchTypeLabel(matchType) {
        const labels = {
            exact: '정확',
            startsWith: '시작',
            includes: '포함',
            theme: '주제',
        };
        return labels[matchType] || matchType;
    }

    /**
     * 검색 로딩 표시/숨김
     */
    showSearchLoading(show) {
        const searchLoading = document.getElementById('searchLoading');
        if (searchLoading) {
            searchLoading.style.display = show ? 'flex' : 'none';
        }
    }

    /**
     * JPG 버튼 표시/숨기기 제어
     */
    toggleJpgButton(screenName) {
        const jpgButton = document.getElementById('downloadJpgBtn');
        if (jpgButton) {
            if (screenName === 'word') {
                jpgButton.style.display = 'flex';
            } else {
                jpgButton.style.display = 'none';
            }
        }
    }

    /**
     * 조사 화면 표시
     */
    async showParticleScreen() {
        console.log('showParticleScreen called');

        try {
            // 템플릿 로드
            console.log('Loading particle-study template');
            const html = await loadTemplate('particle-study');
            console.log('Particle study template loaded successfully');

            // 화면 컨테이너 찾기
            const characterScreen = document.getElementById('characterScreen');
            if (!characterScreen) {
                console.error('Character screen container not found');
                return;
            }

            // 템플릿 적용
            characterScreen.innerHTML = html;
            console.log('Particle study template applied to characterScreen');

            // 화면 전환
            this.showScreen('character');

            // 조사 학습 앱 초기화
            setTimeout(() => {
                if (window.particleStudyApp) {
                    window.particleStudyApp.init();
                } else {
                    // 새로운 인스턴스 생성
                    window.particleStudyApp = new ParticleStudyApp();
                }
            }, 100);

            // 뒤로가기 스와이프 이벤트 바인딩
            this.bindParticleSwipeEvents(characterScreen);

        } catch (error) {
            console.error('Error loading particle screen:', error);
        }
    }

    /**
     * 조사 화면 스와이프 이벤트 바인딩
     */
    bindParticleSwipeEvents(screen) {
        if (screen.dataset.particleSwipeBound) {
            return;
        }

        let startX = 0;
        let startY = 0;
        let isSwipingHorizontally = false;

        console.log('Binding swipe events to particle screen');

        // 터치 시작
        screen.addEventListener(
            'touchstart',
            (e) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                isSwipingHorizontally = false;
            },
            { passive: true }
        );

        // 터치 이동
        screen.addEventListener(
            'touchmove',
            (e) => {
                if (!startX || !startY) return;

                const currentX = e.touches[0].clientX;
                const currentY = e.touches[0].clientY;

                const diffX = Math.abs(currentX - startX);
                const diffY = Math.abs(currentY - startY);

                // 수평 스와이프 감지
                if (diffX > diffY && diffX > 10) {
                    isSwipingHorizontally = true;
                    e.preventDefault();
                }
            },
            { passive: false }
        );

        // 터치 종료
        screen.addEventListener(
            'touchend',
            (e) => {
                if (!startX || !startY) return;

                const endX = e.changedTouches[0].clientX;
                const diffX = endX - startX;

                // 왼쪽에서 오른쪽으로 스와이프 (뒤로가기)
                if (isSwipingHorizontally && diffX > 50) {
                    console.log('Particle screen: swipe right detected - going back');
                    this.showScreen('sub');
                }

                // 초기화
                startX = 0;
                startY = 0;
                isSwipingHorizontally = false;
            },
            { passive: true }
        );

        // 중복 바인딩 방지
        screen.dataset.particleSwipeBound = 'true';
        console.log('Swipe events bound to particle screen');
    }

    /**
     * い형용사 활용 화면 스와이프 이벤트 바인딩
     */
    bindIAdjectiveSwipeEvents(screen) {
        if (screen.dataset.iAdjectiveSwipeBound) {
            return;
        }

        let startX = 0;
        let startY = 0;
        let isSwipingHorizontally = false;

        console.log('Binding swipe events to i-adjective screen');

        // 터치 시작
        screen.addEventListener(
            'touchstart',
            (e) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                isSwipingHorizontally = false;
            },
            { passive: true }
        );

        // 터치 이동
        screen.addEventListener(
            'touchmove',
            (e) => {
                if (!startX || !startY) return;

                const currentX = e.touches[0].clientX;
                const currentY = e.touches[0].clientY;

                const diffX = Math.abs(currentX - startX);
                const diffY = Math.abs(currentY - startY);

                // 수평 스와이프 감지
                if (diffX > diffY && diffX > 10) {
                    isSwipingHorizontally = true;
                    e.preventDefault();
                }
            },
            { passive: false }
        );

        // 터치 종료
        screen.addEventListener(
            'touchend',
            (e) => {
                if (!startX || !startY || !isSwipingHorizontally) return;

                const endX = e.changedTouches[0].clientX;
                const diffX = startX - endX;

                // 최소 스와이프 거리
                if (Math.abs(diffX) > 50) {
                    if (diffX > 0) {
                        // 오른쪽에서 왼쪽 스와이프 (뒤로가기)
                        console.log('Right to left swipe detected - going back');
                        this.showScreen('sub');
                    }
                }

                // 초기화
                startX = 0;
                startY = 0;
                isSwipingHorizontally = false;
            },
            { passive: true }
        );

        // 중복 바인딩 방지
        screen.dataset.iAdjectiveSwipeBound = 'true';
        console.log('Swipe events bound to i-adjective screen');
    }

    /**
     * な형용사 활용 화면 스와이프 이벤트 바인딩
     */
    bindNaAdjectiveSwipeEvents(screen) {
        if (screen.dataset.naAdjectiveSwipeBound) {
            return;
        }

        let startX = 0;
        let startY = 0;
        let isSwipingHorizontally = false;

        console.log('Binding swipe events to na-adjective screen');

        // 터치 시작
        screen.addEventListener(
            'touchstart',
            (e) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                isSwipingHorizontally = false;
            },
            { passive: true }
        );

        // 터치 이동
        screen.addEventListener(
            'touchmove',
            (e) => {
                if (!startX || !startY) return;

                const currentX = e.touches[0].clientX;
                const currentY = e.touches[0].clientY;

                const diffX = Math.abs(currentX - startX);
                const diffY = Math.abs(currentY - startY);

                // 수평 스와이프 감지
                if (diffX > diffY && diffX > 10) {
                    isSwipingHorizontally = true;
                    e.preventDefault();
                }
            },
            { passive: false }
        );

        // 터치 종료
        screen.addEventListener(
            'touchend',
            (e) => {
                if (!startX || !startY || !isSwipingHorizontally) return;

                const endX = e.changedTouches[0].clientX;
                const diffX = startX - endX;

                // 최소 스와이프 거리
                if (Math.abs(diffX) > 50) {
                    if (diffX > 0) {
                        // 오른쪽에서 왼쪽 스와이프 (뒤로가기)
                        console.log('Right to left swipe detected - going back');
                        this.showScreen('sub');
                    }
                }

                // 초기화
                startX = 0;
                startY = 0;
                isSwipingHorizontally = false;
            },
            { passive: true }
        );

        // 중복 바인딩 방지
        screen.dataset.naAdjectiveSwipeBound = 'true';
        console.log('Swipe events bound to na-adjective screen');
    }

    /**
     * 평서체/경어체 화면 표시
     */
    async showNounFormsScreen() {
        console.log('showNounFormsScreen called');

        try {
            // 템플릿 로드
            console.log('Loading noun-forms template');
            const html = await loadTemplate('noun-forms');
            console.log('Noun forms template loaded successfully');

            // 화면 컨테이너 찾기
            const characterScreen = document.getElementById('characterScreen');
            if (!characterScreen) {
                console.error('Character screen container not found');
                return;
            }

            // 템플릿 적용
            characterScreen.innerHTML = html;
            console.log('Noun forms template applied to characterScreen');

            // 화면 전환
            this.showScreen('character');

            // 평서체/경어체 앱 초기화
            setTimeout(() => {
                if (window.nounFormsApp) {
                    window.nounFormsApp.init();
                } else {
                    // 새로운 인스턴스 생성
                    window.nounFormsApp = new NounFormsApp();
                }
            }, 100);

            // 뒤로가기 스와이프 이벤트 바인딩
            this.bindNounFormsSwipeEvents(characterScreen);
        } catch (error) {
            console.error('Error loading noun forms screen:', error);
        }
    }

    /**
     * い형용사 활용 화면 표시
     */
    async showIAdjectiveScreen() {
        console.log('showIAdjectiveScreen called');

        try {
            // 템플릿 로드
            console.log('Loading i-adjective template');
            const html = await loadTemplate('i-adjective');
            console.log('I-adjective template loaded successfully');

            // 화면 컨테이너 찾기
            const characterScreen = document.getElementById('characterScreen');
            if (!characterScreen) {
                console.error('Character screen container not found');
                return;
            }

            // 템플릿 적용
            characterScreen.innerHTML = html;
            console.log('I-adjective template applied to characterScreen');

            // 화면 전환
            this.showScreen('character');

            // い형용사 활용 앱 초기화
            setTimeout(() => {
                if (window.iAdjectiveApp) {
                    window.iAdjectiveApp.init();
                } else {
                    // 새로운 인스턴스 생성
                    window.iAdjectiveApp = new IAdjectiveApp();
                }
            }, 100);

            // 뒤로가기 스와이프 이벤트 바인딩
            this.bindIAdjectiveSwipeEvents(characterScreen);
        } catch (error) {
            console.error('Error loading i-adjective screen:', error);
        }
    }

    /**
     * な형용사 활용 화면 표시
     */
    async showNaAdjectiveScreen() {
        console.log('showNaAdjectiveScreen called');

        try {
            // 템플릿 로드
            console.log('Loading na-adjective template');
            const html = await loadTemplate('na-adjective');
            console.log('Na-adjective template loaded successfully');

            // 화면 컨테이너 찾기
            const characterScreen = document.getElementById('characterScreen');
            if (!characterScreen) {
                console.error('Character screen container not found');
                return;
            }

            // 템플릿 적용
            characterScreen.innerHTML = html;
            console.log('Na-adjective template applied to characterScreen');

            // 화면 전환
            this.showScreen('character');

            // な형용사 활용 앱 초기화
            setTimeout(() => {
                if (window.naAdjectiveApp) {
                    window.naAdjectiveApp.init();
                } else {
                    // 새로운 인스턴스 생성
                    window.naAdjectiveApp = new NaAdjectiveApp();
                }
            }, 100);

            // 뒤로가기 스와이프 이벤트 바인딩
            this.bindNaAdjectiveSwipeEvents(characterScreen);
        } catch (error) {
            console.error('Error loading na-adjective screen:', error);
        }
    }

    /**
     * 1그룹동사 활용 화면 표시
     */
    async showGroup1VerbScreen() {
        console.log('showGroup1VerbScreen called');
        try {
            // 템플릿 로드
            console.log('Loading group1-verb template');
            const html = await loadTemplate('group1-verb');
            console.log('Group1-verb template loaded successfully');

            // 화면 컨테이너 찾기
            const characterScreen = document.getElementById('characterScreen');
            if (!characterScreen) {
                console.error('Character screen container not found');
                return;
            }

            // 템플릿 적용
            characterScreen.innerHTML = html;
            console.log('Group1-verb template applied to characterScreen');

            // 화면 전환
            this.showScreen('character');

            // 1그룹동사 활용 앱 초기화 - DOM 요소 존재 확인 후 초기화
            this.waitForElementAndInitialize('infoModal', () => {
                console.log('Initializing Group1VerbApp after DOM is ready');
                window.group1VerbApp = new Group1VerbApp();
            });

            // 뒤로가기 스와이프 이벤트 바인딩
            this.bindGroup1VerbSwipeEvents(characterScreen);
        } catch (error) {
            console.error('Error loading group1-verb screen:', error);
        }
    }

    /**
     * 1그룹동사 활용 화면 스와이프 이벤트 바인딩
     */
    bindGroup1VerbSwipeEvents(screen) {
        if (screen.dataset.group1VerbSwipeBound) {
            return;
        }

        let startX = 0;
        let startY = 0;
        let isSwipingHorizontally = false;

        console.log('Binding swipe events to group1 verb screen');

        // 터치 시작
        screen.addEventListener(
            'touchstart',
            (e) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                isSwipingHorizontally = false;
            },
            { passive: true }
        );

        // 터치 이동
        screen.addEventListener(
            'touchmove',
            (e) => {
                if (!startX || !startY) return;

                const currentX = e.touches[0].clientX;
                const currentY = e.touches[0].clientY;

                const diffX = Math.abs(currentX - startX);
                const diffY = Math.abs(currentY - startY);

                // 수평 스와이프 감지
                if (diffX > diffY && diffX > 10) {
                    isSwipingHorizontally = true;
                    e.preventDefault();
                }
            },
            { passive: false }
        );

        // 터치 종료
        screen.addEventListener(
            'touchend',
            (e) => {
                if (!startX || !startY) return;

                // 최소 스와이프 거리
                if (isSwipingHorizontally) {
                    const endX = e.changedTouches[0].clientX;
                    const diffX = startX - endX;

                    if (Math.abs(diffX) > 50) {
                        if (diffX < 0) {
                            // 왼쪽에서 오른쪽 스와이프 (뒤로가기)
                            console.log('Left to right swipe detected - going back');
                            this.showScreen('sub');
                        }
                    }
                }

                // 초기화
                startX = 0;
                startY = 0;
                isSwipingHorizontally = false;
            },
            { passive: true }
        );

        screen.dataset.group1VerbSwipeBound = 'true';
    }

    /**
     * 2그룹동사 활용 화면 표시
     */
    async showGroup2VerbScreen() {
        console.log('showGroup2VerbScreen called');
        try {
            // 템플릿 로드
            console.log('Loading group2-verb template');
            const html = await loadTemplate('group2-verb');
            console.log('Group2-verb template loaded successfully');

            // 화면 컨테이너 찾기
            const characterScreen = document.getElementById('characterScreen');
            if (!characterScreen) {
                console.error('Character screen container not found');
                return;
            }

            // 템플릿 적용
            characterScreen.innerHTML = html;
            console.log('Group2-verb template applied to characterScreen');

            // 화면 전환
            this.showScreen('character');

            // 2그룹동사 활용 앱 초기화 - DOM 요소 존재 확인 후 초기화
            this.waitForElementAndInitialize('infoModal', () => {
                console.log('Initializing Group2VerbApp after DOM is ready');
                window.group2VerbApp = new Group2VerbApp();

                // 모달 이벤트 바인딩
                setTimeout(() => {
                    if (window.group2VerbApp) {
                        window.group2VerbApp.bindModalEvents();
                    }
                }, 100);
            });

            // 뒤로가기 스와이프 이벤트 바인딩
            this.bindGroup2VerbSwipeEvents(characterScreen);
        } catch (error) {
            console.error('Error loading group2-verb screen:', error);
        }
    }

    /**
     * 2그룹동사 활용 화면 스와이프 이벤트 바인딩
     */
    bindGroup2VerbSwipeEvents(screen) {
        if (screen.dataset.group2VerbSwipeBound) {
            return;
        }

        let startX = 0;
        let startY = 0;
        let isSwipingHorizontally = false;

        console.log('Binding swipe events to group2 verb screen');

        // 터치 시작
        screen.addEventListener(
            'touchstart',
            (e) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                isSwipingHorizontally = false;
            },
            { passive: true }
        );

        // 터치 이동
        screen.addEventListener(
            'touchmove',
            (e) => {
                if (!startX || !startY) return;

                const currentX = e.touches[0].clientX;
                const currentY = e.touches[0].clientY;

                const diffX = Math.abs(currentX - startX);
                const diffY = Math.abs(currentY - startY);

                // 수평 스와이프 감지
                if (diffX > diffY && diffX > 10) {
                    isSwipingHorizontally = true;
                    e.preventDefault();
                }
            },
            { passive: false }
        );

        // 터치 종료
        screen.addEventListener(
            'touchend',
            (e) => {
                if (!startX || !startY) return;

                // 최소 스와이프 거리
                if (isSwipingHorizontally) {
                    const endX = e.changedTouches[0].clientX;
                    const diffX = startX - endX;

                    if (Math.abs(diffX) > 50) {
                        if (diffX < 0) {
                            // 왼쪽에서 오른쪽 스와이프 (뒤로가기)
                            console.log('Left to right swipe detected - going back');
                            this.showScreen('sub');
                        }
                    }
                }

                // 초기화
                startX = 0;
                startY = 0;
                isSwipingHorizontally = false;
            },
            { passive: true }
        );

        screen.dataset.group2VerbSwipeBound = 'true';
    }

    /**
     * 3그룹동사 활용 화면 표시
     */
    async showGroup3VerbScreen() {
        console.log('showGroup3VerbScreen called');
        try {
            // 템플릿 로드
            console.log('Loading group3-verb template');
            const html = await loadTemplate('group3-verb');
            console.log('Group3-verb template loaded successfully');

            // 화면 컨테이너 찾기
            const characterScreen = document.getElementById('characterScreen');
            if (!characterScreen) {
                console.error('Character screen container not found');
                return;
            }

            // 템플릿 적용
            characterScreen.innerHTML = html;
            console.log('Group3-verb template applied to characterScreen');

            // 화면 전환
            this.showScreen('character');

            // 3그룹동사 활용 앱 초기화 - DOM 요소 존재 확인 후 초기화
            this.waitForElementAndInitialize('infoModal', () => {
                console.log('Initializing Group3VerbApp after DOM is ready');
                window.group3VerbApp = new Group3VerbApp();

                // 모달 이벤트 바인딩
                setTimeout(() => {
                    if (window.group3VerbApp) {
                        window.group3VerbApp.bindModalEvents();
                    }
                }, 100);
            });

            // 뒤로가기 스와이프 이벤트 바인딩
            this.bindGroup3VerbSwipeEvents(characterScreen);
        } catch (error) {
            console.error('Error loading group3-verb screen:', error);
        }
    }

    /**
     * 3그룹동사 활용 화면 스와이프 이벤트 바인딩
     */
    bindGroup3VerbSwipeEvents(screen) {
        if (screen.dataset.group3VerbSwipeBound) {
            return;
        }

        let startX = 0;
        let startY = 0;
        let isSwipingHorizontally = false;

        console.log('Binding swipe events to group3 verb screen');

        // 터치 시작
        screen.addEventListener(
            'touchstart',
            (e) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                isSwipingHorizontally = false;
            },
            { passive: true }
        );

        // 터치 이동
        screen.addEventListener(
            'touchmove',
            (e) => {
                if (!startX || !startY) return;

                const currentX = e.touches[0].clientX;
                const currentY = e.touches[0].clientY;

                const diffX = Math.abs(currentX - startX);
                const diffY = Math.abs(currentY - startY);

                // 수평 스와이프 감지
                if (diffX > diffY && diffX > 10) {
                    isSwipingHorizontally = true;
                    e.preventDefault();
                }
            },
            { passive: false }
        );

        // 터치 종료
        screen.addEventListener(
            'touchend',
            (e) => {
                if (!startX || !startY) return;

                // 최소 스와이프 거리
                if (isSwipingHorizontally) {
                    const endX = e.changedTouches[0].clientX;
                    const diffX = startX - endX;

                    if (Math.abs(diffX) > 50) {
                        if (diffX < 0) {
                            // 왼쪽에서 오른쪽 스와이프 (뒤로가기)
                            console.log('Left to right swipe detected - going back');
                            this.showScreen('sub');
                        }
                    }
                }

                // 초기화
                startX = 0;
                startY = 0;
                isSwipingHorizontally = false;
            },
            { passive: true }
        );

        screen.dataset.group3VerbSwipeBound = 'true';
    }

    /**
     * 평서체/경어체 화면 스와이프 이벤트 바인딩
     */
    bindNounFormsSwipeEvents(screen) {
        if (screen.dataset.nounFormsSwipeBound) {
            return;
        }

        let startX = 0;
        let startY = 0;
        let isSwipingHorizontally = false;

        console.log('Binding swipe events to noun forms screen');

        // 터치 시작
        screen.addEventListener(
            'touchstart',
            (e) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                isSwipingHorizontally = false;
            },
            { passive: true }
        );

        // 터치 이동
        screen.addEventListener(
            'touchmove',
            (e) => {
                if (!startX || !startY) return;

                const currentX = e.touches[0].clientX;
                const currentY = e.touches[0].clientY;

                const diffX = Math.abs(currentX - startX);
                const diffY = Math.abs(currentY - startY);

                // 수평 스와이프 감지
                if (diffX > diffY && diffX > 10) {
                    isSwipingHorizontally = true;
                    e.preventDefault();
                }
            },
            { passive: false }
        );

        // 터치 종료
        screen.addEventListener(
            'touchend',
            (e) => {
                if (!startX || !startY) return;

                const endX = e.changedTouches[0].clientX;
                const diffX = endX - startX;

                // 왼쪽에서 오른쪽으로 스와이프 (뒤로가기)
                if (isSwipingHorizontally && diffX > 50) {
                    console.log('Noun forms screen: swipe right detected - going back');
                    this.showScreen('sub');
                }

                // 초기화
                startX = 0;
                startY = 0;
                isSwipingHorizontally = false;
            },
            { passive: true }
        );

        // 중복 바인딩 방지
        screen.dataset.nounFormsSwipeBound = 'true';
        console.log('Swipe events bound to noun forms screen');
    }

    /**
     * 문장 완성 화면 표시
     */
    async showSentenceCompletionScreen() {
        console.log('showSentenceCompletionScreen called');

        try {
            // 템플릿 로드
            console.log('Loading sentence-completion template');
            const html = await loadTemplate('sentence-completion');
            console.log('Sentence completion template loaded successfully');

            // 화면 컨테이너 찾기
            const characterScreen = document.getElementById('characterScreen');
            if (!characterScreen) {
                console.error('Character screen container not found');
                return;
            }

            // 템플릿 적용
            characterScreen.innerHTML = html;
            console.log('Sentence completion template applied to characterScreen');

            // 화면 전환
            this.showScreen('character');

            // 문장 완성 앱 초기화
            setTimeout(() => {
                if (window.sentenceCompletionApp) {
                    window.sentenceCompletionApp.init();
                } else {
                    // 새로운 인스턴스 생성
                    window.sentenceCompletionApp = new SentenceCompletionApp();
                }
            }, 100);

            // 뒤로가기 스와이프 이벤트 바인딩
            this.bindSentenceCompletionSwipeEvents(characterScreen);
        } catch (error) {
            console.error('Error loading sentence completion screen:', error);
        }
    }

    /**
     * 문장 완성 화면 스와이프 이벤트 바인딩
     */
    bindSentenceCompletionSwipeEvents(screen) {
        if (screen.dataset.sentenceSwipeBound) {
            return;
        }

        let startX = 0;
        let startY = 0;
        let isSwipingHorizontally = false;

        console.log('Binding swipe events to sentence completion screen');

        // 터치 시작
        screen.addEventListener(
            'touchstart',
            (e) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                isSwipingHorizontally = false;
            },
            { passive: true }
        );

        // 터치 이동
        screen.addEventListener(
            'touchmove',
            (e) => {
                if (!startX || !startY) return;

                const currentX = e.touches[0].clientX;
                const currentY = e.touches[0].clientY;

                const diffX = Math.abs(currentX - startX);
                const diffY = Math.abs(currentY - startY);

                // 수평 스와이프 감지
                if (diffX > diffY && diffX > 10) {
                    isSwipingHorizontally = true;
                    e.preventDefault();
                }
            },
            { passive: false }
        );

        // 터치 종료
        screen.addEventListener(
            'touchend',
            (e) => {
                if (!startX || !startY) return;

                const endX = e.changedTouches[0].clientX;
                const diffX = endX - startX;

                // 왼쪽에서 오른쪽으로 스와이프 (뒤로가기)
                if (isSwipingHorizontally && diffX > 50) {
                    console.log('Sentence completion screen: swipe right detected - going back');
                    this.showScreen('sub');
                }

                // 초기화
                startX = 0;
                startY = 0;
                isSwipingHorizontally = false;
            },
            { passive: true }
        );

        // 중복 바인딩 방지
        screen.dataset.sentenceSwipeBound = 'true';
        console.log('Swipe events bound to sentence completion screen');
    }

    /**
     * 명사 활용 화면 표시 (기존 방식)
     */
    async showNounConjugationScreen() {
        console.log('showNounConjugationScreen called');

        try {
            // 템플릿 로드
            console.log('Loading noun-conjugation template');
            const html = await loadTemplate('noun-conjugation');
            console.log('Noun conjugation template loaded successfully');

            // 화면 컨테이너 찾기
            const characterScreen = document.getElementById('characterScreen');
            if (!characterScreen) {
                console.error('Character screen container not found');
                return;
            }

            // 템플릿 적용
            characterScreen.innerHTML = html;
            console.log('Noun conjugation template applied to characterScreen');

            // 화면 전환
            this.showScreen('character');

            // 명사 활용 앱 초기화
            setTimeout(() => {
                if (window.nounConjugationApp) {
                    window.nounConjugationApp.init();
                } else {
                    // 새로운 인스턴스 생성
                    window.nounConjugationApp = new NounConjugationApp();
                }
            }, 100);

            // 뒤로가기 스와이프 이벤트 바인딩
            this.bindNounConjugationSwipeEvents(characterScreen);
        } catch (error) {
            console.error('Error loading noun conjugation screen:', error);
        }
    }

    /**
     * 명사 활용 화면 스와이프 이벤트 바인딩
     */
    bindNounConjugationSwipeEvents(screen) {
        if (screen.dataset.nounSwipeBound) {
            return;
        }

        let startX = 0;
        let startY = 0;
        let isSwipingHorizontally = false;

        console.log('Binding swipe events to noun conjugation screen');

        // 터치 시작
        screen.addEventListener(
            'touchstart',
            (e) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                isSwipingHorizontally = false;
            },
            { passive: true }
        );

        // 터치 이동
        screen.addEventListener(
            'touchmove',
            (e) => {
                if (!startX || !startY) return;

                const currentX = e.touches[0].clientX;
                const currentY = e.touches[0].clientY;

                const diffX = Math.abs(currentX - startX);
                const diffY = Math.abs(currentY - startY);

                // 수평 스와이프 감지
                if (diffX > diffY && diffX > 10) {
                    isSwipingHorizontally = true;
                    e.preventDefault();
                }
            },
            { passive: false }
        );

        // 터치 종료
        screen.addEventListener(
            'touchend',
            (e) => {
                if (!startX || !startY) return;

                const endX = e.changedTouches[0].clientX;
                const diffX = endX - startX;

                // 왼쪽에서 오른쪽으로 스와이프 (뒤로가기)
                if (isSwipingHorizontally && diffX > 50) {
                    console.log('Noun conjugation screen: swipe right detected - going back');
                    this.showScreen('sub');
                }

                // 초기화
                startX = 0;
                startY = 0;
                isSwipingHorizontally = false;
            },
            { passive: true }
        );

        // 중복 바인딩 방지
        screen.dataset.nounSwipeBound = 'true';
        console.log('Swipe events bound to noun conjugation screen');
    }

    /**
     * 문자 학습 화면 표시
     */
    async showCharacterScreen(characterType) {
        console.log('showCharacterScreen called with:', characterType);

        try {
            // 템플릿 매핑
            const templateMap = {
                히라가나: 'hiragana-screen',
                가타카나: 'katakana-screen',
                '탁음 & 반탁음': 'dakuten-screen',
                요음: 'youon-screen',
            };

            const templateName = templateMap[characterType];
            if (!templateName) {
                console.error('Unknown character type:', characterType);
                return;
            }

            console.log('Loading template:', templateName);

            // 템플릿 로드
            const html = await loadTemplate(templateName);
            console.log('Template loaded successfully, HTML length:', html.length);

            // 화면 컨테이너 찾기
            const characterScreen = document.getElementById('characterScreen');
            if (!characterScreen) {
                console.error('Character screen container not found');
                return;
            }

            // 템플릿 적용
            characterScreen.innerHTML = html;
            console.log('Template applied to characterScreen, innerHTML length:', characterScreen.innerHTML.length);

            // 화면 전환
            console.log('Switching to character screen...');
            this.showScreen('character');

            // 문자 학습 이벤트 바인딩
            this.bindCharacterEvents(characterType);
        } catch (error) {
            console.error('Error loading character screen:', error);
        }
    }

    /**
     * 문자 학습 화면 이벤트 바인딩
     */
    bindCharacterEvents(characterType) {
        // 뒤로가기 스와이프 이벤트 (전체 화면)
        const characterScreen = document.getElementById('characterScreen');
        if (characterScreen && !characterScreen.dataset.swipeBound) {
            this.bindCharacterSwipeEvents(characterScreen);
        }

        // 문자 항목 클릭 이벤트 (그리드에서 메인 문자로 이동)
        const characterItems = characterScreen?.querySelectorAll('.character-item[data-char]');
        if (characterItems) {
            characterItems.forEach((item) => {
                item.addEventListener('click', () => {
                    const char = item.dataset.char;
                    const romaji = item.dataset.romaji;
                    const sound = item.dataset.sound;

                    // 메인 문자 업데이트
                    this.updateMainCharacter(characterType, char, romaji, sound, item.dataset);
                });
            });
        }

        console.log(`Character events bound for ${characterType}`);
    }

    /**
     * 메인 문자 표시 업데이트
     */
    updateMainCharacter(characterType, char, romaji, sound, extraData = {}) {
        const characterScreen = document.getElementById('characterScreen');
        if (!characterScreen) return;

        // 문자별 요소 ID 매핑
        const elementMap = {
            히라가나: {
                char: '#mainHiragana',
                romaji: '#hiraganaRomaji',
                sound: '#hiraganaKoreanSound',
            },
            가타카나: {
                char: '#mainKatakana',
                romaji: '#katakanaRomaji',
                sound: '#katakanaKoreanSound',
            },
            '탁음 & 반탁음': {
                char: '#mainDakuten',
                romaji: '#dakutenRomaji',
                sound: '#dakutenKoreanSound',
            },
            요음: {
                char: '#mainYouon',
                romaji: '#youonRomaji',
                sound: '#youonKoreanSound',
            },
        };

        const elements = elementMap[characterType];
        if (!elements) return;

        // 요소 업데이트
        const charEl = characterScreen.querySelector(elements.char);
        const romajiEl = characterScreen.querySelector(elements.romaji);
        const soundEl = characterScreen.querySelector(elements.sound);

        if (charEl) charEl.textContent = char;
        if (romajiEl) romajiEl.textContent = romaji;
        if (soundEl) soundEl.textContent = sound;

        // 추가 정보 업데이트 (탁음의 경우 베이스 문자 등)
        if (characterType === '탁음 & 반탁음' && extraData.base) {
            const baseEl = characterScreen.querySelector('.base-character');
            if (baseEl) baseEl.textContent = `← ${extraData.base} + ${char.includes('゛') ? '゛' : '゜'}`;
        }

        console.log(`Updated main character: ${char} (${romaji})`);
    }

    /**
     * 문자 학습 화면 스와이프 이벤트 바인딩
     */
    bindCharacterSwipeEvents(characterScreen) {
        let startX = 0;
        let startY = 0;
        let isSwipingHorizontally = false;

        console.log('Binding swipe events to character screen');

        // 터치 시작
        characterScreen.addEventListener(
            'touchstart',
            (e) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                isSwipingHorizontally = false;
            },
            { passive: true }
        );

        // 터치 이동
        characterScreen.addEventListener(
            'touchmove',
            (e) => {
                if (!startX || !startY) return;

                const currentX = e.touches[0].clientX;
                const currentY = e.touches[0].clientY;

                const diffX = Math.abs(currentX - startX);
                const diffY = Math.abs(currentY - startY);

                // 수평 스와이프 감지
                if (diffX > diffY && diffX > 10) {
                    isSwipingHorizontally = true;
                    e.preventDefault();
                }
            },
            { passive: false }
        );

        // 터치 종료
        characterScreen.addEventListener(
            'touchend',
            (e) => {
                if (!startX || !startY) return;

                const endX = e.changedTouches[0].clientX;
                const diffX = endX - startX;

                // 왼쪽에서 오른쪽으로 스와이프 (뒤로가기)
                if (isSwipingHorizontally && diffX > 50) {
                    console.log('Character screen: swipe right detected - going back');
                    this.showScreen('sub');
                }

                // 초기화
                startX = 0;
                startY = 0;
                isSwipingHorizontally = false;
            },
            { passive: true }
        );

        // 중복 바인딩 방지
        characterScreen.dataset.swipeBound = 'true';
        console.log('Swipe events bound to character screen');
    }

    /**
     * 두번째 화면 - 하위 카테고리 표시
     */
    async showSubCategories(mainCategory) {
        console.log('showSubCategories called with:', mainCategory);

        // 먼저 서브 카테고리 화면으로 전환
        this.showScreen('sub');

        // DOM이 업데이트될 시간을 주기 위해 약간 대기
        await new Promise(resolve => setTimeout(resolve, 100));

        const subCategoryButtons = document.getElementById('subCategoryButtons');

        console.log('subCategoryButtons:', subCategoryButtons);

        if (!subCategoryButtons) {
            console.error('Sub category buttons not found, available elements:');
            console.log('Available elements with IDs:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
            return;
        }

        // 로딩 상태 표시
        subCategoryButtons.innerHTML = '<div class="loading">로딩 중...</div>';

        let categories = [];

        try {
            if (mainCategory === 'jpCharacter') {
                console.log('Processing jpCharacter category');
                categories = ['히라가나', '가타카나', '탁음 & 반탁음', '요음'];
                console.log('jpCharacter categories:', categories);
            } else if (mainCategory === 'grammar') {
                console.log('Processing grammar category');
                categories = [
                    '평서체/경어체',
                    '조사',
                    'い형용사 활용',
                    'な형용사 활용',
                    '1그룹동사 활용',
                    '2그룹동사 활용',
                    '3그룹동사 활용',
                ];
                console.log('grammar categories:', categories);
            } else if (mainCategory === 'jlpt') {
                console.log('Processing JLPT category');
                categories = ['N5', 'N4', 'N3', 'N2', 'N1'];
                console.log('JLPT categories:', categories);
            } else if (mainCategory === 'partOfSpeech') {
                console.log('Processing partOfSpeech category');
                categories = await this.getPartOfSpeechFromDB();
                console.log('PartOfSpeech categories:', categories);
            } else if (mainCategory === 'theme') {
                console.log('Processing theme category');
                categories = await this.getThemesFromDB();
                console.log('Theme categories:', categories);
            }

            // 로딩 상태 제거
            subCategoryButtons.innerHTML = '';

            // 버튼 컨테이너 레이아웃 설정
            // subCategoryButtons 자체가 .button-container입니다
            const buttonContainer = subCategoryButtons;
            console.log('buttonContainer:', buttonContainer);
            console.log('buttonContainer id:', buttonContainer.id);
            console.log('buttonContainer classes before:', buttonContainer.className);

            if (mainCategory === 'partOfSpeech' || mainCategory === 'theme') {
                // 품사와 주제는 2열 레이아웃
                buttonContainer.classList.add('two-columns');
                console.log('Applied two-columns layout for:', mainCategory);
                console.log('buttonContainer classes after:', buttonContainer.className);
            } else {
                // N1~N5는 기본 1열 레이아웃
                buttonContainer.classList.remove('two-columns');
                console.log('Applied single-column layout for:', mainCategory);
                console.log('buttonContainer classes after:', buttonContainer.className);
            }

            // 버튼 생성
            console.log('Creating buttons for categories:', categories);
            this.createSubCategoryButtons(categories, subCategoryButtons);

            this.showScreen('sub');
        } catch (error) {
            console.error('Error loading sub categories:', error);
            subCategoryButtons.innerHTML = '<div class="error">카테고리 로드 실패</div>';
        }
    }

    /**
     * 하위 카테고리 버튼들 생성
     */
    createSubCategoryButtons(categories, container) {
        if (!categories || categories.length === 0) {
            console.error('No categories provided');
            container.innerHTML = '<div class="error">카테고리가 없습니다.</div>';
            return;
        }

        categories.forEach((category) => {
            const button = document.createElement('button');
            button.className = 'category-button';
            button.textContent = category;
            button.addEventListener('click', () => {
                this.currentSubCategory = category;

                // jpCharacter 카테고리의 경우 문자 학습 화면으로 이동
                if (this.currentMainCategory === 'jpCharacter') {
                    this.showCharacterScreen(category);
                } else if (this.currentMainCategory === 'grammar' && category === '평서체/경어체') {
                    this.showNounFormsScreen();
                } else if (this.currentMainCategory === 'grammar' && category === '조사') {
                    this.showParticleScreen();
                } else if (this.currentMainCategory === 'grammar' && category === 'い형용사 활용') {
                    this.showIAdjectiveScreen();
                } else if (this.currentMainCategory === 'grammar' && category === 'な형용사 활용') {
                    this.showNaAdjectiveScreen();
                } else if (this.currentMainCategory === 'grammar' && category === '1그룹동사 활용') {
                    this.showGroup1VerbScreen();
                } else if (this.currentMainCategory === 'grammar' && category === '2그룹동사 활용') {
                    this.showGroup2VerbScreen();
                } else if (this.currentMainCategory === 'grammar' && category === '3그룹동사 활용') {
                    this.showGroup3VerbScreen();
                } else {
                    this.startWordStudy();
                }
            });
            container.appendChild(button);
        });

        console.log(`Created ${categories.length} sub category buttons`);
    }

    /**
     * DB에서 품사 목록 가져오기
     */
    async getPartOfSpeechFromDB() {
        try {
            if (window.wordAppV3 && window.wordAppV3.dbManager) {
                const allWords = await window.wordAppV3.dbManager.getWordsByFilter('all');
                const partOfSpeechSet = new Set();
                allWords.forEach((word) => {
                    if (word.partOfSpeech) {
                        partOfSpeechSet.add(word.partOfSpeech);
                    }
                });
                return Array.from(partOfSpeechSet).sort();
            }
        } catch (error) {
            console.error('Error getting part of speech from DB:', error);
        }
        return ['명사', '동사', 'い형용사', 'な형용사', '부사', '조사'];
    }

    /**
     * DB에서 주제 목록 가져오기
     */
    async getThemesFromDB() {
        try {
            if (window.wordAppV3 && window.wordAppV3.dbManager) {
                const allWords = await window.wordAppV3.dbManager.getWordsByFilter('all');
                const themeSet = new Set();
                allWords.forEach((word) => {
                    if (word.themes && Array.isArray(word.themes)) {
                        word.themes.forEach((theme) => themeSet.add(theme));
                    }
                });
                return Array.from(themeSet).sort();
            }
        } catch (error) {
            console.error('Error getting themes from DB:', error);
        }
        return ['기본표현', '음식', '교육', '시간', '가족'];
    }

    /**
     * 단어 학습 시작
     */
    async startWordStudy() {
        // 필터 설정
        let filters = {};

        if (this.currentMainCategory === 'jlpt') {
            filters.jlptLevel = this.currentSubCategory;
        } else if (this.currentMainCategory === 'partOfSpeech') {
            filters.partOfSpeech = this.currentSubCategory;
        } else if (this.currentMainCategory === 'theme') {
            filters.theme = this.currentSubCategory;
        }

        // 필터 요약 표시
        this.showFilterSummary(filters);

        // 단어 화면으로 전환
        this.showScreen('word');

        // DOM이 렌더링될 시간을 주기 위해 약간의 딜레이
        await new Promise((resolve) => setTimeout(resolve, 300));

        // WordApp에 필터 전달하고 단어 학습 시작
        if (window.wordAppV3) {
            try {
                await window.wordAppV3.setFiltersAndStart(filters);
            } catch (error) {
                console.error('Error starting word study:', error);
                alert('단어 로드 중 오류가 발생했습니다. 다시 시도해주세요.');
            }
        } else {
            console.error('WordAppV3 not available');
            alert('단어장 앱이 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
            return;
        }
    }

    /**
     * 필터 요약 표시
     */
    showFilterSummary(filters) {
        const filterSummary = document.getElementById('filterSummary');
        if (!filterSummary) return;

        let summaryText = '';

        if (filters.jlptLevel) {
            summaryText = `JLPT ${filters.jlptLevel} 단어`;
        } else if (filters.partOfSpeech) {
            summaryText = `${filters.partOfSpeech} 단어`;
        } else if (filters.theme) {
            summaryText = `${filters.theme} 관련 단어`;
        }

        filterSummary.textContent = summaryText;
        filterSummary.style.display = 'block';

        console.log(`Filter summary: ${summaryText}`);
    }

    /**
     * 하단 네비게이션 바 이벤트 바인딩
     */
    bindBottomNavEvents() {
        // 홈 버튼
        const homeBtn = document.getElementById('home-btn');
        if (homeBtn) {
            homeBtn.addEventListener('click', () => {
                this.showScreen('home');
                this.updateNavButtons('home');
            });
        }

        // 검색 버튼 (중앙)
        const searchBtn = document.getElementById('search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.showSearchModal();
                this.updateNavButtons('search');
            });
        }

        // 더보기 버튼
        const moreBtn = document.getElementById('more-btn');
        if (moreBtn) {
            moreBtn.addEventListener('click', () => {
                this.showMoreModal();
                this.updateNavButtons('more');
            });
        }

        console.log('Bottom navigation events bound successfully');
    }

    /**
     * 네비게이션 버튼 활성화 상태 업데이트
     */
    updateNavButtons(activeBtn) {
        const navBtns = document.querySelectorAll('.nav-btn');
        navBtns.forEach((btn) => {
            btn.classList.remove('active');
        });

        if (activeBtn && document.getElementById(`${activeBtn}-btn`)) {
            document.getElementById(`${activeBtn}-btn`).classList.add('active');
        }
    }

    /**
     * 검색 모달 표시
     */
    showSearchModal() {
        // 임시 알림 - 나중에 실제 검색 기능으로 교체
        this.showToast('🔍 검색 기능은 추후 업데이트 예정입니다!');
    }

    /**
     * 더보기 모달 표시
     */
    showMoreModal() {
        // 임시 알림 - 나중에 실제 설정 메뉴로 교체
        this.showToast('⚙️ 설정 메뉴는 추후 업데이트 예정입니다!');
    }

    /**
     * 토스트 메시지 표시
     */
    showToast(message) {
        // 기존 토스트 제거
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        // 새 토스트 생성
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            z-index: 1000;
            backdrop-filter: blur(10px);
            animation: fadeInOut 3s ease-in-out;
            font-size: 0.9rem;
            font-weight: 500;
            text-align: center;
            max-width: 80%;
        `;

        // 애니메이션 키프레임 추가 (한 번만)
        if (!document.querySelector('#toast-animation-style')) {
            const style = document.createElement('style');
            style.id = 'toast-animation-style';
            style.textContent = `
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                    15% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    85% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);

        // 3초 후 자동 제거
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 3000);
    }

    /**
     * 네비게이션 재초기화 (필요시 사용)
     */
    async reinitialize() {
        console.log('Reinitializing navigation...');
        this.isInitialized = false;
        await this.init();
    }
}

// DOM 로드 완료 후 네비게이션 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing navigation...');

    // 즉시 네비게이션 초기화 (DB 없어도 UI는 먼저 보여줌)
    console.log('Initializing navigation immediately...');
    window.navigation = new ThreeStepNavigation();

    // WordAppV3는 백그라운드에서 초기화
    const waitForWordApp = async () => {
        let attempts = 0;
        while ((!window.wordAppV3 || !window.wordAppV3.dbManager || !window.wordAppV3.dbManager.db) && attempts < 100) {
            console.log(`Background: Waiting for WordAppV3 initialization... (${attempts + 1}/100)`);
            await new Promise((resolve) => setTimeout(resolve, 100));
            attempts++;
        }

        if (window.wordAppV3 && window.wordAppV3.dbManager && window.wordAppV3.dbManager.db) {
            console.log('WordAppV3 ready - navigation already initialized');
        } else {
            console.error('WordAppV3 initialization failed, but navigation is working');
        }
    };

    // 백그라운드에서 WordApp 대기
    setTimeout(waitForWordApp, 1000);
});
