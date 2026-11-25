// 주제(테마) 및 도안 벡터 드로잉 유틸리티

export const THEMES = [
  {
    id: "christmas",
    name: "🎄 크리스마스",
    desc: "양말, 트리, 눈사람 등 크리스마스 오너먼트",
    title: "Merry Christmas",
    introPrompt: "크리스마스 방명록을 남겨주세요",
    bgTop: "#174b3d",
    bgBottom: "#0b2920",
    particle: "snow",
    clipToTemplate: true,
  },
  {
    id: "face",
    name: "😊 얼굴 그리기",
    desc: "귀여운 얼굴형에 나만의 표정과 헤어 그리기",
    title: "Draw Your Face",
    introPrompt: "당신의 얼굴을 남겨주세요",
    bgTop: "#13473e",
    bgBottom: "#0a2b25",
    particle: "sparkle",
    clipToTemplate: false,
  },
  {
    id: "animal",
    name: "🐾 동물 친구들",
    desc: "곰돌이, 토끼, 고양이 등 동물 캐릭터 꾸미기",
    title: "Animal Friends",
    introPrompt: "나만의 동물 친구를 그려주세요",
    bgTop: "#1f3a52",
    bgBottom: "#102030",
    particle: "sparkle",
    clipToTemplate: false,
  },
  {
    id: "party",
    name: "🎉 전체 자유",
    desc: "크리스마스·얼굴·동물 모든 도안을 자유롭게!",
    title: "Drawing Party",
    introPrompt: "원하는 그림을 자유롭게 남겨주세요",
    bgTop: "#2c244d",
    bgBottom: "#161229",
    particle: "confetti",
    clipToTemplate: false,
  },
];

