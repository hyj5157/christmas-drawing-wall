import os from "os";
import { defineConfig } from "vite";
import { WebSocketServer } from "ws";

function getLocalIPv4s() {
  const ips = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const info of list || []) {
      if (info.family === "IPv4" && !info.internal) {
        ips.push(info.address);
      }
    }
  }
  return ips;
}

function attachShareEndpoint(middlewares) {
  if (!middlewares) return;
  middlewares.use("/api/share-info", (req, res) => {
    const hostHeader = req.headers.host || "localhost:5175";
    const port = hostHeader.includes(":") ? hostHeader.split(":")[1] : "5175";
    const ips = getLocalIPv4s();
    const urls = ips.map((ip) => `http://${ip}:${port}`);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ urls, primaryUrl: urls[0] || `http://${hostHeader}` }));
  });
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

function attachChristmasWallWS(httpServer) {
  if (!httpServer || httpServer.__christmasWallWssAttached) return;
  httpServer.__christmasWallWssAttached = true;

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

  function broadcast(payload, excludeWs = null) {
    const raw = JSON.stringify(payload);
    for (const client of clients) {
      if (client !== excludeWs && client.readyState === 1) client.send(raw);
    }
  }

  httpServer.on("upgrade", (req, socket, head) => {
    if (!req.url || !req.url.startsWith("/ws")) return;
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
  });

  wss.on("connection", (ws) => {
    clients.add(ws);
    ws.send(JSON.stringify({ type: "init", clientCount: clients.size, themeId: currentThemeId, ornaments: [...ornaments.values()].map(serializeOrnament) }));
    broadcast({ type: "client_count", clientCount: clients.size }, ws);

    ws.on("message", (buf) => {
      let msg;
      try { msg = JSON.parse(buf.toString()); } catch { return; }

      if (msg.type === "submit_ornament") {
        const id = `o${nextNum++}_${Date.now().toString(36)}`;
        const ornament = {
          id,
          ownerId: String(msg.ownerId || "").slice(0, 64),
          themeId: String(msg.themeId || currentThemeId).slice(0, 24),
          templateId: String(msg.templateId || "stocking").slice(0, 32),
          baseColor: String(msg.baseColor || "#e63946").slice(0, 20),
          clipToTemplate: typeof msg.clipToTemplate === "boolean" ? msg.clipToTemplate : undefined,
          customShapePoints: Array.isArray(msg.customShapePoints) ? msg.customShapePoints.slice(0, 400) : undefined,
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
        if (!allowed.has(String(msg.themeId))) return;
        currentThemeId = String(msg.themeId);
        if (msg.clearBoard) { ornaments.clear(); nextNum = 1; broadcast({ type: "board_reset" }); }
        broadcast({ type: "theme_changed", themeId: currentThemeId });
      } else if (msg.type === "nudge_ornament") {
        const id = String(msg.id || "");
        if (!ornaments.has(id)) return;
        broadcast({ type: "ornament_nudged", id, vx: Number(msg.vx) || 0, vy: Number(msg.vy) || 0 }, ws);
      } else if (msg.type === "reset_board") {
        ornaments.clear(); nextNum = 1;
        broadcast({ type: "board_reset" });
      }
    });

    ws.on("close", () => {
      clients.delete(ws);
      broadcast({ type: "client_count", clientCount: clients.size });
    });
  });
}

export default defineConfig({
  server: { host: true, port: 5175, allowedHosts: true },
  plugins: [
    {
      name: "christmas-wall-ws-plugin",
      configureServer(server) { attachShareEndpoint(server.middlewares); attachChristmasWallWS(server.httpServer); },
      configurePreviewServer(server) { attachShareEndpoint(server.middlewares); attachChristmasWallWS(server.httpServer); },
    },
  ],
});
