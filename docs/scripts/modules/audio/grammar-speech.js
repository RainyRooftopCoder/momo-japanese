/**
 * Grammar Speech Add-on - 문법 학습 컴포넌트용 음성 기능 추가
 * 명사, 동사, 형용사 활용 학습에 공통으로 사용할 수 있는 음성 기능
 */

class GrammarSpeechAddon {
    /**
     * 문법 학습 앱에 음성 기능 추가
     * @param {Object} grammarApp - 문법 학습 앱 인스턴스
     * @param {string} type - 앱 타입 ('noun', 'verb', 'adjective')
     */
    static addSpeechFeatures(grammarApp, type = 'noun') {
        if (!grammarApp || !window.speechManager) {
            console.warn('Grammar app or speech manager not available');
            return;
        }

        // 기존 이벤트 바인딩에 음성 이벤트 추가
        const originalBindEvents = grammarApp.bindEvents;
        grammarApp.bindEvents = function() {
            // 원래 이벤트 바인딩 호출
            if (originalBindEvents) {
                originalBindEvents.call(this);
            }

            // 음성 이벤트 바인딩
            GrammarSpeechAddon.bindSpeechEvents(this, type);
        };

        // 음성 재생 메서드들 추가
        GrammarSpeechAddon.addSpeechMethods(grammarApp, type);

        // UI 생성 메서드에 음성 버튼 추가
        GrammarSpeechAddon.enhanceUICreation(grammarApp, type);
    }

