# Claude Code 참고 문서 - 아주약품 제안제도 시스템

**최종 업데이트:** 2026-01-20 (점수 체계 문서 업데이트)
**프로젝트:** suggestion-system_251020_V3_multiuser
**버전:** 3.2.0
**상태:** 운영 가능 (Production Ready)

---

## 1. 프로젝트 개요

### 1.1 목적
아주약품 직원들의 업무 개선 아이디어를 수집, 평가, 보상하는 디지털 제안제도 시스템입니다.

### 1.2 핵심 기능
- 2단계 평가 시스템 (1차 소위원회 → 2차 제안위원회, 60점 기준 분기)
- 유형효과 검증 프로세스 (금액 절감 제안에 대한 검증)
- 복수 권한 시스템 (한 사용자가 여러 역할 수행 가능)
- 실시간 진행 상황 추적
- 조직도 기반 자동 결재라인 설정

---

## 2. 기술 스택

### 2.1 프론트엔드
- **순수 HTML/CSS/JavaScript** (프레임워크 없음)
- CSS: 인라인 스타일 (`<style>` 태그 내 정의)
- 모바일 반응형 디자인 (미디어 쿼리 사용)
- 테마 컬러: `#0ea5e9` (청록색), `#2dd4bf` (민트), `#667eea` (보라)

### 2.2 백엔드
- **Firebase** (Google Cloud Platform)
  - Firebase Authentication: 이메일/비밀번호 인증
  - Firestore: NoSQL 데이터베이스
  - 캐싱: `db.enablePersistence()` 사용

### 2.3 배포
- **Netlify**
  - 정적 사이트 호스팅
  - Netlify Functions: 서버리스 함수
  - 빌드 명령: `rm -rf dist && mkdir -p dist && cp *.html dist/`

### 2.4 외부 API
- **OpenAI API** (GPT-3.5-turbo)
  - 유형효과 검증 기준 제시용
  - Netlify Function으로 프록시 (`/netlify/functions/openai-analyze.js`)

---

## 3. 프로젝트 구조

```
suggestion-system_251020_V3_multiuser/
├── index.html              # 로그인/회원가입 페이지
├── dashboard.html          # 일반 사용자 대시보드 (제안서 작성/조회)
├── leader.html             # 리더 대시보드 (1차/2차/3차 평가)
├── verifier.html           # 유형효과 검증 담당자 대시보드
├── admin.html              # 관리자 대시보드 (시스템 관리)
├── add-admin.html          # 관리자 추가 페이지
├── reset-admin-password.html # 관리자 비밀번호 재설정
├── firestore.rules         # Firestore 보안 규칙
├── firebase.json           # Firebase 설정
├── netlify.toml            # Netlify 배포 설정
├── package.json            # Node.js 의존성
├── netlify/
│   └── functions/
│       └── openai-analyze.js # OpenAI API 프록시 함수
├── dist/                   # 빌드 출력 디렉토리
├── README.md               # 시스템 사용 가이드
├── PRD.md                  # 제품 요구사항 문서
└── CHANGELOG.md            # 변경 이력
```

---

## 4. Firebase 설정

### 4.1 Firebase 프로젝트 정보
```javascript
const firebaseConfig = {
    apiKey: "AIzaSyAv0y8cF86kDC-saDZA6K0Q5fZd6dk9H1Y",
    authDomain: "suggestion-system-58def.firebaseapp.com",
    projectId: "suggestion-system-58def",
    storageBucket: "suggestion-system-58def.firebasestorage.app",
    messagingSenderId: "755050605021",
    appId: "1:755050605021:web:befd52c5516c3a3d3e2e34"
};
```

### 4.2 Firestore 컬렉션 구조

| 컬렉션 | 설명 | 주요 필드 |
|--------|------|-----------|
| `users` | 사용자 정보 | uid, employeeId, displayName, department, roles[], isEvaluator, passwordChanged |
| `employees` | 직원 정보 (조직도) | employeeId, name, department, position, isLeader, leaderLevel, isActive |
| `suggestions` | 제안서 | suggestionId, userId, title, content, status, hasTypicalEffect, effectVerification |
| `approvalLines` | 결재 라인 | department, firstReviewer, secondReviewer, thirdReviewer |
| `notifications` | 알림 | userId, message, read, createdAt |
| `notices` | 공지사항 | title, content, createdAt |
| `categories` | 카테고리 | name, order, isActive |
| `evaluationCriteria` | 평가 기준 | criteria, scores |
| `systemSettings` | 시스템 설정 | key, value |

