# Research & Technical Decisions: 陪伴服務材料包庫存管理系統 V7.0 (LINE 整合版)

## Technical Context & Decisions

### 1. Backend Database: Firebase (Firestore)
- **Decision**: 使用 Firebase Firestore 作為後端資料庫。
- **Rationale**: 
  - 使用者明確要求「使用 FIREBASE 為後端資料庫」。
  - Firestore 的 NoSQL 文件結構非常適合用來儲存彈性的使用者資料、物品屬性，以及不可竄改的異動日誌 (Append-only logs)。
  - 內建的 Security Rules 可以輕鬆滿足 `管理員` 與 `一線人員` 的權限控管需求。
- **Alternatives considered**: 關聯式資料庫 (PostgreSQL/MySQL) - 若考量嚴格的 Transaction (例如高併發扣庫存) 會較為安全，但 Firestore 透過 Transaction 或 `FieldValue.increment` 也能安全處理併發庫存扣除。

### 2. Frontend / Integration: LINE Login & LIFF
- **Decision**: 使用 LINE Front-end Framework (LIFF) 結合 LINE Login。
- **Rationale**: 
  - 規格書明定期望為「通訊軟體內建服務進行單一登入 (SSO)」與「行動優先」。
  - LIFF 能夠無縫在 LINE 內開啟網頁，並且直接取得使用者的 LINE ID 作為唯一識別碼，降低使用者註冊門檻。
- **Alternatives considered**: 獨立 Web App + Email 註冊 - 不符合快速領用與依附通訊軟體流程的需求。

### 3. Storage: Firebase Storage
- **Decision**: 使用 Firebase Storage 存放物品圖片與企業 LOGO。
- **Rationale**: 
  - 原生與 Firebase 專案整合，設定簡易。
  - 前端存取速度佳，且容易與 Firestore 中的圖片 URL 進行關聯。

### 4. Notifications: Firebase Cloud Functions & Gmail API (or SendGrid/Nodemailer)
- **Decision**: 使用 Firebase Cloud Functions 監聽 Firestore 的文件異動 (onCreate/onUpdate) 來觸發送信邏輯。
- **Rationale**: 
  - 當新增一筆「待核准申請單」或「庫存低於安全存量」時，Cloud Functions 可自動在後端執行並發送 Email 給對應的主管，不需要由前端負責發送信件，確保安全性與可靠性。

### 5. Concurrency Management
- **Decision**: 使用 Firestore Transactions 維護「實際庫存」與「可用庫存」。
- **Rationale**: 
  - 送出申請時：透過 Transaction 檢查 `可用庫存`，若大於等於申請量，則建立申請單文件，並在同一個 Transaction 內將 `可用庫存` 減去申請量。
  - 這樣能確保不會發生物資被超額申請的 Race Conditions (Option A 的需求)。

### 6. Development Stack (Frontend)
- **Decision**: 前端使用 React UI 搭配 Vite 建置。
- **Rationale**: 生態系豐富，容易與 Firebase 整合 (Firebase Web SDK)，並且有許多適合 Mobile-first 的 UI library (如 TailwindCSS + shadcn/ui 或 MUI)。
