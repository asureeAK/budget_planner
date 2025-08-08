/* Budget Planner main script
   - Single page app behavior
   - Sliders keep total percent ~100 by redistributing deltas
   - Add / remove expenses in-memory
   - Export TXT / PDF / Excel (client-side)
*/

/* ======= DOM references ======= */
const incomeInput = document.getElementById('income');

const needsRange = document.getElementById('needsRange');
const wantsRange = document.getElementById('wantsRange');
const savingsRange = document.getElementById('savingsRange');

const needsNum = document.getElementById('needsNum');
const wantsNum = document.getElementById('wantsNum');
const savingsNum = document.getElementById('savingsNum');

const percentTotal = document.getElementById('percentTotal');

const targetNeedsLabel = document.getElementById('targetNeeds');
const targetWantsLabel = document.getElementById('targetWants');
const targetSavingsLabel = document.getElementById('targetSavings');

const incomeDisplay = document.getElementById('incomeDisplay');

const needsTotalEl = document.getElementById('needsTotal');
const wantsTotalEl = document.getElementById('wantsTotal');
const savingsTotalEl = document.getElementById('savingsTotal');

const needsTargetLabel = document.getElementById('needsTargetLabel');
const wantsTargetLabel = document.getElementById('wantsTargetLabel');
const savingsTargetLabel = document.getElementById('savingsTargetLabel');

const barNeeds = document.getElementById('barNeeds');
const barWants = document.getElementById('barWants');
const barSavings = document.getElementById('barSavings');

const needsStatus = document.getElementById('needsStatus');
const wantsStatus = document.getElementById('wantsStatus');
const savingsStatus = document.getElementById('savingsStatus');

const feedback = document.getElementById('feedback');

const expenseForm = document.getElementById('expenseForm');
const expAmount = document.getElementById('expAmount');
const expCategory = document.getElementById('expCategory');
const expDesc = document.getElementById('expDesc');
const expDate = document.getElementById('expDate');

const expensesTableBody = document.querySelector('#expensesTable tbody');

const exportTxtBtn = document.getElementById('exportTxt');
const exportPdfBtn = document.getElementById('exportPdf');
const exportXlsxBtn = document.getElementById('exportXlsx');
const clearExpensesBtn = document.getElementById('clearExpenses');

/* ======= In-memory data ======= */
let expenses = []; // {amount, category, desc, date}
let lastChangedSlider = null;

/* ======= Helper: update UI targets and totals ======= */
function getPercents() {
  return {
    needs: Number(needsNum.value) || 0,
    wants: Number(wantsNum.value) || 0,
    savings: Number(savingsNum.value) || 0
  };
}

function setPercents(n, w, s) {
  // clamp 0..100
  n = Math.max(0, Math.min(100, Math.round(n)));
  w = Math.max(0, Math.min(100, Math.round(w)));
  s = Math.max(0, Math.min(100, Math.round(s)));

  needsNum.value = n; wantsNum.value = w; savingsNum.value = s;
  needsRange.value = n; wantsRange.value = w; savingsRange.value = s;

  percentTotal.textContent = (n + w + s);
  updateAll(); // refresh calculations
}

/* ======= Slider redistribution logic =======
   When a slider changes, keep total ≈ 100 by distributing the opposite sign delta
   across the other two sliders proportionally to their current values.
*/
function redistribute(changedKey, newValue) {
  const keys = ['needs','wants','savings'];
  const prev = getPercents();
  const oldValue = prev[changedKey];
  let delta = newValue - oldValue; // positive means increase this slider

  if (delta === 0) return;

  // get other two keys
  const others = keys.filter(k => k !== changedKey);
  let a = prev[others[0]];
  let b = prev[others[1]];
  let totalOthers = a + b;

  // If others sum to 0 just split evenly
  if (totalOthers === 0) {
    a = b = 50;
    totalOthers = 100;
  }

  // We will subtract delta from others proportionally (or add if delta negative)
  // compute new others
  let newA = a - (delta * (a / totalOthers));
  let newB = b - (delta * (b / totalOthers));

  // If any go below 0 or above 100, clamp and re-balance simply (fallback)
  const clamp = v => Math.max(0, Math.min(100, Math.round(v)));
  newA = clamp(newA); newB = clamp(newB); newValue = clamp(newValue);

  // If after clamp total != 100, adjust changedKey to fix rounding drift
  const total = newA + newB + newValue;
  const drift = total - 100;
  newValue = Math.round(newValue - drift);

  // Apply
  const result = {};
  result[changedKey] = newValue;
  result[others[0]] = newA;
  result[others[1]] = newB;

  setPercents(result.needs, result.wants, result.savings);
}

