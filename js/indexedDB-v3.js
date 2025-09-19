/**
 * IndexedDB Manager V3 - Unified JSON Structure
 *
 * 변경사항:
 * - 통합된 JSON 구조 지원 (JLPT 레벨별 파일만 사용)
 * - 품사/주제별 필터링 로직 추가
 * - 단일 파일에서 다중 카테고리 추출
 */

class IndexedDBManagerV3 {
    constructor() {
        this.dbName = 'JLPTWordDB_V3';
        this.dbVersion = 3;
        this.db = null;

        // 통합된 카테고리 시스템
        this.jlptLevels = ['n1', 'n2', 'n3', 'n4', 'n5'];
        this.partOfSpeechTypes = ['명사', '동사', 'い형용사', 'な형용사', '부사'];
        this.themeTypes = [
            '날씨', '색깔', '감정', '가족', '음식', '교육', '직업',
            '인간관계', '자연', '외모', '일상', '시간', '행동', '기분'
        ];
    }

    /**
     * IndexedDB 초기화
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('IndexedDB open error:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB V3 opened successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                this.db = event.target.result;
                console.log('IndexedDB V3 upgrade needed, creating unified object stores');
                this.createUnifiedObjectStores();
            };
        });
    }

    /**
     * 통합된 객체 스토어 생성
     */
    createUnifiedObjectStores() {
        // 1. Words Store (통합 구조)
        if (!this.db.objectStoreNames.contains('words')) {
            const wordsStore = this.db.createObjectStore('words', {
                keyPath: 'id',
                autoIncrement: true
            });

            // 기본 인덱스
            wordsStore.createIndex('jlptLevel', 'jlptLevel', { unique: false });
            wordsStore.createIndex('partOfSpeech', 'partOfSpeech', { unique: false });
            wordsStore.createIndex('hanja', 'hanja', { unique: false });
            wordsStore.createIndex('hiragana', 'hiragana', { unique: false });
            wordsStore.createIndex('difficulty', 'difficulty', { unique: false });
            wordsStore.createIndex('frequency', 'frequency', { unique: false });

            console.log('Created unified words object store');
        }

        // 2. ViewedWords Store (본 단어장)
        if (!this.db.objectStoreNames.contains('viewedWords')) {
            const viewedStore = this.db.createObjectStore('viewedWords', {
                keyPath: 'id',
                autoIncrement: true
            });

            viewedStore.createIndex('wordId', 'wordId', { unique: false });
            viewedStore.createIndex('userId', 'userId', { unique: false });
            viewedStore.createIndex('viewedAt', 'viewedAt', { unique: false });
            viewedStore.createIndex('userWord', ['userId', 'wordId'], { unique: true });

            console.log('Created viewedWords object store');
        }

        // 3. Categories Store (동적 카테고리 정보)
        if (!this.db.objectStoreNames.contains('categories')) {
            const categoriesStore = this.db.createObjectStore('categories', {
                keyPath: 'id',
                autoIncrement: true
            });

            categoriesStore.createIndex('type', 'type', { unique: false }); // jlpt, grammar, theme
            categoriesStore.createIndex('name', 'name', { unique: false });

            console.log('Created categories object store');
        }
    }

