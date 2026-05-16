/* ═══════════════════════════════════════════════════════════════
   DSA Visualizer — Main Script
   Fully interactive sorting visualizer with 5 algorithms,
   sound effects, theme toggle, step-by-step mode, and more.
   ═══════════════════════════════════════════════════════════════ */

// ── DOM References ───────────────────────────────────────────────
const DOM = {
  barsContainer: document.getElementById("bars-container"),
  algorithmSelect: document.getElementById("algorithm-select"),
  sizeSlider: document.getElementById("size-slider"),
  sizeValue: document.getElementById("size-value"),
  speedSlider: document.getElementById("speed-slider"),
  speedValue: document.getElementById("speed-value"),
  btnGenerate: document.getElementById("btn-generate"),
  btnStart: document.getElementById("btn-start"),
  btnPause: document.getElementById("btn-pause"),
  btnStep: document.getElementById("btn-step"),
  btnReset: document.getElementById("btn-reset"),
  btnTheme: document.getElementById("btn-theme"),
  btnSound: document.getElementById("btn-sound"),
  statusText: document.getElementById("status-text"),
  statComparisons: document.getElementById("stat-comparisons"),
  statSwaps: document.getElementById("stat-swaps"),
  statTime: document.getElementById("stat-time"),
  statBest: document.getElementById("stat-best"),
  statAvg: document.getElementById("stat-avg"),
  statWorst: document.getElementById("stat-worst"),
  statSpace: document.getElementById("stat-space"),
  explainTitle: document.getElementById("explain-title"),
  explainHow: document.getElementById("explain-how"),
  explainComplexity: document.getElementById("explain-complexity"),
  explainViz: document.getElementById("explain-viz"),
};

// ── Application State ────────────────────────────────────────────
const state = {
  array: [],
  sorting: false,
  paused: false,
  cancelled: false,
  stepMode: false,          // step-by-step manual mode
  stepResolve: null,        // resolver for step promise
  comparisons: 0,
  swaps: 0,
  startTime: 0,
  soundEnabled: false,
  audioCtx: null,
};

// ── Complexity Data for Each Algorithm ───────────────────────────
const COMPLEXITY = {
  bubble:    { best: "O(n)",      avg: "O(n²)",     worst: "O(n²)",     space: "O(1)" },
  selection: { best: "O(n²)",     avg: "O(n²)",     worst: "O(n²)",     space: "O(1)" },
  insertion: { best: "O(n)",      avg: "O(n²)",     worst: "O(n²)",     space: "O(1)" },
  merge:     { best: "O(n log n)",avg: "O(n log n)", worst: "O(n log n)", space: "O(n)" },
  quick:     { best: "O(n log n)",avg: "O(n log n)", worst: "O(n²)",     space: "O(log n)" },
};

