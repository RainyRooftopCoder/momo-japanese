/**
 * IndexedDB Manager V3 - Unified JSON Structure
 *
 * 변경사항:
 * - 통합된 JSON 구조 지원 (JLPT 레벨별 파일만 사용)
 * - 품사/주제별 필터링 로직 추가
 * - 단일 파일에서 다중 카테고리 추출
 */

/**
 * IndexedDB 매니저 클래스 V3
 * JLPT 일본어 단어 학습 앱을 위한 로컬 데이터베이스 관리
 */
class IndexedDBManagerV3 {
    /**
     * 생성자 - 데이터베이스 설정 초기화
     */
    constructor() {
        // 데이터베이스 기본 설정
        this.dbName = 'JLPTWordDB_V4'; // 데이터베이스 이름 (캐시 문제 해결)
        this.dbVersion = 1; // 새로운 DB이므로 버전 1부터 시작
        this.db = null; // 데이터베이스 연결 객체

        // 통합된 카테고리 시스템 - 미리 정의된 카테고리들
        this.jlptLevels = ['n1', 'n2', 'n3', 'n4', 'n5']; // JLPT 레벨 목록
        this.partOfSpeechTypes = ['명사', '동사', 'い형용사', 'な형용사', '부사']; // 품사 유형
        this.themeTypes = [
            '날씨', '색깔', '감정', '가족', '음식', '교육', '직업',
            '인간관계', '자연', '외모', '일상', '시간', '행동', '기분'
        ]; // 주제 분류
    }

    /**
     * IndexedDB 초기화
     * @returns {Promise} 데이터베이스 연결 Promise
     */
    async init(retryCount = 0) {
        if (retryCount > 2) {
            console.error('Too many database initialization retries, giving up');
            throw new Error('Database initialization failed after multiple attempts');
        }

        return new Promise((resolve, reject) => {
            // IndexedDB 열기 요청
            const request = indexedDB.open(this.dbName, this.dbVersion);

            // 오류 발생 시 처리
            request.onerror = () => {
                console.error('IndexedDB open error:', request.error);
                console.error('Error name:', request.error?.name);
                console.error('Error message:', request.error?.message);

                // VersionError인 경우 즉시 데이터베이스 삭제
                console.log('Force deleting database due to error...');

                // 이전 버전 데이터베이스들도 삭제
                const oldDbs = ['JLPTWordDB_V3', 'JLPTWordDB_V2', 'JLPTWordDB'];
                oldDbs.forEach(dbName => {
                    try {
                        indexedDB.deleteDatabase(dbName);
                        console.log(`Deleted old database: ${dbName}`);
                    } catch (e) {
                        console.log(`Could not delete ${dbName}:`, e);
                    }
                });

                // 현재 데이터베이스 삭제
                const deleteRequest = indexedDB.deleteDatabase(this.dbName);

                deleteRequest.onsuccess = () => {
                    console.log('Old database deleted successfully');
                    // 새로운 데이터베이스로 다시 시도
                    setTimeout(() => {
                        console.log(`Retrying database initialization... (attempt ${retryCount + 1})`);
                        this.init(retryCount + 1).then(resolve).catch(reject);
                    }, 500);
                };

                deleteRequest.onerror = () => {
                    console.error('Failed to delete old database, but continuing...');
                    setTimeout(() => {
                        console.log(`Retrying database initialization anyway... (attempt ${retryCount + 1})`);
                        this.init(retryCount + 1).then(resolve).catch(reject);
                    }, 500);
                };
            };

            // 성공적으로 열렸을 때 처리
            request.onsuccess = () => {
                this.db = request.result; // 데이터베이스 객체 저장
                console.log('IndexedDB V3 opened successfully');
                resolve(this.db);
            };

            // 업그레이드가 필요할 때 처리 (버전이 다르거나 처음 생성)
            request.onupgradeneeded = (event) => {
                this.db = event.target.result;
                console.log('IndexedDB V3 upgrade needed, creating unified object stores');
                this.createUnifiedObjectStores(); // 객체 스토어 생성
            };
        });
    }