### 4.3 Firestore 보안 규칙 요약
- `employees`: 누구나 읽기 가능, admin만 쓰기 가능
- `users`: 본인 또는 admin만 읽기/쓰기 가능
- `suggestions`: 인증된 사용자만 읽기, 작성자/admin/평가자가 수정 가능
- `approvalLines`, `notices`, `categories`, `systemSettings`: admin만 쓰기 가능

---

## 5. 사용자 권한 체계

### 5.1 권한 종류 (roles 배열)
| 권한 | 설명 | 접근 페이지 |
|------|------|------------|
| `user` | 일반 사용자 (제안서 작성) | dashboard.html |
| `firstReviewer` | 1차 평가자 | leader.html |
| `secondReviewer` | 2차 평가자 | leader.html |
| `thirdReviewer` | 3차 평가자 | leader.html |
| `effectVerifier` | 유형효과 검증 담당자 | verifier.html |
| `admin` | 시스템 관리자 | admin.html |

### 5.2 로그인 후 페이지 리다이렉트 우선순위
1. `admin` → admin.html
2. `effectVerifier` → verifier.html (현재 leader.html로 통합)
3. `firstReviewer` / `secondReviewer` / `thirdReviewer` → leader.html
4. `user` → dashboard.html

### 5.3 권한 결정 로직 (index.html)
```javascript
function redirectBasedOnRoles(userData) {
    const roles = userData.roles;
    if (roles.includes('admin')) { window.location.href = 'admin.html'; return; }
    if (roles.includes('firstReviewer') || roles.includes('secondReviewer') || roles.includes('thirdReviewer')) {
        window.location.href = 'leader.html'; return;
    }
    window.location.href = 'dashboard.html';
}
```

---

## 6. 제안서 처리 프로세스

### 6.1 무형효과만 있는 경우 (최대 40점)
```
[제안 제출] → [1차 평가(소위원회)] → [최종 확정]
```
> 무형효과만 있는 경우 최대 40점이므로 60점 초과가 불가능하여 1차에서 종료

### 6.2 유형효과가 있는 경우 (60점 이하)
```
[제안 제출] → [유형효과 검증] → [1차 평가(소위원회)] → [최종 확정]
```

### 6.3 유형효과가 있는 경우 (60점 초과)
```
[제안 제출] → [유형효과 검증] → [1차 평가(소위원회)] → [2차 평가(제안위원회)] → [최종 확정]
```

### 6.3 제안서 상태 (status)
| 상태 | 설명 |
|------|------|
| `draft` | 임시저장 |
| `pending` | 제출됨, 평가 대기 |
| `verifying` | 유형효과 검증 중 |
| `verified` | 검증 완료, 평가 대기 |
| `reviewing` | 평가 진행 중 |
| `revision_requested` | 수정 요청됨 |
| `approved` | 승인됨 |
| `rejected` | 반려됨 |

---

## 7. 평가 점수 체계 (2026-01-20 기준)

### 7.1 평가자 평가 항목 (leader.html)
| 항목 | 점수 범위 | 설명 |
|------|----------|------|
| **노력도** | 0~15점 | 투입된 노력 시간 기준 |
| **창의성** | 0~15점 | 아이디어의 독창성 |
| **품질효과** | 0~10점 | 품질 개선, 불량 예방 효과 |
| **안전효과** | 0~10점 | 안전 환경 개선, 사고 예방 효과 |

> **무형효과 계산**: 품질과 안전 중 **더 높은 점수만 적용** (OR 조건)
> **평가자 점수 최대**: 15 + 15 + 10 = **40점**

### 7.2 유형효과 점수 (calculateTangibleEffectScore 함수)
| 검증 금액 (원/년) | 점수 |
|------------------|------|
| 5,000만원 이상 | 60점 |
| 4,000~5,000만원 | 50점 |
| 3,000~4,000만원 | 45점 |
| 2,000~3,000만원 | 40점 |
| 1,000~2,000만원 | 35점 |
| 500~1,000만원 | 30점 |
| 100~500만원 | 25점 |
| 50~100만원 | 20점 |
| 50만원 이하 | 15점 |

> **총점 최대**: 40점(평가) + 60점(유형효과) = **100점**

### 7.3 등급 산정 (gradeRanges 설정)
| 등급 | 종합점수 | 보상금 |
|------|----------|--------|
| 특급 | 91~100점 | 100만원 |
| 1급 | 81~90점 | 80만원 |
| 2급 | 71~80점 | 60만원 |
| 3급 | 61~70점 | 40만원 |
| 4급 | 56~60점 | 30만원 |
| 5급 | 51~55점 | 20만원 |
| 6급 | 45~50점 | 10만원 |
| 7급 | 41~44점 | 7만원 |
| 8급 | 31~40점 | 5만원 |
| 9급 | 21~30점 | 3만원 |
| 10급 | 0~20점 | 2만원 |

