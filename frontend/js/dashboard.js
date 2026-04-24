// dashboard.js — Logique du dashboard

function initDashboard() {
  loadKPIs();
  loadCharts();
  loadRecentOrders();
  loadActivity();
}

async function loadKPIs() {
  try {
    const stats = await getDashboardStats().catch(() => null);
    if (stats) {
      setKPI('kpi-rev', `${(stats.revenue||0).toLocaleString()}€`, stats.revTrend);
      setKPI('kpi-ord', stats.orders||0, stats.ordTrend);
      setKPI('kpi-cli', stats.clients||0, stats.cliTrend);
      setKPI('kpi-cvr', `${(stats.convRate||0).toFixed(2)}%`, stats.cvrTrend);
      updateGoals(stats);
    } else {
      // Valeurs de démo si backend non disponible
      setKPI('kpi-rev', '12,450€', '+12.5%');
      setKPI('kpi-ord', '348', '+8.2%');
      setKPI('kpi-cli', '1,285', '+5.1%');
      setKPI('kpi-cvr', '3.24%', '-0.8%', false);
      updateGoals({ revenue:12450, orders:348, clients:1285, revGoal:15000, ordGoal:400, cliGoal:1500 });
    }
  } catch(e) {
    setKPI('kpi-rev', '12,450€', '+12.5%');
    setKPI('kpi-ord', '348', '+8.2%');
    setKPI('kpi-cli', '1,285', '+5.1%');
    setKPI('kpi-cvr', '3.24%', '-0.8%', false);
    updateGoals({ revenue:12450, orders:348, clients:1285, revGoal:15000, ordGoal:400, cliGoal:1500 });
  }
}

function setKPI(id, val, trend, positive = null) {
  const el = document.getElementById(id);
  const tel = document.getElementById(id+'-t');
  if (el) el.textContent = val;
  if (tel && trend) {
    tel.textContent = trend;
    const isUp = positive !== null ? positive : trend.startsWith('+');
    tel.className = `kpi-trend ${isUp ? 'up' : 'down'}`;
  }
}

function updateGoals(s) {
  const rPct = Math.min(100, ((s.revenue||0)/(s.revGoal||15000)*100)).toFixed(0);
  const oPct = Math.min(100, ((s.orders||0)/(s.ordGoal||400)*100)).toFixed(0);
  const cPct = Math.min(100, ((s.clients||0)/(s.cliGoal||1500)*100)).toFixed(0);
  const set = (id, pct, label) => {
    const bar = document.getElementById(id);
    const lbl = document.getElementById(id+'-label');
    if (bar) { bar.style.width = pct + '%'; setTimeout(()=>bar.style.width=pct+'%', 100); }
    if (lbl) lbl.textContent = label;
  };
  set('g-rev', rPct, `${(s.revenue||0).toLocaleString()}€ / ${(s.revGoal||15000).toLocaleString()}€`);
  set('g-ord', oPct, `${s.orders||0} / ${s.ordGoal||400}`);
  set('g-cli', cPct, `${s.clients||0} / ${s.cliGoal||1500}`);
}

let revenueChart, sourceChart;
function loadCharts() {
  if (!window.Chart) return;
  const days = Array.from({length:30},(_,i)=>{const d=new Date();d.setDate(d.getDate()-29+i);return d.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'});});
  const vals = Array.from({length:30},()=>Math.floor(200+Math.random()*600));
  const ctx1 = document.getElementById('revenueChart');
  if (ctx1) {
    revenueChart = new Chart(ctx1, {
      type:'line',
      data:{ labels:days, datasets:[{label:'Revenus €',data:vals,borderColor:'#4f6ef7',backgroundColor:'rgba(79,110,247,.1)',fill:true,tension:.4,pointRadius:0,pointHoverRadius:4}] },
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{mode:'index',intersect:false}},scales:{x:{ticks:{color:'#5a5a78',maxTicksLimit:6},grid:{color:'rgba(255,255,255,.04)'}},y:{ticks:{color:'#5a5a78',callback:v=>v+'€'},grid:{color:'rgba(255,255,255,.04)'}}}}
    });
  }
  const ctx2 = document.getElementById('sourceChart');
  if (ctx2) {
    sourceChart = new Chart(ctx2, {
      type:'doughnut',
      data:{labels:['Direct','Organic','Publicités','Réseaux'],datasets:[{data:[35,25,28,12],backgroundColor:['#4f6ef7','#10b981','#f59e0b','#8b5cf6'],borderColor:'#16161f',borderWidth:3}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{color:'#a0a0b8',padding:12,font:{size:11}}}}}
    });
  }
}

