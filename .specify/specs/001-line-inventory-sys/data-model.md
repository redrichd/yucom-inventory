# Data Model: 陪伴服務材料包庫存管理系統 V7.0

本系統採用 Firebase Firestore 作為後端資料庫，以下為各 Collection 的實體定義與關聯。

## Collections

### 1. `users` (使用者)
儲存員工的身分、註冊狀態與權限資訊。文件 ID (Document ID) 建議使用 LINE User ID。

- `uid`: string (LINE User ID, Primary Key)
- `lineDisplayName`: string (來自 LINE 的原始名稱)
- `displayName`: string (管理員校準後的備註名稱，預設同上)
- `region`: string (所屬區域，例如：新莊中正、新莊化成、三蘆區、板中永區)
- `role`: string (`USER` 一線人員, `ADMIN` 子管理員, `SUPER_ADMIN` 管理部經理)
- `status`: string (`PENDING` 待開通, `ACTIVE` 已核准, `SUSPENDED` 停權)
- `createdAt`: timestamp
- `updatedAt`: timestamp

### 2. `inventory` (物資與庫存)
儲存每項材料包的基本資訊與庫存數量。

- `id`: string (自動生成 Document ID)
- `name`: string (物品名稱)
- `imageUrl`: string (Firebase Storage 圖片網址)
- `region`: string (所在區域)
- `locationDetail`: string (詳細存放位置，如: 後門前貨架)
- `actualQuantity`: number (實際庫存量)
- `availableQuantity`: number (可用庫存量 = 實際庫存 - 待核准數量)
- `safeQuantity`: number (安全存量閾值)
- `createdAt`: timestamp
- `updatedAt`: timestamp

### 3. `requests` (申請單)
儲存員工送出的物資領用申請。

- `id`: string (自動生成 Document ID)
- `userId`: string (關聯至 `users.uid`)
- `userName`: string (申請者備註名稱，為防資料異動產生的快照)
- `itemId`: string (關聯至 `inventory.id`)
- `itemName`: string (物資名稱快照)
- `region`: string (申請當下的所屬區域快照)
- `quantity`: number (申請數量)
- `note`: string (申請留言/備註)
- `status`: string (`PENDING` 待核准, `APPROVED` 已發放, `REJECTED` 已拒絕/取消)
- `reviewedBy`: string (審核管理員的 userId，可為 null)
- `reviewedAt`: timestamp (審核時間，可為 null)
- `createdAt`: timestamp

### 4. `transactions` (異動日誌)
不可竄改的 Append-only 日誌，記錄所有庫存的實體變動（包含核准發放與管理員手動調整）。

- `id`: string (自動生成 Document ID)
- `itemId`: string (關聯至 `inventory.id`)
- `itemName`: string (物資名稱快照)
- `operatorId`: string (操作者/審核者的 userId)
- `operatorName`: string (操作者備註名稱快照)
- `type`: string (`FULFILLMENT` 核准發放, `MANUAL_ADJUSTMENT` 手動修正)
- `changeQuantity`: number (變動數量，正負值，例如 -2)
- `balanceAfter`: number (變動後餘額，即變動後的 actualQuantity)
- `reason`: string (變更理由，例如: 系統核准單號xxx、盤損、補貨)
- `relatedRequestId`: string (若為核准發放，則關聯申請單 ID，手動修正可為 null)
- `createdAt`: timestamp

## State Transitions (狀態移轉)

### 申請單 (Request)
1. **建立**: `PENDING`，並且執行 Transaction `inventory.availableQuantity -= quantity`
2. **核准 (`APPROVED`)**: 執行 Transaction `inventory.actualQuantity -= quantity`，並產生一筆 `transactions`。
3. **拒絕 (`REJECTED`)**: 執行 Transaction `inventory.availableQuantity += quantity` (退回可用庫存)。
4. **自動取消**: 當會員區域 `users.region` 被更改時，觸發 Cloud Function，將該 user 所有狀態為 `PENDING` 的申請單改為 `REJECTED`，並加回 `availableQuantity`。

### 使用者帳號 (User)
1. **初次登入**: 建立文件，狀態為 `PENDING`。
2. **管理員開通**: 狀態改為 `ACTIVE`。