    /**
     * 통합된 객체 스토어 생성
     * IndexedDB의 테이블 구조를 정의
     */
    createUnifiedObjectStores() {
        // 1. Words Store (단어 저장소) - 메인 단어 데이터
        if (!this.db.objectStoreNames.contains('words')) {
            const wordsStore = this.db.createObjectStore('words', {
                keyPath: 'id', // 기본 키로 id 필드 사용
                autoIncrement: true // 자동 증가 ID
            });

            // 빠른 검색을 위한 인덱스들 생성
            wordsStore.createIndex('jlptLevel', 'jlptLevel', { unique: false }); // JLPT 레벨별 검색
            wordsStore.createIndex('partOfSpeech', 'partOfSpeech', { unique: false }); // 품사별 검색
            wordsStore.createIndex('hanja', 'hanja', { unique: false }); // 한자 검색
            wordsStore.createIndex('hiragana', 'hiragana', { unique: false }); // 히라가나 검색
            wordsStore.createIndex('difficulty', 'difficulty', { unique: false }); // 난이도별 검색
            wordsStore.createIndex('frequency', 'frequency', { unique: false }); // 빈도별 검색

            console.log('Created unified words object store');
        }

        // 2. ViewedWords Store (본 단어장) - 사용자가 본 단어 기록
        if (!this.db.objectStoreNames.contains('viewedWords')) {
            const viewedStore = this.db.createObjectStore('viewedWords', {
                keyPath: 'id', // 기본 키
                autoIncrement: true
            });

            // 검색용 인덱스들
            viewedStore.createIndex('wordId', 'wordId', { unique: false }); // 단어 ID로 검색
            viewedStore.createIndex('userId', 'userId', { unique: false }); // 사용자 ID로 검색
            viewedStore.createIndex('viewedAt', 'viewedAt', { unique: false }); // 본 날짜로 검색
            viewedStore.createIndex('userWord', ['userId', 'wordId'], { unique: true }); // 사용자-단어 조합 (중복 방지)

            console.log('Created viewedWords object store');
        }

        // 3. Categories Store (카테고리 정보) - 동적으로 생성되는 카테고리 메타데이터
        if (!this.db.objectStoreNames.contains('categories')) {
            const categoriesStore = this.db.createObjectStore('categories', {
                keyPath: 'id',
                autoIncrement: true
            });

            // 카테고리 검색용 인덱스
            categoriesStore.createIndex('type', 'type', { unique: false }); // 카테고리 타입 (jlpt, partOfSpeech, theme)
            categoriesStore.createIndex('name', 'name', { unique: false }); // 카테고리 이름

            console.log('Created categories object store');
        }

        // 4. SearchHistory Store (검색 히스토리) - 사용자 검색 기록
        if (!this.db.objectStoreNames.contains('searchHistory')) {
            const searchHistoryStore = this.db.createObjectStore('searchHistory', {
                keyPath: 'id',
                autoIncrement: true
            });

            // 검색 히스토리 인덱스
            searchHistoryStore.createIndex('searchTerm', 'searchTerm', { unique: false }); // 검색어별
            searchHistoryStore.createIndex('searchedAt', 'searchedAt', { unique: false }); // 검색 날짜별

            console.log('Created searchHistory object store');
        }

        // 5. MyVocabulary Store (나의 단어장) - 사용자가 저장한 단어들
        if (!this.db.objectStoreNames.contains('myVocabulary')) {
            const myVocabularyStore = this.db.createObjectStore('myVocabulary', {
                keyPath: 'id'
            });

            // 나의 단어장 인덱스
            myVocabularyStore.createIndex('savedAt', 'savedAt', { unique: false }); // 저장 날짜별
            myVocabularyStore.createIndex('hanja', 'hanja', { unique: false }); // 한자별
            myVocabularyStore.createIndex('hiragana', 'hiragana', { unique: false }); // 히라가나별
            myVocabularyStore.createIndex('jlptLevel', 'jlptLevel', { unique: false }); // JLPT 레벨별

            console.log('Created myVocabulary object store');
        }

        // 6. LearningStats Store (학습 통계) - 일별 학습 시간과 활동 기록
        if (!this.db.objectStoreNames.contains('learningStats')) {
            const learningStatsStore = this.db.createObjectStore('learningStats', {
                keyPath: 'date' // 날짜를 기본 키로 사용 (YYYY-MM-DD 형식)
            });

            // 학습 통계 인덱스
            learningStatsStore.createIndex('totalTime', 'totalTime', { unique: false }); // 총 학습 시간별
            learningStatsStore.createIndex('totalActivities', 'totalActivities', { unique: false }); // 총 활동 수별

            console.log('Created learningStats object store');
        }

        // 7. Badges Store (뱃지 시스템) - 사용자 뱃지 획득 기록
        if (!this.db.objectStoreNames.contains('badges')) {
            const badgesStore = this.db.createObjectStore('badges', {
                keyPath: 'id'
            });

            // 뱃지 인덱스
            badgesStore.createIndex('earnedAt', 'earnedAt', { unique: false }); // 획득 날짜별
            badgesStore.createIndex('badgeType', 'badgeType', { unique: false }); // 뱃지 타입별

            console.log('Created badges object store');
        }
    }

    /**
     * JLPT 레벨별 단어 저장 (통합 구조)
     * JSON 파일에서 로드한 단어 데이터를 데이터베이스에 저장
     *
     * @param {string} jlptLevel - JLPT 레벨 (n1, n2, n3, n4, n5)
     * @param {Array} wordsArray - 저장할 단어 배열
     */
    async saveJLPTWords(jlptLevel, wordsArray) {
        // 데이터베이스 초기화 확인
        if (!this.db) throw new Error('Database not initialized');

        // 쓰기 트랜잭션 시작
        const transaction = this.db.transaction(['words'], 'readwrite');
        const store = transaction.objectStore('words');

        // 각 단어에 메타데이터 추가하여 저장
        const promises = wordsArray.map(word => {
            const enhancedWord = {
                ...word, // 기존 단어 데이터 복사
                jlptLevel: jlptLevel.toUpperCase(), // JLPT 레벨을 대문자로 저장 (N1, N2, N3, N4, N5)
                createdAt: new Date().toISOString(), // 생성 시각
                updatedAt: new Date().toISOString() // 수정 시각
            };
            return this.promisifyRequest(store.put(enhancedWord)); // 데이터베이스에 저장
        });

        // 모든 단어 저장 완료까지 대기
        await Promise.all(promises);
        console.log(`${wordsArray.length} words saved for JLPT ${jlptLevel.toUpperCase()}`);

        // 저장 후 카테고리 정보 업데이트
        await this.updateCategoryInfo();
    }

