// Pratinjau app di browser laptop dengan satu perintah: `npm run preview`, lalu buka http://localhost:8090
// (Chrome: Ctrl+Shift+M untuk ukuran HP). Menyalakan:
//   1. Lajur lokal (repo money-management di sebelah repo ini, atau LAJUR_DIR) di :3000, kalau belum jalan;
//   2. proxy :8090: /api → Lajur (tanpa header browser, seperti app Android), sisanya → app;
//   3. versi web app (Expo) di :8081.
// Proxy perlu karena browser memblokir request dari :8081 langsung ke :3000 (CORS). Ctrl+C mematikan semuanya.
import { spawn } from "node:child_process";
import http from "node:http";
import net from "node:net";
import path from "node:path";

const LAJUR_DIR = process.env.LAJUR_DIR ?? path.resolve(import.meta.dirname, "../../money-management");
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
  const target = (url) => (url.startsWith("/api/") ? 3000 : 8081);
  const server = http.createServer((req, res) => {
    const port = target(req.url ?? "/");
    const headers = { ...req.headers, host: `localhost:${port}` };
    if (port === 3000) {
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
      res.end(port === 3000 ? "Lajur lokal (:3000) belum siap." : "App (:8081) belum siap, tunggu sebentar lalu muat ulang.");
    });
    req.pipe(upstream);
  });
  // Hot reload Metro (websocket).
  server.on("upgrade", (req, socket, head) => {
    const upstream = net.connect(8081, "127.0.0.1", () => {
      const lines = Object.entries(req.headers).map(([key, value]) => `${key}: ${value}`);
      upstream.write(`${req.method} ${req.url} HTTP/1.1\r\n${lines.join("\r\n")}\r\n\r\n`);
      upstream.write(head);
      socket.pipe(upstream).pipe(socket);
    });
    upstream.on("error", () => socket.destroy());
  });
  server.listen(8090, "127.0.0.1");
  return server;
}

function stopAll() {
  for (const child of children) child.kill("SIGTERM");
  process.exit(0);
}
process.on("SIGINT", stopAll);
process.on("SIGTERM", stopAll);

if (await portOpen(3000)) {
  console.log("Lajur lokal sudah jalan di :3000, dipakai apa adanya.");
} else {
  console.log(`Menyalakan Lajur lokal dari ${LAJUR_DIR} …`);
  run("lajur", "npm", ["run", "dev"], { cwd: LAJUR_DIR, env: process.env });
}
startProxy();
run("app", "npx", ["expo", "start", "--web", "--port", "8081", "--clear"], {
  env: { ...process.env, EXPO_PUBLIC_API_URL: "http://localhost:8090", CI: "1", BROWSER: "none" },
});
console.log("\nBuka http://localhost:8090 di Chrome (Ctrl+Shift+M = ukuran HP). Ctrl+C untuk berhenti.\n");
