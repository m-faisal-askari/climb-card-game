import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function run() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "edge-click-test-"));
  const port = 9252;

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

  // Wait for .player-hand
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 500));
    const check = await send("Runtime.evaluate", {
      expression: `Boolean(document.querySelector('.player-hand'))`
    });
    if (check?.result?.value) break;
  }

  // Clear local storage and reload for fresh game
  await send("Runtime.evaluate", {
    expression: `(() => {
      localStorage.clear();
      window.location.reload();
    })()`
  });
  await new Promise((r) => setTimeout(r, 1000));

  // Ensure it is human's turn
  await send("Runtime.evaluate", {
    expression: `(() => {
      // Find human player ID
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

  // Let's inspect the cards
  const testInfo = await send("Runtime.evaluate", {
    expression: `(() => {
      const wrappers = Array.from(document.querySelectorAll('.player-hand .hand-card-wrapper'));
      const cards = wrappers.map(w => w.querySelector('.card'));

      return {
        count: wrappers.length,
        isButton: cards.map(c => c.tagName),
      };
    })()`,
    returnByValue: true
  });

  console.log("Player hand inspection:", JSON.stringify(testInfo.result.value, null, 2));

  // Now, test case:
  // Let's click Card 2 to select it.
  console.log("--- Clicking Card 2 to select it ---");
  await send("Runtime.evaluate", {
    expression: `(() => {
      const cards = document.querySelectorAll('.player-hand .card');
      cards[2].click();
    })()`
  });
  await new Promise((r) => setTimeout(r, 200));

  // Check what document.elementFromPoint returns at various points
  const probePoints = await send("Runtime.evaluate", {
    expression: `(() => {
      const wrappers = Array.from(document.querySelectorAll('.player-hand .hand-card-wrapper'));
      const cards = wrappers.map(w => w.querySelector('.card'));
      const r1 = cards[1].getBoundingClientRect();
      const r2 = cards[2].getBoundingClientRect();
      const r3 = cards[3].getBoundingClientRect();

      // Check various points on Card 1 (under Card 2)
      // Left edge of Card 1 (not covered by Card 2)
      const p1 = { x: r1.left + 5, y: r1.top + r1.height / 2 };
      // Middle of Card 1
      const p2 = { x: (r1.left + r1.right) / 2, y: r1.top + r1.height / 2 };
      // Right edge of Card 1 (where Card 2 overlaps Card 1)
      const p3 = { x: r1.right - 5, y: r1.top + r1.height / 2 };
      // Lower area of Card 2 (where Card 2 was before being lifted)
      const p4 = { x: (r2.left + r2.right) / 2, y: r1.bottom - 10 };

      const allPlayerCards = Array.from(document.querySelectorAll('.player-hand .card'));
      const getTarget = (p) => {
        const el = document.elementFromPoint(p.x, p.y);
        const card = el ? el.closest('.card') : null;
        const wrapper = el ? el.closest('.hand-card-wrapper') : null;
        return {
          point: p,
          element: el ? el.tagName + '.' + el.className : null,
          cardIndex: card ? allPlayerCards.indexOf(card) : -1,
          wrapperCardId: wrapper ? wrapper.dataset.cardId : null
        };
      };

      return {
        card2Selected: wrappers[2].classList.contains('is-selected'),
        card2WrapperZ: window.getComputedStyle(wrappers[2]).zIndex,
        card1WrapperZ: window.getComputedStyle(wrappers[1]).zIndex,
        probeP1_leftEdgeCard1: getTarget(p1),
        probeP2_middleCard1: getTarget(p2),
        probeP3_rightEdgeCard1: getTarget(p3),
        probeP4_lowerAreaCard2: getTarget(p4),
      };
    })()`,
    returnByValue: true
  });

  console.log("Probes when Card 2 is selected:", JSON.stringify(probePoints.result.value, null, 2));

  // Now what if we click on Card 1?
  // Let's test dispatching click at p1 (left of card 1) and p2 (middle of card 1) without mousemove
  // simulating touch tap!
  console.log("--- Testing touch tap on Card 1 at p1 (without mousemove) ---");
  const tapP1Result = await send("Runtime.evaluate", {
    expression: `(() => {
      const cards = document.querySelectorAll('.player-hand .card');
      const r1 = cards[1].getBoundingClientRect();
      const el = document.elementFromPoint(r1.left + 5, r1.top + r1.height / 2);
      el.click();
      const wrappers = Array.from(document.querySelectorAll('.hand-card-wrapper'));
      return {
        clickedEl: el ? el.tagName + '.' + el.className : null,
        card1Selected: wrappers[1].classList.contains('is-selected'),
        card2Selected: wrappers[2].classList.contains('is-selected'),
      };
    })()`,
    returnByValue: true
  });
  console.log("Tap at left of Card 1 result:", JSON.stringify(tapP1Result.result.value, null, 2));

  // Now what if we deselect Card 1, reselect Card 1, and probe Card 0?
  // What happens when Card 1 is selected and we probe Card 1 and Card 0?
  // Let's see what happens if someone clicks where Card 2 overlaps Card 1 or underneath!
  ws.close();
  edge.kill();
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (e) {}
}

run().catch(console.error);
