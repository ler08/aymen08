document.addEventListener('DOMContentLoaded', () => {
  requireAuth();
  loadReports();
});

async function loadReports() {
  const period = parseInt(document.getElementById('reportPeriod')?.value || 30);
  await Promise.all([loadReportKPIs(period), loadReportCharts(period), loadTopProducts(), loadAdsPerf(), loadAccountingSummary()]);
}

function loadReportKPIs(days) {
  const rev = (days * 415 + Math.random()*1000).toFixed(0);
  const ord = Math.floor(days * 11.6);
  const cli = Math.floor(days * 4.3);
  const cvr = (2.8 + Math.random()*1.5).toFixed(2);
  const el = document.getElementById('report-kpis');
  if (!el) return;
  el.innerHTML = [
    {l:'Revenus',v:`€${parseInt(rev).toLocaleString()}`,i:'💰',c:'rgba(79,110,247,.12)'},
    {l:'Commandes',v:ord,i:'📦',c:'rgba(16,185,129,.12)'},
    {l:'Nouveaux clients',v:cli,i:'👥',c:'rgba(139,92,246,.12)'},
    {l:'Taux conversion',v:`${cvr}%`,i:'📈',c:'rgba(245,158,11,.12)'}
  ].map(s=>`<div class="kpi-card"><div class="kpi-header"><span class="kpi-label">${s.l}</span><div class="kpi-icon-wrap" style="background:${s.c}">${s.i}</div></div><div class="kpi-value">${s.v}</div></div>`).join('');
}

