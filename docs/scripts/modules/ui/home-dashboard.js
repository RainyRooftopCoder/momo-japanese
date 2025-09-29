/**
 * Home Dashboard Module
 * 홈 화면의 대시보드 기능을 관리합니다.
 */

class HomeDashboard {
    constructor() {
        this.studyData = null;
        this.badges = this.getBadges();
        this.init();
    }

    async init() {
        // 학습 데이터 비동기 로드
        this.studyData = await this.getStudyData();

        this.renderWeeklyChart();
        this.setupQuickActions();

        // 뱃지 확인 및 렌더링 (새로운 데이터 구조 사용)
        this.checkBadges();
        this.renderRecentBadges();

        this.startLiveUpdates();
    }

    // 학습 데이터 가져오기 (IndexedDB 기반)
    async getStudyData() {
        try {
            // Database manager가 준비될 때까지 기다리기
            if (!window.dbManager) {
                console.log('Waiting for database manager...');
                await this.waitForDatabaseManager();
            }

            const weeklyStats = await window.dbManager.getWeeklyLearningStats();
            return {
                weekly: weeklyStats.weekly.map(day => day.activities), // 개수 데이터
                weeklyTime: weeklyStats.weekly.map(day => day.timeMinutes), // 시간 데이터
                today: weeklyStats.today
            };

        } catch (error) {
            console.error('Error getting study data:', error);
            return this.getEmptyWeeklyData();
        }
    }

    // Database manager가 준비될 때까지 기다리는 함수
    async waitForDatabaseManager(maxWait = 5000) {
        const startTime = Date.now();

        while (!window.dbManager && (Date.now() - startTime) < maxWait) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (!window.dbManager) {
            throw new Error('Database manager not available after waiting');
        }
    }

    // 빈 주간 데이터 생성
    getEmptyWeeklyData() {
        return {
            weekly: new Array(7).fill(0),
            weeklyTime: new Array(7).fill(0),
            today: { activities: 0, timeMinutes: 0 }
        };
    }

    // 학습 활동 기록 (시간 기반)
    async recordLearningActivity(type, timeSpent = 0, count = 1) {
        try {
            // Database manager가 준비될 때까지 기다리기
            if (!window.dbManager) {
                console.log('Waiting for database manager for recording...');
                await this.waitForDatabaseManager();
            }

            // IndexedDB에 실제 시간과 함께 기록
            await window.dbManager.recordLearningActivity(type, timeSpent, count);

            // 실시간으로 차트 업데이트
            this.studyData = await this.getStudyData();
            this.renderWeeklyChart();

            // 뱃지 확인 및 부여 (새로운 데이터 구조 사용)
            this.checkBadges();

            console.log(`Learning activity recorded: ${type}, time: ${Math.round(timeSpent/1000/60)}분, count: ${count}`);

        } catch (error) {
            console.error('Error recording learning activity:', error);
        }
    }

    // 뱃지 데이터 가져오기
    getBadges() {
        const defaultBadges = [
            {
                id: 'first_word',
                name: '첫 단어',
                description: '첫 번째 단어 저장',
                icon: '🎯',
                earned: false,
                date: null,
            },
            {
                id: 'first_practice',
                name: '첫 연습',
                description: '첫 번째 연습 완료',
                icon: '🌱',
                earned: false,
                date: null,
            },
            {
                id: 'vocabulary_5',
                name: '단어 수집가',
                description: '단어 5개 저장',
                icon: '📝',
                earned: false,
                date: null,
            },
            {
                id: 'vocabulary_10',
                name: '단어 탐험가',
                description: '단어 10개 저장',
                icon: '🔍',
                earned: false,
                date: null,
            },
            {
                id: 'vocabulary_20',
                name: '단어 마니아',
                description: '단어 20개 저장',
                icon: '📚',
                earned: false,
                date: null,
            },
            {
                id: 'vocabulary_50',
                name: '단어 박사',
                description: '단어 50개 저장',
                icon: '💎',
                earned: false,
                date: null,
            },
            { id: 'practice_5', name: '연습생', description: '연습 5회 완료', icon: '💪', earned: false, date: null },
            {
                id: 'practice_20',
                name: '연습 마스터',
                description: '연습 20회 완료',
                icon: '🏆',
                earned: false,
                date: null,
            },
            {
                id: 'daily_active',
                name: '일일 활동',
                description: '하루에 5개 이상 활동',
                icon: '☀️',
                earned: false,
                date: null,
            },
            { id: 'streak_3', name: '연속 3일', description: '3일 연속 학습', icon: '🔥', earned: false, date: null },
            {
                id: 'streak_7',
                name: '연속 7일',
                description: '일주일 연속 학습',
                icon: '⭐',
                earned: false,
                date: null,
            },
        ];

        const saved = localStorage.getItem('badges');
        if (!saved) {
            localStorage.setItem('badges', JSON.stringify(defaultBadges));
            return defaultBadges;
        }

        return JSON.parse(saved);
    }

