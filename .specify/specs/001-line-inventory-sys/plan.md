# Implementation Plan: 陪伴服務材料包庫存管理系統 V7.0 (LINE 整合版)

**Branch**: `001-line-inventory-sys` | **Date**: 2026-03-16 | **Spec**: `.specify/specs/001-line-inventory-sys/spec.md`
**Input**: Feature specification from `.specify/specs/001-line-inventory-sys/spec.md`

## Summary

本專案旨在建立一個基於 LINE LIFF 與 Firebase (Firestore, Storage, Cloud Functions) 的行動端庫存管理系統。核心目標為透過 LINE 快速 SSO 註冊入會，並由管理員進行身分開通（單一 `isApproved` 開關）與區域校準。員工可以在手機上快速確認貨架精確位置及照片，並發起物資領用申請。管理員核准後正式扣除實際庫存，並可於「待交付清單」中填寫交付日期完成結案。使用者亦可透過「我的申請紀錄」追蹤歷史狀態。每一次處理與修正動作皆寫入 Append-only 的異動日誌以供核查。

## Technical Context

**Language/Version**: TypeScript / Node.js
**Primary Dependencies**: React (或類似前端框架), Firebase Client SDK, Firebase Admin SDK, LINE LIFF SDK
**Storage**: Firebase Firestore (NoSQL Document DB), Firebase Storage (Images)
**Testing**: Jest (Unit testing), Firebase Emulator Suite (Firestore Rules & Functions)
**Target Platform**: Mobile (LINE LIFF in-app browser) / Web (Admin Dashboard)
**Project Type**: Web Application (Frontend + Serverless Functions)
**Performance Goals**: 能夠順暢在手機版 LINE 中秒速開啟，並立刻載入區域庫存清單。歷史紀錄清單需採用分頁或無限滾動以維持長期效能。
**Constraints**: 必須處理並發 (Concurrency) 扣除庫存的問題。圖片上傳如失敗需有預設顯示 (Fallback)。歷史資料量大時需避免 Firestore 讀取超載。
**Scale/Scope**: 三個初始區域（新莊區、三蘆區、板中永區）的一線員工及子管理員，最高支援千人規模。區域可由管理者動態擴充或更改名稱。

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **程式碼品質 (Code Quality)**: 架構採 Frontend (React) + Backend (Firebase Cloud Functions) 分離，確保模組化與高維護性。
- [x] **測試標準 (Testing Standards)**: 透過 Firebase Emulator Suite 去對 Firestore Rules 與 Firebase Functions 進行單元測試與整合測試。
- [x] **使用者體驗一致性 (User Experience Consistency)**: 前端強制採 Mobile-first 開發，並支援發生圖檔載入異常時的文字 Fallback。
- [x] **效能要求 (Performance Requirements)**: 利用 Firestore即時監聽機制降低無謂的重刷查詢，並將寄信等耗時任務退至 Cloud Functions 非同步處理。

## Project Structure

### Documentation (this feature)

```text
.specify/specs/001-line-inventory-sys/
├── plan.md              # This file
├── research.md          # 決策與架構研究
├── data-model.md        # Firestore Schema 定義
├── quickstart.md        # 開發指引與業務名詞對照
├── contracts/           # API 或文件夾(此 Web App 架構無外部 public api，暫不使用)
└── tasks.md             # (後續生成)
```

### Source Code (repository root)

```text
# Web application (Frontend + Firebase Functions 結構)
.github/
└── workflows/
    └── firebase-deploy.yml # CI/CD Firestore Rules 等自動部署流程

firebase/
├── functions/
│   ├── src/
│   │   ├── index.ts        # Cloud Functions 進入點
│   │   ├── triggers/       # Firestore onCreate/onUpdate 監聽事件
│   │   └── services/       # Email 發送邏輯
│   ├── package.json
│   └── tests/              # Firebase Functions 測試
├── firestore.rules         # 安全與權限規則
└── storage.rules           # 上傳圖片規則

frontend/
├── src/
│   ├── components/         # 共用 UI (卡片, 按鈕)
│   ├── features/           # 原型模組 (Auth, Inventory, Requests, Admin)
│   ├── lib/                # Firebase Init, LIFF Init
│   └── pages/              # 路由頁面
├── package.json
└── tests/                  # Frontend UI 測試
```

**Structure Decision**: 採用 `frontend/` 與 `firebase/functions/` 分離的架構。所有商業邏輯的安全防線建構在 `firestore.rules` 之中，並將通知、自動拒絕等連鎖反應放在 `firebase/functions/`。前端僅透過 Firebase Web SDK 直接讀寫資料庫，並由 LIFF 提供 SSO 登入。這能最大化利用 Firebase Serverless 的優勢，減少維護傳統後端的成本。

## Verification Plan

### Automated Tests
- **Firestore Rules Testing**: 使用 `@firebase/rules-unit-testing` 在本機 Emulator 針對各種角色 (USER, ADMIN, SUPER_ADMIN) 的讀寫行為撰寫單元測試。指令：`cd firebase && npm run test:rules`。
- **Cloud Functions Testing**: 使用 Jest 模擬 Firestore 文件變化，驗證 Email 發送服務以及狀態切換邏輯。指令：`cd firebase/functions && npm test`。
- **Frontend Unit Tests**: 針對可用量計算 (`availableQuantity` 運算) 及庫存狀態顯示撰寫 Jest/React Testing Library 測試。指令：`cd frontend && npm test`。

### Manual Verification
- **LIFF 登入測試**: 建立測試版 LIFF ID，透過手機版 LINE 打開 URL，驗證是否能正確取得 LINE Profile (DisplayName, UserId) 並正確寫入 Firestore（狀態應預設為 未核准）。
- **後台管理員放行測試**: 由 `SUPER_ADMIN` 的開發者帳號進入介面，將新建的帳號 `isApproved` 設為 true，並手動驗證下一次登入時是否放行讀取庫存權限。
- **庫存競爭測試 (Concurrency)**: 同一位使用者或多位使用者在多個瀏覽器分頁同時點擊申領同一個剩餘數量 1 的物資，確保系統僅通過第一個請求，其餘請求跳出「庫存不足」警告且資料庫未產生超額待核准數量。
- **交付結案與歷史查詢測試**: 測試審核流程的兩階段（核准、結案），輸入交付日期後，驗證「我的申請紀錄」中是否能正確顯示該日期與狀態；驗證後台是否能以「申請人」名稱搜尋過濾歷史單據。
