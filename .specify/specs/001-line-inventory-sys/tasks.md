# Tasks: 陪伴服務材料包庫存管理系統 V7.0 (LINE 整合版)

**Input**: Design documents from `.specify/specs/001-line-inventory-sys/`
**Prerequisites**: plan.md, spec.md, data-model.md, research.md

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Create project structure per implementation plan
- [x] T002 Initialize Vite React frontend and Firebase project structure
- [x] T003 [P] Configure GitHub Actions for Firebase Rules deployment in `.github/workflows/firebase-deploy.yml`

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T004 Setup Firestore Security Rules for `isApproved` logic in `firebase/firestore.rules`
- [x] T005 [P] Implement Firebase Auth and user synchronization in `frontend/src/lib/firebase.ts`
- [x] T006 [P] Update GitHub Actions to include Storage rules deployment in `.github/workflows/firebase-deploy.yml`
- [x] T007 Configure `firebase.json` to include Storage rules path

## Phase 3: User Story 1 - 居服員快速註冊與領用 (Priority: P1) 🎯 MVP

**Goal**: 居服員可註冊、等待開通並提交領用申請，並能查看個人紀錄

- [x] T008 [US1] Create registration UI and logic in `frontend/src/pages/RegisterPage.tsx`
- [x] T009 [US1] Implement "Wait for Approval" screen for unapproved users
- [x] T010 [US1] Create Inventory List view with category filtering in `frontend/src/pages/InventoryListPage.tsx`
- [x] T011 [US1] Implement Request submission logic with available quantity check in `frontend/src/features/requests/requestService.ts`
- [x] T012 [US1] Create "My Requests" page UI in `frontend/src/pages/MyRequestsPage.tsx`
- [x] T013 [US1] Implement My Requests data fetching with status badges in `frontend/src/pages/MyRequestsPage.tsx`

## Phase 4: User Story 2 - 子管理員身分校準與分處管理 (Priority: P2)

**Goal**: 管理員能核准使用者、審核申請單並填寫交付日期結案

- [x] T014 [US2] Update User Management to use single `isApproved` toggle in `frontend/src/pages/admin/UserManagementPage.tsx`
- [x] T015 [US2] Create Request Approval UI with "Pending" and "Approved" tabs in `frontend/src/pages/admin/RequestApprovalPage.tsx`
- [x] T016 [US2] Implement `approveRequest` logic with actual quantity deduction in `frontend/src/features/requests/approvalService.ts`
- [x] T017 [US2] Implement `completeRequest` logic with delivery date recording in `frontend/src/features/requests/approvalService.ts`
- [x] T018 [US2] Add Delivery Date picker and "Complete" button to Approved tab in `frontend/src/pages/admin/RequestApprovalPage.tsx`

## Phase 5: User Story 3 - 管理部經理全域管理與警報機制 (Priority: P3)

**Goal**: 經理可管理物品照片、區域與接收庫存警報

- [x] T019 [P] [US3] Implement image upload to Firebase Storage in `frontend/src/pages/InventoryListPage.tsx`
- [x] T020 [US3] Implement Safe Quantity alert triggers (Cloud Functions)
- [x] T021 [US3] Implement Dynamic Region Management UI

## Phase 6: Polish & Cross-Cutting Concerns (效能優化與搜尋)

**Purpose**: 處理資料量增長後的載入效能與管理效率

- [x] T022 [P] Implement pagination/infinite scroll for My Requests list in `frontend/src/pages/MyRequestsPage.tsx`
- [x] T023 [P] Implement pagination/infinite scroll for Request Approval history in `frontend/src/pages/admin/RequestApprovalPage.tsx`
- [x] T024 [P] Implement applicant name search filter in Request Approval history tab in `frontend/src/pages/admin/RequestApprovalPage.tsx`
- [x] T025 Update web page title to "悠康庫存系統" in `frontend/index.html`

## Dependencies & Execution Order

1. **Phase 1 & 2**: 已完成，確立基礎架構與權限安全規則。
2. **Phase 3 & 4**: 核心業務流程（註冊 -> 審核 -> 申請 -> 核准 -> 結案）已完成實作。
3. **Phase 6**: **待執行項目**，針對資料量大後的效能優化與管理搜尋功能。

## Implementation Strategy

- **MVP**: 已達成，核心流程已通。
- **Polish**: 接下來的重點在於優化查詢效能，避免一次載入過多 Firestore 文件，並增加搜尋功能以利管理統計。
