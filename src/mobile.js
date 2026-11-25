import {
  BASE_COLORS,
  BRUSH_COLORS,
  buildCustomShapePath,
  getTemplateById,
  getTemplatesForTheme,
  getThemeById,
  renderOrnament,
} from "./templates.js";
import { playDoneJingle, playPop } from "./sound.js";

const INTRO_SAMPLES = {
  face: [
    {
      templateId: "face_round",
      baseColor: "#76a9fa",
      clipToTemplate: false,
      strokes: [
        { color: "#1f2933", size: 6, points: [[0.32, 0.25], [0.34, 0.16], [0.38, 0.24], [0.43, 0.15], [0.47, 0.23], [0.52, 0.14], [0.57, 0.23], [0.62, 0.16], [0.66, 0.25]] },
        { color: "#1f2933", size: 7, points: [[0.42, 0.48], [0.42, 0.53]] },
        { color: "#1f2933", size: 7, points: [[0.58, 0.48], [0.58, 0.53]] },
        { color: "#1f2933", size: 5, points: [[0.39, 0.65], [0.5, 0.72], [0.61, 0.65]] },
      ],
    },
    {
      templateId: "face_oval",
      baseColor: "#ff7aa2",
      clipToTemplate: false,
      strokes: [
        { color: "#1f2933", size: 5, points: [[0.24, 0.62], [0.26, 0.3], [0.36, 0.2], [0.5, 0.18], [0.64, 0.2], [0.74, 0.3], [0.76, 0.62]] },
        { color: "#1f2933", size: 7, points: [[0.43, 0.48], [0.43, 0.52]] },
        { color: "#1f2933", size: 7, points: [[0.57, 0.48], [0.57, 0.52]] },
        { color: "#1f2933", size: 5, points: [[0.42, 0.65], [0.5, 0.7], [0.58, 0.65]] },
      ],
    },
    {
      templateId: "face_long",
      baseColor: "#a7e88d",
      clipToTemplate: false,
      strokes: [
        { color: "#1f2933", size: 5, points: [[0.36, 0.22], [0.38, 0.14], [0.44, 0.21], [0.5, 0.13], [0.56, 0.21], [0.62, 0.14], [0.64, 0.22]] },
        { color: "#1f2933", size: 7, points: [[0.43, 0.47], [0.43, 0.51]] },
        { color: "#1f2933", size: 7, points: [[0.57, 0.47], [0.57, 0.51]] },
        { color: "#1f2933", size: 5, points: [[0.4, 0.65], [0.5, 0.72], [0.6, 0.65]] },
      ],
    },
  ],
  christmas: [
    { templateId: "stocking", baseColor: "#e63946", clipToTemplate: true, strokes: [{ color: "#ffffff", size: 8, points: [[0.32, 0.42], [0.68, 0.42]] }] },
    { templateId: "tree", baseColor: "#2f9e73", clipToTemplate: true, strokes: [{ color: "#ffd166", size: 8, points: [[0.35, 0.5], [0.65, 0.5]] }] },
    { templateId: "snowman", baseColor: "#f4efe6", clipToTemplate: true, strokes: [{ color: "#1f2933", size: 7, points: [[0.44, 0.3], [0.44, 0.31]] }, { color: "#1f2933", size: 7, points: [[0.56, 0.3], [0.56, 0.31]] }] },
  ],
  animal: [
    { templateId: "bear", baseColor: "#c68b59", clipToTemplate: false, strokes: [{ color: "#1f2933", size: 7, points: [[0.4, 0.52], [0.4, 0.53]] }, { color: "#1f2933", size: 7, points: [[0.6, 0.52], [0.6, 0.53]] }] },
    { templateId: "bunny", baseColor: "#f4efe6", clipToTemplate: false, strokes: [{ color: "#ff758f", size: 7, points: [[0.5, 0.62], [0.5, 0.63]] }] },
    { templateId: "cat", baseColor: "#f2c14e", clipToTemplate: false, strokes: [{ color: "#1f2933", size: 6, points: [[0.4, 0.55], [0.4, 0.56]] }, { color: "#1f2933", size: 6, points: [[0.6, 0.55], [0.6, 0.56]] }] },
  ],
};