// ── Explanation Data ─────────────────────────────────────────────
const EXPLANATIONS = {
  bubble: {
    title: "Bubble Sort",
    how: `<strong>How it works:</strong> Bubble Sort repeatedly steps through the list, compares adjacent elements, and swaps them if they are in the wrong order. The pass through the list is repeated until the list is sorted. Each pass "bubbles" the largest unsorted element to its correct position at the end.`,
    complexity: `<strong>Time Complexity:</strong> Best case O(n) when the array is already sorted (with optimization). Average and worst case are O(n²) because we need nested loops. Space complexity is O(1) — it sorts in place.`,
    viz: `<strong>Visualization:</strong> Yellow bars are being compared. Red bars are being swapped. After each complete pass, the last unsorted bar turns green — it has "bubbled" to its final position.`,
  },
  selection: {
    title: "Selection Sort",
    how: `<strong>How it works:</strong> Selection Sort divides the array into a sorted and unsorted region. It repeatedly finds the minimum element from the unsorted region and places it at the beginning of the unsorted region. The sorted region grows one element at a time.`,
    complexity: `<strong>Time Complexity:</strong> All cases are O(n²) because we always scan the entire unsorted portion to find the minimum, regardless of the initial order. Space complexity is O(1) — in-place sorting.`,
    viz: `<strong>Visualization:</strong> Yellow highlights show the current comparison as we search for the minimum. The purple bar marks the current minimum candidate. When the minimum is found, the swap is shown in red, then the sorted position turns green.`,
  },
  insertion: {
    title: "Insertion Sort",
    how: `<strong>How it works:</strong> Insertion Sort builds the sorted array one item at a time. It takes each element and inserts it into its correct position within the already-sorted portion by shifting larger elements to the right. Think of it like sorting playing cards in your hand.`,
    complexity: `<strong>Time Complexity:</strong> Best case O(n) when the array is already sorted — each element only needs one comparison. Average and worst case are O(n²). Space complexity is O(1).`,
    viz: `<strong>Visualization:</strong> The yellow bar is the current element being inserted. Red bars show elements shifting right to make room. Once the correct position is found, the element is placed and turns green.`,
  },
  merge: {
    title: "Merge Sort",
    how: `<strong>How it works:</strong> Merge Sort is a divide-and-conquer algorithm. It divides the array into two halves, recursively sorts each half, then merges the two sorted halves back together. The merge step compares elements from both halves and places them in order.`,
    complexity: `<strong>Time Complexity:</strong> All cases are O(n log n). The array is divided log(n) times, and each level of division requires O(n) work to merge. Space complexity is O(n) due to the temporary arrays used during merging.`,
    viz: `<strong>Visualization:</strong> Yellow bars show elements being compared during the merge phase. The bars update in-place to show the merged result. Green bars indicate fully sorted sections after merging is complete.`,
  },
  quick: {
    title: "Quick Sort",
    how: `<strong>How it works:</strong> Quick Sort picks a "pivot" element, then partitions the array so that elements smaller than the pivot go to the left and larger elements go to the right. It then recursively sorts the sub-arrays on each side of the pivot.`,
    complexity: `<strong>Time Complexity:</strong> Best and average cases are O(n log n). Worst case is O(n²) when the pivot consistently picks the smallest or largest element (e.g., already sorted array). Space complexity is O(log n) for the recursion stack.`,
    viz: `<strong>Visualization:</strong> The purple bar marks the pivot. Yellow bars are being compared to the pivot. Red bars show swaps needed to partition elements around the pivot. Green bars indicate elements that have reached their final sorted position.`,
  },
};

// ══════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ══════════════════════════════════════════════════════════════════

/**
 * Returns a delay (in ms) based on the speed slider.
 * Speed 1 = slow (300ms), Speed 100 = fast (1ms).
 */
function getDelay() {
  const speed = parseInt(DOM.speedSlider.value);
  return Math.max(1, Math.floor(320 - (speed * 3.2)));
}

/** Promise-based delay that respects pause / cancel / step-mode. */
function delay() {
  return new Promise((resolve) => {
    if (state.cancelled) { resolve(); return; }

    // If in step mode, wait for user to click "Step"
    if (state.stepMode && state.sorting) {
      state.stepResolve = resolve;
      return;
    }

    // If paused, wait until unpaused
    const waitForResume = () => {
      if (state.cancelled) { resolve(); return; }
      if (!state.paused) {
        setTimeout(resolve, getDelay());
      } else {
        requestAnimationFrame(waitForResume);
      }
    };
    waitForResume();
  });
}

/** Play a short tone whose pitch corresponds to the bar value. */
function playTone(value, duration = 50) {
  if (!state.soundEnabled) return;
  try {
    if (!state.audioCtx) state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = state.audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    // Map value (1-100) to frequency (200-1200 Hz)
    osc.frequency.value = 200 + (value / 100) * 1000;
    gain.gain.value = 0.04;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration / 1000);
  } catch (_) { /* audio not available */ }
}

/** Update the status text shown below the controls. */
function setStatus(msg) {
  DOM.statusText.textContent = msg;
}

/** Update the live stats counters. */
function updateStats() {
  DOM.statComparisons.textContent = state.comparisons.toLocaleString();
  DOM.statSwaps.textContent = state.swaps.toLocaleString();
  const elapsed = state.sorting ? Date.now() - state.startTime : 0;
  DOM.statTime.textContent = `${elapsed} ms`;
}

