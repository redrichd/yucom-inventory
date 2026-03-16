# 悠康物資庫存系統 V7.0 (LINE 整合版)

## 快速開始
1. `cd frontend && npm install`
2. `npm run dev` (本地開發)
3. `cd firebase/functions && npm install`

## 專案結構
- `frontend/`: React + Vite + LIFF
- `firebase/`:
  - `firestore.rules`: 權限與區域隔離邏輯
  - `functions/`: 自動對帳與通知觸發器
  - `tests/`: 完整安全性單元測試

## 核心流程
1. LINE 登入 -> 註冊/待開通
2. 管理員核准使用者
3. 使用者跨區領用物資 (實施 Transaction 保護)
4. 管理員修正庫存 & 寄發警報

*更多詳細說明請見 [walkthrough.md](../walkthrough.md)*
