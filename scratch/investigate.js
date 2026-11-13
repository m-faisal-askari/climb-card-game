import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function run() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "edge-debug-"));
  const port = 9251;

  // Test mobile viewport first
  const edge = spawn(edgePath, [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tmpDir}`,
    "--no-sandbox",
    "--disable-gpu",
    "--window-size=390,844",
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
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });

  await send("Console.enable");
  send("Page.enable");
  send("DOM.enable");
  ws.addEventListener("message", (ev) => {
    const d = JSON.parse(ev.data);
    if (d.method === "Console.messageAdded") {
      console.log("Console:", d.params.message.text);
    }
  });

  await send("Page.navigate", { url: "http://localhost:5173/" });
  
  // Wait until .player-hand appears
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 500));
    const check = await send("Runtime.evaluate", {
      expression: `Boolean(document.querySelector('.player-hand'))`
    });
    if (check?.result?.value) {
      console.log("Found .player-hand after", (i+1)*500, "ms");
      break;
    }
  }

  // Screenshot mobile view
  const mobileScreenshot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(
    "C:\\Users\\IT-HOME\\Downloads\\Projects\\Program Files\\Climb 0003\\climb-card-game\\scratch\\mobile_initial.png",
    Buffer.from(mobileScreenshot.data, "base64")
  );

  // Check positions of top buttons, easy mode indicator, and opponent info
  const elementsInfo = await send("Runtime.evaluate", {
    expression: `(() => {
      const topBar = document.querySelector('.top-controls-bar');
      const easyMode = document.querySelector('.easy-mode-indicator');
      const seatLeft = document.querySelector('.seat-left');
      const seatTop = document.querySelector('.seat-top');
      const seatRight = document.querySelector('.seat-right');
      const opponents = Array.from(document.querySelectorAll('.player-area')).map(el => {
        const rect = el.getBoundingClientRect();
        return {
          name: el.querySelector('.player-name')?.innerText,
          rect: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, width: rect.width, height: rect.height }
        };
      });

      const getRect = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height };
      };
      return {
        topBarRect: getRect(topBar),
        easyModeRect: getRect(easyMode),
        opponents,
      };
    })()`,
    returnByValue: true,
  });

  console.log("Mobile layout elements:", JSON.stringify(elementsInfo?.result?.value, null, 2));

  // Check card hand elements and overlap
  const cardElements = await send("Runtime.evaluate", {
    expression: `(() => {
      const wrappers = Array.from(document.querySelectorAll('.hand-card-wrapper'));
      return wrappers.map((w, idx) => {
        const card = w.querySelector('.card');
        const wRect = w.getBoundingClientRect();
        const cRect = card ? card.getBoundingClientRect() : null;
        return {
          idx,
          id: w.dataset.cardId,
          wrapperZ: window.getComputedStyle(w).zIndex,
          cardZ: card ? window.getComputedStyle(card).zIndex : null,
          cardRect: cRect ? { top: cRect.top, bottom: cRect.bottom, left: cRect.left, right: cRect.right, width: cRect.width, height: cRect.height } : null,
          wrapperRect: { top: wRect.top, bottom: wRect.bottom, left: wRect.left, right: wRect.right, width: wRect.width, height: wRect.height }
        };
      });
    })()`,
    returnByValue: true,
  });

  console.log("Cards count:", cardElements?.result?.value?.length);
  console.log("Card 0:", JSON.stringify(cardElements?.result?.value?.[0], null, 2));
  console.log("Card 1:", JSON.stringify(cardElements?.result?.value?.[1], null, 2));
  console.log("Card 2:", JSON.stringify(cardElements?.result?.value?.[2], null, 2));

  ws.close();
  edge.kill();
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (e) {}
}

run().catch(console.error);