export function initMobileMode(wsClient, ownerId) {
  const mobileView = document.getElementById("mobile-view");
  mobileView.classList.remove("hidden");

  const mobileHeaderTitle = document.getElementById("mobile-header-title");
  const stepDotsWrap = document.getElementById("mobile-step-dots");
  const introPromptEl = document.getElementById("intro-prompt");
  const introPreviewCanvas = document.getElementById("intro-preview-canvas");
  const btnStartDraw = document.getElementById("btn-start-draw");

  const stepEls = {
    0: document.getElementById("step-intro"),
    1: document.getElementById("step-template"),
    2: document.getElementById("step-color"),
    25: document.getElementById("step-shape"),
    3: document.getElementById("step-draw"),
    4: document.getElementById("step-done"),
    5: document.getElementById("step-vote"),
  };

  const stepDots = document.querySelectorAll(".step-dot");
  const templateGrid = document.getElementById("template-grid");
  const colorPreviewCanvas = document.getElementById("color-preview-canvas");
  const baseColorPalette = document.getElementById("base-color-palette");
  const drawCanvas = document.getElementById("draw-canvas");
  const brushColorPalette = document.getElementById("brush-color-palette");
  const brushSizeBtns = document.querySelectorAll(".brush-size-btn");
  const authorInput = document.getElementById("author-input");
  const bubbleInput = document.getElementById("bubble-input");
  const doneCanvas = document.getElementById("done-preview-canvas");
  const btnIntroVote = document.getElementById("btn-intro-vote");
  const btnDoneVote = document.getElementById("btn-done-vote");
  const btnVoteBack = document.getElementById("btn-vote-back");
  const voteGrid = document.getElementById("vote-grid");

  const btnStep2Back = document.getElementById("btn-step2-back");
  const btnStep2Next = document.getElementById("btn-step2-next");
  const shapeCanvas = document.getElementById("shape-canvas");
  const btnShapeBack = document.getElementById("btn-shape-back");
  const btnShapeRetry = document.getElementById("btn-shape-retry");
  const btnShapeNext = document.getElementById("btn-shape-next");
  const btnStep3Back = document.getElementById("btn-step3-back");
  const btnUndo = document.getElementById("btn-undo");
  const btnClear = document.getElementById("btn-clear");
  const btnSubmit = document.getElementById("btn-submit-ornament");
  const btnDrawAnother = document.getElementById("btn-draw-another");
  const btnViewWall = document.getElementById("btn-view-wall");

  let currentThemeId = "christmas";
  let currentStep = 0;
  let selectedTemplateId = "stocking";
  let selectedBaseColor = "#e63946";
  let brushColor = "#ffffff";
  let brushSize = 7;
  let strokes = [];
  let activeStroke = null;
  let customShapePoints = [];
  let isDrawingShape = false;
  let introSampleIdx = 0;
  let boardOrnaments = [];
  let voteReturnStep = 0;
  const voteBtnMap = new Map();

  function applyTheme(themeId) {
    currentThemeId = themeId || "christmas";
    const theme = getThemeById(currentThemeId);
    mobileView.style.background = `radial-gradient(circle at 50% 15%, ${theme.bgTop}, ${theme.bgBottom} 85%)`;
    if (mobileHeaderTitle) mobileHeaderTitle.textContent = theme.title;
    if (introPromptEl) introPromptEl.textContent = theme.introPrompt;

    brushColor = currentThemeId === "christmas" ? "#ffffff" : "#1f2933";
    syncBrushColorSelection();

    const list = getTemplatesForTheme(currentThemeId);
    if (!list.some((t) => t.id === selectedTemplateId)) {
      selectedTemplateId = list[0].id;
      selectedBaseColor = list[0].defaultColor;
    }

    buildTemplateGrid();
    renderIntroPreview();
  }

  function renderIntroPreview() {
    if (!introPreviewCanvas) return;
    const samples = INTRO_SAMPLES[currentThemeId] || INTRO_SAMPLES.face;
    const sample = samples[introSampleIdx % samples.length];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = 210;
    introPreviewCanvas.style.width = `${size}px`;
    introPreviewCanvas.style.height = `${size}px`;
    introPreviewCanvas.width = size * dpr;
    introPreviewCanvas.height = size * dpr;
    const ictx = introPreviewCanvas.getContext("2d");
    ictx.save();
    ictx.scale(dpr, dpr);
    ictx.clearRect(0, 0, size, size);
    renderOrnament(ictx, sample, size, { drawProgress: 1 });
    ictx.restore();
  }

  setInterval(() => {
    if (currentStep === 0) {
      introSampleIdx += 1;
      renderIntroPreview();
    }
  }, 1500);

  function goStep(step) {
    currentStep = step;
    for (const [k, el] of Object.entries(stepEls)) {
      if (el) el.classList.toggle("hidden", Number(k) !== step);
    }
    if (stepDotsWrap) stepDotsWrap.classList.toggle("hidden", step === 0);
    stepDots.forEach((dot) => {
      const n = Number(dot.dataset.step);
      dot.classList.toggle("active", n === step);
      dot.classList.toggle("done", n < step);
    });

    if (step === 0) renderIntroPreview();
    if (step === 2) renderColorPreview();
    if (step === 25) {
      requestAnimationFrame(() => { resizeShapeCanvas(); renderShapeCanvas(); });
    }
    if (step === 3) {
      requestAnimationFrame(() => { resizeDrawCanvas(); renderDrawCanvas(); });
    }
    if (step === 4) renderDonePreview();
    if (step === 5) renderVoteGrid();
  }

  btnStartDraw?.addEventListener("click", () => { playPop(); goStep(1); });

  function buildTemplateGrid() {
    templateGrid.innerHTML = "";
    const list = getTemplatesForTheme(currentThemeId);
    for (const tpl of list) {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "template-card";
      const cvs = document.createElement("canvas");
      cvs.width = 120;
      cvs.height = 120;
      renderOrnament(cvs.getContext("2d"), { templateId: tpl.id, baseColor: tpl.defaultColor, strokes: [] }, 120);
      const label = document.createElement("span");
      label.textContent = tpl.name;
      card.append(cvs, label);
      card.addEventListener("click", () => {
        playPop();
        selectedTemplateId = tpl.id;
        selectedBaseColor = tpl.defaultColor;
        strokes = [];
        customShapePoints = [];
        syncBaseColorSelection();
        goStep(2);
      });
      templateGrid.appendChild(card);
    }
  }

  let baseCustomInput = null;
  function buildBaseColorPalette() {
    baseColorPalette.innerHTML = "";
    for (const col of BASE_COLORS) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "color-swatch";
      btn.style.backgroundColor = col.hex;
      btn.dataset.hex = col.hex;
      btn.title = col.label;
      btn.addEventListener("click", () => {
        playPop();
        selectedBaseColor = col.hex;
        syncBaseColorSelection();
        renderColorPreview();
      });
      baseColorPalette.appendChild(btn);
    }

    const customWrap = document.createElement("label");
    customWrap.className = "color-swatch custom-color-btn";
    customWrap.title = "직접 색 고르기";
    customWrap.innerHTML = `<span class="custom-plus">+</span>`;
    baseCustomInput = document.createElement("input");
    baseCustomInput.type = "color";
    baseCustomInput.value = selectedBaseColor;
    baseCustomInput.addEventListener("input", (e) => {
      selectedBaseColor = e.target.value;
      customWrap.style.background = selectedBaseColor;
      syncBaseColorSelection(true);
      renderColorPreview();
    });
    customWrap.appendChild(baseCustomInput);
    baseColorPalette.appendChild(customWrap);
  }

  function syncBaseColorSelection(isCustom = false) {
    const swatches = baseColorPalette.querySelectorAll(".color-swatch:not(.custom-color-btn)");
    let matched = false;
    swatches.forEach((el) => {
      const same = !isCustom && el.dataset.hex.toLowerCase() === selectedBaseColor.toLowerCase();
      if (same) matched = true;
      el.classList.toggle("selected", same);
    });
    const customBtn = baseColorPalette.querySelector(".custom-color-btn");
    if (customBtn) {
      customBtn.classList.toggle("selected", isCustom || !matched);
      if (baseCustomInput) baseCustomInput.value = selectedBaseColor;
    }
  }

  function renderColorPreview() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const displaySize = colorPreviewCanvas.clientWidth || 240;
    colorPreviewCanvas.width = displaySize * dpr;
    colorPreviewCanvas.height = displaySize * dpr;
    const cctx = colorPreviewCanvas.getContext("2d");
    cctx.save();
    cctx.scale(dpr, dpr);
    cctx.clearRect(0, 0, displaySize, displaySize);
    renderOrnament(cctx, { templateId: selectedTemplateId, baseColor: selectedBaseColor, strokes: [] }, displaySize);
    cctx.restore();
  }

  let brushCustomInput = null;
  function buildBrushPalette() {
    brushColorPalette.innerHTML = "";
    for (const col of BRUSH_COLORS) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "color-swatch small";
      btn.style.backgroundColor = col.hex;
      btn.dataset.hex = col.hex;
      btn.addEventListener("click", () => {
        brushColor = col.hex;
        syncBrushColorSelection();
      });
      brushColorPalette.appendChild(btn);
    }

    const customWrap = document.createElement("label");
    customWrap.className = "color-swatch small custom-color-btn";
    customWrap.title = "직접 색 고르기";
    customWrap.innerHTML = `<span class="custom-plus">+</span>`;
    brushCustomInput = document.createElement("input");
    brushCustomInput.type = "color";
    brushCustomInput.value = brushColor;
    brushCustomInput.addEventListener("input", (e) => {
      brushColor = e.target.value;
      customWrap.style.background = brushColor;
      syncBrushColorSelection(true);
    });
    customWrap.appendChild(brushCustomInput);
    brushColorPalette.appendChild(customWrap);
    syncBrushColorSelection();
  }

  function syncBrushColorSelection(isCustom = false) {
    const swatches = brushColorPalette.querySelectorAll(".color-swatch:not(.custom-color-btn)");
    let matched = false;
    swatches.forEach((el) => {
      const same = !isCustom && el.dataset.hex.toLowerCase() === brushColor.toLowerCase();
      if (same) matched = true;
      el.classList.toggle("selected", same);
    });
    const customBtn = brushColorPalette.querySelector(".custom-color-btn");
    if (customBtn) {
      customBtn.classList.toggle("selected", isCustom || !matched);
      if (brushCustomInput) brushCustomInput.value = brushColor;
    }
  }

  brushSizeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      brushSize = Number(btn.dataset.size) || 7;
      brushSizeBtns.forEach((b) => b.classList.toggle("active", b === btn));
    });
  });

  let shapeDisplaySize = 260;
  function resizeShapeCanvas() {
    if (!shapeCanvas) return;
    const rect = shapeCanvas.parentElement.getBoundingClientRect();
    shapeDisplaySize = Math.max(200, Math.min(rect.width - 16, rect.height - 16, 360));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    shapeCanvas.style.width = `${shapeDisplaySize}px`;
    shapeCanvas.style.height = `${shapeDisplaySize}px`;
    shapeCanvas.width = Math.floor(shapeDisplaySize * dpr);
    shapeCanvas.height = Math.floor(shapeDisplaySize * dpr);
  }

  function renderShapeCanvas() {
    if (!shapeCanvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const sctx = shapeCanvas.getContext("2d");
    sctx.save();
    sctx.scale(dpr, dpr);
    sctx.clearRect(0, 0, shapeDisplaySize, shapeDisplaySize);

    if (customShapePoints.length === 0) {
      sctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      sctx.lineWidth = 2;
      sctx.setLineDash([6, 6]);
      sctx.beginPath();
      sctx.arc(shapeDisplaySize / 2, shapeDisplaySize / 2, shapeDisplaySize * 0.3, 0, Math.PI * 2);
      sctx.stroke();
      sctx.setLineDash([]);
      sctx.fillStyle = "rgba(255, 255, 255, 0.78)";
      sctx.font = "700 13px Pretendard, sans-serif";
      sctx.textAlign = "center";
      sctx.fillText("여기에 얼굴 윤곽을 한 번에 그려주세요", shapeDisplaySize / 2, shapeDisplaySize / 2);
    } else if (isDrawingShape) {
      sctx.strokeStyle = selectedBaseColor;
      sctx.lineWidth = 6;
      sctx.lineCap = "round";
      sctx.lineJoin = "round";
      sctx.beginPath();
      sctx.moveTo(customShapePoints[0][0] * shapeDisplaySize, customShapePoints[0][1] * shapeDisplaySize);
      for (let i = 1; i < customShapePoints.length; i++) {
        sctx.lineTo(customShapePoints[i][0] * shapeDisplaySize, customShapePoints[i][1] * shapeDisplaySize);
      }
      sctx.stroke();
    } else if (customShapePoints.length >= 3) {
      buildCustomShapePath(sctx, customShapePoints, shapeDisplaySize);
      sctx.fillStyle = selectedBaseColor;
      sctx.fill();
    }
    sctx.restore();
  }

  function getShapeNormPoint(e) {
    const rect = shapeCanvas.getBoundingClientRect();
    return [
      Math.max(0.02, Math.min(0.98, (e.clientX - rect.left) / rect.width)),
      Math.max(0.02, Math.min(0.98, (e.clientY - rect.top) / rect.height)),
    ];
  }

  shapeCanvas?.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    shapeCanvas.setPointerCapture?.(e.pointerId);
    isDrawingShape = true;
    customShapePoints = [getShapeNormPoint(e)];
    renderShapeCanvas();
  });

  shapeCanvas?.addEventListener("pointermove", (e) => {
    if (!isDrawingShape) return;
    e.preventDefault();
    const pt = getShapeNormPoint(e);
    const prev = customShapePoints[customShapePoints.length - 1];
    if (Math.hypot(pt[0] - prev[0], pt[1] - prev[1]) > 0.012) {
      customShapePoints.push(pt);
      renderShapeCanvas();
    }
  });

  function finishShapeStroke() {
    if (!isDrawingShape) return;
    isDrawingShape = false;
    if (customShapePoints.length < 5) customShapePoints = [];
    else playPop();
    renderShapeCanvas();
  }
  shapeCanvas?.addEventListener("pointerup", finishShapeStroke);
  shapeCanvas?.addEventListener("pointercancel", finishShapeStroke);

  btnShapeBack?.addEventListener("click", () => goStep(2));
  btnShapeRetry?.addEventListener("click", () => { customShapePoints = []; renderShapeCanvas(); });
  btnShapeNext?.addEventListener("click", () => {
    if (customShapePoints.length < 5) { alert("먼저 얼굴 모양을 그려주세요!"); return; }
    playPop();
    goStep(3);
  });

  let drawDisplaySize = 260;
  function resizeDrawCanvas() {
    const rect = drawCanvas.parentElement.getBoundingClientRect();
    drawDisplaySize = Math.max(200, Math.min(rect.width - 16, rect.height - 16, 360));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    drawCanvas.style.width = `${drawDisplaySize}px`;
    drawCanvas.style.height = `${drawDisplaySize}px`;
    drawCanvas.width = Math.floor(drawDisplaySize * dpr);
    drawCanvas.height = Math.floor(drawDisplaySize * dpr);
  }

  function renderDrawCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const dctx = drawCanvas.getContext("2d");
    const tpl = getTemplateById(selectedTemplateId);
    dctx.save();
    dctx.scale(dpr, dpr);
    dctx.clearRect(0, 0, drawDisplaySize, drawDisplaySize);
    renderOrnament(
      dctx,
      {
        templateId: selectedTemplateId,
        baseColor: selectedBaseColor,
        clipToTemplate: tpl.clipToTemplate,
        customShapePoints: tpl.isCustomShape ? customShapePoints : undefined,
        strokes,
      },
      drawDisplaySize,
      { drawProgress: 1 }
    );
    dctx.restore();
  }

  function getNormPoint(e) {
    const rect = drawCanvas.getBoundingClientRect();
    return [
      Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    ];
  }

  drawCanvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    drawCanvas.setPointerCapture?.(e.pointerId);
    activeStroke = { color: brushColor, size: brushSize, points: [getNormPoint(e)] };
    strokes.push(activeStroke);
    renderDrawCanvas();
  });

  drawCanvas.addEventListener("pointermove", (e) => {
    if (!activeStroke) return;
    e.preventDefault();
    const pt = getNormPoint(e);
    const prev = activeStroke.points[activeStroke.points.length - 1];
    if (Math.hypot(pt[0] - prev[0], pt[1] - prev[1]) > 0.004) {
      activeStroke.points.push(pt);
      renderDrawCanvas();
    }
  });

  function finishStroke() { activeStroke = null; }
  drawCanvas.addEventListener("pointerup", finishStroke);
  drawCanvas.addEventListener("pointercancel", finishStroke);

  btnUndo.addEventListener("click", () => { if (strokes.length > 0) { strokes.pop(); renderDrawCanvas(); } });
  btnClear.addEventListener("click", () => { strokes = []; renderDrawCanvas(); });

  btnStep2Back.addEventListener("click", () => goStep(1));
  btnStep2Next.addEventListener("click", () => {
    playPop();
    const tpl = getTemplateById(selectedTemplateId);
    goStep(tpl.isCustomShape ? 25 : 3);
  });
  btnStep3Back.addEventListener("click", () => {
    const tpl = getTemplateById(selectedTemplateId);
    goStep(tpl.isCustomShape ? 25 : 2);
  });

  btnSubmit.addEventListener("click", () => {
    const author = (authorInput.value || "").trim().slice(0, 14);
    const bubble = (bubbleInput?.value || "").trim().slice(0, 24);
    const tpl = getTemplateById(selectedTemplateId);
    wsClient.send({
      type: "submit_ornament",
      ownerId,
      themeId: currentThemeId,
      templateId: selectedTemplateId,
      baseColor: selectedBaseColor,
      clipToTemplate: tpl.clipToTemplate,
      customShapePoints: tpl.isCustomShape ? customShapePoints : undefined,
      strokes,
      author,
      bubble,
    });
    playDoneJingle();
    goStep(4);
  });

  function renderDonePreview() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = 220;
    doneCanvas.style.width = `${size}px`;
    doneCanvas.style.height = `${size}px`;
    doneCanvas.width = size * dpr;
    doneCanvas.height = size * dpr;
    const dctx = doneCanvas.getContext("2d");
    const tpl = getTemplateById(selectedTemplateId);
    dctx.save();
    dctx.scale(dpr, dpr);
    dctx.clearRect(0, 0, size, size);
    renderOrnament(
      dctx,
      {
        templateId: selectedTemplateId,
        baseColor: selectedBaseColor,
        clipToTemplate: tpl.clipToTemplate,
        customShapePoints: tpl.isCustomShape ? customShapePoints : undefined,
        strokes,
      },
      size
    );
    dctx.restore();
  }

  btnDrawAnother.addEventListener("click", () => {
    strokes = [];
    if (bubbleInput) bubbleInput.value = "";
    goStep(1);
  });

  btnIntroVote?.addEventListener("click", () => { voteReturnStep = 0; goStep(5); });
  btnDoneVote?.addEventListener("click", () => { voteReturnStep = 4; goStep(5); });
  btnVoteBack?.addEventListener("click", () => { goStep(voteReturnStep); });

  function updateVoteButtonState(orn) {
    const btn = voteBtnMap.get(orn.id);
    if (!btn) return;
    const voted = Array.isArray(orn.voterIds) && orn.voterIds.includes(ownerId);
    btn.className = "vote-heart-btn" + (voted ? " voted" : "");
    btn.textContent = `${voted ? "❤️" : "🤍"} ${orn.votes || 0}`;
  }

  function createVoteCard(orn) {
    const card = document.createElement("div");
    card.className = "vote-card";
    const cvs = document.createElement("canvas");
    cvs.width = 140;
    cvs.height = 140;
    renderOrnament(cvs.getContext("2d"), orn, 140, { drawProgress: 1 });
    const meta = document.createElement("div");
    meta.className = "vote-meta";
    const nameEl = document.createElement("div");
    nameEl.className = "vote-author";
    nameEl.textContent = orn.author || "익명";
    meta.appendChild(nameEl);
    if (orn.bubble) {
      const bEl = document.createElement("div");
      bEl.className = "vote-bubble";
      bEl.textContent = `"${orn.bubble}"`;
      meta.appendChild(bEl);
    }
    const voteBtn = document.createElement("button");
    voteBtn.type = "button";
    voteBtnMap.set(orn.id, voteBtn);
    updateVoteButtonState(orn);
    voteBtn.addEventListener("click", () => {
      playPop();
      wsClient.send({ type: "toggle_vote", ornamentId: orn.id, voterId: ownerId });
    });
    card.append(cvs, meta, voteBtn);
    return card;
  }

  function renderVoteGrid() {
    if (!voteGrid) return;
    voteGrid.innerHTML = "";
    voteBtnMap.clear();
    if (boardOrnaments.length === 0) {
      voteGrid.innerHTML = `<p class="vote-empty">아직 보드에 올라온 그림이 없습니다.<br/>먼저 그림을 그려보세요!</p>`;
      return;
    }
    const sorted = [...boardOrnaments].sort((a, b) => (b.votes || 0) - (a.votes || 0) || b.createdAt - a.createdAt);
    for (const orn of sorted) voteGrid.appendChild(createVoteCard(orn));
  }

  btnViewWall.addEventListener("click", () => { window.location.href = "/host"; });

  window.addEventListener("resize", () => {
    if (currentStep === 2) renderColorPreview();
    if (currentStep === 3) { resizeDrawCanvas(); renderDrawCanvas(); }
  });

  wsClient.onMessage((msg) => {
    if (msg.type === "init") {
      if (msg.themeId) applyTheme(msg.themeId);
      boardOrnaments = msg.ornaments || [];
      if (currentStep === 5) renderVoteGrid();
    } else if (msg.type === "theme_changed" && msg.themeId) {
      applyTheme(msg.themeId);
    } else if (msg.type === "ornament_added" && msg.ornament) {
      if (!boardOrnaments.some((o) => o.id === msg.ornament.id)) {
        boardOrnaments.push(msg.ornament);
        if (currentStep === 5 && voteGrid) {
          const emptyMsg = voteGrid.querySelector(".vote-empty");
          if (emptyMsg) emptyMsg.remove();
          voteGrid.prepend(createVoteCard(msg.ornament));
        }
      }
    } else if (msg.type === "vote_updated") {
      const target = boardOrnaments.find((o) => o.id === msg.ornamentId);
      if (target) {
        target.votes = msg.votes;
        target.voterIds = msg.voterIds || [];
        if (currentStep === 5) updateVoteButtonState(target);
      }
    } else if (msg.type === "board_reset") {
      boardOrnaments = [];
      if (currentStep === 5) renderVoteGrid();
    }
  });

  buildBaseColorPalette();
  buildBrushPalette();
  syncBaseColorSelection();
  applyTheme("christmas");
  goStep(0);
}
