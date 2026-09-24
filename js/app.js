/**
 * OctaSQL Landing Page Interactive Application Logic
 * Supports Bilingual i18n (English as primary, Russian as secondary)
 */

function getInitialLanguage() {
  const saved = localStorage.getItem('octasql_lang');
  if (saved && (saved === 'en' || saved === 'ru')) return saved;
  const navLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
  if (navLang.startsWith('ru') || navLang.startsWith('be') || navLang.startsWith('uk') || navLang.startsWith('kk')) {
    return 'ru';
  }
  return 'en';
}

let currentLang = getInitialLanguage();

document.addEventListener('DOMContentLoaded', () => {
  setLanguage(currentLang);
  initTerminalCase('retail');
  initRoiCalculator();
  if (window.lucide) {
    window.lucide.createIcons();
  }
});

// ==========================================
// 0. LANGUAGE (i18n) ENGINE
// ==========================================

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('octasql_lang', lang);
  document.documentElement.lang = lang;

  // Update all elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (I18N[lang] && I18N[lang][key] !== undefined) {
      el.innerHTML = I18N[lang][key];
    }
  });

  // Update placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (I18N[lang] && I18N[lang][key] !== undefined) {
      el.placeholder = I18N[lang][key];
    }
  });

  // Update switcher buttons UI
  document.querySelectorAll('.lang-btn').forEach(btn => {
    const btnLang = btn.getAttribute('data-lang');
    if (btnLang === lang) {
      btn.className = 'lang-btn px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-brand-500 text-dark-950 transition-all shadow-sm';
    } else {
      btn.className = 'lang-btn px-2.5 py-1 rounded-md text-xs font-mono text-slate-400 hover:text-white transition-all';
    }
  });

  // Refresh terminal & ROI with current language
  renderTerminal(currentCaseKey);
  if (typeof updateRoi === 'function') {
    updateRoi();
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Mobile Menu Toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');

function toggleMobileMenu() {
  if (mobileMenu) {
    mobileMenu.classList.toggle('hidden');
  }
}
if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener('click', toggleMobileMenu);
}

// ==========================================
// 1. LIVE TERMINAL SIMULATION & CASES (EN & RU)
// ==========================================

