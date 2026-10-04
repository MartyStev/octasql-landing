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
      query: "Why did B2B revenue in the North-West region drop by 14.2% in August vs July 2026?",
      adapter: "ClickHouse + PostgreSQL",
      steps: [
        {
          type: "system",
          text: "[1/4] Hybrid BM25 Index & DuckDB State Retrieval...",
          detail: "Found matching schema: `sales.orders`, `sales.products`, `geo.regions`. Resolved synonym 'revenue' -> `total_amount_usd`. Materialized state: monthly revenue by product_category and sales channel."
        },
        {
          type: "llm",
          text: "[2/4] Deductive Planning & Hypothesis Formulation:",
          detail: "H1: the change is concentrated in a few product categories vs H2: it is concentrated in a few sales channels vs H3: it is spread evenly across segments. Dimensions are ranked by how concentrated the movement is."
        },
        {
          type: "ast",
          text: "[3/4] AST SQL Sandbox Validation [PASSED - STRICT READ-ONLY]:",
          detail: `<span class="code-keyword">SELECT</span> <span class="code-func">date_trunc</span>(<span class="code-string">'month'</span>, o.created_at) <span class="code-keyword">AS</span> month, p.category <span class="code-keyword">AS</span> product_category,
       <span class="code-func">SUM</span>(o.total_amount_usd) <span class="code-keyword">AS</span> revenue
<span class="code-keyword">FROM</span> sales.orders o <span class="code-keyword">JOIN</span> sales.products p <span class="code-keyword">ON</span> o.product_id = p.id
<span class="code-keyword">JOIN</span> geo.regions r <span class="code-keyword">ON</span> o.region_id = r.id
<span class="code-keyword">WHERE</span> r.region_code = <span class="code-string">'NW'</span> <span class="code-keyword">AND</span> o.segment = <span class="code-string">'B2B'</span> <span class="code-keyword">AND</span> o.created_at >= <span class="code-string">'2026-07-01'</span> <span class="code-keyword">AND</span> o.created_at < <span class="code-string">'2026-09-01'</span>
<span class="code-keyword">GROUP BY</span> 1, 2;`
        },
        {
          type: "attribution",
          text: "[4/4] Segment Contribution Analysis (illustrative sample output):",
          detail: `Revenue change, Aug vs Jul 2026: <strong class="text-red-400">-14.2% (-$420,000)</strong>
Drill-down level 1 of 2 · dimension: product_category
+------------------------------------+----------------+-----------------+
| Segment (product_category)         | Share of Delta | Change ($)      |
+------------------------------------+----------------+-----------------+
| 1. Building Materials              | 70.0% (Main)   | -$294,000       |
| 2. Power Tools                     | 20.0%          | -$84,000        |
| 3. Paint & Coatings                | 15.0%          | -$63,000        |
| 4. Garden & Outdoor                | -6.0%          | +$25,200        |
| 5. (other, 5 segments)             | 1.0%           | -$4,200         |
+------------------------------------+----------------+-----------------+
<strong class="text-amber-400">Segment divergence:</strong> 'Garden & Outdoor' moved against the total (+$25,200).
<strong class="text-brand-400">Executive Insight:</strong> 70.0% of the decline is concentrated in 'Building Materials'. Next step: drill down into this segment by warehouse hub (level 2).`
        }
      ]
    },
    fintech: {
      query: "Which segments drove the +8.4% rise in churned 'PRO' accounts in August vs July 2026?",
      adapter: "PostgreSQL + Snowflake",
      steps: [
        {
          type: "system",
          text: "[1/4] Introspecting Subscriptions & Activity Metrics...",
          detail: "Retrieved schemas: `public.users`, `billing.subscriptions`. Materialized state: monthly churned accounts by billing_country and billing_cycle."
        },
        {
          type: "llm",
          text: "[2/4] Deductive Cohort Analysis & Segment Ranking:",
          detail: "H1: the increase is concentrated in a few countries vs H2: it is concentrated in a few billing cycles vs H3: it is spread evenly across segments."
        },
        {
          type: "ast",
          text: "[3/4] AST SQL Sandbox Validation [PASSED - STRICT READ-ONLY]:",
          detail: `<span class="code-keyword">SELECT</span> <span class="code-func">date_trunc</span>(<span class="code-string">'month'</span>, s.churned_at) <span class="code-keyword">AS</span> month, u.billing_country,
       <span class="code-func">COUNT</span>(*) <span class="code-keyword">AS</span> churned_accounts
<span class="code-keyword">FROM</span> billing.subscriptions s <span class="code-keyword">JOIN</span> public.users u <span class="code-keyword">ON</span> s.user_id = u.id
<span class="code-keyword">WHERE</span> s.tier = <span class="code-string">'PRO'</span> <span class="code-keyword">AND</span> s.churned_at >= <span class="code-string">'2026-07-01'</span> <span class="code-keyword">AND</span> s.churned_at < <span class="code-string">'2026-09-01'</span>
<span class="code-keyword">GROUP BY</span> 1, 2;`
        },
        {
          type: "attribution",
          text: "[4/4] Segment Contribution Analysis (illustrative sample output):",
          detail: `Churned PRO accounts, Aug vs Jul 2026: <strong class="text-red-400">+8.4% (+412 accounts)</strong>
Drill-down level 1 of 2 · dimension: billing_country
+------------------------------------+----------------+-----------------+
| Segment (billing_country)          | Share of Delta | Change (accts)  |
+------------------------------------+----------------+-----------------+
| 1. Germany                         | 43.7% (Main)   | +180            |
| 2. Poland                          | 29.1%          | +120            |
| 3. France                          | 15.5%          | +64             |
| 4. Spain                           | -5.3%          | -22             |
| 5. (other, 8 segments)             | 17.0%          | +70             |
+------------------------------------+----------------+-----------------+
<strong class="text-amber-400">Segment divergence:</strong> 'Spain' moved against the total (-22 accounts).
<strong class="text-brand-400">Executive Insight:</strong> 43.7% of the increase is concentrated in Germany (72.8% with Poland). Next step: drill down into Germany by billing cycle (level 2).`
        }
      ]
    },
    whatif: {
      query: "What-If: what would August B2B revenue in the North-West region be if 'Building Materials' had stayed at its July level?",
      adapter: "Greenplum MPP + DuckDB",
      steps: [
        {
          type: "system",
          text: "[1/4] Resolving Intervention Target...",
          detail: "Target slice: product_category = 'Building Materials'. Intervention: replace_with_baseline (baseline period: 2026-07). Scope: region = NW, segment = B2B."
        },
        {
          type: "llm",
          text: "[2/4] Counterfactual Construction:",
          detail: "Counterfactual total = actual value of all other segments + baseline value of the target segment. No demand or price model is applied."
        },
        {
          type: "ast",
          text: "[3/4] AST SQL Sandbox Validation [PASSED - STRICT READ-ONLY]:",
          detail: `<span class="code-keyword">SELECT</span> p.category <span class="code-keyword">AS</span> product_category, <span class="code-func">date_trunc</span>(<span class="code-string">'month'</span>, o.created_at) <span class="code-keyword">AS</span> month,
       <span class="code-func">SUM</span>(o.total_amount_usd) <span class="code-keyword">AS</span> revenue
<span class="code-keyword">FROM</span> sales.orders o <span class="code-keyword">JOIN</span> sales.products p <span class="code-keyword">ON</span> o.product_id = p.id
<span class="code-keyword">JOIN</span> geo.regions r <span class="code-keyword">ON</span> o.region_id = r.id
<span class="code-keyword">WHERE</span> r.region_code = <span class="code-string">'NW'</span> <span class="code-keyword">AND</span> o.segment = <span class="code-string">'B2B'</span> <span class="code-keyword">AND</span> o.created_at >= <span class="code-string">'2026-07-01'</span> <span class="code-keyword">AND</span> o.created_at < <span class="code-string">'2026-09-01'</span>
<span class="code-keyword">GROUP BY</span> 1, 2;`
        },
        {
          type: "attribution",
          text: "[4/4] What-If Result (illustrative sample output):",
          detail: `Intervention: 'Building Materials' = July baseline
• Actual August revenue: <strong class="text-brand-400">$2,538,000</strong>
• Target segment: $686,000 (actual) -> $980,000 (baseline)
• Counterfactual revenue: <strong class="text-brand-400">$2,832,000 (+$294,000, +11.6%)</strong>
• Remaining gap vs July ($2,958,000): <strong class="text-red-400">-$126,000 (-4.3%)</strong>
<strong class="text-amber-400">Note:</strong> the simulation replaces one segment with its baseline value; all other segments stay as observed. It is not a forecast.`
        }
      ]
    }
  },
  ru: {
    retail: {
      query: "Почему выручка B2B в Сибирском округе упала на 14.2% в августе по сравнению с июлем 2026?",
      adapter: "ClickHouse + PostgreSQL",
      steps: [
        {
          type: "system",
          text: "[1/4] Hybrid BM25 Index & DuckDB State Retrieval...",
          detail: "Found matching schema: `sales.orders`, `sales.products`, `geo.regions`. Resolved synonym 'выручка' -> `total_amount_rub`. Materialized state: ежемесячная выручка по product_category и каналам продаж."
        },
        {
          type: "llm",
          text: "[2/4] Deductive Planning & Hypothesis Formulation:",
          detail: "H1: изменение сосредоточено в нескольких товарных категориях vs H2: оно сосредоточено в нескольких каналах продаж vs H3: оно равномерно распределено по сегментам. Измерения ранжируются по концентрации движения."
        },
        {
          type: "ast",
          text: "[3/4] AST SQL Sandbox Validation [PASSED - STRICT READ-ONLY]:",
          detail: `<span class="code-keyword">SELECT</span> <span class="code-func">date_trunc</span>(<span class="code-string">'month'</span>, o.created_at) <span class="code-keyword">AS</span> month, p.category <span class="code-keyword">AS</span> product_category,
       <span class="code-func">SUM</span>(o.total_amount_rub) <span class="code-keyword">AS</span> revenue
<span class="code-keyword">FROM</span> sales.orders o <span class="code-keyword">JOIN</span> sales.products p <span class="code-keyword">ON</span> o.product_id = p.id
<span class="code-keyword">JOIN</span> geo.regions r <span class="code-keyword">ON</span> o.region_id = r.id
<span class="code-keyword">WHERE</span> r.region_code = <span class="code-string">'SIB'</span> <span class="code-keyword">AND</span> o.segment = <span class="code-string">'B2B'</span> <span class="code-keyword">AND</span> o.created_at >= <span class="code-string">'2026-07-01'</span> <span class="code-keyword">AND</span> o.created_at < <span class="code-string">'2026-09-01'</span>
<span class="code-keyword">GROUP BY</span> 1, 2;`
        },
        {
          type: "attribution",
          text: "[4/4] Анализ вкладов сегментов (иллюстративный пример вывода):",
          detail: `Изменение выручки, авг. к июл. 2026: <strong class="text-red-400">-14.2% (-3.42 млн ₽)</strong>
Детализация, уровень 1 из 2 · измерение: product_category
+------------------------------------+----------------+-----------------+
| Сегмент (product_category)         | Доля в дельте  | Δ (млн ₽)       |
+------------------------------------+----------------+-----------------+
| 1. Стройматериалы                  | 70.0% (Главн.) | -2.394          |
| 2. Электроинструмент               | 20.0%          | -0.684          |
| 3. Краски и покрытия               | 15.0%          | -0.513          |
| 4. Сад и огород                    | -6.0%          | +0.205          |
| 5. (прочие, 5 сегментов)           | 1.0%           | -0.034          |
+------------------------------------+----------------+-----------------+
<strong class="text-amber-400">Расхождение сегментов:</strong> «Сад и огород» двигался против общего итога (+0.205 млн ₽).
<strong class="text-brand-400">Управленческий вывод:</strong> 70.0% снижения сосредоточено в категории «Стройматериалы». Следующий шаг: детализировать её по складам (уровень 2).`
        }
      ]
    },
    fintech: {
      query: "Какие сегменты вызвали рост числа ушедших клиентов тарифа 'PRO' на 8.4% в августе по сравнению с июлем 2026?",
      adapter: "PostgreSQL + Snowflake",
      steps: [
        {
          type: "system",
          text: "[1/4] Introspecting Subscriptions & Activity Metrics...",
          detail: "Retrieved tables: `public.users`, `billing.subscriptions`. Materialized state: ежемесячное число ушедших клиентов по billing_city и billing_cycle."
        },
        {
          type: "llm",
          text: "[2/4] Deductive Cohort Analysis & Segment Ranking:",
          detail: "H1: рост сосредоточен в нескольких городах vs H2: он сосредоточен в нескольких billing-циклах vs H3: он равномерно распределён по сегментам."
        },
        {
          type: "ast",
          text: "[3/4] AST SQL Sandbox Validation [PASSED - STRICT READ-ONLY]:",
          detail: `<span class="code-keyword">SELECT</span> <span class="code-func">date_trunc</span>(<span class="code-string">'month'</span>, s.churned_at) <span class="code-keyword">AS</span> month, u.billing_city,
       <span class="code-func">COUNT</span>(*) <span class="code-keyword">AS</span> churned_accounts
<span class="code-keyword">FROM</span> billing.subscriptions s <span class="code-keyword">JOIN</span> public.users u <span class="code-keyword">ON</span> s.user_id = u.id
<span class="code-keyword">WHERE</span> s.tier = <span class="code-string">'PRO'</span> <span class="code-keyword">AND</span> s.churned_at >= <span class="code-string">'2026-07-01'</span> <span class="code-keyword">AND</span> s.churned_at < <span class="code-string">'2026-09-01'</span>
<span class="code-keyword">GROUP BY</span> 1, 2;`
        },
        {
          type: "attribution",
          text: "[4/4] Анализ вкладов сегментов (иллюстративный пример вывода):",
          detail: `Ушедшие клиенты PRO, авг. к июл. 2026: <strong class="text-red-400">+8.4% (+412 клиентов)</strong>
Детализация, уровень 1 из 2 · измерение: billing_city
+------------------------------------+----------------+-----------------+
| Сегмент (billing_city)             | Доля в дельте  | Δ клиентов      |
+------------------------------------+----------------+-----------------+
| 1. Москва                          | 43.7% (Главн.) | +180            |
| 2. Санкт-Петербург                 | 29.1%          | +120            |
| 3. Новосибирск                     | 15.5%          | +64             |
| 4. Казань                          | -5.3%          | -22             |
| 5. (прочие, 8 сегментов)           | 17.0%          | +70             |
+------------------------------------+----------------+-----------------+
<strong class="text-amber-400">Расхождение сегментов:</strong> «Казань» двигалась против общего итога (-22 клиента).
<strong class="text-brand-400">Управленческий вывод:</strong> 43.7% роста сосредоточено в Москве (72.8% вместе с Санкт-Петербургом). Следующий шаг: детализировать Москву по billing-циклу (уровень 2).`
        }
      ]
    },
    whatif: {
      query: "What-If: какой была бы выручка B2B в Сибирском округе в августе, если бы «Стройматериалы» остались на июльском уровне?",
      adapter: "Greenplum MPP + DuckDB",
      steps: [
        {
          type: "system",
          text: "[1/4] Resolving Intervention Target...",
          detail: "Целевой срез: product_category = 'Стройматериалы'. Вмешательство: replace_with_baseline (базовый период: 2026-07). Область: region = SIB, segment = B2B."
        },
        {
          type: "llm",
          text: "[2/4] Counterfactual Construction:",
          detail: "Контрфактический итог = фактические значения всех остальных сегментов + базовое значение целевого сегмента. Модели спроса и цен не применяются."
        },
        {
          type: "ast",
          text: "[3/4] AST SQL Sandbox Validation [PASSED - STRICT READ-ONLY]:",
          detail: `<span class="code-keyword">SELECT</span> p.category <span class="code-keyword">AS</span> product_category, <span class="code-func">date_trunc</span>(<span class="code-string">'month'</span>, o.created_at) <span class="code-keyword">AS</span> month,
       <span class="code-func">SUM</span>(o.total_amount_rub) <span class="code-keyword">AS</span> revenue
<span class="code-keyword">FROM</span> sales.orders o <span class="code-keyword">JOIN</span> sales.products p <span class="code-keyword">ON</span> o.product_id = p.id
<span class="code-keyword">JOIN</span> geo.regions r <span class="code-keyword">ON</span> o.region_id = r.id
<span class="code-keyword">WHERE</span> r.region_code = <span class="code-string">'SIB'</span> <span class="code-keyword">AND</span> o.segment = <span class="code-string">'B2B'</span> <span class="code-keyword">AND</span> o.created_at >= <span class="code-string">'2026-07-01'</span> <span class="code-keyword">AND</span> o.created_at < <span class="code-string">'2026-09-01'</span>
<span class="code-keyword">GROUP BY</span> 1, 2;`
        },
        {
          type: "attribution",
          text: "[4/4] Результат What-If (иллюстративный пример вывода):",
          detail: `Вмешательство: «Стройматериалы» = июльский базовый уровень
• Фактическая выручка за август: <strong class="text-brand-400">20.660 млн ₽</strong>
• Целевой сегмент: 5.806 млн ₽ (факт) -> 8.200 млн ₽ (база)
• Контрфактическая выручка: <strong class="text-brand-400">23.054 млн ₽ (+2.394 млн ₽, +11.6%)</strong>
• Остаточный разрыв с июлем (24.080 млн ₽): <strong class="text-red-400">-1.026 млн ₽ (-4.3%)</strong>
<strong class="text-amber-400">Примечание:</strong> симуляция заменяет один сегмент его базовым значением, остальные сегменты остаются как наблюдались. Это не прогноз.`
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
      if (step.type === 'attribution') badgeClass = 'text-indigo-400';

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

  // Token Math (illustrative assumptions, shown to the user in the calculator note):
  // Full-schema prompt: ~450 tokens per table.
  const naiveTokensPerQuery = Math.round(tablesCount * 450);
  // Retrieved semantic context: ~1,200 tokens.
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

// Contact requests are delivered through Formspree (https://formspree.io).
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xeaoeozk';

async function handleLicenseSubmit(event) {
  event.preventDefault();
  const form = document.getElementById('licenseForm');
  const successBox = document.getElementById('licenseSuccess');
  const notice = document.getElementById('licenseNotice');
  const submitBtn = document.getElementById('submitBtn');
  const t = I18N[currentLang] || I18N.en;

  const field = (id) => (document.getElementById(id) || {}).value || '';
  const honeypot = (document.getElementById('gotchaInput') || {}).value || '';
  if (honeypot) return; // bots fill the hidden field; humans never see it

  if (notice) notice.classList.add('hidden');
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span>${t.modal_busy}</span>`;

  try {
    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        company: field('companyInput'),
        email: field('emailInput'),
        dbms: field('dbInput'),
        plan: field('planInput'),
        language: currentLang,
        _subject: `OctaSQL request: ${field('companyInput')}`
      })
    });
    if (!response.ok) throw new Error(`Formspree responded with ${response.status}`);
    form.classList.add('hidden');
    successBox.classList.remove('hidden');
    form.reset();
  } catch (error) {
    if (notice) notice.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<span>${t.modal_btn_submit}</span>`;
    if (window.lucide) window.lucide.createIcons();
  }
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
        "OCTASQL_LICENSE_KEY": "<your-license-key>"
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