/* ======= Calculate totals and update UI ======= */
function updateAll() {
  const income = Number(incomeInput.value) || 0;
  incomeDisplay.textContent = income.toLocaleString();

  const perc = getPercents();
  const targetNeeds = Math.round((perc.needs / 100) * income);
  const targetWants = Math.round((perc.wants / 100) * income);
  const targetSavings = Math.round((perc.savings / 100) * income);

  targetNeedsLabel.textContent = targetNeeds.toLocaleString();
  targetWantsLabel.textContent = targetWants.toLocaleString();
  targetSavingsLabel.textContent = targetSavings.toLocaleString();

  needsTargetLabel.textContent = targetNeeds.toLocaleString();
  wantsTargetLabel.textContent = targetWants.toLocaleString();
  savingsTargetLabel.textContent = targetSavings.toLocaleString();

  // totals from expenses array
  let needsTotal = 0, wantsTotal = 0, savingsTotal = 0;
  expenses.forEach(e=>{
    if (e.category === 'Needs') needsTotal += e.amount;
    else if (e.category === 'Wants') wantsTotal += e.amount;
    else if (e.category === 'Savings') savingsTotal += e.amount;
  });

  needsTotalEl.textContent = needsTotal.toLocaleString();
  wantsTotalEl.textContent = wantsTotal.toLocaleString();
  savingsTotalEl.textContent = savingsTotal.toLocaleString();

  // Progress percent relative to each target (can be >100)
  const needsPct = targetNeeds === 0 ? 0 : Math.round((needsTotal / targetNeeds) * 100);
  const wantsPct = targetWants === 0 ? 0 : Math.round((wantsTotal / targetWants) * 100);
  const savingsPct = targetSavings === 0 ? 0 : Math.round((savingsTotal / targetSavings) * 100);

  barNeeds.style.width = `${Math.min(needsPct, 100)}%`;
  barWants.style.width = `${Math.min(wantsPct, 100)}%`;
  barSavings.style.width = `${Math.min(savingsPct, 100)}%`;

  // Status text
  needsStatus.textContent = needsTotal > targetNeeds ? 'Exceeded' : '';
  wantsStatus.textContent = wantsTotal > targetWants ? 'Exceeded' : '';
  savingsStatus.textContent = savingsTotal < targetSavings ? 'Below target' : '';

  // Feedback messages (priority)
  if (needsTotal > targetNeeds && wantsTotal > targetWants) {
    feedback.textContent = 'Careful — both Needs and Wants have exceeded their targets!';
    feedback.style.color = '#b91c1c';
  } else if (needsTotal > targetNeeds) {
    feedback.textContent = "You've exceeded your Needs budget!";
    feedback.style.color = '#b91c1c';
  } else if (wantsTotal > targetWants) {
    feedback.textContent = "You've exceeded your Wants budget!";
    feedback.style.color = '#b91c1c';
  } else if (savingsTotal < targetSavings) {
    feedback.textContent = "You're missing your future proof.";
    feedback.style.color = '#d97706';
  } else if (needsTotal < targetNeeds && wantsTotal < targetWants && savingsTotal >= targetSavings) {
    feedback.textContent = "Congrats, you're rocking it!";
    feedback.style.color = '#15803d';
  } else {
    feedback.textContent = "";
  }

  percentTotal.textContent = (perc.needs + perc.wants + perc.savings);
  // Update table UI
  renderExpensesTable();
}