const TERMINAL_CASES = {
  en: {
    retail: {
      query: "Why did B2B revenue in the North-West Region drop by 14.2% in Q3?",
      adapter: "ClickHouse + PostgreSQL",
      steps: [
        {
          type: "system",
          text: "[1/4] Hybrid BM25 Index & DuckDB State Retrieval...",
          detail: "Found matching schema: `sales.orders`, `sales.order_items`, `geo.regions`. Resolved synonym 'revenue' -> `total_amount_usd`."
        },
        {
          type: "llm",
          text: "[2/4] Deductive Planning & Hypothesis Formulation:",
          detail: "H1: Average Order Value (AOV) contraction vs H2: Order Volume decline vs H3: Logistics & Fulfillment delay rate."
        },
        {
          type: "ast",
          text: "[3/4] AST SQL Sandbox Validation [PASSED - STRICT READ-ONLY]:",
          detail: `<span class="code-keyword">SELECT</span> r.region_name, <span class="code-func">date_trunc</span>(<span class="code-string">'quarter'</span>, o.created_at) <span class="code-keyword">AS</span> qtr,
       <span class="code-func">SUM</span>(o.total_amount_usd) <span class="code-keyword">AS</span> revenue, <span class="code-func">COUNT</span>(o.id) <span class="code-keyword">AS</span> orders_count,
       <span class="code-func">AVG</span>(o.total_amount_usd) <span class="code-keyword">AS</span> aov, <span class="code-func">SUM</span>(o.discount_amount) <span class="code-keyword">AS</span> discounts
<span class="code-keyword">FROM</span> sales.orders o <span class="code-keyword">JOIN</span> geo.regions r <span class="code-keyword">ON</span> o.region_id = r.id
<span class="code-keyword">WHERE</span> r.region_code = <span class="code-string">'NW'</span> <span class="code-keyword">AND</span> o.created_at >= <span class="code-string">'2026-01-01'</span>
<span class="code-keyword">GROUP BY</span> 1, 2 <span class="code-keyword">ORDER BY</span> 2;`
        },
        {
          type: "shapley",
          text: "[4/4] Causal Factor Attribution Engine (Net Variance Breakdown):",
          detail: `Net Revenue Variance: <strong class="text-red-400">-14.2% (-$420,000)</strong>
+------------------------------------+----------------+-----------------+
| Factor Contribution                | Share of Delta | Net Impact ($)  |
+------------------------------------+----------------+-----------------+
| 1. Key Warehouse Fulfillment Delay | -68.4% (Main)  | -$287,280       |
| 2. Marketing Promo Discount Cut    | -21.1%         | -$88,620        |
| 3. Seasonal Demand Fluctuation     | -10.5%         | -$44,100        |
+------------------------------------+----------------+-----------------+
<strong class="text-brand-400">Executive Insight:</strong> 68.4% of the revenue drop was isolated to shipping disruptions in the regional hub. Baseline customer demand remains solid.`
        }
      ]
    },
    fintech: {
      query: "What specific factors drove the +8.4% surge in 'PRO' tier customer churn?",
      adapter: "PostgreSQL + Snowflake",
      steps: [
        {
          type: "system",
          text: "[1/4] Introspecting Subscriptions & Activity Metrics...",
          detail: "Retrieved schemas: `public.users`, `billing.subscriptions`, `analytics.user_events`."
        },
        {
          type: "llm",
          text: "[2/4] Deductive Cohort Analysis & Anomaly Isolation:",
          detail: "H1: Pricing update vs H2: Payment Gateway 3D-Secure failure rate vs H3: Product feature deprecation."
        },
        {
          type: "ast",
          text: "[3/4] AST SQL Sandbox Validation [PASSED - STRICT READ-ONLY]:",
          detail: `<span class="code-keyword">SELECT</span> s.tier, s.churn_reason, <span class="code-func">count</span>(*) <span class="code-keyword">AS</span> churned_count,
       <span class="code-func">avg</span>(e.api_error_rate) <span class="code-keyword">AS</span> avg_error_rate
<span class="code-keyword">FROM</span> billing.subscriptions s
<span class="code-keyword">LEFT JOIN</span> analytics.user_events e <span class="code-keyword">ON</span> s.user_id = e.user_id
<span class="code-keyword">WHERE</span> s.churned_at >= <span class="code-func">NOW</span>() - <span class="code-keyword">INTERVAL</span> <span class="code-string">'30 days'</span> <span class="code-keyword">AND</span> s.tier = <span class="code-string">'PRO'</span>
<span class="code-keyword">GROUP BY</span> 1, 2;`
        },
        {
          type: "shapley",
          text: "[4/4] Causal Factor Attribution:",
          detail: `Net Churn Delta: <strong class="text-red-400">+8.4% (+412 accounts)</strong>
+------------------------------------+----------------+-----------------+
| Factor Contribution                | Share of Delta | Affected Users  |
+------------------------------------+----------------+-----------------+
| 1. Bank Gateway 3DS Auth Failures  | +74.2%         | 306 accounts    |
| 2. API Rate Limit Exceedance       | +18.3%         | 75 accounts     |
| 3. Organic Inactive Churn          | +7.5%          | 31 accounts     |
+------------------------------------+----------------+-----------------+
<strong class="text-brand-400">Executive Insight:</strong> 74.2% of churn was involuntary due to payment gateway auth timeouts. Immediate recommendation: Enable automated retry with fallback routing.`
        }
      ]
    },
    whatif: {
      query: "What-If Simulation: What is the projected margin impact of increasing discounts by 5%?",
      adapter: "Greenplum MPP + DuckDB",
      steps: [
        {
          type: "system",
          text: "[1/4] Loading Price Elasticity Curves...",
          detail: "Calculated Elasticity coefficient: e = -1.64 (Elastic demand). Baseline: $10.0M revenue, $2.8M net margin."
        },
        {
          type: "llm",
          text: "[2/4] What-If Simulation Matrix Execution:",
          detail: "Simulation scope: +5% discount rate across top 200 SKU items. Projected Volume response: +8.2%."
        },
        {
          type: "ast",
          text: "[3/4] AST SQL Sandbox Validation [PASSED - STRICT READ-ONLY]:",
          detail: `<span class="code-keyword">WITH</span> sim <span class="code-keyword">AS</span> (
  <span class="code-keyword">SELECT</span> sku_id, price * <span class="code-num">0.95</span> <span class="code-keyword">AS</span> sim_price, unit_cost,
         qty * (<span class="code-num">1</span> + (<span class="code-num">0.05</span> * <span class="code-num">1.64</span>)) <span class="code-keyword">AS</span> sim_qty
  <span class="code-keyword">FROM</span> dwh.product_sales <span class="code-keyword">WHERE</span> sale_year = <span class="code-num">2026</span>
)
<span class="code-keyword">SELECT</span> <span class="code-func">SUM</span>(sim_price * sim_qty) <span class="code-keyword">AS</span> projected_revenue,
       <span class="code-func">SUM</span>((sim_price - unit_cost) * sim_qty) <span class="code-keyword">AS</span> projected_margin
<span class="code-keyword">FROM</span> sim;`
        },
        {
          type: "shapley",
          text: "[4/4] Projected Simulation Outcome:",
          detail: `Simulation Outcome (+5% Discount):
• Projected Revenue: <strong class="text-brand-400">$10.28M (+2.79%)</strong>
• Projected Unit Volume: <strong class="text-brand-400">+8.2%</strong>
• Projected Net Margin: <strong class="text-red-400">$2.64M (-5.68%)</strong>
<strong class="text-amber-400">Recommendation:</strong> A blanket discount erodes gross margins. Target promotional discounts strictly on items with elasticity e > -2.2.`
        }
      ]
    }
  },
  ru: {
    retail: {
      query: "Почему выручка сегмента B2B в Сибирском округе упала на 14.2% в Q3 2026?",
      adapter: "ClickHouse + PostgreSQL",
      steps: [
        {
          type: "system",
          text: "[1/4] Hybrid BM25 Index & DuckDB State Retrieval...",
          detail: "Found matching schema: `sales.orders`, `sales.order_items`, `geo.regions`. Resolved synonym 'выручка' -> `total_amount_rub`."
        },
        {
          type: "llm",
          text: "[2/4] Deductive Planning & Hypothesis Formulation:",
          detail: "H1: Снижение среднего чека (AOV) vs H2: Падение объема заказов (Volume) vs H3: Увеличение отмен (Cancel Rate)."
        },
        {
          type: "ast",
          text: "[3/4] AST SQL Sandbox Validation [PASSED - STRICT READ-ONLY]:",
          detail: `<span class="code-keyword">SELECT</span> r.region_name, <span class="code-func">date_trunc</span>(<span class="code-string">'quarter'</span>, o.created_at) <span class="code-keyword">AS</span> qtr,
       <span class="code-func">SUM</span>(o.total_amount_rub) <span class="code-keyword">AS</span> revenue, <span class="code-func">COUNT</span>(o.id) <span class="code-keyword">AS</span> orders_count,
       <span class="code-func">AVG</span>(o.total_amount_rub) <span class="code-keyword">AS</span> aov, <span class="code-func">SUM</span>(o.discount_amount) <span class="code-keyword">AS</span> discounts
<span class="code-keyword">FROM</span> sales.orders o <span class="code-keyword">JOIN</span> geo.regions r <span class="code-keyword">ON</span> o.region_id = r.id
<span class="code-keyword">WHERE</span> r.region_code = <span class="code-string">'SIB'</span> <span class="code-keyword">AND</span> o.created_at >= <span class="code-string">'2026-01-01'</span>
<span class="code-keyword">GROUP BY</span> 1, 2 <span class="code-keyword">ORDER BY</span> 2;`
        },
        {
          type: "shapley",
          text: "[4/4] Causal Factor Attribution Engine (Декомпозиция дельты):",
          detail: `Дельта общей выручки: <strong class="text-red-400">-14.2% (-3.42 млн ₽)</strong>
+------------------------------------+----------------+-----------------+
| Фактор влияния                     | Вклад в дельту | Эффект (₽)      |
+------------------------------------+----------------+-----------------+
| 1. Сбой логистики ключевого склада | -68.4% (Главн) | -2.34 млн ₽     |
| 2. Снижение маркетинговой скидки   | -21.1%         | -0.72 млн ₽     |
| 3. Сезонное колебание спроса       | -10.5%         | -0.36 млн ₽     |
+------------------------------------+----------------+-----------------+
<strong class="text-brand-400">Управленческий вывод:</strong> 68.4% падения вызвано задержкой отгрузок категории 'Строительные смеси' со склада в Новосибирске. Базовый спрос стабилен.`
        }
      ]
    },
    fintech: {
      query: "Какие факторы вызвали всплеск оттока (Churn Rate) клиентов тарифа 'PRO' на 8.4%?",
      adapter: "PostgreSQL + Snowflake",
      steps: [
        {
          type: "system",
          text: "[1/4] Introspecting Subscriptions & Activity Metrics...",
          detail: "Retrieved tables: `public.users`, `billing.subscriptions`, `analytics.user_events`."
        },
        {
          type: "llm",
          text: "[2/4] Deductive Cohort Analysis & Anomaly Isolation:",
          detail: "H1: Изменение ценовой политики vs H2: Ошибки 3D-Secure при автопродлении vs H3: Снижение DAU/MAU."
        },
        {
          type: "ast",
          text: "[3/4] AST SQL Sandbox Validation [PASSED - STRICT READ-ONLY]:",
          detail: `<span class="code-keyword">SELECT</span> s.tier, s.churn_reason, <span class="code-func">count</span>(*) <span class="code-keyword">AS</span> churned_count,
       <span class="code-func">avg</span>(e.api_error_rate) <span class="code-keyword">AS</span> avg_error_rate
<span class="code-keyword">FROM</span> billing.subscriptions s
<span class="code-keyword">LEFT JOIN</span> analytics.user_events e <span class="code-keyword">ON</span> s.user_id = e.user_id
<span class="code-keyword">WHERE</span> s.churned_at >= <span class="code-func">NOW</span>() - <span class="code-keyword">INTERVAL</span> <span class="code-string">'30 days'</span> <span class="code-keyword">AND</span> s.tier = <span class="code-string">'PRO'</span>
<span class="code-keyword">GROUP BY</span> 1, 2;`
        },
        {
          type: "shapley",
          text: "[4/4] Causal Factor Attribution Engine:",
          detail: `Дельта Churn Rate: <strong class="text-red-400">+8.4% (+412 клиентов)</strong>
+------------------------------------+----------------+-----------------+
| Фактор влияния                     | Вклад в дельту | Затронуто       |
+------------------------------------+----------------+-----------------+
| 1. Ошибки эквайринга Банка X       | +74.2%         | 306 клиентов    |
| 2. Превышение лимитов API rate     | +18.3%         | 75 клиентов     |
| 3. Органический отток              | +7.5%          | 31 клиент       |
+------------------------------------+----------------+-----------------+
<strong class="text-brand-400">Управленческий вывод:</strong> 74.2% оттока является непроизвольным (Involuntary Churn) из-за сбоя в шлюзе эквайринга. Рекомендуется активировать Smart Retry.`
        }
      ]
    },
    whatif: {
      query: "What-If Симуляция: Как изменится маржинальная прибыль при увеличении скидки на 5%?",
      adapter: "Greenplum MPP + DuckDB",
      steps: [
        {
          type: "system",
          text: "[1/4] Loading Historical Price Elasticity Curve...",
          detail: "Elasticity coefficient calculated: e = -1.64 (Эластичный спрос). Baseline: 100 млн ₽ выручка, 28 млн ₽ маржа."
        },
        {
          type: "llm",
          text: "[2/4] What-If Simulation Matrix Execution:",
          detail: "Simulation scope: +5% discount rate across top 200 SKU items. Projected Volume change: +8.2%."
        },
        {
          type: "ast",
          text: "[3/4] AST SQL Sandbox Validation [PASSED - STRICT READ-ONLY]:",
          detail: `<span class="code-keyword">WITH</span> sim <span class="code-keyword">AS</span> (
  <span class="code-keyword">SELECT</span> sku_id, price * <span class="code-num">0.95</span> <span class="code-keyword">AS</span> sim_price, unit_cost,
         qty * (<span class="code-num">1</span> + (<span class="code-num">0.05</span> * <span class="code-num">1.64</span>)) <span class="code-keyword">AS</span> sim_qty
  <span class="code-keyword">FROM</span> dwh.product_sales <span class="code-keyword">WHERE</span> sale_year = <span class="code-num">2026</span>
)
<span class="code-keyword">SELECT</span> <span class="code-func">SUM</span>(sim_price * sim_qty) <span class="code-keyword">AS</span> projected_revenue,
       <span class="code-func">SUM</span>((sim_price - unit_cost) * sim_qty) <span class="code-keyword">AS</span> projected_margin
<span class="code-keyword">FROM</span> sim;`
        },
        {
          type: "shapley",
          text: "[4/4] Projected Simulation Results:",
          detail: `Итог симуляции (+5% скидка):
• Прогноз выручки: <strong class="text-brand-400">102.79 млн ₽ (+2.79%)</strong>
• Прогноз объема продаж: <strong class="text-brand-400">+8.2% в штуках</strong>
• Прогноз маржинальной прибыли: <strong class="text-red-400">26.41 млн ₽ (-5.68%)</strong>
<strong class="text-amber-400">Рекомендация:</strong> Увеличение скидки размывает чистую маржу. Рекомендуется таргетировать промо-акцию только на товары с эластичностью e > -2.2.`
        }
      ]
    }
  }
};

