# 제안제도 시스템 PRD (Product Requirements Document)

**버전:** 2.1.0
**최종 업데이트:** 2025-01-27
**작성자:** 조성우
**프로젝트명:** 아주약품 제안제도 시스템

---

## 📋 목차

1. [제품 개요](#제품-개요)
2. [목표 및 목적](#목표-및-목적)
3. [사용자 페르소나](#사용자-페르소나)
4. [핵심 기능](#핵심-기능)
5. [사용자 플로우](#사용자-플로우)
6. [기술 스택](#기술-스택)
7. [시스템 아키텍처](#시스템-아키텍처)
8. [데이터 모델](#데이터-모델)
9. [보안 요구사항](#보안-요구사항)
10. [성능 요구사항](#성능-요구사항)
11. [UI/UX 요구사항](#uiux-요구사항)
12. [배포 및 운영](#배포-및-운영)
13. [테스트 체크리스트](#테스트-체크리스트)
14. [향후 개선 사항](#향후-개선-사항)

---

## 제품 개요

### 프로젝트 배경
아주약품의 직원들이 업무 개선 아이디어를 제안하고, 체계적인 심사 및 평가를 통해 혁신을 촉진하는 디지털 제안제도 시스템입니다.

### 핵심 가치
- **투명성**: 모든 제안의 진행 상황을 실시간으로 확인
- **효율성**: 종이 기반 프로세스를 디지털화하여 처리 속도 향상
- **공정성**: 다단계 심사 프로세스로 객관적 평가 보장
- **혁신**: AI 기반 분석으로 유형효과 검증 지원

### 주요 해결 과제
1. 제안서 제출 및 관리의 디지털화
2. 다단계 결재 라인 자동화
3. 유형효과 금액 검증 프로세스 체계화
4. 3단계 심사위원 평가 시스템 구현
5. 실시간 알림 및 진행 상황 추적

---

## 목표 및 목적

### 비즈니스 목표
1. **제안 처리 시간 50% 단축**: 평균 14일 → 7일 이내
2. **제안 건수 30% 증가**: 연간 100건 → 130건
3. **유형효과 검증 정확도 향상**: 금액 조정률 ±20% 이내 유지
4. **사용자 만족도 90% 이상**: 직원 설문조사 기준

### 기술 목표
1. **모바일 반응형 UI**: 모든 디바이스에서 원활한 사용
2. **실시간 동기화**: Firebase 실시간 데이터베이스 활용
3. **AI 기반 분석**: OpenAI API를 통한 유형효과 검증 지원
4. **오프라인 지원**: PWA 기능으로 오프라인 접근 가능
5. **99.9% 가용성**: Netlify CDN을 통한 안정적인 서비스

---

## 사용자 페르소나

### 1. 일반 직원 (제안자)
**이름**: 김직원
**역할**: 제안서 작성 및 제출
**목표**: 업무 개선 아이디어를 쉽게 제안하고 진행 상황 확인
**Pain Points**:
- 복잡한 양식 작성
- 진행 상황을 알 수 없음
- 피드백이 늦음

**주요 기능**:
- 제안서 작성 (임시저장 지원)
- 제출 현황 조회
- 실시간 알림 수신
- 평가 결과 확인

### 2. 리더/심사위원
**이름**: 박리더
**역할**: 1차/2차/3차 심사 및 평가
**목표**: 효율적이고 공정한 제안 평가
**Pain Points**:
- 평가 기준이 모호함
- 대기 중인 제안 건수 파악 어려움
- 반복적인 수정 요청

**주요 기능**:
- 대기 중인 제안 목록 확인
- 제안 상세 검토 및 평가
- 승인/반려/수정요청 처리
- 평가 통계 대시보드

### 3. 유형효과 검증담당자
**이름**: 최검증
**역할**: 제안의 금전적 효과 검증
**목표**: 정확한 금액 산정 및 유형효과 점수 부여
**Pain Points**:
- 제안자의 금액 산출 근거가 불충분
- 검증 기준 부재
- 반복적인 추가 자료 요청

**주요 기능**:
- AI 기반 금액 검증 기준 제시
- 예상 금액 vs 확정 금액 조정
- 유형효과 점수 자동 계산
- 검증 이력 관리

### 4. 시스템 관리자
**이름**: 이관리
**역할**: 시스템 설정 및 사용자 관리
**목표**: 원활한 시스템 운영 및 권한 관리
**Pain Points**:
- 사용자 권한 설정 복잡
- 결재 라인 변경 요청
- 데이터 백업 및 복구

**주요 기능**:
- 사용자 및 권한 관리
- 결재 라인 설정
- 부서 및 조직도 관리
- 시스템 설정 변경

---

## 핵심 기능

### 1. 인증 및 권한 관리

#### 1.1 로그인/회원가입
- **다중 인증 방식**:
  - 이메일/비밀번호
  - Google 소셜 로그인
  - Microsoft 소셜 로그인
- **비밀번호 재설정**: 이메일 기반 복구
- **세션 관리**: Firebase Authentication 활용

#### 1.2 역할 기반 접근 제어 (RBAC)
| 역할 | 권한 | 접근 페이지 |
|------|------|------------|
| user | 제안서 작성/조회 | dashboard.html |
| firstReviewer | 1차 심사 | leader.html |
| secondReviewer | 2차 심사 | leader.html |
| thirdReviewer | 3차 심사 | leader.html |
| effectVerifier | 유형효과 검증 | verifier.html |
| admin | 전체 관리 | admin.html |

#### 1.3 다중 역할 지원
- 사용자는 여러 역할을 동시에 보유 가능
- 예: 1차 심사위원 + 유형효과 검증담당자

---

### 2. 제안서 작성 및 관리 (dashboard.html)

#### 2.1 제안서 작성 폼
**필수 입력 항목**:
1. **기본 정보**
   - 제안 제목 (100자 이내)
   - 유형: 개선/신규
   - 카테고리: 생산성/품질/안전/비용절감/환경/기타

2. **결재 라인**
   - 일반 사용자: 자동 선택 (부서별)
   - 리더: 상위 결재라인 선택 가능

3. **제안 내용**
   - 기존 실시 내용 (현황)
   - 변경(신규) 내용 (개선안)
   - 실시 담당 부서 및 실시자
   - 실시 예정일
   - 실시 예상 기간

4. **유형효과** (선택)
   - 예상 절감 금액 (원/년)
   - 산출 근거 (텍스트)
   - 자동 검증 대상 여부

5. **자체평가**
   - 노력도 (0~30점)
     - 30점: 8일 이상의 노력, 매우 높은 업무 난이도
     - 25점: 4~7일 정도의 노력, 높은 업무 난이도
     - 20점: 2~3일 정도의 노력
     - 15점: 1일 정도의 노력
     - 10점: 1일 이하의 노력
     - 0점: 노력 미흡
   - 창의성 (0~15점)
     - 15점: 업계 최초의 혁신적 아이디어
     - 12점: 타 회사에 유사 사례가 있음 (최초 도입)
     - 10점: 우리 팀에 유사 사례가 있음
     - 7점: 타 팀에 유사 사례가 있음
     - 5점: 창의성 낮음
     - 0점: 창의성 없음

#### 2.2 임시저장 기능
- 작성 중인 제안서를 임시저장 (status: 'draft')
- 자동 저장 없음 (사용자 명시적 저장만)
- 임시저장 목록 관리

#### 2.3 제안서 제출
- 필수 항목 검증
- 제안번호 자동 생성: `SUG-YYYYMMDD-XXXX`
- 제출 시 status를 'pending'으로 변경
- 1차 심사위원에게 알림 발송

#### 2.4 제안서 목록 조회
**필터 옵션**:
- 전체
- 임시저장
- 결재대기
- 검토중
- 승인
- 반려

**표시 정보**:
- 제안번호
- 제목
- 제출일
- 상태 배지
- 진행률 표시

#### 2.5 제안서 수정
- 반려된 제안서만 수정 가능
- 수정 후 재제출 시 새로운 제안번호 부여
- 수정 이력 저장

---

### 3. 심사위원 평가 시스템 (leader.html)

#### 3.1 3단계 심사 프로세스
```
제안 제출 → 1차 심사 → 2차 심사 → 3차 심사 → 최종 승인
```

#### 3.2 심사위원 대시보드
**통계 카드**:
- 대기 중인 평가 건수
- 오늘 처리한 건수
- 이번 주 처리 건수
- 이번 달 처리 건수

#### 3.3 제안 평가 모달
**표시 정보**:
1. 제안 기본 정보
2. 제안 내용 (현황 및 개선안)
3. 유형효과 정보
   - 제안자 예상 금액
   - 검증자 확정 금액 (검증 완료 시)
   - 검증 의견
4. 자체평가 (총점 및 등급만 표시)

**평가 입력**:
1. **노력도 평가** (0~30점)
2. **창의성 평가** (0~15점)
3. **파급효과 평가** (0~10점)
   - 10점: 전사적 파급효과
   - 7점: 여러 부서 파급효과
   - 5점: 일부 부서 파급효과
   - 3점: 본인 부서만 파급효과
   - 0점: 파급효과 없음
4. **평가 의견** (텍스트)

**평가 결과**:
- 총점 = 노력도 + 창의성 + 파급효과 + 유형효과 점수
- 등급 자동 산정:
  - S등급: 90점 이상
  - A등급: 80~89점
  - B등급: 70~79점
  - C등급: 60~69점
  - D등급: 60점 미만

#### 3.4 평가 액션
- **승인**: 다음 단계로 진행
- **수정 요청**: 제안자에게 수정 사항 전달
- **반려**: 제안 거부 (사유 필수)

#### 3.5 평가 완료 제안 조회
- 승인한 제안 목록
- 평가 내역 확인
- 통계 분석

---

### 4. 유형효과 검증 시스템 (verifier.html)

#### 4.1 검증 대시보드
**통계**:
- 검증 대기 건수
- 오늘 검증 건수
- 월간 검증 건수
- 평균 조정률 (확정금액/예상금액)

#### 4.2 AI 기반 검증 기준 제시
**프롬프트 커스터마이징**:
- 기본 프롬프트 템플릿 제공
- 사용자 정의 프롬프트 저장 (localStorage)
- 변수 치환:
  - `{title}`: 제안 제목
  - `{proposer}`: 제안자
  - `{department}`: 부서
  - `{currentSituation}`: 현황
  - `{improvementPlan}`: 개선안
  - `{expectedSaving}`: 예상 절감액
  - `{savingBasis}`: 산출 근거

**OpenAI API 호출**:
- Netlify Functions를 통한 서버리스 호출
- GPT-4 모델 사용
- 응답 시간: 평균 5~10초

**AI 분석 결과**:
1. 예상 절감액 타당성 평가
2. 금액 산정 시 고려 요소
3. 적정 확정 금액 범위 제안
4. 추가 확인 필요 사항

#### 4.3 검증 프로세스
**입력 항목**:
1. **확정 금액** (원/년) - 필수
2. **유형효과 점수** - 자동 계산
   - 0~50만원: 15점
   - 50~100만원: 20점
   - 100~500만원: 25점
   - 500~1000만원: 30점
   - 1000~2000만원: 35점
   - 2000~3000만원: 40점
   - 3000~4000만원: 45점
   - 4000~5000만원: 50점
   - 5000만원 이상: 55점 (별도심사)
3. **금액 조정 사유** - 10% 이상 차이 시 필수
4. **검증 의견** - 선택

**검증 액션**:
- **검증 완료**: 확정 금액 저장 및 평가 단계로 진행
- **검증 불가**: 제안 반려 (사유 필수)
- **추가 자료 요청**: 제안자에게 알림

#### 4.4 검증 이력 관리
- 검증 완료 목록
- 예상금액 vs 확정금액 비교
- 조정률 통계
- 부서별 정확도 분석

---

### 5. 관리자 기능 (admin.html)

#### 5.1 사용자 관리
**기능**:
- 사용자 목록 조회
- 사용자 정보 수정
- 역할 할당/해제
- 계정 활성화/비활성화

**역할 관리**:
- user: 기본 사용자
- firstReviewer: 1차 심사위원
- secondReviewer: 2차 심사위원
- thirdReviewer: 3차 심사위원
- effectVerifier: 유형효과 검증담당자
- admin: 관리자

#### 5.2 결재 라인 관리
**결재 라인 구조**:
```javascript
{
  id: "line1",
  name: "일반 직원 결재라인",
  level: 1,
  reviewers: {
    first: { name: "1차 심사위원", role: "firstReviewer" },
    second: { name: "2차 심사위원", role: "secondReviewer" },
    third: { name: "3차 심사위원", role: "thirdReviewer" }
  }
}
```

**기능**:
- 결재 라인 생성/수정/삭제
- 심사위원 지정
- 결재 라인 순서 변경

#### 5.3 부서 관리
- 부서 추가/수정/삭제
- 부서별 사용자 할당
- 부서별 결재 라인 매핑

#### 5.4 시스템 설정
- 제안번호 형식 설정
- 알림 설정
- 평가 기준 설정
- 유형효과 점수 기준 설정

#### 5.5 통계 및 리포트
- 전체 제안 현황
- 부서별 제안 건수
- 평균 처리 시간
- 승인률/반려률
- 유형효과 총액

---

### 6. 알림 시스템

#### 6.1 알림 트리거
| 이벤트 | 수신자 | 내용 |
|--------|--------|------|
| 제안서 제출 | 1차 심사위원 | 새로운 제안 대기 중 |
| 1차 승인 | 2차 심사위원 | 1차 승인된 제안 대기 중 |
| 2차 승인 | 3차 심사위원 | 2차 승인된 제안 대기 중 |
| 수정 요청 | 제안자 | 수정 필요 사항 전달 |
| 반려 | 제안자 | 반려 사유 전달 |
| 최종 승인 | 제안자 | 제안 승인 완료 |
| 유형효과 검증 완료 | 제안자 | 확정 금액 안내 |
| 유형효과 검증 불가 | 제안자 | 검증 불가 사유 |

#### 6.2 알림 표시
- 실시간 푸시 알림 (브라우저 권한 필요)
- 인앱 알림 배지 (읽지 않은 개수)
- 알림 목록 페이지
- 알림 읽음 처리

---

### 7. 반응형 디자인

#### 7.1 브레이크포인트
- **Mobile**: < 768px
- **Tablet**: 768px ~ 1024px
- **Desktop**: > 1024px

#### 7.2 모바일 최적화
- 햄버거 메뉴 (사이드바 슬라이드)
- 터치 친화적 버튼 크기
- 스와이프 제스처 지원
- 세로 스크롤 최적화

#### 7.3 다크모드 (미구현)
- 시스템 다크모드 감지
- 수동 토글 옵션

---

## 사용자 플로우

### 플로우 1: 제안서 작성 및 제출
```
1. 로그인
2. 대시보드 접속
3. "새 제안서 작성" 클릭
4. 제안 정보 입력
   - 기본 정보
   - 결재 라인 선택 (리더만)
   - 제안 내용
   - 유형효과 (선택)
   - 자체평가
5. [임시저장] 또는 [제출]
6. 제출 완료 알림
7. 제안 목록에서 진행 상황 확인
```

### 플로우 2: 유형효과 검증
```
1. 검증담당자 로그인
2. verifier.html 접속
3. "검증 대기" 탭에서 제안 선택
4. "검증하기" 클릭
5. 제안 내용 검토
6. [AI 기준 요청하기] (선택)
   - 프롬프트 편집 (필요시)
   - AI 분석 결과 확인
7. 확정 금액 입력
8. 유형효과 점수 자동 계산 확인
9. 금액 조정 사유 입력 (10% 이상 차이 시)
10. 검증 의견 입력 (선택)
11. [검증 완료] 클릭
12. 제안자에게 알림 발송
13. 평가 단계로 진행
```

### 플로우 3: 3단계 심사
```
1. 심사위원 로그인
2. leader.html 접속
3. "대기 중인 평가" 탭 확인
4. 제안 선택 및 "평가하기" 클릭
5. 제안 내용 및 검증 정보 확인
6. 평가 점수 입력
   - 노력도
   - 창의성
   - 파급효과
7. 평가 의견 입력
8. [승인] / [수정요청] / [반려] 선택
9. 다음 단계 심사위원에게 알림 (승인 시)
   또는 제안자에게 알림 (수정요청/반려 시)
10. 평가 완료 목록에 추가
```

### 플로우 4: 관리자 설정
```
1. 관리자 로그인
2. admin.html 접속
3. [사용자 관리] 탭
   - 사용자 검색
   - 역할 할당/해제
4. [결재 라인 관리] 탭
   - 새 결재 라인 생성
   - 심사위원 지정
5. [부서 관리] 탭
   - 부서 추가/수정
6. [통계] 탭
   - 전체 현황 확인
```

---

## 기술 스택

### Frontend
- **HTML5**: 시맨틱 마크업
- **CSS3**:
  - Flexbox, Grid 레이아웃
  - CSS Variables (색상 테마)
  - CSS Animations (부드러운 전환)
  - 반응형 디자인 (Media Queries)
- **JavaScript (Vanilla ES6+)**:
  - 모듈 패턴
  - Async/Await
  - Promise
  - Event Delegation
  - LocalStorage API

### Backend & Database
- **Firebase**:
  - **Authentication**: 사용자 인증 및 세션 관리
  - **Firestore**: NoSQL 실시간 데이터베이스
  - **Security Rules**: 역할 기반 접근 제어
  - **Offline Persistence**: 오프라인 캐싱

### Serverless Functions
- **Netlify Functions**:
  - Node.js 18
  - OpenAI API 프록시
  - 환경 변수 관리

### External APIs
- **OpenAI API**:
  - GPT-4 모델
  - 유형효과 검증 기준 분석

### DevOps & Deployment
- **Netlify**:
  - CDN 호스팅
  - 자동 배포 (Git Push)
  - HTTPS 자동 인증서
  - 환경 변수 관리
  - Functions 지원

### Version Control
- **Git**: 버전 관리
- **GitHub** (또는 GitLab): 원격 저장소

---

## 시스템 아키텍처

### 아키텍처 다이어그램
```
┌─────────────┐
│   Browser   │
│  (Client)   │
└──────┬──────┘
       │
       │ HTTPS
       │
┌──────▼──────────────────────────────────────┐
│         Netlify CDN                          │
│  ┌────────────┐  ┌────────────────────────┐ │
│  │ Static     │  │ Netlify Functions      │ │
│  │ Files      │  │ (Serverless)           │ │
│  │ (HTML/CSS/ │  │ - openai-analyze.js    │ │
│  │  JS)       │  └───────┬────────────────┘ │
│  └────────────┘          │                   │
└───────┬──────────────────┼───────────────────┘
        │                  │
        │                  │ HTTPS
        │                  │
        │            ┌─────▼──────┐
        │            │  OpenAI    │
        │            │  API       │
        │            └────────────┘
        │
        │ Firebase SDK
        │
┌───────▼─────────────────────────┐
│   Firebase Backend              │
│  ┌──────────────────────────┐   │
│  │  Authentication          │   │
│  │  - Email/Password        │   │
│  │  - Google OAuth          │   │
│  │  - Microsoft OAuth       │   │
│  └──────────────────────────┘   │
│  ┌──────────────────────────┐   │
│  │  Firestore Database      │   │
│  │  - users                 │   │
│  │  - suggestions           │   │
│  │  - notifications         │   │
│  │  - departments           │   │
│  │  - approvalLines         │   │
│  └──────────────────────────┘   │
│  ┌──────────────────────────┐   │
│  │  Security Rules          │   │
│  │  - RBAC                  │   │
│  └──────────────────────────┘   │
└─────────────────────────────────┘
```

### 데이터 플로우
```
제안서 작성 플로우:
Client → Firestore (suggestions collection) → 실시간 업데이트

알림 플로우:
Firestore 변경 감지 → Client 리스너 → 알림 표시

AI 검증 플로우:
Client → Netlify Function → OpenAI API → Response → Client
```

---

## 데이터 모델

### Collections 구조

#### 1. users
```javascript
{
  uid: "firebase-auth-uid",              // 문서 ID
  email: "user@example.com",
  displayName: "홍길동",
  employeeId: "EMP001",
  department: "생산팀",
  position: "대리",
  roles: ["user", "firstReviewer"],      // 다중 역할
  role: "user",                           // 레거시 호환
  isEvaluator: false,                     // 레거시 호환
  leaderLevel: 0,                         // 레거시 호환 (1/2/3)
  approvalLine: "line1",                  // 결재라인 ID
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### 2. suggestions
```javascript
{
  id: "auto-generated-id",                // 문서 ID
  suggestionNumber: "SUG-20250127-0001",
  userId: "firebase-auth-uid",
  proposer: "홍길동",
  employeeId: "EMP001",
  department: "생산팀",
  email: "user@example.com",

  // 기본 정보
  title: "작업 공정 개선 제안",
  type: "개선",                            // 개선/신규
  category: "생산성",                      // 생산성/품질/안전/비용절감/환경/기타

  // 결재 라인
  approvalLine: "line1",

  // 제안 내용
  currentSituation: "현재 작업 방식...",
  improvementPlan: "개선된 작업 방식...",
  implementationDepartment: "생산팀",
  implementer: "홍길동",
  scheduledDate: Timestamp,
  estimatedDuration: "1개월",

  // 유형효과
  hasTypicalEffect: true,
  expectedSaving: 5000000,                // 원/년
  savingBasis: "연간 절감액 산출 근거...",

  // 유형효과 검증
  effectVerification: {
    needsVerification: true,
    status: "pending",                    // pending/completed/rejected
    originalAmount: 5000000,
    verifiedAmount: 4500000,
    typicalEffectScore: 30,
    adjustmentReason: "실제 적용 범위 조정",
    verificationNote: "검증 의견...",
    verifierId: "EMP999",
    verifierName: "최검증",
    verifiedAt: Timestamp
  },

  // 자체평가
  selfEvaluation: {
    effort: 25,                           // 0~30
    creativity: 12,                       // 0~15
    total: 37,
    grade: "B"
  },

  // 심사 평가
  reviews: {
    first: {
      reviewerId: "EMP101",
      reviewerName: "김심사",
      effort: 28,
      creativity: 14,
      impact: 10,
      typicalEffect: 30,
      total: 82,
      grade: "A",
      comment: "우수한 제안입니다.",
      status: "approved",                 // approved/rejected/revision
      reviewedAt: Timestamp
    },
    second: { /* 동일 구조 */ },
    third: { /* 동일 구조 */ }
  },

  // 최종 평가
  finalScore: 82,
  finalGrade: "A",

  // 상태 관리
  status: "pending",                      // draft/pending/reviewing/approved/rejected
  currentReviewLevel: 1,                  // 1/2/3

  // 타임스탬프
  createdAt: Timestamp,
  updatedAt: Timestamp,
  submittedAt: Timestamp,
  completedAt: Timestamp
}
```

#### 3. notifications
```javascript
{
  id: "auto-generated-id",
  userId: "firebase-auth-uid",            // 수신자 UID
  title: "새로운 제안 대기 중",
  message: "SUG-20250127-0001 제안서를 검토해주세요.",
  type: "review",                         // review/verification/approval/rejection
  suggestionId: "suggestion-doc-id",      // 관련 제안 ID
  read: false,
  createdAt: Timestamp
}
```

#### 4. departments
```javascript
{
  id: "dept001",
  name: "생산팀",
  code: "PROD",
  approvalLine: "line1",
  headEmployeeId: "EMP101",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### 5. approvalLines
```javascript
{
  id: "line1",
  name: "일반 직원 결재라인",
  level: 1,
  reviewers: {
    first: {
      name: "1차 심사위원",
      role: "firstReviewer",
      employeeIds: ["EMP101", "EMP102"]
    },
    second: {
      name: "2차 심사위원",
      role: "secondReviewer",
      employeeIds: ["EMP201", "EMP202"]
    },
    third: {
      name: "3차 심사위원",
      role: "thirdReviewer",
      employeeIds: ["EMP301"]
    }
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // 헬퍼 함수
    function isAuthenticated() {
      return request.auth != null;
    }

    function hasRole(role) {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid))
             .data.roles.hasAny([role]);
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // users 컬렉션
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isOwner(userId) || hasRole('admin');
      allow delete: if hasRole('admin');
    }

    // suggestions 컬렉션
    match /suggestions/{suggestionId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isOwner(resource.data.userId) ||
                       hasRole('admin') ||
                       hasRole('firstReviewer') ||
                       hasRole('secondReviewer') ||
                       hasRole('thirdReviewer') ||
                       hasRole('effectVerifier');
      allow delete: if hasRole('admin');
    }

    // notifications 컬렉션
    match /notifications/{notificationId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if isAuthenticated();
      allow update: if isOwner(resource.data.userId);
      allow delete: if isOwner(resource.data.userId) || hasRole('admin');
    }

    // departments 컬렉션
    match /departments/{deptId} {
      allow read: if isAuthenticated();
      allow write: if hasRole('admin');
    }

    // approvalLines 컬렉션
    match /approvalLines/{lineId} {
      allow read: if isAuthenticated();
      allow write: if hasRole('admin');
    }
  }
}
```

---

## 보안 요구사항

### 1. 인증 및 권한
- ✅ Firebase Authentication으로 사용자 인증
- ✅ 역할 기반 접근 제어 (RBAC)
- ✅ 페이지별 권한 검증
- ✅ Firestore Security Rules 적용

### 2. 데이터 보호
- ✅ HTTPS 강제 (Netlify 자동 설정)
- ✅ 환경 변수로 API 키 관리
- ✅ 클라이언트에서 API 키 노출 방지 (Netlify Functions 사용)
- ✅ XSS 방지: 사용자 입력 sanitization
- ✅ CSRF 방지: Firebase SDK 내장 토큰

### 3. API 보안
- ✅ OpenAI API 키를 서버사이드에서만 사용
- ✅ CORS 설정 (Netlify Functions)
- ✅ Rate Limiting (OpenAI API 자체 제한)

### 4. 세션 관리
- ✅ Firebase 세션 자동 관리
- ✅ 토큰 만료 처리
- ✅ 로그아웃 시 세션 정리

### 5. 입력 검증
- ✅ 클라이언트 측 폼 검증
- ✅ Firestore Rules로 서버 측 검증
- ✅ SQL Injection 방지 (NoSQL 사용으로 해당 없음)

---

## 성능 요구사항

### 1. 로딩 성능
| 지표 | 목표 | 측정 방법 |
|------|------|-----------|
| 초기 로딩 시간 | < 2초 | Lighthouse |
| Time to Interactive | < 3초 | Lighthouse |
| First Contentful Paint | < 1.5초 | Lighthouse |

### 2. 데이터베이스 성능
- ✅ Firestore 인덱스 최적화
- ✅ 쿼리 결과 제한 (limit 50~100)
- ✅ Offline Persistence 활성화
- ✅ 실시간 리스너 최소화

### 3. 네트워크 최적화
- ✅ CDN 사용 (Netlify)
- ✅ Gzip 압축 (자동)
- ✅ 이미지 최적화 (현재 이미지 없음)
- ✅ 코드 미니파이 (배포 시)

### 4. Firebase 사용 최적화
**읽기 횟수 절감**:
- ✅ 캐싱 활성화 (db.enablePersistence())
- ✅ 불필요한 리스너 제거
- ✅ 조건부 쿼리 사용
- ✅ 페이지네이션 구현

**예상 월간 비용** (무료 플랜 기준):
- 읽기: 50,000회 (무료 한도: 50,000)
- 쓰기: 20,000회 (무료 한도: 20,000)
- 삭제: 1,000회 (무료 한도: 20,000)
- 스토리지: < 1GB (무료 한도: 1GB)

---

## UI/UX 요구사항

### 1. 디자인 시스템

#### 색상 팔레트
```css
/* Primary Colors */
--primary-start: #0ea5e9;      /* Sky Blue */
--primary-end: #2dd4bf;        /* Teal */

/* Gradient Background */
--bg-gradient: linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%);

/* Status Colors */
--success: #28a745;
--warning: #ffc107;
--danger: #dc3545;
--info: #17a2b8;

/* Neutral Colors */
--gray-50: #f8f9fa;
--gray-100: #e9ecef;
--gray-200: #dee2e6;
--gray-300: #ced4da;
--gray-600: #6c757d;
--gray-900: #212529;
```

#### 타이포그래피
```css
/* Font Family */
font-family: 'Pretendard', -apple-system, BlinkMacSystemFont,
             'Segoe UI', Roboto, 'Noto Sans KR', sans-serif;

/* Font Sizes */
--font-xs: 12px;
--font-sm: 14px;
--font-md: 16px;
--font-lg: 18px;
--font-xl: 24px;
--font-2xl: 32px;
```

#### 간격 시스템
```css
--space-xs: 8px;
--space-sm: 12px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
--space-2xl: 48px;
```

### 2. 컴포넌트 스타일

#### 버튼
- **Primary Button**: 그라디언트 배경, 흰색 텍스트, 호버 시 상승 효과
- **Secondary Button**: 회색 배경, 검정 텍스트
- **Danger Button**: 빨강 배경, 흰색 텍스트
- **크기**: sm (6px 12px), md (10px 20px), lg (12px 24px)

#### 카드
- **배경**: 반투명 흰색 (rgba(255, 255, 255, 0.95))
- **테두리 반경**: 12px ~ 16px
- **그림자**: 0 4px 20px rgba(0,0,0,0.08)
- **호버 효과**: 상승 및 그림자 강화

#### 폼 입력
- **테두리**: 2px solid #e2e8f0
- **포커스**: border-color #0ea5e9, box-shadow
- **배경**: #f8fafc → white (포커스 시)
- **패딩**: 12px ~ 16px

### 3. 반응형 레이아웃
```css
/* Mobile First */
@media (max-width: 768px) {
  /* 사이드바 숨김, 햄버거 메뉴 표시 */
  /* 단일 컬럼 레이아웃 */
  /* 터치 친화적 버튼 크기 (최소 44px) */
}

@media (min-width: 769px) and (max-width: 1024px) {
  /* 태블릿 최적화 */
  /* 2단 그리드 */
}

@media (min-width: 1025px) {
  /* 데스크탑 */
  /* 사이드바 고정 */
  /* 3~4단 그리드 */
}
```

### 4. 애니메이션
- **페이지 전환**: fadeIn 0.3s ease
- **버튼 호버**: transform translateY(-2px) 0.3s
- **모달**: opacity 및 scale 전환
- **알림**: slide-in from right

### 5. 접근성 (A11y)
- ✅ 시맨틱 HTML 사용
- ⚠️ ARIA 레이블 부분 적용 (개선 필요)
- ✅ 키보드 네비게이션 지원
- ⚠️ 색상 대비 (일부 개선 필요)
- ❌ 스크린 리더 지원 (미구현)

---

## 배포 및 운영

### 1. 배포 프로세스

#### 초기 배포
```bash
# 1. Git 저장소 초기화
git init
git add .
git commit -m "Initial commit"
git remote add origin <repository-url>
git push -u origin main

# 2. Netlify CLI 설치
npm install -g netlify-cli

# 3. Netlify 로그인
netlify login

# 4. 사이트 초기화
netlify init

# 5. 환경 변수 설정 (Netlify 대시보드)
# OPENAI_API_KEY=<your-api-key>

# 6. 배포
netlify deploy --prod
```

#### 지속적 배포 (CI/CD)
- **트리거**: main 브랜치에 push
- **자동 빌드**: Netlify 자동 감지
- **배포 시간**: 평균 1~2분
- **롤백**: Netlify 대시보드에서 이전 버전으로 복구 가능

### 2. 환경 변수
| 변수명 | 설명 | 설정 위치 |
|--------|------|-----------|
| OPENAI_API_KEY | OpenAI API 키 | Netlify Environment Variables |

### 3. 모니터링
- **가용성**: Netlify 자동 모니터링
- **오류 추적**: 브라우저 콘솔 로그 (Sentry 미적용)
- **사용량**: Firebase 콘솔에서 확인

### 4. 백업 전략
- **코드**: Git 저장소 (원격 백업)
- **데이터**: Firestore 자동 백업 (Firebase 설정)
- **빈도**: 실시간 동기화

### 5. 업데이트 프로세스
```bash
# 1. 변경 사항 커밋
git add .
git commit -m "Feature: Add dark mode"
git push origin main

# 2. Netlify 자동 배포 대기 (1~2분)

# 3. 배포 확인
# Netlify 대시보드 또는 사이트 접속
```

---

## 테스트 체크리스트

### 기능 테스트

#### 인증
- [ ] 이메일/비밀번호 로그인 성공
- [ ] Google 소셜 로그인 성공
- [ ] Microsoft 소셜 로그인 성공
- [ ] 잘못된 비밀번호 시 오류 표시
- [ ] 비밀번호 재설정 이메일 발송
- [ ] 로그아웃 기능
- [ ] 세션 유지 확인

#### 제안서 작성 (dashboard.html)
- [ ] 새 제안서 작성 폼 열기
- [ ] 모든 필드 입력 가능
- [ ] 결재 라인 자동 선택 (일반 사용자)
- [ ] 결재 라인 수동 선택 (리더)
- [ ] 유형효과 체크박스 동작
- [ ] 자체평가 점수 계산
- [ ] 임시저장 기능
- [ ] 제출 버튼 동작
- [ ] 필수 항목 미입력 시 경고
- [ ] 제안번호 자동 생성 확인

#### 제안서 목록
- [ ] 전체 제안 조회
- [ ] 임시저장 필터
- [ ] 결재대기 필터
- [ ] 검토중 필터
- [ ] 승인 필터
- [ ] 반려 필터
- [ ] 상세보기 모달 열기
- [ ] 수정 버튼 (반려 상태만)

#### 심사위원 평가 (leader.html)
- [ ] 대기 중인 평가 목록 조회
- [ ] 평가 모달 열기
- [ ] 제안 내용 표시
- [ ] 검증 정보 표시 (검증 완료 시)
- [ ] 자체평가 총점/등급 표시
- [ ] 평가 점수 입력
- [ ] 총점 자동 계산
- [ ] 등급 자동 산정
- [ ] 승인 버튼 동작
- [ ] 수정요청 버튼 동작
- [ ] 반려 버튼 동작
- [ ] 알림 발송 확인

#### 유형효과 검증 (verifier.html)
- [ ] 검증 대기 목록 조회
- [ ] 검증 모달 열기
- [ ] AI 프롬프트 편집 모달 열기
- [ ] 프롬프트 변수 치환 확인
- [ ] AI 분석 요청 성공
- [ ] AI 분석 결과 표시
- [ ] 확정 금액 입력
- [ ] 유형효과 점수 자동 계산
- [ ] 금액 조정 사유 필수 검증 (10% 이상 차이)
- [ ] 검증 완료 버튼 동작
- [ ] 검증 불가 버튼 동작
- [ ] 추가 자료 요청 버튼 동작
- [ ] 검증 이력 조회

#### 관리자 (admin.html)
- [ ] 사용자 목록 조회
- [ ] 사용자 역할 할당
- [ ] 사용자 역할 해제
- [ ] 결재 라인 조회
- [ ] 결재 라인 생성
- [ ] 결재 라인 수정
- [ ] 부서 관리
- [ ] 통계 조회

#### 알림
- [ ] 제안 제출 시 1차 심사위원 알림
- [ ] 1차 승인 시 2차 심사위원 알림
- [ ] 2차 승인 시 3차 심사위원 알림
- [ ] 수정요청 시 제안자 알림
- [ ] 반려 시 제안자 알림
- [ ] 최종 승인 시 제안자 알림
- [ ] 검증 완료 시 제안자 알림
- [ ] 알림 배지 숫자 표시
- [ ] 알림 읽음 처리

### 성능 테스트
- [ ] 페이지 로딩 시간 < 2초
- [ ] 대용량 데이터 조회 (100개 이상)
- [ ] 동시 접속 테스트 (10명 이상)
- [ ] 오프라인 모드 동작 확인
- [ ] 실시간 데이터 동기화

### 반응형 테스트
- [ ] 모바일 (< 768px) 레이아웃
- [ ] 태블릿 (768px ~ 1024px) 레이아웃
- [ ] 데스크탑 (> 1024px) 레이아웃
- [ ] 햄버거 메뉴 동작 (모바일)
- [ ] 터치 제스처 (모바일)

### 브라우저 호환성
- [ ] Chrome (최신 버전)
- [ ] Firefox (최신 버전)
- [ ] Safari (최신 버전)
- [ ] Edge (최신 버전)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### 보안 테스트
- [ ] 비인증 사용자 페이지 접근 차단
- [ ] 권한 없는 사용자 기능 접근 차단
- [ ] XSS 공격 방어 확인
- [ ] Firestore Security Rules 동작 확인
- [ ] API 키 노출 방지 확인

---

## 향후 개선 사항

### Phase 2: 추가 기능
1. **이메일 알림**: Firebase Cloud Functions로 이메일 발송
2. **파일 첨부**: 제안서에 이미지/문서 첨부 (Firebase Storage)
3. **댓글 시스템**: 제안서에 댓글 달기 기능
4. **버전 관리**: 제안서 수정 이력 추적
5. **검색 기능**: 제목/내용/제안자로 검색
6. **고급 필터**: 날짜 범위, 부서, 등급 등 복합 필터
7. **엑셀 내보내기**: 제안 목록 Excel 다운로드
8. **대시보드 차트**: 통계를 그래프로 시각화
9. **다크모드**: 사용자 선택 가능한 다크 테마
10. **PWA 기능 강화**: 오프라인 작성, 푸시 알림

### Phase 3: 고급 기능
1. **AI 자동 평가**: 제안 내용 분석 및 등급 제안
2. **챗봇 지원**: 제안서 작성 가이드 챗봇
3. **워크플로우 자동화**: Zapier/n8n 연동
4. **다국어 지원**: 영어/중국어 등
5. **모바일 앱**: React Native 또는 Flutter
6. **BI 대시보드**: Tableau/Power BI 연동
7. **음성 입력**: Web Speech API 활용
8. **OCR 기능**: 종이 제안서 스캔 및 자동 입력

### 기술 부채 해결
1. **코드 리팩토링**: 모듈화 및 재사용성 향상
2. **타입스크립트 전환**: 타입 안정성 확보
3. **테스트 자동화**: Jest/Cypress 도입
4. **에러 트래킹**: Sentry 연동
5. **성능 모니터링**: Google Analytics, Lighthouse CI
6. **접근성 개선**: WCAG 2.1 AA 준수
7. **SEO 최적화**: 메타 태그, 사이트맵
8. **문서화**: JSDoc, API 문서

---

## 부록

### A. 변경 이력

#### v2.1.0 (2025-01-27)
- 실시자 디폴트 설정 (제안자 정보 자동 입력)
- 우선순위 항목 삭제
- 유형효과 안내 멘트 수정
- 자체평가 항목 텍스트 상세화
- 유형효과 산출근거 500자 제한 제거
- 리더 결재라인 선택 기능 추가
- 자체평가 표시 간소화 (leader.html)
- 평가항목 텍스트 상세화 (leader.html)
- 유형효과 검증 결과 표시 기능 추가 (leader.html)
- 반려 버튼 오류 수정
- loadAllData 함수 추가

#### v2.0.0 (2025-01-20)
- 다중 역할 시스템 구현
- 유형효과 검증 시스템 추가
- AI 기반 검증 기준 제시 기능
- 3단계 심사 프로세스 구현
- 실시간 알림 시스템
- 반응형 디자인 개선

#### v1.0.0 (2024-10-20)
- 초기 버전 릴리스
- 기본 제안서 작성 기능
- 단일 결재 라인
- Firebase Authentication 연동

### B. 용어 사전
| 용어 | 설명 |
|------|------|
| 제안서 | 직원이 작성하는 업무 개선 아이디어 문서 |
| 결재 라인 | 제안서가 통과해야 하는 심사 단계 |
| 유형효과 | 제안으로 인한 금전적 절감 효과 |
| 자체평가 | 제안자가 스스로 평가하는 노력도/창의성 점수 |
| 심사위원 | 제안을 평가하는 리더 (1차/2차/3차) |
| 검증담당자 | 유형효과 금액을 검증하는 담당자 |
| RBAC | 역할 기반 접근 제어 (Role-Based Access Control) |
| Firestore | Google의 NoSQL 클라우드 데이터베이스 |
| Netlify Functions | 서버리스 함수 실행 플랫폼 |

### C. 주요 파일 목록
```
project-root/
├── index.html                    # 로그인 페이지
├── dashboard.html                # 사용자 대시보드
├── leader.html                   # 심사위원 페이지
├── verifier.html                 # 검증담당자 페이지
├── admin.html                    # 관리자 페이지
├── add-admin.html                # 관리자 추가 페이지
├── reset-admin-password.html     # 비밀번호 재설정
├── netlify.toml                  # Netlify 설정
├── netlify/
│   └── functions/
│       └── openai-analyze.js     # OpenAI API 프록시
├── dist/                         # 배포용 빌드 파일
├── PRD.md                        # 이 문서
└── README.md                     # 프로젝트 설명
```

### D. 연락처 및 지원
- **개발자**: 조성우
- **이메일**: [your-email@example.com]
- **프로젝트 저장소**: [repository-url]
- **Netlify 사이트**: [site-url]

---

**문서 종료**
