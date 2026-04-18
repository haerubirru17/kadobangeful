// ══════════════════════════════════════════════════════════
// birru-dev.js
// Logic teknis & dev tools untuk Birru.
// Untuk tambah fitur baru: cukup edit file ini.
// Tidak perlu menyentuh index.html sama sekali.
//
// Depends on window.Birru (exposed by index.html):
//   window.Birru.state   → currentUser, conversationHistory, isBotTyping
//   window.Birru.ui      → addChatMessage()
//   WORKER_URL           → dari birru-config.js (global)
//   getSystemPrompt()    → dari birru-config.js (global)
// ══════════════════════════════════════════════════════════

// ── State dev (milik birru-dev.js) ───────────────────────
let isDevMode = false;

// ── Inject CSS dev ───────────────────────────────────────
(function injectDevStyles() {
  const style = document.createElement('style');
  style.id = 'birru-dev-styles';
  style.textContent = `
    .dev-model-tag {
      font-size: 0.58rem;
      font-family: 'Courier New', monospace;
      color: rgba(201,169,110,0.55);
      letter-spacing: 0.08em;
      margin-top: 0.2rem;
      padding-left: 0.15rem;
    }
    #devModelBar {
      display: none;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      padding: 0.35rem 0.6rem;
      background: rgba(0,0,0,0.12);
      border: 1px solid rgba(201,169,110,0.25);
      border-radius: 4px;
    }
    #devModelBar.visible { display: flex; }
    #devModelBar label {
      font-size: 0.58rem;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: rgba(201,169,110,0.7);
      white-space: nowrap;
      font-family: 'Lato', sans-serif;
    }
    #devModelSelect {
      flex: 1;
      background: rgba(44,24,16,0.6);
      border: 1px solid rgba(201,169,110,0.3);
      border-radius: 3px;
      color: #c9a96e;
      font-size: 0.72rem;
      font-family: 'Courier New', monospace;
      padding: 0.2rem 0.4rem;
      outline: none;
      cursor: pointer;
    }
    #devModelSelect option { background: #2c1810; color: #c9a96e; }
    #devModelBadge {
      font-size: 0.55rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #2c1810;
      background: #c9a96e;
      border-radius: 2px;
      padding: 0.1rem 0.35rem;
      white-space: nowrap;
      font-family: 'Lato', sans-serif;
    }
  `;
  document.head.appendChild(style);
})();

