// ===== NAVIGATION =====
function goToPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + pageId).classList.add('active');
}

// ===== ANALYSIS =====
function startAnalysis() {
  const url = document.getElementById('site-input').value.trim();
  if (!url) return alert('Indique une URL');

  const overlay = document.getElementById('analysis-overlay');
  const stepsContainer = document.getElementById('steps');
  document.getElementById('analysis-url').textContent = url;

  const steps = [
    { text: 'Connexion au site...', detail: '' },
    { text: 'Détection du CMS', detail: 'PrestaShop' },
    { text: 'Analyse du catalogue', detail: '1 247 produits' },
    { text: 'Extraction des catégories', detail: '24 catégories' },
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

  let currentStep = 0;
  const interval = setInterval(() => {
    if (currentStep > 0) {
      document.getElementById('step-' + (currentStep - 1)).classList.remove('active');
      document.getElementById('step-' + (currentStep - 1)).classList.add('done');
    }
    if (currentStep < steps.length) {
      document.getElementById('step-' + currentStep).classList.add('active');
      currentStep++;
    } else {
      clearInterval(interval);
      setTimeout(() => {
        overlay.classList.remove('active');
        document.getElementById('site-info').innerHTML = `<span class="tag" style="margin-top:1rem;">🔗 ${url} — PrestaShop — 1 247 produits</span>`;
        goToPage('search');
      }, 500);
    }
  }, 800);
}

// ===== PRODUCTS SEARCH =====
function searchProducts() {
  const query = document.getElementById('product-input').value.toLowerCase();
  const filtered = products.filter(p =>
    p.brand.toLowerCase() === 'f-one' &&
    (p.subcategory === 'Ailes' || p.subcategory === 'Planches')
  );

  displayProducts(filtered);
}

function displayProducts(list) {
  const tbody = document.getElementById('products-body');
  tbody.innerHTML = list.map((p, i) => `
    <tr data-index="${i}">
      <td><input type="checkbox" onchange="updateSelection()"></td>
      <td><img class="img" src="${p.image}" alt="${p.title}"></td>
      <td><span class="tag">${p.year}</span></td>
      <td>${p.brand}</td>
      <td>${p.category}</td>
      <td>${p.subcategory}</td>
      <td><strong>${p.title}</strong></td>
      <td>${p.desc}</td>
      <td style="max-width:200px;">${p.commercial}</td>
      <td><strong>${p.price}</strong></td>
    </tr>
  `).join('');

  document.getElementById('total-count').textContent = list.length;
  document.getElementById('results-section').style.display = 'block';
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
