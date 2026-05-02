/**
 * JLPT Word Learning App V3 - Unified Structure
 *
 * 특징:
 * - JLPT 레벨별 통합 JSON 파일 사용
 * - 동적 카테고리 추출 및 필터링
 * - 복합 필터 지원
 * - 실시간 통계 업데이트
 */

class WordLearningAppV4 {
    constructor() {
        this.dbManager = new IndexedDBManagerV4();
        this.selectedFilters = {}; // { jlptLevel: 'N5', partOfSpeech: '명사', theme: '날씨' }
        this.selectedWords = [];
        this.currentWordIndex = 0;
        this.userId = 'default';
        this.availableCategories = null;

        // 스와이프 변수들
        this.startX = 0;
        this.startY = 0;
        this.endX = 0;
        this.endY = 0;

        this.init();

        // 템플릿 로드 완료 후 UI 재초기화
        window.addEventListener('templatesLoaded', () => {
            console.log('Templates loaded, re-initializing UI...');
            this.initializeUIAfterTemplates();
        });
    }

    async init() {
        try {
            console.log('Starting app initialization...');

            // 이벤트 바인딩 먼저 (오류 없이 진행)
            this.bindEvents();
            console.log('Events bound successfully');

            // V3 데이터베이스 강제 삭제 먼저 실행
            try {
                console.log('🧹 앱 초기화 시 V3 데이터베이스 정리...');
                await this.dbManager.forceDeleteOldDatabases();
            } catch (error) {
                console.log('V3 삭제 중 오류 (계속 진행):', error);
            }

            // IndexedDB 초기화 시도
            try {
                await this.dbManager.init();
                console.log('IndexedDB V4 initialized');

                // 전역으로 설정
                window.dbManager = this.dbManager;

                // 앱/데이터 버전 체크
                if (window.APP_CONFIG) {
                    const appUpdated = window.APP_CONFIG.isAppUpdated();
                    console.log(`App updated: ${appUpdated ? 'yes' : 'no'} (current ${window.APP_CONFIG.APP_VERSION})`);
                }

                // 데이터 로드 (버전 관리 적용)
                await this.loadOrUpdateData();
                console.log('Data loading completed');

                // UI 초기화
                await this.initializeUI();
                console.log('UI initialized');

                // 통계 업데이트
                await this.updateStatistics();
                console.log('Statistics updated');
            } catch (dbError) {
                console.error('Database initialization failed:', dbError);
                console.error('DB Error name:', dbError?.name);
                console.error('DB Error message:', dbError?.message);

                // 사용자에게 정보 제공
                console.log('Falling back to basic UI without database functionality');

                // DB 없이도 동작하도록 기본 UI 설정
                this.setupBasicUI();
            }

            console.log('WordLearningAppV4 initialized successfully');
        } catch (error) {
            console.error('Critical initialization failed:', error);
            console.error('Error stack:', error.stack);
            this.setupBasicUI();
        }
    }

    /**
     * 기본 UI 설정 (DB 없이도 동작)
     */
    setupBasicUI() {
        console.log('Setting up basic UI without database');

        // 기본 카테고리 설정
        this.availableCategories = {
            jlpt: [
                { name: 'n5', displayName: 'N5', count: 0 },
                { name: 'n4', displayName: 'N4', count: 0 },
                { name: 'n3', displayName: 'N3', count: 0 },
                { name: 'n2', displayName: 'N2', count: 0 },
                { name: 'n1', displayName: 'N1', count: 0 },
            ],
            partOfSpeech: [
                { name: '명사', displayName: '명사', count: 0 },
                { name: '동사', displayName: '동사', count: 0 },
                { name: 'い형용사', displayName: 'い형용사', count: 0 },
                { name: 'な형용사', displayName: 'な형용사', count: 0 },
            ],
            themes: [
                { name: '날씨', displayName: '날씨', count: 0 },
                { name: '음식', displayName: '음식', count: 0 },
                { name: '가족', displayName: '가족', count: 0 },
            ],
        };

        // 기본 필터 생성
        this.createAllFilters();

        console.log('Using fallback mode - some features may be limited');
        // alert는 제거하여 사용자 경험 개선
    }

    /**
     * 샘플 데이터 로드 (JLPT 레벨별 통합 파일)
     */
    async loadOrUpdateData() {
        try {
            // 앱 설정이 로드되지 않은 경우 처리
            if (!window.APP_CONFIG) {
                console.warn('APP_CONFIG not loaded yet, using fallback');
                await this.loadSampleData(); // 이전 함수로 폴백
                return;
            }

            // 🔍 버전 정보 로깅
            console.log('📦 Checking data version...');
            window.APP_CONFIG.logVersionInfo();

            // 데이터 로드 필요 여부 판단
            if (!window.APP_CONFIG.shouldLoadData()) {
                console.log('✅ Data is up-to-date, skipping reload');
                const existingCount = await this.dbManager.getTotalWordCount();
                console.log(`📊 Using existing data: ${existingCount} words in database`);
                return;
            }

            console.log(`🔄 Data update needed (strategy: ${window.APP_CONFIG.DATA_LOAD_STRATEGY})`);
            console.log(`📥 Downloading JLPT data (N1~N5)...`);

            // 데이터베이스에 이미 데이터가 있는지 확인
            const existingWordCount = await this.dbManager.getTotalWordCount();
            console.log(`Current word count: ${existingWordCount}`);

            // JLPT 레벨별 데이터 로드 (N5부터 N1까지)
            const levels = window.APP_CONFIG.JLPT_LEVELS;
            const dataFiles = window.APP_CONFIG.DATA_FILES;
            let totalWordsLoaded = 0;

            for (const level of levels) {
                const filePath = dataFiles[level];
                console.log(`📥 Fetching ${level.toUpperCase()} data from ${filePath}...`);

                try {
                    const response = await fetch(filePath);
                    console.log(`   Response status: ${response.status}`);

                    if (response.ok) {
                        const words = await response.json();
                        console.log(`   ✅ Parsed ${words.length} ${level.toUpperCase()} words`);

                        // 샘플 단어 표시
                        if (words.length > 0) {
                            console.log(`   Sample: ${JSON.stringify(words[0]).substring(0, 100)}...`);
                        }

                        // 기존 데이터 삭제 후 새 데이터 추가
                        await this.dbManager.clearJLPTLevel(level);
                        await this.dbManager.saveJLPTWords(level, words);
                        totalWordsLoaded += words.length;
                        console.log(`   ✅ Saved to database`);
                    } else {
                        console.error(`   ❌ Failed to fetch ${level.toUpperCase()} data: ${response.status}`);
                    }
                } catch (error) {
                    console.error(`   ❌ Error loading ${level.toUpperCase()} data:`, error);
                }
            }

            // 최종 단어 수 확인
            const finalWordCount = await this.dbManager.getTotalWordCount();
            console.log(`\n📊 Data loading complete:`);
            console.log(`   Loaded in this session: ${totalWordsLoaded} words`);
            console.log(`   Total in database: ${finalWordCount} words`);

            // 데이터 로드 완료 표시 (버전 저장)
            window.APP_CONFIG.markDataAsLoaded();
        } catch (error) {
            console.error('❌ Data loading failed:', error);
            console.error('Error stack:', error.stack);

            // 폴백: 이전 데이터가 있으면 사용 (데이터 없이 앱이 시작될 수 있도록)
            const existingCount = await this.dbManager.getTotalWordCount();
            if (existingCount > 0) {
                console.log(`⚠️  Using existing data (${existingCount} words) as fallback`);
            }
        }
    }

