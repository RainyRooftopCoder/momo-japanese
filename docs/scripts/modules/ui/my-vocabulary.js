/**
 * 나의 단어장 UI 모듈 - 다중 단어장 관리
 * 단어장 목록 → 개별 단어장 2단계 구조
 */

class MyVocabularyUI {
    constructor() {
        this.dbManager = null;
        this.speechSynthesis = null;
        this.vocabularyGroups = [];
        this.currentGroupId = null;
        this.currentScreen = 'list'; // 'list' or 'detail'
        this.editingGroupId = null; // 수정 중인 그룹 ID

        this.initializeReferences();
    }

    /**
     * DOM 참조 초기화
     */
    initializeReferences() {
        // 전역 객체 참조
        if (window.wordAppV3 && window.wordAppV3.dbManager) {
            this.dbManager = window.wordAppV3.dbManager;
        } else if (window.dbManager) {
            this.dbManager = window.dbManager;
        }

        // 음성 합성 모듈 초기화
        if (window.speechManager) {
            this.speechSynthesis = window.speechManager;
            console.log('Using speechManager');
        } else if (window.SpeechSynthesisManager) {
            this.speechSynthesis = new window.SpeechSynthesisManager();
            console.log('Created new SpeechSynthesisManager');
        } else if (window.speechSynthesis) {
            this.speechSynthesis = window.speechSynthesis;
            console.log('Using browser speechSynthesis');
        }
    }

    /**
     * 나의 단어장 진입점 - 단어장 목록 화면 표시
     */
    async showMyVocabulary() {
        try {
            console.log('Showing vocabulary list screen...');

            // 참조 재초기화 (음성 모듈 포함)
            this.initializeReferences();

            // 단어장 그룹 로드
            await this.loadVocabularyGroups();

            // 단어장 목록 화면 표시
            this.showVocabularyListScreen();
        } catch (error) {
            console.error('Error showing my vocabulary:', error);
            alert('나의 단어장을 표시하는 중 오류가 발생했습니다.');
        }
    }

    /**
     * 단어장 목록 화면 표시
     */
    showVocabularyListScreen() {
        this.currentScreen = 'list';

        // 기존 화면 내용을 단어장 목록으로 변경
        const screen = document.getElementById('myVocabularyScreen');
        if (!screen) {
            console.error('MyVocabularyScreen not found');
            return;
        }

        screen.innerHTML = `
            <!-- 헤더 영역 -->
            <div class="vocab-list-header">
                <h2 class="screen-title">📖 나의 단어장</h2>
            </div>

            <!-- 단어장 목록 컨테이너 -->
            <div class="vocabulary-groups-container" id="vocabularyGroupsContainer">
                <!-- 단어장이 없을 때 -->
                <div class="empty-groups-state" id="emptyGroupsState" style="display: none;">
                    <div class="empty-icon">📚</div>
                    <h3>생성된 단어장이 없습니다</h3>
                    <p>새 단어장을 만들어서 단어를 정리해보세요!</p>
                </div>

                <!-- 단어장 목록 -->
                <div class="vocabulary-groups-list" id="vocabularyGroupsList">
                    <!-- 동적으로 생성됨 -->
                </div>

                <!-- 플로팅 새 단어장 생성 버튼 -->
                <button class="floating-create-btn" id="createVocabBtn" title="새 단어장">
                    <img src="./assets/icons/opperator_plus_white_icon_negative.png" alt="새 단어장" class="floating-btn-icon" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    <span class="floating-btn-fallback" style="display: none; font-size: 24px; font-weight: bold; color: white;">+</span>
                </button>
            </div>
        `;

        // 화면 표시
        if (window.navigation) {
            window.navigation.showScreen('myVocabulary');
        }

        // 이벤트 바인딩
        this.bindVocabularyListEvents();

        // 목록 렌더링
        this.renderVocabularyGroups();
    }

