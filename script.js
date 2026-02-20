// ── DATA ──────────────────────────────────────────────────────────────────────
const BASIC = [
  {k:'ア',r:'a'},{k:'イ',r:'i'},{k:'ウ',r:'u'},{k:'エ',r:'e'},{k:'オ',r:'o'},
  {k:'カ',r:'ka'},{k:'キ',r:'ki'},{k:'ク',r:'ku'},{k:'ケ',r:'ke'},{k:'コ',r:'ko'},
  {k:'サ',r:'sa'},{k:'シ',r:'shi',alt:['si']},{k:'ス',r:'su'},{k:'セ',r:'se'},{k:'ソ',r:'so'},
  {k:'タ',r:'ta'},{k:'チ',r:'chi',alt:['ti']},{k:'ツ',r:'tsu',alt:['tu']},{k:'テ',r:'te'},{k:'ト',r:'to'},
  {k:'ナ',r:'na'},{k:'ニ',r:'ni'},{k:'ヌ',r:'nu'},{k:'ネ',r:'ne'},{k:'ノ',r:'no'},
  {k:'ハ',r:'ha'},{k:'ヒ',r:'hi'},{k:'フ',r:'fu',alt:['hu']},{k:'ヘ',r:'he'},{k:'ホ',r:'ho'},
  {k:'マ',r:'ma'},{k:'ミ',r:'mi'},{k:'ム',r:'mu'},{k:'メ',r:'me'},{k:'モ',r:'mo'},
  {k:'ヤ',r:'ya'},{k:'ユ',r:'yu'},{k:'ヨ',r:'yo'},
  {k:'ラ',r:'ra'},{k:'リ',r:'ri'},{k:'ル',r:'ru'},{k:'レ',r:'re'},{k:'ロ',r:'ro'},
  {k:'ワ',r:'wa'},{k:'ヲ',r:'wo'},{k:'ン',r:'n',alt:['nn']},
  {k:'ガ',r:'ga'},{k:'ギ',r:'gi'},{k:'グ',r:'gu'},{k:'ゲ',r:'ge'},{k:'ゴ',r:'go'},
  {k:'ザ',r:'za'},{k:'ジ',r:'ji',alt:['zi']},{k:'ズ',r:'zu'},{k:'ゼ',r:'ze'},{k:'ゾ',r:'zo'},
  {k:'ダ',r:'da'},{k:'ヂ',r:'di'},{k:'ヅ',r:'du'},{k:'デ',r:'de'},{k:'ド',r:'do'},
  {k:'バ',r:'ba'},{k:'ビ',r:'bi'},{k:'ブ',r:'bu'},{k:'ベ',r:'be'},{k:'ボ',r:'bo'},
  {k:'パ',r:'pa'},{k:'ピ',r:'pi'},{k:'プ',r:'pu'},{k:'ペ',r:'pe'},{k:'ポ',r:'po'},
];

const COMPOUND = [
  {k:'キャ',r:'kya'},{k:'キュ',r:'kyu'},{k:'キョ',r:'kyo'},
  {k:'シャ',r:'sha',alt:['sya']},{k:'シュ',r:'shu',alt:['syu']},{k:'ショ',r:'sho',alt:['syo']},
  {k:'チャ',r:'cha',alt:['tya']},{k:'チュ',r:'chu',alt:['tyu']},{k:'チョ',r:'cho',alt:['tyo']},
  {k:'ニャ',r:'nya'},{k:'ニュ',r:'nyu'},{k:'ニョ',r:'nyo'},
  {k:'ヒャ',r:'hya'},{k:'ヒュ',r:'hyu'},{k:'ヒョ',r:'hyo'},
  {k:'ミャ',r:'mya'},{k:'ミュ',r:'myu'},{k:'ミョ',r:'myo'},
  {k:'リャ',r:'rya'},{k:'リュ',r:'ryu'},{k:'リョ',r:'ryo'},
  {k:'ギャ',r:'gya'},{k:'ギュ',r:'gyu'},{k:'ギョ',r:'gyo'},
  {k:'ジャ',r:'ja',alt:['jya','zya']},{k:'ジュ',r:'ju',alt:['jyu','zyu']},{k:'ジョ',r:'jo',alt:['jyo','zyo']},
  {k:'ビャ',r:'bya'},{k:'ビュ',r:'byu'},{k:'ビョ',r:'byo'},
  {k:'ピャ',r:'pya'},{k:'ピュ',r:'pyu'},{k:'ピョ',r:'pyo'},
  {k:'ファ',r:'fa'},{k:'フィ',r:'fi'},{k:'フェ',r:'fe'},{k:'フォ',r:'fo'},
  {k:'ティ',r:'ti'},{k:'ディ',r:'di'},{k:'デュ',r:'dyu'},
  {k:'ウィ',r:'wi'},{k:'ウェ',r:'we'},{k:'ウォ',r:'wo'},
  {k:'ヴ',r:'vu'},{k:'ヴァ',r:'va'},{k:'ヴィ',r:'vi'},{k:'ヴェ',r:'ve'},{k:'ヴォ',r:'vo'},
];