function setChartPeriod(period, btn) {
  document.querySelectorAll('.tabs .tab').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  if (!revenueChart) return;
  const lens = {day:30,week:12,month:12};
  const labels = period==='day'
    ? Array.from({length:30},(_,i)=>{const d=new Date();d.setDate(d.getDate()-29+i);return d.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'});})
    : period==='week'
    ? Array.from({length:12},(_,i)=>`S${i+1}`)
    : ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
  revenueChart.data.labels = labels;
  revenueChart.data.datasets[0].data = Array.from({length:labels.length},()=>Math.floor(200+Math.random()*800));
  revenueChart.update();
}

async function loadRecentOrders() {
  const tbody = document.getElementById('recent-orders');
  if (!tbody) return;
  try {
    const orders = await getOrders().catch(()=>null);
    const data = orders ? orders.slice(0,5) : getDemoOrders();
    if (!data.length) { tbody.innerHTML='<tr><td colspan="4" style="text-align:center;padding:20px;color:#5a5a78">Aucune commande</td></tr>'; return; }
    tbody.innerHTML = data.map(o=>`
      <tr>
        <td>#${o.id||o.order_number||Math.floor(1000+Math.random()*9000)}</td>
        <td>${o.client_name||o.clientName||'Client'}</td>
        <td>€${parseFloat(o.total_amount||o.totalAmount||0).toFixed(2)}</td>
        <td>${statusBadge(o.status)}</td>
      </tr>`).join('');
  } catch(e) {
    const d = getDemoOrders();
    tbody.innerHTML = d.map(o=>`<tr><td>#${o.id}</td><td>${o.clientName}</td><td>€${o.totalAmount}</td><td>${statusBadge(o.status)}</td></tr>`).join('');
  }
}

function getDemoOrders() {
  return [
    {id:1245,clientName:'Sophie Martin',totalAmount:'184.50',status:'delivered'},
    {id:1244,clientName:'Jean Dubois',totalAmount:'92.00',status:'shipped'},
    {id:1243,clientName:'Marie Lefevre',totalAmount:'256.75',status:'pending'},
    {id:1242,clientName:'Paul Bernard',totalAmount:'45.00',status:'cancelled'},
  ];
}

function statusBadge(s) {
  const m = {delivered:'badge-green',shipped:'badge-blue',pending:'badge-orange',cancelled:'badge-red',livree:'badge-green',expediee:'badge-blue',attente:'badge-orange'};
  const l = {delivered:'✓ Livrée',shipped:'📦 Expédiée',pending:'⏳ En attente',cancelled:'✗ Annulée'};
  return `<span class="badge ${m[s]||'badge-gray'}">${l[s]||s}</span>`;
}

function loadActivity() {
  const el = document.getElementById('activity-list');
  if (!el) return;
  const events = [
    {icon:'📦',color:'rgba(79,110,247,.15)',tc:'#4f6ef7',title:'Nouvelle commande #1245',meta:'Il y a 2 min'},
    {icon:'✅',color:'rgba(16,185,129,.15)',tc:'#10b981',title:'Commande #1242 livrée',meta:'Il y a 1 heure'},
    {icon:'⚠️',color:'rgba(245,158,11,.15)',tc:'#f59e0b',title:'Stock faible : Produit #5',meta:'Il y a 3 heures'},
    {icon:'👤',color:'rgba(139,92,246,.15)',tc:'#8b5cf6',title:'Nouveau client inscrit',meta:'Il y a 5 heures'},
    {icon:'💰',color:'rgba(16,185,129,.15)',tc:'#10b981',title:'Paiement reçu €184.50',meta:'Il y a 6 heures'},
  ];
  el.innerHTML = events.map(e=>`
    <div class="activity-item">
      <div class="activity-icon" style="background:${e.color};color:${e.tc}">${e.icon}</div>
      <div class="activity-body"><div class="activity-title">${e.title}</div><div class="activity-meta">${e.meta}</div></div>
    </div>`).join('');
}

function exportDashboard() {
  const w = window.open('','_blank','width=800,height=600');
  w.document.write(`<!DOCTYPE html><html><head><title>Rapport Dashboard</title>
  <style>body{font-family:Arial,sans-serif;margin:40px;color:#1a1a1a}h1{margin-bottom:20px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:30px}.card{border:1px solid #ddd;border-radius:8px;padding:16px;text-align:center}.val{font-size:1.8rem;font-weight:700;color:#4f6ef7}.lab{font-size:.9rem;color:#666;margin-top:4px}@media print{button{display:none}}</style></head><body>
  <h1>Rapport Dashboard — ${new Date().toLocaleDateString('fr-FR')}</h1>
  <button onclick="window.print()" style="padding:10px 20px;background:#4f6ef7;color:#fff;border:none;border-radius:6px;cursor:pointer;margin-bottom:20px">🖨️ Imprimer</button>
  <div class="grid">
    <div class="card"><div class="val">${document.getElementById('kpi-rev')?.textContent||'—'}</div><div class="lab">Revenus</div></div>
    <div class="card"><div class="val">${document.getElementById('kpi-ord')?.textContent||'—'}</div><div class="lab">Commandes</div></div>
    <div class="card"><div class="val">${document.getElementById('kpi-cli')?.textContent||'—'}</div><div class="lab">Clients</div></div>
    <div class="card"><div class="val">${document.getElementById('kpi-cvr')?.textContent||'—'}</div><div class="lab">Taux Conv.</div></div>
  </div>
  <p style="color:#666;font-size:.9rem">Généré par EcomSolutions</p></body></html>`);
  w.document.close();
}

window.initDashboard = initDashboard;
window.setChartPeriod = setChartPeriod;
window.exportDashboard = exportDashboard;
