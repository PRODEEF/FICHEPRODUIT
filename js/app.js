// ===== CODE TESTEUR =====
const ACCESS_CODE = 'GLISSbeta202602';

function checkGateCode() {
  const input = document.getElementById('gate-code');
  const errorEl = document.getElementById('gate-error');
  const code = (input && input.value ? input.value.trim() : '').toLowerCase();
  if (code === ACCESS_CODE.toLowerCase()) {
    sessionStorage.setItem('ficheproduct_access', '1');
    document.getElementById('page-gate').classList.add('hidden');
    document.getElementById('app-content').style.display = '';
    errorEl.textContent = '';
    loadCatalogFromApi();
  } else {
    errorEl.textContent = code ? 'Code incorrect.' : 'Veuillez saisir un code.';
  }
}

function initGate() {
  if (sessionStorage.getItem('ficheproduct_access')) {
    document.getElementById('page-gate').classList.add('hidden');
    document.getElementById('app-content').style.display = '';
    loadCatalogFromApi();
    return;
  }
  document.getElementById('app-content').style.display = 'none';
  document.getElementById('gate-code').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') checkGateCode();
  });
}

// ===== CATALOGUE ENRICHI (API) =====
let catalogProducts = null;

function getProducts() {
  if (catalogProducts && catalogProducts.length > 0) return catalogProducts;
  return typeof products !== 'undefined' ? products : [];
}

async function loadCatalogFromApi() {
  if (!isApiAvailable()) return;
  try {
    const res = await fetch(getApiBase() + '/api/catalog?section=kitesurf');
    if (!res.ok) return;
    const data = await res.json();
    if (data.products && Array.isArray(data.products) && data.products.length > 0) {
      catalogProducts = data.products;
    }
  } catch (_) {}
}

// ===== NAVIGATION =====
function goToPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + pageId).classList.add('active');
  if (pageId === 'search') initSearchPage();
}

// ===== ANALYSIS (réelle via API) =====
let analysisResult = null;

function getApiBase() {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin;
  }
  return '';
}

function isApiAvailable() {
  const base = getApiBase();
  return base && base !== 'null' && !/^file:\/\//i.test(base);
}

function runDemoAnalysis(rawInput) {
  const s = String(rawInput).toLowerCase().trim();
  let url = rawInput.trim();
  if (!/^https?:\/\//i.test(url)) {
    const slug = s.replace(/\s+/g, '-').replace(/[^a-z0-9-]/gi, '') || 'exemple';
    url = 'https://www.' + slug + '.fr';
  }
  const productList = getProducts();
  const brands = [...new Set(productList.map(p => p.brand))].slice(0, 8);
  const categories = [...new Set(productList.map(p => p.category))];
  const subcategories = [...new Set(productList.map(p => p.subcategory))];
  return {
    url,
    cms: 'PrestaShop',
    productCount: productList.length,
    categories: categories.length ? categories : ['Kitesurf', 'Planches', 'Ailes'],
    mainBrands: brands.length ? brands : ['F-One', 'Duotone', 'North', 'Core']
  };
}

