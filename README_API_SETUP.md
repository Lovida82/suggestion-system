# OpenAI API 환경변수 설정 가이드

## 개요
이 프로젝트는 OpenAI API를 사용하여 유형효과 검증 분석을 제공합니다. 보안을 위해 API 키는 환경변수로 관리됩니다.

## Netlify 배포 시 환경변수 설정

### 1. Netlify 대시보드 접속
1. [Netlify](https://app.netlify.com)에 로그인
2. 해당 사이트 선택

### 2. 환경변수 추가
1. **Site settings** 클릭
2. 좌측 메뉴에서 **Environment variables** 선택
3. **Add a variable** 버튼 클릭
4. 다음 정보 입력:
   - **Key**: `OPENAI_API_KEY`
   - **Value**: 실제 OpenAI API 키 입력
   - **Scopes**: 모든 환경 선택 (Production, Deploy Previews, Branch deploys)
5. **Create variable** 클릭

### 3. 재배포
환경변수 추가 후 사이트를 재배포하여 변경사항 적용:
1. **Deploys** 탭으로 이동
2. **Trigger deploy** → **Deploy site** 클릭

## 로컬 개발 환경 설정

### 1. 필수 패키지 설치
```bash
npm install
```

### 2. 환경변수 파일 생성
프로젝트 루트에 `.env` 파일 생성:
```bash
# .env
OPENAI_API_KEY=your-actual-openai-api-key-here
```

⚠️ **중요**: `.env` 파일은 절대 Git에 커밋하지 마세요! (`.gitignore`에 이미 추가됨)

### 3. Netlify CLI로 로컬 개발 서버 실행
```bash
npm run dev
```

또는 직접 실행:
```bash
netlify dev
```

이렇게 하면 Netlify Functions가 로컬에서도 작동합니다.

## API 키 발급 방법

### OpenAI API 키 발급
1. [OpenAI Platform](https://platform.openai.com)에 로그인
2. 우측 상단 프로필 → **View API keys** 클릭
3. **Create new secret key** 클릭
4. 키 이름 입력 (예: suggestion-system)
5. 생성된 키 복사 (한 번만 표시되므로 안전하게 보관)

## 작동 방식

### 기존 방식 (보안 취약)
```javascript
// 클라이언트에서 직접 OpenAI API 호출 (API 키 노출 위험)
const response = await fetch('https://api.openai.com/v1/chat/completions', {
    headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}` // ❌ 브라우저에서 볼 수 있음
    }
});
```

### 새로운 방식 (보안)
```javascript
// 클라이언트에서 Netlify Function 호출 (API 키 숨김)
const response = await fetch('/.netlify/functions/openai-analyze', {
    method: 'POST',
    body: JSON.stringify({ suggestionData })
});
```

Netlify Function이 서버 측에서 OpenAI API를 호출하므로 API 키가 클라이언트에 노출되지 않습니다.

## 문제 해결

### 함수가 작동하지 않는 경우
1. Netlify 대시보드에서 환경변수가 올바르게 설정되었는지 확인
2. Functions 탭에서 배포 로그 확인
3. 브라우저 콘솔에서 오류 메시지 확인

### 로컬에서 작동하지 않는 경우
1. `.env` 파일이 프로젝트 루트에 있는지 확인
2. `node_modules` 설치 여부 확인: `npm install`
3. `netlify dev` 명령어로 실행하는지 확인 (일반 웹 서버로는 Functions 작동 안 함)

## 비용 관리

OpenAI API는 사용량에 따라 과금됩니다:
- GPT-4 모델 사용 시 비용이 발생
- [OpenAI Pricing](https://openai.com/pricing) 참조
- 사용량 제한 설정 권장: OpenAI Dashboard → Usage limits

## 보안 모범 사례

1. ✅ API 키를 절대 코드에 직접 작성하지 않기
2. ✅ `.env` 파일을 `.gitignore`에 추가
3. ✅ Netlify Functions 같은 서버리스 함수 사용
4. ✅ API 키 정기적으로 갱신
5. ✅ OpenAI 대시보드에서 사용량 모니터링

## 추가 정보

- [Netlify Functions 문서](https://docs.netlify.com/functions/overview/)
- [Netlify 환경변수 문서](https://docs.netlify.com/environment-variables/overview/)
- [OpenAI API 문서](https://platform.openai.com/docs/api-reference)