export function getThemeById(id) {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

export const BASE_COLORS = [
  { id: "red", label: "레드", hex: "#e63946" },
  { id: "cream", label: "크림", hex: "#f4efe6" },
  { id: "yellow", label: "옐로우", hex: "#f2c14e" },
  { id: "mint", label: "민트", hex: "#6ec1b4" },
  { id: "green", label: "연두", hex: "#a7e88d" },
  { id: "pink", label: "핑크", hex: "#ff7aa2" },
  { id: "blue", label: "스카이", hex: "#76a9fa" },
  { id: "peach", label: "살구", hex: "#f7c59f" },
];

export const BRUSH_COLORS = [
  { id: "dark", hex: "#1f2933" },
  { id: "white", hex: "#ffffff" },
  { id: "red", hex: "#e63946" },
  { id: "yellow", hex: "#ffd166" },
  { id: "green", hex: "#2a9d8f" },
  { id: "pink", hex: "#ff758f" },
  { id: "blue", hex: "#4ea8de" },
];

function drawEarPair(ctx, s, leftX, rightX, y, r) {
  const k = s / 100;
  ctx.moveTo((leftX + r) * k, y * k);
  ctx.arc(leftX * k, y * k, r * k, 0, Math.PI * 2);
  ctx.moveTo((rightX + r) * k, y * k);
  ctx.arc(rightX * k, y * k, r * k, 0, Math.PI * 2);
}

// 각 도안은 100x100 정규화 좌표계 기준
export const TEMPLATES = [
  // ==================== 1. 크리스마스 테마 ====================
  {
    id: "stocking",
    theme: "christmas",
    name: "양말",
    defaultColor: "#e63946",
    clipToTemplate: true,
    buildPath(ctx, s) {
      const k = s / 100;
      ctx.beginPath();
      ctx.moveTo(32 * k, 18 * k);
      ctx.lineTo(66 * k, 18 * k);
      ctx.quadraticCurveTo(70 * k, 18 * k, 70 * k, 24 * k);
      ctx.lineTo(70 * k, 58 * k);
      ctx.quadraticCurveTo(70 * k, 74 * k, 56 * k, 82 * k);
      ctx.lineTo(36 * k, 90 * k);
      ctx.quadraticCurveTo(18 * k, 94 * k, 16 * k, 78 * k);
      ctx.quadraticCurveTo(15 * k, 64 * k, 32 * k, 60 * k);
      ctx.lineTo(36 * k, 58 * k);
      ctx.lineTo(32 * k, 24 * k);
      ctx.closePath();
    },
    drawAccents(ctx, s) {
      const k = s / 100;
      ctx.save();
      ctx.fillStyle = "rgba(255, 252, 245, 0.92)";
      ctx.beginPath();
      ctx.roundRect(27 * k, 10 * k, 46 * k, 15 * k, 7.5 * k);
      ctx.fill();
      ctx.restore();
    },
  },
  {
    id: "candy_cane",
    theme: "christmas",
    name: "지팡이",
    defaultColor: "#e63946",
    clipToTemplate: true,
    buildPath(ctx, s) {
      const k = s / 100;
      ctx.beginPath();
      ctx.moveTo(26 * k, 40 * k);
      ctx.bezierCurveTo(26 * k, 10 * k, 72 * k, 10 * k, 72 * k, 38 * k);
      ctx.lineTo(72 * k, 84 * k);
      ctx.quadraticCurveTo(72 * k, 92 * k, 62 * k, 92 * k);
      ctx.quadraticCurveTo(53 * k, 92 * k, 53 * k, 84 * k);
      ctx.lineTo(53 * k, 40 * k);
      ctx.bezierCurveTo(53 * k, 29 * k, 44 * k, 29 * k, 44 * k, 40 * k);
      ctx.quadraticCurveTo(44 * k, 48 * k, 35 * k, 48 * k);
      ctx.quadraticCurveTo(26 * k, 48 * k, 26 * k, 40 * k);
      ctx.closePath();
    },
  },
  {
    id: "tree",
    theme: "christmas",
    name: "트리",
    defaultColor: "#2f9e73",
    clipToTemplate: true,
    buildPath(ctx, s) {
      const k = s / 100;
      ctx.beginPath();
      ctx.moveTo(50 * k, 12 * k);
      ctx.lineTo(68 * k, 36 * k);
      ctx.lineTo(58 * k, 36 * k);
      ctx.lineTo(76 * k, 58 * k);
      ctx.lineTo(63 * k, 58 * k);
      ctx.lineTo(84 * k, 80 * k);
      ctx.lineTo(58 * k, 80 * k);
      ctx.lineTo(58 * k, 92 * k);
      ctx.lineTo(42 * k, 92 * k);
      ctx.lineTo(42 * k, 80 * k);
      ctx.lineTo(16 * k, 80 * k);
      ctx.lineTo(37 * k, 58 * k);
      ctx.lineTo(24 * k, 58 * k);
      ctx.lineTo(42 * k, 36 * k);
      ctx.lineTo(32 * k, 36 * k);
      ctx.closePath();
    },
    drawAccents(ctx, s) {
      const k = s / 100;
      ctx.save();
      ctx.fillStyle = "#ffd166";
      const cx = 50 * k;
      const cy = 10 * k;
      const outer = 6.5 * k;
      const inner = 3 * k;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const px = cx + Math.cos(a) * r;
        const py = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },
  },
  {
    id: "snowman",
    theme: "christmas",
    name: "눈사람",
    defaultColor: "#f4efe6",
    clipToTemplate: true,
    buildPath(ctx, s) {
      const k = s / 100;
      ctx.beginPath();
      ctx.moveTo(50 * k, 16 * k);
      ctx.bezierCurveTo(64 * k, 16 * k, 68 * k, 34 * k, 60 * k, 43 * k);
      ctx.bezierCurveTo(78 * k, 48 * k, 82 * k, 88 * k, 50 * k, 90 * k);
      ctx.bezierCurveTo(18 * k, 88 * k, 22 * k, 48 * k, 40 * k, 43 * k);
      ctx.bezierCurveTo(32 * k, 34 * k, 36 * k, 16 * k, 50 * k, 16 * k);
      ctx.closePath();
    },
    drawAccents(ctx, s) {
      const k = s / 100;
      ctx.save();
      ctx.fillStyle = "#e63946";
      ctx.beginPath();
      ctx.moveTo(35 * k, 20 * k);
      ctx.quadraticCurveTo(50 * k, 4 * k, 66 * k, 20 * k);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(33 * k, 18 * k, 34 * k, 5 * k, 2.5 * k);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(50 * k, 9 * k, 3.8 * k, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    },
  },
  {
    id: "bauble",
    theme: "christmas",
    name: "오너먼트",
    defaultColor: "#f2c14e",
    clipToTemplate: true,
    buildPath(ctx, s) {
      const k = s / 100;
      ctx.beginPath();
      ctx.arc(50 * k, 56 * k, 34 * k, 0, Math.PI * 2);
      ctx.closePath();
    },
    drawAccents(ctx, s) {
      const k = s / 100;
      ctx.save();
      ctx.fillStyle = "#ffd166";
      ctx.beginPath();
      ctx.roundRect(41 * k, 16 * k, 18 * k, 9 * k, 3 * k);
      ctx.fill();
      ctx.strokeStyle = "#ffd166";
      ctx.lineWidth = Math.max(1.5, 2.6 * k);
      ctx.beginPath();
      ctx.arc(50 * k, 12 * k, 5 * k, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    },
  },
  {
    id: "bell",
    theme: "christmas",
    name: "징글벨",
    defaultColor: "#f2c14e",
    clipToTemplate: true,
    buildPath(ctx, s) {
      const k = s / 100;
      ctx.beginPath();
      ctx.moveTo(50 * k, 18 * k);
      ctx.bezierCurveTo(68 * k, 18 * k, 72 * k, 40 * k, 76 * k, 58 * k);
      ctx.quadraticCurveTo(80 * k, 70 * k, 86 * k, 76 * k);
      ctx.lineTo(14 * k, 76 * k);
      ctx.quadraticCurveTo(20 * k, 70 * k, 24 * k, 58 * k);
      ctx.bezierCurveTo(28 * k, 40 * k, 32 * k, 18 * k, 50 * k, 18 * k);
      ctx.closePath();
    },
    drawAccents(ctx, s) {
      const k = s / 100;
      ctx.save();
      ctx.fillStyle = "#d99b26";
      ctx.beginPath();
      ctx.arc(50 * k, 80 * k, 7 * k, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffd166";
      ctx.lineWidth = Math.max(1.5, 2.8 * k);
      ctx.beginPath();
      ctx.arc(50 * k, 13 * k, 5 * k, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    },
  },
  {
    id: "gingerbread",
    theme: "christmas",
    name: "쿠키맨",
    defaultColor: "#c68b59",
    clipToTemplate: true,
    buildPath(ctx, s) {
      const k = s / 100;
      ctx.beginPath();
      ctx.moveTo(50 * k, 12 * k);
      ctx.bezierCurveTo(65 * k, 12 * k, 66 * k, 34 * k, 58 * k, 39 * k);
      ctx.lineTo(80 * k, 41 * k);
      ctx.quadraticCurveTo(88 * k, 42 * k, 88 * k, 49 * k);
      ctx.quadraticCurveTo(88 * k, 56 * k, 78 * k, 56 * k);
      ctx.lineTo(63 * k, 56 * k);
      ctx.lineTo(68 * k, 83 * k);
      ctx.quadraticCurveTo(69 * k, 92 * k, 60 * k, 92 * k);
      ctx.quadraticCurveTo(53 * k, 92 * k, 52 * k, 83 * k);
      ctx.lineTo(50 * k, 72 * k);
      ctx.lineTo(48 * k, 83 * k);
      ctx.quadraticCurveTo(47 * k, 92 * k, 40 * k, 92 * k);
      ctx.quadraticCurveTo(31 * k, 92 * k, 32 * k, 83 * k);
      ctx.lineTo(37 * k, 56 * k);
      ctx.lineTo(22 * k, 56 * k);
      ctx.quadraticCurveTo(12 * k, 56 * k, 12 * k, 49 * k);
      ctx.quadraticCurveTo(12 * k, 42 * k, 20 * k, 41 * k);
      ctx.lineTo(42 * k, 39 * k);
      ctx.bezierCurveTo(34 * k, 34 * k, 35 * k, 12 * k, 50 * k, 12 * k);
      ctx.closePath();
    },
  },
  {
    id: "gift",
    theme: "christmas",
    name: "선물상자",
    defaultColor: "#6ec1b4",
    clipToTemplate: true,
    buildPath(ctx, s) {
      const k = s / 100;
      ctx.beginPath();
      ctx.roundRect(18 * k, 30 * k, 64 * k, 58 * k, 8 * k);
      ctx.closePath();
    },
    drawAccents(ctx, s) {
      const k = s / 100;
      ctx.save();
      ctx.fillStyle = "rgba(230, 57, 70, 0.9)";
      ctx.fillRect(45 * k, 30 * k, 10 * k, 58 * k);
      ctx.fillRect(18 * k, 54 * k, 64 * k, 10 * k);
      // 리본
      ctx.strokeStyle = "#e63946";
      ctx.lineWidth = Math.max(2, 4 * k);
      ctx.beginPath();
      ctx.ellipse(40 * k, 24 * k, 10 * k, 6 * k, -0.35, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(60 * k, 24 * k, 10 * k, 6 * k, 0.35, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    },
  },

  // ==================== 2. 얼굴 그리기 테마 (첨부 이미지 기반) ====================
  {
    id: "face_round",
    theme: "face",
    name: "동글 얼굴",
    defaultColor: "#76a9fa",
    clipToTemplate: false,
    buildPath(ctx, s) {
      const k = s / 100;
      ctx.beginPath();
      drawEarPair(ctx, s, 21, 79, 54, 7.5);
      ctx.moveTo(78 * k, 54 * k);
      ctx.ellipse(50 * k, 54 * k, 28 * k, 27 * k, 0, 0, Math.PI * 2);
      ctx.closePath();
    },
  },
  {
    id: "face_oval",
    theme: "face",
    name: "계란형 얼굴",
    defaultColor: "#ff7aa2",
    clipToTemplate: false,
    buildPath(ctx, s) {
      const k = s / 100;
      ctx.beginPath();
      drawEarPair(ctx, s, 24, 76, 53, 7);
      ctx.moveTo(74 * k, 53 * k);
      ctx.ellipse(50 * k, 53 * k, 24 * k, 31 * k, 0, 0, Math.PI * 2);
      ctx.closePath();
    },
  },
  {
    id: "face_long",
    theme: "face",
    name: "긴 얼굴",
    defaultColor: "#a7e88d",
    clipToTemplate: false,
    buildPath(ctx, s) {
      const k = s / 100;
      ctx.beginPath();
      drawEarPair(ctx, s, 23, 77, 52, 8);
      ctx.roundRect(27 * k, 22 * k, 46 * k, 64 * k, 23 * k);
      ctx.closePath();
    },
  },
  {
    id: "face_chubby",
    theme: "face",
    name: "볼통통 얼굴",
    defaultColor: "#f7c59f",
    clipToTemplate: false,
    buildPath(ctx, s) {
      const k = s / 100;
      ctx.beginPath();
      drawEarPair(ctx, s, 19, 81, 52, 7.5);
      ctx.moveTo(50 * k, 24 * k);
      ctx.bezierCurveTo(70 * k, 24 * k, 74 * k, 42 * k, 76 * k, 56 * k);
      ctx.bezierCurveTo(79 * k, 74 * k, 68 * k, 84 * k, 50 * k, 84 * k);
      ctx.bezierCurveTo(32 * k, 84 * k, 21 * k, 74 * k, 24 * k, 56 * k);
      ctx.bezierCurveTo(26 * k, 42 * k, 30 * k, 24 * k, 50 * k, 24 * k);
      ctx.closePath();
    },
  },
  {
    id: "face_square",
    theme: "face",
    name: "네모 얼굴",
    defaultColor: "#f2c14e",
    clipToTemplate: false,
    buildPath(ctx, s) {
      const k = s / 100;
      ctx.beginPath();
      drawEarPair(ctx, s, 20, 80, 54, 7.5);
      ctx.roundRect(23 * k, 25 * k, 54 * k, 58 * k, 15 * k);
      ctx.closePath();
    },
  },
  {
    id: "face_free",
    theme: "face",
    name: "직접 그리기",
    defaultColor: "#f7c59f",
    clipToTemplate: false,
    isCustomShape: true,
    buildPath(ctx, s) {
      const k = s / 100;
      ctx.beginPath();
      // 부드러운 구름/물감 방울 실루엣 (자유형 상징)
      ctx.moveTo(50 * k, 18 * k);
      ctx.bezierCurveTo(72 * k, 16 * k, 84 * k, 32 * k, 80 * k, 52 * k);
      ctx.bezierCurveTo(77 * k, 72 * k, 64 * k, 84 * k, 46 * k, 82 * k);
      ctx.bezierCurveTo(24 * k, 80 * k, 16 * k, 62 * k, 20 * k, 44 * k);
      ctx.bezierCurveTo(24 * k, 26 * k, 34 * k, 20 * k, 50 * k, 18 * k);
      ctx.closePath();
    },
    drawAccents(ctx, s) {
      // 실제 customShapePoints가 그려진 후에는 연필 아이콘 표시 안 함
      const k = s / 100;
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
      ctx.lineWidth = Math.max(1.5, 2.2 * k);
      ctx.setLineDash([4 * k, 4 * k]);
      ctx.beginPath();
      ctx.arc(50 * k, 50 * k, 22 * k, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    },
  },

  // ==================== 3. 동물 친구들 테마 ====================
  {
    id: "bear",
    theme: "animal",
    name: "곰돌이",
    defaultColor: "#c68b59",
    clipToTemplate: false,
    buildPath(ctx, s) {
      const k = s / 100;
      ctx.beginPath();
      ctx.arc(28 * k, 28 * k, 11 * k, 0, Math.PI * 2);
      ctx.moveTo(83 * k, 28 * k);
      ctx.arc(72 * k, 28 * k, 11 * k, 0, Math.PI * 2);
      ctx.moveTo(81 * k, 56 * k);
      ctx.ellipse(50 * k, 56 * k, 31 * k, 28 * k, 0, 0, Math.PI * 2);
      ctx.closePath();
    },
  },
  {
    id: "bunny",
    theme: "animal",
    name: "토끼",
    defaultColor: "#f4efe6",
    clipToTemplate: false,
    buildPath(ctx, s) {
      const k = s / 100;
      ctx.beginPath();
      ctx.ellipse(37 * k, 26 * k, 8 * k, 20 * k, -0.1, 0, Math.PI * 2);
      ctx.moveTo(71 * k, 26 * k);
      ctx.ellipse(63 * k, 26 * k, 8 * k, 20 * k, 0.1, 0, Math.PI * 2);
      ctx.moveTo(78 * k, 62 * k);
      ctx.ellipse(50 * k, 62 * k, 28 * k, 24 * k, 0, 0, Math.PI * 2);
      ctx.closePath();
    },
  },
  {
    id: "cat",
    theme: "animal",
    name: "고양이",
    defaultColor: "#f2c14e",
    clipToTemplate: false,
    buildPath(ctx, s) {
      const k = s / 100;
      ctx.beginPath();
      ctx.moveTo(22 * k, 52 * k);
      ctx.lineTo(24 * k, 20 * k);
      ctx.lineTo(42 * k, 35 * k);
      ctx.quadraticCurveTo(50 * k, 33 * k, 58 * k, 35 * k);
      ctx.lineTo(76 * k, 20 * k);
      ctx.lineTo(78 * k, 52 * k);
      ctx.bezierCurveTo(82 * k, 74 * k, 68 * k, 84 * k, 50 * k, 84 * k);
      ctx.bezierCurveTo(32 * k, 84 * k, 18 * k, 74 * k, 22 * k, 52 * k);
      ctx.closePath();
    },
  },
  {
    id: "puppy",
    theme: "animal",
    name: "강아지",
    defaultColor: "#f7c59f",
    clipToTemplate: false,
    buildPath(ctx, s) {
      const k = s / 100;
      ctx.beginPath();
      ctx.ellipse(21 * k, 52 * k, 9 * k, 19 * k, 0.2, 0, Math.PI * 2);
      ctx.moveTo(88 * k, 52 * k);
      ctx.ellipse(79 * k, 52 * k, 9 * k, 19 * k, -0.2, 0, Math.PI * 2);
      ctx.moveTo(77 * k, 54 * k);
      ctx.ellipse(50 * k, 54 * k, 27 * k, 26 * k, 0, 0, Math.PI * 2);
      ctx.closePath();
    },
  },
  {
    id: "chick",
    theme: "animal",
    name: "병아리",
    defaultColor: "#ffd166",
    clipToTemplate: false,
    buildPath(ctx, s) {
      const k = s / 100;
      ctx.beginPath();
      ctx.arc(50 * k, 56 * k, 30 * k, 0, Math.PI * 2);
      ctx.closePath();
    },
  },
  {
    id: "frog",
    theme: "animal",
    name: "개구리",
    defaultColor: "#a7e88d",
    clipToTemplate: false,
    buildPath(ctx, s) {
      const k = s / 100;
      ctx.beginPath();
      ctx.arc(33 * k, 33 * k, 11 * k, 0, Math.PI * 2);
      ctx.moveTo(78 * k, 33 * k);
      ctx.arc(67 * k, 33 * k, 11 * k, 0, Math.PI * 2);
      ctx.moveTo(82 * k, 58 * k);
      ctx.ellipse(50 * k, 58 * k, 32 * k, 24 * k, 0, 0, Math.PI * 2);
      ctx.closePath();
    },
  },
];

export function getTemplatesForTheme(themeId) {
  if (!themeId || themeId === "party") return TEMPLATES;
  const list = TEMPLATES.filter((t) => t.theme === themeId);
  return list.length > 0 ? list : TEMPLATES;
}

export function getTemplatesForThemes(themeIds) {
  if (!Array.isArray(themeIds) || themeIds.length === 0) return TEMPLATES;
  if (themeIds.includes("party")) return TEMPLATES;
  const set = new Set(themeIds);
  const list = TEMPLATES.filter((t) => set.has(t.theme));
  return list.length > 0 ? list : TEMPLATES;
}

export function resolveThemeDisplay(themeIds) {
  const ids = Array.isArray(themeIds) && themeIds.length > 0 ? themeIds : ["christmas"];
  if (ids.length === 1) {
    return getThemeById(ids[0]);
  }
  const names = ids.map((id) => getThemeById(id).name).join(" + ");
  const hasChristmas = ids.includes("christmas");
  return {
    id: "mixed",
    name: ids.length >= 3 ? "🎉 전체 주제" : names,
    title: hasChristmas ? "Merry Christmas" : "Drawing Party",
    introPrompt: "방명록에 나만의 그림을 남겨주세요 ✨",
    bgTop: hasChristmas ? "#174b3d" : "#2c244d",
    bgBottom: hasChristmas ? "#0b2920" : "#161229",
  };
}

export function getTemplateById(id) {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
}

export function buildCustomShapePath(ctx, points, size) {
  if (!points || points.length < 3) return false;
  ctx.beginPath();
  ctx.moveTo(points[0][0] * size, points[0][1] * size);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i][0] * size, points[i][1] * size);
  }
  ctx.closePath();
  return true;
}

/**
 * 도안 + 사용자 획(strokes)을 캔버스 (0,0) ~ (size,size) 영역에 렌더링.
 */
export function renderOrnament(ctx, ornament, size, options = {}) {
  const { drawProgress = 1 } = options;

  const tpl = getTemplateById(ornament.templateId);
  const baseColor = ornament.baseColor || tpl.defaultColor;
  const strokes = ornament.strokes || [];
  const customShape = ornament.customShapePoints;
  const hasCustomShape = Array.isArray(customShape) && customShape.length >= 3;
  const shouldClip =
    typeof options.clipToTemplate === "boolean"
      ? options.clipToTemplate
      : typeof ornament.clipToTemplate === "boolean"
        ? ornament.clipToTemplate
        : Boolean(tpl.clipToTemplate);

  ctx.save();

  // 1. 도안 본체 채우기 (직접 그린 얼굴형 또는 기본 도안)
  if (hasCustomShape) {
    buildCustomShapePath(ctx, customShape, size);
    ctx.fillStyle = baseColor;
    ctx.fill();
  } else {
    tpl.buildPath(ctx, size);
    ctx.fillStyle = baseColor;
    ctx.fill();
  }

  // 2. 사용자 획 그리기
  if (strokes.length > 0 && drawProgress > 0) {
    ctx.save();
    if (shouldClip) {
      if (hasCustomShape) buildCustomShapePath(ctx, customShape, size);
      else tpl.buildPath(ctx, size);
      ctx.clip();
    }

    let totalSegments = 0;
    for (const s of strokes) {
      totalSegments += Math.max(1, (s.points?.length || 1) - 1);
    }
    const maxSeg = drawProgress >= 1 ? Infinity : totalSegments * drawProgress;
    let drawnSeg = 0;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const s of strokes) {
      const pts = s.points;
      if (!pts || pts.length === 0) continue;
      if (drawnSeg >= maxSeg) break;

      ctx.strokeStyle = s.color || "#ffffff";
      ctx.fillStyle = s.color || "#ffffff";
      ctx.lineWidth = (s.size || 4) * (size / 260);

      if (pts.length === 1) {
        ctx.beginPath();
        ctx.arc(pts[0][0] * size, pts[0][1] * size, ctx.lineWidth * 0.5, 0, Math.PI * 2);
        ctx.fill();
        drawnSeg += 1;
        continue;
      }

      ctx.beginPath();
      ctx.moveTo(pts[0][0] * size, pts[0][1] * size);
      for (let i = 1; i < pts.length; i++) {
        if (drawnSeg + 1 <= maxSeg) {
          ctx.lineTo(pts[i][0] * size, pts[i][1] * size);
          drawnSeg += 1;
        } else {
          const frac = Math.max(0, maxSeg - drawnSeg);
          const x = pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * frac;
          const y = pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * frac;
          ctx.lineTo(x * size, y * size);
          drawnSeg = maxSeg;
          break;
        }
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  // 3. 도안 위 장식 (직접 그린 얼굴형이 없을 때만)
  if (!hasCustomShape && typeof tpl.drawAccents === "function") {
    tpl.drawAccents(ctx, size);
  }

  ctx.restore();
}