/** Get all bar DOM elements. */
function getBars() {
  return DOM.barsContainer.querySelectorAll(".bar");
}

/** Remove all state classes from every bar. */
function clearBarClasses() {
  getBars().forEach((b) => b.classList.remove("comparing", "swapping", "sorted", "pivot", "active", "celebrate"));
}

/** Swap two array values AND their bar heights visually. */
function swapBars(i, j) {
  // Swap in the state array
  [state.array[i], state.array[j]] = [state.array[j], state.array[i]];
  // Swap visual heights
  const bars = getBars();
  const tmpH = bars[i].style.height;
  bars[i].style.height = bars[j].style.height;
  bars[j].style.height = tmpH;
}

/** Set bar height to match a value. */
function setBarHeight(index, value) {
  const bars = getBars();
  if (bars[index]) {
    bars[index].style.height = `${(value / 100) * 100}%`;
  }
}

// ══════════════════════════════════════════════════════════════════
// ARRAY GENERATION & RENDERING
// ══════════════════════════════════════════════════════════════════

/** Generate a new random array and render bars. */
function generateArray() {
  const size = parseInt(DOM.sizeSlider.value);
  state.array = [];
  for (let i = 0; i < size; i++) {
    state.array.push(Math.floor(Math.random() * 100) + 1);
  }
  renderBars();
  resetStats();
  setStatus("New array generated. Choose an algorithm and press Start!");
}

/** Render the bars from the current state.array. */
function renderBars() {
  DOM.barsContainer.innerHTML = "";
  const frag = document.createDocumentFragment();
  state.array.forEach((val) => {
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.height = `${val}%`;
    frag.appendChild(bar);
  });
  DOM.barsContainer.appendChild(frag);
}

/** Reset counters to zero. */
function resetStats() {
  state.comparisons = 0;
  state.swaps = 0;
  state.startTime = 0;
  updateStats();
  DOM.statTime.textContent = "0 ms";
}

// ══════════════════════════════════════════════════════════════════
// SORTING ALGORITHMS
// ══════════════════════════════════════════════════════════════════

// ── Bubble Sort ──────────────────────────────────────────────────
async function bubbleSort() {
  const n = state.array.length;
  const bars = getBars();
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      if (state.cancelled) return;

      // Highlight comparing
      bars[j].classList.add("comparing");
      bars[j + 1].classList.add("comparing");
      state.comparisons++;
      setStatus(`Comparing index ${j} and ${j + 1}`);
      updateStats();
      playTone(state.array[j]);
      await delay();
      if (state.cancelled) return;

      if (state.array[j] > state.array[j + 1]) {
        // Highlight swap
        bars[j].classList.remove("comparing");
        bars[j + 1].classList.remove("comparing");
        bars[j].classList.add("swapping");
        bars[j + 1].classList.add("swapping");
        state.swaps++;
        setStatus(`Swapping index ${j} and ${j + 1}`);
        updateStats();
        await delay();
        if (state.cancelled) return;

        swapBars(j, j + 1);
        swapped = true;

        bars[j].classList.remove("swapping");
        bars[j + 1].classList.remove("swapping");
      } else {
        bars[j].classList.remove("comparing");
        bars[j + 1].classList.remove("comparing");
      }
    }
    // Mark the last unsorted position as sorted
    bars[n - i - 1].classList.add("sorted");
    if (!swapped) break; // Optimization: already sorted
  }
  bars[0].classList.add("sorted");
}

// ── Selection Sort ───────────────────────────────────────────────
async function selectionSort() {
  const n = state.array.length;
  const bars = getBars();
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    bars[minIdx].classList.add("pivot");
    for (let j = i + 1; j < n; j++) {
      if (state.cancelled) return;

      bars[j].classList.add("comparing");
      state.comparisons++;
      setStatus(`Comparing index ${j} with current min at index ${minIdx}`);
      updateStats();
      playTone(state.array[j]);
      await delay();
      if (state.cancelled) return;

      if (state.array[j] < state.array[minIdx]) {
        bars[minIdx].classList.remove("pivot");
        minIdx = j;
        bars[minIdx].classList.add("pivot");
      }
      bars[j].classList.remove("comparing");
    }

    if (minIdx !== i) {
      bars[i].classList.add("swapping");
      bars[minIdx].classList.add("swapping");
      state.swaps++;
      setStatus(`Swapping index ${i} and ${minIdx}`);
      updateStats();
      await delay();
      if (state.cancelled) return;

      swapBars(i, minIdx);
      bars[i].classList.remove("swapping");
      bars[minIdx].classList.remove("swapping");
    }
    bars[minIdx].classList.remove("pivot");
    bars[i].classList.add("sorted");
  }
  bars[n - 1].classList.add("sorted");
}

