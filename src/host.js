import QRCode from "qrcode";
import { THEMES, getThemeById, renderOrnament } from "./templates.js";
import { isMuted, playChime, playPop, setMuted } from "./sound.js";

function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function initHostMode(wsClient) {
  const hostView = document.getElementById("host-view");
  hostView.classList.remove("hidden");

  const canvas = document.getElementById("wall-canvas");
  const ctx = canvas.getContext("2d");

  const clientCountEl = document.getElementById("host-client-count");
  const ornamentCountEl = document.getElementById("host-ornament-count");
  const wallTitleEl = document.getElementById("wall-title");
  const miniQrCard = document.getElementById("mini-qr-card");
  const miniQrCanvas = document.getElementById("mini-qr-canvas");
  const qrModal = document.getElementById("qr-modal");
  const qrCurrentThemeEl = document.getElementById("qr-current-theme");
  const btnQrChangeTheme = document.getElementById("btn-qr-change-theme");
  const largeQrCanvas = document.getElementById("large-qr-canvas");
  const qrLinkInput = document.getElementById("qr-link-input");
  const themeModal = document.getElementById("theme-modal");
  const themeGrid = document.getElementById("theme-grid");
  const chkClearOnTheme = document.getElementById("chk-clear-on-theme");
  const btnCloseTheme = document.getElementById("close-theme-modal");
  const btnShowTheme = document.getElementById("btn-show-theme");
  const btnShowQr = document.getElementById("btn-show-qr");
  const btnShowRanking = document.getElementById("btn-show-ranking");
  const btnSaveImage = document.getElementById("btn-save-image");
  const rankingModal = document.getElementById("ranking-modal");
  const btnCloseRanking = document.getElementById("close-ranking-modal");
  const rankingPodium = document.getElementById("ranking-podium");
  const rankingRest = document.getElementById("ranking-rest");
  const btnCloseQr = document.getElementById("close-qr-modal");
  const btnCopyLink = document.getElementById("btn-copy-link");
  const btnOpenDraw = document.getElementById("btn-open-draw");
  const btnSound = document.getElementById("btn-sound");
  const btnFullscreen = document.getElementById("btn-fullscreen");
  const btnReset = document.getElementById("btn-reset-board");

  let currentThemeId = "christmas";
  let shareUrl = `${window.location.origin}/draw`;
  let width = window.innerWidth;
  let height = window.innerHeight;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  const items = [];
  const revealQueue = [];
  let activeReveal = null;
  const sparkles = [];
  const snowflakes = [];

  function initSnowflakes() {
    snowflakes.length = 0;
    const count = Math.min(90, Math.max(40, Math.floor((width * height) / 22000)));
    for (let i = 0; i < count; i++) {
      snowflakes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 1.2 + Math.random() * 2.8,
        speedY: 14 + Math.random() * 28,
        speedX: (Math.random() - 0.5) * 14,
        alpha: 0.25 + Math.random() * 0.55,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    initSnowflakes();
  }

  window.addEventListener("resize", resize);
  resize();

  function buildCacheCanvas(ornament) {
    const off = document.createElement("canvas");
    const size = 260;
    off.width = size;
    off.height = size;
    const octx = off.getContext("2d");
    renderOrnament(octx, ornament, size, { drawProgress: 1 });
    return off;
  }

  function getSafeBounds() {
    const topMargin = Math.max(100, height * 0.14);
    const pad = 54;
    return {
      left: pad,
      right: width - pad,
      top: topMargin,
      bottom: height - pad,
    };
  }

  function findFreeSpot(radius) {
    const b = getSafeBounds();
    let bestX = width * 0.5;
    let bestY = (b.top + b.bottom) * 0.5;
    let bestMinDist = -1;

    for (let attempt = 0; attempt < 35; attempt++) {
      const cx = b.left + radius + Math.random() * Math.max(40, b.right - b.left - radius * 2);
      const cy = b.top + radius + Math.random() * Math.max(40, b.bottom - b.top - radius * 2);
      if (cx < 210 && cy > height - 220) continue;
      if (cx > width - 460 && cy > height - 90) continue;

      let minDist = Infinity;
      for (const it of items) {
        const dx = cx - it.x;
        const dy = cy - it.y;
        const d = Math.hypot(dx, dy) - (it.radius + radius);
        if (d < minDist) minDist = d;
      }
      if (minDist > bestMinDist) {
        bestMinDist = minDist;
        bestX = cx;
        bestY = cy;
      }
      if (minDist > 18) break;
    }
    return { x: bestX, y: bestY };
  }

  function computeItemRadius() {
    const base = Math.min(width, height);
    const countFactor = Math.max(0.45, 1 - items.length * 0.0065);
    return Math.max(26, Math.min(72, base * 0.085 * countFactor));
  }

  function addItemImmediately(ornament, pos = null) {
    if (items.some((i) => i.data.id === ornament.id)) return;
    const radius = computeItemRadius();
    const spot = pos || findFreeSpot(radius);
    items.push({
      data: ornament,
      x: spot.x,
      y: spot.y,
      vx: (Math.random() - 0.5) * 18,
      vy: (Math.random() - 0.5) * 18,
      radius,
      angle: (Math.random() - 0.5) * 0.22,
      angularVel: 0,
      phase: Math.random() * Math.PI * 2,
      wobble: 0,
      cacheCanvas: buildCacheCanvas(ornament),
    });
    updateStats();
  }

  function spawnSparkles(cx, cy, count = 26) {
    const colors = ["#ffd166", "#ffffff", "#ff758f", "#6ec1b4", "#ffe8a3"];
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
      const spd = 80 + Math.random() * 200;
      sparkles.push({
        x: cx,
        y: cy,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        life: 0,
        maxLife: 0.55 + Math.random() * 0.45,
        size: 3 + Math.random() * 4.5,
        color: colors[i % colors.length],
      });
    }
  }

  function startNextReveal(now) {
    if (activeReveal || revealQueue.length === 0) return;
    while (revealQueue.length > 20) {
      const fastOrn = revealQueue.shift();
      addItemImmediately(fastOrn);
    }
    const qLen = revealQueue.length;
    const speedMult = qLen >= 8 ? 3.8 : qLen >= 3 ? 2.2 : 1;

    const data = revealQueue.shift();
    const targetRadius = computeItemRadius();
    const spot = findFreeSpot(targetRadius);
    activeReveal = {
      data,
      startTime: now,
      targetX: spot.x,
      targetY: spot.y,
      targetRadius,
      speedMult,
      sparkled: false,
    };
    playChime();
  }

  function updateStats() {
    const total = items.length + revealQueue.length + (activeReveal ? 1 : 0);
    ornamentCountEl.textContent = `작품 ${total}개`;
  }

  async function updateQRCodes() {
    try {
      await QRCode.toCanvas(miniQrCanvas, shareUrl, {
        width: 112,
        margin: 1,
        color: { dark: "#0f382d", light: "#ffffff" },
      });
      await QRCode.toCanvas(largeQrCanvas, shareUrl, {
        width: 260,
        margin: 2,
        color: { dark: "#0f382d", light: "#ffffff" },
      });
      qrLinkInput.value = shareUrl;
    } catch {
      // ignore
    }
  }

  async function loadShareInfo() {
    const origin = window.location.origin;
    const isLocalHost =
      window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (!isLocalHost) {
      shareUrl = `${origin}/draw`;
      await updateQRCodes();
      return;
    }
    try {
      const res = await fetch("/api/share-info");
      if (res.ok) {
        const info = await res.json();
        if (info.primaryUrl) {
          shareUrl = `${info.primaryUrl}/draw`;
        }
      }
    } catch {
      // fallback
    }
    await updateQRCodes();
  }

  loadShareInfo();

  function applyTheme(themeId) {
    currentThemeId = themeId || "christmas";
    const theme = getThemeById(currentThemeId);
    wallTitleEl.textContent = theme.title;
    btnShowTheme.textContent = `🎨 주제: ${theme.name}`;
    if (qrCurrentThemeEl) qrCurrentThemeEl.textContent = theme.name;
    renderThemeGrid();
  }

  function renderThemeGrid() {
    if (!themeGrid) return;
    themeGrid.innerHTML = "";
    for (const t of THEMES) {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "theme-option-card" + (t.id === currentThemeId ? " active" : "");
      card.innerHTML = `<div class="theme-option-name">${t.name}</div><div class="theme-option-desc">${t.desc}</div>`;
      card.addEventListener("click", () => {
        const clearBoard = Boolean(chkClearOnTheme?.checked);
        wsClient.send({ type: "set_theme", themeId: t.id, clearBoard });
        applyTheme(t.id);
        themeModal.classList.add("hidden");
      });
      themeGrid.appendChild(card);
    }
  }

  applyTheme("christmas");

  btnShowTheme.addEventListener("click", () => {
    renderThemeGrid();
    themeModal.classList.remove("hidden");
  });
  btnCloseTheme.addEventListener("click", () => themeModal.classList.add("hidden"));
  themeModal.addEventListener("click", (e) => {
    if (e.target === themeModal) themeModal.classList.add("hidden");
  });
  btnQrChangeTheme?.addEventListener("click", () => {
    qrModal.classList.add("hidden");
    renderThemeGrid();
    themeModal.classList.remove("hidden");
  });

  // 미니 QR 카드 드래그 이동 + 짧은 탭 시 큰 QR 모달 열기
  let qrDragState = null;
  let qrPos = null; // { left, top }

  miniQrCard.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    miniQrCard.setPointerCapture?.(e.pointerId);
    const rect = miniQrCard.getBoundingClientRect();
    qrDragState = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origLeft: rect.left,
      origTop: rect.top,
      moved: false,
    };
  });

  miniQrCard.addEventListener("pointermove", (e) => {
    if (!qrDragState || e.pointerId !== qrDragState.pointerId) return;
    const dx = e.clientX - qrDragState.startX;
    const dy = e.clientY - qrDragState.startY;
    if (!qrDragState.moved && Math.hypot(dx, dy) > 6) {
      qrDragState.moved = true;
    }
    if (qrDragState.moved) {
      const rect = miniQrCard.getBoundingClientRect();
      const maxLeft = Math.max(8, window.innerWidth - rect.width - 8);
      const maxTop = Math.max(8, window.innerHeight - rect.height - 8);
      const nextLeft = Math.max(8, Math.min(maxLeft, qrDragState.origLeft + dx));
      const nextTop = Math.max(8, Math.min(maxTop, qrDragState.origTop + dy));
      qrPos = { left: nextLeft, top: nextTop };
      miniQrCard.style.left = `${nextLeft}px`;
      miniQrCard.style.top = `${nextTop}px`;
      miniQrCard.style.bottom = "auto";
      miniQrCard.style.right = "auto";
    }
  });

  function endQrDrag(e) {
    if (!qrDragState || e.pointerId !== qrDragState.pointerId) return;
    const wasMoved = qrDragState.moved;
    qrDragState = null;
    if (!wasMoved) {
      qrModal.classList.remove("hidden");
    }
  }
  miniQrCard.addEventListener("pointerup", endQrDrag);
  miniQrCard.addEventListener("pointercancel", endQrDrag);
  btnShowQr.addEventListener("click", () => qrModal.classList.remove("hidden"));
  btnCloseQr.addEventListener("click", () => qrModal.classList.add("hidden"));
  qrModal.addEventListener("click", (e) => {
    if (e.target === qrModal) qrModal.classList.add("hidden");
  });

  btnCopyLink.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      const old = btnCopyLink.textContent;
      btnCopyLink.textContent = "복사됨!";
      setTimeout(() => { btnCopyLink.textContent = old; }, 1500);
    } catch {
      qrLinkInput.select();
    }
  });

  btnOpenDraw.addEventListener("click", () => {
    window.open("/draw", "_blank", "noopener");
  });

  function renderRankingModal() {
    if (!rankingPodium || !rankingRest) return;
    const sorted = [...items]
      .map((it) => it.data)
      .sort((a, b) => (b.votes || 0) - (a.votes || 0) || a.createdAt - b.createdAt);

    rankingPodium.innerHTML = "";
    rankingRest.innerHTML = "";

    if (sorted.length === 0) {
      rankingPodium.innerHTML = `<p class="ranking-empty">아직 등록된 작품이 없습니다.</p>`;
      return;
    }

    const medals = ["🥇 1등", "🥈 2등", "🥉 3등"];
    sorted.slice(0, 3).forEach((orn, idx) => {
      const card = document.createElement("div");
      card.className = `podium-card rank-${idx + 1}`;
      const badge = document.createElement("div");
      badge.className = "podium-medal";
      badge.textContent = medals[idx];
      const cvs = document.createElement("canvas");
      cvs.width = 140;
      cvs.height = 140;
      renderOrnament(cvs.getContext("2d"), orn, 140, { drawProgress: 1 });
      const nameEl = document.createElement("div");
      nameEl.className = "podium-name";
      nameEl.textContent = orn.author || "익명";
      const bubbleEl = document.createElement("div");
      bubbleEl.className = "podium-bubble";
      bubbleEl.textContent = orn.bubble ? `"${orn.bubble}"` : "";
      const votesEl = document.createElement("div");
      votesEl.className = "podium-votes";
      votesEl.textContent = `❤️ ${orn.votes || 0}표`;
      card.append(badge, cvs, nameEl);
      if (orn.bubble) card.appendChild(bubbleEl);
      card.appendChild(votesEl);
      rankingPodium.appendChild(card);
    });

    sorted.slice(3, 15).forEach((orn, idx) => {
      const row = document.createElement("div");
      row.className = "ranking-row";
      row.innerHTML = `<span class="r-num">${idx + 4}위</span><span class="r-name">${orn.author || "익명"}</span><span class="r-bubble">${orn.bubble || ""}</span><span class="r-votes">❤️ ${orn.votes || 0}</span>`;
      rankingRest.appendChild(row);
    });
  }

  btnShowRanking?.addEventListener("click", () => {
    renderRankingModal();
    rankingModal.classList.remove("hidden");
  });
  btnCloseRanking?.addEventListener("click", () => rankingModal.classList.add("hidden"));
  rankingModal?.addEventListener("click", (e) => {
    if (e.target === rankingModal) rankingModal.classList.add("hidden");
  });

  btnSaveImage?.addEventListener("click", () => {
    const out = document.createElement("canvas");
    out.width = canvas.width;
    out.height = canvas.height;
    const octx = out.getContext("2d");
    octx.drawImage(canvas, 0, 0);

    const theme = getThemeById(currentThemeId);
    octx.save();
    octx.scale(dpr, dpr);
    const fontSize = Math.max(40, Math.min(74, width * 0.052));
    octx.font = `400 ${fontSize}px "Great Vibes", "Brush Script MT", cursive`;
    octx.textAlign = "center";
    octx.textBaseline = "top";
    octx.shadowColor = "rgba(0, 0, 0, 0.35)";
    octx.shadowBlur = 16;
    octx.fillStyle = "#ffffff";
    octx.fillText(theme.title, width / 2, 18);
    octx.restore();

    const link = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
    link.download = `drawing-wall-${stamp}.png`;
    link.href = out.toDataURL("image/png");
    link.click();
  });

  btnSound.addEventListener("click", () => {
    setMuted(!isMuted());
    btnSound.textContent = isMuted() ? "🔇 소리 OFF" : "🔊 소리 ON";
  });

  btnFullscreen.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  });

  btnReset.addEventListener("click", () => {
    if (confirm("보드의 모든 그림을 초기화할까요?")) {
      wsClient.send({ type: "reset_board" });
    }
  });

  const activePointers = new Map();
  function pickItemAt(px, py) {
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      if (Math.hypot(px - it.x, py - it.y) <= it.radius * 1.05) return it;
    }
    return null;
  }

  canvas.addEventListener("pointerdown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const hit = pickItemAt(px, py);
    activePointers.set(e.pointerId, { x: px, y: py, lastX: px, lastY: py, hit });
    if (hit) {
      hit.wobble = 1;
      hit.angularVel += (Math.random() - 0.5) * 3.5;
      playPop();
      spawnSparkles(hit.x, hit.y, 10);
    }
  });

  canvas.addEventListener("pointermove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const ptr = activePointers.get(e.pointerId);
    if (!ptr) return;
    const dx = px - ptr.lastX;
    const dy = py - ptr.lastY;
    ptr.lastX = px;
    ptr.lastY = py;
    for (const it of items) {
      if (Math.hypot(px - it.x, py - it.y) < it.radius * 1.35) {
        it.vx = Math.max(-520, Math.min(520, it.vx + dx * 16));
        it.vy = Math.max(-520, Math.min(520, it.vy + dy * 16));
        it.wobble = Math.max(it.wobble, 0.65);
      }
    }
  });

  function endPointer(e) {
    const ptr = activePointers.get(e.pointerId);
    if (ptr && ptr.hit) {
      wsClient.send({ type: "nudge_ornament", id: ptr.hit.data.id, vx: ptr.hit.vx, vy: ptr.hit.vy });
    }
    activePointers.delete(e.pointerId);
  }
  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);

  wsClient.onMessage((msg) => {
    if (msg.type === "init") {
      clientCountEl.textContent = `접속 ${msg.clientCount || 1}명`;
      if (msg.themeId) applyTheme(msg.themeId);
      items.length = 0;
      revealQueue.length = 0;
      activeReveal = null;
      for (const orn of msg.ornaments || []) addItemImmediately(orn);
      updateStats();
    } else if (msg.type === "theme_changed") {
      applyTheme(msg.themeId);
    } else if (msg.type === "client_count") {
      clientCountEl.textContent = `접속 ${msg.clientCount || 1}명`;
    } else if (msg.type === "ornament_added" && msg.ornament) {
      revealQueue.push(msg.ornament);
      updateStats();
    } else if (msg.type === "ornament_nudged") {
      const target = items.find((i) => i.data.id === msg.id);
      if (target) {
        target.vx = msg.vx;
        target.vy = msg.vy;
        target.wobble = 0.85;
      }
    } else if (msg.type === "vote_updated") {
      const target = items.find((i) => i.data.id === msg.ornamentId);
      if (target) {
        target.data.votes = msg.votes;
        target.data.voterIds = msg.voterIds || [];
        if (rankingModal && !rankingModal.classList.contains("hidden")) renderRankingModal();
      }
    } else if (msg.type === "board_reset") {
      items.length = 0;
      revealQueue.length = 0;
      activeReveal = null;
      updateStats();
    }
  });

  let lastTime = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    startNextReveal(now);

    ctx.save();
    ctx.scale(dpr, dpr);

    const theme = getThemeById(currentThemeId);
    const grad = ctx.createRadialGradient(width * 0.5, height * 0.35, 40, width * 0.5, height * 0.5, Math.max(width, height) * 0.78);
    grad.addColorStop(0, theme.bgTop);
    grad.addColorStop(1, theme.bgBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    for (const s of snowflakes) {
      s.y += s.speedY * dt;
      s.x += (s.speedX + Math.sin(now * 0.001 + s.phase) * 8) * dt;
      if (s.y > height + 10) { s.y = -10; s.x = Math.random() * width; }
      if (s.x < -10) s.x = width + 10;
      if (s.x > width + 10) s.x = -10;
      ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    const bounds = getSafeBounds();
    for (let i = 0; i < items.length; i++) {
      const a = items[i];
      for (let j = i + 1; j < items.length; j++) {
        const b = items[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 0.01;
        const minDist = (a.radius + b.radius) * 1.06;
        if (dist < minDist) {
          const overlap = (minDist - dist) * 0.5;
          const nx = dx / dist;
          const ny = dy / dist;
          a.x -= nx * overlap * 0.45; a.y -= ny * overlap * 0.45;
          b.x += nx * overlap * 0.45; b.y += ny * overlap * 0.45;
          a.vx -= nx * 24 * dt; a.vy -= ny * 24 * dt;
          b.vx += nx * 24 * dt; b.vy += ny * 24 * dt;
        }
      }
    }

    for (const it of items) {
      it.vx += Math.sin(now * 0.0008 + it.phase) * 7 * dt;
      it.vy += Math.cos(now * 0.0007 + it.phase * 1.3) * 7 * dt;
      it.vx *= Math.pow(0.45, dt);
      it.vy *= Math.pow(0.45, dt);
      it.x += it.vx * dt;
      it.y += it.vy * dt;

      if (it.x - it.radius < bounds.left) { it.x = bounds.left + it.radius; it.vx = Math.abs(it.vx) * 0.75 + 10; }
      else if (it.x + it.radius > bounds.right) { it.x = bounds.right - it.radius; it.vx = -Math.abs(it.vx) * 0.75 - 10; }
      if (it.y - it.radius < bounds.top) { it.y = bounds.top + it.radius; it.vy = Math.abs(it.vy) * 0.75 + 10; }
      else if (it.y + it.radius > bounds.bottom) { it.y = bounds.bottom - it.radius; it.vy = -Math.abs(it.vy) * 0.75 - 10; }

      if (it.x - it.radius < 200 && it.y + it.radius > height - 210) { it.vx += 120 * dt; it.vy -= 120 * dt; }
      if (it.x + it.radius > width - 460 && it.y + it.radius > height - 80) { it.vy -= 120 * dt; }

      it.angle += it.angularVel * dt;
      it.angularVel *= Math.pow(0.12, dt);
      it.wobble = Math.max(0, it.wobble - dt * 2.2);

      const wobbleScale = 1 + Math.sin(it.wobble * Math.PI * 4) * it.wobble * 0.14;
      const sway = Math.sin(now * 0.0016 + it.phase) * 0.06;
      const drawSize = it.radius * 2 * wobbleScale;

      ctx.save();
      ctx.translate(it.x, it.y);
      ctx.rotate(it.angle + sway);
      ctx.shadowColor = "rgba(0, 0, 0, 0.28)";
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 6;
      ctx.drawImage(it.cacheCanvas, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
      ctx.restore();

      if (it.data.bubble) {
        ctx.save();
        ctx.font = "700 12px Pretendard, sans-serif";
        const textW = ctx.measureText(it.data.bubble).width;
        const bw = Math.min(180, textW + 18);
        const bh = 24;
        const bx = it.x - bw / 2;
        const by = it.y - it.radius - 30;
        ctx.fillStyle = "rgba(255, 255, 255, 0.94)";
        ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 11);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(it.x - 5, by + bh - 1);
        ctx.lineTo(it.x + 5, by + bh - 1);
        ctx.lineTo(it.x, by + bh + 5);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#0f172a";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(it.data.bubble, it.x, by + bh / 2 + 0.5, bw - 12);
        ctx.restore();
      }

      const hasAuthor = Boolean(it.data.author);
      const votesCount = it.data.votes || 0;
      if (hasAuthor || votesCount > 0) {
        ctx.save();
        ctx.font = "700 12px Pretendard, sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
        const label = hasAuthor && votesCount > 0 ? `${it.data.author}  ❤️${votesCount}` : hasAuthor ? it.data.author : `❤️ ${votesCount}`;
        ctx.fillText(label, it.x, it.y + it.radius + 14);
        ctx.restore();
      }
    }

    if (activeReveal) {
      const elapsed = ((now - activeReveal.startTime) / 1000) * (activeReveal.speedMult || 1);
      const heroSize = Math.max(210, Math.min(370, Math.min(width, height) * 0.44));
      const cx = width * 0.5;
      const cy = height * 0.52;
      const dimAlpha = elapsed < 2.65 ? Math.min(0.45, elapsed * 1.5) : Math.max(0, 0.45 * (1 - (elapsed - 2.65) / 0.6));
      ctx.fillStyle = `rgba(6, 22, 17, ${dimAlpha})`;
      ctx.fillRect(0, 0, width, height);

      if (elapsed < 0.35) {
        const p = easeOutBack(elapsed / 0.35);
        const s = heroSize * p;
        ctx.save();
        ctx.translate(cx - s / 2, cy - s / 2);
        renderOrnament(ctx, activeReveal.data, s, { drawProgress: 0 });
        ctx.restore();
      } else if (elapsed < 2.15) {
        const drawProgress = Math.min(1, (elapsed - 0.35) / 1.75);
        ctx.save();
        ctx.translate(cx - heroSize / 2, cy - heroSize / 2);
        ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
        ctx.shadowBlur = 28;
        renderOrnament(ctx, activeReveal.data, heroSize, { drawProgress });
        ctx.restore();
      } else if (elapsed < 2.65) {
        if (!activeReveal.sparkled) { activeReveal.sparkled = true; spawnSparkles(cx, cy, 32); }
        ctx.save();
        ctx.translate(cx - heroSize / 2, cy - heroSize / 2);
        ctx.shadowColor = "rgba(255, 224, 130, 0.45)";
        ctx.shadowBlur = 32;
        renderOrnament(ctx, activeReveal.data, heroSize, { drawProgress: 1 });
        ctx.restore();
        if (activeReveal.data.author) {
          ctx.save();
          ctx.font = "700 18px Pretendard, sans-serif";
          ctx.textAlign = "center";
          ctx.fillStyle = "#fff7e0";
          ctx.fillText(`✨ ${activeReveal.data.author}`, cx, cy + heroSize * 0.56);
          ctx.restore();
        }
      } else if (elapsed < 3.25) {
        const t = easeInOutCubic((elapsed - 2.65) / 0.6);
        const curX = cx + (activeReveal.targetX - cx) * t;
        const curY = cy + (activeReveal.targetY - cy) * t;
        const targetSize = activeReveal.targetRadius * 2;
        const curSize = heroSize + (targetSize - heroSize) * t;
        ctx.save();
        ctx.translate(curX - curSize / 2, curY - curSize / 2);
        renderOrnament(ctx, activeReveal.data, curSize, { drawProgress: 1 });
        ctx.restore();
      } else {
        addItemImmediately(activeReveal.data, { x: activeReveal.targetX, y: activeReveal.targetY });
        activeReveal = null;
        updateStats();
      }
    }

    for (let i = sparkles.length - 1; i >= 0; i--) {
      const sp = sparkles[i];
      sp.life += dt;
      if (sp.life >= sp.maxLife) { sparkles.splice(i, 1); continue; }
      sp.x += sp.vx * dt; sp.y += sp.vy * dt;
      sp.vx *= Math.pow(0.25, dt); sp.vy *= Math.pow(0.25, dt);
      const alpha = 1 - sp.life / sp.maxLife;
      ctx.fillStyle = sp.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.size * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.restore();
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
