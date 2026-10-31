// Logik game Misi Kerjaya. Keputusan dihantar ke Google Sheets kalau SHEET_URL diisi dalam js/config.js.
const KEYS = ["R", "I", "A", "S", "E", "C"];
// Indeks Pembezaan melebihi 16 (daripada 32) dikira tinggi dalam SDS; skala sama digunakan untuk demo.
const HIGH_DIFF_RATIO = 16 / 32;

// Bilangan kad setiap jenis dalam satu halaman (6 jenis × 2 = 12 kad setiap halaman)
const PER_TYPE_PER_PAGE = 2;
const TOTAL_ITEMS = STAGES.reduce((n, st) => n + st.items.length, 0);

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// Setiap halaman mengambil bilangan item yang sama daripada setiap jenis, kemudian dirawakkan,
// supaya kad sejenis tidak berkumpul seperti dalam borang kertas.
function buildPages(st) {
  const byType = {};
  st.items.forEach((it, j) => (byType[it.k] = byType[it.k] || []).push(j));
  const longest = Math.max(0, ...Object.values(byType).map(a => a.length));
  const pages = [];
  for (let p = 0; p * PER_TYPE_PER_PAGE < longest; p++) {
    pages.push(shuffle(Object.values(byType).flatMap(a => a.slice(p * PER_TYPE_PER_PAGE, (p + 1) * PER_TYPE_PER_PAGE))));
  }
  return pages.length ? pages : [[]];
}

let state = newState();
const app = document.getElementById("app");

function newState() {
  return {
    step: 0, page: 0, name: "", kelas: "", picks: STAGES.map(() => []), pages: STAGES.map(buildPages),
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8), send: "idle", payload: null
  };
}

// Keputusan dihantar sekali sahaja setiap permainan; "id" membolehkan Apps Script abaikan hantaran berulang.
async function sendResult() {
  if (!SHEET_URL || !state.payload || state.send === "sending" || state.send === "sent") return;
  state.send = "sending";
  updateSend();
  const mine = state;
  try {
    // Tanpa header Content-Type, permintaan dikira "simple" dan tidak perlu CORS preflight ke Apps Script
    const res = await fetch(SHEET_URL, { method: "POST", body: JSON.stringify(mine.payload) });
    const out = await res.json();
    mine.send = out.ok ? "sent" : "failed";
  } catch (e) {
    mine.send = "failed";
  }
  if (mine === state) updateSend();
}

function sendHTML() {
  if (!SHEET_URL) return `<p class="shot">📸 Tangkap layar kad ini dan hantar kepada guru kaunselor.</p>`;
  return {
    idle: `<p class="send">Menyediakan keputusan…</p>`,
    sending: `<p class="send">⏳ Menghantar keputusan kepada guru kaunselor…</p>`,
    sent: `<p class="send ok">✓ Keputusan dah dihantar kepada guru kaunselor.</p>`,
    failed: `<p class="send fail">Keputusan belum dihantar. Semak internet, kemudian
      <button class="ghost small" data-resend>Cuba lagi</button></p>`
  }[state.send];
}