    /**
     * 동적 카테고리 정보 업데이트
     * 데이터베이스의 실제 데이터를 기반으로 카테고리 생성 및 개수 계산
     */
    async updateCategoryInfo() {
        if (!this.db) throw new Error('Database not initialized');

        // 두 개의 스토어에 대한 읽기-쓰기 트랜잭션
        const transaction = this.db.transaction(['words', 'categories'], 'readwrite');
        const wordsStore = transaction.objectStore('words');
        const categoriesStore = transaction.objectStore('categories');

        // 기존 카테고리 정보 모두 삭제 (새로 계산하기 위해)
        await this.promisifyRequest(categoriesStore.clear());

        // 모든 단어 데이터 조회
        const allWords = await this.promisifyRequest(wordsStore.getAll());

        // 카테고리별 고유값 수집을 위한 Set 객체들
        const categories = {
            jlpt: new Set(), // JLPT 레벨 중복 제거
            partOfSpeech: new Set(), // 품사 중복 제거
            themes: new Set() // 주제 중복 제거
        };

        // 모든 단어를 순회하며 카테고리 정보 추출
        allWords.forEach(word => {
            // JLPT 레벨 수집
            if (word.jlptLevel) categories.jlpt.add(word.jlptLevel);
            // 품사 수집
            if (word.partOfSpeech) categories.partOfSpeech.add(word.partOfSpeech);
            // 주제 수집 (배열인 경우 각각 추가)
            if (word.themes && Array.isArray(word.themes)) {
                word.themes.forEach(theme => categories.themes.add(theme));
            }
        });

        // 카테고리 정보를 데이터베이스에 저장하기 위한 Promise 배열
        const categoryPromises = [];

        // JLPT 레벨별 카테고리 정보 저장
        categories.jlpt.forEach(level => {
            categoryPromises.push(
                this.promisifyRequest(categoriesStore.add({
                    type: 'jlpt', // 카테고리 타입
                    name: level, // 카테고리 이름
                    displayName: level, // 표시용 이름
                    count: allWords.filter(w => w.jlptLevel === level).length // 해당 레벨의 단어 개수
                }))
            );
        });

        // 품사별 카테고리 정보 저장
        categories.partOfSpeech.forEach(pos => {
            categoryPromises.push(
                this.promisifyRequest(categoriesStore.add({
                    type: 'partOfSpeech',
                    name: pos,
                    displayName: pos,
                    count: allWords.filter(w => w.partOfSpeech === pos).length // 해당 품사의 단어 개수
                }))
            );
        });

        // 주제별 카테고리 정보 저장
        categories.themes.forEach(theme => {
            categoryPromises.push(
                this.promisifyRequest(categoriesStore.add({
                    type: 'theme',
                    name: theme,
                    displayName: theme,
                    count: allWords.filter(w => w.themes && w.themes.includes(theme)).length // 해당 주제의 단어 개수
                }))
            );
        });

        // 모든 카테고리 정보 저장 완료까지 대기
        await Promise.all(categoryPromises);
        console.log('Category information updated');
    }

    /**
     * 카테고리별 단어 조회 (통합 버전)
     * 특정 필터 조건에 맞는 단어들을 조회
     *
     * @param {string} filterType - 필터 타입 (jlptLevel, partOfSpeech, theme, all)
     * @param {string} filterValue - 필터 값
     * @returns {Array} 필터링된 단어 배열
     */
    async getWordsByFilter(filterType, filterValue) {
        if (!this.db) throw new Error('Database not initialized');

        console.log('getWordsByFilter called:', filterType, filterValue);

        // 읽기 전용 트랜잭션 시작
        const transaction = this.db.transaction(['words'], 'readonly');
        const store = transaction.objectStore('words');

        let words = [];

        try {
            // 필터 타입에 따른 조회 방법 분기
            switch (filterType) {
                case 'jlptLevel':
                    // JLPT 레벨 인덱스를 사용한 빠른 조회
                    console.log('Filtering by JLPT level:', filterValue);
                    const jlptIndex = store.index('jlptLevel');
                    words = await this.promisifyRequest(jlptIndex.getAll(filterValue.toUpperCase()));
                    console.log('JLPT words found:', words.length);
                    break;

                case 'partOfSpeech':
                    // 품사 인덱스를 사용한 조회
                    console.log('Filtering by part of speech:', filterValue);
                    const posIndex = store.index('partOfSpeech');
                    words = await this.promisifyRequest(posIndex.getAll(filterValue));
                    console.log('PartOfSpeech words found:', words.length);
                    break;

                case 'theme':
                    // 주제는 배열에 포함되어 있으므로 전체 조회 후 메모리에서 필터링
                    console.log('Filtering by theme:', filterValue);
                    const allWordsForTheme = await this.promisifyRequest(store.getAll());
                    words = allWordsForTheme.filter(word =>
                        word.themes && word.themes.includes(filterValue)
                    );
                    console.log('Theme words found:', words.length);
                    break;

                case 'all':
                    // 모든 단어 조회
                    console.log('Getting all words');
                    words = await this.promisifyRequest(store.getAll());
                    console.log('All words found:', words.length);
                    break;

                default:
                    throw new Error(`Unknown filter type: ${filterType}`);
            }

            // 샘플 단어 로그 출력 (디버깅용)
            console.log('Sample word from filter:', words[0]);
            return words;

        } catch (error) {
            console.error('Error in getWordsByFilter:', error);
            throw error;
        }
    }

    /**
     * 복합 필터링 (여러 조건 동시 적용)
     * 여러 필터 조건을 모두 만족하는 단어들을 조회
     *
     * @param {Object} filters - 필터 객체
     * @param {string} filters.jlptLevel - JLPT 레벨
     * @param {string} filters.partOfSpeech - 품사
     * @param {string} filters.theme - 주제
     * @returns {Array} 필터링된 단어 배열
     */
    async getWordsByMultipleFilters(filters) {
        if (!this.db) throw new Error('Database not initialized');

        const transaction = this.db.transaction(['words'], 'readonly');
        const store = transaction.objectStore('words');

        // 전체 단어를 조회한 후 메모리에서 필터링 (복합 조건이므로)
        const allWords = await this.promisifyRequest(store.getAll());

        // 각 단어가 모든 필터 조건을 만족하는지 확인
        return allWords.filter(word => {
            let matches = true; // 기본적으로 매치된다고 가정

            // JLPT 레벨 필터 확인
            if (filters.jlptLevel && word.jlptLevel !== filters.jlptLevel.toUpperCase()) {
                matches = false;
            }

            // 품사 필터 확인
            if (filters.partOfSpeech && word.partOfSpeech !== filters.partOfSpeech) {
                matches = false;
            }

            // 주제 필터 확인 (배열에 포함되어 있는지)
            if (filters.theme && (!word.themes || !word.themes.includes(filters.theme))) {
                matches = false;
            }

            return matches; // 모든 조건을 만족하면 true
        });
    }

