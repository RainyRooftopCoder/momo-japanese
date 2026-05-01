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

할 일:

- 모바일 우선 화면 기준 정하기
- 태블릿용 반응형 레이아웃 정하기
- 작은 폰, 큰 폰, 태블릿 화면폭에서 주요 화면 확인
- 일본어/한국어 긴 텍스트가 넘치지 않게 수정
- 버튼과 터치 영역 크기 개선
- iOS safe-area 대응
- 스와이프와 뒤로가기 동작 통일
- 세로모드 고정 여부 결정
- 태블릿 가로모드 지원 여부 결정

## 3단계: IndexedDB 안정화

목표: IndexedDB는 유지하되, 배포 앱에서 안전하게 동작하게 만든다.

할 일:

- DB 스키마 버전 관리 방식 정하기
- 앱 버전과 데이터 버전을 분리해서 관리
- JLPT JSON import는 데이터 버전이 바뀔 때만 실행
- 앱을 켤 때마다 전체 단어 데이터를 지우고 다시 넣는 구조 제거
- 기본 사전 데이터와 사용자 데이터를 분리
- 앱 업데이트 시 나의 단어장/학습 기록이 유지되도록 처리
- 앱 재실행 후 저장 데이터가 유지되는지 확인
- Android WebView에서 IndexedDB 동작 확인
- iOS WKWebView에서 IndexedDB 동작 확인

## 4단계: Capacitor WebView 앱 만들기

목표: 현재 정적 앱을 Android/iOS 앱 프로젝트로 감싼다.

할 일:

- `package.json` 추가
- Capacitor 초기화
- Android 플랫폼 추가
- iOS 플랫폼 추가
- 앱 ID 설정
- 앱 이름 설정
- 앱 아이콘/스플래시 설정
- 정적 웹 파일을 Capacitor web directory로 복사하는 구조 만들기
- WebView 안에서 IndexedDB 동작 확인
- WebView 안에서 일본어 음성 재생 확인
- Android 물리 뒤로가기 버튼 처리
- 상태바 색상과 safe-area 처리

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
