# 모모 일본어 프로젝트 정리 노트

## 목표

현재 `momo-japanese` 프로토타입을 참고해서 Android/iOS 앱으로 배포 가능한 형태로 만든다.

기본 방향:

- 배포 대상: Android, iOS
- 앱 방식: WebView 기반
- 추천 도구: Capacitor
- 화면 대응: 모바일 우선, 태블릿까지 반응형 대응
- 데이터베이스: IndexedDB 유지
- 기본 성격: 서버 없이도 동작하는 로컬/오프라인 학습 앱
- 현재 프로토타입 위치: `docs/`

## 현재 프로젝트 상태

현재 프로젝트는 빌드 도구나 프레임워크 없이 만든 정적 PWA 형태의 일본어 학습 앱이다.

중요 파일:

- `docs/index.html`: 앱 진입점
- `docs/manifest.json`: PWA 매니페스트
- `docs/sw.js`: 서비스 워커
- `docs/scripts/core/app.js`: 단어 학습 앱 핵심 로직
- `docs/scripts/core/database.js`: IndexedDB 관리 로직
- `docs/scripts/modules/ui/navigation.js`: 화면 이동, 카테고리, 검색, 설정 관련 로직
- `docs/scripts/modules/ui/practice.js`: 연습 모드
- `docs/scripts/modules/ui/my-vocabulary.js`: 나의 단어장 화면
- `docs/templates/`: HTML 템플릿
- `docs/styles/`: CSS
- `docs/data/vocabulary/jlpt/`: JLPT 단어/문법 데이터

JLPT 단어 데이터:

- N5: 600개
- N4: 800개
- N3: 1,100개
- N2: 2,000개
- N1: 3,000개
- 총합: 7,500개

## 먼저 정리해야 할 문제

- `navigation.js`가 너무 크고 역할이 많다.
- `practice.js`, `app.js`, `database.js`도 파일 크기가 크다.
- `window.wordAppV4`, `window.dbManager`, `window.navigation` 같은 전역 객체 의존이 많다.
- `index.html` 안에 직접 들어간 JavaScript가 있어 HTML이 무겁다.
- `*-old.js`, `*_bak.json` 같은 예전 파일과 백업 파일이 많다.
- 실제 사용하는 파일과 안 쓰는 파일 구분이 필요하다.
- `sw.js` 서비스 워커 캐시 목록이 완전하지 않을 가능성이 있다.
- IndexedDB 초기화 로직이 배포 앱 기준으로는 너무 공격적이다.
- 단어 데이터를 앱 실행 때마다 다시 넣는 구조는 개선해야 한다.
- 모바일/태블릿 UI는 WebView 앱 기준으로 다시 점검해야 한다.
- Git 상태 조회는 현재 소유자 문제로 막힐 수 있다.

Git 상태 조회가 막히면 아래 명령이 필요할 수 있다:

```powershell
git config --global --add safe.directory D:/J17_DEV/workspace2/momo-japanese
```

## 추천 진행 방향

현재 프로토타입을 바로 WebView로 감싸서 배포하지 않는다.

추천 순서:

1. 현재 정적 웹앱을 먼저 안정화한다.
2. 실제 사용 파일과 예전/백업 파일을 구분한다.
3. IndexedDB 초기화와 데이터 업데이트 방식을 고친다.
4. 모바일/태블릿 UI를 정리한다.
5. Capacitor를 붙여 Android/iOS WebView 앱으로 감싼다.
6. Android에서 먼저 테스트한다.
7. Android가 안정되면 iOS 테스트로 넘어간다.
8. 마지막에 스토어 배포 준비를 한다.

## 1단계: 정적 앱 정리

목표: `docs/` 앱이 브라우저에서 안정적으로 실행되게 만든다.

### ✅ 완료된 작업

- ✅ 로컬 정적 서버로 현재 앱 실행 확인 (`python -m http.server 8000`)
- ✅ `index.html`에서 실제 로드되는 파일 목록 확인
- ✅ `index.html` 안의 인라인 JavaScript를 별도 파일로 이동:
    - `scripts/modules/ui/splash-transition.js` - 스플래시 화면 로직
    - `scripts/modules/ui/collapsible-sections.js` - 섹션 토글
    - `scripts/pwa/service-worker-register.js` - SW 등록
    - `scripts/pwa/install-prompt.js` - PWA 설치
