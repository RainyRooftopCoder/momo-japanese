/**
 * 나의 단어장 UI 모듈
 * 사용자가 저장한 단어들을 관리하는 인터페이스
 */

class MyVocabularyUI {
    constructor() {
        this.dbManager = null;
        this.speechSynthesis = null;
        this.vocabularyWords = [];

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
        if (window.speechSynthesis) {
            this.speechSynthesis = window.speechSynthesis;
        }
    }

    /**
     * 나의 단어장 화면 표시
     */
    async showMyVocabulary() {
        try {
            console.log('Showing my vocabulary...');

            // 화면 표시 (템플릿은 이미 HTML에 있음)
            if (window.navigation) {
                console.log('Showing myVocabulary screen...');
                window.navigation.showScreen('myVocabulary');
                console.log('Screen shown');
            } else {
                console.error('Navigation manager not available');
                console.log('window.navigation:', !!window.navigation);
                return;
            }

            // 단어 목록 로드
            console.log('Loading vocabulary words...');
            await this.loadVocabularyWords();
            this.renderVocabularyList();
            console.log('Vocabulary words rendered');

            // 뒤로가기 버튼 이벤트 바인딩
            this.bindBackButton();

            // 스와이프 뒤로가기 이벤트 바인딩
            this.bindSwipeEvents();

        } catch (error) {
            console.error('Error showing my vocabulary:', error);
            alert('나의 단어장을 표시하는 중 오류가 발생했습니다.');
        }
    }

    /**
     * 뒤로가기 버튼 이벤트 바인딩
     */
    bindBackButton() {
        const backBtn = document.getElementById('vocabBackBtn');
        if (backBtn) {
            // 기존 이벤트 리스너 제거
            const newBackBtn = backBtn.cloneNode(true);
            backBtn.parentNode.replaceChild(newBackBtn, backBtn);

            // 뒤로가기 이벤트 추가
            newBackBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                console.log('Back button clicked');
                if (window.navigation) {
                    window.navigation.showScreen('home');
                }
            });

