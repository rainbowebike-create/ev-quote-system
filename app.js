const products = [
  {
    id: "ev-scooter-pro",
    name: "EV 城市通勤車 Pro",
    category: "vehicle",
    tag: "電動車輛",
    spec: "72V 雙電池、續航 120 km、適合門市展示與都會通勤。",
    price: 68800,
    color: "#2f9f74",
    accent: "#1d5d72",
    image: "scooter",
  },
  {
    id: "ev-cargo-lite",
    name: "EV 商用載貨車 Lite",
    category: "vehicle",
    tag: "電動車輛",
    spec: "強化貨架、低重心底盤、適合外送與短程配送。",
    price: 79800,
    color: "#d98d19",
    accent: "#384047",
    image: "cargo",
  },
  {
    id: "battery-72v",
    name: "72V 高效鋰電池組",
    category: "battery",
    tag: "電池系統",
    spec: "BMS 保護、快拆設計、支援車隊備品管理。",
    price: 16800,
    color: "#4f7fbf",
    accent: "#2f9f74",
    image: "battery",
  },
  {
    id: "charger-fast",
    name: "快充充電器 12A",
    category: "battery",
    tag: "電池系統",
    spec: "智慧溫控、過充保護、適用 72V 系列車款。",
    price: 4200,
    color: "#8e6ac8",
    accent: "#384047",
    image: "charger",
  },
  {
    id: "brake-set",
    name: "前後碟煞維修組",
    category: "parts",
    tag: "維修零件",
    spec: "含來令片、碟盤、油管，門市保養常備品。",
    price: 2800,
    color: "#bd3f32",
    accent: "#384047",
    image: "brake",
  },
  {
    id: "controller",
    name: "智慧控制器 1500W",
    category: "parts",
    tag: "維修零件",
    spec: "穩定輸出、支援故障診斷，適合維修中心庫存。",
    price: 5600,
    color: "#384047",
    accent: "#2f9f74",
    image: "controller",
  },
  {
    id: "helmet",
    name: "經銷限定安全帽",
    category: "accessory",
    tag: "配件精品",
    spec: "門市銷售加購品，含品牌貼標與展示盒。",
    price: 1500,
    color: "#f1bd4b",
    accent: "#203038",
    image: "helmet",
  },
  {
    id: "rear-box",
    name: "後置置物箱 45L",
    category: "accessory",
    tag: "配件精品",
    spec: "通勤與商用皆可搭配，快拆底座，黑色霧面。",
    price: 2200,
    color: "#5d737e",
    accent: "#2f9f74",
    image: "box",
  },
];

const categoryButtons = document.querySelectorAll(".category");
const productGrid = document.querySelector("#productGrid");
const template = document.querySelector("#productCardTemplate");
const quoteItems = document.querySelector("#quoteItems");
const tier = document.querySelector("#tier");
const search = document.querySelector("#search");
const quoteNo = document.querySelector("#quoteNo");
const itemCount = document.querySelector("#itemCount");
const subtotalEl = document.querySelector("#subtotal");
const discountEl = document.querySelector("#discount");
const taxEl = document.querySelector("#tax");
const grandTotalEl = document.querySelector("#grandTotal");
const clearQuote = document.querySelector("#clearQuote");
const printQuote = document.querySelector("#printQuote");

let activeCategory = "all";
let quote = new Map();

quoteNo.value = `Q${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-001`;

const money = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

function productSvg(product) {
  const common = `fill="${product.color}" stroke="${product.accent}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"`;
  const dark = `fill="${product.accent}"`;

  const drawings = {
    scooter: `<svg viewBox="0 0 360 180" role="img" aria-label="${product.name}">
      <circle cx="86" cy="132" r="28" ${dark}/><circle cx="272" cy="132" r="28" ${dark}/>
      <path d="M88 124h88l40-52h50c30 0 48 22 50 53" ${common}/>
      <path d="M174 123h68M238 72l-13-34h42" fill="none" stroke="${product.accent}" stroke-width="8" stroke-linecap="round"/>
      <rect x="116" y="48" width="74" height="34" rx="10" fill="#fff" stroke="${product.accent}" stroke-width="5"/>
    </svg>`,
    cargo: `<svg viewBox="0 0 360 180" role="img" aria-label="${product.name}">
      <circle cx="86" cy="134" r="28" ${dark}/><circle cx="278" cy="134" r="28" ${dark}/>
      <path d="M70 126h78l34-62h70l46 62" ${common}/>
      <rect x="178" y="44" width="96" height="54" rx="8" fill="#fff" stroke="${product.accent}" stroke-width="6"/>
      <path d="M56 88h72l18 38" fill="none" stroke="${product.accent}" stroke-width="8"/>
    </svg>`,
    battery: `<svg viewBox="0 0 360 180" role="img" aria-label="${product.name}">
      <rect x="82" y="50" width="188" height="88" rx="16" ${common}/>
      <rect x="270" y="76" width="28" height="36" rx="6" ${dark}/>
      <path d="M166 68l-24 38h32l-18 34 54-52h-34l16-20z" fill="#fff"/>
    </svg>`,
    charger: `<svg viewBox="0 0 360 180" role="img" aria-label="${product.name}">
      <rect x="86" y="58" width="142" height="76" rx="16" ${common}/>
      <path d="M228 96h38c28 0 28-40 0-40h-10M114 86h70M114 110h42" fill="none" stroke="${product.accent}" stroke-width="8" stroke-linecap="round"/>
      <circle cx="260" cy="56" r="8" ${dark}/><circle cx="286" cy="56" r="8" ${dark}/>
    </svg>`,
    brake: `<svg viewBox="0 0 360 180" role="img" aria-label="${product.name}">
      <circle cx="180" cy="92" r="58" fill="#fff" stroke="${product.accent}" stroke-width="10"/>
      <circle cx="180" cy="92" r="20" ${dark}/>
      <path d="M180 34v116M122 92h116M139 51l82 82M221 51l-82 82" stroke="${product.color}" stroke-width="8" stroke-linecap="round"/>
      <path d="M230 66c20 20 22 52 4 76" fill="none" stroke="${product.color}" stroke-width="14" stroke-linecap="round"/>
    </svg>`,
    controller: `<svg viewBox="0 0 360 180" role="img" aria-label="${product.name}">
      <rect x="92" y="52" width="176" height="86" rx="14" ${common}/>
      <path d="M122 82h116M122 108h76M92 72H60M92 118H60M268 72h32M268 118h32" stroke="#fff" stroke-width="8" stroke-linecap="round"/>
      <circle cx="238" cy="106" r="13" fill="#fff"/>
    </svg>`,
    helmet: `<svg viewBox="0 0 360 180" role="img" aria-label="${product.name}">
      <path d="M86 118c8-52 47-82 98-82 56 0 94 36 94 92v16H130c-27 0-47-6-44-26z" ${common}/>
      <path d="M188 72h82c-6-16-32-34-72-34" fill="#fff" opacity=".9"/>
      <path d="M122 126h72" stroke="${product.accent}" stroke-width="10" stroke-linecap="round"/>
    </svg>`,
    box: `<svg viewBox="0 0 360 180" role="img" aria-label="${product.name}">
      <rect x="82" y="56" width="196" height="86" rx="16" ${common}/>
      <path d="M104 78h152M130 56l20-24h60l20 24" fill="none" stroke="${product.accent}" stroke-width="8" stroke-linecap="round"/>
      <rect x="156" y="92" width="48" height="22" rx="6" fill="#fff"/>
    </svg>`,
  };

  return drawings[product.image];
}