- ✅ `sw.js` 캐시 목록 완성 (v1.2.0)
    - N1~N5 전체 데이터 추가
    - 문법 데이터 파일 추가
    - 새로운 UI 모듈 추가
- ✅ `*_bak.json` 백업 파일 정리 (→ `_backup` 폴더로 이동)
- ✅ 앱 정상 작동 확인

### ⏳ 남은 작업

- ✅ N1~N5 전체 데이터가 정상 로드되는지 확인 → **완료** (N1 3000개 데이터 정상 로드됨)
- ℹ️ `console.log`는 데이터 로드 추적에 필요하므로 유지 (프로덕션 빌드 시 제거 권장)
- `alert`, `confirm`은 다음 단계에서 앱 내부 모달로 교체

### 📝 변경 사항 정리

**파일 추가:**

- `docs/scripts/modules/ui/splash-transition.js` (113줄)
- `docs/scripts/modules/ui/collapsible-sections.js` (18줄)
- `docs/scripts/pwa/service-worker-register.js` (35줄)
- `docs/scripts/pwa/install-prompt.js` (24줄)

**파일 수정:**

- `docs/index.html` - 인라인 스크립트 제거, 새 파일 로드 추가
- `docs/sw.js` - 캐시 목록 업데이트 (v1.1.0 → v1.2.0)

**폴더 생성:**

- `docs/scripts/pwa/`
- `docs/data/vocabulary/jlpt/_backup/`

**파일 이동:**

- 5개의 `*_bak.json` 파일 → `_backup` 폴더

## 2단계: 모바일/태블릿 UI 정리

목표: 웹페이지가 아니라 설치형 앱처럼 보이게 만든다.

### ✅ 완료된 작업

- ✅ 메타태그 설정 확인:
    - `viewport: width=device-width, initial-scale=1.0, viewport-fit=cover` 추가
    - `apple-mobile-web-app-capable: yes`
    - `mobile-web-app-capable: yes`
- ✅ 버튼 터치 영역 개선:
    - Quick-btn: 최소 높이 48px 설정
    - Category-button: 최소 높이 48px 설정 (이전 50px)
    - 실제 버튼 높이: 98px 이상 (충분함)
- ✅ iOS Safe-Area 대응:
    - Header: `padding-top: max(env(safe-area-inset-top, 0), 0.5rem)` 추가
    - Nav-container: bottom safe-area 여백 추가
    - Main-content: 좌우 safe-area 여백 추가
    - Header-content: 안전 영역 내 패딩 추가

- ✅ 미디어 쿼리 확인:
    - ✅ 태블릿 (768px+): 있음
    - ✅ 모바일 (480px 이하): 있음
    - ✅ 초소형 폰 (360px 이하): 있음

- ✅ Manifest.json 설정 확인:
    - `display: standalone` (앱 모드)
    - `orientation: portrait-primary` (세로 모드 고정)

### ⏳ 남은 작업

- Manifest.json에 PWA 스크린샷 추가 (선택사항, 앱 설치 시 미리보기용)
- 최종 브라우저 & 실제 기기 테스트
- 세로 모드 고정 검증 (가로 모드 제한 정상 작동 확인)

### 📝 변경 사항 정리

**파일 수정:**

- `docs/index.html` - viewport에 `viewport-fit=cover` 추가
- `docs/styles/components/navigation.css` - 버튼 최소 높이 조정
- `docs/styles/pages/home.css` - quick-btn 높이 및 padding 조정
- `docs/styles/themes/glassmorphism.css` - safe-area 대응 (header, nav-container, main-content)

## 3단계: IndexedDB 안정화

목표: IndexedDB는 유지하되, 배포 앱에서 안전하게 동작하게 만든다.

### 📋 현재 상황

**문제점:**