const ALL_CHARS = [...BASIC, ...COMPOUND];

// Build lookup
const CHAR_MAP = {};
ALL_CHARS.forEach(c => { CHAR_MAP[c.k] = c; });

// ── STATE ─────────────────────────────────────────────────────────────────────
function loadData() {
  try {
    const raw = localStorage.getItem('katakana_progress');
    return raw ? JSON.parse(raw) : {};
  } catch (e) { return {}; }
}

function saveData() {
  localStorage.setItem('katakana_progress', JSON.stringify(stats));
  localStorage.setItem('katakana_meta', JSON.stringify(meta));
}

function loadMeta() {
  try {
    const raw = localStorage.getItem('katakana_meta');
    return raw ? JSON.parse(raw) : { streak: 0, lastDate: null, totalSessions: 0 };
  } catch (e) { return { streak: 0, lastDate: null, totalSessions: 0 }; }
}

let stats = loadData(); // { 'ア': { correct: 5, wrong: 2, seen: 7 } }
let meta = loadMeta();

// Session
let sessionCorrect = 0;
let sessionWrong = 0;
let currentChar = null;
let attempts = 0;
let mode = 'smart';
let practiceQueue = [];
let wrongInSession = [];
let awaitingConfirm = false;

// ── ALGORITHM ─────────────────────────────────────────────────────────────────
function getWeight(char) {
  const s = stats[char.k];
  if (!s || s.seen === 0) return 10; // never seen = high priority
  const rate = s.correct / s.seen;
  if (rate < 0.5) return 12;
  if (rate < 0.7) return 6;
  if (rate < 0.9) return 3;
  return 1;
}

function buildQueue() {
  let pool;
  if (mode === 'review') {
    pool = ALL_CHARS.filter(c => {
      const s = stats[c.k];
      if (!s || s.seen < 2) return false;
      return (s.correct / s.seen) < 0.6;
    });
    if (pool.length === 0) { toast('No weak characters yet — keep practicing!'); pool = ALL_CHARS; }
  } else if (mode === 'all') {
    pool = ALL_CHARS;
  } else {
    // Smart: start with basic, open compound after 20+ seen basics
    const seenBasic = BASIC.filter(c => stats[c.k] && stats[c.k].seen > 0).length;
    pool = seenBasic < 20 ? BASIC : ALL_CHARS;
  }

  // Weighted shuffle
  const weighted = [];
  pool.forEach(c => {
    const w = getWeight(c);
    for (let i = 0; i < w; i++) weighted.push(c);
  });
  // Shuffle
  for (let i = weighted.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [weighted[i], weighted[j]] = [weighted[j], weighted[i]];
  }
  // Deduplicate preserving order
  const seen = new Set();
  const queue = [];
  for (const c of weighted) {
    if (!seen.has(c.k)) { seen.add(c.k); queue.push(c); }
    if (queue.length >= 30) break;
  }
  return queue;
}

function nextChar() {
  awaitingConfirm = false;
  if (practiceQueue.length === 0) practiceQueue = buildQueue();
  currentChar = practiceQueue.shift();
  attempts = 0;
  renderChar();
  updateQueueIndicator();
}

function renderChar() {
  const card = document.getElementById('char-card');
  const display = document.getElementById('char-display');
  card.classList.add('changing');
  setTimeout(() => {
    display.textContent = currentChar.k;
    card.classList.remove('changing');
  }, 200);
  document.getElementById('romanji-input').value = '';
  document.getElementById('romanji-input').className = 'romanji-input';
  document.getElementById('feedback-msg').textContent = '';
  document.getElementById('feedback-msg').className = 'feedback-msg';
  updateHints();
  document.getElementById('romanji-input').focus();
}

function updateHints() {
  for (let i = 0; i < 3; i++) {
    const dot = document.getElementById(`hint-${i}`);
    dot.className = 'hint-dot' + (i < attempts ? ' used' : '');
  }
}