/* ======= Render expenses table ======= */
function renderExpensesTable() {
  expensesTableBody.innerHTML = '';
  expenses.forEach((e, idx)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${idx+1}</td>
      <td>₹ ${e.amount.toLocaleString()}</td>
      <td>${e.category}</td>
      <td>${e.desc || '-'}</td>
      <td>${e.date || '-'}</td>
      <td><button class="btn ghost" data-idx="${idx}">Delete</button></td>
    `;
    expensesTableBody.appendChild(tr);
  });

  // attach delete handlers
  expensesTableBody.querySelectorAll('button[data-idx]').forEach(btn=>{
    btn.addEventListener('click', (ev)=>{
      const i = Number(ev.currentTarget.getAttribute('data-idx'));
      expenses.splice(i,1);
      updateAll();
    });
  });
}

/* ======= Event listeners ======= */

/* Income change */
incomeInput.addEventListener('input', updateAll);

/* Slider & number input pair syncing and redistribution */
[ ['needsRange', 'needsNum', 'Needs'],
  ['wantsRange', 'wantsNum', 'Wants'],
  ['savingsRange','savingsNum','Savings']
].forEach(([rangeId, numId, label])=>{
  const range = document.getElementById(rangeId);
  const num = document.getElementById(numId);

  // When range changed
  range.addEventListener('input', (e)=>{
    lastChangedSlider = label;
    // redistribute to keep sum 100
    redistribute(label.toLowerCase(), Number(e.target.value));
  });

  // When numeric changed
  num.addEventListener('input', (e)=>{
    lastChangedSlider = label;
    redistribute(label.toLowerCase(), Number(e.target.value));
  });

});

/* Expense form */
expenseForm.addEventListener('submit', (ev)=>{
  ev.preventDefault();
  const amount = Number(expAmount.value) || 0;
  const category = expCategory.value;
  const desc = expDesc.value.trim();
  const date = expDate.value;

  if (amount <= 0) {
    alert('Please enter a positive amount');
    return;
  }

  expenses.push({ amount, category, desc, date });
  // clear small fields
  expAmount.value = '';
  expDesc.value = '';
  expDate.value = '';

  updateAll();
});

/* Clear expenses */
clearExpensesBtn.addEventListener('click', ()=>{
  if (!confirm('Clear all expenses?')) return;
  expenses = [];
  updateAll();
});

/* Exports */
/* TXT export: create a readable report */
exportTxtBtn.addEventListener('click', ()=>{
  const income = Number(incomeInput.value) || 0;
  const perc = getPercents();
  const dateNow = new Date().toLocaleString();

  let txt = `Budget Planner Report\nGenerated: ${dateNow}\n\nIncome: ₹ ${income.toLocaleString()}\n`;
  txt += `Percentages: Needs ${perc.needs}% | Wants ${perc.wants}% | Savings ${perc.savings}%\n\nTargets:\n`;
  txt += `  Needs: ₹ ${Math.round((perc.needs/100)*income).toLocaleString()}\n`;
  txt += `  Wants: ₹ ${Math.round((perc.wants/100)*income).toLocaleString()}\n`;
  txt += `  Savings: ₹ ${Math.round((perc.savings/100)*income).toLocaleString()}\n\n`;

  txt += 'Expenses:\n';
  if (expenses.length === 0) txt += '  (No expenses recorded)\n';
  else {
    expenses.forEach((e, i)=>{
      txt += `${i+1}. ₹ ${e.amount.toLocaleString()} | ${e.category} | ${e.desc || '-'} | ${e.date || '-'}\n`;
    });
  }

  const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `budget-report-${Date.now()}.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
});

/* PDF export using jsPDF and autotable */
exportPdfBtn.addEventListener('click', ()=>{
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({unit:'pt', format:'a4'});
  const income = Number(incomeInput.value) || 0;
  const perc = getPercents();
  const title = 'Budget Planner Report';
  doc.setFontSize(14);
  doc.text(title, 40, 50);
  doc.setFontSize(10);
  doc.text(`Income: ₹ ${income.toLocaleString()}`, 40, 70);
  doc.text(`Percentages: Needs ${perc.needs}% | Wants ${perc.wants}% | Savings ${perc.savings}%`, 40, 86);

  // Table header + rows
  const head = [['#','Amount (₹)','Category','Description','Date']];
  const body = expenses.map((e, i)=>[i+1, e.amount.toLocaleString(), e.category, e.desc || '-', e.date || '-']);

  // Add table below
  doc.autoTable({
    startY: 110,
    head: head,
    body: body,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [60,60,60] }
  });

  doc.save(`budget-report-${Date.now()}.pdf`);
});

/* Excel export (SheetJS) */
exportXlsxBtn.addEventListener('click', ()=>{
  // Build worksheet data
  const income = Number(incomeInput.value) || 0;
  const perc = getPercents();

  const wsData = [
    ['Budget Planner Report'],
    [`Generated:`, new Date().toLocaleString()],
    [],
    ['Income', income],
    ['Needs %', perc.needs],
    ['Wants %', perc.wants],
    ['Savings %', perc.savings],
    [],
    ['Expenses'],
    ['#','Amount','Category','Description','Date'],
    // rows...
    ...expenses.map((e,i)=>[i+1, e.amount, e.category, e.desc || '-', e.date || '-'])
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Report');

  // Generate and trigger download
  XLSX.writeFile(wb, `budget-report-${Date.now()}.xlsx`);
});

/* ======= Example demo data (so user can test immediately) ======= */
function seedExampleData() {
  expenses = [
    { amount: 12000, category: 'Needs', desc: 'Rent', date: '2025-07-01' },
    { amount: 450