function renderProducts() {
  const term = search.value.trim().toLowerCase();
  const visible = products.filter((product) => {
    const matchesCategory = activeCategory === "all" || product.category === activeCategory;
    const matchesTerm = `${product.name} ${product.tag} ${product.spec}`.toLowerCase().includes(term);
    return matchesCategory && matchesTerm;
  });

  productGrid.innerHTML = "";

  visible.forEach((product) => {
    const card = template.content.firstElementChild.cloneNode(true);
    card.querySelector(".product-visual").innerHTML = productSvg(product);
    card.querySelector(".product-tag").textContent = product.tag;
    card.querySelector("h3").textContent = product.name;
    card.querySelector("p").textContent = product.spec;
    card.querySelector("strong").textContent = money.format(product.price);
    card.querySelector("button").addEventListener("click", () => addItem(product.id));
    productGrid.append(card);
  });

  if (!visible.length) {
    productGrid.innerHTML = `<p class="empty-state">找不到符合條件的商品。</p>`;
  }
}

function addItem(productId) {
  const current = quote.get(productId) || 0;
  quote.set(productId, current + 1);
  renderQuote();
}

function setQty(productId, qty) {
  if (qty <= 0) {
    quote.delete(productId);
  } else {
    quote.set(productId, qty);
  }
  renderQuote();
}

function renderQuote() {
  quoteItems.innerHTML = "";

  if (!quote.size) {
    quoteItems.innerHTML = `<p class="empty-state">從產品目錄加入車輛或零件後，這裡會自動整理報價內容。</p>`;
  }

  let subtotal = 0;
  let totalQty = 0;

  quote.forEach((qty, productId) => {
    const product = products.find((item) => item.id === productId);
    subtotal += product.price * qty;
    totalQty += qty;

    const item = document.createElement("article");
    item.className = "quote-item";
    item.innerHTML = `
      <div>
        <h3>${product.name}</h3>
        <p>${money.format(product.price)} x ${qty}</p>
      </div>
      <div class="qty-control">
        <button class="qty-button" type="button" aria-label="減少">-</button>
        <strong>${qty}</strong>
        <button class="qty-button" type="button" aria-label="增加">+</button>
        <button class="remove-button" type="button">移除</button>
      </div>
    `;

    const [minus, plus] = item.querySelectorAll(".qty-button");
    minus.addEventListener("click", () => setQty(productId, qty - 1));
    plus.addEventListener("click", () => setQty(productId, qty + 1));
    item.querySelector(".remove-button").addEventListener("click", () => setQty(productId, 0));
    quoteItems.append(item);
  });

  const rate = Number(tier.value);
  const discounted = subtotal * rate;
  const discount = subtotal - discounted;
  const tax = discounted * 0.05;
  const grandTotal = discounted + tax;

  itemCount.textContent = `${totalQty} 項`;
  subtotalEl.textContent = money.format(subtotal);
  discountEl.textContent = `-${money.format(discount)}`;
  taxEl.textContent = money.format(tax);
  grandTotalEl.textContent = money.format(grandTotal);
}

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    categoryButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    activeCategory = button.dataset.category;
    renderProducts();
  });
});

search.addEventListener("input", renderProducts);
tier.addEventListener("change", renderQuote);
clearQuote.addEventListener("click", () => {
  quote = new Map();
  renderQuote();
});
printQuote.addEventListener("click", () => window.print());

renderProducts();
renderQuote();
