import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function checkViewport(width, height) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "edge-overlap-"));
  const port = 9256;

  const edge = spawn(edgePath, [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tmpDir}`,
    "--no-sandbox",
    "--disable-gpu",
    `--window-size=${width},${height}`,
    "about:blank",
  ]);

  let versionData = null;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 200));
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json`);
      versionData = await res.json();
      if (versionData && versionData.length > 0) break;
    } catch (e) {}
  }

  const page = versionData.find((t) => t.type === "page") || versionData[0];
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve) => ws.addEventListener("open", resolve));

  let id = 1;
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const curId = id++;
      const handler = (event) => {
        const data = JSON.parse(event.data);
        if (data.id === curId) {
          ws.removeEventListener("message", handler);
          resolve(data.result);
        }
      };
      ws.addEventListener("message", handler);
      ws.send(JSON.stringify({ id: curId, method, params }));
    });

  await send("Page.enable");
  await send("DOM.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 2,
    mobile: true,
    screenOrientation: { type: "portraitPrimary", angle: 0 }
  });

  await send("Page.navigate", { url: "http://localhost:5173/" });
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 400));
    const check = await send("Runtime.evaluate", {
      expression: `Boolean(document.querySelector('.player-hand'))`
    });
    if (check?.result?.value) break;
  }

  const result = await send("Runtime.evaluate", {
    expression: `(() => {
      const topBar = document.querySelector('.top-controls-bar');
      const easyMode = document.querySelector('.easy-mode-indicator');
      const opponents = Array.from(document.querySelectorAll('.player-area'));

      const getR = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height };
      };

      const intersects = (r1, r2) => {
        if (!r1 || !r2) return false;
        return !(r2.left >= r1.right || r2.right <= r1.left || r2.top >= r1.bottom || r2.bottom <= r1.top);
      };

      const topBarRect = getR(topBar);
      const easyModeRect = getR(easyMode);

      const overlaps = opponents.map(op => {
        const opRect = getR(op);
        const name = op.querySelector('.player-name')?.innerText;
        return {
          name,
          opRect,
          overlapsTopBar: intersects(opRect, topBarRect),
          overlapsEasyMode: intersects(opRect, easyModeRect),
        };
      });

      return {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        topBarRect,
        easyModeRect,
        overlaps
      };
    })()`,
    returnByValue: true
  });

  const screenshot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(
    `C:\\Users\\IT-HOME\\Downloads\\Projects\\Program Files\\Climb 0003\\climb-card-game\\scratch\\mobile_${width}x${height}.png`,
    Buffer.from(screenshot.data, "base64")
  );

  ws.close();
  edge.kill();
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (e) {}

  return result.result.value;
}

async function run() {
  console.log("Checking iPhone 12/13/14 Portrait (390x844)...");
  const p390 = await checkViewport(390, 844);
  console.log("390x844:", JSON.stringify(p390, null, 2));

  console.log("\nChecking iPhone SE Portrait (375x667)...");
  const p375 = await checkViewport(375, 667);
  console.log("375x667:", JSON.stringify(p375, null, 2));
}

run().catch(console.error);
