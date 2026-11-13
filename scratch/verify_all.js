import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function run() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "edge-verify-"));
  const port = 9265;

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

  // Ensure human turn
  await send("Runtime.evaluate", {
    expression: `(() => {
      const saved = JSON.parse(localStorage.getItem('climb_saved_gamestate') || '{}');
      if (saved && saved.players) {
        const human = saved.players.find(p => p.type === 'human');
        if (human) {
          saved.currentPlayerId = human.id;
          localStorage.setItem('climb_saved_gamestate', JSON.stringify(saved));
          window.location.reload();
        }
      }
    })()`
  });
  await new Promise((r) => setTimeout(r, 1200));

  console.log("1. Verifying Mobile Top Buttons do NOT overlap opponent info...");
  const overlapCheck = await send("Runtime.evaluate", {
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

      return opponents.map(op => {
        const opRect = getR(op);
        const name = op.querySelector('.player-name')?.innerText;
        return {
          name,
          overlapsTopBar: intersects(opRect, topBarRect),
          overlapsEasyMode: intersects(opRect, easyModeRect),
        };
      });
    })()`,
    returnByValue: true
  });
  console.log("Overlap Check Result:", JSON.stringify(overlapCheck.result.value, null, 2));

  console.log("\n2. Verifying Touch Selection of Adjacent/Overlapping Cards in Hand...");
  // Let's test clicking Card 3 by tapping its exposed surface
  const tapCard = async (cardIndex) => {
    return await send("Runtime.evaluate", {
      expression: `(() => {
        const wrappers = Array.from(document.querySelectorAll('.player-hand .hand-card-wrapper'));
        const nextWrapper = wrappers[${cardIndex} + 1];
        const thisWrapper = wrappers[${cardIndex}];
        const thisCard = thisWrapper.querySelector('.card');
        const nextCard = nextWrapper ? nextWrapper.querySelector('.card') : null;

        const thisR = thisCard.getBoundingClientRect();
        const nextR = nextCard ? nextCard.getBoundingClientRect() : null;

        // The exposed tap point is between thisCard.left and nextCard.left (or right edge if last card)
        const exposedRight = nextR ? nextR.left : thisR.right;
        const tapX = thisR.left + Math.max(8, (exposedRight - thisR.left) / 2);
        const tapY = thisR.top + thisR.height / 2;

        const el = document.elementFromPoint(tapX, tapY);
        if (el) {
          el.click();
        }
        return {
          cardIndex: ${cardIndex},
          tapPoint: { x: tapX, y: tapY },
          hitElement: el ? el.tagName + '.' + el.className : null,
          hitCardId: el?.closest('.hand-card-wrapper')?.dataset?.cardId,
          targetCardId: thisWrapper.dataset.cardId,
        };
      })()`,
      returnByValue: true
    });
  };

  // Tap Card 2
  console.log("Tapping Card 2...");
  const tap2 = await tapCard(2);
  console.log("Tap 2:", JSON.stringify(tap2.result.value, null, 2));
  await new Promise((r) => setTimeout(r, 300));

  // Now with Card 2 selected, tap Card 3 (the card below it in DOM order / overlapping to its right)
  console.log("Tapping Card 3 while Card 2 is selected...");
  const tap3 = await tapCard(3);
  console.log("Tap 3:", JSON.stringify(tap3.result.value, null, 2));
  await new Promise((r) => setTimeout(r, 300));

  // Now tap Card 1 (the card below it in stack order / to its left)
  console.log("Tapping Card 1 while Card 2 and 3 are selected...");
  const tap1 = await tapCard(1);
  console.log("Tap 1:", JSON.stringify(tap1.result.value, null, 2));
  await new Promise((r) => setTimeout(r, 300));

  const selectionState = await send("Runtime.evaluate", {
    expression: `(() => {
      const wrappers = Array.from(document.querySelectorAll('.player-hand .hand-card-wrapper'));
      return {
        card1Selected: wrappers[1].classList.contains('is-selected'),
        card2Selected: wrappers[2].classList.contains('is-selected'),
        card3Selected: wrappers[3].classList.contains('is-selected'),
        totalSelected: wrappers.filter(w => w.classList.contains('is-selected')).length,
      };
    })()`,
    returnByValue: true
  });
  console.log("Selection State (Cards 1, 2, 3):", JSON.stringify(selectionState.result.value, null, 2));

  // Now tap Card 2 again to deselect it
  console.log("Tapping Card 2 again to deselect...");
  await tapCard(2);
  await new Promise((r) => setTimeout(r, 300));

  const deselectedState = await send("Runtime.evaluate", {
    expression: `(() => {
      const wrappers = Array.from(document.querySelectorAll('.player-hand .hand-card-wrapper'));
      return {
        card1Selected: wrappers[1].classList.contains('is-selected'),
        card2Selected: wrappers[2].classList.contains('is-selected'),
        card3Selected: wrappers[3].classList.contains('is-selected'),
        totalSelected: wrappers.filter(w => w.classList.contains('is-selected')).length,
      };
    })()`,
    returnByValue: true
  });
  console.log("Deselected State (Card 2 should be false, 1 and 3 true):", JSON.stringify(deselectedState.result.value, null, 2));

  const screenshot = await send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(
    "C:\\Users\\IT-HOME\\.gemini\\antigravity-cli\\brain\\d592f9e5-52b8-41cd-ac51-b21e193423f3\\verified_final.png",
    Buffer.from(screenshot.data, "base64")
  );

  ws.close();
  edge.kill();
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (e) {}

  const hasOverlap = overlapCheck.result.value.some(o => o.overlapsTopBar || o.overlapsEasyMode);
  const multiSelectPass = selectionState.result.value.card1Selected && selectionState.result.value.card2Selected && selectionState.result.value.card3Selected;
  const deselectPass = !deselectedState.result.value.card2Selected && deselectedState.result.value.card1Selected && deselectedState.result.value.card3Selected;

  if (!hasOverlap && multiSelectPass && deselectPass) {
    console.log("\n>>> ALL CHECKS PASSED PERFECTLY! <<<");
  } else {
    throw new Error("Verification checks failed!");
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
