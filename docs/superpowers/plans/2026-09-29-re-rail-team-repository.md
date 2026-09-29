# re_rail Team Repository Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 `leesansa/re_rail`을 HTML·CSS·JavaScript 웹 프로젝트의 4인 협업 저장소로 정비한다.

**Architecture:** 기존 공개 저장소의 `main`에 협업 문서와 GitHub 템플릿을 추가한다. 세 팀원을 초대하고, 기본 파일이 모두 올라간 다음 `main` 보호 규칙과 병합 설정을 적용한다. 로컬 Git HTTPS 인증서 오류가 있으므로 GitHub 웹 편집기와 설정 화면을 사용한다.

**Tech Stack:** GitHub 저장소, Markdown, GitHub 이슈 양식 YAML, HTML/CSS/JavaScript

**Spec:** `docs/superpowers/specs/2026-09-29-re-rail-team-repository-design.md`

## Global Constraints

- 저장소 소유자 `leesansa`, 저장소 `re_rail`, 기본 브랜치 `main`, 공개 상태를 유지한다.
- 초대 대상은 `yeadm`, `cool-333`, `soonbub99`이다.
- 빌드 도구, 패키지 관리자, 배포, 라이선스, 필수 CI 검사는 추가하지 않는다.
- `main` 규칙은 PR과 승인 리뷰 1개를 요구하며 소유자 예외를 두지 않는다.
- 규칙 적용 전 기본 파일을 모두 커밋한다.

## Review Focus

- 초대 아이디가 비슷한 다른 계정으로 연결되지 않도록 프로필 아이디를 확인한다. Task 2에서 확인한다.
- 초대 수락 전에는 리뷰어가 없어 PR 병합이 막힐 수 있음을 사용자에게 알린다. Task 3에서 확인한다.
- 이슈 양식 YAML의 `name`, `description`, `body`가 유효해야 한다. Task 1에서 확인한다.
- `.gitignore`가 실제 소스 파일을 제외하지 않고 `.env`를 제외해야 한다. Task 1에서 확인한다.
- 규칙 모음은 `main`을 대상으로 활성화되어야 한다. Task 3에서 확인한다.

---

### Task 1: 협업 파일

**Files:**
- Modify: `README.md`
- Create: `CONTRIBUTING.md`, `.gitignore`, `.editorconfig`
- Create: `.github/PULL_REQUEST_TEMPLATE.md`
- Create: `.github/ISSUE_TEMPLATE/feature.yml`, `.github/ISSUE_TEMPLATE/bug.yml`

**Interfaces:** GitHub 이슈와 PR 생성 화면에서 템플릿을 표시한다. Task 3의 브랜치 규칙 적용 전에 모든 파일이 `main`에 있어야 한다.

- [ ] **Step 1: 파일 작성** — README에는 실제 기술과 현재 파일 구조, 시작 상태만 적는다. 기여 문서에는 이슈, `feat/<번호>-<이름>` 또는 `fix/<번호>-<이름>` 브랜치, PR, 다른 팀원 1명 리뷰, squash 병합을 적는다. PR 템플릿에는 요약·관련 이슈·확인 방법을 둔다. 이슈 양식은 기능과 오류를 구분한다.
- [ ] **Step 2: 제외·편집 설정 작성** — `.gitignore`에는 `.env`, `.env.*`, `!.env.example`, OS·편집기 임시 파일을 넣고 HTML/CSS/JS 소스는 제외하지 않는다. `.editorconfig`에는 UTF-8, LF, 2칸 들여쓰기, 마지막 줄바꿈을 넣는다.
- [ ] **Step 3: GitHub에 커밋** — 웹 편집기로 각 파일을 `main`에 커밋한다.
- [ ] **Step 4: 화면 확인** — 저장소 트리에서 7개 파일을 확인하고, 새 이슈 화면에서 기능·오류 양식이 보이는지 확인한다.
- [ ] **Step 5: 파일 확인** — 로컬에서 양식 YAML을 파싱하고 `.gitignore`가 `.env`를 제외하며 `.env.example`, `index.html`, `style.css`, `script.js`를 제외하지 않는지 확인한다.

### Task 2: 팀원 접근

**Files:** 없음. GitHub `Settings → Collaborators`를 변경한다.

**Interfaces:** Task 3의 리뷰 규칙을 활용할 팀원 세 명에게 초대를 전달한다.

- [ ] **Step 1: 계정 확인** — `yeadm`, `cool-333`, `soonbub99`의 GitHub 프로필 아이디가 정확한지 확인한다.
- [ ] **Step 2: 초대** — 세 계정을 `leesansa/re_rail` 협업자로 초대한다.
- [ ] **Step 3: 확인** — 접근 화면에서 세 계정의 초대 또는 수락 상태를 확인하고, 수락 전에는 병합 리뷰가 불가능할 수 있음을 기록한다.

### Task 3: 병합과 `main` 보호

**Files:** 없음. GitHub `Settings → General`과 `Settings → Rulesets`를 변경한다.

**Interfaces:** Task 1 파일과 Task 2 초대를 확인한 뒤 적용한다.

- [ ] **Step 1: 병합 설정** — squash 병합을 허용하고 merge commit·rebase 병합을 끈다. 병합 후 작업 브랜치 자동 삭제를 켠다.
- [ ] **Step 2: 규칙 모음** — 기본 브랜치 `main`을 대상으로 활성 규칙 모음을 만들고 PR, 승인 리뷰 1개, 브랜치 삭제 및 강제 푸시 금지를 설정한다. 우회 대상과 필수 상태 검사는 추가하지 않는다.
- [ ] **Step 3: 확인** — 일반 설정에서 squash와 자동 삭제를, 규칙 화면에서 대상 `main`, 활성 상태, 리뷰 수, 삭제·강제 푸시 금지를 확인한다. 저장소가 여전히 공개인지 확인한다.

## Completion

GitHub의 파일, 초대 상태, 병합 설정, 규칙 모음을 화면에서 다시 읽어 결과를 보고한다. 팀원의 초대 수락은 해당 팀원이 해야 하는 외부 단계로 구분한다.
