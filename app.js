/* ================================================================
   eSIM Rescue LP — app.js v4.0 (UX強化 & Trust)
   Update: 結果カードへのスクロール / 進捗表示 / コピーボタン
   ================================================================ */

// ========== Tab Switching ==========
function switchTab(panelId, btn) {
  document.querySelectorAll('.tab-panel').forEach(function (el) { el.classList.remove('active'); });
  document.querySelectorAll('.tab-btn').forEach(function (el) { el.classList.remove('active'); });
  var panel = document.getElementById(panelId);
  if (panel) panel.classList.add('active');
  if (btn) btn.classList.add('active');
}

// ========== FAQ Toggle ==========
function toggleFaq(btn) {
  btn.parentElement.classList.toggle('open');
}

// ========== Smooth Scroll ==========
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var href = this.getAttribute('href');
      if (!href || href === '#') return;
      var t = document.querySelector(href);
      if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });
});

// ========== Diagnosis State ==========
var diag = { q0: null, q1: null, q2: null, q3: null, country: null, days: null };

var LINKS = {
  airalo: 'https://airalo.pxf.io/QYPOe3',
  nomad: 'https://lotusflareinc.pxf.io/zzgaBr',
  ubigi: 'https://go.ubigi.com/WOXD0A'
};

// ========== Selection ==========
function selDiag(key, el, val) {
  diag[key] = val;
  var parent = el.parentElement;
  parent.querySelectorAll('.diag-opt-btn').forEach(function (o) { o.classList.remove('selected'); });
  el.classList.add('selected');

  // 特定条件での必須バッジ切り替え
  if (key === 'q0') {
    var isPrepare = val === 'prepare';
    var cReq = document.getElementById('country-req');
    var dReq = document.getElementById('days-req');
    if (cReq) { cReq.textContent = isPrepare ? '必須' : '任意'; cReq.className = isPrepare ? 'badge-req' : 'badge-opt'; }
    if (dReq) { dReq.textContent = isPrepare ? '必須' : '任意'; dReq.className = isPrepare ? 'badge-req' : 'badge-opt'; }
  }
  updateProgress();
}

// ========== Progress ==========
function updateProgress() {
  var answered = 0;
  if (diag.q0) answered++;
  if (diag.q1) answered++;
  if (diag.q2) answered++;
  if (diag.q3) answered++;
  if (diag.country) answered++;
  if (diag.days) answered++;

  var required = 4;
  if (diag.q0 === 'prepare') required = 6;

  var pct = Math.min(100, Math.round((answered / required) * 100));
  var bar = document.getElementById('diag-progress-fill');
  var txt = document.getElementById('diag-progress-text');

  if (bar) bar.style.width = pct + '%';
  /* ユーザー要望: 進捗の意味を明確化 */
  if (txt) txt.textContent = '必須項目の入力状況: ' + answered + '/' + required + ' 完了';
}

// ========== Submit ==========
function submitDiag() {
  var errEl = document.getElementById('diag-error');
  errEl.classList.remove('show');

  // Validation
  if (!diag.q0) { showErr('⚠️「いまの状況」を選んでください'); return; }
  if (!diag.q1) { showErr('⚠️ 端末を選んでください'); return; }
  if (!diag.q2) { showErr('⚠️ 主回線の有無を選んでください'); return; }
  if (!diag.q3) { showErr('⚠️ Wi-Fiの有無を選んでください'); return; }
  if (diag.q0 === 'prepare') {
    if (!diag.country) { showErr('⚠️ 渡航先を選んでください'); return; }
    if (!diag.days) { showErr('⚠️ 渡航日数を選んでください'); return; }
  }

  try {
    renderResult();
  } catch (e) {
    console.error(e);
    renderFallback();
  }
}

function showErr(msg) {
  var e = document.getElementById('diag-error');
  e.textContent = msg;
  e.style.display = 'block';
  e.classList.add('show');
  e.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(function () { e.classList.remove('show'); }, 500);
}