- ❌ 앱 시작 시마다 `clearJLPTLevel('n1'~'n5')` 호출 → 사용자 데이터 손실 위험
- ❌ 매번 전체 데이터 재로드 (N1~N5 약 7,500개) → 성능 저하
- ❌ 데이터 버전 관리 없음 → 업데이트 전략 불명확
- ❌ 앱 버전과 데이터 버전 분리 안 됨

**현재 데이터 로드 흐름:**

```
app.init()
  → dbManager.init() (V4 DB 생성)
  → loadSampleData()
    → 모든 N1~N5 데이터 fetch
    → clearJLPTLevel() (기존 데이터 삭제) ← 문제!
    → saveJLPTWords() (새 데이터 저장)
```

### ✅ 해야 할 작업

1. **데이터 버전 관리 추가**
    - localStorage에 `dataVersion` 저장
    - manifest.json 또는 config에 `DATA_VERSION` 정의
    - 업데이트 시에만 데이터 재로드

2. **조건부 데이터 로드**
    - 첫 설치: 모든 데이터 로드
    - 업데이트: dataVersion이 다를 때만 재로드
    - 일반 실행: 데이터 유지

3. **사용자 데이터 보호**
    - 기본 사전 데이터 (words)와 사용자 데이터 (user_vocabulary, statistics) 분리
    - 데이터 업데이트 시 사용자 데이터 보존

4. **현재 app.js 수정**
    - loadSampleData() → loadOrUpdateData()로 리팩토링
    - 버전 체크 로직 추가

### 📝 구현 계획

**1단계: 데이터 버전 관리 시스템 추가**

- CONFIG에 DATA_VERSION = '1.0' 정의
- localStorage에서 이전 dataVersion 확인
- 버전 다르면 업데이트, 같으면 스킵

**2단계: loadSampleData() 리팩토링**

- getTotalWordCount() 체크
- dataVersion 확인
- 조건부 로드

### ✅ 완료된 작업

- `docs/scripts/config/app-config.js` 생성 - 데이터 버전 관리 시스템 완전 구현
- `docs/scripts/core/app.js`에 `loadOrUpdateData()` 적용
- `docs/index.html`에 `app-config.js`를 `app.js`보다 먼저 로드
- 재실행 시 기존 데이터 유지 동작 확인
- 사용자 데이터 보존 테스트 통과 (나의 단어장 데이터 재로드 후에도 유지)
- 버전 체크 로직: `shouldLoadData()`, `markDataAsLoaded()`, `isAppUpdated()` 구현
- 데이터 로드 전략: `'onupdate'` (배포 권장) 설정
- 캐시 무효화용 쿼리 파라미터 추가 (v=1.0.0)
- Service Worker 캐시 버전 업데이트 (v1.3.0)

### ✅ Stage 3 검증 결과

- **첫 실행**: 데이터 로드 ✅ (7500개 단어 저장)
- **재실행**: 데이터 유지 ✅ (shouldLoadData() = false)
- **사용자 단어**: 보존 ✅ (테스트 단어 저장 후 새로고침해도 유지)

**3단계: 테스트**

- 첫 실행: 데이터 로드 확인
- 재실행: 데이터 유지 확인
- 사용자 단어장 유지 확인

## 4단계: Capacitor WebView 앱 만들기

목표: 현재 정적 앱을 Android/iOS 앱 프로젝트로 감싼다.

### ✅ 완료된 작업

- ✅ `package.json` 생성 (Capacitor 7.6.2, Node 20.x 호환)
- ✅ `capacitor.config.json` 생성
    - appId: `com.momojapanese.app`
    - appName: `Momo Japanese`
    - webDir: `docs`
- ✅ `.gitignore` 생성 (android/, ios/, node_modules/ 제외)
- ✅ `npm install` 완료
- ✅ `npx cap init` 완료
- ✅ Android 플랫폼 추가
    - `android/` 폴더 생성
    - `docs/` → `android/app/src/main/assets/public/` 웹 자산 복사 완료

### ⏳ 남은 작업