// ── Insertion Sort ───────────────────────────────────────────────
async function insertionSort() {
  const n = state.array.length;
  const bars = getBars();
  bars[0].classList.add("sorted");

  for (let i = 1; i < n; i++) {
    if (state.cancelled) return;
    const key = state.array[i];
    bars[i].classList.add("comparing");
    setStatus(`Inserting element at index ${i} (value ${key})`);
    await delay();
    if (state.cancelled) return;

    let j = i - 1;
    while (j >= 0 && state.array[j] > key) {
      if (state.cancelled) return;
      state.comparisons++;
      state.swaps++;

      bars[j].classList.add("swapping");
      setStatus(`Shifting index ${j} to the right`);
      updateStats();
      playTone(state.array[j]);
      await delay();
      if (state.cancelled) return;

      state.array[j + 1] = state.array[j];
      setBarHeight(j + 1, state.array[j]);
      bars[j].classList.remove("swapping");
      j--;
    }
    state.comparisons++;
    state.array[j + 1] = key;
    setBarHeight(j + 1, key);
    bars[i].classList.remove("comparing");
    updateStats();

    // Mark all from 0..i as sorted visually
    for (let k = 0; k <= i; k++) bars[k].classList.add("sorted");
    await delay();
  }
}

// ── Merge Sort ───────────────────────────────────────────────────
async function mergeSort() {
  await mergeSortHelper(0, state.array.length - 1);
}

async function mergeSortHelper(left, right) {
  if (left >= right || state.cancelled) return;
  const mid = Math.floor((left + right) / 2);
  await mergeSortHelper(left, mid);
  if (state.cancelled) return;
  await mergeSortHelper(mid + 1, right);
  if (state.cancelled) return;
  await merge(left, mid, right);
}

async function merge(left, mid, right) {
  const bars = getBars();
  const leftArr = state.array.slice(left, mid + 1);
  const rightArr = state.array.slice(mid + 1, right + 1);
  let i = 0, j = 0, k = left;

  setStatus(`Merging indices ${left}–${mid} and ${mid + 1}–${right}`);

  while (i < leftArr.length && j < rightArr.length) {
    if (state.cancelled) return;
    state.comparisons++;

    // Highlight the two elements being compared
    bars[left + i].classList.add("comparing");
    bars[mid + 1 + j].classList.add("comparing");
    updateStats();
    playTone(leftArr[i]);
    await delay();
    if (state.cancelled) return;
    bars[left + i].classList.remove("comparing");
    bars[mid + 1 + j].classList.remove("comparing");

    if (leftArr[i] <= rightArr[j]) {
      state.array[k] = leftArr[i];
      setBarHeight(k, leftArr[i]);
      i++;
    } else {
      state.array[k] = rightArr[j];
      setBarHeight(k, rightArr[j]);
      j++;
      state.swaps++;
    }
    bars[k].classList.add("active");
    updateStats();
    await delay();
    if (state.cancelled) return;
    bars[k].classList.remove("active");
    k++;
  }

  while (i < leftArr.length) {
    if (state.cancelled) return;
    state.array[k] = leftArr[i];
    setBarHeight(k, leftArr[i]);
    bars[k].classList.add("active");
    await delay();
    if (state.cancelled) return;
    bars[k].classList.remove("active");
    i++; k++;
  }
  while (j < rightArr.length) {
    if (state.cancelled) return;
    state.array[k] = rightArr[j];
    setBarHeight(k, rightArr[j]);
    bars[k].classList.add("active");
    await delay();
    if (state.cancelled) return;
    bars[k].classList.remove("active");
    j++; k++;
  }

  // Mark merged section
  for (let m = left; m <= right; m++) {
    bars[m].classList.add("sorted");
  }
}

