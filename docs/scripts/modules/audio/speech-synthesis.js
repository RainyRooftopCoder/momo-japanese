/**
 * Speech Synthesis Utility for Japanese Words
 * 일본어 단어 음성 출력을 위한 유틸리티
 */
class SpeechSynthesisManager {
    constructor() {
        this.synthesis = window.speechSynthesis;
        this.isSupported = 'speechSynthesis' in window;
        this.japaneseVoices = [];
        this.selectedVoice = null;
        this.isReady = false;

        this.init();
    }

    /**
     * 초기화
     */
    init() {
        if (!this.isSupported) {
            console.warn('Speech Synthesis API not supported');
            return;
        }

        // 음성 목록 로드 대기
        this.loadVoices();

        // 음성 목록이 변경될 때마다 다시 로드
        this.synthesis.addEventListener('voiceschanged', () => {
            this.loadVoices();
        });
    }

    /**
     * 일본어 음성 로드
     */
    loadVoices() {
        const voices = this.synthesis.getVoices();

        // 일본어 음성 필터링
        this.japaneseVoices = voices.filter(voice =>
            voice.lang.startsWith('ja') ||
            voice.lang.startsWith('jp') ||
            voice.name.toLowerCase().includes('japanese') ||
            voice.name.toLowerCase().includes('japan')
        );

        console.log('Available Japanese voices:', this.japaneseVoices);

        // 기본 일본어 음성 선택
        if (this.japaneseVoices.length > 0) {
            // 우선순위: 여성 > 남성 > 기타
            this.selectedVoice = this.japaneseVoices.find(voice =>
                voice.name.toLowerCase().includes('female') ||
                voice.name.toLowerCase().includes('woman') ||
                voice.name.toLowerCase().includes('kyoko') ||
                voice.name.toLowerCase().includes('otoya')
            ) || this.japaneseVoices[0];

            this.isReady = true;
            console.log('Selected Japanese voice:', this.selectedVoice.name);
        } else {
            console.warn('No Japanese voices available');
            this.isReady = false;
        }
    }

    /**
     * 일본어 텍스트 음성 출력
     * @param {string} text - 읽을 일본어 텍스트
     * @param {Object} options - 음성 옵션
     */
    speak(text, options = {}) {
        if (!this.isSupported || !this.isReady || !text) {
            console.warn('Speech synthesis not available or text is empty');
            return Promise.reject('Speech synthesis not available');
        }

        return new Promise((resolve, reject) => {
            // 현재 재생 중인 음성을 완전히 중지하고 잠시 대기
            this.synthesis.cancel();

            // 약간의 지연을 두어 이전 음성이 완전히 정리되도록 함
            setTimeout(() => {
                const utterance = new SpeechSynthesisUtterance(text);

                // 일본어 음성 설정
                if (this.selectedVoice) {
                    utterance.voice = this.selectedVoice;
                    utterance.lang = this.selectedVoice.lang;
                } else {
                    utterance.lang = 'ja-JP';
                }

                // 음성 설정 (전역 설정에서 속도 가져오기)
                const globalRate = window.globalSpeechRate || this.getGlobalSpeechRate() || 1.0;
                utterance.rate = options.rate || globalRate;
                utterance.pitch = options.pitch || 1.0;
                utterance.volume = options.volume || 1.0;

                let isResolved = false;

                // 이벤트 핸들러
                utterance.onend = () => {
                    if (!isResolved) {
                        console.log('Speech synthesis completed');
                        isResolved = true;
                        resolve();
                    }
                };

                utterance.onerror = (event) => {
                    if (!isResolved) {
                        console.error('Speech synthesis error:', event.error);
                        isResolved = true;

                        // 'interrupted' 오류는 사용자가 다른 음성을 재생한 것이므로 에러로 처리하지 않음
                        if (event.error === 'interrupted') {
                            resolve(); // 정상 완료로 처리
                        } else {
                            reject(event.error);
                        }
                    }
                };

                utterance.onstart = () => {
                    console.log('Speech synthesis started:', text);
                };

                // 음성 재생
                try {
                    this.synthesis.speak(utterance);
                } catch (error) {
                    if (!isResolved) {
                        console.error('Error starting speech synthesis:', error);
                        isResolved = true;
                        reject(error);
                    }
                }

                // 타임아웃 설정 (10초 후 자동 해제)
                setTimeout(() => {
                    if (!isResolved) {
                        console.warn('Speech synthesis timeout');
                        isResolved = true;
                        this.synthesis.cancel();
                        resolve();
                    }
                }, 10000);
            }, 100); // 100ms 지연
        });
    }

    /**
     * 전역 음성 속도 설정 가져오기
     */
    getGlobalSpeechRate() {
        try {
            const settings = JSON.parse(localStorage.getItem('appSettings') || '{}');
            return settings.speechRate || 1.0;
        } catch (error) {
            console.warn('Failed to load speech rate from settings:', error);
            return 1.0;
        }
    }

    /**
     * 단어 음성 출력 (히라가나 우선)
     * @param {Object} word - 단어 객체
     */
    speakWord(word) {
        if (!word) return Promise.reject('No word provided');

        // 히라가나가 있으면 히라가나로, 없으면 한자로
        const textToSpeak = word.hiragana || word.hanja || '';

        if (!textToSpeak) {
            return Promise.reject('No speakable text found');
        }

        console.log('Speaking word:', textToSpeak);
        // 전역 설정 사용 (options.rate가 없으면 자동으로 전역 설정 사용)
        return this.speak(textToSpeak);
    }

    /**
     * 예문 음성 출력
     * @param {string} sentence - 일본어 예문
     */
    speakSentence(sentence) {
        if (!sentence) return Promise.reject('No sentence provided');

        console.log('Speaking sentence:', sentence);
        // 전역 설정 사용 (options.rate가 없으면 자동으로 전역 설정 사용)
        return this.speak(sentence);
    }

    /**
     * 음성 재생 중지
     */
    stop() {
        if (this.isSupported) {
            this.synthesis.cancel();
        }
    }

    /**
     * 음성 일시정지
     */
    pause() {
        if (this.isSupported && this.synthesis.speaking) {
            this.synthesis.pause();
        }
    }

    /**
     * 음성 재개
     */
    resume() {
        if (this.isSupported && this.synthesis.paused) {
            this.synthesis.resume();
        }
    }

    /**
     * 음성 재생 상태 확인
     */
    isSpeaking() {
        return this.isSupported && this.synthesis.speaking;
    }

    /**
     * 사용 가능한 일본어 음성 목록 반환
     */
    getAvailableVoices() {
        return this.japaneseVoices;
    }

    /**
     * 음성 변경
     * @param {SpeechSynthesisVoice} voice - 새로운 음성
     */
    setVoice(voice) {
        if (voice && this.japaneseVoices.includes(voice)) {
            this.selectedVoice = voice;
            console.log('Voice changed to:', voice.name);
        }
    }
}

// 전역 인스턴스 생성
window.speechManager = new SpeechSynthesisManager();