    // 뱃지 획득 조건 확인 및 새 뱃지 부여
    checkAndAwardBadges() {
        const badges = this.getBadges();
        const learningData = JSON.parse(localStorage.getItem('learningActivity') || '{"dailyActivities":{}}');
        const today = new Date().toISOString().split('T')[0];

        // 총 활동 계산
        const totalVocabulary = this.getTotalActivities(learningData, 'vocabulary');
        const totalPractice = this.getTotalActivities(learningData, 'practice');
        const todayTotal = this.getTodayTotal(learningData, today);
        const streak = this.getCurrentStreak(learningData);

        let newBadges = [];

        // 뱃지 조건 확인
        const badgeConditions = [
            { id: 'first_word', condition: totalVocabulary >= 1 },
            { id: 'first_practice', condition: totalPractice >= 1 },
            { id: 'vocabulary_5', condition: totalVocabulary >= 5 },
            { id: 'vocabulary_20', condition: totalVocabulary >= 20 },
            { id: 'vocabulary_50', condition: totalVocabulary >= 50 },
            { id: 'practice_5', condition: totalPractice >= 5 },
            { id: 'practice_20', condition: totalPractice >= 20 },
            { id: 'daily_active', condition: todayTotal >= 5 },
            { id: 'streak_3', condition: streak >= 3 },
            { id: 'streak_7', condition: streak >= 7 },
        ];

        badgeConditions.forEach(({ id, condition }) => {
            const badge = badges.find((b) => b.id === id);
            if (badge && !badge.earned && condition) {
                badge.earned = true;
                badge.date = new Date().toISOString();
                newBadges.push(badge);
            }
        });

        // 새 뱃지가 있으면 저장하고 알림
        if (newBadges.length > 0) {
            localStorage.setItem('badges', JSON.stringify(badges));
            this.showBadgeNotification(newBadges);
            this.renderRecentBadges(); // 뱃지 영역 업데이트
        }

        return badges;
    }

    // 총 활동 수 계산
    getTotalActivities(data, type) {
        return Object.values(data.dailyActivities || {}).reduce((total, day) => total + (day[type] || 0), 0);
    }

    // 오늘 총 활동 수 계산
    getTodayTotal(data, today) {
        const todayData = data.dailyActivities[today];
        if (!todayData) return 0;
        return (todayData.words || 0) + (todayData.practice || 0) + (todayData.vocabulary || 0);
    }

    // 현재 연속 학습일 계산
    getCurrentStreak(data) {
        const today = new Date();
        let streak = 0;

        for (let i = 0; i < 30; i++) {
            // 최대 30일 검사
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - i);
            const dateStr = checkDate.toISOString().split('T')[0];

            const dayData = data.dailyActivities[dateStr];
            const dayTotal = dayData ? (dayData.words || 0) + (dayData.practice || 0) + (dayData.vocabulary || 0) : 0;

            if (dayTotal > 0) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    }

