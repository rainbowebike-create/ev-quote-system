const SHEET_NAME = "臨時記帳";
const SUMMARY_SHEET_NAME = "每日結算";
const TIMEZONE = "Asia/Taipei";

function doPost(e) {
  if (e.postData && e.postData.contents) {
    try {
      const data = JSON.parse(e.postData.contents);

      if (data.events) {
        handleLineWebhook(data);
        return textResponse("LINE webhook OK");
      }
    } catch (error) {
      // Not a LINE webhook payload. Continue with the frontend form flow.
    }
  }

  const action = e.parameter.action;
  const payload = JSON.parse(e.parameter.payload || "{}");

  if (action === "addRecord") {
    addRecord(payload);
    return textResponse("ok");
  }

  if (action === "closeDay") {
    const summary = closeDay(payload.date);
    sendLineSummary(summary);
    return textResponse("closed");
  }

  return textResponse("unknown action");
}

function handleLineWebhook(data) {
  data.events.forEach((event) => {
    if (event.source && event.source.type === "group" && event.source.groupId) {
      PropertiesService
        .getScriptProperties()
        .setProperty("LINE_GROUP_ID", event.source.groupId);

      Logger.log("已取得 LINE_GROUP_ID：");
      Logger.log(event.source.groupId);
    }

    Logger.log(JSON.stringify(event, null, 2));
  });
}

function setupTemporaryAccounting() {
  ensureSheets();

  ScriptApp.getProjectTriggers()
    .filter((trigger) => trigger.getHandlerFunction() === "sendTodaySummary")
    .forEach((trigger) => ScriptApp.deleteTrigger(trigger));

  ScriptApp.newTrigger("sendTodaySummary")
    .timeBased()
    .everyDays(1)
    .atHour(23)
    .nearMinute(55)
    .create();
}

function sendTodaySummary() {
  const today = Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd");
  const summary = closeDay(today);
  sendLineSummary(summary);
}

function addRecord(record) {
  const sheet = ensureSheet(SHEET_NAME, ["日期", "品項", "金額", "支出", "類型", "建立時間"]);
  const amount = Number(record.amount || 0);
  const expense = Number(record.expense || 0);
  const type = record.type === "expense" ? "支出" : "營業收入";

  sheet.appendRow([
    record.date,
    record.item,
    amount,
    expense,
    type,
    record.createdAt || new Date(),
  ]);
}

function closeDay(dateText) {
  const date = dateText || Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd");
  const sheet = ensureSheet(SHEET_NAME, ["日期", "品項", "金額", "支出", "類型", "建立時間"]);
  const values = sheet.getDataRange().getValues();

  const rows = values.slice(1).filter((row) => normalizeDate(row[0]) === date);
  const sales = rows.reduce((sum, row) => sum + Number(row[2] || 0), 0);
  const expenses = rows.reduce((sum, row) => sum + Number(row[3] || 0), 0);
  const cash = sales - expenses;

  const summary = {
    date,
    count: rows.length,
    sales,
    expenses,
    cash,
    items: rows.map((row) => ({
      item: row[1],
      amount: Number(row[2] || 0),
      expense: Number(row[3] || 0),
    })),
  };

  writeSummary(summary);
  return summary;
}

function writeSummary(summary) {
  const sheet = ensureSheet(SUMMARY_SHEET_NAME, ["結算日期", "筆數", "營業額", "支出", "當日現金", "結算時間"]);
  const values = sheet.getDataRange().getValues();

  const existingIndex = values.findIndex((row, index) => {
    return index > 0 && normalizeDate(row[0]) === summary.date;
  });

  const rowValues = [
    summary.date,
    summary.count,
    summary.sales,
    summary.expenses,
    summary.cash,
    new Date(),
  ];

  if (existingIndex > 0) {
    sheet.getRange(existingIndex + 1, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
}

function sendLineSummary(summary) {
  const token = PropertiesService.getScriptProperties().getProperty("LINE_CHANNEL_ACCESS_TOKEN");
  const groupId = PropertiesService.getScriptProperties().getProperty("LINE_GROUP_ID");

  if (!token) {
    throw new Error("缺少 LINE_CHANNEL_ACCESS_TOKEN，請到 Apps Script 指令碼屬性設定。");
  }

  if (!groupId) {
    throw new Error("缺少 LINE_GROUP_ID，請先把 Bot 加入群組並在群組傳一句話。");
  }

  const message = buildLineMessage(summary);

  const response = UrlFetchApp.fetch("https://api.line.me/v2/bot/message/push", {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    payload: JSON.stringify({
      to: groupId,
      messages: [
        {
          type: "text",
          text: message,
        },
      ],
    }),
    muteHttpExceptions: true,
  });

  const status = response.getResponseCode();

  if (status < 200 || status >= 300) {
    throw new Error(`LINE 推播失敗：${status} ${response.getContentText()}`);
  }
}

function buildLineMessage(summary) {
  const lines = [
    `每日結算 ${summary.date}`,
    `營業額：${formatMoney(summary.sales)}`,
    `支出：${formatMoney(summary.expenses)}`,
    `當日現金：${formatMoney(summary.cash)}`,
    `筆數：${summary.count}`,
  ];

  if (summary.items.length) {
    lines.push("", "明細：");

    summary.items.slice(0, 20).forEach((entry) => {
      const value = entry.expense > 0
        ? `支出 ${formatMoney(entry.expense)}`
        : `收入 ${formatMoney(entry.amount)}`;

      lines.push(`- ${entry.item}：${value}`);
    });
  }

  if (summary.items.length > 20) {
    lines.push(`另有 ${summary.items.length - 20} 筆，請看 Google Sheets。`);
  }

  return lines.join("\n");
}

function testSendLine() {
  const today = Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd");
  const summary = closeDay(today);
  sendLineSummary(summary);
}

function ensureSheets() {
  ensureSheet(SHEET_NAME, ["日期", "品項", "金額", "支出", "類型", "建立時間"]);
  ensureSheet(SUMMARY_SHEET_NAME, ["結算日期", "筆數", "營業額", "支出", "當日現金", "結算時間"]);
}

function ensureSheet(name, headers) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }

  return sheet;
}

function normalizeDate(value) {
  if (Object.prototype.toString.call(value) === "[object Date]") {
    return Utilities.formatDate(value, TIMEZONE, "yyyy-MM-dd");
  }

  return String(value).slice(0, 10);
}

function formatMoney(value) {
  return `NT$${Number(value || 0).toLocaleString("zh-TW")}`;
}

function textResponse(text) {
  return ContentService
    .createTextOutput(text)
    .setMimeType(ContentService.MimeType.TEXT);
}
