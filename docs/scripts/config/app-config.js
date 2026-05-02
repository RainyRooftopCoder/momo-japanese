/**
 * 앱 설정 및 버전 관리
 * 앱 버전과 데이터 버전을 분리하여 관리
 */

const APP_CONFIG = {
    // 앱 버전 (UI, 기능 변경 시 증가)
    APP_VERSION: '1.0.0',

    // 데이터 버전 (JLPT 단어 데이터 변경 시 증가)
    DATA_VERSION: '1.0.0',

    // 데이터 로드 전략
    // 'always': 항상 재로드 (개발용)
    // 'onupdate': 버전 변경 시만 재로드 (배포용 권장)
    // 'once': 처음 설치 시만 로드 (성능 최적화)
    DATA_LOAD_STRATEGY: 'onupdate',

    // LocalStorage 키
    STORAGE_KEYS: {
        APP_VERSION: 'momo_app_version',
        DATA_VERSION: 'momo_data_version',
        DATA_LOADED: 'momo_data_loaded',
        LAST_UPDATE: 'momo_last_update',
    },

    // 데이터 파일 경로
    DATA_FILES: {
        n1: './data/vocabulary/jlpt/jlpt_n1_words_unified.json',
        n2: './data/vocabulary/jlpt/jlpt_n2_words_unified.json',
        n3: './data/vocabulary/jlpt/jlpt_n3_words_unified.json',
        n4: './data/vocabulary/jlpt/jlpt_n4_words_unified.json',
        n5: './data/vocabulary/jlpt/jlpt_n5_words_unified.json',
    },

    // JLPT 레벨들 (로드 순서)
    JLPT_LEVELS: ['n5', 'n4', 'n3', 'n2', 'n1'],

    /**
     * 저장된 데이터 버전 확인
     * @returns {string|null} 저장된 데이터 버전, 없으면 null
     */
    getSavedDataVersion() {
        return localStorage.getItem(this.STORAGE_KEYS.DATA_VERSION);
    },

    /**
     * 저장된 앱 버전 확인
     * @returns {string|null} 저장된 앱 버전, 없으면 null
     */
    getSavedAppVersion() {
        return localStorage.getItem(this.STORAGE_KEYS.APP_VERSION);
    },

    /**
     * 데이터 로드 여부 확인
     * @returns {boolean} 데이터 로드 완료 여부
     */
    isDataLoaded() {
        return localStorage.getItem(this.STORAGE_KEYS.DATA_LOADED) === 'true';
    },

    /**
     * 데이터 로드 필요 여부 판단
     * @returns {boolean} 데이터 로드 필요 여부
     */
    shouldLoadData() {
        switch (this.DATA_LOAD_STRATEGY) {
            case 'always':
                // 항상 재로드 (개발용)
                return true;

            case 'onupdate':
                // 버전이 다르면 재로드
                const savedVersion = this.getSavedDataVersion();
                return savedVersion !== this.DATA_VERSION;

            case 'once':
                // 처음만 로드
                return !this.isDataLoaded();

            default:
                return false;
        }
    },

    /**
     * 데이터 로드 완료 표시
     */
    markDataAsLoaded() {
        localStorage.setItem(this.STORAGE_KEYS.DATA_VERSION, this.DATA_VERSION);
        localStorage.setItem(this.STORAGE_KEYS.DATA_LOADED, 'true');
        localStorage.setItem(this.STORAGE_KEYS.LAST_UPDATE, new Date().toISOString());
        console.log(`✅ Data version ${this.DATA_VERSION} marked as loaded`);
    },

    /**
     * 앱 버전 업데이트 체크
     * @returns {boolean} 앱이 업데이트되었는지 여부
     */
    isAppUpdated() {
        const savedVersion = this.getSavedAppVersion();
        if (savedVersion !== this.APP_VERSION) {
            localStorage.setItem(this.STORAGE_KEYS.APP_VERSION, this.APP_VERSION);
            return true;
        }
        return false;
    },

    /**
     * 버전 정보 출력 (디버깅용)
     */
    logVersionInfo() {
        console.log('📦 App Configuration:');
        console.log(`  App Version: ${this.APP_VERSION}`);
        console.log(`  Data Version: ${this.DATA_VERSION}`);
        console.log(`  Load Strategy: ${this.DATA_LOAD_STRATEGY}`);
        console.log(`  Saved App Version: ${this.getSavedAppVersion() || 'none'}`);
        console.log(`  Saved Data Version: ${this.getSavedDataVersion() || 'none'}`);
        console.log(`  Data Loaded: ${this.isDataLoaded()}`);
        console.log(`  Should Load Data: ${this.shouldLoadData()}`);
    },
};

// 전역으로 노출
window.APP_CONFIG = APP_CONFIG;
