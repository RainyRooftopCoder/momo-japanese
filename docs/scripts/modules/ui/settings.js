/**
 * Settings Module
 * 설정 화면 관리
 */
class Settings {
    constructor() {
        this.settings = this.loadSettings();
        this.init();
    }

    // 기본 설정값
    getDefaultSettings() {
        return {
            chartDisplayMode: 'count', // count or time
            badgeNotifications: true,
            speechRate: 1.0,
            lastUpdateDate: new Date().toISOString().split('T')[0]
        };
    }

    // 설정 로드
    loadSettings() {
        const saved = localStorage.getItem('appSettings');
        const defaults = this.getDefaultSettings();

        if (!saved) {
            this.saveSettings(defaults);
            return defaults;
        }

        const settings = JSON.parse(saved);
        // 누락된 설정이 있으면 기본값으로 보완
        return { ...defaults, ...settings };
    }

    // 설정 저장
    saveSettings(settings) {
        localStorage.setItem('appSettings', JSON.stringify(settings));
        this.settings = settings;
    }

    // 초기화
    init() {
        this.bindEvents();
        this.loadCurrentSettings();
        // 전역 음성 속도 설정 초기화
        this.updateSpeechRate(this.settings.speechRate);
    }

    // 이벤트 바인딩
    bindEvents() {
        // 통계 표시 방식 변경
        const chartModeSelect = document.getElementById('chart-display-mode');
        if (chartModeSelect) {
            chartModeSelect.addEventListener('change', (e) => {
                this.updateSetting('chartDisplayMode', e.target.value);
                this.notifyChartUpdate();
            });
        }

        // 뱃지 알림 토글
        const badgeToggle = document.getElementById('badge-notifications');
        if (badgeToggle) {
            badgeToggle.addEventListener('change', (e) => {
                this.updateSetting('badgeNotifications', e.target.checked);
                this.showToast(e.target.checked ? '뱃지 알림이 켜졌습니다' : '뱃지 알림이 꺼졌습니다');
            });
        }

        // 발음 속도 슬라이더
        const speechRateSlider = document.getElementById('speech-rate');
        const speechRateValue = document.getElementById('speech-rate-value');
        if (speechRateSlider && speechRateValue) {
            speechRateSlider.addEventListener('input', (e) => {
                const rate = parseFloat(e.target.value);
                speechRateValue.textContent = rate.toFixed(1) + 'x';
                this.updateSetting('speechRate', rate);
                this.updateSpeechRate(rate);
            });
        }

        // 학습 데이터 리셋
        const resetLearningBtn = document.getElementById('reset-learning-data');
        if (resetLearningBtn) {
            resetLearningBtn.addEventListener('click', () => {
                this.resetLearningData();
            });
        }

        // 뱃지 데이터 초기화
        const resetBadgeBtn = document.getElementById('reset-badge-data');
        if (resetBadgeBtn) {
            resetBadgeBtn.addEventListener('click', () => {
                this.resetBadgeData();
            });
        }

        // 전체 데이터 초기화
        const resetAllBtn = document.getElementById('reset-all-data');
        if (resetAllBtn) {
            resetAllBtn.addEventListener('click', () => {
                this.resetAllData();
            });
        }

        // 데이터 정보 보기
        const showDataInfoBtn = document.getElementById('show-data-info');
        if (showDataInfoBtn) {
            showDataInfoBtn.addEventListener('click', () => {
                this.showDataInfo();
            });
        }
    }

    // 현재 설정값으로 UI 업데이트
    loadCurrentSettings() {
        // 차트 표시 방식
        const chartModeSelect = document.getElementById('chart-display-mode');
        if (chartModeSelect) {
            chartModeSelect.value = this.settings.chartDisplayMode;
        }

        // 뱃지 알림
        const badgeToggle = document.getElementById('badge-notifications');
        if (badgeToggle) {
            badgeToggle.checked = this.settings.badgeNotifications;
        }

        // 발음 속도
        const speechRateSlider = document.getElementById('speech-rate');
        const speechRateValue = document.getElementById('speech-rate-value');
        if (speechRateSlider && speechRateValue) {
            speechRateSlider.value = this.settings.speechRate;
            speechRateValue.textContent = this.settings.speechRate.toFixed(1) + 'x';
        }
    }