    /**
     * JLPT 레벨별 단어 저장 (통합 구조)
     *
     * @param {string} jlptLevel - JLPT 레벨 (n1, n2, n3, n4, n5)
     * @param {Array} wordsArray - 단어 배열
     */
    async saveJLPTWords(jlptLevel, wordsArray) {
        if (!this.db) throw new Error('Database not initialized');

        const transaction = this.db.transaction(['words'], 'readwrite');
        const store = transaction.objectStore('words');

        const promises = wordsArray.map(word => {
            const enhancedWord = {
                ...word,
                jlptLevel: jlptLevel.toUpperCase(), // N1, N2, N3, N4, N5
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            return this.promisifyRequest(store.put(enhancedWord));
        });

        await Promise.all(promises);
        console.log(`${wordsArray.length} words saved for JLPT ${jlptLevel.toUpperCase()}`);

        // 동적 카테고리 정보 업데이트
        await this.updateCategoryInfo();
    }

    /**
     * 동적 카테고리 정보 업데이트
     * (데이터베이스의 실제 데이터를 기반으로 카테고리 생성)
     */
    async updateCategoryInfo() {
        if (!this.db) throw new Error('Database not initialized');

        const transaction = this.db.transaction(['words', 'categories'], 'readwrite');
        const wordsStore = transaction.objectStore('words');
        const categoriesStore = transaction.objectStore('categories');

        // 기존 카테고리 정보 삭제
        await this.promisifyRequest(categoriesStore.clear());

        // 모든 단어 조회
        const allWords = await this.promisifyRequest(wordsStore.getAll());

        // 동적으로 카테고리 추출
        const categories = {
            jlpt: new Set(),
            partOfSpeech: new Set(),
            themes: new Set()
        };

        allWords.forEach(word => {
            if (word.jlptLevel) categories.jlpt.add(word.jlptLevel);
            if (word.partOfSpeech) categories.partOfSpeech.add(word.partOfSpeech);
            if (word.themes && Array.isArray(word.themes)) {
                word.themes.forEach(theme => categories.themes.add(theme));
            }
        });

        // 카테고리 정보 저장
        const categoryPromises = [];

        // JLPT 레벨
        categories.jlpt.forEach(level => {
            categoryPromises.push(
                this.promisifyRequest(categoriesStore.add({
                    type: 'jlpt',
                    name: level,
                    displayName: level,
                    count: allWords.filter(w => w.jlptLevel === level).length
                }))
            );
        });

        // 품사별
        categories.partOfSpeech.forEach(pos => {
            categoryPromises.push(
                this.promisifyRequest(categoriesStore.add({
                    type: 'partOfSpeech',
                    name: pos,
                    displayName: pos,
                    count: allWords.filter(w => w.partOfSpeech === pos).length
                }))
            );
        });

        // 주제별
        categories.themes.forEach(theme => {
            categoryPromises.push(
                this.promisifyRequest(categoriesStore.add({
                    type: 'theme',
                    name: theme,
                    displayName: theme,
                    count: allWords.filter(w => w.themes && w.themes.includes(theme)).length
                }))
            );
        });

        await Promise.all(categoryPromises);
        console.log('Category information updated');
    }

    /**
     * 카테고리별 단어 조회 (통합 버전)
     *
     * @param {string} filterType - 필터 타입 (jlptLevel, partOfSpeech, theme, all)
     * @param {string} filterValue - 필터 값
     * @returns {Array} 필터링된 단어 배열
     */
    async getWordsByFilter(filterType, filterValue) {
        if (!this.db) throw new Error('Database not initialized');

        console.log('getWordsByFilter called:', filterType, filterValue);

        const transaction = this.db.transaction(['words'], 'readonly');
        const store = transaction.objectStore('words');

        let words = [];

        try {
            switch (filterType) {
                case 'jlptLevel':
                    console.log('Filtering by JLPT level:', filterValue);
                    const jlptIndex = store.index('jlptLevel');
                    words = await this.promisifyRequest(jlptIndex.getAll(filterValue.toUpperCase()));
                    console.log('JLPT words found:', words.length);
                    break;

                case 'partOfSpeech':
                    console.log('Filtering by part of speech:', filterValue);
                    const posIndex = store.index('partOfSpeech');
                    words = await this.promisifyRequest(posIndex.getAll(filterValue));
                    console.log('PartOfSpeech words found:', words.length);
                    break;

                case 'theme':
                    console.log('Filtering by theme:', filterValue);
                    // 주제는 배열에 포함되어 있으므로 전체 조회 후 필터링
                    const allWordsForTheme = await this.promisifyRequest(store.getAll());
                    words = allWordsForTheme.filter(word =>
                        word.themes && word.themes.includes(filterValue)
                    );
                    console.log('Theme words found:', words.length);
                    break;

                case 'all':
                    console.log('Getting all words');
                    words = await this.promisifyRequest(store.getAll());
                    console.log('All words found:', words.length);
                    break;

                default:
                    throw new Error(`Unknown filter type: ${filterType}`);
            }

            console.log('Sample word from filter:', words[0]);
            return words;

        } catch (error) {
            console.error('Error in getWordsByFilter:', error);
            throw error;
        }
    }

    /**
     * 복합 필터링 (여러 조건 동시 적용)
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

        // 전체 단어 조회 후 메모리에서 필터링
        const allWords = await this.promisifyRequest(store.getAll());

        return allWords.filter(word => {
            let matches = true;

            if (filters.jlptLevel && word.jlptLevel !== filters.jlptLevel.toUpperCase()) {
                matches = false;
            }

            if (filters.partOfSpeech && word.partOfSpeech !== filters.partOfSpeech) {
                matches = false;
            }

            if (filters.theme && (!word.themes || !word.themes.includes(filters.theme))) {
                matches = false;
            }

            return matches;
        });
    }

    /**
     * 랜덤 단어 선택 (통합 버전)
     *
     * @param {Object} filters - 필터 조건
     * @param {number} count - 가져올 단어 수
     * @param {boolean} excludeViewed - 본 단어 제외 여부
     * @param {string} userId - 사용자 ID
     * @returns {Array} 랜덤 선택된 단어 배열
     */
    async getRandomWords(filters = {}, count = 1, excludeViewed = false, userId = 'default') {
        if (!this.db) throw new Error('Database not initialized');

        console.log('getRandomWords called with:', { filters, count, excludeViewed, userId });

        // 필터 조건에 맞는 단어 조회
        let availableWords = [];

        try {
            if (Object.keys(filters).length === 0) {
                // 필터가 없으면 전체 단어
                console.log('No filters, getting all words');
                availableWords = await this.getWordsByFilter('all');
            } else if (Object.keys(filters).length === 1) {
                // 단일 필터
                const [filterType, filterValue] = Object.entries(filters)[0];
                console.log('Single filter:', filterType, '=', filterValue);
                availableWords = await this.getWordsByFilter(filterType, filterValue);
            } else {
                // 복합 필터
                console.log('Multiple filters:', filters);
                availableWords = await this.getWordsByMultipleFilters(filters);
            }

            console.log('Available words found:', availableWords.length);
            console.log('Sample available word:', availableWords[0]);

        } catch (error) {
            console.error('Error getting words by filter:', error);
            throw error;
        }

        if (availableWords.length === 0) {
            throw new Error('No words found for the given filters');
        }

        // 본 단어 제외 로직
        if (excludeViewed) {
            console.log('Excluding viewed words...');
            const viewedWordIds = await this.getViewedWordIds(userId);
            console.log('Viewed word IDs:', viewedWordIds);

            const unviewedWords = availableWords.filter(word => !viewedWordIds.includes(word.id));
            console.log('Unviewed words:', unviewedWords.length);

            if (unviewedWords.length > 0) {
                availableWords = unviewedWords;
            } else {
                console.log('All words have been viewed, selecting from all available words');
            }
        }

        // 랜덤 선택
        const selectedWords = [];
        const usedIndices = new Set();
        const maxCount = count === null ? availableWords.length : Math.min(count, availableWords.length);

        console.log('Selecting', maxCount, 'words from', availableWords.length, 'available');

        for (let i = 0; i < maxCount; i++) {
            let randomIndex;
            do {
                randomIndex = Math.floor(Math.random() * availableWords.length);
            } while (usedIndices.has(randomIndex));

            usedIndices.add(randomIndex);
            selectedWords.push(availableWords[randomIndex]);
        }

        console.log('Selected words:', selectedWords);
        return selectedWords;
    }

    /**
     * 사용 가능한 카테고리 조회
     *
     * @returns {Object} 카테고리 정보
     */
    async getAvailableCategories() {
        if (!this.db) throw new Error('Database not initialized');

        const transaction = this.db.transaction(['categories'], 'readonly');
        const store = transaction.objectStore('categories');

        const allCategories = await this.promisifyRequest(store.getAll());

        const categorized = {
            jlpt: [],
            partOfSpeech: [],
            themes: []
        };

        allCategories.forEach(cat => {
            if (cat.type === 'jlpt') {
                categorized.jlpt.push(cat);
            } else if (cat.type === 'partOfSpeech') {
                categorized.partOfSpeech.push(cat);
            } else if (cat.type === 'theme') {
                categorized.themes.push(cat);
            }
        });

        // 정렬
        categorized.jlpt.sort((a, b) => a.name.localeCompare(b.name));
        categorized.partOfSpeech.sort((a, b) => a.name.localeCompare(b.name));
        categorized.themes.sort((a, b) => a.name.localeCompare(b.name));

        return categorized;
    }

    /**
     * 단어를 본 단어로 추가
     */
    async markWordAsViewed(wordId, userId = 'default') {
        if (!this.db) throw new Error('Database not initialized');

        const transaction = this.db.transaction(['viewedWords'], 'readwrite');
        const store = transaction.objectStore('viewedWords');
        const index = store.index('userWord');

        const existing = await this.promisifyRequest(index.get([userId, wordId]));

        if (!existing) {
            const viewedWord = {
                wordId,
                userId,
                viewedAt: new Date().toISOString(),
                viewCount: 1
            };
            await this.promisifyRequest(store.add(viewedWord));
        } else {
            const updated = {
                ...existing,
                viewCount: existing.viewCount + 1,
                lastViewedAt: new Date().toISOString()
            };
            await this.promisifyRequest(store.put(updated));
        }
    }

    /**
     * 본 단어 목록 조회
     */
    async getViewedWords(userId = 'default') {
        if (!this.db) throw new Error('Database not initialized');

        const transaction = this.db.transaction(['viewedWords', 'words'], 'readonly');
        const viewedStore = transaction.objectStore('viewedWords');
        const wordsStore = transaction.objectStore('words');
        const index = viewedStore.index('userId');

        const viewedRecords = await this.promisifyRequest(index.getAll(userId));

        const words = [];
        for (const record of viewedRecords) {
            const word = await this.promisifyRequest(wordsStore.get(record.wordId));
            if (word) {
                words.push({
                    ...word,
                    viewedAt: record.viewedAt,
                    viewCount: record.viewCount
                });
            }
        }

        return words.sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt));
    }

    /**
     * 본 단어 ID 목록 조회
     */
    async getViewedWordIds(userId = 'default') {
        if (!this.db) throw new Error('Database not initialized');

        const transaction = this.db.transaction(['viewedWords'], 'readonly');
        const store = transaction.objectStore('viewedWords');
        const index = store.index('userId');

        const records = await this.promisifyRequest(index.getAll(userId));
        return records.map(record => record.wordId);
    }

    /**
     * 통계 정보 조회
     */
    async getStatistics(userId = 'default') {
        const totalWords = await this.getTotalWordCount();
        const viewedWords = await this.getViewedWords(userId);
        const categories = await this.getAvailableCategories();

        return {
            totalWords,
            totalViewed: viewedWords.length,
            overallProgress: totalWords > 0 ? (viewedWords.length / totalWords * 100).toFixed(1) : 0,
            categories
        };
    }

    /**
     * 전체 단어 수 조회
     */
    async getTotalWordCount() {
        if (!this.db) throw new Error('Database not initialized');

        const transaction = this.db.transaction(['words'], 'readonly');
        const store = transaction.objectStore('words');
        const request = store.count();
        return this.promisifyRequest(request);
    }

    // === 유틸리티 메서드들 ===

    promisifyRequest(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 데이터베이스 완전 초기화 (모든 데이터 삭제)
     */
    /**
     * 특정 JLPT 레벨의 데이터만 삭제
     */
    async clearJLPTLevel(jlptLevel) {
        if (!this.db) throw new Error('Database not initialized');

        const transaction = this.db.transaction(['words'], 'readwrite');
        const store = transaction.objectStore('words');

        try {
            // jlptLevel로 필터링하여 삭제
            const request = store.openCursor();

            return new Promise((resolve, reject) => {
                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        const word = cursor.value;
                        if (word.jlptLevel === jlptLevel.toUpperCase()) {
                            cursor.delete();
                        }
                        cursor.continue();
                    } else {
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

    async clearAllData() {
        if (!this.db) throw new Error('Database not initialized');

        const transaction = this.db.transaction(['words', 'categories', 'viewedWords'], 'readwrite');

        try {
            await this.promisifyRequest(transaction.objectStore('words').clear());
            await this.promisifyRequest(transaction.objectStore('categories').clear());
            await this.promisifyRequest(transaction.objectStore('viewedWords').clear());

            console.log('All data cleared from IndexedDB');
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            throw error;
        }
    }

    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
            console.log('IndexedDB V3 connection closed');
        }
    }
}

// 전역 스코프에 노출
window.IndexedDBManagerV3 = IndexedDBManagerV3;