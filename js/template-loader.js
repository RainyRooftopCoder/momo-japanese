/**
 * Template Loader - HTML 템플릿 파일들을 동적으로 로드하는 유틸리티
 */
class TemplateLoader {
    constructor() {
        this.cache = new Map();
        this.basePath = './templates/';
    }

    /**
     * 템플릿 파일을 로드하고 캐싱
     * @param {string} templateName - 템플릿 파일명 (확장자 제외)
     * @returns {Promise<string>} 템플릿 HTML 내용
     */
    async loadTemplate(templateName) {
        // 캐시에서 확인
        if (this.cache.has(templateName)) {
            return this.cache.get(templateName);
        }

        try {
            const response = await fetch(`${this.basePath}${templateName}.html`);

            if (!response.ok) {
                throw new Error(`Template ${templateName} not found: ${response.status}`);
            }

            const templateHTML = await response.text();

            // 캐싱
            this.cache.set(templateName, templateHTML);

            console.log(`Template loaded: ${templateName}`);
            return templateHTML;

        } catch (error) {
            console.error(`Failed to load template ${templateName}:`, error);
            return `<div class="error">Template ${templateName} 로드 실패</div>`;
        }
    }

    /**
     * 여러 템플릿을 한 번에 로드
     * @param {string[]} templateNames - 템플릿 파일명 배열
     * @returns {Promise<Object>} 템플릿명: HTML 내용 객체
     */
    async loadMultipleTemplates(templateNames) {
        const promises = templateNames.map(name =>
            this.loadTemplate(name).then(html => ({ [name]: html }))
        );

        const results = await Promise.all(promises);
        return Object.assign({}, ...results);
    }

    /**
     * 특정 컨테이너에 템플릿 렌더링
     * @param {string} containerId - 대상 컨테이너 ID
     * @param {string} templateName - 템플릿 파일명
     * @param {Object} data - 템플릿에 전달할 데이터 (선택사항)
     */
    async renderTemplate(containerId, templateName, data = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        try {
            let templateHTML = await this.loadTemplate(templateName);

            // 간단한 템플릿 변수 치환 ({{variable}} 형식)
            if (Object.keys(data).length > 0) {
                templateHTML = this.replaceTemplateVariables(templateHTML, data);
            }

            container.innerHTML = templateHTML;
            console.log(`Template ${templateName} rendered to ${containerId}`);

        } catch (error) {
            console.error(`Failed to render template ${templateName}:`, error);
            container.innerHTML = `<div class="error">템플릿 렌더링 실패</div>`;
        }
    }

    /**
     * 템플릿 변수 치환
     * @param {string} template - 템플릿 HTML
     * @param {Object} data - 치환할 데이터
     * @returns {string} 치환된 HTML
     */
    replaceTemplateVariables(template, data) {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return data[key] !== undefined ? data[key] : match;
        });
    }

    /**
     * 캐시 클리어
     */
    clearCache() {
        this.cache.clear();
        console.log('Template cache cleared');
    }

    /**
     * 특정 템플릿 캐시 삭제
     * @param {string} templateName - 템플릿 파일명
     */
    removeFromCache(templateName) {
        this.cache.delete(templateName);
        console.log(`Template ${templateName} removed from cache`);
    }
}

// 전역 인스턴스 생성
window.templateLoader = new TemplateLoader();

// 유틸리티 함수들
window.loadTemplate = (templateName) => window.templateLoader.loadTemplate(templateName);
window.renderTemplate = (containerId, templateName, data) =>
    window.templateLoader.renderTemplate(containerId, templateName, data);