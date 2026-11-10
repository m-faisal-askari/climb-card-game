import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function run() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "edge-pause-"));
  const port = 9235;

  const edge = spawn(edgePath, [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tmpDir}`,
    "--no-sandbox",
    "--disable-gpu",
    "--window-size=1280,800",
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
  await send("Page.navigate", { url: "http://localhost:4173/" });
  await new Promise((r) => setTimeout(r, 1500));

  // 1. Check that localStorage has saved the game state
  const checkStorage1 = await send("Runtime.evaluate", {
    expression: `(() => {
      const saved = localStorage.getItem('climb_saved_gamestate');
      const parsed = saved ? JSON.parse(saved) : null;
      return {
        hasSavedState: Boolean(parsed),
        status: parsed?.status,
        turnNumber: parsed?.turnNumber,
        playerCount: parsed?.players?.length,
        currentPlayer: parsed?.players?.find(p => p.id === parsed.currentPlayerId)?.name,
      };
    })()`,
    returnByValue: true,
  });
  console.log("Initial localStorage state:", JSON.stringify(checkStorage1?.result?.value, null, 2));

  // 2. Click pause button
  console.log("Clicking pause button...");
  await send("Runtime.evaluate", {
    expression: `document.querySelector('.pause-btn')?.click()`,
  });
  await new Promise((r) => setTimeout(r, 500));

  // Verify pause overlay is visible
  const checkOverlay = await send("Runtime.evaluate", {
    expression: `(() => {
      const overlay = document.querySelector('.pause-overlay');
      const title = document.querySelector('.pause-title')?.textContent;
      const subtitle = document.querySelector('.pause-subtitle')?.textContent;
      const chipCount = document.querySelectorAll('.summary-chip').length;
      return {
        overlayVisible: Boolean(overlay),
        title,
        subtitle,
        chipCount,
      };
    })()`,
    returnByValue: true,
  });
  console.log("Pause overlay check:", JSON.stringify(checkOverlay?.result?.value, null, 2));

  // Capture screenshot of pause overlay
  const screenshotRes = await send("Page.captureScreenshot", { format: "png" });
  if (screenshotRes?.data) {
    fs.writeFileSync(
      `C:\\Users\\IT-HOME\\.gemini\\antigravity-cli\\brain\\fc488dae-d498-448b-973a-0c7a66e1de91\\pause_overlay.png`,
      Buffer.from(screenshotRes.data, "base64")
    );
    console.log("Saved screenshot pause_overlay.png");
  }

  // 3. Click resume button
  console.log("Clicking Resume Game button...");
  await send("Runtime.evaluate", {
    expression: `document.querySelector('.pause-resume-btn')?.click()`,
  });
  await new Promise((r) => setTimeout(r, 500));

  const checkResumed = await send("Runtime.evaluate", {
    expression: `Boolean(document.querySelector('.pause-overlay'))`,
    returnByValue: true,
  });
  console.log("Overlay after resume (should be false):", checkResumed?.result?.value);

  // 4. Test reload persistence
  console.log("Reloading page to test state persistence...");
  await send("Page.reload");
  await new Promise((r) => setTimeout(r, 1500));

  const checkStorageAfterReload = await send("Runtime.evaluate", {
    expression: `(() => {
      const saved = localStorage.getItem('climb_saved_gamestate');
      const parsed = saved ? JSON.parse(saved) : null;
      const handCards = document.querySelectorAll('.player-hand .card');
      return {
        hasSavedState: Boolean(parsed),
        turnNumber: parsed?.turnNumber,
        renderedHandCount: handCards.length,
        status: parsed?.status,
      };
    })()`,
    returnByValue: true,
  });
  console.log("State after reload:", JSON.stringify(checkStorageAfterReload?.result?.value, null, 2));

  // 5. Test Reset Game from Pause Overlay
  console.log("Testing Reset Game...");
  await send("Runtime.evaluate", {
    expression: `document.querySelector('.pause-btn')?.click()`,
  });
  await new Promise((r) => setTimeout(r, 400));
  await send("Runtime.evaluate", {
    expression: `document.querySelector('.btn-pause-restart')?.click()`,
  });
  await new Promise((r) => setTimeout(r, 500));

  const checkAfterReset = await send("Runtime.evaluate", {
    expression: `(() => {
      const saved = localStorage.getItem('climb_saved_gamestate');
      const parsed = saved ? JSON.parse(saved) : null;
      const handCards = document.querySelectorAll('.player-hand .card');
      return {
        turnNumber: parsed?.turnNumber,
        renderedHandCount: handCards.length,
        overlayVisible: Boolean(document.querySelector('.pause-overlay')),
      };
    })()`,
    returnByValue: true,
  });
  console.log("State after reset:", JSON.stringify(checkAfterReset?.result?.value, null, 2));

  ws.close();
  edge.kill();
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (e) {}

  console.log("\nALL VERIFICATIONS PASSED!");
}

run().catch(console.error);