// ── CLOSE ANSWER DETECTION ────────────────────────────────────────────────────
function editDistance(a, b) {
  const dp = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    }
  }
  return dp[a.length][b.length];
}

function isClose(input, correct) {
  if (input === correct) return false; // exact
  const d = editDistance(input, correct);
  return d <= 1;
}

// ── CHECK INPUT ───────────────────────────────────────────────────────────────
function checkInput(val) {
  if (!currentChar || !val) return;
  const input = val.trim().toLowerCase();

  if (awaitingConfirm) {
    const allCorrect = [currentChar.r, ...(currentChar.alt || [])];
    const inp = document.getElementById('romanji-input');
    if (allCorrect.includes(input)) {
      inp.className = 'romanji-input input-correct';
      setTimeout(() => { nextChar(); }, 400);
    } else {
      inp.value = '';
      inp.className = 'romanji-input input-wrong';
      setTimeout(() => { inp.className = 'romanji-input'; inp.focus(); }, 400);
    }
    return;
  }
  const correct = currentChar.r;
  const alts = currentChar.alt || [];
  const allCorrect = [correct, ...alts];

  if (allCorrect.includes(input)) {
    handleCorrect();
    return;
  }

  // Close answer?
  const closeMatch = allCorrect.some(a => isClose(input, a));
  if (closeMatch && attempts < 2) {
    handleClose(correct);
    return;
  }

  handleWrong(correct);
}

function handleCorrect() {
  const inp = document.getElementById('romanji-input');
  const fb = document.getElementById('feedback-msg');
  const card = document.getElementById('char-card');

  inp.className = 'romanji-input input-correct';
  fb.textContent = attempts === 0 ? getPositive() : 'Got it! ✓';
  fb.className = 'feedback-msg correct';
  card.classList.add('correct-flash');
  card.classList.add('pulse');
  setTimeout(() => { card.classList.remove('correct-flash'); card.classList.remove('pulse'); }, 500);

  // Record
  if (!stats[currentChar.k]) stats[currentChar.k] = { correct: 0, wrong: 0, seen: 0 };
  stats[currentChar.k].correct++;
  stats[currentChar.k].seen++;
  sessionCorrect++;
  updateStreak(true);
  saveData();
  renderSessionStats();

  setTimeout(() => { nextChar(); }, 900);
}

function handleClose(correct) {
  attempts++;
  const inp = document.getElementById('romanji-input');
  const fb = document.getElementById('feedback-msg');

  inp.className = 'romanji-input input-close';
  fb.textContent = `Almost! It starts with "${correct[0]}" — try again`;
  fb.className = 'feedback-msg close';
  inp.value = '';
  updateHints();

  setTimeout(() => {
    inp.className = 'romanji-input';
    inp.focus();
  }, 600);
}

function handleWrong(correct) {
  const card = document.getElementById('char-card');
  const fb = document.getElementById('feedback-msg');
  const inp = document.getElementById('romanji-input');

  card.classList.add('shake');
  setTimeout(() => card.classList.remove('shake'), 400);

  attempts++;
  if (!stats[currentChar.k]) stats[currentChar.k] = { correct: 0, wrong: 0, seen: 0 };

  if (attempts >= 3) {
    // Show answer, require user to type it before continuing
    inp.className = 'romanji-input input-wrong';
    fb.className = 'feedback-msg wrong';
    stats[currentChar.k].wrong++;
    stats[currentChar.k].seen++;
    if (!wrongInSession.includes(currentChar.k)) wrongInSession.push(currentChar.k);
    sessionWrong++;
    updateStreak(false);
    saveData();
    renderSessionStats();
    fb.textContent = `The answer is "${correct}" — type it to continue`;
    awaitingConfirm = true;
    inp.value = '';
    setTimeout(() => { inp.className = 'romanji-input'; inp.focus(); }, 600);
  } else {
    fb.textContent = `Not quite — ${3 - attempts} attempt${3-attempts>1?'s':''} left`;
    fb.className = 'feedback-msg wrong';
    inp.value = '';
    inp.className = 'romanji-input';
    updateHints();
    setTimeout(() => { inp.focus(); }, 200);
  }
}

function skipCurrent() {
  if (!currentChar) return;
  toast(`Skipped: ${currentChar.k} = ${currentChar.r}`);
  nextChar();
}

function getPositive() {
  const msgs = ['Perfect! ✓', 'Excellent! ✓', 'Correct! ✓', 'Nice! ✓', 'Sharp! ✓', '正解! ✓'];
  return msgs[Math.floor(Math.random() * msgs.length)];
}