    /**
     * 개별 단어장 화면 표시
     */
    showVocabularyDetailScreen(groupId) {
        this.currentScreen = 'detail';
        this.currentGroupId = groupId;

        const group = this.vocabularyGroups.find((g) => g.id === groupId);
        if (!group) {
            console.error('Group not found:', groupId);
            return;
        }

        const screen = document.getElementById('myVocabularyScreen');
        if (!screen) {
            console.error('MyVocabularyScreen not found');
            return;
        }

        screen.innerHTML = `
            <!-- 헤더 영역 -->
            <div class="my-vocab-header">
                <div class="vocab-title-section">
                    <h2 class="screen-title" id="currentVocabTitle">${group.name}</h2>
                </div>
                <div class="vocab-stats">
                    <span class="total-words">총 <span id="totalVocabWords">${group.words.length}</span>개</span>
                </div>
            </div>

            <!-- 단어 목록 컨테이너 -->
            <div class="vocabulary-container" id="vocabularyContainer">
                <!-- 단어가 없을 때 -->
                <div class="empty-state" id="emptyState" style="${
                    group.words.length === 0 ? 'display: block;' : 'display: none;'
                }">
                    <div class="empty-icon">📚</div>
                    <h3>저장된 단어가 없습니다</h3>
                    <p>단어장에서 마음에 드는 단어를 저장해보세요!</p>
                </div>

                <!-- 단어 목록 -->
                <div class="vocabulary-list" id="vocabularyList" style="${
                    group.words.length === 0 ? 'display: none;' : 'display: flex;'
                }">
                    <!-- 동적으로 생성됨 -->
                </div>
            </div>
        `;

        // 이벤트 바인딩
        this.bindVocabularyDetailEvents();

        // 단어 목록 렌더링
        this.renderWordList(group.words);
    }