    /**
     * 레거시: 이전의 loadSampleData 함수
     * loadOrUpdateData()로 대체되었지만, 호환성을 위해 유지
     * @deprecated 대신 loadOrUpdateData() 사용
     */
    async loadSampleData() {
        try {
            console.log('⚠️  Using legacy loadSampleData (deprecated, use loadOrUpdateData instead)');
            console.log('Starting sample data loading...');

            // 데이터베이스에 이미 데이터가 있는지 확인
            const existingWordCount = await this.dbManager.getTotalWordCount();
            console.log('Existing word count:', existingWordCount);

            // N5 데이터 로드
            console.log('Fetching N5 data...');
            const n5Response = await fetch('./data/vocabulary/jlpt/jlpt_n5_words_unified.json');
            console.log('N5 response status:', n5Response.status);

            if (n5Response.ok) {
                const n5Words = await n5Response.json();
                console.log('N5 words parsed:', n5Words.length, 'words');
                console.log('Sample N5 word:', n5Words[0]);

                // 기존 N5 데이터 삭제 후 새 데이터 추가
                await this.dbManager.clearJLPTLevel('n5');
                await this.dbManager.saveJLPTWords('n5', n5Words);
                console.log('N5 unified words saved to database');
            } else {
                console.error('Failed to fetch N5 data:', n5Response.status);
            }

            // N4 데이터 로드
            console.log('Fetching N4 data...');
            const n4Response = await fetch('./data/vocabulary/jlpt/jlpt_n4_words_unified.json');
            console.log('N4 response status:', n4Response.status);

            if (n4Response.ok) {
                const n4Words = await n4Response.json();
                console.log('N4 words parsed:', n4Words.length, 'words');
                console.log('Sample N4 word:', n4Words[0]);

                // 기존 N4 데이터 삭제 후 새 데이터 추가
                await this.dbManager.clearJLPTLevel('n4');
                await this.dbManager.saveJLPTWords('n4', n4Words);
                console.log('N4 unified words saved to database');
            } else {
                console.error('Failed to fetch N4 data:', n4Response.status);
            }

            // N3 데이터 로드
            console.log('Fetching N3 data...');
            const n3Response = await fetch('./data/vocabulary/jlpt/jlpt_n3_words_unified.json');
            console.log('N3 response status:', n3Response.status);

            if (n3Response.ok) {
                const n3Words = await n3Response.json();
                console.log('N3 words parsed:', n3Words.length, 'words');
                console.log('Sample N3 word:', n3Words[0]);

                // 기존 N3 데이터 삭제 후 새 데이터 추가
                await this.dbManager.clearJLPTLevel('n3');
                await this.dbManager.saveJLPTWords('n3', n3Words);
                console.log('N3 unified words saved to database');
            } else {
                console.error('Failed to fetch N3 data:', n3Response.status);
            }

            // N2 데이터 로드
            console.log('Fetching N2 data...');
            const n2Response = await fetch('./data/vocabulary/jlpt/jlpt_n2_words_unified.json');
            console.log('N2 response status:', n2Response.status);

            if (n2Response.ok) {
                const n2Words = await n2Response.json();
                console.log('N2 words parsed:', n2Words.length, 'words');
                console.log('Sample N2 word:', n2Words[0]);

                // 기존 N2 데이터 삭제 후 새 데이터 추가
                await this.dbManager.clearJLPTLevel('n2');
                await this.dbManager.saveJLPTWords('n2', n2Words);
                console.log('N2 unified words saved to database');
            } else {
                console.error('Failed to fetch N2 data:', n2Response.status);
            }

            // N1 데이터 로드
            console.log('Fetching N1 data...');
            const n1Response = await fetch('./data/vocabulary/jlpt/jlpt_n1_words_unified.json');
            console.log('N1 response status:', n1Response.status);

            if (n1Response.ok) {
                const n1Words = await n1Response.json();
                console.log('N1 words parsed:', n1Words.length, 'words');
                console.log('Sample N1 word:', n1Words[0]);

                // 기존 N1 데이터 삭제 후 새 데이터 추가
                await this.dbManager.clearJLPTLevel('n1');
                await this.dbManager.saveJLPTWords('n1', n1Words);
                console.log('N1 unified words saved to database');
            } else {
                console.error('Failed to fetch N1 data:', n1Response.status);
            }

            // 최종 단어 수 확인
            const finalWordCount = await this.dbManager.getTotalWordCount();
            console.log('Final word count after loading:', finalWordCount);
        } catch (error) {
            console.error('Sample data loading failed:', error);
            console.error('Error stack:', error.stack);
        }
    }

    /**
     * 템플릿 로드 후 UI 재초기화
     */
    async initializeUIAfterTemplates() {
        try {
            if (this.availableCategories) {
                // 이미 카테고리 정보가 있으면 필터만 다시 생성
                this.createAllFilters();
                console.log('UI re-initialized after templates loaded');
            } else {
                // 카테고리 정보가 없으면 전체 초기화
                await this.initializeUI();
            }

            // 템플릿 로드 후 이벤트 다시 바인딩
            this.bindMobileFABEvents();
            this.bindSwipeEvents();
            this.bindSpeechEvents();
        } catch (error) {
            console.error('UI re-initialization failed:', error);
        }
    }

