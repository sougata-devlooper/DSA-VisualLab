/* ═══════════════════════════════════════════════════════════
   app.js — Main controller, tab switching, shared utilities
   ═══════════════════════════════════════════════════════════ */

// ── Shared State ──
const APP = {
  soundEnabled: false,
  audioCtx: null,
};

// ── Tab Switching ──
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
  });
});

// ── Theme Toggle ──
document.getElementById("btn-theme").addEventListener("click", () => {
  const html = document.documentElement;
  const isDark = html.getAttribute("data-theme") === "dark";
  html.setAttribute("data-theme", isDark ? "light" : "dark");
  document.querySelector(".theme-icon").textContent = isDark ? "☀️" : "🌙";
  // Redraw BST canvas if it exists
  if (typeof bstRedraw === "function") bstRedraw();
});

// ── Sound Toggle ──
document.getElementById("btn-sound").addEventListener("click", () => {
  APP.soundEnabled = !APP.soundEnabled;
  document.querySelector(".sound-icon").textContent = APP.soundEnabled ? "🔊" : "🔇";
  if (APP.soundEnabled && !APP.audioCtx) {
    APP.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
});

// ── Shared Utilities ──
function playTone(value, duration = 50) {
  if (!APP.soundEnabled) return;
  try {
    if (!APP.audioCtx) APP.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = APP.audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 200 + (value / 100) * 1000;
    gain.gain.value = 0.04;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration / 1000);
  } catch (_) {}
}

function makeDelay(getSpeed, stateObj) {
  return function () {
    return new Promise((resolve) => {
      if (stateObj.cancelled) { resolve(); return; }
      if (stateObj.stepMode && stateObj.sorting) { stateObj.stepResolve = resolve; return; }
      const wait = () => {
        if (stateObj.cancelled) { resolve(); return; }
        if (!stateObj.paused) {
          const speed = parseInt(getSpeed().value);
          setTimeout(resolve, Math.max(1, Math.floor(320 - speed * 3.2)));
        } else { requestAnimationFrame(wait); }
      };
      wait();
    });
  };
}