// ========== Result Rendering ==========
function renderResult() {
  var content = document.getElementById('result-content');
  content.innerHTML = '';

  var isIphone = diag.q1 === 'iphone';
  var hasSim = diag.q2 === 'yes' || diag.q2 === 'unknown';
  var isPrepare = diag.q0 === 'prepare';

  // Logic: 結論分岐
  var actions = [];
  var conclusionTitle = '解決への手順';

  switch (diag.q0) {
    case 'offline': // 圏外
      conclusionTitle = '緊急：電波をつかみ直す手順';
      actions.push('機内モード ON→OFF');
      actions.push('データローミングをON');
      actions.push('ネットワーク設定を「手動」へ');
      break;
    case 'nodata': // 通信不可
      conclusionTitle = '設定の見直しが必要です';
      actions.push('APN設定を確認する');
      if (hasSim) actions.push('モバイルデータ回線がeSIMか確認');
      actions.push('端末を再起動');
      break;
    case 'slow': // 遅い
      conclusionTitle = '回線品質を改善する手順';
      actions.push('ネットワーク手動選択でキャリア変更');
      actions.push('5G設定を4G(LTE)に変更');
      actions.push('VPNアプリをOFF');
      break;
    case 'prepare': // 出発前
      conclusionTitle = '出発前の必須チェック';
      actions.push('SIMロック解除の確認');
      actions.push('QRコード読み込み（Wi-Fi環境）');
      actions.push('ローミングONの手順確認');
      break;
  }

  // Logic: 詳細手順
  var detailTitle = '詳しい手順を見る';
  var detailList = [];
  if (isPrepare) {
    var days = parseInt(diag.days) || 5;
    var gb = days <= 3 ? '1-2GB' : days <= 7 ? '3-5GB' : days <= 14 ? '5-10GB' : '10GB+';
    detailList = [
      'インストールは必ずWi-Fi環境で',
      '有効化は到着後（日本でONにしない）',
      '推奨容量目安：' + gb + '（' + days + '日間）',
      'このページをブックマーク（現地トラブル用）'
    ];
  } else if (diag.q3 === 'yes') {
    detailList = [
      '各社アプリ/サイトからサポートへ連絡',
      '別のeSIMプランを購入して新規インストール',
      '現在のeSIM設定をやり直す（削除はNG）'
    ];
  } else {
    detailList = [
      'カフェ/ホテル/空港のフリーWi-Fiを確保',
      'Wi-Fi環境下で代替eSIMを購入',
      '現地SIMカード（物理）の購入も検討'
    ];
  }

  // Logic: CTA推奨順
  var providers = [
    { key: 'airalo', name: 'Airalo', label: '🔰 簡単・初心者向け', why: '日本語アプリで操作がわかりやすい' },
    { key: 'ubigi', name: 'Ubigi', label: '📶 安定・高品質', why: 'NTT系列で通信品質が安定' },
    { key: 'nomad', name: 'Nomad', label: '💰 コスパ◎', why: '小容量プランが安い・追加購入可' }
  ];
  var order;
  if (diag.q0 === 'offline') {
    order = [0, 1, 2]; // Airalo 1st
  } else if (diag.q0 === 'nodata' || diag.q0 === 'slow') {
    order = [1, 0, 2]; // Ubigi 1st
  } else {
    order = [2, 0, 1]; // Nomad 1st
  }

  // --- HTML Build ---
  var html = '';

  // Card Header
  html += '<div class="result-card">';
  html += '<div class="result-header"><h3>🚨 診断結果</h3></div>';
  html += '<div class="result-body">';

  // 1. 結論 (強調)
  html += '<div class="res-conclusion">';
  html += '<p>✅ ' + conclusionTitle + '</p>';
  for (var i = 0; i < actions.length; i++) {
    html += '<div class="res-check-item"><span class="res-num">' + (i + 1) + '</span><span>' + actions[i] + '</span></div>';
  }
  // コピーボタン
  html += '<button type="button" class="res-copy-btn" onclick="copyResult()">📋 結果をコピー</button>';
  html += '</div>';

  // 2. 詳細(Accordion)
  html += '<div class="res-details"><details><summary>' + detailTitle + '</summary>';
  html += '<ul class="res-content">';
  for (var j = 0; j < detailList.length; j++) {
    html += '<li>' + detailList[j] + '</li>';
  }
  html += '</ul></details></div>';

  // 3. CTA
  html += '<div class="res-recomm"><h4>それでもダメなら...</h4>';
  for (var k = 0; k < order.length; k++) {
    var pv = providers[order[k]];
    var isBest = k === 0;
    html += '<div class="rec-card' + (isBest ? ' best' : '') + '">';
    html += '<div style="flex:1">';
    html += '<span class="rec-badge">' + (isBest ? '⭐ おすすめ' : pv.label) + '</span>';
    html += '<span class="rec-name">' + pv.name + '</span>';
    if (isBest) html += '<div style="font-size:.75rem;margin-top:4px">' + pv.why + '</div>';
    html += '</div>';
    html += '<a href="' + LINKS[pv.key] + '" target="_blank" rel="noopener" class="btn ' + (isBest ? 'btn--accent' : 'btn--outline') + ' rec-btn">購入</a>';
    html += '</div>';
  }
  html += '</div>'; // end res-recomm

  html += '</div></div>'; // end body, card

  content.innerHTML = html;

  // View switch
  var form = document.getElementById('diag-form');
  var resultSec = document.getElementById('diag-result');
  form.classList.add('form-folded');
  resultSec.classList.add('show');

  // Flash UI & Scroll
  var card = content.querySelector('.result-card');
  setTimeout(function () {
    card.classList.add('flash');
    card.scrollIntoView({ behavior: 'smooth', block: 'center' }); // 結果が見やすい位置へ
  }, 100);
}

// Copy Function
function copyResult() {
  var text = document.querySelector('.result-body').innerText;
  navigator.clipboard.writeText(text).then(function () {
    alert('診断結果をコピーしました');
  }, function (err) {
    console.error('Copy failed', err);
  });
}

function renderFallback() {
  document.getElementById('result-content').innerHTML =
    '<div class="result-card"><div class="result-body"><h3>エラーが発生しました</h3><p>再読み込みしてください。</p></div></div>';
  document.getElementById('diag-result').classList.add('show');
}

function resetDiag() {
  diag = { q0: null, q1: null, q2: null, q3: null, country: null, days: null };
  document.querySelectorAll('.diag-opt-btn').forEach(function (o) { o.classList.remove('selected'); });
  var form = document.getElementById('diag-form');
  var resultSec = document.getElementById('diag-result');
  form.classList.remove('form-folded');
  resultSec.classList.remove('show');
  document.getElementById('result-content').innerHTML = '';
  updateProgress();
  var top = document.getElementById('diagnosis');
  if (top) top.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