- iOS 플랫폼 추가 (macOS/Xcode 환경 필요)
- 앱 아이콘/스플래시 설정 (res/ 폴더에 추가)
- WebView 안에서 다음 확인:
    - IndexedDB 동작
    - 일본어 음성 재생
    - 오프라인 모드 (Service Worker)
- Android 물리 뒤로가기 버튼 처리
- 상태바 색상과 safe-area 처리
- 빌드 및 기기 테스트

## 5단계: 실제 기기 테스트

목표: 배포 전에 실제 기기에서 깨지는 부분을 찾는다.

확인할 기기:

- Android 작은 폰
- Android 큰 폰
- Android 태블릿
- iPhone
- iPad

테스트할 기능:

- 첫 실행
- 단어 데이터 import 시간
- 오프라인 실행
- 검색
- JLPT 카테고리 이동
- 품사별 카테고리 이동
- 주제별 카테고리 이동
- 단어 카드 넘기기
- 일본어 음성 재생
- 나의 단어장 저장
- 연습 모드
- 문법 화면
- 앱 종료 후 데이터 유지

## 6단계: 스토어 배포 준비

Android:

- 패키지 이름 설정
- 앱 아이콘 생성
- 스플래시 화면 설정
- 서명된 AAB 빌드
- Play Console 등록
- 개인정보 처리방침 준비

iOS:

- Bundle ID 설정
- Signing 설정
- 앱 아이콘 생성
- Launch Screen 설정
- TestFlight 테스트
- App Store 등록 정보 준비
- 개인정보 처리방침 준비

## 다음 작업 때 시작할 순서

주말에 이어서 작업할 때는 아래 순서로 시작한다.

1. 현재 앱을 로컬에서 실행한다.
2. 주요 화면 흐름을 직접 확인한다.
3. 실제 사용 중인 파일 목록을 만든다.
4. 예전 파일/백업 파일 정리 목록을 만든다.
5. IndexedDB 초기화와 데이터 import 방식을 확인한다.
6. 첫 번째 정리 패치를 결정한다.

## Stage 4: Android Capacitor 환경 설정 및 JDK 호환성 문제 해결

### 🔧 문제 상황

Capacitor 7.6.2로 `npx cap run android` 실행 시 Java 버전 호환성 오류 발생:

```
error: invalid source release: 21
```

**원인:**

- 로컬 Java 환경: JDK 17 (`JAVA_HOME=D:\Java\jdk-17.0.11`)
- Capacitor/Gradle 기본 설정: Java 21
- 버전 불일치 → 컴파일 실패

### ✅ 해결 방법

#### 1단계: Gradle 빌드 설정에서 Java 21 참조 찾기

```bash
cd /d/J17_DEV/workspace2/momo-japanese/android
find . -name "*.gradle" -o -name "*.properties" | xargs grep -n "VERSION_21"
```

**발견된 파일 (4개):**

- `android/app/capacitor.build.gradle` (lines 5-6)
- `android/capacitor-cordova-android-plugins/build.gradle` (lines 31-32)
- `node_modules/@capacitor/android/capacitor/build.gradle` (lines 67-68)
- `node_modules/@capacitor/cli/dist/android/update.js` (line 150, 생성 템플릿)

#### 2단계: 각 파일의 Java 21 → Java 17로 수정

**수정 1: android/app/capacitor.build.gradle**

```gradle
// Before
android {
  compileOptions {
      sourceCompatibility JavaVersion.VERSION_21
      targetCompatibility JavaVersion.VERSION_21
  }
}

// After
android {
  compileOptions {
      sourceCompatibility JavaVersion.VERSION_17
      targetCompatibility JavaVersion.VERSION_17
  }
}
```

**수정 2: android/capacitor-cordova-android-plugins/build.gradle**

```gradle
// Before (lines 31-32)
compileOptions {
    sourceCompatibility JavaVersion.VERSION_21
    targetCompatibility JavaVersion.VERSION_21
}

// After
compileOptions {
    sourceCompatibility JavaVersion.VERSION_17
    targetCompatibility JavaVersion.VERSION_17
}
```

**수정 3: node_modules/@capacitor/android/capacitor/build.gradle**

