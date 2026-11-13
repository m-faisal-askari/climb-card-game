import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function run() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "edge-click-all-"));
  const port = 9253;

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
  await send("Page.navigate", { url: "http://localhost:5173/" });

  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 500));
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

  // TEST 1: Select Card 2.
  // Then try to click Card 1 by clicking on the visible area of Card 1.
  console.log("=== TEST 1: Select Card 2, then click Card 1 ===");
  await send("Runtime.evaluate", {
    expression: `(() => {
      const cards = document.querySelectorAll('.player-hand .card');
      cards[2].click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 300));

  const afterSelect2 = await send("Runtime.evaluate", {
    expression: `(() => {
      const wrappers = Array.from(document.querySelectorAll('.player-hand .hand-card-wrapper'));
      const cards = wrappers.map(w => w.querySelector('.card'));
      const r1 = cards[1].getBoundingClientRect();
      const r2 = cards[2].getBoundingClientRect();

      // What elements are at various points along Card 1's visible width?
      // Card 1 starts at r1.left. Card 2 starts at r2.left.
      // So Card 1 is exposed from r1.left to r2.left.
      const exposedWidth = r2.left - r1.left;
      const testX = r1.left + exposedWidth / 2;
      const testY = r1.top + r1.height / 2;

      const hitEl = document.elementFromPoint(testX, testY);
      return {
        r1: { left: r1.left, right: r1.right, width: r1.width },
        r2: { left: r2.left, right: r2.right, width: r2.width },
        exposedWidth,
        testX,
        testY,
        hitElTag: hitEl?.tagName,
        hitElClass: hitEl?.className,
        hitElCardId: hitEl?.closest('.hand-card-wrapper')?.dataset?.cardId,
        card2CardId: wrappers[2].dataset.cardId,
        card1CardId: wrappers[1].dataset.cardId,
      };
    })()`,
    returnByValue: true
  });
  console.log("Test 1 inspection:", JSON.stringify(afterSelect2.result.value, null, 2));

  // Now let's click at testX, testY
  const clickCard1Result = await send("Runtime.evaluate", {
    expression: `(() => {
      const wrappers = Array.from(document.querySelectorAll('.player-hand .hand-card-wrapper'));
      const cards = wrappers.map(w => w.querySelector('.card'));
      const r1 = cards[1].getBoundingClientRect();
      const r2 = cards[2].getBoundingClientRect();
      const testX = r1.left + (r2.left - r1.left) / 2;
      const testY = r1.top + r1.height / 2;
      const hitEl = document.elementFromPoint(testX, testY);
      hitEl.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 300));

  const checkSelected1 = await send("Runtime.evaluate", {
    expression: `(() => {
      const wrappers = Array.from(document.querySelectorAll('.player-hand .hand-card-wrapper'));
      return {
        card1Selected: wrappers[1].classList.contains('is-selected'),
        card2Selected: wrappers[2].classList.contains('is-selected'),
      };
    })()`,
    returnByValue: true
  });
  console.log("After clicking Card 1:", JSON.stringify(checkSelected1.result.value, null, 2));

  // TEST 2: Now deselect all.
  console.log("\n=== TEST 2: Select Card 1, then try to click Card 2 (card to the right) ===");
  await send("Runtime.evaluate", {
    expression: `(() => {
      const cards = document.querySelectorAll('.player-hand .card');
      const wrappers = document.querySelectorAll('.player-hand .hand-card-wrapper');
      wrappers.forEach((w, i) => {
        if (w.classList.contains('is-selected')) cards[i].click();
      });
    })()`
  });
  await new Promise((r) => setTimeout(r, 300));

  // Select Card 1
  await send("Runtime.evaluate", {
    expression: `(() => {
      const cards = document.querySelectorAll('.player-hand .card');
      cards[1].click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 300));

  const afterSelect1 = await send("Runtime.evaluate", {
    expression: `(() => {
      const wrappers = Array.from(document.querySelectorAll('.player-hand .hand-card-wrapper'));
      const cards = wrappers.map(w => w.querySelector('.card'));
      const r1 = cards[1].getBoundingClientRect();
      const r2 = cards[2].getBoundingClientRect();
      const r3 = cards[3].getBoundingClientRect();

      // Card 2 is exposed between r2.left and r3.left.
      // What element is at Card 2's exposed area?
      const exposedWidth = r3.left - r2.left;
      const testX = r2.left + exposedWidth / 2;
      const testY = r2.top + r2.height / 2;

      const hitEl = document.elementFromPoint(testX, testY);
      return {
        card1Z: window.getComputedStyle(wrappers[1]).zIndex,
        card2Z: window.getComputedStyle(wrappers[2]).zIndex,
        r1: { left: r1.left, right: r1.right, width: r1.width },
        r2: { left: r2.left, right: r2.right, width: r2.width },
        exposedWidth,
        testX,
        testY,
        hitElTag: hitEl?.tagName,
        hitElClass: hitEl?.className,
        hitElCardId: hitEl?.closest('.hand-card-wrapper')?.dataset?.cardId,
        card1CardId: wrappers[1].dataset.cardId,
        card2CardId: wrappers[2].dataset.cardId,
      };
    })()`,
    returnByValue: true
  });
  console.log("Test 2 inspection (clicking Card 2 when Card 1 is selected):", JSON.stringify(afterSelect1.result.value, null, 2));

  // Click at testX, testY
  await send("Runtime.evaluate", {
    expression: `(() => {
      const wrappers = Array.from(document.querySelectorAll('.player-hand .hand-card-wrapper'));
      const cards = wrappers.map(w => w.querySelector('.card'));
      const r2 = cards[2].getBoundingClientRect();
      const r3 = cards[3].getBoundingClientRect();
      const testX = r2.left + (r3.left - r2.left) / 2;
      const testY = r2.top + r2.height / 2;
      const hitEl = document.elementFromPoint(testX, testY);
      hitEl.click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 300));

  const checkSelected2 = await send("Runtime.evaluate", {
    expression: `(() => {
      const wrappers = Array.from(document.querySelectorAll('.player-hand .hand-card-wrapper'));
      return {
        card1Selected: wrappers[1].classList.contains('is-selected'),
        card2Selected: wrappers[2].classList.contains('is-selected'),
      };
    })()`,
    returnByValue: true
  });
  console.log("After clicking Card 2:", JSON.stringify(checkSelected2.result.value, null, 2));

  // TEST 3: What about the lower area of a selected card?
  console.log("\n=== TEST 3: Lower area of selected card ===");
  const lowerAreaCheck = await send("Runtime.evaluate", {
    expression: `(() => {
      const wrappers = Array.from(document.querySelectorAll('.player-hand .hand-card-wrapper'));
      const cards = wrappers.map(w => w.querySelector('.card'));
      const w1 = wrappers[1];
      const c1 = cards[1];
      const wRect = w1.getBoundingClientRect();
      const cRect = c1.getBoundingClientRect();
      // c1 is selected and translated up.
      // What is at the bottom of w1 (where c1 would be if not translated)?
      const bottomPoint = { x: (wRect.left + wRect.right) / 2, y: wRect.bottom - 5 };
      const hitEl = document.elementFromPoint(bottomPoint.x, bottomPoint.y);
      return {
        wRectBottom: wRect.bottom,
        cRectBottom: cRect.bottom,
        difference: wRect.bottom - cRect.bottom,
        hitElTag: hitEl?.tagName,
        hitElClass: hitEl?.className,
      };
    })()`,
    returnByValue: true
  });
  console.log("Lower area check:", JSON.stringify(lowerAreaCheck.result.value, null, 2));

  ws.close();
  edge.kill();
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (e) {}
}

run().catch(console.error);