    // 설정 업데이트
    updateSetting(key, value) {
        this.settings[key] = value;
        this.saveSettings(this.settings);
    }

    // 차트 업데이트 알림
    notifyChartUpdate() {
        if (window.homeDashboard) {
            window.homeDashboard.renderWeeklyChart();
        }
        this.showToast('차트 표시 방식이 변경되었습니다');
    }

    // 음성 속도 업데이트
    updateSpeechRate(rate) {
        // SpeechSynthesis 설정 업데이트 (다른 모듈에서 사용)
        if (window.speechSynthesis) {
            // 전역 음성 속도 설정
            window.globalSpeechRate = rate;
        }
    }

    // 학습 데이터 리셋
    resetLearningData() {
        if (confirm('정말로 학습 데이터를 초기화하시겠습니까?\n주간 학습 현황이 모두 삭제됩니다.')) {
            localStorage.removeItem('learningActivity');

            // 홈 대시보드 업데이트
            if (window.homeDashboard) {
                window.homeDashboard.studyData = window.homeDashboard.getStudyData();
                window.homeDashboard.renderWeeklyChart();
            }

            this.showToast('학습 데이터가 초기화되었습니다');
        }
    }

    // 뱃지 데이터 초기화
    resetBadgeData() {
        if (confirm('정말로 뱃지 데이터를 초기화하시겠습니까?\n획득한 모든 뱃지가 삭제됩니다.')) {
            localStorage.removeItem('badges');

            // 홈 대시보드 업데이트
            if (window.homeDashboard) {
                window.homeDashboard.badges = window.homeDashboard.getBadges();
                window.homeDashboard.renderRecentBadges();
            }

            this.showToast('뱃지 데이터가 초기화되었습니다');
        }
    }

    // 전체 데이터 초기화
    resetAllData() {
        if (confirm('⚠️ 경고 ⚠️\n\n정말로 모든 데이터를 초기화하시겠습니까?\n\n삭제될 데이터:\n- 주간 학습 현황\n- 획득한 뱃지\n- 나의 단어장\n- 앱 설정\n\n이 작업은 되돌릴 수 없습니다!')) {
            // 모든 관련 데이터 삭제
            localStorage.removeItem('learningActivity');
            localStorage.removeItem('badges');
            localStorage.removeItem('vocabularyGroups');
            localStorage.removeItem('appSettings');

            // 설정도 기본값으로 리셋
            this.settings = this.getDefaultSettings();
            this.saveSettings(this.settings);
            this.loadCurrentSettings();

            // 홈 대시보드 업데이트
            if (window.homeDashboard) {
                window.homeDashboard.studyData = window.homeDashboard.getStudyData();
                window.homeDashboard.badges = window.homeDashboard.getBadges();
                window.homeDashboard.renderWeeklyChart();
                window.homeDashboard.renderRecentBadges();
            }

            this.showToast('모든 데이터가 초기화되었습니다');
        }
    }