Capacitor Android 라이브러리의 기본 빌드 설정 수정:

```gradle
// Before (lines 67-68)
compileOptions {
    sourceCompatibility JavaVersion.VERSION_21
    targetCompatibility JavaVersion.VERSION_21
}

// After
compileOptions {
    sourceCompatibility JavaVersion.VERSION_17
    targetCompatibility JavaVersion.VERSION_17
}
```

**수정 4: node_modules/@capacitor/cli/dist/android/update.js** (중요!)

`npx cap update` 또는 `npx cap run` 실행 시 `capacitor.build.gradle`을 자동 생성하는 템플릿 수정:

```javascript
// Before (line 150)
const dependencyLines = `// DO NOT EDIT THIS FILE! IT IS GENERATED EACH TIME "capacitor update" IS RUN

android {
  compileOptions {
      sourceCompatibility JavaVersion.VERSION_21
      targetCompatibility JavaVersion.VERSION_21
  }
}
...

// After
const dependencyLines = `// DO NOT EDIT THIS FILE! IT IS GENERATED EACH TIME "capacitor update" IS RUN

android {
  compileOptions {
      sourceCompatibility JavaVersion.VERSION_17
      targetCompatibility JavaVersion.VERSION_17
  }
}
...
```

### ⚠️ 중요: update.js 템플릿 수정의 이유

`capacitor.build.gradle` 파일은 생성 파일이므로, `npx cap copy` 또는 `npx cap run` 실행 시마다 자동으로 재생성됩니다. 따라서 update.js의 템플릿을 수정하지 않으면 다시 Java 21로 돌아갑니다.

### 🔄 빌드 프로세스 (수정 전)

```
❌ npx cap run android
  → npx cap copy (웹 자산 복사)
  → npx cap update (capacitor.build.gradle 재생성 with VERSION_21)
  → ./gradlew build
  → ❌ error: invalid source release: 21
```

### 🔄 빌드 프로세스 (수정 후)

```
✅ npx cap run android
  → npx cap copy (웹 자산 복사)
  → npx cap update (capacitor.build.gradle 재생성 with VERSION_17)
  → ./gradlew assembleDebug ✅
  → 에뮬레이터 선택 prompt
  → app-debug.apk 배포 ✅
  → 앱 실행 ✅
```

### ✅ 최종 테스트 결과

```bash
$ npx cap run android

√ Copying web assets from docs to android\app\src\main\assets\public in 60.14ms
√ Creating capacitor.config.json in android\app\src\main\assets in 989.10μs
√ copy android in 81.94ms
√ Updating Android plugins in 588.90μs
√ update android in 35.13ms
√ Running Gradle build in 2.01s
√ Deploying app-debug.apk to Medium_Phone_API_35 in 8.89s
```

**배포 대상:** Medium Phone API 35 (에뮬레이터)
**결과:** 앱 정상 실행 ✅

### 📋 수정 파일 요약

| 파일                                                     | 수정 내용                           | 목적                             |
| -------------------------------------------------------- | ----------------------------------- | -------------------------------- |
| `android/app/capacitor.build.gradle`                     | VERSION_21 → VERSION_17             | 앱 모듈 컴파일 옵션              |
| `android/capacitor-cordova-android-plugins/build.gradle` | VERSION_21 → VERSION_17             | Cordova 플러그인 컴파일 옵션     |
| `node_modules/@capacitor/android/capacitor/build.gradle` | VERSION_21 → VERSION_17             | Capacitor 라이브러리 컴파일 옵션 |
| `node_modules/@capacitor/cli/dist/android/update.js`     | 템플릿 수정 VERSION_21 → VERSION_17 | 자동 생성 파일 기본값 수정       |

### 🎯 적용된 Java 버전

- **로컬 JDK:** 17 (D:\Java\jdk-17.0.11)
- **Gradle:** 8.7.2
- **sourceCompatibility:** JavaVersion.VERSION_17
- **targetCompatibility:** JavaVersion.VERSION_17
- **Android Gradle Plugin:** 8.7.2
- **Kotlin:** 1.9.25