let currentCaseKey = 'retail';
let activeStepTimeouts = [];

function switchTerminalCase(caseKey) {
  currentCaseKey = caseKey;
  
  // Update Tab Styling
  document.querySelectorAll('.demo-tab').forEach(tab => {
    tab.classList.remove('active');
    tab.classList.remove('border-brand-500', 'bg-brand-500/20', 'text-white');
    tab.classList.add('border-slate-700', 'bg-slate-800/60', 'text-slate-300');
  });

  const activeTab = document.getElementById(`tab-${caseKey}`);
  if (activeTab) {
    activeTab.classList.add('active');
    activeTab.classList.remove('border-slate-700', 'bg-slate-800/60', 'text-slate-300');
    activeTab.classList.add('border-brand-500', 'bg-brand-500/20', 'text-white');
  }

  renderTerminal(caseKey);
}

function reRunCurrentCase() {
  renderTerminal(currentCaseKey);
}

function initTerminalCase(caseKey) {
  renderTerminal(caseKey);
}

function renderTerminal(caseKey) {
  const langData = TERMINAL_CASES[currentLang] || TERMINAL_CASES.en;
  const data = langData[caseKey] || langData.retail;
  const container = document.getElementById('terminal-content');
  if (!container) return;

  // Clear all pending timeouts from previous runs
  activeStepTimeouts.forEach(t => clearTimeout(t));
  activeStepTimeouts = [];

  container.innerHTML = '';

  // Prompt Line
  const promptEl = document.createElement('div');
  promptEl.className = 'flex items-start gap-2 text-brand-400 font-semibold mb-4';
  promptEl.innerHTML = `
    <span class="text-slate-400 font-normal">user@dwh-bi:~$</span>
    <span>octasql deduce "${data.query}"</span>
  `;
  container.appendChild(promptEl);

  // Render Steps Sequentially
  let delay = 100;
  data.steps.forEach((step, index) => {
    const t = setTimeout(() => {
      const stepBox = document.createElement('div');
      stepBox.className = 'p-3.5 rounded-xl bg-dark-900 border border-slate-800 text-xs animate-in fade-in duration-300';
      
      let badgeClass = 'text-brand-400';
      if (step.type === 'ast') badgeClass = 'text-emerald-400';
      if (step.type === 'llm') badgeClass = 'text-accent-400';
      if (step.type === 'shapley') badgeClass = 'text-indigo-400';

      stepBox.innerHTML = `
        <div class="font-bold ${badgeClass} mb-1 flex items-center justify-between">
          <span>${step.text}</span>
          <span class="text-[10px] text-slate-400 font-mono">step_${index + 1}</span>
        </div>
        <div class="text-slate-300 font-mono text-xs whitespace-pre-wrap leading-relaxed">${step.detail}</div>
      `;
      container.appendChild(stepBox);
      container.scrollTop = container.scrollHeight;

      if (index === data.steps.length - 1) {
        if (window.lucide) window.lucide.createIcons();
      }
    }, delay);
    activeStepTimeouts.push(t);
    delay += 250;
  });
}