    /**
     * 랜덤 단어 선택 (통합 버전)
     * 필터 조건에 맞는 단어들 중에서 랜덤하게 선택
     *
     * @param {Object} filters - 필터 조건 객체
     * @param {number} count - 가져올 단어 수 (null이면 전체)
     * @param {boolean} excludeViewed - 본 단어 제외 여부
     * @param {string} userId - 사용자 ID
     * @returns {Array} 랜덤 선택된 단어 배열
     */
    async getRandomWords(filters = {}, count = 1, excludeViewed = false, userId = 'default') {
        if (!this.db) throw new Error('Database not initialized');

        console.log('getRandomWords called with:', { filters, count, excludeViewed, userId });

        // 필터 조건에 맞는 단어들을 먼저 조회
        let availableWords = [];

        try {
            if (Object.keys(filters).length === 0) {
                // 필터가 없으면 전체 단어 조회
                console.log('No filters, getting all words');
                availableWords = await this.getWordsByFilter('all');
            } else if (Object.keys(filters).length === 1) {
                // 단일 필터인 경우 해당 필터로 조회
                const [filterType, filterValue] = Object.entries(filters)[0];
                console.log('Single filter:', filterType, '=', filterValue);
                availableWords = await this.getWordsByFilter(filterType, filterValue);
            } else {
                // 복합 필터인 경우 복합 필터링 함수 사용
                console.log('Multiple filters:', filters);
                availableWords = await this.getWordsByMultipleFilters(filters);
            }

            console.log('Available words found:', availableWords.length);
            console.log('Sample available word:', availableWords[0]);

        } catch (error) {
            console.error('Error getting words by filter:', error);
            throw error;
        }

        // 조회된 단어가 없으면 오류 발생
        if (availableWords.length === 0) {
            throw new Error('No words found for the given filters');
        }

        // 본 단어 제외 옵션이 활성화된 경우
        if (excludeViewed) {
            console.log('Excluding viewed words...');
            const viewedWordIds = await this.getViewedWordIds(userId); // 본 단어 ID 목록 조회
            console.log('Viewed word IDs:', viewedWordIds);

            // 본 단어가 아닌 것들만 필터링
            const unviewedWords = availableWords.filter(word => !viewedWordIds.includes(word.id));
            console.log('Unviewed words:', unviewedWords.length);

            if (unviewedWords.length > 0) {
                availableWords = unviewedWords; // 안 본 단어들로 대체
            } else {
                console.log('All words have been viewed, selecting from all available words');
                // 모든 단어를 다 봤으면 전체에서 선택
            }
        }

        // 랜덤 선택 로직
        const selectedWords = [];
        const usedIndices = new Set(); // 중복 방지를 위한 인덱스 저장
        const maxCount = count === null ? availableWords.length : Math.min(count, availableWords.length);

        console.log('Selecting', maxCount, 'words from', availableWords.length, 'available');

        // 지정된 개수만큼 랜덤하게 선택
        for (let i = 0; i < maxCount; i++) {
            let randomIndex;
            // 중복되지 않는 인덱스 선택
            do {
                randomIndex = Math.floor(Math.random() * availableWords.length);
            } while (usedIndices.has(randomIndex));

            usedIndices.add(randomIndex); // 사용된 인덱스 기록
            selectedWords.push(availableWords[randomIndex]); // 선택된 단어 추가
        }

        console.log('Selected words:', selectedWords);
        return selectedWords;
    }

    /**
     * 사용 가능한 카테고리 조회
     * UI에서 필터 드롭다운을 만들기 위한 카테고리 정보 반환
     *
     * @returns {Object} 카테고리 정보 객체
     */
    async getAvailableCategories() {
        if (!this.db) throw new Error('Database not initialized');

        const transaction = this.db.transaction(['categories'], 'readonly');
        const store = transaction.objectStore('categories');

        // 모든 카테고리 정보 조회
        const allCategories = await this.promisifyRequest(store.getAll());

        // 카테고리 타입별로 분류
        const categorized = {
            jlpt: [], // JLPT 레벨 카테고리들
            partOfSpeech: [], // 품사 카테고리들
            themes: [] // 주제 카테고리들
        };

        // 카테고리 타입에 따라 분류
        allCategories.forEach(cat => {
            if (cat.type === 'jlpt') {
                categorized.jlpt.push(cat);
            } else if (cat.type === 'partOfSpeech') {
                categorized.partOfSpeech.push(cat);
            } else if (cat.type === 'theme') {
                categorized.themes.push(cat);
            }
        });

        // 각 카테고리 내에서 이름순으로 정렬
        categorized.jlpt.sort((a, b) => a.name.localeCompare(b.name));
        categorized.partOfSpeech.sort((a, b) => a.name.localeCompare(b.name));
        categorized.themes.sort((a, b) => a.name.localeCompare(b.name));

        return categorized;
    }

    /**
     * 단어를 본 단어로 추가
     * 사용자가 단어를 학습했다고 표시
     *
     * @param {number} wordId - 단어 ID
     * @param {string} userId - 사용자 ID (기본: 'default')
     */
    async markWordAsViewed(wordId, userId = 'default') {
        if (!this.db) throw new Error('Database not initialized');

        const transaction = this.db.transaction(['viewedWords'], 'readwrite');
        const store = transaction.objectStore('viewedWords');
        const index = store.index('userWord'); // 사용자-단어 복합 인덱스

        // 이미 본 단어인지 확인
        const existing = await this.promisifyRequest(index.get([userId, wordId]));

        if (!existing) {
            // 새로 본 단어인 경우 추가
            const viewedWord = {
                wordId,
                userId,
                viewedAt: new Date().toISOString(), // 처음 본 시각
                viewCount: 1 // 본 횟수
            };
            await this.promisifyRequest(store.add(viewedWord));
        } else {
            // 이미 본 단어인 경우 횟수 증가 및 마지막 본 시각 업데이트
            const updated = {
                ...existing,
                viewCount: existing.viewCount + 1, // 본 횟수 증가
                lastViewedAt: new Date().toISOString() // 마지막 본 시각 업데이트
            };
            await this.promisifyRequest(store.put(updated));
        }
    }