// ── Quick Sort ───────────────────────────────────────────────────
async function quickSort() {
  await quickSortHelper(0, state.array.length - 1);
}

async function quickSortHelper(low, high) {
  if (low >= high || state.cancelled) return;
  const pivotIdx = await partition(low, high);
  if (state.cancelled) return;
  const bars = getBars();
  bars[pivotIdx].classList.add("sorted");
  await quickSortHelper(low, pivotIdx - 1);
  if (state.cancelled) return;
  await quickSortHelper(pivotIdx + 1, high);
}

async function partition(low, high) {
  const bars = getBars();
  const pivotVal = state.array[high];
  bars[high].classList.add("pivot");
  setStatus(`Pivot is index ${high} (value ${pivotVal})`);
  let i = low - 1;

  for (let j = low; j < high; j++) {
    if (state.cancelled) return i + 1;

    bars[j].classList.add("comparing");
    state.comparisons++;
    updateStats();
    playTone(state.array[j]);
    await delay();
    if (state.cancelled) return i + 1;

    if (state.array[j] < pivotVal) {
      i++;
      if (i !== j) {
        bars[i].classList.add("swapping");
        bars[j].classList.add("swapping");
        state.swaps++;
        setStatus(`Swapping index ${i} and ${j}`);
        updateStats();
        await delay();
        if (state.cancelled) return i + 1;
        swapBars(i, j);
        bars[i].classList.remove("swapping");
        bars[j].classList.remove("swapping");
      }
    }
    bars[j].classList.remove("comparing");
  }

  // Place pivot in correct position
  i++;
  if (i !== high) {
    bars[i].classList.add("swapping");
    bars[high].classList.add("swapping");
    state.swaps++;
    await delay();
    if (state.cancelled) return i;
    swapBars(i, high);
    bars[i].classList.remove("swapping");
    bars[high].classList.remove("swapping");
  }
  bars[high].classList.remove("pivot");
  return i;
}

// ══════════════════════════════════════════════════════════════════
// SORTING CONTROLLER
// ══════════════════════════════════════════════════════════════════

/** Map algorithm key to its async function. */
const ALGO_MAP = {
  bubble: bubbleSort,
  selection: selectionSort,
  insertion: insertionSort,
  merge: mergeSort,
  quick: quickSort,
};

/** Start sorting with the selected algorithm. */
async function startSort() {
  if (state.sorting) return; // Prevent double-run

  const algo = DOM.algorithmSelect.value;
  state.sorting = true;
  state.paused = false;
  state.cancelled = false;
  resetStats();
  state.startTime = Date.now();
  clearBarClasses();
  setControlState("sorting");
  updateComplexity(algo);
  updateExplanation(algo);
  setStatus(`Running ${EXPLANATIONS[algo].title}…`);

  // Timer updater
  const timer = setInterval(() => {
    if (state.sorting) {
      DOM.statTime.textContent = `${Date.now() - state.startTime} ms`;
    } else {
      clearInterval(timer);
    }
  }, 50);

  await ALGO_MAP[algo]();
  clearInterval(timer);

  if (!state.cancelled) {
    // Mark all sorted
    const bars = getBars();
    for (let i = 0; i < bars.length; i++) {
      bars[i].classList.add("sorted", "celebrate");
      playTone(state.array[i], 30);
      await new Promise((r) => setTimeout(r, 15));
    }
    DOM.statTime.textContent = `${Date.now() - state.startTime} ms`;
    setStatus(`✅ ${EXPLANATIONS[algo].title} complete!`);
  }

  state.sorting = false;
  state.stepMode = false;
  setControlState("idle");
}

/** Reset the visualizer to idle state. */
function resetSort() {
  state.cancelled = true;
  state.sorting = false;
  state.paused = false;
  state.stepMode = false;
  if (state.stepResolve) { state.stepResolve(); state.stepResolve = null; }
  generateArray();
  setControlState("idle");
  setStatus("Reset. Generate a new array to start again.");
}

