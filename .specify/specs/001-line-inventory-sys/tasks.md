# Tasks: 陪伴服務材料包庫存管理系統 V7.0 (LINE 整合版)

**Input**: Design documents from `.specify/specs/001-line-inventory-sys/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `quickstart.md`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 建立專案基礎結構：建立 `frontend` 與 `firebase/functions` 雙目錄 (`frontend/package.json`, `firebase/package.json`)
- [x] T002 初始化 React 專案與依賴 (`frontend`)
- [x] T003 [P] 設定 Firebase Admin SDK 與 Firebase Functions 環境 (`firebase/functions/src/index.ts`)
- [x] T004 [P] 設定前端與後端的 Linting / Prettier 工具

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 設定 Firebase Firestore 資料庫安全規則 (`firebase/firestore.rules`)
- [x] T006 [P] 設定 Firebase Storage 檔案讀寫安全規則 (`firebase/storage.rules`)
- [x] T007 [P] 初始化 Firestore Rules 測試環境 (`firebase/tests/rules.test.ts`)
- [x] T008 [P] 初始化前端單元測試環境 (Vitest/Jest + RTL) (`frontend/src/tests/setup.ts`)
- [x] T009 設定前端 Firebase 環境變數與初始化模組 (`frontend/src/lib/firebase.ts`)
- [x] T010 [P] 封裝 LINE LIFF 初始化機制與登入狀態檢查 (`frontend/src/lib/liff.ts`)
- [x] T011 定義並實作共用 UI 元件 (如按鈕、輸入框、載入動畫) (`frontend/src/components/ui/`)
- [x] T012 實作共用 Global Auth State Provider 以存取目前登入員工的身分與權限 (`frontend/src/features/auth/AuthProvider.tsx`)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - 一線人員透過通訊軟體快速註冊與領用 (Priority: P1) 🎯 MVP

**Goal**: 一線人員能透過 LINE SSO 首次註冊入會（狀態預設 PENDING），並在開通後檢視物資庫存、發起領用申請單。送出時必須驗證可用庫存並扣除，同時發出通知信給管理員。

**Independent Test**: 使用測試帳號以 LIFF 登入，進入申請頁面送出申請，檢視 Firestore 是否建立 `requests` 文件且 `availableQuantity` 被正確扣減，並確認系統是否有嘗試發送 Email 通知。

### Implementation for User Story 1

- [x] T013 [P] [US1] 實作前端 `User` 及 `Inventory` Types 與資料擷取 Service (`frontend/src/features/inventory/inventoryService.ts`)
- [x] T014 [US1] 撰寫 Inventory 資料擷取之單元測試 (`frontend/src/features/inventory/inventoryService.test.ts`)
- [x] T015 [US1] 開發註冊頁面 UI：攔截全新使用者並要求輸入姓名與區域 (`frontend/src/pages/RegisterPage.tsx`)
- [x] T016 [US1] 開發「待開通」防呆畫面：阻擋 PENDING 使用者進入物資頁面 (`frontend/src/pages/PendingApprovalPage.tsx`)
- [x] T017 [US1] 開發材料包清單頁面 UI：整合圖片顯示機制與載入異常時的文字警告 Fallback (`frontend/src/pages/InventoryListPage.tsx`)
- [x] T018 [US1] 開發申請單送出邏輯：使用 Firestore Transaction 檢查 `availableQuantity` 並寫入 `requests` 文件 (`frontend/src/features/requests/requestService.ts`)
- [x] T019 [US1] 撰寫申請單送出邏輯 (Transaction) 之單元測試 (`frontend/src/features/requests/requestService.test.ts`)
- [x] T020 [P] [US1] 後端實作發送申請通知信的 Firebase Cloud Function 觸發器 (`firebase/functions/src/triggers/onRequestCreated.ts`)
- [x] T021 [US1] 撰寫 Cloud Function 通知信發送之單元測試 (`firebase/functions/src/tests/onRequestCreated.test.ts`)
- [x] T022 [US1] 驗證 US1 核心流程之 Firestore Rules (User 權限與 Request 限制) (`firebase/tests/us1_rules.test.ts`)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - 子管理員進行身分校準與分處管理 (Priority: P2)

**Goal**: 分處子管理員能登入後台介面核准 PENDING 使用者、修改員工名稱配置，並審核與管理待核准申請單，或手動修正實際庫存並填寫留存日誌。

**Independent Test**: 開啟後台登入為子管理員，測試能否將某一員工設為 ACTIVE。測試核准與拒絕一筆物資申請單，並驗證 `transactions` 日誌中是否成功產生新紀錄，同時 `actualQuantity` 已對應調整。

### Implementation for User Story 2

- [x] T023 [P] [US2] 開發後台主版面 Layout 與側邊導覽列 (`frontend/src/components/layout/AdminLayout.tsx`)
- [x] T024 [US2] 實作使用者管理介面：列表顯示區內成員並能執行「開通帳號」、「變更備註名與區域」操作 (`frontend/src/pages/admin/UserManagementPage.tsx`)
- [x] T025 [US2] 實作庫存修正介面：允許管理員調整實際庫存，強制要求輸入原因並使用 Transaction 生產異動日誌 (`frontend/src/pages/admin/InventoryManagementPage.tsx`)
- [x] T026 [US2] 撰寫庫存修正 (Transaction & 日誌生成) 之單元測試 (`frontend/src/features/inventory/adminInventory.test.ts`)
- [x] T027 [P] [US2] 後端實作：當員工區域發生異動時，自動將所有 PENDING 申請單設為 REJECTED 的 Cloud Function (`firebase/functions/src/triggers/onUserRegionChanged.ts`)
- [x] T028 [US2] 撰寫區域異動自動取消邏輯之 Cloud Function 測試 (`firebase/functions/src/tests/onUserRegionChanged.test.ts`)
- [x] T029 [US2] 實作申請單審核介面：顯示「待核准」清單，並提供「核准」與「拒絕」操作 (`frontend/src/pages/admin/RequestApprovalPage.tsx`)
- [x] T030 [US2] 實作申請單審核後端邏輯：前端呼叫或安全規則保護下的 Transaction 來扣除實際庫存或退回可用庫存，並寫入日誌 (`frontend/src/features/requests/approvalService.ts`)
- [x] T031 [US2] 撰寫申請單審核邏輯之單元測試 (`frontend/src/features/requests/approvalService.test.ts`)
- [x] T032 [US2] 驗證 US2 核心流程之 Firestore Rules (Admin 審核權限) (`firebase/tests/us2_rules.test.ts`)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - 管理部經理的全域管理與警報機制 (Priority: P3)

**Goal**: 管理部經理能透過全域後台修改企業標誌、更新物資照片；當實際庫存低於預設安全存量閾值時，系統自動發信警報。

**Independent Test**: 利用經理帳號成功上傳一張新物資照片至 Firebase Storage；將某物資庫存透過管理介面改低於安全存量，檢測是否收到警報信件。

### Implementation for User Story 3

- [x] T033 [P] [US3] 開發全域設定介面：提供表單上傳替換公司 LOGO 與物資圖片至 Storage (`frontend/src/pages/admin/GlobalSettingsPage.tsx`)
- [x] T034 [P] [US3] 實作 Storage 圖片上傳服務與關聯庫存文件的更新邏輯 (`frontend/src/features/inventory/imageUploadService.ts`)
- [x] T035 [US3] 實作全域異動日誌查詢檢視表 (`frontend/src/pages/admin/TransactionLogPage.tsx`)
- [x] T036 [US3] 後端實作：監聽 inventory 文件異動，當 actualQuantity < safeQuantity 時寄發警報 Mail 的 Cloud Function (`firebase/functions/src/triggers/onInventoryBelowSafeLevel.ts`)
- [x] T037 [US3] 撰寫安全存量警報之 Cloud Function 測試 (`firebase/functions/src/tests/onInventoryBelowSafeLevel.test.ts`)
- [x] T038 [US3] 驗證 US3 核心流程之 Firestore Rules (Super Admin 權限) (`firebase/tests/us3_rules.test.ts`)

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T039 [P] 針對整體應用套用 RWD 設計，確保 iOS 與 Android 手機在 LINE LIFF 內皆具備順暢操作體驗
- [x] T040 新增所有 API 請求的通用錯誤處理、攔截與自動重試機制
- [x] T041 強化前端的各元件 Loading 與 Skeleton 載入狀態
- [x] T042 撰寫 README.md 並提供本地開發環境部署與 Firebase Emulator 測試說明指南 (`README.md`)
- [x] T043 實作「白名單 (Whitelist)」審核機制，新增 `isApproved` 欄位並更新 Firestore Rules 安全限制

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 無相依性，可即刻執行。
- **Foundational (Phase 2)**: 必須等待 Phase 1 完成。這是防護資料不被惡意破壞的核心，且提供前端基本共用元件框架。
- **User Stories (Phase 3-5)**: 必須等待 Phase 2 完成後才能進行。各個 Story 彼此解耦，視開發資源可同步或按 P1 -> P3 循序執行。
- **Polish (Final Phase)**: 使用者故事完成後進行統一視覺測試與優化。

### Parallel Opportunities

- Firebase Functions (如通知信、事件觸發器) 的開發 ([P] tasks) 與前台 React UI 頁面的開發可以由兩位開發者平行分工進行。
- 管理員後台的介面與一線員工的 LIFF Web 介面可平行開發。
