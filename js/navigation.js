/**
 * 3단계 화면 네비게이션 로직
 * Template 기반 구조로 구현
 */
class ThreeStepNavigation {
    constructor() {
        this.currentMainCategory = '';
        this.currentSubCategory = '';
        this.screens = {
            main: 'mainCategoryScreen',
            sub: 'subCategoryScreen',
            word: 'wordScreen',
            character: 'characterScreen',
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
            this.showScreen('main');

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
        const templates = ['main-category-screen', 'sub-category-screen', 'word-screen'];

        let combinedHTML = '';
        for (const template of templates) {
            const html = await loadTemplate(template);
            combinedHTML += html;
        }

        mainContent.innerHTML = combinedHTML;

        // Character screen 컨테이너 미리 생성
        const characterScreen = document.createElement('div');
        characterScreen.id = 'characterScreen';
        characterScreen.className = 'screen';
        mainContent.appendChild(characterScreen);

        console.log('All templates rendered successfully');

        // 템플릿 로드 완료 이벤트 발생
        window.dispatchEvent(new CustomEvent('templatesLoaded'));

        // 템플릿 렌더링 후 스와이프 이벤트 다시 바인딩
        setTimeout(() => {
            this.bindSwipeEvents();
        }, 100);
    }

    /**
     * 이벤트 바인딩
     */
    bindEvents() {
        // 첫번째 화면 - 큰 카테고리 버튼들
        document.querySelectorAll('[data-category]').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                this.currentMainCategory = e.target.dataset.category;
                this.showSubCategories(this.currentMainCategory);
            });
        });

        // 뒤로가기 버튼들 (backToSubBtn만 유지)
        const backToSubBtn = document.getElementById('backToSubBtn');

        if (backToSubBtn) {
            backToSubBtn.addEventListener('click', () => {
                this.showScreen('sub');
            });
        }

        // 스와이프 이벤트 바인딩
        this.bindSwipeEvents();

        // 하단 네비게이션 이벤트 바인딩
        this.bindBottomNavEvents();

        console.log('Navigation events bound successfully');
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

        // 왼쪽에서 오른쪽 스와이프만 처리 (첫 번째 화면으로)
        if (deltaX > minSwipeDistance) {
            console.log('Swiping right on sub screen - going back to main screen');
            this.showScreen('main');
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
        console.log(`Target screen found:`, targetScreen);

        if (targetScreen) {
            targetScreen.classList.add('active');
            console.log(`Added 'active' class to ${targetScreenId}`);

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

        console.log(`Switched to screen: ${screenName}`);
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
     * 문자 학습 화면 표시
     */
    async showCharacterScreen(characterType) {
        console.log('showCharacterScreen called with:', characterType);

        try {
            // 템플릿 매핑
            const templateMap = {
                '히라가나': 'hiragana-screen',
                '가타카나': 'katakana-screen',
                '탁음 & 반탁음': 'dakuten-screen',
                '요음': 'youon-screen'
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
            characterItems.forEach(item => {
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
            '히라가나': {
                char: '#mainHiragana',
                romaji: '#hiraganaRomaji',
                sound: '#hiraganaKoreanSound'
            },
            '가타카나': {
                char: '#mainKatakana',
                romaji: '#katakanaRomaji',
                sound: '#katakanaKoreanSound'
            },
            '탁음 & 반탁음': {
                char: '#mainDakuten',
                romaji: '#dakutenRomaji',
                sound: '#dakutenKoreanSound'
            },
            '요음': {
                char: '#mainYouon',
                romaji: '#youonRomaji',
                sound: '#youonKoreanSound'
            }
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

        const subCategoryButtons = document.getElementById('subCategoryButtons');

        console.log('subCategoryButtons:', subCategoryButtons);

        if (!subCategoryButtons) {
            console.error('Sub category buttons not found');
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
                    '명사 활용',
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
                this.showScreen('main');
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
        navBtns.forEach(btn => {
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

    // WordAppV3가 완전히 초기화될 때까지 기다림
    const waitForWordApp = async () => {
        let attempts = 0;
        while ((!window.wordAppV3 || !window.wordAppV3.dbManager || !window.wordAppV3.dbManager.db) && attempts < 100) {
            console.log(`Waiting for WordAppV3 initialization... (${attempts + 1}/100)`);
            await new Promise((resolve) => setTimeout(resolve, 100));
            attempts++;
        }

        if (window.wordAppV3 && window.wordAppV3.dbManager && window.wordAppV3.dbManager.db) {
            console.log('WordAppV3 ready, starting navigation initialization...');
            window.navigation = new ThreeStepNavigation();
        } else {
            console.error('Failed to wait for WordAppV3 initialization');
            // 그래도 네비게이션은 초기화 (DB 없어도 UI는 작동해야 함)
            window.navigation = new ThreeStepNavigation();
        }
    };

    // 2초 후에 시작
    setTimeout(waitForWordApp, 2000);
});