    /**
     * UI 초기화 (모든 카테고리 표시)
     */
    async initializeUI() {
        try {
            // 데이터베이스 완전 초기화 대기
            console.log('⏳ 데이터베이스 초기화 완료 대기 중...');
            let retryCount = 0;
            while ((!this.dbManager.db || !this.dbManager.isInitialized) && retryCount < 10) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                retryCount++;
            }

            if (!this.dbManager.db) {
                throw new Error('Database initialization timeout');
            }

            // 사용 가능한 카테고리 정보 조회
            console.log('📊 카테고리 정보 조회 중...');
            this.availableCategories = await this.dbManager.getAvailableCategories();

            // 모든 필터 버튼 생성 (UI 요소가 있을 때만)
            this.createAllFilters();

            // 필터 요약 업데이트
            this.updateFilterSummary();

            console.log('UI initialization completed');
        } catch (error) {
            console.error('UI initialization failed:', error);
        }
    }

    /**
     * 모든 필터 드롭다운 생성
     */
    createAllFilters() {
        // JLPT 레벨 드롭다운 생성
        const jlptSelect = document.getElementById('jlptLevelSelect');
        if (!jlptSelect) {
            console.log('jlptLevelSelect not found, skipping filter creation');
            return;
        }
        jlptSelect.innerHTML = '<option value="">레벨 선택</option>';

        this.availableCategories.jlpt.forEach((category) => {
            const option = document.createElement('option');
            option.value = category.name;
            option.textContent = category.displayName;
            jlptSelect.appendChild(option);

            // 모바일 드롭다운에도 추가
            const jlptMobileSelect = document.getElementById('jlptLevelSelectMobile');
            if (jlptMobileSelect) {
                const mobileOption = document.createElement('option');
                mobileOption.value = category.name;
                mobileOption.textContent = category.displayName;
                jlptMobileSelect.appendChild(mobileOption);
            }
        });

        // 품사별 드롭다운 생성
        const partOfSpeechSelect = document.getElementById('partOfSpeechSelect');
        if (!partOfSpeechSelect) {
            console.log('partOfSpeechSelect not found, skipping part of speech filter creation');
            return;
        }
        partOfSpeechSelect.innerHTML = '<option value="">품사 선택</option>';

        this.availableCategories.partOfSpeech.forEach((category) => {
            const option = document.createElement('option');
            option.value = category.name;
            option.textContent = category.displayName;
            partOfSpeechSelect.appendChild(option);

            // 모바일 드롭다운에도 추가
            const partOfSpeechMobileSelect = document.getElementById('partOfSpeechSelectMobile');
            if (partOfSpeechMobileSelect) {
                const mobileOption = document.createElement('option');
                mobileOption.value = category.name;
                mobileOption.textContent = category.displayName;
                partOfSpeechMobileSelect.appendChild(mobileOption);
            }
        });

        // 주제별 드롭다운 생성
        const themeSelect = document.getElementById('themeSelect');
        if (!themeSelect) {
            console.log('themeSelect not found, skipping theme filter creation');
            return;
        }
        themeSelect.innerHTML = '<option value="">주제 선택</option>';

        this.availableCategories.themes.forEach((category) => {
            const option = document.createElement('option');
            option.value = category.name;
            option.textContent = category.displayName;
            themeSelect.appendChild(option);

            // 모바일 드롭다운에도 추가
            const themeMobileSelect = document.getElementById('themeSelectMobile');
            if (themeMobileSelect) {
                const mobileOption = document.createElement('option');
                mobileOption.value = category.name;
                mobileOption.textContent = category.displayName;
                themeMobileSelect.appendChild(mobileOption);
            }
        });
    }

    /**
     * 필터 선택 핸들러
     */
    handleFilterSelection(filterType, filterValue) {
        if (filterValue === '') {
            // 빈 값이면 필터 제거
            delete this.selectedFilters[filterType];
        } else {
            // 새로운 값 설정
            this.selectedFilters[filterType] = filterValue;
        }

        // UI 업데이트
        this.updateSelectedFiltersDisplay();
        this.updateFilterSummary();

        // 필터가 선택되면 자동으로 랜덤 단어 로드
        if (Object.keys(this.selectedFilters).length > 0) {
            this.autoLoadRandomWords();
        }

        console.log('Selected filters:', this.selectedFilters);
    }

    /**
     * 선택된 필터 표시 업데이트 (비활성화됨)
     */
    updateSelectedFiltersDisplay() {
        // Selected filters display is hidden
    }

    /**
     * 특정 필터 제거
     */
    removeFilter(filterType) {
        delete this.selectedFilters[filterType];

        // 드롭다운 초기화
        const selectMapping = {
            jlptLevel: 'jlptLevelSelect',
            partOfSpeech: 'partOfSpeechSelect',
            theme: 'themeSelect',
        };

        const selectElement = document.getElementById(selectMapping[filterType]);
        if (selectElement) {
            selectElement.value = '';
        }

        this.updateSelectedFiltersDisplay();
        this.updateFilterSummary();
    }

    /**
     * 모든 필터 초기화
     */
    clearAllFilters() {
        this.selectedFilters = {};

        // 모든 드롭다운 초기화
        document.getElementById('jlptLevelSelect').value = '';
        document.getElementById('partOfSpeechSelect').value = '';
        document.getElementById('themeSelect').value = '';

        this.updateSelectedFiltersDisplay();
        this.updateFilterSummary();

        // 단어 카드 숨기기
        this.safeHideElements(['wordCard', 'wordCounterFixed']);
        this.selectedWords = [];
    }

    /**
     * 자동으로 랜덤 단어 로드
     */
    async autoLoadRandomWords() {
        try {
            console.log('Auto-loading random words with filters:', this.selectedFilters);

            if (!this.dbManager.db) {
                console.log('Database not available, showing sample word');
                this.showSampleWord();
                return;
            }

            const excludeViewed = document.getElementById('excludeViewedWords')?.checked || false;
            const wordCount = null; // 제한 없음 - 모든 단어

            this.selectedWords = await this.dbManager.getRandomWords(
                this.selectedFilters,
                wordCount,
                excludeViewed,
                this.userId,
            );

            if (this.selectedWords.length === 0) {
                console.log('No words found for selected filters');
                this.safeHideElements(['wordCard', 'wordCounterFixed']);
                alert('선택한 조건에 맞는 단어가 없습니다.');
                return;
            }

            this.currentWordIndex = 0;
            this.showWordCard();
            this.updateWordDisplay();

            console.log('Auto-loaded random words:', this.selectedWords);
        } catch (error) {
            console.error('Error auto-loading random words:', error);
            console.error('Error stack:', error.stack);
            this.showSampleWord();
        }
    }

    /**
     * 샘플 단어 표시 (DB 없을 때)
     */
    showSampleWord() {
        console.log('Showing sample word');

        this.selectedWords = [
            {
                hanja: '単語',
                hiragana: 'たんご',
                mean: '단어',
                jpExample1: 'この単語の意味が分かりません。',
                koExample1: '이 단어의 뜻을 모르겠습니다.',
                jpExample2: '新しい単語を覚えるのは楽しいです。',
                koExample2: '새로운 단어를 외우는 것은 즐겁습니다.',
            },
        ];

        this.currentWordIndex = 0;
        this.showWordCard();
        this.updateWordDisplay();
    }

    /**
     * 필터 요약 업데이트 (제거됨)
     */
    async updateFilterSummary() {
        // Filter summary element removed
    }

    /**
     * 이벤트 바인딩
     */
    bindEvents() {
        // 드롭다운 필터 이벤트
        const jlptLevelSelect = document.getElementById('jlptLevelSelect');
        if (jlptLevelSelect) {
            jlptLevelSelect.addEventListener('change', (e) => {
                this.handleFilterSelection('jlptLevel', e.target.value);
            });
        }

        const partOfSpeechSelect = document.getElementById('partOfSpeechSelect');
        if (partOfSpeechSelect) {
            partOfSpeechSelect.addEventListener('change', (e) => {
                this.handleFilterSelection('partOfSpeech', e.target.value);
            });
        }

        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                this.handleFilterSelection('theme', e.target.value);
            });
        }

        // 본 단어장 보기
        const viewViewedWordsBtn = document.getElementById('viewViewedWordsBtn');
        if (viewViewedWordsBtn) {
            viewViewedWordsBtn.addEventListener('click', () => {
                this.showViewedWords();
            });
        }

        // 단어 네비게이션 - 버튼 제거됨, 터치/스와이프로만 조작

        // 본 단어로 추가 (데스크톱에만 존재하는 경우)
        const markAsViewedBtn = document.getElementById('markAsViewedBtn');
        if (markAsViewedBtn) {
            markAsViewedBtn.addEventListener('click', () => {
                this.markCurrentWordAsViewed();
            });
        }

        // 본 단어장 닫기
        const closeViewedWordsBtn = document.getElementById('closeViewedWordsBtn');
        if (closeViewedWordsBtn) {
            closeViewedWordsBtn.addEventListener('click', () => {
                this.hideViewedWords();
            });
        }

        // 키보드 네비게이션
        document.addEventListener('keydown', (e) => {
            if (this.selectedWords.length > 0) {
                if (e.key === 'ArrowLeft') this.showPreviousWord();
                if (e.key === 'ArrowRight') this.showNextWord();
                if (e.key === ' ') {
                    e.preventDefault();
                    this.markCurrentWordAsViewed();
                }
            }
        });

        // 모바일 FAB 이벤트
        this.bindMobileFABEvents();

        // 모바일 스와이프 기능
        this.bindSwipeEvents();

        // 음성 버튼 이벤트
        this.bindSpeechEvents();
    }

    /**
     * 모바일 FAB 이벤트 바인딩
     */
    bindMobileFABEvents() {
        // 설정 FAB
        const settingsFab = document.getElementById('settingsFab');
        if (settingsFab) {
            settingsFab.addEventListener('click', () => {
                this.showSettingsModal();
            });
        }

        // 본 단어장 FAB
        const viewedWordsFab = document.getElementById('viewedWordsFab');
        if (viewedWordsFab) {
            viewedWordsFab.addEventListener('click', () => {
                this.showViewedWords();
            });
        }

        // 본 단어로 추가 FAB
        const addWordFab = document.getElementById('addWordFab');
        if (addWordFab) {
            addWordFab.addEventListener('click', () => {
                this.markCurrentWordAsViewed();
            });
        }

        // 설정 모달 닫기
        const closeSettings = document.getElementById('closeSettings');
        if (closeSettings) {
            closeSettings.addEventListener('click', () => {
                this.hideSettingsModal();
            });
        }

        // 모달 배경 클릭시 닫기
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) {
            settingsModal.addEventListener('click', (e) => {
                if (e.target.id === 'settingsModal') {
                    this.hideSettingsModal();
                }
            });
        }

        // 모바일 드롭다운 이벤트
        const jlptLevelSelectMobile = document.getElementById('jlptLevelSelectMobile');
        if (jlptLevelSelectMobile) {
            jlptLevelSelectMobile.addEventListener('change', (e) => {
                this.handleFilterSelection('jlptLevel', e.target.value);
                // 데스크톱 드롭다운과 동기화
                const desktopSelect = document.getElementById('jlptLevelSelect');
                if (desktopSelect) {
                    desktopSelect.value = e.target.value;
                }
            });
        }

        const partOfSpeechSelectMobile = document.getElementById('partOfSpeechSelectMobile');
        if (partOfSpeechSelectMobile) {
            partOfSpeechSelectMobile.addEventListener('change', (e) => {
                this.handleFilterSelection('partOfSpeech', e.target.value);
                const desktopSelect = document.getElementById('partOfSpeechSelect');
                if (desktopSelect) {
                    desktopSelect.value = e.target.value;
                }
            });
        }

        const themeSelectMobile = document.getElementById('themeSelectMobile');
        if (themeSelectMobile) {
            themeSelectMobile.addEventListener('change', (e) => {
                this.handleFilterSelection('theme', e.target.value);
                const desktopSelect = document.getElementById('themeSelect');
                if (desktopSelect) {
                    desktopSelect.value = e.target.value;
                }
            });
        }

        // 모바일 체크박스 동기화
        const excludeViewedWordsMobile = document.getElementById('excludeViewedWordsMobile');
        if (excludeViewedWordsMobile) {
            excludeViewedWordsMobile.addEventListener('change', (e) => {
                const desktopCheckbox = document.getElementById('excludeViewedWords');
                if (desktopCheckbox) {
                    desktopCheckbox.checked = e.target.checked;
                }
            });
        }

        // 모바일 JPG 다운로드
        const downloadJpgBtnMobile = document.getElementById('downloadJpgBtnMobile');
        if (downloadJpgBtnMobile) {
            downloadJpgBtnMobile.addEventListener('click', () => {
                // 기존 다운로드 버튼 클릭과 동일한 기능
                const downloadBtn = document.getElementById('downloadJpgBtn');
                if (downloadBtn) {
                    downloadBtn.click();
                }
            });
        }
    }

    /**
     * 설정 모달 표시
     */
    showSettingsModal() {
        document.getElementById('settingsModal').style.display = 'flex';
        // 현재 설정값들을 모바일 모달에 반영
        this.syncMobileSettings();
    }

    /**
     * 설정 모달 숨기기
     */
    hideSettingsModal() {
        document.getElementById('settingsModal').style.display = 'none';
    }

    /**
     * 모바일 설정 동기화
     */
    syncMobileSettings() {
        document.getElementById('jlptLevelSelectMobile').value = document.getElementById('jlptLevelSelect').value;
        document.getElementById('partOfSpeechSelectMobile').value = document.getElementById('partOfSpeechSelect').value;
        document.getElementById('themeSelectMobile').value = document.getElementById('themeSelect').value;
        document.getElementById('excludeViewedWordsMobile').checked =
            document.getElementById('excludeViewedWords').checked;
    }

    /**
     * 스와이프 이벤트 바인딩 (모바일용)
     */
    bindSwipeEvents() {
        const wordScreen = document.getElementById('wordScreen');
        if (!wordScreen) {
            console.log('Word screen not found, will bind swipe events later');
            return;
        }

        // 이미 바인딩된 경우 중복 방지
        if (wordScreen.dataset.swipeBound) {
            return;
        }

        let isSwipingHorizontally = false;
        let isTap = false;
        let isSpeechButtonTouch = false;

        console.log('Binding touch/swipe events to word screen');

        // 터치 시작
        wordScreen.addEventListener(
            'touchstart',
            (e) => {
                this.startX = e.touches[0].clientX;
                this.startY = e.touches[0].clientY;
                isSwipingHorizontally = false;
                isTap = true;

                // 음성 버튼 및 저장 버튼 터치 감지
                const target = e.target;
                isSpeechButtonTouch =
                    target &&
                    (target.classList.contains('speech-btn') ||
                        target.closest('.speech-btn') ||
                        target.classList.contains('bookmark-btn') ||
                        target.closest('.bookmark-btn') ||
                        target.classList.contains('word-save-btn') ||
                        target.closest('.word-save-btn'));

                console.log('Touch start:', this.startX, this.startY, 'Speech button:', isSpeechButtonTouch);
            },
            { passive: true },
        );

        // 터치 이동 중
        wordScreen.addEventListener(
            'touchmove',
            (e) => {
                if (!this.startX) return;

                const currentX = e.touches[0].clientX;
                const currentY = e.touches[0].clientY;
                const diffX = currentX - this.startX;
                const diffY = currentY - this.startY;

                // 움직임이 있으면 탭이 아님
                if (Math.abs(diffX) > 5 || Math.abs(diffY) > 5) {
                    isTap = false;
                }

                // 왼쪽에서 오른쪽 스와이프만 허용 (이전 화면으로)
                if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10 && diffX > 0) {
                    isSwipingHorizontally = true;
                    e.preventDefault();

                    // 시각적 피드백 - 전체 화면에 적용 (오른쪽 스와이프만)
                    const movePercent = Math.min(diffX / 150, 0.3);
                    const opacity = 1 - movePercent;

                    wordScreen.style.transform = `translateX(${diffX * 0.2}px)`;
                    wordScreen.style.opacity = opacity;
                }
            },
            { passive: false },
        );

        // 터치 종료
        wordScreen.addEventListener(
            'touchend',
            (e) => {
                if (e.changedTouches && e.changedTouches.length > 0) {
                    this.endX = e.changedTouches[0].clientX;
                    this.endY = e.changedTouches[0].clientY;
                }

                // 화면 원래 상태로 복원
                wordScreen.style.transform = '';
                wordScreen.style.opacity = '';
                wordScreen.style.transition = 'all 0.3s ease';

                setTimeout(() => {
                    wordScreen.style.transition = '';
                }, 300);

                // 탭 처리 (좌우 영역)
                if (isTap && !isSpeechButtonTouch) {
                    this.handleTap(this.startX);
                } else if (isSpeechButtonTouch) {
                    console.log('Speech button tapped, ignoring navigation');
                }
                // 스와이프 처리 (왼쪽→오른쪽만)
                else if (isSwipingHorizontally) {
                    this.handleSwipe();
                }

                // 초기화
                this.startX = 0;
                this.startY = 0;
                this.endX = 0;
                this.endY = 0;
                isSwipingHorizontally = false;
                isTap = false;
                isSpeechButtonTouch = false;
            },
            { passive: true },
        );

        // 터치 취소
        wordScreen.addEventListener(
            'touchcancel',
            (e) => {
                wordScreen.style.transform = '';
                wordScreen.style.opacity = '';
                this.startX = 0;
                this.startY = 0;
                this.endX = 0;
                this.endY = 0;
                isSwipingHorizontally = false;
                isTap = false;
                isSpeechButtonTouch = false;
            },
            { passive: true },
        );

        // 중복 바인딩 방지 마크 설정
        wordScreen.dataset.swipeBound = 'true';
    }

    /**
     * 음성 버튼 이벤트 바인딩
     */
    bindSpeechEvents() {
        // 단어 음성 버튼
        const speechWordBtn = document.getElementById('speechWordBtn');
        if (speechWordBtn) {
            speechWordBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.speakCurrentWord();
            });
        }

        // 예문1 음성 버튼
        const speechExample1Btn = document.getElementById('speechExample1Btn');
        if (speechExample1Btn) {
            speechExample1Btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.speakExample1();
            });
        }

        // 예문2 음성 버튼
        const speechExample2Btn = document.getElementById('speechExample2Btn');
        if (speechExample2Btn) {
            speechExample2Btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.speakExample2();
            });
        }
    }

    /**
     * 단어 저장 버튼 이벤트 바인딩
     * @param {Object} currentWord - 현재 표시중인 단어 데이터
     */
    bindSaveWordEvents(currentWord) {
        // 상단 책갈피 버튼
        const saveWordBtn = document.getElementById('saveWordBtn');
        if (saveWordBtn) {
            // 기존 이벤트 리스너 제거 (중복 방지)
            const newSaveBtn = saveWordBtn.cloneNode(true);
            saveWordBtn.parentNode.replaceChild(newSaveBtn, saveWordBtn);

            // 새로운 이벤트 리스너 추가
            newSaveBtn.addEventListener(
                'click',
                async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();

                    console.log('Bookmark save button clicked');
                    await this.saveCurrentWordToVocabulary(currentWord, newSaveBtn, 'bookmark');
                },
                true,
            );
        }

        // 하단 전체 너비 저장 버튼
        const bottomSaveBtn = document.getElementById('bottomSaveWordBtn');
        if (bottomSaveBtn) {
            // 기존 이벤트 리스너 제거 (중복 방지)
            const newBottomSaveBtn = bottomSaveBtn.cloneNode(true);
            bottomSaveBtn.parentNode.replaceChild(newBottomSaveBtn, bottomSaveBtn);

            // 새로운 이벤트 리스너 추가
            newBottomSaveBtn.addEventListener(
                'click',
                async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();

                    console.log('Bottom save button clicked');
                    await this.saveCurrentWordToVocabulary(currentWord, newBottomSaveBtn, 'bottom');
                },
                true,
            );
        }
    }

    /**
     * 현재 단어를 나의 단어장에 저장
     * @param {Object} wordData - 저장할 단어 데이터
     * @param {HTMLElement} btnElement - 저장 버튼 요소
     * @param {string} buttonType - 버튼 타입 ('bookmark' 또는 'bottom')
     */
    async saveCurrentWordToVocabulary(wordData, btnElement, buttonType = 'bookmark') {
        try {
            if (!window.MyVocabularyUI) {
                console.error('MyVocabularyUI not available');
                alert('단어 저장 기능을 사용할 수 없습니다.');
                return;
            }

            // 버튼 비활성화 (중복 클릭 방지)
            btnElement.disabled = true;
            let originalIcon, originalText;

            if (buttonType === 'bookmark') {
                const iconElement = btnElement.querySelector('.bookmark-icon');
                originalIcon = iconElement ? iconElement.textContent : '🔖';
                // 데이터 속성에 원본 상태 저장
                btnElement.setAttribute('data-original-icon', originalIcon);
            } else {
                const iconElement = btnElement.querySelector('.save-btn-icon');
                const textElement = btnElement.querySelector('.save-btn-text');
                originalIcon = iconElement ? iconElement.textContent : '📚';
                originalText = textElement ? textElement.textContent : '나의 단어장에 저장';

                // 데이터 속성에 원본 상태 저장
                btnElement.setAttribute('data-original-icon', originalIcon);
                btnElement.setAttribute('data-original-text', originalText);

                if (textElement) textElement.textContent = '저장 중...';
            }

            const vocabUI = new window.MyVocabularyUI();
            const success = await vocabUI.saveWordToVocabulary({
                hanja: wordData.hanja,
                hiragana: wordData.hiragana,
                meaning: wordData.mean,
                jlptLevel: wordData.jlptLevel,
                partOfSpeech: wordData.partOfSpeech,
                themes: wordData.themes,
                jpExample1: wordData.jpExample1,
                koExample1: wordData.koExample1,
                jpExample2: wordData.jpExample2,
                koExample2: wordData.koExample2,
            });

            if (success) {
                console.log('Word saved successfully, updating button state');

                // 저장 성공 시 버튼 상태 변경
                btnElement.classList.add('saved');

                if (buttonType === 'bookmark') {
                    const iconElement = btnElement.querySelector('.bookmark-icon');
                    if (iconElement) iconElement.textContent = '✓';
                } else {
                    const iconElement = btnElement.querySelector('.save-btn-icon');
                    const textElement = btnElement.querySelector('.save-btn-text');
                    if (iconElement) iconElement.textContent = '✓';
                    if (textElement) textElement.textContent = '저장 완료!';
                }

                // 2초 후 원래 상태로 복원
                setTimeout(() => {
                    console.log('Restoring button to original state');
                    btnElement.classList.remove('saved');

                    // 데이터 속성에서 원본 상태 복원
                    const savedIcon = btnElement.getAttribute('data-original-icon');
                    const savedText = btnElement.getAttribute('data-original-text');

                    if (buttonType === 'bookmark') {
                        const iconElement = btnElement.querySelector('.bookmark-icon');
                        if (iconElement && savedIcon) {
                            iconElement.textContent = savedIcon;
                        }
                    } else {
                        const iconElement = btnElement.querySelector('.save-btn-icon');
                        const textElement = btnElement.querySelector('.save-btn-text');
                        if (iconElement && savedIcon) {
                            iconElement.textContent = savedIcon;
                        }
                        if (textElement && savedText) {
                            textElement.textContent = savedText;
                        }
                    }

                    // 데이터 속성 정리
                    btnElement.removeAttribute('data-original-icon');
                    btnElement.removeAttribute('data-original-text');

                    btnElement.disabled = false;
                    console.log('Button restored successfully');
                }, 2000);
            } else {
                console.log('Word save failed, restoring button');
                // 저장 실패 시 버튼 복원
                const savedIcon = btnElement.getAttribute('data-original-icon');
                const savedText = btnElement.getAttribute('data-original-text');

                if (buttonType === 'bookmark' && savedIcon) {
                    const iconElement = btnElement.querySelector('.bookmark-icon');
                    if (iconElement) iconElement.textContent = savedIcon;
                } else if (buttonType === 'bottom' && savedText) {
                    const textElement = btnElement.querySelector('.save-btn-text');
                    if (textElement) textElement.textContent = savedText;
                }

                // 데이터 속성 정리
                btnElement.removeAttribute('data-original-icon');
                btnElement.removeAttribute('data-original-text');

                btnElement.disabled = false;
            }
        } catch (error) {
            console.error('Error saving word:', error);
            alert('단어 저장 중 오류가 발생했습니다.');

            // 오류 시 버튼 복원
            console.log('Error occurred, restoring button');
            const savedIcon = btnElement.getAttribute('data-original-icon');
            const savedText = btnElement.getAttribute('data-original-text');

            if (buttonType === 'bookmark' && savedIcon) {
                const iconElement = btnElement.querySelector('.bookmark-icon');
                if (iconElement) iconElement.textContent = savedIcon;
            } else if (buttonType === 'bottom' && savedText) {
                const iconElement = btnElement.querySelector('.save-btn-icon');
                const textElement = btnElement.querySelector('.save-btn-text');
                if (iconElement && savedIcon) iconElement.textContent = savedIcon;
                if (textElement && savedText) textElement.textContent = savedText;
            }

            // 데이터 속성 정리
            btnElement.removeAttribute('data-original-icon');
            btnElement.removeAttribute('data-original-text');

            btnElement.disabled = false;
        }
    }

    /**
     * 현재 단어 음성 재생
     */
    async speakCurrentWord() {
        if (this.selectedWords.length === 0 || !window.speechManager) {
            console.warn('No word to speak or speech manager not available');
            return;
        }

        const speechBtn = document.getElementById('speechWordBtn');

        // 이미 재생 중이면 중복 실행 방지
        if (speechBtn && speechBtn.classList.contains('speaking')) {
            console.log('Speech already in progress, ignoring click');
            return;
        }

        try {
            const currentWord = this.selectedWords[this.currentWordIndex];

            // 버튼 상태 변경 및 비활성화
            if (speechBtn) {
                speechBtn.classList.add('speaking');
                speechBtn.textContent = '🔈';
                speechBtn.disabled = true;
            }

            // 음성 재생
            await window.speechManager.speakWord(currentWord);

            console.log('Word speech completed');
        } catch (error) {
            console.error('Error speaking word:', error);
            // interrupted 오류가 아닌 경우만 알림 표시
            if (error !== 'interrupted') {
                alert('음성 재생에 실패했습니다.');
            }
        } finally {
            // 버튼 상태 복원
            if (speechBtn) {
                speechBtn.classList.remove('speaking');
                speechBtn.textContent = '🔊';
                speechBtn.disabled = false;
            }
        }
    }

    /**
     * 예문1 음성 재생
     */
    async speakExample1() {
        if (this.selectedWords.length === 0 || !window.speechManager) {
            console.warn('No example to speak or speech manager not available');
            return;
        }

        const speechBtn = document.getElementById('speechExample1Btn');

        // 이미 재생 중이면 중복 실행 방지
        if (speechBtn && speechBtn.classList.contains('speaking')) {
            console.log('Speech already in progress, ignoring click');
            return;
        }

        try {
            const currentWord = this.selectedWords[this.currentWordIndex];
            const jpExample1 = currentWord.jpExample1;

            if (!jpExample1) {
                console.warn('No example1 text to speak');
                return;
            }

            // 버튼 상태 변경 및 비활성화
            if (speechBtn) {
                speechBtn.classList.add('speaking');
                speechBtn.textContent = '🔈';
                speechBtn.disabled = true;
            }

            // 음성 재생
            await window.speechManager.speakSentence(jpExample1);

            console.log('Example1 speech completed');
        } catch (error) {
            console.error('Error speaking example1:', error);
            // interrupted 오류가 아닌 경우만 알림 표시
            if (error !== 'interrupted') {
                alert('예문 음성 재생에 실패했습니다.');
            }
        } finally {
            // 버튼 상태 복원
            if (speechBtn) {
                speechBtn.classList.remove('speaking');
                speechBtn.textContent = '🔊';
                speechBtn.disabled = false;
            }
        }
    }

    /**
     * 예문2 음성 재생
     */
    async speakExample2() {
        if (this.selectedWords.length === 0 || !window.speechManager) {
            console.warn('No example to speak or speech manager not available');
            return;
        }

        const speechBtn = document.getElementById('speechExample2Btn');

        // 이미 재생 중이면 중복 실행 방지
        if (speechBtn && speechBtn.classList.contains('speaking')) {
            console.log('Speech already in progress, ignoring click');
            return;
        }

        try {
            const currentWord = this.selectedWords[this.currentWordIndex];
            const jpExample2 = currentWord.jpExample2;

            if (!jpExample2) {
                console.warn('No example2 text to speak');
                return;
            }

            // 버튼 상태 변경 및 비활성화
            if (speechBtn) {
                speechBtn.classList.add('speaking');
                speechBtn.textContent = '🔈';
                speechBtn.disabled = true;
            }

            // 음성 재생
            await window.speechManager.speakSentence(jpExample2);

            console.log('Example2 speech completed');
        } catch (error) {
            console.error('Error speaking example2:', error);
            // interrupted 오류가 아닌 경우만 알림 표시
            if (error !== 'interrupted') {
                alert('예문 음성 재생에 실패했습니다.');
            }
        } finally {
            // 버튼 상태 복원
            if (speechBtn) {
                speechBtn.classList.remove('speaking');
                speechBtn.textContent = '🔊';
                speechBtn.disabled = false;
            }
        }
    }

    /**
     * 탭 처리 (좌우 영역 구분)
     */
    handleTap(tapX) {
        const screenWidth = window.innerWidth;
        const leftAreaWidth = screenWidth * 0.5; // 화면의 50%를 왼쪽 영역으로

        console.log('Handling tap:', {
            tapX,
            screenWidth,
            leftAreaWidth,
            selectedWordsLength: this.selectedWords.length,
        });

        if (tapX < leftAreaWidth) {
            // 왼쪽 영역 탭 - 이전 단어
            console.log('Left area tap - previous word');
            this.showPreviousWord();
        } else {
            // 오른쪽 영역 탭 - 다음 단어
            console.log('Right area tap - next word');
            this.showNextWord();
        }
    }

    /**
     * 스와이프 처리 (왼쪽→오른쪽만, 이전 화면으로)
     */
    handleSwipe() {
        const deltaX = this.endX - this.startX;

        console.log('Handling swipe:', {
            deltaX,
            startX: this.startX,
            endX: this.endX,
        });

        // 최소 스와이프 거리
        const minSwipeDistance = 50;

        // 왼쪽에서 오른쪽 스와이프만 처리 (이전 화면으로)
        if (deltaX > minSwipeDistance) {
            console.log('Swiping right - going back to previous screen');
            // 이전 화면으로 돌아가기
            if (window.navigation) {
                window.navigation.showScreen('sub');
            }
        }
    }

    /**
     * 단어 카드 표시
     */
    showWordCard() {
        console.log('showWordCard called');

        const wordCard = document.getElementById('wordCard');
        const wordCounterFixed = document.getElementById('wordCounterFixed');

        console.log('wordCard element:', wordCard);

        if (wordCard) {
            // 강제로 표시
            wordCard.style.cssText =
                'display: block !important; visibility: visible !important; opacity: 1 !important;';
            console.log('wordCard display set to block with !important');

            // 스와이프 이벤트 바인딩 (전체 화면에)
            this.bindSwipeEvents();

            // 약간의 딜레이 후 다시 확인
            setTimeout(() => {
                console.log('After timeout - wordCard computed style:', window.getComputedStyle(wordCard).display);
                console.log('After timeout - wordCard visibility:', window.getComputedStyle(wordCard).visibility);
            }, 100);
        } else {
            console.error('wordCard element not found!');
        }

        // 고정 카운터 표시
        if (wordCounterFixed) {
            wordCounterFixed.style.display = 'block';
            console.log('wordCounterFixed displayed');
        } else {
            console.error('wordCounterFixed element not found!');
        }

        // wordControls 제거됨

        this.hideViewedWords();
    }

    /**
     * 단어 정보 업데이트
     */
    updateWordDisplay() {
        console.log('updateWordDisplay called');
        console.log('selectedWords length:', this.selectedWords.length);
        console.log('currentWordIndex:', this.currentWordIndex);

        if (this.selectedWords.length === 0) {
            console.log('No selected words, returning');
            return;
        }

        const currentWord = this.selectedWords[this.currentWordIndex];
        console.log('Current word to display:', currentWord);

        // 단어 정보 업데이트
        const hanjaEl = document.getElementById('hanja');
        const hiraganaEl = document.getElementById('hiragana');
        const meaningEl = document.getElementById('meaning');

        console.log('Elements found:', { hanjaEl, hiraganaEl, meaningEl });

        if (hanjaEl) {
            hanjaEl.textContent = currentWord.hanja || '-';

            // 한자 길이에 따른 반응형 폰트 크기 클래스 적용
            const hanjaText = currentWord.hanja || '';
            const hanjaLength = hanjaText.length;

            // 기존 length 클래스 제거
            hanjaEl.className = hanjaEl.className.replace(/\blength-\d+(-plus)?\b/g, '');

            // 길이에 따른 새로운 클래스 추가
            if (hanjaLength <= 4) {
                hanjaEl.classList.add(`length-${hanjaLength}`);
            } else if (hanjaLength <= 9) {
                hanjaEl.classList.add(`length-${hanjaLength}`);
            } else {
                hanjaEl.classList.add('length-10-plus');
            }

            console.log(`Applied hanja length class for "${hanjaText}" (${hanjaLength} chars):`, hanjaEl.className);
        }
        if (hiraganaEl) hiraganaEl.textContent = currentWord.hiragana || '';
        if (meaningEl) meaningEl.textContent = currentWord.mean || '';

        // 예문 업데이트
        const jpExample1El = document.getElementById('jpExample1');
        const koExample1El = document.getElementById('koExample1');
        const jpExample2El = document.getElementById('jpExample2');
        const koExample2El = document.getElementById('koExample2');

        if (jpExample1El) jpExample1El.textContent = currentWord.jpExample1 || '';
        if (koExample1El) koExample1El.textContent = currentWord.koExample1 || '';
        if (jpExample2El) jpExample2El.textContent = currentWord.jpExample2 || '';
        if (koExample2El) koExample2El.textContent = currentWord.koExample2 || '';

        // 메타 정보 업데이트
        const metaInfo = [];
        if (currentWord.jlptLevel) metaInfo.push(`JLPT ${currentWord.jlptLevel}`);
        if (currentWord.partOfSpeech) metaInfo.push(currentWord.partOfSpeech);
        if (currentWord.themes) metaInfo.push(currentWord.themes.join(', '));
        if (currentWord.frequency) metaInfo.push(`빈도: ${currentWord.frequency}`);

        const wordMetaEl = document.getElementById('wordMeta');
        if (wordMetaEl) wordMetaEl.textContent = metaInfo.join(' · ');

        // 카운터 업데이트 - HTML 템플릿의 실제 ID에 맞춰 수정
        const currentIndexElements = document.querySelectorAll('#currentIndex');
        const totalCountElements = document.querySelectorAll('#totalCount');

        // 모든 currentIndex 요소 업데이트
        currentIndexElements.forEach((el) => {
            el.textContent = this.currentWordIndex + 1;
        });

        // 모든 totalCount 요소 업데이트
        totalCountElements.forEach((el) => {
            el.textContent = this.selectedWords.length;
        });

        // 추가로 기존 ID들도 확인하여 업데이트
        const currentIndexEl = document.getElementById('currentWordIndex');
        const totalWordsEl = document.getElementById('totalSelectedWords');
        const cardCurrentIndexEl = document.getElementById('cardCurrentIndex');
        const cardTotalCountEl = document.getElementById('cardTotalCount');

        if (currentIndexEl) currentIndexEl.textContent = this.currentWordIndex + 1;
        if (totalWordsEl) totalWordsEl.textContent = this.selectedWords.length;
        if (cardCurrentIndexEl) cardCurrentIndexEl.textContent = this.currentWordIndex + 1;
        if (cardTotalCountEl) cardTotalCountEl.textContent = this.selectedWords.length;

        // 버튼 제거됨 - 터치/스와이프로만 조작

        // 음성 버튼 이벤트 다시 바인딩 (단어가 변경될 때마다)
        this.bindSpeechEvents();

        // 단어 저장 버튼 이벤트 바인딩
        this.bindSaveWordEvents(currentWord);

        console.log('Word display updated successfully');
    }

    /**
     * 이전 단어 표시
     */
    showPreviousWord() {
        if (this.currentWordIndex > 0) {
            this.currentWordIndex--;
            this.updateWordDisplay();
        }
    }

    /**
     * 다음 단어 표시
     */
    showNextWord() {
        if (this.currentWordIndex < this.selectedWords.length - 1) {
            this.currentWordIndex++;
            this.updateWordDisplay();
        }
    }

    /**
     * 현재 단어를 본 단어로 추가
     */
    async markCurrentWordAsViewed() {
        if (this.selectedWords.length === 0) return;

        try {
            const currentWord = this.selectedWords[this.currentWordIndex];
            await this.dbManager.markWordAsViewed(currentWord.id, this.userId);

            // 시각적 피드백
            const button = document.getElementById('markAsViewedBtn');
            const originalText = button.textContent;
            button.textContent = '추가됨!';
            button.style.background = 'linear-gradient(135deg, #38ef7d 0%, #11998e 100%)';

            setTimeout(() => {
                button.textContent = originalText;
                button.style.background = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
            }, 1000);

            // 통계 업데이트
            await this.updateStatistics();

            console.log(`Word ${currentWord.id} marked as viewed`);
        } catch (error) {
            console.error('Error marking word as viewed:', error);
            alert('단어 추가에 실패했습니다.');
        }
    }

    /**
     * 본 단어장 표시
     */
    async showViewedWords() {
        try {
            const viewedWords = await this.dbManager.getViewedWords(this.userId);

            const section = document.getElementById('viewedWordsSection');
            const list = document.getElementById('viewedWordsList');

            if (viewedWords.length === 0) {
                list.innerHTML =
                    '<p style="text-align: center; color: #666; padding: 20px;">아직 본 단어가 없습니다.</p>';
            } else {
                list.innerHTML = viewedWords
                    .map(
                        (word) => `
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 12px;
                        margin: 8px 0;
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 12px;
                        border: 1px solid rgba(255, 255, 255, 0.2);
                    ">
                        <div>
                            <div style="font-size: 1.1rem; font-weight: 600; color: #000;">
                                ${word.hanja} (${word.hiragana})
                            </div>
                            <div style="font-size: 0.9rem; color: #333; margin-top: 4px;">
                                ${word.mean}
                            </div>
                            <div style="font-size: 0.8rem; color: #666; margin-top: 4px;">
                                ${word.jlptLevel} · ${word.partOfSpeech} · ${
                                    word.themes ? word.themes.join(', ') : ''
                                } · 조회수: ${word.viewCount}
                            </div>
                        </div>
                        <div style="font-size: 0.8rem; color: #666;">
                            ${new Date(word.viewedAt).toLocaleDateString()}
                        </div>
                    </div>
                `,
                    )
                    .join('');
            }

            section.style.display = 'block';
            document.getElementById('wordCard').style.display = 'none';
            document.getElementById('wordControls').style.display = 'none';
        } catch (error) {
            console.error('Error showing viewed words:', error);
            alert('본 단어장을 불러오는데 실패했습니다.');
        }
    }

    /**
     * 본 단어장 숨기기
     */
    hideViewedWords() {
        const viewedWordsSection = document.getElementById('viewedWordsSection');
        if (viewedWordsSection) {
            viewedWordsSection.style.display = 'none';
        }
        // 요소가 없어도 오류 발생하지 않음 (3단계 네비게이션에서는 정상)
    }

    /**
     * 통계 업데이트 (필터 요약만 업데이트)
     */
    async updateStatistics() {
        try {
            // 필터 요약 업데이트
            await this.updateFilterSummary();

            console.log('Statistics updated');
        } catch (error) {
            console.error('Error updating statistics:', error);
        }
    }

    /**
     * 3단계 네비게이션에서 호출되는 메서드
     * 필터를 설정하고 단어 학습을 시작
     */
    async setFiltersAndStart(filters) {
        try {
            console.log('Setting filters and starting word study:', filters);

            // DB 연결 상태 확인 및 대기
            if (!this.dbManager) {
                console.error('DBManager not available');
                alert('데이터베이스 매니저가 초기화되지 않았습니다.');
                return;
            }

            if (!this.dbManager.db) {
                console.log('Database not ready, waiting...');
                // 최대 5초간 DB 초기화 대기
                let attempts = 0;
                while (!this.dbManager.db && attempts < 50) {
                    await new Promise((resolve) => setTimeout(resolve, 100));
                    attempts++;
                }

                if (!this.dbManager.db) {
                    console.error('Database failed to initialize after waiting');
                    alert('데이터베이스 초기화에 실패했습니다. 페이지를 새로고침해주세요.');
                    return;
                }
            }

            // 필터 설정
            this.selectedFilters = {};

            if (filters.jlptLevel) {
                this.selectedFilters.jlptLevel = filters.jlptLevel;
            }
            if (filters.partOfSpeech) {
                this.selectedFilters.partOfSpeech = filters.partOfSpeech;
            }
            if (filters.theme) {
                this.selectedFilters.theme = filters.theme;
            }

            console.log('Applied filters:', this.selectedFilters);

            // 단어 로드 및 표시
            await this.autoLoadRandomWords();
        } catch (error) {
            console.error('Error in setFiltersAndStart:', error);
            console.error('Error stack:', error.stack);
            alert(`단어 로드 중 오류가 발생했습니다: ${error.message}`);
        }
    }

    /**
     * 안전한 DOM 요소 숨기기
     * @param {string[]} elementIds - 숨길 요소의 ID 배열
     */
    safeHideElements(elementIds) {
        elementIds.forEach((id) => {
            const element = document.getElementById(id);
            if (element) {
                element.style.display = 'none';
                console.log(`Hidden element: ${id}`);
            } else {
                console.warn(`Element not found: ${id}`);
            }
        });
    }

    /**
     * 안전한 DOM 요소 보이기
     * @param {string[]} elementIds - 보일 요소의 ID 배열
     * @param {string} displayStyle - display 스타일 (기본값: 'block')
     */
    safeShowElements(elementIds, displayStyle = 'block') {
        elementIds.forEach((id) => {
            const element = document.getElementById(id);
            if (element) {
                element.style.display = displayStyle;
                console.log(`Shown element: ${id}`);
            } else {
                console.warn(`Element not found: ${id}`);
            }
        });
    }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.wordAppV4 = new WordLearningAppV4();
});