function loadReportCharts(days) {
  if (!window.Chart) return;
  const labels = Array.from({length:Math.min(days,30)},(_,i)=>{const d=new Date();d.setDate(d.getDate()-Math.min(days,30)+1+i);return d.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'});});
  const c1 = document.getElementById('revChart');
  if (c1) {
    if (c1._chart) c1._chart.destroy();
    c1._chart = new Chart(c1, {
      type:'line',
      data:{labels,datasets:[{label:'Revenus €',data:labels.map(()=>Math.floor(200+Math.random()*800)),borderColor:'#4f6ef7',backgroundColor:'rgba(79,110,247,.1)',fill:true,tension:.4,pointRadius:2}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#5a5a78',maxTicksLimit:8},grid:{color:'rgba(255,255,255,.04)'}},y:{ticks:{color:'#5a5a78',callback:v=>v+'€'},grid:{color:'rgba(255,255,255,.04)'}}}}
    });
  }
  const c2 = document.getElementById('ordChart');
  if (c2) {
    if (c2._chart) c2._chart.destroy();
    c2._chart = new Chart(c2, {
      type:'doughnut',
      data:{labels:['Livrées','Expédiées','En attente','Annulées'],datasets:[{data:[55,25,15,5],backgroundColor:['#10b981','#4f6ef7','#f59e0b','#ef4444'],borderColor:'#16161f',borderWidth:3}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{color:'#a0a0b8',padding:12,font:{size:11}}}}}
    });
  }
}

function loadTopProducts() {
  const el = document.getElementById('top-products');
  if (!el) return;
  const prods = ['Produit Premium A','Kit Débutant B','Bundle Pro C','Accessoire D','Formation E'];
  el.innerHTML = prods.map((p,i)=>{
    const sales=Math.floor(80-i*14);
    const rev=Math.floor(sales*(20+i*8));
    return `<tr><td><strong>#${i+1}</strong></td><td>${p}</td><td>${sales}</td><td>€${rev}</td></tr>`;
  }).join('');
}

function loadAdsPerf() {
  const el = document.getElementById('ads-perf');
  if (!el) return;
  const camps = ['Black Friday','Été 2024','Retargeting','Nouveaux produits'];
  el.innerHTML = camps.map(c=>{
    const clicks=Math.floor(500+Math.random()*2000);
    const ctr=(1+Math.random()*4).toFixed(2);
    const roas=(1.5+Math.random()*4).toFixed(1);
    return `<tr><td>${c}</td><td>${clicks.toLocaleString()}</td><td>${ctr}%</td><td style="color:${roas>3?'#10b981':'#f59e0b'}">x${roas}</td></tr>`;
  }).join('');
}

async function loadAccountingSummary() {
  const el = document.getElementById('report-accounting');
  if (!el) return;
  try {
    const data = await getAccounting().catch(()=>[]);
    const sum = (t) => data.filter(d=>d.type===t).reduce((s,d)=>s+d.amount,0);
    const income=sum('income'), expense=sum('expense'), tax=sum('tax'), net=income-expense-tax;
    el.innerHTML = [
      {l:'Revenus totaux',v:`€${income.toFixed(2)}`,c:'#10b981'},
      {l:'Dépenses totales',v:`€${expense.toFixed(2)}`,c:'#ef4444'},
      {l:'Taxes',v:`€${tax.toFixed(2)}`,c:'#f59e0b'},
      {l:'Bénéfice net',v:`€${net.toFixed(2)}`,c:net>=0?'#10b981':'#ef4444'}
    ].map(s=>`<div class="kpi-card"><div class="kpi-label">${s.l}</div><div class="kpi-value" style="color:${s.c};font-size:1.4rem">${s.v}</div></div>`).join('');
  } catch(e) {
    el.innerHTML = '<div style="padding:20px;color:#5a5a78">Connectez le backend pour voir les données comptables.</div>';
  }
}

function downloadReportPDF() {
  const period = document.getElementById('reportPeriod')?.value || 30;
  const w = window.open('','_blank','width=900,height=700');
  const kpis = document.getElementById('report-kpis')?.innerText || '';
  w.document.write(`<!DOCTYPE html><html><head><title>Rapport EcomSolutions</title>
  <style>body{font-family:Arial,sans-serif;margin:40px;color:#1a1a1a}h1{color:#4f6ef7;margin-bottom:6px}.sub{color:#666;margin-bottom:30px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #ddd;padding:10px;text-align:left}th{background:#f8f9fa;font-weight:700}@media print{button{display:none}}</style>
  </head><body>
  <h1>📊 Rapport EcomSolutions</h1>
  <p class="sub">Période : ${period} derniers jours — Généré le ${new Date().toLocaleDateString('fr-FR')}</p>
  <button onclick="window.print()" style="padding:10px 20px;background:#4f6ef7;color:#fff;border:none;border-radius:6px;cursor:pointer;margin-bottom:24px">🖨️ Imprimer / Sauvegarder PDF</button>
  <h2>KPIs principaux</h2>
  <table><thead><tr><th>Métrique</th><th>Valeur</th></tr></thead><tbody>
  ${['Revenus','Commandes','Nouveaux clients','Taux conversion'].map((l,i)=>{
    const vals=document.querySelectorAll('.kpi-value');
    return `<tr><td>${l}</td><td>${vals[i]?.textContent||'—'}</td></tr>`;
  }).join('')}
  </tbody></table>
  <h2 style="margin-top:24px">Top Produits</h2>
  <table>${document.getElementById('top-products')?.innerHTML?'<thead><tr><th>#</th><th>Produit</th><th>Ventes</th><th>Revenus</th></tr></thead><tbody>'+document.getElementById('top-products').innerHTML+'</tbody>':''}</table>
  </body></html>`);
  w.document.close();
  showToast('Rapport ouvert - Utilisez Ctrl+P pour PDF', 'info');
}

function downloadReportCSV() {
  const rows = [['Période','Revenus','Commandes','Clients']];
  const kpiEls = document.querySelectorAll('#report-kpis .kpi-value');
  rows.push([`${document.getElementById('reportPeriod')?.value||30} jours`, kpiEls[0]?.textContent||'', kpiEls[1]?.textContent||'', kpiEls[2]?.textContent||'']);
  const csv = rows.map(r=>r.map(c=>`"${c}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`rapport-${new Date().toISOString().split('T')[0]}.csv`; a.click();
  showToast('CSV téléchargé ✅','success');
}

window.loadReports = loadReports;
window.downloadReportPDF = downloadReportPDF;
window.downloadReportCSV = downloadReportCSV;
