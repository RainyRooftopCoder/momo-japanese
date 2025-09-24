/**
 * Home Dashboard Module
 * 홈 화면의 대시보드 기능을 관리합니다.
 */

class HomeDashboard {
    constructor() {
        this.studyData = this.getStudyData();
        this.badges = this.getBadges();
        this.init();
    }

    init() {
        this.renderWeeklyChart();
        this.setupQuickActions();
        this.renderRecentBadges();
        this.startLiveUpdates();
    }

    // 학습 데이터 가져오기 (로컬스토리지 기반)
    getStudyData() {
        const today = new Date().toISOString().split('T')[0];
        const demoData = {
            weekly: [8, 12, 5, 15, 10, 7, 15], // 최근 7일 (월-일)
        };

        const saved = localStorage.getItem('studyData');
        if (!saved) {
            // 첫 방문시 데모 데이터로 시작
            localStorage.setItem('studyData', JSON.stringify(demoData));
            return demoData;
        }

        return JSON.parse(saved);
    }

    // 뱃지 데이터 가져오기
    getBadges() {
        const demoBadges = [
            { id: 'first_word', name: '첫 단어', icon: '🎯', earned: true, date: '2024-01-15T09:30:00Z' },
            { id: 'streak_3', name: '3일 연속', icon: '🔥', earned: true, date: '2024-01-17T14:20:00Z' },
            { id: 'streak_7', name: '7일 연속', icon: '⭐', earned: true, date: '2024-01-21T16:45:00Z' },
            { id: 'words_50', name: '단어 50개', icon: '📚', earned: false, date: null },
            { id: 'words_100', name: '단어 100개', icon: '💎', earned: false, date: null },
            { id: 'practice_10', name: '연습 10회', icon: '💪', earned: false, date: null },
        ];

        const saved = localStorage.getItem('badges');
        if (!saved) {
            localStorage.setItem('badges', JSON.stringify(demoBadges));
            return demoBadges;
        }

        return JSON.parse(saved);
    }


    // 주간 학습 그래프 렌더링
    renderWeeklyChart() {
        const chartContainer = document.getElementById('weekly-chart');
        if (!chartContainer) return;

        const weekDays = ['월', '화', '수', '목', '금', '토', '일'];
        const maxValue = Math.max(...this.studyData.weekly, 1);

        chartContainer.innerHTML = `
            <div style="display: flex; align-items: end; justify-content: space-between; width: 100%; height: 100%; padding: 1rem;">
                ${this.studyData.weekly
                    .map((value, index) => {
                        const height = (value / maxValue) * 80; // 최대 80% 높이
                        return `
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
                            <div class="chart-bar"
                                 style="height: ${height}%; width: 30px;
                                        background: linear-gradient(180deg, var(--accent-tertiary), var(--accent-secondary));
                                        border-radius: 4px 4px 0 0;
                                        transition: all 0.3s ease;
                                        cursor: pointer;"
                                 title="${weekDays[index]}: ${value}개 학습"
                                 onmouseover="this.style.transform='scaleY(1.1)'"
                                 onmouseout="this.style.transform='scaleY(1)'">
                            </div>
                            <span style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 500;">
                                ${weekDays[index]}
                            </span>
                        </div>
                    `;
                    })
                    .join('')}
            </div>
        `;
    }

    // 빠른 시작 버튼 설정
    setupQuickActions() {
        // 빠른 시작 버튼 이벤트는 네비게이션 클래스에서 처리합니다
        // 여기서는 아무것도 하지 않습니다
        console.log('Quick actions setup - handled by navigation');
    }

    // 빠른 시작 액션 처리 (네비게이션 클래스에서 호출)
    handleQuickAction(action) {
        switch (action) {
            case 'quiz':
                // 퀴즈 모드로 이동
                this.showQuizOptions();
                break;
            case 'my-vocabulary':
                // 나의 단어장으로 이동
                this.showMyVocabulary();
                break;
        }
    }

    // 퀴즈 옵션 표시
    showQuizOptions() {
        // 간단한 알림으로 구현
        alert('퀴즈 기능은 곧 추가될 예정입니다! 🎯');
    }

    // 복습 모드 시작
    startReviewMode() {
        // 간단한 알림으로 구현
        alert('복습 기능은 곧 추가될 예정입니다! 🔄');
    }

    // 나의 단어장 표시 (다중 단어장 시스템)
    showMyVocabulary() {
        console.log('showMyVocabulary called - opening vocabulary list');
        console.log('MyVocabularyUI available:', !!window.MyVocabularyUI);

        if (window.MyVocabularyUI) {
            console.log('Creating MyVocabularyUI instance...');
            const vocabUI = new window.MyVocabularyUI();
            console.log('Calling showMyVocabulary (vocabulary list screen)...');
            vocabUI.showMyVocabulary(); // 이제 단어장 목록 화면을 보여줌
        } else {
            console.error('MyVocabularyUI not found');
            alert('나의 단어장 기능을 로드할 수 없습니다.');
        }
    }

