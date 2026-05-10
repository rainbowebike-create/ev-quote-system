const STORAGE_KEY = "daily-accounting-records";
const SETTINGS_KEY = "daily-accounting-settings";

const entryForm = document.querySelector("#entryForm");
const entryDate = document.querySelector("#entryDate");
const itemName = document.querySelector("#itemName");
const amount = document.querySelector("#amount");
const recordsBody = document.querySelector("#recordsBody");
const salesTotal = document.querySelector("#salesTotal");
const expenseTotal = document.querySelector("#expenseTotal");
const cashTotal = document.querySelector("#cashTotal");
const statusText = document.querySelector("#statusText");
const settingsButton = document.querySelector("#settingsButton");
const setupPanel = document.querySelector("#setupPanel");
const scriptUrl = document.querySelector("#scriptUrl");
const saveSettings = document.querySelector("#saveSettings");
const clearLocal = document.querySelector("#clearLocal");
const closeDay = document.querySelector("#closeDay");
const sheetSubmitForm = document.querySelector("#sheetSubmitForm");

const formatter = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

let records = loadRecords();
let settings = loadSettings();

entryDate.value = today();
scriptUrl.value = settings.scriptUrl || "";
setupPanel.hidden = Boolean(settings.scriptUrl);
render();

settingsButton.addEventListener("click", () => {
  setupPanel.hidden = !setupPanel.hidden;
});

saveSettings.addEventListener("click", () => {
  settings = { scriptUrl: scriptUrl.value.trim() };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  setupPanel.hidden = Boolean(settings.scriptUrl);
  setStatus(settings.scriptUrl ? "設定已儲存。" : "尚未填入 Google Apps Script 網址。", settings.scriptUrl ? "success" : "error");
});

entryForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const type = new FormData(entryForm).get("type");
  const numericAmount = Number(amount.value);
  const record = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    date: entryDate.value,
    item: itemName.value.trim(),
    amount: type === "income" ? numericAmount : 0,
    expense: type === "expense" ? numericAmount : 0,
    type,
    createdAt: new Date().toISOString(),
  };

  records.unshift(record);
  saveRecords();
  render();
  submitToSheet("addRecord", record);
  entryForm.reset();
  entryDate.value = today();
});

entryDate.addEventListener("change", render);

clearLocal.addEventListener("click", () => {
  if (!confirm("確定要清空本機畫面上的暫存明細嗎？Google Sheets 內資料不會被刪除。")) {
    return;
  }

  records = [];
  saveRecords();
  render();
  setStatus("本機暫存已清空。", "success");
});

closeDay.addEventListener("click", () => {
  const date = entryDate.value || today();
  submitToSheet("closeDay", { date });
  setStatus(`${date} 已送出結算要求，後端會彙整並傳到 LINE 群組。`, "success");
});

function today() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

function loadRecords() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function render() {
  const currentDate = entryDate.value || today();
  const todayRecords = records.filter((record) => record.date === currentDate);
  const sales = todayRecords.reduce((sum, record) => sum + Number(record.amount || 0), 0);
  const expenses = todayRecords.reduce((sum, record) => sum + Number(record.expense || 0), 0);

  salesTotal.textContent = formatter.format(sales);
  expenseTotal.textContent = formatter.format(expenses);
  cashTotal.textContent = formatter.format(sales - expenses);

  recordsBody.innerHTML = "";

  if (!todayRecords.length) {
    recordsBody.innerHTML = `<tr><td class="empty-row" colspan="4">今天尚無資料</td></tr>`;
    return;
  }

  todayRecords.forEach((record) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(record.date)}</td>
      <td>${escapeHtml(record.item)}</td>
      <td class="amount">${record.amount ? formatter.format(record.amount) : "-"}</td>
      <td class="amount expense">${record.expense ? formatter.format(record.expense) : "-"}</td>
    `;
    recordsBody.append(row);
  });
}

function submitToSheet(action, payload) {
  const url = settings.scriptUrl || scriptUrl.value.trim();

  if (!url) {
    setStatus("尚未設定 Google Apps Script 網址，資料目前只留在本機畫面。", "error");
    setupPanel.hidden = false;
    return;
  }

  sheetSubmitForm.action = url;
  sheetSubmitForm.innerHTML = "";
  appendHidden("action", action);
  appendHidden("payload", JSON.stringify(payload));
  sheetSubmitForm.submit();
  setStatus("已送出到 Google Sheets。", "success");
}

function appendHidden(name, value) {
  const input = document.createElement("input");
  input.type = "hidden";
  input.name = name;
  input.value = value;
  sheetSubmitForm.append(input);
}

function setStatus(message, type) {
  statusText.textContent = message;
  statusText.className = `hint ${type || ""}`.trim();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