async function startAnalysis() {
  const rawInput = document.getElementById('site-input').value.trim();
  if (!rawInput) return alert('Indique le nom de ton site ou son adresse (ex. ultimate glisse)');

  const overlay = document.getElementById('analysis-overlay');
  const stepsContainer = document.getElementById('steps');
  document.getElementById('analysis-url').textContent = rawInput;

  const steps = [
    { text: 'Résolution du site...', detail: '' },
    { text: 'Connexion au site', detail: '' },
    { text: 'Détection du CMS', detail: '' },
    { text: 'Analyse du catalogue', detail: '' },
    { text: 'Extraction des catégories', detail: '' },
    { text: 'Finalisation', detail: '' }
  ];

  stepsContainer.innerHTML = steps.map((s, i) => `
    <div class="analysis-step" id="step-${i}">
      <span class="icon">${i + 1}</span>
      <span>${s.text}</span>
      ${s.detail ? `<span class="detail">${s.detail}</span>` : ''}
    </div>
  `).join('');

  overlay.classList.add('active');

  function setStepDone(index, detail) {
    const el = document.getElementById('step-' + index);
    if (el) {
      el.classList.remove('active');
      el.classList.add('done');
      const detailEl = el.querySelector('.detail');
      if (detailEl && detail) detailEl.textContent = detail;
    }
  }

  function setStepActive(index, detail) {
    const el = document.getElementById('step-' + index);
    if (el) {
      el.classList.add('active');
      const detailEl = el.querySelector('.detail');
      if (detailEl && detail) detailEl.textContent = detail;
    }
  }

  let data = null;
  try {
    setStepActive(0);
    if (isApiAvailable()) {
      const apiUrl = getApiBase() + '/api/analyze?q=' + encodeURIComponent(rawInput);
      const res = await fetch(apiUrl);
      data = await res.json().catch(() => ({}));
      if (res.ok) analysisResult = data;
    }
    if (!analysisResult) {
      data = runDemoAnalysis(rawInput);
      analysisResult = data;
    } else {
      data = analysisResult;
    }
  } catch (_) {
    data = runDemoAnalysis(rawInput);
    analysisResult = data;
  }

  if (!data || !data.url) {
    overlay.classList.remove('active');
    alert('Impossible d’analyser ce site.');
    return;
  }

  data = analysisResult;
  setStepDone(0);
  setStepActive(1, data.url || '');
  await new Promise(r => setTimeout(r, 400));
  setStepDone(1, data.url || '');
  setStepActive(2, data.cms || '');
  await new Promise(r => setTimeout(r, 400));
  setStepDone(2, data.cms || '');
  setStepActive(3, (data.productCount || 0) + ' produits');
  await new Promise(r => setTimeout(r, 400));
  setStepDone(3, (data.productCount || 0) + ' produits');
  setStepActive(4, (data.categories && data.categories.length) ? data.categories.length + ' catégories' : '');
  await new Promise(r => setTimeout(r, 400));
  setStepDone(4);
  setStepActive(5);
  await new Promise(r => setTimeout(r, 400));
  setStepDone(5);

  setTimeout(() => {
    overlay.classList.remove('active');
    const url = data.url || rawInput;
    const cms = data.cms || 'Inconnu';
    const brandCount = (data.mainBrands && data.mainBrands.length) || 0;
    const productCount = data.productCount || 0;
    document.getElementById('site-info').innerHTML = `<span class="tag site-tag">🔗 ${url} — ${cms} — ${brandCount} marques — ${productCount} produits</span>`;
    goToPage('search');
    initSearchPage();
  }, 500);
}

// ===== PAGE SEARCH : marques, filtres, onglets =====
function initSearchPage() {
  const brandsEl = document.getElementById('main-brands');
  const brandSelect = document.getElementById('filter-brand');
  const yearSelect = document.getElementById('filter-year');
  const categorySelect = document.getElementById('filter-category');
  const subcategorySelect = document.getElementById('filter-subcategory');

  const productList = getProducts();
  const brandsFromAnalysis = (analysisResult && analysisResult.mainBrands && analysisResult.mainBrands.length)
    ? analysisResult.mainBrands
    : [...new Set(productList.map(p => p.brand))].sort();

  brandsEl.innerHTML = brandsFromAnalysis.map(b => `
    <button type="button" class="chip" data-brand="${escapeAttr(b)}" onclick="selectMainBrand('${escapeAttr(b)}')">${escapeHtml(b)}</button>
  `).join('');

  const allBrands = [...new Set(productList.map(p => p.brand))].sort();
  const allYears = [...new Set(productList.map(p => p.year))].sort().reverse();
  const allCategories = [...new Set(productList.map(p => p.category))].sort();
  const allSubcategories = [...new Set(productList.map(p => p.subcategory))].sort();

  fillSelect(brandSelect, allBrands);
  fillSelect(yearSelect, allYears);
  fillSelect(categorySelect, allCategories);
  fillSelect(subcategorySelect, allSubcategories);

  applyFilters();
}

function escapeAttr(s) {
  return String(s).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function fillSelect(select, options) {
  if (!select) return;
  const current = select.value;
  select.innerHTML = '<option value="">Toutes</option>' + options.map(o => `<option value="${escapeAttr(o)}">${escapeHtml(o)}</option>`).join('');
  if (options.includes(current)) select.value = current;
}

function selectMainBrand(brand) {
  const select = document.getElementById('filter-brand');
  if (select) select.value = brand;
  applyFilters();
}

function switchSearchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.getAttribute('data-tab') === tabId));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === 'tab-' + tabId));
}

// ===== FILTRES ET RECHERCHE =====
function getSelectedBrand() {
  const el = document.getElementById('filter-brand');
  return el ? el.value.trim() : '';
}
function getSelectedYear() {
  const el = document.getElementById('filter-year');
  return el ? el.value.trim() : '';
}
function getSelectedCategory() {
  const el = document.getElementById('filter-category');
  return el ? el.value.trim() : '';
}
function getSelectedSubcategory() {
  const el = document.getElementById('filter-subcategory');
  return el ? el.value.trim() : '';
}

function searchProducts() {
  applyFilters();
}