    // 최근 획득 뱃지 렌더링
    renderRecentBadges() {
        const badgesContainer = document.getElementById('recent-badges');
        if (!badgesContainer) return;

        const recentBadges = this.badges
            .filter((badge) => badge.earned)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 3);

        if (recentBadges.length === 0) {
            badgesContainer.innerHTML = '<div class="no-badges">아직 획득한 뱃지가 없습니다</div>';
            return;
        }

        badgesContainer.innerHTML = recentBadges
            .map(
                (badge) => `
            <div class="badge-item" title="${badge.name} - ${new Date(badge.date).toLocaleDateString()}">
                <div class="badge-icon">${badge.icon}</div>
                <div class="badge-name">${badge.name}</div>
            </div>
        `
            )
            .join('');
    }

    // 학습 진행 시 데이터 업데이트
    updateStudyProgress(type, amount = 1) {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();

        // 오늘 데이터 업데이트
        if (type === 'words') {
            this.studyData.today.words += amount;
        } else if (type === 'practice') {
            this.studyData.today.practice += amount;
        }

        // 주간 데이터 업데이트 (오늘은 배열의 마지막 요소)
        const dayIndex = 6; // 일요일 = 0, 토요일 = 6
        this.studyData.weekly[dayIndex] += amount;

        // 연속 학습 일수 계산 (간단한 버전)
        this.updateStreak();

        // 뱃지 체크
        this.checkBadges();

        // 로컬스토리지 저장
        localStorage.setItem('studyData', JSON.stringify(this.studyData));

        // UI 업데이트
        this.updateTodayStats();
        this.renderWeeklyChart();
        this.renderRecentBadges();
    }

    // 연속 학습 일수 업데이트
    updateStreak() {
        // 간단한 구현: 오늘 학습한 단어가 있으면 연속 일수 유지/증가
        if (this.studyData.today.words > 0) {
            this.studyData.today.streak = Math.max(this.studyData.today.streak, 1);
        }
    }

    // 뱃지 획득 체크
    checkBadges() {
        const totalWords = this.studyData.today.words;
        const totalPractice = this.studyData.today.practice;
        const streak = this.studyData.today.streak;

        const badgeChecks = [
            { id: 'first_word', condition: totalWords >= 1 },
            { id: 'streak_3', condition: streak >= 3 },
            { id: 'streak_7', condition: streak >= 7 },
            { id: 'words_50', condition: totalWords >= 50 },
            { id: 'words_100', condition: totalWords >= 100 },
            { id: 'practice_10', condition: totalPractice >= 10 },
        ];

        badgeChecks.forEach((check) => {
            const badge = this.badges.find((b) => b.id === check.id);
            if (badge && !badge.earned && check.condition) {
                badge.earned = true;
                badge.date = new Date().toISOString();
                this.showBadgeNotification(badge);
            }
        });

        localStorage.setItem('badges', JSON.stringify(this.badges));
    }

    // 뱃지 획득 알림
    showBadgeNotification(badge) {
        // 간단한 알림 구현
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--glass-bg);
            backdrop-filter: var(--glass-backdrop);
            border: 1px solid var(--glass-border);
            border-radius: var(--radius-lg);
            padding: 1rem;
            box-shadow: var(--glass-shadow);
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;

        notification.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">${badge.icon}</div>
                <div style="font-weight: 600; color: var(--text-primary);">뱃지 획득!</div>
                <div style="font-size: 0.9rem; color: var(--text-secondary);">${badge.name}</div>
            </div>
        `;

        document.body.appendChild(notification);

        // 3초 후 제거
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // 실시간 업데이트 시작
    startLiveUpdates() {
        // 1분마다 데이터 새로고침
        setInterval(() => {
            this.studyData = this.getStudyData();
            this.badges = this.getBadges();
            this.updateTodayStats();
            this.renderRecentBadges();
        }, 60000);
    }

    // 테스트용 메서드들
    simulateStudy() {
        this.updateStudyProgress('words', Math.floor(Math.random() * 5) + 1);
        this.updateStudyProgress('practice', 1);
    }

    resetData() {
        localStorage.removeItem('studyData');
        localStorage.removeItem('badges');
        this.studyData = this.getStudyData();
        this.badges = this.getBadges();
        this.updateTodayStats();
        this.renderWeeklyChart();
        this.renderRecentBadges();
    }
}

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// 전역 객체로 등록
window.HomeDashboard = HomeDashboard;

// 홈 화면이 표시될 때 초기화
function initHomeDashboard() {
    if (document.querySelector('.home-container') && !window.homeDashboard) {
        console.log('Initializing home dashboard...');
        window.homeDashboard = new HomeDashboard();

        // 개발자 도구에서 테스트할 수 있도록 전역 함수 제공
        window.testStudy = () => window.homeDashboard.simulateStudy();
        window.resetDashboard = () => window.homeDashboard.resetData();
    }
}

// 템플릿 로드 완료 후 초기화
window.addEventListener('templatesLoaded', () => {
    setTimeout(initHomeDashboard, 100);
});

// DOM 로드 후에도 시도 (fallback)
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initHomeDashboard, 500);
});
