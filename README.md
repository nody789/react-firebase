# React Blog Application

這是一個使用 React 和 Firebase 的簡單部落格應用，支持用戶登入、發佈文章、留言和刪除留言等功能。以下是實現這些功能所用到的技巧和步驟。

## 功能概覽

1. **用戶登入** - 支持 Google、Facebook、 和電子郵件/密碼登入。
2. **發佈文章** - 用戶可以撰寫和發佈文章，文章中可以包含圖片。
3. **留言** - 用戶可以對文章進行留言，並查看其他用戶的留言。
4. **刪除留言** - 用戶只能刪除自己發佈的留言。

## 
- **React** - 前端框架。
- **Firebase** - 後端服務（身份驗證、Firestore、儲存）。
- **Bootstrap 5** - 用於樣式和布局。
## 使用技巧

### 1. 用戶登入

- 使用 Firebase 的身份驗證服務，支持多種登入方式（Google、Facebook、 和電子郵件/密碼）。
- 在 `firebase.js` 中配置 Firebase，並在 React 應用中使用 Firebase 提供的 API 進行身份驗證。

### 2. 發佈文章

- 在用戶發佈文章時，將文章內容和圖片上傳到 Firebase Firestore 和 Firebase Storage。
- 使用 `addDoc` 方法將文章保存到 Firestore。
- 使用 `serverTimestamp` 來記錄文章發佈時間。

### 3. 留言功能

- 使用 Firestore 的 `collection` 和 `addDoc` 方法來新增留言。
- 使用 `onSnapshot` 監聽留言的變化，即時更新 UI。

### 4. 刪除留言

- 用戶只能刪除自己發佈的留言。使用 Firebase Firestore 的 `deleteDoc` 方法來刪除留言。
- 在刪除操作前，先檢查留言的擁有者是否為當前用戶。

### 5. 圖片顯示和燈箱效果

- 使用 Bootstrap 5 的模態框來實現圖片燈箱效果，並自定義樣式以調整圖片間距。
- 使用 `modal` 元件來顯示圖片，並在模態框中設置導航按鈕來查看圖片集。