function applyFilters() {
  const query = (document.getElementById('product-input').value || '').toLowerCase().trim();
  const brand = getSelectedBrand();
  const year = getSelectedYear();
  const category = getSelectedCategory();
  const subcategory = getSelectedSubcategory();

  const productList = getProducts();
  let filtered = productList.filter(p => {
    if (brand && p.brand !== brand) return false;
    if (year && p.year !== year) return false;
    if (category && p.category !== category) return false;
    if (subcategory && p.subcategory !== subcategory) return false;
    if (query) {
      const searchText = [p.brand, p.category, p.subcategory, p.title, p.desc, p.commercial].join(' ').toLowerCase();
      if (!searchText.includes(query)) return false;
    }
    return true;
  });

  displayProducts(filtered);
}

function displayProducts(list) {
  const tbody = document.getElementById('products-body');
  const section = document.getElementById('results-section');
  tbody.innerHTML = list.map((p, i) => `
    <tr data-index="${i}">
      <td><input type="checkbox" onchange="updateSelection()"></td>
      <td><img class="img" src="${p.image}" alt="${escapeHtml(p.title)}"></td>
      <td><span class="tag">${escapeHtml(p.year)}</span></td>
      <td>${escapeHtml(p.brand)}</td>
      <td>${escapeHtml(p.category)}</td>
      <td>${escapeHtml(p.subcategory)}</td>
      <td><strong>${escapeHtml(p.title)}</strong></td>
      <td>${escapeHtml(p.desc)}</td>
      <td style="max-width:200px;">${escapeHtml(p.commercial)}</td>
      <td><strong>${escapeHtml(p.price)}</strong></td>
    </tr>
  `).join('');

  document.getElementById('total-count').textContent = list.length;
  section.style.display = 'block';
  updateSelection();
}

// ===== SELECTION =====
function updateSelection() {
  const checkboxes = document.querySelectorAll('#products-body input[type="checkbox"]');
  const checked = document.querySelectorAll('#products-body input[type="checkbox"]:checked');

  document.getElementById('selected-count').textContent = checked.length;
  document.getElementById('import-btn').disabled = checked.length === 0;
  document.getElementById('delete-btn').disabled = checked.length === 0;

  checkboxes.forEach(cb => {
    cb.closest('tr').classList.toggle('selected', cb.checked);
  });
}

function toggleSelectAll() {
  const checkboxes = document.querySelectorAll('#products-body input[type="checkbox"]');
  const allChecked = [...checkboxes].every(cb => cb.checked);
  checkboxes.forEach(cb => cb.checked = !allChecked);
  updateSelection();
}

// ===== ACTIONS =====
function importSelected() {
  const count = document.querySelectorAll('#products-body input[type="checkbox"]:checked').length;
  alert(`${count} fiche(s) importée(s) avec succès !`);
}

function deleteSelected() {
  const checked = document.querySelectorAll('#products-body input[type="checkbox"]:checked');
  if (confirm(`Supprimer ${checked.length} fiche(s) ?`)) {
    checked.forEach(cb => cb.closest('tr').remove());
    updateSelection();
    document.getElementById('total-count').textContent =
      document.querySelectorAll('#products-body tr').length;
  }
}

// ===== MA FICHE PRODUIT (template) =====
function analyzeTemplateUrl() {
  const url = (document.getElementById('template-url') && document.getElementById('template-url').value || '').trim();
  if (!url) {
    alert('Colle d’abord l’URL d’une fiche produit de ton site.');
    return;
  }
  alert('Analyse de la structure par l’IA : à brancher (API dédiée). Pour l’instant tu peux remplir les blocs manuellement.');
}

function saveTemplate() {
  const blocks = {};
  document.querySelectorAll('.template-block').forEach(block => {
    const key = block.getAttribute('data-block');
    const input = block.querySelector('.template-block-input, .template-block-textarea');
    if (key && input) blocks[key] = input.value.trim();
  });
  try {
    localStorage.setItem('ficheproduct_template', JSON.stringify(blocks));
    alert('Fiche type enregistrée. Elle sera utilisée pour formater les exports PrestaShop.');
  } catch (e) {
    alert('Impossible d’enregistrer (stockage local).');
  }
}

(function loadTemplate() {
  try {
    const raw = localStorage.getItem('ficheproduct_template');
    if (!raw) return;
    const blocks = JSON.parse(raw);
    document.querySelectorAll('.template-block').forEach(block => {
      const key = block.getAttribute('data-block');
      const input = block.querySelector('.template-block-input, .template-block-textarea');
      if (key && input && blocks[key]) input.value = blocks[key];
    });
  } catch (_) {}
})();