// ── Inject HTML devModelBar ke letterFooter ───────────────
(function injectDevModelBar() {
  function inject() {
    const footer = document.getElementById('letterFooter');
    if (!footer || document.getElementById('devModelBar')) return;

    const bar = document.createElement('div');
    bar.id = 'devModelBar';
    bar.innerHTML = `
      <label>🛠 Model</label>
      <select id="devModelSelect">
        <optgroup label="── Auto ──">
          <option value="auto" selected>auto (fallback chain)</option>
        </optgroup>
        <optgroup label="── Gemini ──">
          <option value="gemini:gemini-2.5-flash-lite">gemini-2.5-flash-lite</option>
          <option value="gemini:gemini-2.5-flash">gemini-2.5-flash</option>
        </optgroup>
        <optgroup label="── Groq ──">
          <option value="groq:llama-3.3-70b-versatile">llama-3.3-70b-versatile</option>
          <option value="groq:llama-3.1-8b-instant">llama-3.1-8b-instant</option>
          <option value="groq:meta-llama/llama-4-scout-17b-16e-instruct">llama-4-scout-17b</option>
          <option value="groq:qwen/qwen3-32b">qwen3-32b</option>
          <option value="groq:openai/gpt-oss-120b">gpt-oss-120b</option>
          <option value="groq:openai/gpt-oss-20b">gpt-oss-20b</option>
        </optgroup>
      </select>
      <span id="devModelBadge">DEV</span>
    `;
    footer.insertBefore(bar, footer.firstChild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();

// ══════════════════════════════════════════════════════════
// DIAG MESSAGE
// ══════════════════════════════════════════════════════════
function addDiagMessage(html) {
  const msgs = document.getElementById('chatMessages');
  if (!msgs) return;
  const wrap = document.createElement('div');
  wrap.style.cssText = `
    background: rgba(0,0,0,0.85);
    border: 1px solid #c9a96e55;
    border-radius: 8px;
    padding: 0.8rem 1rem;
    margin: 0.5rem 0;
    font-family: 'Courier New', monospace;
    font-size: 0.75rem;
    color: #c9a96e;
    white-space: pre-wrap;
    line-height: 1.6;
    word-break: break-all;
  `;
  wrap.innerHTML = `<span style="color:#888">🛠 DIAG</span>\n${html}`;
  msgs.appendChild(wrap);
  const ls = document.getElementById('letter-screen');
  if (ls) ls.scrollTo({ top: ls.scrollHeight, behavior: 'smooth' });
}

// ══════════════════════════════════════════════════════════
// DEVICE INFO — dikumpulkan sekali saat login
// ══════════════════════════════════════════════════════════
function getDeviceInfo() {
  const ua = navigator.userAgent;

  // Deteksi OS
  let os = 'Unknown OS';
  if (/Windows NT 10/.test(ua))      os = 'Windows 10/11';
  else if (/Windows NT 6/.test(ua))  os = 'Windows 7/8';
  else if (/Mac OS X/.test(ua))      os = 'macOS ' + (ua.match(/Mac OS X ([\d_]+)/)?.[1]?.replace(/_/g,'.') || '');
  else if (/Android ([\d.]+)/.test(ua)) os = 'Android ' + ua.match(/Android ([\d.]+)/)[1];
  else if (/iPhone OS ([\d_]+)/.test(ua)) os = 'iOS ' + ua.match(/iPhone OS ([\d_]+)/)[1].replace(/_/g,'.');
  else if (/iPad.*OS ([\d_]+)/.test(ua))  os = 'iPadOS ' + ua.match(/OS ([\d_]+)/)[1].replace(/_/g,'.');
  else if (/Linux/.test(ua))         os = 'Linux';

  // Deteksi browser
  let browser = 'Unknown Browser';
  if (/Edg\//.test(ua))             browser = 'Edge ' + (ua.match(/Edg\/([\d.]+)/)?.[1] || '');
  else if (/OPR\//.test(ua))        browser = 'Opera ' + (ua.match(/OPR\/([\d.]+)/)?.[1] || '');
  else if (/Chrome\/([\d.]+)/.test(ua) && !/Chromium/.test(ua))
                                     browser = 'Chrome ' + ua.match(/Chrome\/([\d.]+)/)[1];
  else if (/Firefox\/([\d.]+)/.test(ua)) browser = 'Firefox ' + ua.match(/Firefox\/([\d.]+)/)[1];
  else if (/Safari\/([\d.]+)/.test(ua) && !/Chrome/.test(ua))
                                     browser = 'Safari ' + (ua.match(/Version\/([\d.]+)/)?.[1] || '');

  // Deteksi brand perangkat (mobile)
  let brand = 'Desktop/Unknown';
  if (/iPhone/.test(ua))            brand = 'iPhone';
  else if (/iPad/.test(ua))         brand = 'iPad';
  else if (/Samsung/.test(ua))      brand = 'Samsung';
  else if (/Xiaomi|Redmi/.test(ua)) brand = 'Xiaomi';
  else if (/OPPO/.test(ua))         brand = 'OPPO';
  else if (/vivo/.test(ua))         brand = 'Vivo';
  else if (/Huawei/.test(ua))       brand = 'Huawei';
  else if (/Android/.test(ua))      brand = 'Android Device';

  return {
    ua,
    os,
    browser,
    brand,
    screen: `${screen.width}×${screen.height}`,
  };
}

// ══════════════════════════════════════════════════════════
// CHAT LOG — fire and forget ke /chat-log
// ══════════════════════════════════════════════════════════
function logChatToTelegram(userName, message) {
  // Haeru tidak perlu dilog
  if (userName === 'haeru damiyati') return;

  fetch(WORKER_URL + '/chat-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userName, message })
  }).catch(() => {}); // fire and forget — tidak blocking
}

// ══════════════════════════════════════════════════════════
// SEND BOT MESSAGE
// ══════════════════════════════════════════════════════════
async function sendBotMessage(isFirst = false) {
  const state = window.Birru.state;
  const ui    = window.Birru.ui;

  if (state.isBotTyping) return;
  state.isBotTyping = true;

  const typing = document.getElementById('typingIndicator');
  if (typing) typing.classList.add('visible');

  const ls = document.getElementById('letter-screen');
  if (ls) setTimeout(() => ls.scrollTo({ top: ls.scrollHeight, behavior: 'smooth' }), 100);

  try {
    const selectedModel = document.getElementById('devModelSelect')?.value || 'auto';
    const body = {
      systemPrompt: getSystemPrompt(state.currentUser),
      messages: isFirst
        ? [{ role: 'user', content: 'Aku baru saja membuka suratmu dan melihat hadiahnya. Sapa aku dengan hangat dan usil sesuai karaktermu!' }]
        : state.conversationHistory
    };
    if (isDevMode && selectedModel !== 'auto') body.forceModel = selectedModel;

    const res = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    const reply = data.text || "Maaf, Birru lagi nggak bisa balas sekarang. Coba lagi ya!";

    if (!isFirst) {
      state.conversationHistory.push({ role: 'assistant', content: reply });
    }

    if (typing) typing.classList.remove('visible');
    ui.addChatMessage('bot', reply, null, null, isDevMode ? (data.usedModel || null) : null);

  } catch (e) {
    if (typing) typing.classList.remove('visible');
    ui.addChatMessage('bot', "Aduh, koneksi Birru lagi putus-putus nih. Coba kirim lagi ya! 😅");
  }

  state.isBotTyping = false;
}

// ══════════════════════════════════════════════════════════
// HANDLE CHAT SEND
// ══════════════════════════════════════════════════════════
async function handleChatSend() {
  const state = window.Birru.state;
  const ui    = window.Birru.ui;

  const input = document.getElementById('chatInput');
  const btn   = document.getElementById('chatSendBtn');
  const text  = input.value.trim();
  if (!text || state.isBotTyping) return;

  input.value = '';
  input.style.height = 'auto';

  if (state.currentUser === 'haeru damiyati' && text.startsWith('//')) {
    ui.addChatMessage('user', text);
    await handleCheatCode(text.toLowerCase());
    return;
  }

  ui.addChatMessage('user', text);

  // ── WA redirect mode — pesan langsung ke WA bukan AI ──
  if (window._waRedirectMode) {
    window._waRedirectMode = false;
    document.getElementById('wa-mode-bar')?.classList.remove('visible');
    const input = document.getElementById('chatInput');
    if (input) input.placeholder = 'Tulis pesanmu...';
    const waUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
    ui.addChatMessage('bot', 'Pesannya sudah dibuka di WhatsApp — tinggal kirim aja, Kak. 🤍');
    return;
  }

  // Detect intent musik — handle langsung tanpa panggil API
  const musicIntent = (typeof detectMusicIntent === 'function') ? detectMusicIntent(text) : null;
  if (musicIntent) {
    await handleMusicIntent(musicIntent, text);
    return;
  }

  // Detect intent kirim pesan ke Haeru
  const waIntent = detectWaIntent(text);
  if (waIntent) {
    window._waRedirectMode = true;
    document.getElementById('wa-mode-bar')?.classList.add('visible');
    const input = document.getElementById('chatInput');
    if (input) input.placeholder = 'Tulis pesan untuk Haeru...';
    await simulateTyping('Boleh, Kak — tulis aja pesannya di bawah, nanti langsung aku terusin ke Haeru. 😄');
    return;
  }

  state.conversationHistory.push({ role: 'user', content: text });

  // Fire and forget — log pesan ke Telegram (hanya Zia & Bang Efung)
  logChatToTelegram(state.currentUser, text);

  btn.disabled = true;
  await sendBotMessage(false);
  btn.disabled = false;
}

// ══════════════════════════════════════════════════════════
// CHEAT CODES
// Tambah command baru di sini — tidak perlu edit index.html
// ══════════════════════════════════════════════════════════
async function handleCheatCode(cmd) {

  // ── //help ───────────────────────────────────────────────
  if (cmd === '//help') {
    addDiagMessage(
      `<span style="color:#fff">Cheat codes tersedia:</span>\n` +
      `  <span style="color:#6ef">  //testai</span>      → Test semua model (Gemini + Groq)\n` +
      `  <span style="color:#6ef">//testvoucher</span>  → Test endpoint /verify\n` +
      `  <span style="color:#6ef">//testnotif</span>    → Test notifikasi Telegram\n` +
      `  <span style="color:#6ef">//testformat</span>   → Test rendering markdown di bubble bot\n` +
      `  <span style="color:#6ef">//quotainfo</span>    → Cek sisa kuota Groq\n` +
      `  <span style="color:#6ef">//sysinfo</span>      → Info Worker & konfigurasi\n` +
      `  <span style="color:#6ef">//devmode</span>      → Toggle dev mode (usedModel + switcher)\n` +
      `  <span style="color:#6ef">//clearhistory</span> → Reset conversation history\n` +
      `  <span style="color:#6ef">//help</span>         → Tampilkan menu ini`
    );
    return;
  }

  // ── //testformat ──────────────────────────────────────────
  if (cmd === '//testformat') {
    const ui = window.Birru.ui;
    ui.addChatMessage('bot',
      `Ini yang aku tau:\n\n` +
      `1. **Mamah (Mursani)** — pusat dari semuanya.\n` +
      `2. **Bang Efung (Saeful Bahri)** — anak pertama, yang nikah sama Kak Ziah.\n` +
      `3. **Bang Alim (Abdul Halim)** — anak kedua, 27 tahun.\n` +
      `4. **Haeru** — anak ketiga, yang bikin aku. 23 tahun.\n` +
      `5. **Syarif** — si bungsu, 16 tahun.`
    );
    ui.addChatMessage('bot',
      `Ini teks biasa tanpa formatting — plain text yang natural. Tidak ada * atau _ disini.`
    );
    addDiagMessage(
      `<span style="color:#4f4">✓ Test format selesai.</span>\n` +
      `  Bubble 1: numbered list dengan bold nama — angka warna emas, nama tebal.\n` +
      `  Bubble 2: plain text — tidak ada formatting sama sekali.`
    );
    return;
  }

  // ── //devmode ─────────────────────────────────────────────
  if (cmd === '//devmode') {
    if (window.Birru.state.currentUser !== 'haeru damiyati') {
      addDiagMessage(`<span style="color:#f66">⛔ Akses ditolak.</span> Dev mode hanya untuk Haeru.`);
      return;
    }
    isDevMode = !isDevMode;
    const bar = document.getElementById('devModelBar');
    if (bar) bar.classList.toggle('visible', isDevMode);
    if (isDevMode) {
      addDiagMessage(
        `<span style="color:#4f4">🛠 Dev Mode ON</span>\n` +
        `  • Label usedModel muncul di bawah setiap bubble bot\n` +
        `  • Model switcher aktif di atas input chat\n` +
        `  • Pilih auto untuk fallback chain normal`
      );
    } else {
      const sel = document.getElementById('devModelSelect');
      if (sel) sel.value = 'auto';
      addDiagMessage(`<span style="color:#fa4">🛠 Dev Mode OFF</span> — Kembali ke mode normal.`);
    }
    return;
  }

  // ── //testai ──────────────────────────────────────────────
  if (cmd === '//testai') {
    addDiagMessage(`Memulai test semua model (Gemini + Groq)...\n`);
    const models = [
      'gemini-2.5-flash-lite',
      'gemini-2.5-flash',
      'groq:llama-3.3-70b-versatile',
      'groq:llama-3.1-8b-instant',
      'groq:meta-llama/llama-4-scout-17b-16e-instruct',
      'groq:qwen/qwen3-32b',
      'groq:openai/gpt-oss-120b',
      'groq:openai/gpt-oss-20b',
    ];
    for (const model of models) {
      const t0 = Date.now();
      try {
        const res = await fetch(WORKER_URL + '/testmodel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model })
        });
        const data = await res.json();
        const ms = Date.now() - t0;
        if (data.ok) {
          addDiagMessage(`<span style="color:#4f4">✓ ${model}</span>\n  Response: "${data.reply.slice(0, 60)}"\n  Waktu: ${ms}ms`);
        } else {
          addDiagMessage(`<span style="color:#f66">✗ ${model}</span>\n  Error: ${data.error || 'unknown'}\n  Waktu: ${ms}ms`);
        }
      } catch(e) {
        addDiagMessage(`<span style="color:#f66">✗ ${model}</span>\n  Gagal reach Worker: ${e.message}`);
      }
    }
    addDiagMessage(`<span style="color:#fff">Test selesai.</span>`);
    return;
  }

  // ── //testvoucher ─────────────────────────────────────────
  if (cmd === '//testvoucher') {
    addDiagMessage(`Testing /verify endpoint...`);
    const testNames = ['haeru damiyati', 'saeful bahri', 'amriah fauziah', 'nama salah'];
    for (const nama of testNames) {
      try {
        const res = await fetch(`${WORKER_URL}/verify?nama=${encodeURIComponent(nama)}`);
        const data = await res.json();
        if (data.success) {
          addDiagMessage(`<span style="color:#4f4">✓ "${nama}"</span>\n  Kode: ${data.codes.map(c => c.slice(0,4)+'****').join(', ')}`);
        } else {
          addDiagMessage(`<span style="color:#fa4">⚠ "${nama}"</span>\n  ${data.message}`);
        }
      } catch(e) {
        addDiagMessage(`<span style="color:#f66">✗ Error: ${e.message}</span>`);
      }
    }
    return;
  }

  // ── //testnotif ───────────────────────────────────────────
  if (cmd === '//testnotif') {
    addDiagMessage(`Mengirim test notifikasi Telegram...`);
    try {
      const res = await fetch(WORKER_URL + '/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName: 'haeru damiyati' })
      });
      const data = await res.json();
      if (data.ok) {
        addDiagMessage(`<span style="color:#4f4">✓ Notifikasi terkirim!</span>\n  Cek Telegram kamu.`);
      } else {
        addDiagMessage(`<span style="color:#f66">✗ Gagal: ${data.reason || 'unknown'}</span>`);
      }
    } catch(e) {
      addDiagMessage(`<span style="color:#f66">✗ Error: ${e.message}</span>`);
    }
    return;
  }

  // ── //quotainfo ───────────────────────────────────────────
  if (cmd === '//quotainfo') {
    addDiagMessage(`Mengecek kuota Groq...`);
    try {
      const res = await fetch(WORKER_URL + '/quotainfo');
      const data = await res.json();
      if (data.ok) {
        addDiagMessage(
          `<span style="color:#fff">Groq Quota Info:</span>\n` +
          `  Model    : ${data.model}\n` +
          `  Requests : ${data.requests.remaining} / ${data.requests.limit} (reset: ${data.requests.reset})\n` +
          `  Tokens   : ${data.tokens.remaining} / ${data.tokens.limit} (reset: ${data.tokens.reset})\n` +
          `  Status   : HTTP ${data.httpStatus}\n` +
          `  Waktu    : ${data.time}`
        );
      } else {
        addDiagMessage(`<span style="color:#f66">✗ Gagal: ${data.reason}</span>`);
      }
    } catch(e) {
      addDiagMessage(`<span style="color:#f66">✗ Error: ${e.message}</span>`);
    }
    return;
  }

  // ── //sysinfo ─────────────────────────────────────────────
  if (cmd === '//sysinfo') {
    addDiagMessage(`Mengambil info Worker...`);
    try {
      const res = await fetch(WORKER_URL + '/sysinfo');
      const data = await res.json();
      addDiagMessage(
        `<span style="color:#fff">Worker Info:</span>\n` +
        `  URL         : ${WORKER_URL}\n` +
        `  Gemini Key  : ${data.hasGemini   ? '<span style="color:#4f4">✓ terpasang</span>' : '<span style="color:#f66">✗ tidak ada</span>'}\n` +
        `  Groq Key    : ${data.hasGroq     ? '<span style="color:#4f4">✓ terpasang</span>' : '<span style="color:#f66">✗ tidak ada</span>'}\n` +
        `  Telegram    : ${data.hasTelegram ? '<span style="color:#4f4">✓ terpasang</span>' : '<span style="color:#f66">✗ tidak ada</span>'}\n` +
        `  Vouchers    : ${data.vouchers.map(v => `${v.name}: ${v.set ? '<span style="color:#4f4">✓</span>' : '<span style="color:#f66">✗</span>'}`).join(', ')}\n` +
        `  Timestamp   : ${data.time}`
      );
    } catch(e) {
      addDiagMessage(`<span style="color:#f66">✗ Error: ${e.message}</span>`);
    }
    return;
  }

  // ── //clearhistory ────────────────────────────────────────
  if (cmd === '//clearhistory') {
    window.Birru.state.conversationHistory.length = 0;
    addDiagMessage(`<span style="color:#4f4">✓ Conversation history direset.</span>\n  AI tidak lagi ingat percakapan sebelumnya.`);
    return;
  }

  // ── Unknown ───────────────────────────────────────────────
  addDiagMessage(`Command tidak dikenal: "${cmd}"\nKetik <span style="color:#6ef">//help</span> untuk daftar command.`);
}

// ══════════════════════════════════════════════════════════
// EXPOSE ke window — dipanggil oleh event listeners index.html
// ══════════════════════════════════════════════════════════

function detectWaIntent(text) {
  const t = text.toLowerCase();
  const keywords = [
    // eksplisit
    'kirim pesan ke haeru', 'pesan ke haeru', 'hubungi haeru',
    'chat haeru', 'wa haeru', 'whatsapp haeru',
    'bilang ke haeru', 'kasih tau haeru', 'kontak haeru',
    // natural / tidak langsung
    'mau ngomong ke haeru', 'mau ngomong sama haeru',
    'mau bilang ke haeru', 'mau bilang sama haeru',
    'mau balas ke haeru', 'mau bales ke haeru',
    'mau kirim ke haeru', 'pengen kirim ke haeru',
    'pengen bilang ke haeru', 'pengen ngomong ke haeru',
    'pengen hubungi haeru', 'pengen kontak haeru',
    'bisa hubungi haeru', 'bisa chat haeru',
    'ada cara hubungi haeru', 'ada cara kontak haeru',
    'cara hubungi haeru', 'cara kontak haeru',
    'mau nyampein ke haeru', 'mau sampaikan ke haeru',
    'titip pesan ke haeru', 'titip ke haeru',
  ];
  return keywords.some(k => t.includes(k));
}
window.BirruDev = {
  sendBotMessage,
  handleChatSend,
};