### 7.4 60점 분기 로직
- **60점 이하**: 1차 평가(소위원회)에서 최종 확정
- **60점 초과**: 2차 평가(제안위원회)로 이관

---

## 8. 주요 페이지별 기능

### 8.1 index.html (로그인)
- 사번 기반 로그인 (예: A197003)
- 초기 비밀번호: `ajupharm`
- 첫 로그인 시 비밀번호 변경 강제
- Firebase Auth 계정 자동 생성 (employees 컬렉션 기반)

### 8.2 dashboard.html (일반 사용자)
- 제안서 작성 폼 (기본정보, 내용, 유형효과, 자체평가)
- 내 제안서 목록 조회
- 알림 확인
- 리더 권한자는 상위 결재라인 선택 가능

### 8.3 leader.html (리더/평가자)
- 결재 대기 목록
- 평가 모달 (노력도, 창의성, 품질효과, 안전효과, 평가의견)
- 승인/수정요청/반려 처리
- 검증 완료된 유형효과 정보 표시
- 60점 기준 분기 처리 (60점 이하 종료, 60점 초과 2차 이관)

### 8.4 verifier.html (유형효과 검증)
- 검증 대기 목록
- 예상 금액 검토 및 확정 금액 입력
- 검증 의견 작성
- AI 기반 검증 기준 제시 (OpenAI API)

### 8.5 admin.html (관리자)
- 대시보드 (통계)
- 승인 대기/수정 요청/승인 완료 목록
- 조직도 관리 (Excel 업로드)
- 사용자 관리 (권한 설정)
- 카테고리/평가기준/공지사항 관리

---

## 9. Netlify Functions

### 9.1 openai-analyze.js
- **경로**: `/.netlify/functions/openai-analyze`
- **메소드**: POST
- **요청 본문**: `{ customPrompt: string }`
- **응답**: `{ success: boolean, analysis: string }`
- **환경 변수**: `OPENAI_API_KEY` (Netlify 환경 변수에 설정)

---

## 10. 개발 시 주의사항

### 10.1 코딩 컨벤션
- 모든 HTML 파일은 인라인 CSS와 JavaScript 포함 (단일 파일)
- 함수명: camelCase (예: `handleLogin`, `showToast`)
- 이벤트 핸들러: `onclick` 속성 또는 `addEventListener`
- 비동기 처리: async/await 패턴

### 10.2 Firebase 쿼리
```javascript
// Firestore 읽기 예시
const doc = await db.collection('users').doc(userId).get();
const data = doc.data();

// Firestore 쓰기 예시
await db.collection('suggestions').doc(suggestionId).update({
    status: 'approved',
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
});
```

### 10.3 Toast 알림 표시
```javascript
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}
// type: 'success', 'error', 'info', 'warning'
```

### 10.4 모달 표시/숨김
```javascript
// 모달 표시
document.getElementById('modalId').classList.add('show');
// 모달 숨김
document.getElementById('modalId').classList.remove('show');
```

---

## 11. 배포 프로세스

### 11.1 로컬 개발
```bash
npm install
npm run dev  # Netlify Dev 서버 실행 (http://localhost:8888)
```

### 11.2 빌드 및 배포
```bash
npm run build  # dist 폴더에 HTML 파일 복사
# Netlify가 Git push 시 자동 배포
```

### 11.3 Netlify 환경 변수
| 변수 | 설명 |
|------|------|
| `OPENAI_API_KEY` | OpenAI API 키 |

---

## 12. 자주 발생하는 이슈 및 해결법

### 12.1 Firebase 권한 오류
```
FirebaseError: Missing or insufficient permissions
```
- **원인**: Firestore 보안 규칙 위반
- **해결**: `firestore.rules` 파일 확인, 사용자 role 확인

### 12.2 로그인 후 리다이렉트 안 됨
- **원인**: `users` 컬렉션에 사용자 문서 없음
- **해결**: 로그인 로직에서 문서 재생성 로직 확인

### 12.3 유형효과 검증 버튼 비활성화
- **원인**: 제안서의 `hasTypicalEffect`가 false이거나 `effectVerification.status`가 'verified'가 아님
- **해결**: 제안서 상태 및 검증 상태 확인

---

## 13. 변경 이력 추적

### 13.1 파일별 변경 이력 위치
- `dashboard.html`: 파일 상단 주석 (라인 1-60)
- `leader.html`: 파일 상단 주석 (라인 1-77)
- `CHANGELOG.md`: 전체 변경 이력

### 13.2 최근 주요 변경사항 (2026-01-20)

