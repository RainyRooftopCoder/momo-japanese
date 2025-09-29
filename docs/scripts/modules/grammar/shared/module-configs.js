/**
 * Module Configs - 문법 학습 모듈별 설정
 * 각 문법 모듈의 설정을 중앙에서 관리
 */

export const MODULE_CONFIGS = {
    group1Verb: {
        dataPath: './data/vocabulary/jlpt/group1_verb_data.json',
        defaultForm: '현재형',
        screenId: 'group1VerbScreen',
        headerId: 'group1VerbHeader',
        displayId: 'verbDisplay',
        itemType: 'verb',
        itemTypeKorean: '동사',
        category: 'Group 1 동사',
        forms: ['현재형', '과거형', '현재 부정형', '과거 부정형', '정중형', '과거 정중형'],
        defaultData: {
            verb: '食べる',
            reading: 'たべる',
            meaning: '먹다',
            group: 1,
            jlpt_level: 'N5'
        }
    },

    group2Verb: {
        dataPath: './data/vocabulary/jlpt/group2_verb_data.json',
        defaultForm: '현재형',
        screenId: 'group2VerbScreen',
        headerId: 'group2VerbHeader',
        displayId: 'verbDisplay',
        itemType: 'verb',
        itemTypeKorean: '동사',
        category: 'Group 2 동사',
        forms: ['현재형', '과거형', '현재 부정형', '과거 부정형', '정중형', '과거 정중형'],
        defaultData: {
            verb: '見る',
            reading: 'みる',
            meaning: '보다',
            group: 2,
            jlpt_level: 'N5'
        }
    },

    group3Verb: {
        dataPath: './data/vocabulary/jlpt/group3_verb_data.json',
        defaultForm: '현재형',
        screenId: 'group3VerbScreen',
        headerId: 'group3VerbHeader',
        displayId: 'verbDisplay',
        itemType: 'verb',
        itemTypeKorean: '동사',
        category: 'Group 3 동사',
        forms: ['현재형', '과거형', '현재 부정형', '과거 부정형', '정중형', '과거 정중형'],
        defaultData: {
            verb: '来る',
            reading: 'くる',
            meaning: '오다',
            group: 3,
            jlpt_level: 'N5'
        }
    },

    iAdjective: {
        dataPath: './data/vocabulary/jlpt/i_adjective_data.json',
        defaultForm: '현재형',
        screenId: 'iAdjectiveScreen',
        headerId: 'iAdjectiveHeader',
        displayId: 'adjectiveDisplay',
        itemType: 'adjective',
        itemTypeKorean: 'い형용사',
        category: 'い형용사',
        forms: ['현재형', '과거형', '현재 부정형', '과거 부정형'],
        defaultData: {
            adjective: '美しい',
            reading: 'うつくしい',
            meaning: '아름다운',
            type: 'i',
            jlpt_level: 'N3'
        }
    },

    naAdjective: {
        dataPath: './data/vocabulary/jlpt/na_adjective_data.json',
        defaultForm: '현재형',
        screenId: 'naAdjectiveScreen',
        headerId: 'naAdjectiveHeader',
        displayId: 'adjectiveDisplay',
        itemType: 'adjective',
        itemTypeKorean: 'な형용사',
        category: 'な형용사',
        forms: ['현재형', '과거형', '현재 부정형', '과거 부정형'],
        defaultData: {
            adjective: '静か',
            reading: 'しずか',
            meaning: '조용한',
            type: 'na',
            jlpt_level: 'N4'
        }
    },

    nounForms: {
        dataPath: './data/vocabulary/jlpt/noun_data.json',
        defaultForm: '현재형',
        screenId: 'nounFormsScreen',
        headerId: 'nounFormsHeader',
        displayId: 'nounDisplay',
        itemType: 'noun',
        itemTypeKorean: '명사',
        category: '명사 활용',
        forms: ['현재형', '과거형', '현재 부정형', '과거 부정형'],
        defaultData: {
            noun: '学生',
            reading: 'がくせい',
            meaning: '학생',
            jlpt_level: 'N5'
        }
    },

    particleStudy: {
        dataPath: './data/vocabulary/jlpt/particle_data.json',
        defaultForm: '기본형',
        screenId: 'particleStudyScreen',
        headerId: 'particleStudyHeader',
        displayId: 'particleDisplay',
        itemType: 'particle',
        itemTypeKorean: '조사',
        category: '조사 학습',
        forms: ['기본형', '활용예시1', '활용예시2', '활용예시3'],
        defaultData: {
            particle: 'は',
            reading: 'wa',
            meaning: '~는/은 (주제 표시)',
            usage: '주제를 나타내는 조사',
            jlpt_level: 'N5'
        }
    },

    nounConjugation: {
        dataPath: './data/vocabulary/jlpt/noun_conjugation_data.json',
        defaultForm: '기본형',
        screenId: 'nounConjugationScreen',
        headerId: 'nounConjugationHeader',
        displayId: 'nounConjugationDisplay',
        itemType: 'nounConjugation',
        itemTypeKorean: '명사 활용',
        category: '명사 변화',
        forms: ['기본형', '복수형', '존댓말', '높임말'],
        defaultData: {
            noun: '先生',
            reading: 'せんせい',
            meaning: '선생님',
            jlpt_level: 'N5'
        }
    }
};

/**
 * 특정 모듈의 설정 가져오기
 * @param {string} moduleKey - 모듈 키
 * @returns {Object} - 모듈 설정
 */
export function getModuleConfig(moduleKey) {
    if (!MODULE_CONFIGS[moduleKey]) {
        throw new Error(`Module config not found for key: ${moduleKey}`);
    }
    return { ...MODULE_CONFIGS[moduleKey] };
}

/**
 * 모든 모듈 목록 가져오기
 * @returns {Array} - 모듈 키 배열
 */
export function getAllModuleKeys() {
    return Object.keys(MODULE_CONFIGS);
}

/**
 * 카테고리별 모듈 목록 가져오기
 * @param {string} category - 카테고리명
 * @returns {Array} - 해당 카테고리의 모듈 설정 배열
 */
export function getModulesByCategory(category) {
    return Object.entries(MODULE_CONFIGS)
        .filter(([key, config]) => config.category.includes(category))
        .map(([key, config]) => ({ key, ...config }));
}

/**
 * 아이템 타입별 모듈 목록 가져오기
 * @param {string} itemType - 아이템 타입 (verb, adjective, noun, particle)
 * @returns {Array} - 해당 타입의 모듈 설정 배열
 */
export function getModulesByItemType(itemType) {
    return Object.entries(MODULE_CONFIGS)
        .filter(([key, config]) => config.itemType === itemType)
        .map(([key, config]) => ({ key, ...config }));
}

/**
 * 모듈 설정 업데이트
 * @param {string} moduleKey - 모듈 키
 * @param {Object} updates - 업데이트할 설정 객체
 */
export function updateModuleConfig(moduleKey, updates) {
    if (!MODULE_CONFIGS[moduleKey]) {
        throw new Error(`Module config not found for key: ${moduleKey}`);
    }
    MODULE_CONFIGS[moduleKey] = { ...MODULE_CONFIGS[moduleKey], ...updates };
}

/**
 * 동적 모듈 등록
 * @param {string} moduleKey - 새 모듈 키
 * @param {Object} config - 모듈 설정
 */
export function registerModule(moduleKey, config) {
    if (MODULE_CONFIGS[moduleKey]) {
        console.warn(`Module ${moduleKey} already exists. Overwriting...`);
    }
    MODULE_CONFIGS[moduleKey] = config;
}