// ══════════════════════════════════════════════════════════════════
// UI STATE MANAGEMENT
// ══════════════════════════════════════════════════════════════════

/** Enable/disable controls based on current state. */
function setControlState(mode) {
  const isSorting = mode === "sorting";
  DOM.btnGenerate.disabled = isSorting;
  DOM.algorithmSelect.disabled = isSorting;
  DOM.sizeSlider.disabled = isSorting;
  DOM.btnStart.disabled = isSorting;
  DOM.btnPause.disabled = !isSorting;
  DOM.btnReset.disabled = !isSorting;
  DOM.btnStep.disabled = !isSorting;

  if (!isSorting) {
    DOM.btnPause.textContent = "⏸ Pause";
  }
}

/** Update the complexity display for the selected algorithm. */
function updateComplexity(algo) {
  const c = COMPLEXITY[algo];
  DOM.statBest.textContent = c.best;
  DOM.statAvg.textContent = c.avg;
  DOM.statWorst.textContent = c.worst;
  DOM.statSpace.textContent = c.space;
}

/** Update the explanation panel for the selected algorithm. */
function updateExplanation(algo) {
  const e = EXPLANATIONS[algo];
  DOM.explainTitle.textContent = e.title;
  DOM.explainHow.innerHTML = e.how;
  DOM.explainComplexity.innerHTML = e.complexity;
  DOM.explainViz.innerHTML = e.viz;
}

// ══════════════════════════════════════════════════════════════════
// THEME & SOUND TOGGLES
// ══════════════════════════════════════════════════════════════════

function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute("data-theme") === "dark";
  html.setAttribute("data-theme", isDark ? "light" : "dark");
  DOM.btnTheme.querySelector(".theme-icon").textContent = isDark ? "☀️" : "🌙";
}

function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  DOM.btnSound.querySelector(".sound-icon").textContent = state.soundEnabled ? "🔊" : "🔇";
  if (state.soundEnabled && !state.audioCtx) {
    state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

// ══════════════════════════════════════════════════════════════════
// EVENT LISTENERS
// ══════════════════════════════════════════════════════════════════

// Generate array
DOM.btnGenerate.addEventListener("click", () => {
  if (!state.sorting) generateArray();
});

// Size slider
DOM.sizeSlider.addEventListener("input", () => {
  DOM.sizeValue.textContent = DOM.sizeSlider.value;
  if (!state.sorting) generateArray();
});

// Speed slider
DOM.speedSlider.addEventListener("input", () => {
  DOM.speedValue.textContent = DOM.speedSlider.value;
});

// Algorithm selector — update explanation & complexity live
DOM.algorithmSelect.addEventListener("change", () => {
  const algo = DOM.algorithmSelect.value;
  updateComplexity(algo);
  updateExplanation(algo);
});

// Start
DOM.btnStart.addEventListener("click", () => {
  state.stepMode = false;
  startSort();
});

// Pause / Resume
DOM.btnPause.addEventListener("click", () => {
  if (!state.sorting) return;
  state.paused = !state.paused;
  DOM.btnPause.textContent = state.paused ? "▶ Resume" : "⏸ Pause";
  setStatus(state.paused ? "⏸ Paused" : "▶ Resumed");
});

// Step (manual mode)
DOM.btnStep.addEventListener("click", () => {
  if (!state.sorting) {
    // Start in step mode
    state.stepMode = true;
    startSort();
  } else if (state.stepMode && state.stepResolve) {
    // Advance one step
    const resolve = state.stepResolve;
    state.stepResolve = null;
    resolve();
  }
});

// Reset
DOM.btnReset.addEventListener("click", resetSort);

// Theme toggle
DOM.btnTheme.addEventListener("click", toggleTheme);

// Sound toggle
DOM.btnSound.addEventListener("click", toggleSound);

// ══════════════════════════════════════════════════════════════════
// INITIALIZATION
// ══════════════════════════════════════════════════════════════════

(function init() {
  generateArray();
  updateComplexity(DOM.algorithmSelect.value);
  updateExplanation(DOM.algorithmSelect.value);
})();