**[문서 업데이트]**
1. CLAUDE.md 점수 체계 섹션 전면 수정 (실제 코드와 일치)
   - 평가 항목: 노력도(0~15), 창의성(0~15), 품질(0~10), 안전(0~10)
   - 무형효과 계산: 품질/안전 중 최대값만 적용 (OR 조건)
   - 유형효과 점수: 15~60점 (금액 기준)
   - 등급 기준표 전체 명시 (특급~10급)
2. 통합테스트_시나리오.md v2.0 업데이트
3. 통합테스트_체크리스트_20260120.md 신규 생성 (89개 항목)

### 13.3 이전 주요 변경사항 (2026-01-14)

**[Phase 1] 버그 수정 및 리팩토링:**
1. `index.html`: `switchTab` 함수 버그 수정 (전역 event 객체 참조 → 파라미터로 전달)
2. `admin.html`: 중복 함수 정의 제거 (`loadApprovalLines`, `openApprovalLineModal` 등 7개 함수)
3. `admin.html`: `resetUserPassword`에서 잘못된 함수 호출 수정 (`loadUserRoles` → `loadUsers`)
4. `admin.html`: `updateCompletedSuggestions` 함수의 도달 불가 코드 제거

**[Phase 2] 운영 환경 최적화:**
5. 콘솔 로그 제거: 모든 HTML 파일에서 `console.log`, `console.warn` 제거
   - 제거: console.log 189개, console.warn 19개
   - 유지: console.error 107개 (에러 추적용)
6. Firestore 보안 규칙 강화 (`firestore.rules`):
   - `users` 컬렉션: 본인 문서만 생성 가능하도록 제한
   - `notifications` 컬렉션: 본인 알림만 수정/삭제 가능
   - `suggestions` 컬렉션: roles 배열 기반 권한 체크 추가
   - `accountCreationRequests` 컬렉션 규칙 추가

**[Phase 3] 문서화:**
7. `통합테스트_시나리오.md` 생성: 4가지 유형별 테스트 시나리오
   - 시나리오 1: 무형효과 - 1차 평가 종료 (60점 이하)
   - 시나리오 2: 무형효과 - 2차 평가 진행 (60점 초과)
   - 시나리오 3: 유형효과 - 검증 후 승인
   - 시나리오 4: 수정 요청 및 재제출
8. `코드_완성도_평가서.md` 생성: 시스템 완성도 평가
   - 종합 점수: 79/100 (B+)
   - 판정: 조건부 운영 가능 (소규모 즉시 가능, 전사 확대 시 모니터링 필요)

**[Phase 4] 배포:**
9. 프로젝트 빌드 완료 (dist 폴더)
10. Firebase Firestore 보안 규칙 배포 완료

### 13.4 이전 변경사항 (2025-01-27)
1. 실시자 디폴트 설정 (제안자 정보 자동 입력)
2. 우선순위 항목 삭제
3. 자체평가 항목 텍스트 상세화 (노력도/창의성)
4. 리더 결재라인 선택 기능 추가
5. loadAllData 함수 오류 수정

---

## 14. 참고 문서

- `README.md`: 시스템 사용 가이드
- `PRD.md`: 제품 요구사항 문서
- `CHANGELOG.md`: 전체 변경 이력
- `통합테스트_시나리오.md`: 4가지 유형별 통합테스트 시나리오 (v2.0, 2026-01-20 업데이트)
- `통합테스트_체크리스트_20260120.md`: 실행용 테스트 체크리스트 (89개 항목)
- `통합테스트_체크리스트.md`: 상세 테스트 체크리스트 (레거시)
- `제안서_유형별_테스트_체크리스트.md`: 유형별 테스트 (레거시)
- `코드_완성도_평가서.md`: 시스템 완성도 평가 및 운영 가능 여부 판정 (79점/B+)

---

## 15. 코딩 진행 시 체크리스트

### 15.1 새 기능 추가 시
- [ ] 해당 HTML 파일 상단 주석에 변경 이력 추가
- [ ] Firestore 보안 규칙 확인 (필요 시 수정)
- [ ] 모바일 반응형 스타일 확인
- [ ] Toast 알림 메시지 추가
- [ ] 에러 핸들링 추가

### 15.2 버그 수정 시
- [ ] 원인 분석 및 문서화
- [ ] 관련 파일 변경 이력에 버그 수정 내용 추가
- [ ] 회귀 테스트 수행

### 15.3 배포 전 확인
- [ ] 로컬에서 `npm run dev`로 테스트
- [ ] Firebase 보안 규칙 배포 확인
- [ ] Netlify Functions 동작 확인

---

**이 문서는 코드 변경 시 함께 업데이트해야 합니다.**