// ==========================================
// 2. LLM TOKEN & API COST ROI CALCULATOR (BULLETPROOF)
// ==========================================

function updateRoi() {
  const queriesRange = document.getElementById('queriesRange');
  const tablesRange = document.getElementById('tablesRange');
  const modelSelect = document.getElementById('modelSelect');
  
  const queriesVal = document.getElementById('queriesVal');
  const tablesVal = document.getElementById('tablesVal');
  const annualSavingsVal = document.getElementById('annualSavingsVal');
  const savedTokensVal = document.getElementById('savedTokensVal');

  if (!queriesRange || !tablesRange) return;

  const queriesPerMonth = parseInt(queriesRange.value) || 5000;
  const tablesCount = parseInt(tablesRange.value) || 100;
  const modelRate = modelSelect ? parseFloat(modelSelect.value) : 3.5; // $ per 1M tokens

  const isEn = (currentLang === 'en');

  if (queriesVal) {
    queriesVal.innerText = `${queriesPerMonth.toLocaleString(isEn ? 'en-US' : 'ru-RU')} ${isEn ? 'queries/mo' : 'запросов/мес'}`;
  }
  if (tablesVal) {
    tablesVal.innerText = `${tablesCount} ${isEn ? 'tables' : 'таблиц'}`;
  }

  // Token Math:
  // Naive Text-to-SQL: full schema dump = tablesCount * 450 tokens/table.
  // Plus 35% retry waste on hallucinations = naiveTokens * 1.35.
  const naiveTokensPerQuery = Math.round(tablesCount * 450 * 1.35);
  // OctaSQL: surgical context = 1,200 tokens.
  const octaTokensPerQuery = 1200;
  
  const tokensSavedPerQuery = Math.max(0, naiveTokensPerQuery - octaTokensPerQuery);
  const annualTokensSaved = tokensSavedPerQuery * queriesPerMonth * 12;

  // Dollar savings:
  const annualUsdSaved = Math.round((annualTokensSaved / 1000000) * modelRate);

  // Format Tokens Display
  let tokensDisplay = "";
  if (annualTokensSaved >= 1000000000) {
    tokensDisplay = `${(annualTokensSaved / 1000000000).toFixed(1)}B ${isEn ? 'tokens' : 'токенов'}`;
  } else {
    tokensDisplay = `${Math.round(annualTokensSaved / 1000000).toLocaleString(isEn ? 'en-US' : 'ru-RU')}M ${isEn ? 'tokens' : 'млн токенов'}`;
  }

  if (savedTokensVal) {
    savedTokensVal.innerText = tokensDisplay;
  }

  if (annualSavingsVal) {
    if (isEn) {
      annualSavingsVal.innerText = `$${annualUsdSaved.toLocaleString('en-US')}`;
    } else {
      const rubSaved = Math.round(annualUsdSaved * 92);
      annualSavingsVal.innerText = `${rubSaved.toLocaleString('ru-RU')} ₽`;
    }
  }
}