    /**
     * 본 단어 목록 조회
     * 사용자가 학습한 단어들의 상세 정보를 조회
     *
     * @param {string} userId - 사용자 ID
     * @returns {Array} 본 단어 배열 (최신순 정렬)
     */
    async getViewedWords(userId = 'default') {
        if (!this.db) throw new Error('Database not initialized');

        // 두 개의 스토어에서 데이터를 조회해야 함
        const transaction = this.db.transaction(['viewedWords', 'words'], 'readonly');
        const viewedStore = transaction.objectStore('viewedWords');
        const wordsStore = transaction.objectStore('words');
        const index = viewedStore.index('userId');

        // 해당 사용자의 본 단어 기록들 조회
        const viewedRecords = await this.promisifyRequest(index.getAll(userId));

        const words = [];
        // 각 기록에 대해 실제 단어 정보를 조회하여 결합
        for (const record of viewedRecords) {
            const word = await this.promisifyRequest(wordsStore.get(record.wordId));
            if (word) {
                words.push({
                    ...word, // 단어 정보
                    viewedAt: record.viewedAt, // 본 시각
                    viewCount: record.viewCount // 본 횟수
                });
            }
        }

        // 최근에 본 순서대로 정렬하여 반환
        return words.sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt));
    }

    /**
     * 본 단어 ID 목록 조회
     * 빠른 필터링을 위해 ID만 조회
     *
     * @param {string} userId - 사용자 ID
     * @returns {Array} 본 단어 ID 배열
     */
    async getViewedWordIds(userId = 'default') {
        if (!this.db) throw new Error('Database not initialized');

        const transaction = this.db.transaction(['viewedWords'], 'readonly');
        const store = transaction.objectStore('viewedWords');
        const index = store.index('userId');

        // 해당 사용자의 본 단어 기록들 조회
        const records = await this.promisifyRequest(index.getAll(userId));
        // 단어 ID만 추출하여 배열로 반환
        return records.map(record => record.wordId);
    }

    /**
     * 통계 정보 조회
     * 학습 진도 및 전체 현황 정보
     *
     * @param {string} userId - 사용자 ID
     * @returns {Object} 통계 정보 객체
     */
    async getStatistics(userId = 'default') {
        // 필요한 정보들을 병렬로 조회
        const totalWords = await this.getTotalWordCount(); // 전체 단어 수
        const viewedWords = await this.getViewedWords(userId); // 본 단어들
        const categories = await this.getAvailableCategories(); // 카테고리 정보

        return {
            totalWords, // 전체 단어 수
            totalViewed: viewedWords.length, // 본 단어 수
            overallProgress: totalWords > 0 ? (viewedWords.length / totalWords * 100).toFixed(1) : 0, // 진도율
            categories // 카테고리별 정보
        };
    }

    /**
     * 전체 단어 수 조회
     * 데이터베이스에 저장된 총 단어 개수
     *
     * @returns {number} 전체 단어 수
     */
    async getTotalWordCount() {
        if (!this.db) throw new Error('Database not initialized');

        const transaction = this.db.transaction(['words'], 'readonly');
        const store = transaction.objectStore('words');
        const request = store.count(); // 개수만 조회 (효율적)
        return this.promisifyRequest(request);
    }

    /**
     * 포괄적 검색 기능
     * 한자, 히라가나, 뜻, 예문에서 검색
     * 관련도 점수를 계산하여 정렬된 결과 제공
     *
     * @param {string} searchTerm - 검색어
     * @param {Object} options - 검색 옵션
     * @param {boolean} options.caseSensitive - 대소문자 구분 (기본: false)
     * @param {number} options.limit - 결과 제한 (기본: 100)
     * @returns {Array} 검색 결과 배열 (관련도 순 정렬)
     */
    async searchWords(searchTerm, options = {}) {
        if (!this.db) throw new Error('Database not initialized');
        // 빈 검색어는 빈 배열 반환
        if (!searchTerm || searchTerm.trim() === '') {
            return [];
        }

        // 옵션 기본값 설정
        const { caseSensitive = false, limit = 100 } = options;
        const normalizedSearchTerm = caseSensitive ? searchTerm.trim() : searchTerm.trim().toLowerCase();

        console.log('Searching for:', normalizedSearchTerm);

        const transaction = this.db.transaction(['words'], 'readonly');
        const store = transaction.objectStore('words');

        // 모든 단어를 가져와서 클라이언트 사이드에서 검색
        // (복잡한 검색 로직 때문에 IndexedDB 쿼리보다 효율적)
        const allWords = await this.promisifyRequest(store.getAll());

        const searchResults = [];

        // 각 단어에 대해 매치 점수 계산
        for (const word of allWords) {
            const matchScore = this.calculateMatchScore(word, normalizedSearchTerm, caseSensitive);

            // 점수가 0보다 크면 (매치되면) 결과에 추가
            if (matchScore.score > 0) {
                searchResults.push({
                    ...word, // 원래 단어 정보
                    matchScore: matchScore.score, // 매치 점수
                    matchType: matchScore.types, // 매치 타입들
                    matchedFields: matchScore.fields // 매치된 필드들
                });
            }

            // 결과 개수 제한
            if (searchResults.length >= limit) {
                break;
            }
        }

        // 매치 점수 순으로 정렬 (높은 점수가 먼저)
        searchResults.sort((a, b) => b.matchScore - a.matchScore);

        console.log(`Found ${searchResults.length} results for "${searchTerm}"`);
        return searchResults;
    }

    /**
     * 단어와 검색어 간의 매치 점수 계산
     * 다양한 매치 타입과 필드별 가중치를 적용하여 관련도 점수 산출
     *
     * @param {Object} word - 단어 객체
     * @param {string} searchTerm - 검색어
     * @param {boolean} caseSensitive - 대소문자 구분
     * @returns {Object} 매치 결과 { score, types, fields }
     */
    calculateMatchScore(word, searchTerm, caseSensitive = false) {
        let score = 0; // 총 점수
        const matchTypes = []; // 매치 타입들
        const matchedFields = []; // 매치된 필드들

        // 검색 대상 필드들과 각각의 가중치 정의
        const searchFields = [
            { field: 'hanja', weight: 10, label: '한자' }, // 한자는 높은 가중치
            { field: 'hiragana', weight: 10, label: '히라가나' }, // 히라가나도 높은 가중치
            { field: 'mean', weight: 8, label: '뜻' }, // 뜻은 중간 가중치
            { field: 'jpExample1', weight: 3, label: '일본어 예문1' }, // 예문들은 낮은 가중치
            { field: 'jpExample2', weight: 3, label: '일본어 예문2' },
            { field: 'koExample1', weight: 3, label: '한국어 예문1' },
            { field: 'koExample2', weight: 3, label: '한국어 예문2' },
            { field: 'partOfSpeech', weight: 2, label: '품사' } // 품사는 가장 낮은 가중치
        ];

        // 각 필드에 대해 매치 점수 계산
        for (const { field, weight, label } of searchFields) {
            const fieldValue = word[field];
            if (!fieldValue) continue; // 해당 필드가 없으면 스킵

            // 대소문자 옵션에 따른 정규화
            const normalizedFieldValue = caseSensitive ? fieldValue : fieldValue.toLowerCase();

            // 매치 타입별 점수 계산
            if (normalizedFieldValue === searchTerm) {
                // 정확한 일치 - 가장 높은 점수
                score += weight * 10; // 완전 일치시 가중치 10배
                matchTypes.push('exact');
                matchedFields.push({ field, label, type: 'exact', value: fieldValue });
            }
            else if (normalizedFieldValue.startsWith(searchTerm)) {
                // 시작 부분 일치 - 두 번째로 높은 점수
                score += weight * 5; // 시작 일치시 가중치 5배
                matchTypes.push('startsWith');
                matchedFields.push({ field, label, type: 'startsWith', value: fieldValue });
            }
            else if (normalizedFieldValue.includes(searchTerm)) {
                // 부분 일치 - 기본 점수
                score += weight * 2; // 부분 일치시 가중치 2배
                matchTypes.push('includes');
                matchedFields.push({ field, label, type: 'includes', value: fieldValue });
            }
        }

        // 주제 배열에서 검색 (themes는 배열이므로 별도 처리)
        if (word.themes && Array.isArray(word.themes)) {
            for (const theme of word.themes) {
                const normalizedTheme = caseSensitive ? theme : theme.toLowerCase();
                if (normalizedTheme.includes(searchTerm)) {
                    score += 2; // 주제 매치는 고정 점수
                    matchTypes.push('theme');
                    matchedFields.push({ field: 'themes', label: '주제', type: 'includes', value: theme });
                }
            }
        }

        return {
            score, // 총 점수
            types: [...new Set(matchTypes)], // 매치 타입들 (중복 제거)
            fields: matchedFields // 매치된 필드들의 상세 정보
        };
    }

    /**
     * 검색 히스토리 저장
     * 사용자의 검색 기록을 저장하여 나중에 참조 가능
     *
     * @param {string} searchTerm - 검색어
     * @param {number} resultCount - 검색 결과 수
     */
    async saveSearchHistory(searchTerm, resultCount) {
        if (!this.db) throw new Error('Database not initialized');

        const transaction = this.db.transaction(['searchHistory'], 'readwrite');
        const store = transaction.objectStore('searchHistory');

        // 검색 히스토리 아이템 생성
        const historyItem = {
            searchTerm: searchTerm.trim(), // 검색어 (공백 제거)
            resultCount, // 검색 결과 수
            searchedAt: new Date().toISOString() // 검색 시각
        };

        try {
            await this.promisifyRequest(store.add(historyItem));
        } catch (error) {
            // 중복 등의 이유로 저장 실패해도 큰 문제 없음
            console.log('Search history save failed, might already exist:', error);
        }
    }

    /**
     * 검색 히스토리 조회
     * 최근 검색어들을 최신순으로 조회
     *
     * @param {number} limit - 조회할 히스토리 수 (기본: 10)
     * @returns {Array} 검색 히스토리 배열 (최신순)
     */
    async getSearchHistory(limit = 10) {
        if (!this.db) throw new Error('Database not initialized');

        const transaction = this.db.transaction(['searchHistory'], 'readonly');
        const store = transaction.objectStore('searchHistory');
        const index = store.index('searchedAt'); // 검색 시각 인덱스 사용

        const request = index.openCursor(null, 'prev'); // 최신순으로 커서 열기
        const history = [];

        // 커서를 사용하여 최신 히스토리부터 조회
        return new Promise((resolve, reject) => {
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor && history.length < limit) {
                    history.push(cursor.value); // 히스토리 추가
                    cursor.continue(); // 다음 항목으로
                } else {
                    resolve(history); // 완료
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    // === 유틸리티 메서드들 ===

    /**
     * IndexedDB 요청을 Promise로 변환
     * IndexedDB의 콜백 기반 API를 async/await와 호환되도록 변환
     *
     * @param {IDBRequest} request - IndexedDB 요청 객체
     * @returns {Promise} 변환된 Promise
     */
    promisifyRequest(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result); // 성공시 결과 반환
            request.onerror = () => reject(request.error); // 실패시 에러 반환
        });
    }

    /**
     * 특정 JLPT 레벨의 데이터만 삭제
     * 데이터 업데이트 시 기존 레벨 데이터를 지우고 새로 추가하기 위해 사용
     *
     * @param {string} jlptLevel - 삭제할 JLPT 레벨 (n1, n2, n3, n4, n5)
     */
    async clearJLPTLevel(jlptLevel) {
        if (!this.db) throw new Error('Database not initialized');

        const transaction = this.db.transaction(['words'], 'readwrite');
        const store = transaction.objectStore('words');

        try {
            // 커서를 사용하여 해당 JLPT 레벨의 모든 단어 삭제
            const request = store.openCursor();

            return new Promise((resolve, reject) => {
                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        const word = cursor.value;
                        // 해당 JLPT 레벨의 단어인 경우 삭제
                        if (word.jlptLevel === jlptLevel.toUpperCase()) {
                            cursor.delete();
                        }
                        cursor.continue(); // 다음 단어로
                    } else {
                        // 모든 단어 처리 완료
                        console.log(`Cleared all ${jlptLevel.toUpperCase()} words from database`);
                        resolve();
                    }
                };

                request.onerror = () => {
                    console.error('Error clearing JLPT level data:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Error clearing JLPT level:', error);
            throw error;
        }
    }

    /**
     * 데이터베이스 완전 초기화 (모든 데이터 삭제)
     * 앱 리셋이나 완전히 새로 시작할 때 사용
     */
    async clearAllData() {
        if (!this.db) throw new Error('Database not initialized');

        // 모든 스토어에 대한 쓰기 트랜잭션
        const transaction = this.db.transaction(['words', 'categories', 'viewedWords', 'searchHistory', 'myVocabulary'], 'readwrite');

        try {
            // 모든 스토어의 데이터 삭제
            await this.promisifyRequest(transaction.objectStore('words').clear());
            await this.promisifyRequest(transaction.objectStore('categories').clear());
            await this.promisifyRequest(transaction.objectStore('viewedWords').clear());
            await this.promisifyRequest(transaction.objectStore('searchHistory').clear());
            await this.promisifyRequest(transaction.objectStore('myVocabulary').clear());

            console.log('All data cleared from IndexedDB');
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            throw error;
        }
    }

    /**
     * 나의 단어장 기능 - 단어 저장
     * @param {Object} wordData - 저장할 단어 데이터
     * @returns {Promise<boolean>} 저장 성공 여부
     */
    async saveToMyVocabulary(wordData) {
        if (!this.db) throw new Error('Database not initialized');

        try {
            const transaction = this.db.transaction(['myVocabulary'], 'readwrite');
            const store = transaction.objectStore('myVocabulary');

            const savedWord = {
                ...wordData,
                savedAt: new Date().toISOString(),
                id: `${wordData.hanja}_${wordData.hiragana}_${Date.now()}`
            };

            await this.promisifyRequest(store.add(savedWord));
            console.log('Word saved to my vocabulary:', savedWord);
            return true;
        } catch (error) {
            console.error('Error saving word to my vocabulary:', error);
            return false;
        }
    }

    /**
     * 나의 단어장에서 단어 제거
     * @param {string} wordId - 제거할 단어 ID
     * @returns {Promise<boolean>} 제거 성공 여부
     */
    async removeFromMyVocabulary(wordId) {
        if (!this.db) throw new Error('Database not initialized');

        try {
            const transaction = this.db.transaction(['myVocabulary'], 'readwrite');
            const store = transaction.objectStore('myVocabulary');

            await this.promisifyRequest(store.delete(wordId));
            console.log('Word removed from my vocabulary:', wordId);
            return true;
        } catch (error) {
            console.error('Error removing word from my vocabulary:', error);
            return false;
        }
    }

    /**
     * 나의 단어장 전체 조회
     * @returns {Promise<Array>} 저장된 단어 목록
     */
    async getMyVocabulary() {
        if (!this.db) throw new Error('Database not initialized');

        try {
            const transaction = this.db.transaction(['myVocabulary'], 'readonly');
            const store = transaction.objectStore('myVocabulary');
            const index = store.index('savedAt');

            const words = await this.promisifyRequest(index.getAll());
            return words.reverse(); // 최신 저장 순으로 정렬
        } catch (error) {
            console.error('Error getting my vocabulary:', error);
            return [];
        }
    }

    /**
     * 단어가 나의 단어장에 저장되어 있는지 확인
     * @param {string} hanja - 한자
     * @param {string} hiragana - 히라가나
     * @returns {Promise<boolean>} 저장 여부
     */
    async isWordInMyVocabulary(hanja, hiragana) {
        if (!this.db) throw new Error('Database not initialized');

        try {
            const transaction = this.db.transaction(['myVocabulary'], 'readonly');
            const store = transaction.objectStore('myVocabulary');

            const words = await this.promisifyRequest(store.getAll());
            return words.some(word => word.hanja === hanja && word.hiragana === hiragana);
        } catch (error) {
            console.error('Error checking word in my vocabulary:', error);
            return false;
        }
    }

    /**
     * 뱃지 저장
     * @param {string} badgeType - 뱃지 타입 ('first_word', 'study_streak', 'word_master', etc.)
     * @param {string} title - 뱃지 제목
     * @param {string} description - 뱃지 설명
     * @param {string} icon - 뱃지 아이콘 (이모지 또는 아이콘명)
     */
    async saveBadge(badgeType, title, description, icon) {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['badges'], 'readwrite');
            const store = transaction.objectStore('badges');

            const badge = {
                id: `${badgeType}_${Date.now()}`,
                badgeType: badgeType,
                title: title,
                description: description,
                icon: icon,
                earnedAt: new Date().toISOString()
            };

            const request = store.add(badge);

            request.onsuccess = () => {
                console.log(`Badge earned: ${title}`);
                resolve(badge);
            };

            request.onerror = () => {
                console.error('Error saving badge:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * 뱃지 목록 조회
     * @returns {Promise<Array>} 뱃지 목록
     */
    async getBadges() {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['badges'], 'readonly');
            const store = transaction.objectStore('badges');
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result || []);
            };

            request.onerror = () => {
                console.error('Error getting badges:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * 특정 타입의 뱃지 확인
     * @param {string} badgeType - 뱃지 타입
     * @returns {Promise<boolean>} 뱃지 보유 여부
     */
    async hasBadge(badgeType) {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['badges'], 'readonly');
            const store = transaction.objectStore('badges');
            const index = store.index('badgeType');
            const request = index.getAll(badgeType);

            request.onsuccess = () => {
                resolve(request.result.length > 0);
            };

            request.onerror = () => {
                console.error('Error checking badge:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * 학습 통계 기록 (시간 기반)
     * @param {string} type - 활동 타입 ('word_study', 'practice_complete', 'vocabulary_save')
     * @param {number} timeSpent - 소요 시간 (초 단위)
     * @param {number} count - 활동 횟수 (기본값: 1)
     */
    async recordLearningActivity(type, timeSpent = 0, count = 1) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const transaction = this.db.transaction(['learningStats'], 'readwrite');
            const store = transaction.objectStore('learningStats');

            // 오늘 날짜의 통계 데이터 가져오기
            let todayStats = await this.promisifyRequest(store.get(today));

            if (!todayStats) {
                // 첫 기록인 경우 초기 데이터 생성
                todayStats = {
                    date: today,
                    activities: {
                        word_study: { count: 0, timeMinutes: 0 },
                        practice_complete: { count: 0, timeMinutes: 0 },
                        vocabulary_save: { count: 0, timeMinutes: 0 }
                    },
                    totalActivities: 0,
                    totalTime: 0 // 분 단위
                };
            }

            // 활동 타입별 데이터 업데이트
            if (todayStats.activities[type]) {
                todayStats.activities[type].count += count;
                todayStats.activities[type].timeMinutes += Math.round(timeSpent / 1000 / 60); // 밀리초 → 초 → 분으로 변환
            }

            // 총합 계산
            todayStats.totalActivities = Object.values(todayStats.activities)
                .reduce((sum, activity) => sum + activity.count, 0);
            todayStats.totalTime = Object.values(todayStats.activities)
                .reduce((sum, activity) => sum + activity.timeMinutes, 0);

            // 업데이트된 데이터 저장
            await this.promisifyRequest(store.put(todayStats));

            console.log(`Learning activity recorded: ${type}, ${Math.round(timeSpent/1000/60)}분, ${count}회`);
            return todayStats;

        } catch (error) {
            console.error('Error recording learning activity:', error);
            throw error;
        }
    }

    /**
     * 주간 학습 통계 가져오기
     * @returns {Object} 최근 7일간의 학습 데이터
     */
    async getWeeklyLearningStats() {
        try {
            const weeklyData = [];
            const today = new Date();

            // 최근 7일 데이터 조회
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];

                const transaction = this.db.transaction(['learningStats'], 'readonly');
                const store = transaction.objectStore('learningStats');
                const dayStats = await this.promisifyRequest(store.get(dateStr));

                if (dayStats) {
                    weeklyData.push({
                        date: dateStr,
                        activities: dayStats.totalActivities,
                        timeMinutes: dayStats.totalTime,
                        breakdown: dayStats.activities
                    });
                } else {
                    weeklyData.push({
                        date: dateStr,
                        activities: 0,
                        timeMinutes: 0,
                        breakdown: {
                            word_study: { count: 0, timeMinutes: 0 },
                            practice_complete: { count: 0, timeMinutes: 0 },
                            vocabulary_save: { count: 0, timeMinutes: 0 }
                        }
                    });
                }
            }

            return {
                weekly: weeklyData,
                today: weeklyData[6] // 마지막이 오늘
            };

        } catch (error) {
            console.error('Error getting weekly learning stats:', error);
            throw error;
        }
    }

    /**
     * 오늘의 학습 통계 가져오기
     * @returns {Object} 오늘의 학습 데이터
     */
    async getTodayLearningStats() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const transaction = this.db.transaction(['learningStats'], 'readonly');
            const store = transaction.objectStore('learningStats');

            const todayStats = await this.promisifyRequest(store.get(today));

            if (!todayStats) {
                return {
                    date: today,
                    activities: {
                        word_study: { count: 0, timeMinutes: 0 },
                        practice_complete: { count: 0, timeMinutes: 0 },
                        vocabulary_save: { count: 0, timeMinutes: 0 }
                    },
                    totalActivities: 0,
                    totalTime: 0
                };
            }

            return todayStats;

        } catch (error) {
            console.error('Error getting today learning stats:', error);
            throw error;
        }
    }

    /**
     * 데이터베이스 삭제 및 재생성
     * 스키마 변경 시 사용
     */
    async deleteAndRecreateDatabase() {
        console.log('Deleting and recreating database...');

        // 기존 연결 종료
        if (this.db) {
            this.db.close();
            this.db = null;
        }

        return new Promise((resolve, reject) => {
            const deleteRequest = indexedDB.deleteDatabase(this.dbName);

            deleteRequest.onerror = () => {
                console.error('Error deleting database:', deleteRequest.error);
                reject(deleteRequest.error);
            };

            deleteRequest.onsuccess = async () => {
                console.log('Database deleted successfully');
                try {
                    await this.init();
                    console.log('Database recreated successfully');
                    resolve(this.db);
                } catch (error) {
                    console.error('Error recreating database:', error);
                    reject(error);
                }
            };

            deleteRequest.onblocked = () => {
                console.warn('Database deletion blocked - please close other tabs');
                reject(new Error('Database deletion blocked'));
            };
        });
    }

    /**
     * 데이터베이스 연결 종료
     * 앱 종료 시 리소스 정리용
     */
    close() {
        if (this.db) {
            this.db.close(); // 데이터베이스 연결 종료
            this.db = null; // 참조 제거
            console.log('IndexedDB V3 connection closed');
        }
    }
}

// 전역 스코프에 노출하여 다른 스크립트에서 사용 가능하도록
window.IndexedDBManagerV3 = IndexedDBManagerV3;

// 개발자 도구에서 수동으로 데이터베이스 재생성할 수 있는 함수
window.recreateDatabase = async function() {
    if (window.wordAppV3 && window.wordAppV3.dbManager) {
        try {
            await window.wordAppV3.dbManager.deleteAndRecreateDatabase();
            console.log('Database recreated successfully from console');
            return true;
        } catch (error) {
            console.error('Error recreating database from console:', error);
            return false;
        }
    } else {
        console.error('Database manager not available');
        return false;
    }
};

// 개발자 도구에서 데이터베이스 삭제할 수 있는 함수
window.deleteJLPTDatabase = function() {
    console.log('Deleting JLPT database...');
    const deleteRequest = indexedDB.deleteDatabase('JLPTWordDB_V4');

    deleteRequest.onsuccess = () => {
        console.log('Database deleted successfully. Please refresh the page.');
        alert('데이터베이스가 삭제되었습니다. 페이지를 새로고침해주세요.');
    };

    deleteRequest.onerror = () => {
        console.error('Failed to delete database:', deleteRequest.error);
    };
};