    // 뱃지 획득 알림 표시
    showBadgeNotification(newBadges) {
        // 설정에서 뱃지 알림이 활성화되어 있는지 확인
        const settings = JSON.parse(localStorage.getItem('appSettings') || '{"badgeNotifications": true}');
        if (!settings.badgeNotifications) {
            return; // 알림이 비활성화되어 있으면 표시하지 않음
        }

        newBadges.forEach((badge) => {
            // 간단한 알림 (나중에 더 예쁘게 만들 수 있음)
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 1.2rem 1.8rem;
                border-radius: 16px;
                box-shadow: 0 12px 35px rgba(102, 126, 234, 0.5), 0 8px 25px rgba(0,0,0,0.3);
                z-index: 10000;
                animation: badgeSlideIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
                font-size: 0.9rem;
                max-width: 350px;
                backdrop-filter: blur(10px);
                border: 2px solid rgba(255, 255, 255, 0.3);
            `;

            // 뱃지 데이터 검증
            const badgeIcon = badge.icon || '🏆';
            const badgeName = badge.name || '뱃지';
            const badgeDescription = badge.description || '설명 없음';

            notification.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.8rem;">
                    <div style="
                        font-size: 2.2rem;
                        background: rgba(255, 255, 255, 0.25);
                        border-radius: 50%;
                        width: 55px;
                        height: 55px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: inset 0 2px 10px rgba(255, 255, 255, 0.2);
                    ">${badgeIcon}</div>
                    <div style="flex: 1;">
                        <div style="
                            font-weight: bold;
                            font-size: 1.1rem;
                            margin-bottom: 6px;
                            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                        ">🎉 새 뱃지 획득!</div>
                        <div style="
                            opacity: 0.95;
                            font-size: 0.9rem;
                            line-height: 1.4;
                            text-shadow: 0 1px 2px rgba(0,0,0,0.2);
                        ">
                            <strong style="font-size: 1rem;">${badgeName}</strong><br>
                            <span style="opacity: 0.8;">${badgeDescription}</span>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(notification);

            // 4초 후 제거
            setTimeout(() => {
                notification.style.animation = 'badgeSlideOut 0.5s ease-in forwards';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 500);
            }, 4000);
        });

        // CSS 애니메이션 추가
        if (!document.getElementById('badge-animations')) {
            const style = document.createElement('style');
            style.id = 'badge-animations';
            style.textContent = `
                @keyframes badgeSlideIn {
                    0% {
                        transform: translateX(120%) scale(0.8);
                        opacity: 0;
                    }
                    60% {
                        transform: translateX(-10%) scale(1.05);
                        opacity: 0.9;
                    }
                    100% {
                        transform: translateX(0) scale(1);
                        opacity: 1;
                    }
                }
                @keyframes badgeSlideOut {
                    from {
                        transform: translateX(0) scale(1);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(120%) scale(0.8);
                        opacity: 0;
                    }
                }
                @keyframes badgeBounce {
                    0%, 20%, 50%, 80%, 100% {
                        transform: scale(1);
                    }
                    40% {
                        transform: scale(1.2);
                    }
                    60% {
                        transform: scale(1.1);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // 주간 학습 그래프 렌더링
    renderWeeklyChart() {
        const chartContainer = document.getElementById('weekly-chart');
        if (!chartContainer) return;

        // studyData가 준비되지 않은 경우 빈 차트 표시
        if (!this.studyData || !this.studyData.weekly) {
            chartContainer.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-tertiary);">데이터 로딩 중...</div>';
            return;
        }

        // 설정에서 표시 모드 가져오기
        const settings = JSON.parse(localStorage.getItem('appSettings') || '{"chartDisplayMode":"count"}');
        const isTimeMode = settings.chartDisplayMode === 'time';

        const weekDays = ['월', '화', '수', '목', '금', '토', '일'];

        // 시간 모드일 때는 실제 시간 데이터 사용, 없으면 빈 배열로 초기화
        const displayValues = isTimeMode
            ? (this.studyData.weeklyTime || new Array(7).fill(0)) // 실제 시간 데이터 사용
            : (this.studyData.weekly || new Array(7).fill(0));

        // 배열인지 확인하고 안전하게 maxValue 계산
        const safeDisplayValues = Array.isArray(displayValues) ? displayValues : new Array(7).fill(0);
        const maxValue = Math.max(...safeDisplayValues, 1);

        // 시간 포맷팅 함수
        const formatTime = (minutes) => {
            if (minutes < 60) return `${minutes}분`;
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
        };

        chartContainer.innerHTML = `
            <div style="display: flex; flex-direction: column; width: 100%; height: 100%;">
                <div style="display: flex; align-items: end; justify-content: space-between; width: 100%; height: 120px; padding: 1rem; margin-bottom: 0.5rem;">
                    ${safeDisplayValues
                        .map((value, index) => {
                            const originalCount = (this.studyData.weekly && this.studyData.weekly[index]) || 0;
                            const height = Math.max((value / maxValue) * 100, 5); // 최소 5px 높이
                            const isToday = index === 6; // 마지막이 오늘
                            const displayText = isTimeMode
                                ? (value > 0 ? formatTime(value) : '0분')
                                : value.toString();

                            return `
                            <div style="display: flex; flex-direction: column; align-items: center; gap: 0.3rem; height: 100%;">
                                <span style="font-size: 0.65rem; color: var(--text-tertiary); margin-bottom: auto; text-align: center; line-height: 1.2;">
                                    ${displayText}
                                </span>
                                <div class="chart-bar"
                                     style="height: ${height}px; width: 28px; min-height: 5px;
                                            background: ${
                                                isToday
                                                    ? 'linear-gradient(180deg, #fab1a0, #e17055)'
                                                    : originalCount > 0
                                                    ? 'linear-gradient(180deg, #74b9ff, #0984e3)'
                                                    : 'linear-gradient(180deg, #ddd, #bbb)'
                                            };
                                            border-radius: 4px 4px 0 0;
                                            transition: all 0.3s ease;
                                            cursor: pointer;
                                            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);"
                                     title="${weekDays[index]}: ${isTimeMode ? formatTime(value) : `${originalCount}개 활동`} ${isToday ? '(오늘)' : ''}"
                                     onmouseover="this.style.transform='scaleY(1.1)'; this.style.boxShadow='0 4px 12px rgba(0, 0, 0, 0.2)'"
                                     onmouseout="this.style.transform='scaleY(1)'; this.style.boxShadow='0 2px 8px rgba(0, 0, 0, 0.1)'">
                                </div>
                                <span style="font-size: 0.75rem; color: var(--text-secondary); font-weight: ${
                                    isToday ? '600' : '500'
                                }; margin-top: 0.2rem;">
                                    ${weekDays[index]}
                                </span>
                            </div>
                        `;
                        })
                        .join('')}
                </div>
                <div style="text-align: center; font-size: 0.8rem; color: var(--text-secondary);">
                    ${isTimeMode
                        ? `총 ${formatTime(displayValues.reduce((a, b) => a + b, 0))} 학습 시간`
                        : `총 ${this.studyData.weekly.reduce((a, b) => a + b, 0)}개 학습 활동`
                    }
                </div>
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
            case 'review':
                // 연습 모드로 이동
                this.startReviewMode();
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
        console.log('Starting review mode - navigating to practice screen');
        if (window.navigation) {
            window.navigation.showScreen('practice');
            // 연습 화면 초기화
            if (window.initPracticeScreen) {
                setTimeout(() => window.initPracticeScreen(), 100);
            }
        } else {
            console.error('Navigation not available');
            alert('연습 기능을 로드할 수 없습니다.');
        }
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

        // 최신 뱃지 데이터 가져오기
        const badges = this.getBadges();
        const earnedBadges = badges.filter((badge) => badge.earned);
        const recentBadges = earnedBadges.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 2); // 최대 2개만 표시

        if (recentBadges.length === 0) {
            badgesContainer.innerHTML = `
                <div class="no-badges">
                    <div style="opacity: 0.6; text-align: center;">
                        <div style="font-size: 2rem; margin-bottom: 0.5rem;">🏆</div>
                        <div>학습을 시작하면 뱃지를 획득할 수 있어요!</div>
                    </div>
                </div>
            `;
            return;
        }

        badgesContainer.innerHTML = `
            <div style="display: flex; gap: 1.2rem; justify-content: center; align-items: center;">
                ${recentBadges
                    .map(
                        (badge) => `
                        <div class="badge-item" title="${badge.description} (${new Date(
                            badge.date
                        ).toLocaleDateString()})" style="
                            text-align: center;
                            padding: 0.8rem;
                            background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 215, 0, 0.05));
                            border: 2px solid rgba(255, 215, 0, 0.3);
                            border-radius: 12px;
                            position: relative;
                            transition: transform 0.2s ease;
                        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                            <div class="badge-icon" style="
                                font-size: 2rem;
                                margin-bottom: 0.4rem;
                                filter: drop-shadow(0 2px 4px rgba(255, 215, 0, 0.3));
                            ">${badge.icon}</div>
                            <div class="badge-name" style="
                                font-size: 0.8rem;
                                text-align: center;
                                font-weight: 600;
                                color: var(--text-primary);
                            ">${badge.name}</div>
                            <div style="
                                position: absolute;
                                top: -8px;
                                right: -8px;
                                background: #FFD700;
                                border-radius: 50%;
                                width: 16px;
                                height: 16px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 0.7rem;
                                color: #333;
                                font-weight: bold;
                                box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                            ">✓</div>
                        </div>
                    `
                    )
                    .join('')}
            </div>
        `;
    }

    // 오늘의 학습 통계 업데이트
    updateTodayStats() {
        // 홈 화면에 오늘의 통계를 표시하는 요소가 있다면 여기서 업데이트
        // 현재는 콘솔에 로그만 출력
        console.log('Today stats updated:', this.studyData.today);

        // 향후 오늘의 통계를 표시하는 UI 요소가 추가되면 여기서 업데이트
        const todayStatsElement = document.getElementById('today-stats');
        if (todayStatsElement) {
            todayStatsElement.innerHTML = `
                <div>오늘 학습한 단어: ${this.studyData.today.words}개</div>
                <div>오늘 연습 횟수: ${this.studyData.today.practice}회</div>
                <div>연속 학습 일수: ${this.studyData.today.streak}일</div>
            `;
        }
    }

    // 학습 진행 시 데이터 업데이트
    updateStudyProgress(type, amount = 1) {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();

        // studyData가 없거나 today가 없으면 초기화
        if (!this.studyData || !this.studyData.today) {
            console.warn('StudyData not initialized, skipping update');
            return;
        }

        // 오늘 데이터 업데이트 - 새로운 데이터 구조에 맞게 수정
        if (type === 'words' || type === 'vocabulary_save') {
            // breakdown 구조 확인 후 업데이트
            if (!this.studyData.today.breakdown) {
                this.studyData.today.breakdown = {
                    word_study: { count: 0, timeMinutes: 0 },
                    practice_complete: { count: 0, timeMinutes: 0 },
                    vocabulary_save: { count: 0, timeMinutes: 0 }
                };
            }
            this.studyData.today.breakdown.vocabulary_save.count += amount;
            this.studyData.today.activities += amount;
        } else if (type === 'practice' || type === 'practice_complete') {
            if (!this.studyData.today.breakdown) {
                this.studyData.today.breakdown = {
                    word_study: { count: 0, timeMinutes: 0 },
                    practice_complete: { count: 0, timeMinutes: 0 },
                    vocabulary_save: { count: 0, timeMinutes: 0 }
                };
            }
            this.studyData.today.breakdown.practice_complete.count += amount;
            this.studyData.today.activities += amount;
        }

        // 주간 데이터 업데이트 (오늘은 배열의 마지막 요소)
        const dayIndex = 6; // 일요일 = 0, 토요일 = 6
        if (this.studyData.weekly && this.studyData.weekly[dayIndex] !== undefined) {
            this.studyData.weekly[dayIndex] += amount;
        }

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
        // 간단한 구현: 오늘 학습 활동이 있으면 연속 일수 유지/증가
        if (this.studyData.today.activities > 0) {
            // streak 속성이 없으면 초기화
            if (!this.studyData.today.streak) {
                this.studyData.today.streak = 1;
            } else {
                this.studyData.today.streak = Math.max(this.studyData.today.streak, 1);
            }
        }
    }

    // 뱃지 획득 체크
    checkBadges() {
        if (!this.studyData || !this.studyData.today) {
            return;
        }

        const totalWords = this.studyData.today.breakdown?.vocabulary_save?.count || 0;
        const totalPractice = this.studyData.today.breakdown?.practice_complete?.count || 0;
        const totalActivities = this.studyData.today.activities || 0;
        const streak = this.studyData.today.streak || 0;

        const badgeChecks = [
            { id: 'first_word', condition: totalWords >= 1 },
            { id: 'vocabulary_5', condition: totalWords >= 5 },
            { id: 'vocabulary_10', condition: totalWords >= 10 },
            { id: 'vocabulary_20', condition: totalWords >= 20 },
            { id: 'vocabulary_50', condition: totalWords >= 50 },
            { id: 'first_practice', condition: totalPractice >= 1 },
            { id: 'practice_5', condition: totalPractice >= 5 },
            { id: 'practice_10', condition: totalPractice >= 10 },
            { id: 'streak_3', condition: streak >= 3 },
            { id: 'streak_7', condition: streak >= 7 },
            { id: 'active_learner', condition: totalActivities >= 20 },
        ];

        badgeChecks.forEach(async (check) => {
            const badge = this.badges.find((b) => b.id === check.id);
            if (badge && !badge.earned && check.condition) {
                badge.earned = true;
                badge.date = new Date().toISOString();

                // IndexedDB에 뱃지 저장
                try {
                    if (window.dbManager) {
                        await window.dbManager.saveBadge(
                            check.id,
                            badge.name,
                            badge.description,
                            badge.icon
                        );
                        console.log(`Badge awarded: ${badge.name}`);
                    }
                } catch (error) {
                    console.error('Error saving badge to database:', error);
                }

                this.showBadgeNotification(badge);
            }
        });

        localStorage.setItem('badges', JSON.stringify(this.badges));
    }

    // 뱃지 획득 알림
    showBadgeNotification(badge) {
        // 설정에서 뱃지 알림이 활성화되어 있는지 확인
        const settings = JSON.parse(localStorage.getItem('appSettings') || '{"badgeNotifications": true}');
        if (!settings.badgeNotifications) {
            return; // 알림이 비활성화되어 있으면 표시하지 않음
        }

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

        // 뱃지 데이터 검증
        const badgeIcon = badge.icon || '🏆';
        const badgeName = badge.name || '뱃지';

        notification.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">${badgeIcon}</div>
                <div style="font-weight: 600; color: var(--text-primary);">🎉 뱃지 획득!</div>
                <div style="font-size: 0.9rem; color: var(--text-secondary);">${badgeName}</div>
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

// 홈 화면이 표시될 때 초기화 (Database manager 준비 후)
async function initHomeDashboard() {
    if (document.querySelector('.home-container') && !window.homeDashboard) {
        console.log('Initializing home dashboard...');

        // Database manager가 준비될 때까지 기다리기
        let attempts = 0;
        while (!window.dbManager && attempts < 50) { // 5초 대기
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (window.dbManager) {
            window.homeDashboard = new HomeDashboard();

        } else {
            console.error('Database manager not ready, retrying in 1 second...');
            setTimeout(initHomeDashboard, 1000);
        }
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