function initRoiCalculator() {
  const queriesRange = document.getElementById('queriesRange');
  const tablesRange = document.getElementById('tablesRange');
  const modelSelect = document.getElementById('modelSelect');

  if (queriesRange) {
    queriesRange.addEventListener('input', updateRoi);
    queriesRange.addEventListener('change', updateRoi);
  }
  if (tablesRange) {
    tablesRange.addEventListener('input', updateRoi);
    tablesRange.addEventListener('change', updateRoi);
  }
  if (modelSelect) {
    modelSelect.addEventListener('change', updateRoi);
  }

  updateRoi();
}

// ==========================================
// 3. MODAL & LEAD CAPTURE
// ==========================================

function openLicenseModal(planName = 'Developer PoC') {
  const modal = document.getElementById('licenseModal');
  const planInput = document.getElementById('planInput');
  const form = document.getElementById('licenseForm');
  const successBox = document.getElementById('licenseSuccess');

  if (planInput) planInput.value = planName;
  if (form) form.classList.remove('hidden');
  if (successBox) successBox.classList.add('hidden');
  if (modal) modal.classList.remove('hidden');
}

function closeLicenseModal() {
  const modal = document.getElementById('licenseModal');
  if (modal) modal.classList.add('hidden');
}

function handleLicenseSubmit(event) {
  event.preventDefault();
  const form = document.getElementById('licenseForm');
  const successBox = document.getElementById('licenseSuccess');
  const submitBtn = document.getElementById('submitBtn');

  submitBtn.disabled = true;
  submitBtn.innerHTML = (currentLang === 'en') ? 'Generating Key...' : 'Генерация лицензии...';

  setTimeout(() => {
    form.classList.add('hidden');
    successBox.classList.remove('hidden');
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<span>${I18N[currentLang].modal_btn_submit}</span>`;
    if (window.lucide) window.lucide.createIcons();
  }, 800);
}

// ==========================================
// 4. MCP CONFIG COPY HELPER
// ==========================================

function copyMcpConfig() {
  const config = `{
  "mcpServers": {
    "octasql": {
      "command": "docker",
      "args": ["exec", "-i", "octasql-prod", "octasql", "mcp"],
      "env": {
        "OCTASQL_LICENSE_KEY": "OCTASQL-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    }
  }
}`;
  navigator.clipboard.writeText(config).then(() => {
    const btnText = document.getElementById('copyMcpBtnText');
    if (btnText) {
      const orig = btnText.innerText;
      btnText.innerText = (currentLang === 'en') ? 'Copied to Clipboard!' : 'Скопировано в буфер!';
      setTimeout(() => {
        btnText.innerText = orig;
      }, 2500);
    }
  });
}