// ── STREAK ────────────────────────────────────────────────────────────────────
function updateStreak(correct) {
  if (correct) {
    meta.streak++;
  } else {
    meta.streak = 0;
  }
  document.getElementById('streak-count').textContent = meta.streak;
  if (meta.streak > 0 && meta.streak % 10 === 0) {
    toast(`🔥 ${meta.streak} streak!`);
  }
  saveData();
}

// ── RENDER ────────────────────────────────────────────────────────────────────
function renderSessionStats() {
  document.getElementById('session-correct').textContent = sessionCorrect;
  document.getElementById('session-wrong').textContent = sessionWrong;
  document.getElementById('streak-count').textContent = meta.streak;
}

function updateQueueIndicator() {
  const weak = wrongInSession.slice(-5);
  const container = document.getElementById('queue-indicator');
  const chars = document.getElementById('queue-chars');
  if (weak.length === 0) { container.style.display = 'none'; return; }
  container.style.display = 'flex';
  chars.innerHTML = weak.map(k => `<span class="queue-char">${k}</span>`).join('');
}

function renderProgressView() {
  let totalSeen = 0, mastered = 0, struggling = 0;

  ALL_CHARS.forEach(c => {
    const s = stats[c.k];
    if (s && s.seen > 0) {
      totalSeen++;
      const rate = s.correct / s.seen;
      if (rate >= 0.7 && s.seen >= 3) mastered++;
      else if (rate < 0.5 && s.seen >= 2) struggling++;
    }
  });

  document.getElementById('prog-total').textContent = totalSeen;
  document.getElementById('prog-mastered').textContent = mastered;
  document.getElementById('prog-struggling').textContent = struggling;

  const totalAnswered = Object.values(stats).reduce((a, s) => a + s.seen, 0);
  document.getElementById('last-session-text').textContent =
    totalAnswered > 0 ? `${totalAnswered} total answers across ${totalSeen} characters` : 'No practice yet';

  renderGrid('grid-basic', BASIC);
  renderGrid('grid-compound', COMPOUND);
}

function renderGrid(id, chars) {
  const el = document.getElementById(id);
  el.innerHTML = chars.map(c => {
    const s = stats[c.k];
    let cls = 'unseen';
    let rateStr = '';
    if (s && s.seen > 0) {
      const rate = s.correct / s.seen;
      rateStr = `${Math.round(rate * 100)}%`;
      if (rate >= 0.7 && s.seen >= 3) cls = 'mastered';
      else if (rate < 0.5 && s.seen >= 2) cls = 'struggling';
      else cls = 'learning';
    }
    return `<div class="kana-cell ${cls}" title="${c.k} = ${c.r}">
      <span class="kana-cell-char">${c.k}</span>
      <span class="kana-cell-rom">${c.r}</span>
      ${rateStr ? `<span class="kana-cell-rate" style="color:${cls==='mastered'?'var(--green)':cls==='struggling'?'var(--red)':'var(--yellow)'}">${rateStr}</span>` : ''}
    </div>`;
  }).join('');
}

// ── CONTROLS ──────────────────────────────────────────────────────────────────
function switchView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`view-${name}`).classList.add('active');
  document.querySelectorAll('.tab-btn').forEach(b => {
    if (b.textContent.toLowerCase() === name || b.getAttribute('onclick').includes(name)) b.classList.add('active');
  });
  if (name === 'progress') renderProgressView();
  if (name === 'practice') document.getElementById('romanji-input').focus();
}

function setMode(m) {
  mode = m;
  practiceQueue = [];
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`mode-${m}`).classList.add('active');
  nextChar();
  toast(`Mode: ${m === 'smart' ? 'Smart Adaptive' : m === 'all' ? 'All Characters' : 'Review Weak'}`);
}

function resetData() {
  if (!confirm('Reset all progress? This cannot be undone.')) return;
  stats = {};
  meta = { streak: 0, lastDate: null, totalSessions: 0 };
  sessionCorrect = 0;
  sessionWrong = 0;
  wrongInSession = [];
  saveData();
  renderProgressView();
  renderSessionStats();
  practiceQueue = [];
  nextChar();
  toast('Progress reset.');
}

function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.getElementById('toaster').appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

// ── INPUT HANDLER ─────────────────────────────────────────────────────────────
document.getElementById('romanji-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const val = e.target.value.trim();
    if (val) checkInput(val);
  }
});

// Also accept on space for single-char answers? No, use Enter only for clarity.

// ── INIT ──────────────────────────────────────────────────────────────────────
renderSessionStats();
nextChar();