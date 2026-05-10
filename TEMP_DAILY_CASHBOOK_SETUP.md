# 臨時每日記帳系統設定

這是一套臨時用的每日記帳工具。正式系統上線後，可以直接停用 Apps Script 觸發器，或不再使用 `temp-daily-cashbook.html`。

## 檔案說明

- `temp-daily-cashbook.html`：前端記帳畫面
- `temp-daily-cashbook.css`：畫面樣式
- `temp-daily-cashbook.js`：前端暫存、送出資料到 Google Sheets
- `google-apps-script/temp-daily-cashbook-backend.gs`：Google Sheets 後端、每日結算、LINE 群組推播

## Google Sheets 後端設定

1. 建立一份新的 Google Sheets。
2. 到「擴充功能」→「Apps Script」。
3. 將 `google-apps-script/temp-daily-cashbook-backend.gs` 的內容貼到 Apps Script。
4. 儲存專案。
5. 先執行 `setupTemporaryAccounting` 一次。
6. Google 會要求授權，請用你的帳號授權。
7. 執行成功後，Sheets 會建立兩個分頁：
   - `臨時記帳`：每筆收入/支出明細
   - `每日結算`：每日彙總結果
8. 到「部署」→「新增部署作業」。
9. 類型選「網頁應用程式」。
10. 執行身分選「我」。
11. 存取權限可先選「知道連結的任何人」。
12. 部署後複製 Web App URL。
13. 打開 `temp-daily-cashbook.html`，右上角設定貼上 Web App URL。

## LINE 群組推播流程

這套系統用 LINE Messaging API 推播到群組。流程是：

1. 前端新增資料。
2. 資料寫入 Google Sheets 的 `臨時記帳`。
3. 按「今日結算並傳 LINE」，或每日 23:55 自動執行結算。
4. Apps Script 計算當日營業額、支出、當日現金。
5. 結算結果寫入 `每日結算`。
6. Apps Script 用 LINE Bot 把摘要推送到指定 LINE 群組。

## LINE Bot 設定步驟

1. 到 LINE Developers 建立或使用既有 Provider。
2. 建立一個 Messaging API Channel。
3. 在 Messaging API 設定頁取得 `Channel access token`。
4. 將這個 LINE 官方帳號 Bot 加入你要收結算的 LINE 群組。
5. 取得群組的 `groupId`。

### 如何取得 groupId

LINE 群組 ID 不會直接顯示在 LINE App 裡，需要透過 webhook 取得。

建議做法：

1. 在 LINE Developers 的 Messaging API 設定中開啟 webhook。
2. Webhook URL 可以先用 Apps Script 或暫時用 webhook 測試工具接收事件。
3. 把 Bot 加入群組。
4. 在群組傳一則訊息。
5. webhook 收到的事件中會有：

```json
"source": {
  "type": "group",
  "groupId": "Cxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

6. 複製 `groupId`，之後要填到 Apps Script 的指令碼屬性。

## Apps Script 指令碼屬性

在 Apps Script 左側「專案設定」→「指令碼屬性」新增兩個值：

- `LINE_CHANNEL_ACCESS_TOKEN`：LINE Messaging API 的 Channel access token
- `LINE_GROUP_ID`：要接收結算訊息的 LINE 群組 ID

注意：不要把 token 寫進前端 HTML 或 JS，也不要上傳到 GitHub。這份程式已經設計成從 Apps Script 指令碼屬性讀取 token。

## 測試 LINE 推播

1. 先在 `temp-daily-cashbook.html` 新增幾筆收入和支出。
2. 確認 Google Sheets 的 `臨時記帳` 有資料。
3. 按前端的「今日結算並傳 LINE」。
4. 查看 LINE 群組是否收到摘要。
5. 同時確認 Google Sheets 的 `每日結算` 是否出現當日資料。

如果 LINE 沒收到：

- 確認 Bot 已加入群組。
- 確認 `LINE_CHANNEL_ACCESS_TOKEN` 沒貼錯。
- 確認 `LINE_GROUP_ID` 是群組 ID，不是使用者 ID。
- 到 Apps Script 的「執行項目」查看錯誤訊息。

## 每日統計邏輯

- 金額：營業收入
- 支出：支出金額
- 今日營業額：當日收入合計
- 今日支出：當日支出合計
- 今日現金：今日營業額減今日支出

## 臨時系統退場方式

正式系統上線後：

1. 到 Apps Script「觸發條件」刪除 `sendYesterdayOrTodaySummary`。
2. 停用或刪除 Apps Script Web App 部署。
3. 不再使用 `temp-daily-cashbook.html`。
