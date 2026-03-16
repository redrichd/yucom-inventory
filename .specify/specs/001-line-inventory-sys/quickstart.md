# Quickstart: 陪伴服務材料包庫存管理系統 V7.0 (LINE 整合版)

本文件概述如何快速了解此專案的架構與領域知識，以利開發。

## 專案概述
本專案為一個依附於 LINE 內建服務 (LIFF) 的材料包庫存管理系統，主要提供給四大分處的一線員工及管理員使用。
目標是達成**以 LINE 快速登入註冊**、**精確的地點與圖文標示避免拿錯**，以及**嚴格的權限控管與庫存防呆處理**。

## 關鍵技術與架構
- **Frontend**: [待定，預計為 React 體系] 結合 LINE LIFF SDK，實作「行動優先 (Mobile First)」介面。
- **Backend / Database**: Firebase Firestore (NoSQL 資料儲存與規則控管)。
- **Storage**: Firebase Storage (存放公司 LOGO 與每個材料包之實體照片)。
- **Serverless / Notifications**: Firebase Cloud Functions (負責監聽 Firestore 的新增與異動，觸發寄發管理員待辦通知或安全存量警告信件，並處理自動取消跨區申請單等邏輯)。

## 核心名詞 (Domain Glossary)
- **可用庫存 (Available Quantity)**: `實際庫存` 減去 `所有待核准數量` 的差值。使用者僅能在「可用數量大於申請量時」提交新單，避免了管理員收單後才發現無貨可發的窘境。
- **實際庫存 (Actual Quantity)**: 貨架上真實存在的數量，僅在管理員點擊「核准發放」或「手動修正」時才會被扣除或增加。
- **待核准 (Pending)**: 申請單生成後的預設狀態。此時尚未扣除實際庫存，但先行扣減可用庫存。
- **核准/發放 (Approved/Fulfill)**: 管理員審核通過，系統正式扣除實際庫存，並將申請單標示為已完成。
- **異動日誌 (Transactions)**: 系統中不可被直接修改或刪除的 Append-only 帳本，記錄所有「核准發放」與「手動修正」的細節與理由。

## 後續開發指引
請參閱 `spec.md` 了解需求規格，並查閱 `data-model.md` 來進行 Firestore 的資料庫操作與欄位規劃。