function updateSend() {
  const el = document.getElementById("send");
  if (el) el.innerHTML = sendHTML();
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function speak(text) {
  try {
    const s = window.speechSynthesis; if (!s) return;
    s.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voices = s.getVoices();
    const v = voices.find(v => /^ms/i.test(v.lang)) || voices.find(v => /^id/i.test(v.lang));
    if (v) u.voice = v;
    u.lang = v ? v.lang : "ms-MY";
    u.rate = 0.95;
    s.speak(u);
  } catch (e) {}
}

function maxPerType() {
  const m = Object.fromEntries(KEYS.map(k => [k, 0]));
  STAGES.forEach(st => st.items.forEach(it => m[it.k]++));
  return m;
}

function scores() {
  const s = Object.fromEntries(KEYS.map(k => [k, 0]));
  state.picks.forEach((p, i) => p.forEach(j => s[STAGES[i].items[j].k]++));
  return s;
}

// Kod 3 huruf, dan senarai kumpulan skor seri yang menyentuh 3 tempat teratas.
function holland(s) {
  const ranked = [...KEYS].sort((a, b) => s[b] - s[a] || KEYS.indexOf(a) - KEYS.indexOf(b));
  const code = ranked.slice(0, 3);
  const ties = [];
  const seen = new Set();
  code.forEach(k => {
    if (seen.has(s[k])) return;
    seen.add(s[k]);
    const group = KEYS.filter(x => s[x] === s[k]);
    if (group.length > 1) ties.push({ score: s[k], group });
  });
  return { code, ties };
}

function pathHTML() {
  const stops = [0, 33.33, 66.66, 100];
  const pct = stops[Math.min(state.step, 3)];
  return `<div class="path" aria-hidden="true"><div class="fill" style="width:${pct}%"></div>
    ${stops.map((x, i) => `<div class="stop ${i <= state.step ? "on" : ""}" style="left:${x}%"></div>`).join("")}
    <div class="avatar walk" style="left:${pct}%">${state.step >= 4 ? "🧑‍🎓" : "🧑‍🚀"}</div></div>`;
}

function intro() {
  app.innerHTML = `
    <div class="hero">
      <div class="big" aria-hidden="true">🧑‍🚀</div>
      <div class="sticker" aria-hidden="true">Tiada jawapan salah!</div>
      <h1>Misi <mark>Kerjaya</mark></h1>
      <p>Tekan gambar yang kamu suka. Tak perlu banyak membaca. Tiada jawapan betul atau salah.</p>
      <div class="steps">
        <div><span aria-hidden="true">❤️</span>1. Apa kamu suka</div>
        <div><span aria-hidden="true">🛠️</span>2. Apa kamu boleh</div>
        <div><span aria-hidden="true">👔</span>3. Kerjaya impian</div>
      </div>
      <form class="who" id="who" novalidate>
        <label for="f-name">Nama kamu</label>
        <input id="f-name" name="name" autocomplete="name" maxlength="60" value="${esc(state.name)}" placeholder="Contoh: Aina Sofea">
        <label for="f-kelas">Kelas</label>
        <input id="f-kelas" name="kelas" maxlength="20" value="${esc(state.kelas)}" placeholder="Contoh: 4 Bestari">
        <p class="err" id="f-err" hidden>Tulis nama kamu dahulu untuk mula misi.</p>
        ${SHEET_URL ? `<p class="note">Nama, kelas dan keputusan kamu akan dihantar kepada guru kaunselor sahaja.</p>` : ""}
        <div class="bar">
          <button type="button" class="speak" data-say="Selamat datang ke Misi Kerjaya. Tulis nama dan kelas kamu, kemudian tekan Mula misi. Tiada jawapan betul atau salah.">🔊 Dengar</button>
          <button type="submit" class="go">Mula misi ▶</button>
        </div>
      </form>
    </div>
    ${TOTAL_ITEMS < 192 ? `<p class="note">Versi demo: ${TOTAL_ITEMS} daripada 192 item SDS. Versi penuh menggunakan kesemua 192 item dengan izin pemilik hak cipta.</p>` : ""}`;
}

function countText(n) { return `${n} dipilih · yang tak ditekan dikira "Tidak"`; }

function stage(i) {
  const st = STAGES[i], picks = state.picks[i], pages = state.pages[i];
  const last = state.page >= pages.length - 1;
  const pageNote = pages.length > 1 ? ` · Halaman ${state.page + 1}/${pages.length}` : "";
  const cards = pages[state.page].map((j, n) => {
    const it = st.items[j], on = picks.includes(j), text = it.s || it.t;
    return `<div class="cardwrap" style="--i:${n}">
      <button class="card" data-pick="${j}" aria-pressed="${on}">
        <span class="tick" aria-hidden="true">✓</span>
        <span class="pic" aria-hidden="true">${it.e}</span>
        <span class="lbl">${esc(text)}</span>
        <span class="no">Item ${it.no}</span>
      </button>
      <button class="mini" data-say="${esc(text)}" aria-label="Dengar: ${esc(text)}">🔊</button>
    </div>`;
  }).join("");
  app.innerHTML = `${pathHTML()}
    <div class="stagehead">
      <div><div class="eyebrow">${st.eyebrow}${pageNote}</div><h2>${st.title}</h2></div>
      <button class="speak" data-say="${esc(st.say)}">🔊 Dengar arahan</button>
    </div>
    <div class="grid">${cards}</div>
    <div class="bar">
      <span class="count" id="count">${countText(picks.length)}</span>
      <button class="go" data-next>${!last || i < STAGES.length - 1 ? "Seterusnya ▶" : "Lihat keputusan ▶"}</button>
    </div>`;
}

function result() {
  const s = scores(), max = maxPerType(), top = Math.max(...KEYS.map(k => max[k]));
  const vals = KEYS.map(k => s[k]);
  const diff = Math.max(...vals) - Math.min(...vals);
  const none = vals.every(v => v === 0);
  const { code, ties } = holland(s);
  const date = new Date().toLocaleDateString("ms-MY", { day: "2-digit", month: "2-digit", year: "numeric" });
  const highDiff = diff > top * HIGH_DIFF_RATIO;

  const tieText = ties.map(t => `${t.group.join(" = ")} (skor ${t.score})`).join(" · ");
  const sayText = none ? "Kamu belum pilih apa-apa. Cuba main semula."
    : `Tahniah ${state.name}. Kod Holland kamu ialah ${code.join(", ")}. ${code.map(k => TYPES[k].n).join(", ")}.` +
      (ties.length ? " Ada skor yang sama, jadi tunjukkan keputusan ini kepada guru kaunselor." : "");

  const bars = KEYS.map(k => `<div class="brow"><span>${k} · ${TYPES[k].n}</span>
      <div class="track"><div class="val" style="width:${max[k] ? s[k] / max[k] * 100 : 0}%;background:var(--${k})"></div></div>
      <b>${s[k]}/${max[k]}</b></div>`).join("");
  const typeCards = code.map(k => `<div class="type" style="border-top-color:var(--${k})">
      <h3>${k} · ${TYPES[k].n}</h3><p>${TYPES[k].d}</p>
      <div class="chips">${TYPES[k].jobs.map(j => `<span>${j}</span>`).join("")}</div></div>`).join("");

  app.innerHTML = `${pathHTML()}
    <div class="stagehead">
      <div><div class="eyebrow">Misi selesai</div><h2>Keputusan kamu</h2></div>
      <button class="speak" data-say="${esc(sayText)}">🔊 Dengar keputusan</button>
    </div>
    ${none ? `<div class="panel"><p>Kamu belum pilih mana-mana kad. Main semula dan tekan gambar yang kamu suka.</p></div>` : `
    <section class="scorecard" aria-label="Kad keputusan">
      <div class="sc-name"><b>${esc(state.name)}</b>${state.kelas ? `<span>${esc(state.kelas)}</span>` : ""}</div>
      <div class="sc-top">
        <div>
          <div class="eyebrow">Kod Holland</div>
          <div class="codebox">${code.map(k => `<div class="letter" style="background:var(--${k})">${k}</div>`).join("")}</div>
        </div>
        <dl class="facts">
          <div><dt>Indeks Pembezaan</dt><dd>${diff} <small>${highDiff ? "tinggi" : "rendah"}</small></dd></div>
          <div><dt>Tarikh</dt><dd>${date}</dd></div>
        </dl>
      </div>
      ${ties.length ? `<p class="tie">⚠️ Skor seri: ${tieText}. Susunan huruf yang seri perlu dibincang dengan guru kaunselor.</p>` : ""}
      <div class="bars">${bars}</div>
      <div id="send">${sendHTML()}</div>
    </section>
    <div class="types">${typeCards}</div>`}
    ${TOTAL_ITEMS < 192 ? `<p class="note">Demo ${TOTAL_ITEMS} item tidak boleh dijadikan keputusan sebenar. Dalam SDS penuh, skor maksimum ialah 32 setiap jenis dan Indeks Pembezaan melebihi 16 dikira tinggi.</p>` : ""}
    ${none ? "" : confettiHTML()}
    <div class="bar"><span></span><button class="ghost" data-restart>↺ Main semula</button></div>`;

  if (!none && !state.payload) {
    const letters = ["A", "B", "C"];
    state.payload = {
      id: state.id, name: state.name, kelas: state.kelas, code: code.join(""), ties: tieText,
      scores: s, diff,
      yes: state.picks.map((p, i) => `${letters[i]}: ${p.map(j => STAGES[i].items[j].no).sort((a, b) => a - b).join(", ") || "-"}`).join(" | ")
    };
  }
  sendResult();
}

// Konfeti sekali sahaja bila keputusan dipaparkan
function confettiHTML() {
  const warna = ["var(--R)", "var(--I)", "var(--A)", "var(--S)", "var(--E)", "var(--C)"];
  return `<div class="confetti" aria-hidden="true">${Array.from({ length: 36 }, (_, i) =>
    `<i style="left:${Math.random() * 100}%;background:${warna[i % 6]};animation-delay:${(Math.random() * .8).toFixed(2)}s;animation-duration:${(2 + Math.random() * 1.5).toFixed(2)}s"></i>`).join("")}</div>`;
}

function render() {
  if (state.step === 0) intro();
  else if (state.step <= STAGES.length) stage(state.step - 1);
  else result();
}

app.addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  if (b.dataset.say) { speak(b.dataset.say); return; }
  if (b.dataset.pick !== undefined) {
    const p = state.picks[state.step - 1], j = +b.dataset.pick;
    const at = p.indexOf(j);
    if (at >= 0) p.splice(at, 1); else p.push(j);
    b.setAttribute("aria-pressed", at < 0);
    document.getElementById("count").textContent = countText(p.length);
    return;
  }
  if (b.hasAttribute("data-next")) {
    if (state.page < state.pages[state.step - 1].length - 1) state.page++;
    else { state.step++; state.page = 0; }
    try { speechSynthesis.cancel(); } catch (e) {}
    render();
    window.scrollTo({ top: 0 });
    return;
  }
  if (b.hasAttribute("data-resend")) { state.send = "idle"; sendResult(); return; }
  if (b.hasAttribute("data-restart")) { state = newState(); render(); }
});

app.addEventListener("submit", e => {
  e.preventDefault();
  const name = document.getElementById("f-name").value.trim();
  const kelas = document.getElementById("f-kelas").value.trim();
  if (!name) {
    document.getElementById("f-err").hidden = false;
    document.getElementById("f-name").focus();
    return;
  }
  state.name = name;
  state.kelas = kelas;
  state.step = 1;
  render();
  window.scrollTo({ top: 0 });
});

render();