    /**
     * 음성 이벤트 바인딩
     */
    static bindSpeechEvents(app, type) {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('speech-word-btn')) {
                app.speakCurrentWord();
            } else if (e.target.classList.contains('speech-form-btn')) {
                const formType = e.target.dataset.formType;
                app.speakForm(formType);
            } else if (e.target.classList.contains('speech-casual-btn')) {
                app.speakCasualForm();
            } else if (e.target.classList.contains('speech-polite-btn')) {
                app.speakPoliteForm();
            }
        });
    }

    /**
     * 음성 재생 메서드들 추가
     */
    static addSpeechMethods(app, type) {
        /**
         * 현재 단어/동사/형용사 음성 재생
         */
        app.speakCurrentWord = async function() {
            if (!window.speechManager) {
                console.warn('Speech manager not available');
                return;
            }

            try {
                let currentItem, textToSpeak;

                if (type === 'noun' && this.formsData) {
                    currentItem = this.formsData.examples[this.currentNounIndex];
                    textToSpeak = currentItem.noun;
                } else if (type === 'verb' && this.verbData) {
                    currentItem = this.verbData.examples[this.currentVerbIndex];
                    textToSpeak = currentItem.verb;
                } else if (type === 'adjective' && this.adjectiveData) {
                    currentItem = this.adjectiveData.examples[this.currentAdjectiveIndex];
                    textToSpeak = currentItem.adjective;
                } else {
                    console.warn('No data available for speech');
                    return;
                }

                const speechBtn = document.querySelector('.speech-word-btn');
                if (speechBtn) {
                    speechBtn.classList.add('speaking');
                    speechBtn.textContent = '🔈';
                }

                await window.speechManager.speak(textToSpeak);

                console.log('Word speech completed');
            } catch (error) {
                console.error('Error speaking word:', error);
                alert('음성 재생에 실패했습니다.');
            } finally {
                const speechBtn = document.querySelector('.speech-word-btn');
                if (speechBtn) {
                    speechBtn.classList.remove('speaking');
                    speechBtn.textContent = '🔊';
                }
            }
        };

        /**
         * 활용형 음성 재생
         */
        app.speakForm = async function(formType) {
            if (!window.speechManager) {
                console.warn('Speech manager not available');
                return;
            }

            try {
                let currentItem, formData, textToSpeak;

                if (type === 'noun' && this.formsData) {
                    currentItem = this.formsData.examples[this.currentNounIndex];
                    formData = currentItem.forms[this.selectedForm];
                    textToSpeak = formData[formType]; // 'casual' or 'polite'
                } else if (type === 'verb' && this.verbData) {
                    currentItem = this.verbData.examples[this.currentVerbIndex];
                    formData = currentItem.forms[this.selectedForm];
                    textToSpeak = formData[formType];
                } else if (type === 'adjective' && this.adjectiveData) {
                    currentItem = this.adjectiveData.examples[this.currentAdjectiveIndex];
                    formData = currentItem.forms[this.selectedForm];
                    textToSpeak = formData[formType];
                } else {
                    console.warn('No form data available for speech');
                    return;
                }

                const speechBtn = document.querySelector(`.speech-${formType}-btn`);
                if (speechBtn) {
                    speechBtn.classList.add('speaking');
                    speechBtn.textContent = '🔈';
                }

                await window.speechManager.speak(textToSpeak);

                console.log(`${formType} form speech completed`);
            } catch (error) {
                console.error(`Error speaking ${formType} form:`, error);
                alert('음성 재생에 실패했습니다.');
            } finally {
                const speechBtn = document.querySelector(`.speech-${formType}-btn`);
                if (speechBtn) {
                    speechBtn.classList.remove('speaking');
                    speechBtn.textContent = '🔊';
                }
            }
        };

        /**
         * 평문체 활용형 음성 재생
         */
        app.speakCasualForm = function() {
            return this.speakForm('casual');
        };

        /**
         * 경어체 활용형 음성 재생
         */
        app.speakPoliteForm = function() {
            return this.speakForm('polite');
        };
    }

    /**
     * UI 생성 메서드에 음성 버튼 추가
     */
    static enhanceUICreation(app, type) {
        // 기본 단어 표시에 음성 버튼 추가
        const originalCreateDisplay =
            app.createNounDisplay ||
            app.createVerbDisplay ||
            app.createAdjectiveDisplay;

        if (originalCreateDisplay) {
            const methodName = type === 'noun' ? 'createNounDisplay' :
                             type === 'verb' ? 'createVerbDisplay' :
                             'createAdjectiveDisplay';

            app[methodName] = function() {
                // 원래 UI 생성
                originalCreateDisplay.call(this);

                // 음성 버튼 추가
                GrammarSpeechAddon.addSpeechButtonsToUI(type);
            };
        }
    }

    /**
     * 생성된 UI에 음성 버튼 추가
     */
    static addSpeechButtonsToUI(type) {
        // 기본 단어에 음성 버튼 추가
        const wordElement = document.querySelector('.noun-kanji, .verb-kanji, .adjective-kanji');
        if (wordElement && !wordElement.nextElementSibling?.classList.contains('speech-word-btn')) {
            const speechBtn = document.createElement('button');
            speechBtn.className = 'speech-btn speech-word-btn';
            speechBtn.title = `${type === 'noun' ? '명사' : type === 'verb' ? '동사' : '형용사'} 음성 듣기`;
            speechBtn.textContent = '🔊';
            wordElement.parentNode.insertBefore(speechBtn, wordElement.nextSibling);
        }

        // 활용형에 음성 버튼 추가
        const formTexts = document.querySelectorAll('.form-text');
        formTexts.forEach((formText, index) => {
            if (!formText.querySelector('.speech-form-btn')) {
                const formType = index % 2 === 0 ? 'casual' : 'polite';
                const speechBtn = document.createElement('button');
                speechBtn.className = `speech-btn speech-btn-small speech-${formType}-btn speech-form-btn`;
                speechBtn.dataset.formType = formType;
                speechBtn.title = `${formType === 'casual' ? '평문체' : '경어체'} 음성 듣기`;
                speechBtn.textContent = '🔊';
                formText.appendChild(speechBtn);
            }
        });
    }

    /**
     * 여러 문법 앱에 일괄 적용
     */
    static applyToAllGrammarApps() {
        // 페이지 로드 후 각 앱에 음성 기능 추가
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                // 명사 활용 앱
                if (window.nounFormsApp) {
                    GrammarSpeechAddon.addSpeechFeatures(window.nounFormsApp, 'noun');
                }

                // 1그룹동사 앱
                if (window.group1VerbApp) {
                    GrammarSpeechAddon.addSpeechFeatures(window.group1VerbApp, 'verb');
                }

                // 2그룹동사 앱
                if (window.group2VerbApp) {
                    GrammarSpeechAddon.addSpeechFeatures(window.group2VerbApp, 'verb');
                }

                // 3그룹동사 앱
                if (window.group3VerbApp) {
                    GrammarSpeechAddon.addSpeechFeatures(window.group3VerbApp, 'verb');
                }

                // い형용사 앱
                if (window.iAdjectiveApp) {
                    GrammarSpeechAddon.addSpeechFeatures(window.iAdjectiveApp, 'adjective');
                }

                // な형용사 앱
                if (window.naAdjectiveApp) {
                    GrammarSpeechAddon.addSpeechFeatures(window.naAdjectiveApp, 'adjective');
                }
            }, 500);
        });
    }
}

// 자동으로 모든 문법 앱에 음성 기능 적용
GrammarSpeechAddon.applyToAllGrammarApps();