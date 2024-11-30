# 기능 개발 워크플로우

## 개요

이 문서는 프로젝트에서 새로운 기능을 개발하는 단계별 프로세스를 설명합니다.

## 워크플로우 단계

### 1. 요구사항 분석

- 템플릿 디렉토리 복사: `cp -r docs/features/_template docs/features/{기능명}`
- 프로젝트 컨텍스트 리뷰: `docs/project`
- `requirements.md` 업데이트: 기능 요구사항
- 사용자 확인 후 진행

### 2. 작업 분해 (WBS)

- 상세 작업 목록 작성: `todo.md`
- 포함 항목:
  - 수정 파일
  - 새 파일 생성
  - 테스트 요구사항:
    - E2E 테스트 위주로 작성
    - 실제 사용 시나리오 기반 테스트 케이스
    - 테스트 데이터 준비 방법
    - 관련 테스트 파일 경로
- 사용자 확인 후 진행

### 3. 구현

- `todo.md` 작업 수행
- 완료 작업 표시
- E2E 테스트 코드 작성 및 실행
- 구현 중 발생한 변경사항 문서화

### 4. 문서화

- `changes.md` 업데이트: 구현 세부사항
- 프로젝트 수준 문서화 업데이트
- 문서화 항목:
  - 주요 변경사항
  - 수정 파일
  - 테스트 결과
- 사용자 확인

### 5. 커밋

- 모든 변경사항 리뷰
- 커밋 메시지 작성
- 기능 문서 포함
- 관리작업(ex: todo에 마크함)은 로그에서 제외

## 개발 가이드라인

### Step-by-Step 개발

기능 구현은 반드시 단계별로 진행하고, 각 단계마다 사용자의 확인을 받아야 합니다:

1. **모듈 단위 개발**

   - Controller
   - Service
   - DTO
   - E2E 테스트
     각 모듈은 독립적으로 개발하고 검증. 각 모듈의 구현 순서는 위와 같지 않아도 되지만, 한 번에 하나씩 사용자의 확인을 받도록 함.

2. **단계별 진행**

   - 각 단계 완료 후 사용자 확인
   - 다음 단계 진행 전 피드백 반영
   - 필요시 이전 단계 수정

3. **테스트 주도 개발**
   - E2E 테스트 작성

### 패턴 일관성 유지

프로젝트의 일관성을 위해 다음 사항을 준수해야 합니다:

1. **기존 패턴 분석**

   - 유사한 기존 모듈 확인
   - 네이밍 컨벤션 준수
   - 파일 구조 동일하게 유지

2. **코드 스타일**

   - 기존 코드의 들여쓰기 방식 유지
   - 오류 처리 패턴 통일
   - 로깅 형식 일관성 유지

3. **아키텍처 일관성**

   - 계층 구조 준수 (Controller-Service)
   - 의존성 주입 패턴 유지
   - 모듈 구성 방식 통일

4. **테스트 패턴**
   - 기존 테스트 구조 따르기
   - 테스트 헬퍼 활용 방식 통일
   - 테스트 데이터 준비 방식 일관성 유지

## 문서화 원칙

### 1.1 인터페이스 중심 문서화

- 구체적인 구현 코드보다는 인터페이스와 타입 정의에 집중
- 구현이 자주 변경될 수 있는 부분은 상세 구현 대신 인터페이스 명세로 대체
- 구현 세부사항은 코드 내 주석이나 테스트로 문서화

### 1.2 문서 구조화

- 문서를 논리적이고 일관된 방식으로 구성
- 명확한 제목과 섹션을 사용하여 쉽게 탐색할 수 있도록 구성

## 모범 사례

- 각 단계마다 사용자 확인
- 문서 최신 상태 유지
- 컨텍스트와 의사결정 과정 기록
- 테스트 지침 포함

## 작업 원칙

다음의 내용을 **반드시** 지키도록 함.

- 사용자를 개발 전문가로 대할 것
- 사용자가 제공하지 않은 요청의 경우 확인받고 진행
- 문서에서 모범사례 제공하지 말 것
- 코드로 있는 내용은 문서에서 제외, 레퍼런스만 제공