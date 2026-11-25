import fs from "fs";
import http from "http";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer } from "ws";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "dist");
const port = Number(process.env.PORT) || 5175;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function getLocalIPv4s() {
  const ips = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const info of list || []) {
      if (info.family === "IPv4" && !info.internal) ips.push(info.address);
    }
  }
  return ips;
}

const server = http.createServer((req, res) => {
  const urlPath = (req.url || "/").split("?")[0];

  if (urlPath === "/api/share-info") {
    const hostHeader = req.headers.host || `localhost:${port}`;
    const p = hostHeader.includes(":") ? hostHeader.split(":")[1] : String(port);
    const ips = getLocalIPv4s();
    const urls = ips.map((ip) => `http://${ip}:${p}`);
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ urls, primaryUrl: urls[0] || `http://${hostHeader}` }));
    return;
  }

  let filePath = path.join(distDir, urlPath === "/" ? "index.html" : urlPath);
  if (!filePath.startsWith(distDir) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distDir, "index.html");
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(res);
});

const wss = new WebSocketServer({ noServer: true, maxPayload: 2 * 1024 * 1024 });

const clients = new Set();
const ornaments = new Map();
let nextNum = 1;
let currentThemeId = "christmas";

function serializeOrnament(o) {
  return {
    id: o.id,
    ownerId: o.ownerId,
    themeId: o.themeId,
    templateId: o.templateId,
    baseColor: o.baseColor,
    clipToTemplate: o.clipToTemplate,
    customShapePoints: o.customShapePoints,
    strokes: o.strokes,
    author: o.author,
    bubble: o.bubble || "",
    createdAt: o.createdAt,
    votes: o.voters ? o.voters.size : 0,
    voterIds: o.voters ? [...o.voters] : [],
  };
}

function sanitizeStrokes(rawStrokes) {
  if (!Array.isArray(rawStrokes)) return [];
  const clean = [];
  for (const s of rawStrokes.slice(0, 200)) {
    if (!s || !Array.isArray(s.points) || s.points.length === 0) continue;
    const points = [];
    for (const pt of s.points.slice(0, 600)) {
      if (Array.isArray(pt) && pt.length >= 2) {
        const x = Number(pt[0]);
        const y = Number(pt[1]);
        if (Number.isFinite(x) && Number.isFinite(y)) {
          points.push([Math.round(x * 1000) / 1000, Math.round(y * 1000) / 1000]);
        }
      }
    }
    if (points.length > 0) {
      clean.push({
        color: String(s.color || "#ffffff").slice(0, 20),
        size: Math.min(30, Math.max(1, Number(s.size) || 4)),
        points,
      });
    }
  }
  return clean;
}

function broadcast(payload, excludeWs = null) {
  const raw = JSON.stringify(payload);
  for (const client of clients) {
    if (client !== excludeWs && client.readyState === 1) client.send(raw);
  }
}

server.on("upgrade", (req, socket, head) => {
  if (!req.url || !req.url.startsWith("/ws")) {
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
});

wss.on("connection", (ws) => {
  clients.add(ws);
  ws.send(JSON.stringify({
    type: "init",
    clientCount: clients.size,
    themeId: currentThemeId,
    ornaments: [...ornaments.values()].map(serializeOrnament),
  }));
  broadcast({ type: "client_count", clientCount: clients.size }, ws);

  ws.on("message", (buf) => {
    let msg;
    try { msg = JSON.parse(buf.toString()); } catch { return; }

    if (msg.type === "submit_ornament") {
      const id = `o${nextNum++}_${Date.now().toString(36)}`;
      const customShapePoints = Array.isArray(msg.customShapePoints)
        ? msg.customShapePoints
            .slice(0, 400)
            .filter((pt) => Array.isArray(pt) && pt.length >= 2 && Number.isFinite(Number(pt[0])) && Number.isFinite(Number(pt[1])))
            .map((pt) => [Math.round(Number(pt[0]) * 1000) / 1000, Math.round(Number(pt[1]) * 1000) / 1000])
        : undefined;

      const ornament = {
        id,
        ownerId: String(msg.ownerId || "").slice(0, 64),
        themeId: String(msg.themeId || currentThemeId).slice(0, 24),
        templateId: String(msg.templateId || "stocking").slice(0, 32),
        baseColor: String(msg.baseColor || "#e63946").slice(0, 20),
        clipToTemplate: typeof msg.clipToTemplate === "boolean" ? msg.clipToTemplate : undefined,
        customShapePoints,
        strokes: sanitizeStrokes(msg.strokes),
        author: String(msg.author || "").trim().slice(0, 14),
        bubble: String(msg.bubble || "").trim().slice(0, 24),
        createdAt: Date.now(),
        voters: new Set(),
      };
      ornaments.set(id, ornament);
      broadcast({ type: "ornament_added", ornament: serializeOrnament(ornament) });
    } else if (msg.type === "toggle_vote") {
      const orn = ornaments.get(String(msg.ornamentId || ""));
      const voterId = String(msg.voterId || "").slice(0, 64);
      if (!orn || !voterId) return;
      if (orn.voters.has(voterId)) orn.voters.delete(voterId);
      else orn.voters.add(voterId);
      broadcast({ type: "vote_updated", ornamentId: orn.id, votes: orn.voters.size, voterIds: [...orn.voters] });
    } else if (msg.type === "set_theme") {
      const allowed = new Set(["christmas", "face", "animal", "party"]);
      const nextTheme = String(msg.themeId || "christmas");
      if (!allowed.has(nextTheme)) return;
      currentThemeId = nextTheme;
      if (msg.clearBoard) {
        ornaments.clear();
        nextNum = 1;
        broadcast({ type: "board_reset" });
      }
      broadcast({ type: "theme_changed", themeId: currentThemeId });
    } else if (msg.type === "nudge_ornament") {
      const id = String(msg.id || "");
      if (!ornaments.has(id)) return;
      broadcast({
        type: "ornament_nudged",
        id,
        vx: Math.max(-800, Math.min(800, Number(msg.vx) || 0)),
        vy: Math.max(-800, Math.min(800, Number(msg.vy) || 0)),
      }, ws);
    } else if (msg.type === "reset_board") {
      ornaments.clear();
      nextNum = 1;
      broadcast({ type: "board_reset" });
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    broadcast({ type: "client_count", clientCount: clients.size });
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Merry Christmas Drawing Wall server listening on http://0.0.0.0:${port}`);
});