    /**
     * 단어장 목록 화면 이벤트 바인딩
     */
    bindVocabularyListEvents() {
        // 새 단어장 생성 버튼
        const createBtn = document.getElementById('createVocabBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                this.showVocabModal();
            });
        }

        // 스와이프 뒤로가기
        this.bindSwipeEvents();
    }

    /**
     * 개별 단어장 화면 이벤트 바인딩
     */
    bindVocabularyDetailEvents() {
        // 뒤로가기 버튼
        const backBtn = document.getElementById('vocabBackBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.showVocabularyListScreen();
            });
        }

        // 단어장 수정 버튼
        const editBtn = document.getElementById('editVocabBtn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.editVocabularyGroup(this.currentGroupId);
            });
        }

        // 단어장 삭제 버튼
        const deleteBtn = document.getElementById('deleteVocabBtn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.deleteVocabularyGroup(this.currentGroupId);
            });
        }

        // 스와이프 뒤로가기
        this.bindSwipeEvents();
    }

    /**
     * 스와이프 뒤로가기 이벤트 바인딩
     */
    bindSwipeEvents() {
        const screen = document.getElementById('myVocabularyScreen');
        if (!screen) return;

        let startX = null;
        let startY = null;

        screen.addEventListener(
            'touchstart',
            (e) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            },
            { passive: true }
        );

        screen.addEventListener(
            'touchend',
            (e) => {
                if (!startX || !startY) return;

                const endX = e.changedTouches[0].clientX;
                const endY = e.changedTouches[0].clientY;

                const deltaX = endX - startX;
                const deltaY = endY - startY;

                // 오른쪽으로 스와이프 (뒤로가기)
                if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 50) {
                    if (this.currentScreen === 'detail') {
                        this.showVocabularyListScreen();
                    } else if (this.currentScreen === 'list') {
                        if (window.navigation) {
                            window.navigation.showScreen('home');
                        }
                    }
                }

                startX = null;
                startY = null;
            },
            { passive: true }
        );
    }

    /**
     * 단어장 그룹 로드
     */
    async loadVocabularyGroups() {
        try {
            const saved = localStorage.getItem('vocabularyGroups');
            if (saved) {
                this.vocabularyGroups = JSON.parse(saved);
            } else {
                // 기존 단일 단어장 데이터 마이그레이션
                await this.migrateOldVocabularyData();
            }
            console.log('Loaded vocabulary groups:', this.vocabularyGroups.length);
        } catch (error) {
            console.error('Error loading vocabulary groups:', error);
            this.vocabularyGroups = [];
        }
    }

    /**
     * 기존 단일 단어장 데이터 마이그레이션
     */
    async migrateOldVocabularyData() {
        this.initializeReferences();

        if (!this.dbManager) {
            this.vocabularyGroups = [];
            return;
        }

        try {
            const oldWords = await this.dbManager.getMyVocabulary();
            if (oldWords && oldWords.length > 0) {
                // 기본 단어장에 기존 단어들 추가
                const defaultGroup = {
                    id: this.generateId(),
                    name: '내 단어장',
                    words: oldWords,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                this.vocabularyGroups = [defaultGroup];
                this.saveVocabularyGroups();
                console.log('Migrated old vocabulary data to default group');
            } else {
                this.vocabularyGroups = [];
            }
        } catch (error) {
            console.error('Error migrating old vocabulary data:', error);
            this.vocabularyGroups = [];
        }
    }

    /**
     * 단어장 그룹 저장
     */
    saveVocabularyGroups() {
        try {
            localStorage.setItem('vocabularyGroups', JSON.stringify(this.vocabularyGroups));
        } catch (error) {
            console.error('Error saving vocabulary groups:', error);
        }
    }

    /**
     * 단어장 목록 렌더링
     */
    renderVocabularyGroups() {
        const container = document.getElementById('vocabularyGroupsContainer');
        const emptyState = document.getElementById('emptyGroupsState');
        const groupsList = document.getElementById('vocabularyGroupsList');

        if (!container || !emptyState || !groupsList) {
            console.error('Required DOM elements not found');
            return;
        }

        if (this.vocabularyGroups.length === 0) {
            emptyState.style.display = 'block';
            groupsList.style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';
        groupsList.style.display = 'flex';

        // 단어장 그룹 카드 생성
        groupsList.innerHTML = '';
        this.vocabularyGroups.forEach((group) => {
            const groupCard = this.createGroupCard(group);
            groupsList.appendChild(groupCard);
        });
    }

    /**
     * 단어장 그룹 카드 생성
     */
    createGroupCard(group) {
        const cardElement = document.createElement('div');
        cardElement.className = 'vocab-group-card';
        cardElement.innerHTML = `
            <div class="vocab-group-header">
                <div class="vocab-group-info">
                    <div class="vocab-title-row">
                        <h3 class="vocab-group-name">${group.name}</h3>
                        <button class="group-edit-btn" data-group-id="${group.id}" title="수정">✏️</button>
                    </div>
                    <div class="vocab-group-meta">
                        <span class="word-count">${group.words.length}개 단어</span>
                        <span class="created-date">${this.formatDate(group.createdAt)}</span>
                    </div>
                </div>
                <div class="vocab-group-actions">
                    <button class="group-delete-btn" data-group-id="${group.id}" title="삭제">
                        <img src="./assets/icons/trash_white_icon_negative.png" alt="삭제" class="delete-icon" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                        <span class="delete-fallback" style="display: none; font-size: 18px;">🗑️</span>
                    </button>
                </div>
            </div>
        `;

        // 클릭 이벤트 - 단어장 열기 (버튼 클릭은 제외)
        cardElement.addEventListener('click', (e) => {
            if (!e.target.closest('.vocab-group-actions') && !e.target.closest('.group-edit-btn')) {
                this.showVocabularyDetailScreen(group.id);
            }
        });

        // 수정 버튼
        const editBtn = cardElement.querySelector('.group-edit-btn');
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.editVocabularyGroup(group.id);
        });

        // 삭제 버튼
        const deleteBtn = cardElement.querySelector('.group-delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteVocabularyGroup(group.id);
        });

        return cardElement;
    }

    /**
     * 단어 목록 렌더링
     */
    renderWordList(words) {
        const vocabularyListElement = document.getElementById('vocabularyList');
        if (!vocabularyListElement) return;

        vocabularyListElement.innerHTML = '';
        words.forEach((word) => {
            const wordCard = this.createWordCard(word);
            vocabularyListElement.appendChild(wordCard);
        });
    }

    /**
     * 단어 카드 생성
     */
    createWordCard(word) {
        const cardElement = document.createElement('div');
        cardElement.className = 'vocab-word-card';
        cardElement.innerHTML = `
            <!-- 메인 정보 (한 행) -->
            <div class="vocab-word-main-row">
                <div class="vocab-hanja">${word.hanja || '한자 없음'}</div>
                <div class="vocab-right-info">
                    <div class="vocab-pronunciation">
                        <span class="vocab-hiragana">${word.hiragana || word.pronunciation || ''}</span>
                        <button class="vocab-speech-btn" data-pronunciation="${
                            word.hiragana || word.pronunciation || ''
                        }" title="발음 듣기">🔊</button>
                    </div>
                    <div class="vocab-meaning">${word.meaning || word.korean || ''}</div>
                </div>
            </div>

            <!-- 하단 정보 및 액션 -->
            <div class="vocab-word-footer">
                <div class="vocab-meta-left">
                    <div class="vocab-jlpt-level">${word.jlptLevel ? word.jlptLevel.toUpperCase() : 'N/A'}</div>
                    <div class="vocab-theme-badge">${word.themes || word.theme || word.category || '일반'}</div>
                </div>
                <div class="vocab-actions-right">
                    <button class="vocab-remove-btn" data-word-id="${word.id}" title="단어장에서 제거">🗑️</button>
                </div>
            </div>

            <!-- 예문 토글 버튼 -->
            <div class="vocab-examples-toggle">
                <button class="examples-toggle-btn" data-word-id="${word.id}">
                    <span class="toggle-text">예문 보기</span>
                    <span class="toggle-icon">▼</span>
                </button>
            </div>

            <!-- 예문 영역 (접혀있음) -->
            <div class="vocab-examples" id="examples-${word.id}" style="display: none;">
                <div class="example-item">
                    <div class="example-jp">
                        <span>${word.example1 || word.jpExample1 || '明日は友達と映画を見る約束があります。'}</span>
                        <button class="example-speech-btn" data-text="${word.example1 || word.jpExample1 || '明日は友達と映画を見る約束があります。'}" title="예문 음성">🔊</button>
                    </div>
                    <div class="example-ko">${word.koExample1 || '내일은 친구와 영화를 보기로 약속이 있어요.'}</div>
                </div>
                <div class="example-item">
                    <div class="example-jp">
                        <span>${word.example2 || word.jpExample2 || '約束の時間に遅れないようにしてください。'}</span>
                        <button class="example-speech-btn" data-text="${word.example2 || word.jpExample2 || '約束の時間に遅れないようにしてください。'}" title="예문 음성">🔊</button>
                    </div>
                    <div class="example-ko">${word.koExample2 || '약속 시간에 늦지 않도록 해주세요.'}</div>
                </div>
            </div>
        `;

        // 이벤트 리스너 추가
        this.addCardEventListeners(cardElement, word);

        return cardElement;
    }

    /**
     * 카드 이벤트 리스너 추가
     */
    addCardEventListeners(cardElement, word) {
        // 발음 버튼
        const speechBtn = cardElement.querySelector('.vocab-speech-btn');
        if (speechBtn) {
            speechBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.playPronunciation(word.hiragana || word.pronunciation || '');
            });
        }

        // 삭제 버튼
        const removeBtn = cardElement.querySelector('.vocab-remove-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeWordFromGroup(this.currentGroupId, word.id);
            });
        }


        // 예문 토글 버튼
        const toggleBtn = cardElement.querySelector('.examples-toggle-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleExamples(word.id);
            });
        }

        // 예문 발음 버튼들
        const exampleSpeechBtns = cardElement.querySelectorAll('.example-speech-btn');
        exampleSpeechBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const text = btn.getAttribute('data-text');
                this.playPronunciation(text);
            });
        });
    }

    /**
     * 예문 토글
     */
    toggleExamples(wordId) {
        const examplesDiv = document.getElementById(`examples-${wordId}`);
        const toggleBtn = document.querySelector(`[data-word-id="${wordId}"].examples-toggle-btn`);

        if (!examplesDiv || !toggleBtn) return;

        const toggleIcon = toggleBtn.querySelector('.toggle-icon');
        const toggleText = toggleBtn.querySelector('.toggle-text');

        if (examplesDiv.style.display === 'none') {
            // 펼치기
            examplesDiv.style.display = 'block';
            if (toggleIcon) toggleIcon.textContent = '▲';
            if (toggleText) toggleText.textContent = '예문 접기';
        } else {
            // 접기
            examplesDiv.style.display = 'none';
            if (toggleIcon) toggleIcon.textContent = '▼';
            if (toggleText) toggleText.textContent = '예문 보기';
        }
    }

    /**
     * 단어장 생성/수정 모달 표시
     */
    showVocabModal(groupId = null) {
        this.editingGroupId = groupId;

        // 모달 HTML 생성
        const modalHtml = `
            <div class="modal vocab-modal show" id="vocabModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="vocabModalTitle">${groupId ? '단어장 이름 수정' : '새 단어장 만들기'}</h3>
                        <button class="modal-close-btn" id="vocabModalCloseBtn">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="input-group">
                            <label for="vocabNameInput">단어장 이름</label>
                            <input type="text" id="vocabNameInput" placeholder="단어장 이름을 입력하세요" maxlength="50" value="${
                                groupId ? this.vocabularyGroups.find((g) => g.id === groupId)?.name || '' : ''
                            }">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="vocabModalCancelBtn">취소</button>
                        <button class="btn btn-primary" id="vocabModalSaveBtn">${groupId ? '수정' : '생성'}</button>
                    </div>
                </div>
            </div>
        `;

        // 모달을 body에 추가
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // 이벤트 바인딩
        this.bindModalEvents();

        // 입력 필드 포커스
        setTimeout(() => {
            const input = document.getElementById('vocabNameInput');
            if (input) {
                input.focus();
                if (groupId) input.select();
            }
        }, 100);
    }

    /**
     * 모달 이벤트 바인딩
     */
    bindModalEvents() {
        const modal = document.getElementById('vocabModal');
        const closeBtn = document.getElementById('vocabModalCloseBtn');
        const cancelBtn = document.getElementById('vocabModalCancelBtn');
        const saveBtn = document.getElementById('vocabModalSaveBtn');
        const input = document.getElementById('vocabNameInput');

        // 모달 닫기
        const closeModal = () => {
            if (modal) {
                modal.remove();
            }
        };

        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', closeModal);
        }

        // 모달 외부 클릭시 닫기
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal();
                }
            });
        }

        // 저장 버튼
        if (saveBtn && input) {
            const handleSave = () => {
                const name = input.value.trim();
                if (!name) {
                    alert('단어장 이름을 입력해주세요.');
                    input.focus();
                    return;
                }

                if (this.editingGroupId) {
                    this.updateVocabularyGroup(this.editingGroupId, name);
                } else {
                    this.createVocabularyGroup(name);
                }

                closeModal();
            };

            saveBtn.addEventListener('click', handleSave);

            // Enter 키로 저장
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleSave();
                }
            });
        }
    }

    /**
     * 새 단어장 그룹 생성
     */
    createVocabularyGroup(name) {
        const newGroup = {
            id: this.generateId(),
            name: name,
            words: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        this.vocabularyGroups.push(newGroup);
        this.saveVocabularyGroups();
        this.renderVocabularyGroups();

        console.log('Created new vocabulary group:', name);
    }

    /**
     * 단어장 그룹 수정
     */
    updateVocabularyGroup(groupId, newName) {
        const group = this.vocabularyGroups.find((g) => g.id === groupId);
        if (group) {
            group.name = newName;
            group.updatedAt = new Date().toISOString();
            this.saveVocabularyGroups();

            if (this.currentScreen === 'list') {
                this.renderVocabularyGroups();
            } else if (this.currentScreen === 'detail' && this.currentGroupId === groupId) {
                // 현재 화면의 제목 업데이트
                const titleElement = document.getElementById('currentVocabTitle');
                if (titleElement) {
                    titleElement.textContent = newName;
                }
            }

            console.log('Updated vocabulary group:', newName);
        }
    }

    /**
     * 단어장 그룹 수정 (모달 호출)
     */
    editVocabularyGroup(groupId) {
        this.showVocabModal(groupId);
    }

    /**
     * 단어장 그룹 삭제
     */
    deleteVocabularyGroup(groupId) {
        const group = this.vocabularyGroups.find((g) => g.id === groupId);
        if (!group) return;

        const confirmed = confirm(
            `"${group.name}" 단어장을 삭제하시겠습니까?\n\n삭제하면 단어장 안의 모든 단어(${group.words.length}개)도 함께 삭제됩니다.`
        );
        if (!confirmed) return;

        this.vocabularyGroups = this.vocabularyGroups.filter((g) => g.id !== groupId);
        this.saveVocabularyGroups();

        if (this.currentScreen === 'detail' && this.currentGroupId === groupId) {
            // 현재 보고 있는 단어장이 삭제된 경우 목록으로 돌아가기
            this.showVocabularyListScreen();
        } else {
            this.renderVocabularyGroups();
        }

        console.log('Deleted vocabulary group:', group.name);
    }

    /**
     * 그룹에서 단어 제거
     */
    removeWordFromGroup(groupId, wordId) {
        const group = this.vocabularyGroups.find((g) => g.id === groupId);
        if (!group) return;

        const confirmed = confirm('이 단어를 단어장에서 제거하시겠습니까?');
        if (!confirmed) return;

        group.words = group.words.filter((word) => word.id !== wordId);
        group.updatedAt = new Date().toISOString();
        this.saveVocabularyGroups();

        // UI 업데이트
        const totalWordsElement = document.getElementById('totalVocabWords');
        if (totalWordsElement) {
            totalWordsElement.textContent = group.words.length;
        }

        this.renderWordList(group.words);

        // 단어가 모두 제거된 경우 빈 상태 표시
        if (group.words.length === 0) {
            const emptyState = document.getElementById('emptyState');
            const vocabularyList = document.getElementById('vocabularyList');
            if (emptyState) emptyState.style.display = 'block';
            if (vocabularyList) vocabularyList.style.display = 'none';
        }

        console.log('Removed word from group');
    }

    /**
     * 단어를 특정 그룹에 저장
     */
    async saveWordToGroup(groupId, wordData) {
        const group = this.vocabularyGroups.find((g) => g.id === groupId);
        if (!group) {
            console.error('Group not found:', groupId);
            return false;
        }

        // 이미 저장된 단어인지 확인
        const exists = group.words.some(
            (word) =>
                word.hanja === wordData.hanja &&
                (word.hiragana || word.pronunciation) === (wordData.hiragana || wordData.pronunciation)
        );

        if (exists) {
            this.showDuplicateWordAlert(group.name);
            return false;
        }

        // 단어 추가
        const newWord = {
            ...wordData,
            id: this.generateId(),
            savedAt: new Date().toISOString(),
        };

        group.words.push(newWord);
        group.updatedAt = new Date().toISOString();
        this.saveVocabularyGroups();

        return true;
    }

    /**
     * 단어장 선택 후 단어 저장 (외부 호출용)
     */
    async saveWordToVocabulary(wordData) {
        // 단어장 그룹 로드
        await this.loadVocabularyGroups();

        // 기본 그룹이 없으면 생성
        if (this.vocabularyGroups.length === 0) {
            this.createVocabularyGroup('내 단어장');
        }

        // 단어장이 1개만 있으면 바로 저장
        if (this.vocabularyGroups.length === 1) {
            return await this.saveWordToGroup(this.vocabularyGroups[0].id, wordData);
        }

        // 여러 단어장이 있으면 선택 모달 표시
        return await this.showVocabularySelectionModal(wordData);
    }

    /**
     * 단어장 선택 모달 표시
     */
    async showVocabularySelectionModal(wordData) {
        return new Promise((resolve) => {
            const modalHtml = `
                <div class="modal-overlay vocab-selection-modal show" id="vocabSelectionModal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>단어장 선택</h3>
                            <button class="modal-close-btn" id="vocabSelectionCloseBtn">×</button>
                        </div>
                        <div class="modal-body">
                            <div class="word-preview">
                                <div class="word-preview-hanja">${wordData.hanja}</div>
                                <div class="word-preview-reading">${wordData.hiragana}</div>
                                <div class="word-preview-meaning">${wordData.meaning}</div>
                            </div>
                            <div class="vocab-selection-list">
                                ${this.vocabularyGroups
                                    .map(
                                        (group) => `
                                    <button class="vocab-selection-item" data-group-id="${group.id}">
                                        <div class="selection-group-info">
                                            <div class="selection-group-name">${group.name}</div>
                                            <div class="selection-group-count">${group.words.length}개 단어</div>
                                        </div>
                                        <div class="selection-icon">📂</div>
                                    </button>
                                `
                                    )
                                    .join('')}
                            </div>
                            <div class="create-new-vocab">
                                <button class="create-new-vocab-btn" id="createNewVocabBtn">
                                    <span class="create-new-icon">+</span>
                                    <span>새 단어장 만들기</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // 모달을 body에 추가
            document.body.insertAdjacentHTML('beforeend', modalHtml);

            // 이벤트 바인딩
            this.bindVocabularySelectionEvents(wordData, resolve);
        });
    }

    /**
     * 단어장 선택 모달 이벤트 바인딩
     */
    bindVocabularySelectionEvents(wordData, resolveCallback) {
        const modal = document.getElementById('vocabSelectionModal');
        const closeBtn = document.getElementById('vocabSelectionCloseBtn');
        const createNewBtn = document.getElementById('createNewVocabBtn');

        // 모달 닫기
        const closeModal = (result = false) => {
            if (modal) {
                modal.remove();
            }
            resolveCallback(result);
        };

        // 닫기 버튼
        if (closeBtn) {
            closeBtn.addEventListener('click', () => closeModal(false));
        }

        // 모달 외부 클릭시 닫기
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal(false);
                }
            });
        }

        // 단어장 선택
        const selectionItems = modal.querySelectorAll('.vocab-selection-item');
        selectionItems.forEach((item) => {
            item.addEventListener('click', async () => {
                const groupId = item.dataset.groupId;
                const success = await this.saveWordToGroup(groupId, wordData);
                closeModal(success);
            });
        });

        // 새 단어장 만들기
        if (createNewBtn) {
            createNewBtn.addEventListener('click', () => {
                closeModal(false);
                // 새 단어장 생성 모달을 띄우고, 생성 후 해당 단어장에 저장
                this.createNewVocabularyAndSave(wordData);
            });
        }

        // ESC 키로 모달 닫기
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', handleKeyDown);
                closeModal(false);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
    }

    /**
     * 새 단어장 생성 후 단어 저장
     */
    async createNewVocabularyAndSave(wordData) {
        // 단어장 이름 입력 모달
        const name = prompt('새 단어장 이름을 입력하세요:');
        if (!name || !name.trim()) {
            return false;
        }

        // 새 단어장 생성
        const newGroup = {
            id: this.generateId(),
            name: name.trim(),
            words: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        this.vocabularyGroups.push(newGroup);
        this.saveVocabularyGroups();

        // 새 단어장에 단어 저장
        const success = await this.saveWordToGroup(newGroup.id, wordData);

        if (success) {
            alert(`"${newGroup.name}" 단어장에 단어가 저장되었습니다.`);
        }

        return success;
    }

    /**
     * 발음 재생
     */
    playPronunciation(text) {
        if (!text) return;

        console.log('Playing pronunciation:', text);

        try {
            // SpeechSynthesisManager가 있으면 사용
            if (this.speechSynthesis && typeof this.speechSynthesis.speak === 'function') {
                console.log('Using SpeechSynthesisManager');
                this.speechSynthesis.speak(text).catch(error => {
                    console.error('SpeechSynthesisManager error:', error);
                    this.fallbackSpeech(text);
                });
            } else {
                console.log('Using fallback speech');
                this.fallbackSpeech(text);
            }
        } catch (error) {
            console.error('Error playing pronunciation:', error);
            this.fallbackSpeech(text);
        }
    }

    /**
     * 기본 음성 합성 (fallback)
     */
    fallbackSpeech(text) {
        if (!text || !window.speechSynthesis) return;

        try {
            // 기존 음성 중지
            window.speechSynthesis.cancel();

            setTimeout(() => {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'ja-JP';
                utterance.rate = 0.8;
                utterance.pitch = 1.0;
                utterance.volume = 1.0;

                utterance.onstart = () => console.log('Speech started');
                utterance.onend = () => console.log('Speech ended');
                utterance.onerror = (event) => console.error('Speech error:', event);

                window.speechSynthesis.speak(utterance);
            }, 100);
        } catch (error) {
            console.error('Fallback speech error:', error);
        }
    }

    /**
     * 날짜 포맷팅
     */
    formatDate(dateString) {
        if (!dateString) return '';

        const date = new Date(dateString);
        const now = new Date();
        const diffTime = now - date;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return '오늘';
        } else if (diffDays === 1) {
            return '어제';
        } else if (diffDays < 7) {
            return `${diffDays}일 전`;
        } else {
            return date.toLocaleDateString('ko-KR', {
                month: 'short',
                day: 'numeric',
            });
        }
    }

    /**
     * 고유 ID 생성
     */
    generateId() {
        return 'vocab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 중복 단어 알림 표시
     */
    showDuplicateWordAlert(groupName) {
        const alertHtml = `
            <div class="modal-overlay duplicate-alert-modal show" id="duplicateAlertModal">
                <div class="modal-content duplicate-alert-content">
                    <div class="duplicate-alert-header">
                        <div class="alert-icon">⚠️</div>
                        <h3>중복 단어 알림</h3>
                    </div>
                    <div class="duplicate-alert-body">
                        <p>이미 <strong>"${groupName}"</strong> 단어장에 저장된 단어입니다.</p>
                    </div>
                    <div class="duplicate-alert-actions">
                        <button class="alert-ok-btn" id="duplicateAlertOkBtn">확인</button>
                    </div>
                </div>
            </div>
        `;

        // 알림을 body에 추가
        document.body.insertAdjacentHTML('beforeend', alertHtml);

        // 이벤트 바인딩
        const modal = document.getElementById('duplicateAlertModal');
        const okBtn = document.getElementById('duplicateAlertOkBtn');

        const closeAlert = () => {
            if (modal) {
                modal.remove();
            }
        };

        // 확인 버튼
        if (okBtn) {
            okBtn.addEventListener('click', closeAlert);
        }

        // 모달 외부 클릭시 닫기
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeAlert();
                }
            });
        }

        // ESC 키로 모달 닫기
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', handleKeyDown);
                closeAlert();
            }
        };
        document.addEventListener('keydown', handleKeyDown);

        // 3초 후 자동 닫기
        setTimeout(closeAlert, 3000);
    }
}

// 전역 스코프에 노출
window.MyVocabularyUI = MyVocabularyUI;