            console.log('Back button event bound');
        } else {
            console.warn('Back button not found');
        }
    }

    /**
     * 스와이프 뒤로가기 이벤트 바인딩
     */
    bindSwipeEvents() {
        const screen = document.getElementById('myVocabularyScreen');
        if (!screen) return;

        let startX = null;
        let startY = null;

        screen.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });

        screen.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;

            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;

            const deltaX = endX - startX;
            const deltaY = endY - startY;

            // 오른쪽으로 스와이프 (뒤로가기)
            if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 50) {
                console.log('Swipe right detected - going back');
                if (window.navigation) {
                    window.navigation.showScreen('home');
                }
            }

            startX = null;
            startY = null;
        }, { passive: true });

        console.log('Swipe events bound to vocabulary screen');
    }

    /**
     * 저장된 단어 목록 로드
     */
    async loadVocabularyWords() {
        // 실시간으로 데이터베이스 매니저 참조 재시도
        this.initializeReferences();

        if (!this.dbManager) {
            console.error('Database manager not available');
            return;
        }

        try {
            this.vocabularyWords = await this.dbManager.getMyVocabulary();
            console.log('Loaded vocabulary words:', this.vocabularyWords.length);
        } catch (error) {
            console.error('Error loading vocabulary words:', error);
            this.vocabularyWords = [];
        }
    }

    /**
     * 단어 목록 렌더링
     */
    renderVocabularyList() {
        const totalWordsElement = document.getElementById('totalVocabWords');
        const emptyStateElement = document.getElementById('emptyState');
        const vocabularyListElement = document.getElementById('vocabularyList');

        if (!totalWordsElement || !emptyStateElement || !vocabularyListElement) {
            console.error('Required DOM elements not found');
            return;
        }

        // 총 단어 수 업데이트
        totalWordsElement.textContent = this.vocabularyWords.length;

        // 빈 상태 표시/숨김
        if (this.vocabularyWords.length === 0) {
            emptyStateElement.style.display = 'block';
            vocabularyListElement.style.display = 'none';
            return;
        }

        emptyStateElement.style.display = 'none';
        vocabularyListElement.style.display = 'flex';

        // 단어 카드 생성
        vocabularyListElement.innerHTML = '';
        this.vocabularyWords.forEach(word => {
            const wordCard = this.createWordCard(word);
            vocabularyListElement.appendChild(wordCard);
        });
    }

    /**
     * 단어 카드 생성
     * @param {Object} word - 단어 데이터
     * @returns {HTMLElement} 단어 카드 요소
     */
    createWordCard(word) {
        const cardElement = document.createElement('div');
        cardElement.className = 'vocab-word-card';
        cardElement.innerHTML = `
            <div class="vocab-word-header">
                <div class="vocab-word-main">
                    <div class="vocab-hanja">${word.hanja || '한자 없음'}</div>
                    <div class="vocab-pronunciation">
                        <span class="vocab-hiragana">${word.hiragana || word.pronunciation || ''}</span>
                        <button class="vocab-speech-btn" data-pronunciation="${word.hiragana || word.pronunciation || ''}" title="발음 듣기">🔊</button>
                    </div>
                    <div class="vocab-meaning">${word.meaning || word.korean || ''}</div>
                </div>
                <div class="vocab-actions">
                    <button class="vocab-remove-btn" data-word-id="${word.id}" title="단어장에서 제거">삭제</button>
                    <div class="vocab-saved-date">${this.formatDate(word.savedAt)}</div>
                </div>
            </div>
            <div class="vocab-meta">
                <div class="vocab-jlpt-level">${word.jlptLevel ? word.jlptLevel.toUpperCase() : 'N/A'}</div>
            </div>
        `;

        // 이벤트 리스너 추가
        this.addCardEventListeners(cardElement, word);

        return cardElement;
    }

    /**
     * 카드 이벤트 리스너 추가
     * @param {HTMLElement} cardElement - 카드 요소
     * @param {Object} word - 단어 데이터
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
                this.removeWordFromVocabulary(word.id);
            });
        }
    }

    /**
     * 날짜 포맷팅
     * @param {string} dateString - ISO 날짜 문자열
     * @returns {string} 포맷된 날짜
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
                day: 'numeric'
            });
        }
    }

    /**
     * 발음 재생
     * @param {string} text - 재생할 텍스트
     */
    playPronunciation(text) {
        if (!text) return;

        try {
            if (this.speechSynthesis && typeof this.speechSynthesis.speak === 'function') {
                this.speechSynthesis.speak(text);
            } else if (window.speechSynthesis) {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'ja-JP';
                utterance.rate = 0.8;
                window.speechSynthesis.speak(utterance);
            }
        } catch (error) {
            console.error('Error playing pronunciation:', error);
        }
    }

    /**
     * 단어장에서 단어 제거
     * @param {string} wordId - 제거할 단어 ID
     */
    async removeWordFromVocabulary(wordId) {
        // 실시간으로 데이터베이스 매니저 참조 재시도
        this.initializeReferences();

        if (!this.dbManager) {
            console.error('Database manager not available');
            return;
        }

        try {
            const confirmed = confirm('이 단어를 나의 단어장에서 제거하시겠습니까?');
            if (!confirmed) return;

            const success = await this.dbManager.removeFromMyVocabulary(wordId);
            if (success) {
                // 목록에서 제거
                this.vocabularyWords = this.vocabularyWords.filter(word => word.id !== wordId);
                this.renderVocabularyList();
                console.log('Word removed from vocabulary');
            } else {
                alert('단어 제거에 실패했습니다.');
            }
        } catch (error) {
            console.error('Error removing word from vocabulary:', error);
            alert('단어 제거 중 오류가 발생했습니다.');
        }
    }

    /**
     * 단어를 나의 단어장에 저장
     * @param {Object} wordData - 저장할 단어 데이터
     * @returns {Promise<boolean>} 저장 성공 여부
     */
    async saveWordToVocabulary(wordData) {
        // 실시간으로 데이터베이스 매니저 참조 재시도
        this.initializeReferences();

        if (!this.dbManager) {
            console.error('Database manager not available');
            alert('데이터베이스가 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
            return false;
        }

        try {
            // 이미 저장된 단어인지 확인
            const isAlreadySaved = await this.dbManager.isWordInMyVocabulary(
                wordData.hanja,
                wordData.hiragana || wordData.pronunciation
            );

            if (isAlreadySaved) {
                alert('이미 나의 단어장에 저장된 단어입니다.');
                return false;
            }

            const success = await this.dbManager.saveToMyVocabulary(wordData);
            if (success) {
                console.log('Word saved to vocabulary');
                return true;
            } else {
                alert('단어 저장에 실패했습니다.');
                return false;
            }
        } catch (error) {
            console.error('Error saving word to vocabulary:', error);

            // 데이터베이스 스키마 오류인 경우 재생성 시도
            if (error.name === 'NotFoundError' && error.message.includes('object stores was not found')) {
                console.log('Database schema error detected, attempting to recreate database...');
                try {
                    await this.dbManager.deleteAndRecreateDatabase();
                    alert('데이터베이스를 업데이트했습니다. 다시 시도해주세요.');
                    return false;
                } catch (recreateError) {
                    console.error('Error recreating database:', recreateError);
                    alert('데이터베이스 업데이트에 실패했습니다. 페이지를 새로고침해주세요.');
                    return false;
                }
            }

            alert('단어 저장 중 오류가 발생했습니다.');
            return false;
        }
    }
}

// 전역 스코프에 노출
window.MyVocabularyUI = MyVocabularyUI;