    // 데이터 정보 표시
    showDataInfo() {
        const learningData = JSON.parse(localStorage.getItem('learningActivity') || '{"dailyActivities":{}}');
        const badges = JSON.parse(localStorage.getItem('badges') || '[]');
        const vocabularyGroups = JSON.parse(localStorage.getItem('vocabularyGroups') || '[]');

        // 통계 계산
        const totalDays = Object.keys(learningData.dailyActivities || {}).length;
        const totalActivities = Object.values(learningData.dailyActivities || {})
            .reduce((total, day) => total + (day.words || 0) + (day.practice || 0) + (day.vocabulary || 0), 0);
        const earnedBadges = badges.filter(b => b.earned).length;
        const totalWords = vocabularyGroups.reduce((total, group) => total + (group.words?.length || 0), 0);

        const info = `📊 학습 데이터 현황

📅 학습 일수: ${totalDays}일
🎯 총 학습 활동: ${totalActivities}회
🏆 획득 뱃지: ${earnedBadges}/${badges.length}개
📚 저장된 단어: ${totalWords}개
📂 단어장: ${vocabularyGroups.length}개

💾 데이터 크기:
- 학습 활동: ${this.getDataSize('learningActivity')}
- 뱃지: ${this.getDataSize('badges')}
- 단어장: ${this.getDataSize('vocabularyGroups')}
- 설정: ${this.getDataSize('appSettings')}`;

        alert(info);
    }

    // 데이터 크기 계산
    getDataSize(key) {
        const data = localStorage.getItem(key);
        if (!data) return '0 B';

        const bytes = new Blob([data]).size;
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
        return Math.round(bytes / 1048576) + ' MB';
    }

    // 토스트 메시지 표시
    showToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--glass-bg);
            backdrop-filter: var(--glass-backdrop);
            color: var(--text-primary);
            padding: 12px 24px;
            border-radius: 25px;
            border: 1px solid var(--glass-border);
            z-index: 10000;
            font-size: 0.9rem;
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
            animation: toastSlideUp 0.3s ease-out;
        `;

        toast.textContent = message;
        document.body.appendChild(toast);

        // 3초 후 제거
        setTimeout(() => {
            toast.style.animation = 'toastSlideDown 0.3s ease-in forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);

        // CSS 애니메이션 추가
        if (!document.getElementById('toast-animations')) {
            const style = document.createElement('style');
            style.id = 'toast-animations';
            style.textContent = `
                @keyframes toastSlideUp {
                    from { transform: translate(-50%, 100%); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
                @keyframes toastSlideDown {
                    from { transform: translate(-50%, 0); opacity: 1; }
                    to { transform: translate(-50%, 100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // 뱃지 알림 설정 가져오기
    getBadgeNotificationSetting() {
        return this.settings.badgeNotifications;
    }

    // 음성 속도 설정 가져오기
    getSpeechRateSetting() {
        return this.settings.speechRate;
    }

    // 차트 표시 모드 설정 가져오기
    getChartDisplayMode() {
        return this.settings.chartDisplayMode;
    }
}

// 전역 설정 인스턴스
window.appSettings = null;

// 초기화 함수
function initSettings() {
    if (!window.appSettings) {
        window.appSettings = new Settings();
    }
}

// 설정 화면 표시 시 초기화
document.addEventListener('DOMContentLoaded', () => {

    // 설정 화면이 활성화될 때까지 기다렸다가 초기화
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const settingsScreen = document.getElementById('settingsScreen');
                if (settingsScreen && settingsScreen.classList.contains('active')) {
                    initSettings();
                    observer.disconnect(); // 한 번만 실행
                }
            }
        });
    });

    const settingsScreen = document.getElementById('settingsScreen');
    if (settingsScreen) {
        observer.observe(settingsScreen, { attributes: true });
    } else {
    }
});

// 전역에서 직접 호출 가능하도록 함수 추가
window.forceInitSettings = function() {
    if (!window.appSettings) {
        window.appSettings = new Settings();
    } else {
    }
};

// 페이지 로드 시 음성 속도 설정 초기화 (설정 화면 활성화 전에도)
window.initGlobalSpeechRate = function() {
    try {
        const settings = JSON.parse(localStorage.getItem('appSettings') || '{"speechRate": 1.0}');
        window.globalSpeechRate = settings.speechRate || 1.0;
    } catch (error) {
        console.warn('Failed to load speech rate from settings:', error);
        window.globalSpeechRate = 1.0;
    }
};

// 페이지 로드 시 즉시 실행
window.initGlobalSpeechRate();