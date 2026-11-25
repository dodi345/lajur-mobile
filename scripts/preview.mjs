// Pratinjau app di browser laptop dengan satu perintah: `npm run preview`, lalu buka http://localhost:8090
// (Chrome: Ctrl+Shift+M untuk ukuran HP). Menyalakan:
//   1. Lajur lokal (repo money-management di sebelah repo ini, atau LAJUR_DIR) di :3000, kalau belum jalan;
//   2. proxy :8090: /api → Lajur (tanpa header browser, seperti app Android), sisanya → app;
//   3. versi web app (Expo) di :8081.
// Proxy perlu karena browser memblokir request dari :8081 langsung ke :3000 (CORS). Ctrl+C mematikan semuanya.
// Port bisa diganti: PREVIEW_PORT (8090), APP_PORT (8081), LAJUR_PORT (3000).
import { spawn } from "node:child_process";
import http from "node:http";
import net from "node:net";
import path from "node:path";

const LAJUR_DIR = process.env.LAJUR_DIR ?? path.resolve(import.meta.dirname, "../../money-management");
const PREVIEW_PORT = Number(process.env.PREVIEW_PORT ?? 8090);
const APP_PORT = Number(process.env.APP_PORT ?? 8081);
const LAJUR_PORT = Number(process.env.LAJUR_PORT ?? 3000);
const children = [];

function run(name, command, args, options) {
  const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"], ...options });
  const prefix = `[${name}] `;
  const print = (data) => process.stdout.write(String(data).replace(/^(?=.)/gm, prefix));
  child.stdout.on("data", print);
  child.stderr.on("data", print);
  children.push(child);
  return child;
}

function portOpen(port) {
  return new Promise((resolve) => {
    const socket = net.connect(port, "127.0.0.1");
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
  });
}

function startProxy() {
  const target = (url) => (url.startsWith("/api/") ? LAJUR_PORT : APP_PORT);
  const server = http.createServer((req, res) => {
    const port = target(req.url ?? "/");
    const headers = { ...req.headers, host: `localhost:${port}` };
    if (port === LAJUR_PORT) {
      // App Android tidak mengirim header browser ini; Better Auth menolak request browser tanpa Origin.
      for (const key of Object.keys(headers)) {
        if (key === "origin" || key === "cookie" || key === "referer" || key.startsWith("sec-fetch")) delete headers[key];
      }
    }
    const upstream = http.request({ host: "127.0.0.1", port, path: req.url, method: req.method, headers }, (up) => {
      res.writeHead(up.statusCode ?? 502, up.headers);
      up.pipe(res);
    });
    upstream.on("error", () => {
      res.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
      res.end(port === LAJUR_PORT ? `Lajur lokal (:${LAJUR_PORT}) belum siap.` : `App (:${APP_PORT}) belum siap, tunggu sebentar lalu muat ulang.`);
    });
    req.pipe(upstream);
  });
  // Hot reload Metro (websocket).
  server.on("upgrade", (req, socket, head) => {
    const upstream = net.connect(APP_PORT, "127.0.0.1", () => {
      const lines = Object.entries(req.headers).map(([key, value]) => `${key}: ${value}`);
      upstream.write(`${req.method} ${req.url} HTTP/1.1\r\n${lines.join("\r\n")}\r\n\r\n`);
      upstream.write(head);
      socket.pipe(upstream).pipe(socket);
    });
    upstream.on("error", () => socket.destroy());
  });
  server.listen(PREVIEW_PORT, "127.0.0.1");
  return server;
}

function stopAll() {
  for (const child of children) child.kill("SIGTERM");
  process.exit(0);
}
process.on("SIGINT", stopAll);
process.on("SIGTERM", stopAll);

if (await portOpen(PREVIEW_PORT)) {
  console.log(`Pratinjau sudah jalan: buka http://localhost:${PREVIEW_PORT}. (Port ${PREVIEW_PORT} dipakai proses lain.)`);
  process.exit(0);
}
if (await portOpen(APP_PORT)) {
  console.error(`Port ${APP_PORT} sudah dipakai (mis. "npx expo start" di terminal lain). Hentikan dulu, atau pakai APP_PORT=8082.`);
  process.exit(1);
}
if (await portOpen(LAJUR_PORT)) {
  console.log(`Lajur lokal sudah jalan di :${LAJUR_PORT}, dipakai apa adanya.`);
} else {
  console.log(`Menyalakan Lajur lokal dari ${LAJUR_DIR} …`);
  run("lajur", "npm", ["run", "dev", "--", "-p", String(LAJUR_PORT)], { cwd: LAJUR_DIR, env: process.env });
}
startProxy();
// Tanpa CI: di mode CI Metro mematikan reload, jadi perubahan kode tidak muncul.
const { CI: _ci, ...appEnv } = process.env;
run("app", "npx", ["expo", "start", "--web", "--port", String(APP_PORT)], {
  env: { ...appEnv, EXPO_PUBLIC_API_URL: `http://localhost:${PREVIEW_PORT}`, BROWSER: "none" },
});
console.log(`\nBuka http://localhost:${PREVIEW_PORT} di Chrome (Ctrl+Shift+M = ukuran HP). Ctrl+C untuk berhenti.\n`);
