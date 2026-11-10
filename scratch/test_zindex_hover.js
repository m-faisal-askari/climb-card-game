import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function run() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "edge-zindex-"));
  const port = 9250;

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
  await send("DOM.enable");
  await send("Page.navigate", { url: "http://localhost:4173/" });
  await new Promise((r) => setTimeout(r, 1500));

  // Reset any previous state so we start fresh
  await send("Runtime.evaluate", {
    expression: `(() => {
      localStorage.clear();
      window.location.reload();
    })()`,
  });
  await new Promise((r) => setTimeout(r, 1500));

  // Step 1: Select Card at index 2 (third card)
  console.log("Step 1: Selecting Card at index 2...");
  await send("Runtime.evaluate", {
    expression: `(() => {
      const cards = document.querySelectorAll('.player-hand .card');
      if (cards[2]) cards[2].click();
    })()`,
  });
  await new Promise((r) => setTimeout(r, 300));

  const card2State = await send("Runtime.evaluate", {
    expression: `(() => {
      const wrappers = document.querySelectorAll('.hand-card-wrapper');
      return {
        card2Selected: wrappers[2]?.classList.contains('is-selected'),
        card2WrapperZIndex: window.getComputedStyle(wrappers[2]).zIndex,
      };
    })()`,
    returnByValue: true,
  });
  console.log("Card 2 State after select:", JSON.stringify(card2State?.result?.value, null, 2));

  // Step 2: Hover over Card at index 1 (second card, behind selected Card 2)
  console.log("Step 2: Hovering Card at index 1 using real mouse move via CDP...");
  const card1Coords = await send("Runtime.evaluate", {
    expression: `(() => {
      const cards = document.querySelectorAll('.player-hand .card');
      const card1 = cards[1];
      if (!card1) return null;
      const rect = card1.getBoundingClientRect();
      // Click/hover on the left-center portion of card 1 which is not overlapped
      return {
        x: Math.round(rect.left + rect.width * 0.25),
        y: Math.round(rect.top + rect.height * 0.5)
      };
    })()`,
    returnByValue: true,
  });

  const { x, y } = card1Coords.result.value;
  console.log(`Moving mouse to Card 1 at coordinates (${x}, ${y})...`);

  await send("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x,
    y,
  });
  await new Promise((r) => setTimeout(r, 400));

  const hoverZIndexState = await send("Runtime.evaluate", {
    expression: `(() => {
      const wrappers = document.querySelectorAll('.hand-card-wrapper');
      const cards = document.querySelectorAll('.player-hand .card');
      const card1Wrapper = wrappers[1];
      const card2Wrapper = wrappers[2];
      const card1Z = Number(window.getComputedStyle(card1Wrapper).zIndex);
      const card2Z = Number(window.getComputedStyle(card2Wrapper).zIndex);

      return {
        card1HoveredWrapperZIndex: window.getComputedStyle(card1Wrapper).zIndex,
        card1HoveredButtonZIndex: window.getComputedStyle(cards[1]).zIndex,
        card1IsHoveredClass: card1Wrapper.classList.contains('is-hovered'),
        card2WrapperZIndex: window.getComputedStyle(card2Wrapper).zIndex,
        card1IsHigherThanCard2: card1Z > card2Z,
      };
    })()`,
    returnByValue: true,
  });
  console.log("Z-Index during hover:", JSON.stringify(hoverZIndexState?.result?.value, null, 2));

  // Capture screenshot showing Card 1 hovering in front of selected Card 2
  const screenshotRes = await send("Page.captureScreenshot", { format: "png" });
  if (screenshotRes?.data) {
    fs.writeFileSync(
      `C:\\Users\\IT-HOME\\.gemini\\antigravity-cli\\brain\\fc488dae-d498-448b-973a-0c7a66e1de91\\card_hover_front.png`,
      Buffer.from(screenshotRes.data, "base64")
    );
    console.log("Saved screenshot card_hover_front.png");
  }

  // Step 3: Click Card 1 while hovered to select it too
  console.log("Step 3: Clicking Card at index 1 using CDP mouse press...");
  await send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x,
    y,
    button: "left",
    clickCount: 1,
  });
  await new Promise((r) => setTimeout(r, 50));
  await send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x,
    y,
    button: "left",
    clickCount: 1,
  });
  await new Promise((r) => setTimeout(r, 400));

  const bothSelectedState = await send("Runtime.evaluate", {
    expression: `(() => {
      const wrappers = document.querySelectorAll('.hand-card-wrapper');
      return {
        card1Selected: wrappers[1]?.classList.contains('is-selected'),
        card2Selected: wrappers[2]?.classList.contains('is-selected'),
        selectedCount: document.querySelectorAll('.hand-card-wrapper.is-selected').length,
      };
    })()`,
    returnByValue: true,
  });
  console.log("State after selecting Card 1 too:", JSON.stringify(bothSelectedState?.result?.value, null, 2));

  ws.close();
  edge.kill();
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (e) {}

  if (hoverZIndexState?.result?.value?.card1IsHigherThanCard2 && bothSelectedState?.result?.value?.card1Selected) {
    console.log("SUCCESS: Card 1 hovered in front of Card 2 and was successfully selected!");
  } else {
    throw new Error("Verification failed: hover z-index or multi-select not satisfied.");
  }
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
