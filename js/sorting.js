/* ═══════════════════════════════════════════════
   sorting.js — 5 Sorting Algorithms Visualizer
   ═══════════════════════════════════════════════ */
(function () {
  const $ = (id) => document.getElementById(id);
  const state = { array: [], sorting: false, paused: false, cancelled: false, stepMode: false, stepResolve: null, comparisons: 0, swaps: 0, startTime: 0 };
  const delay = makeDelay(() => $("sort-speed"), state);
  const container = $("sort-bars");

  const COMPLEXITY = {
    bubble:    { best:"O(n)", avg:"O(n²)", worst:"O(n²)", space:"O(1)" },
    selection: { best:"O(n²)", avg:"O(n²)", worst:"O(n²)", space:"O(1)" },
    insertion: { best:"O(n)", avg:"O(n²)", worst:"O(n²)", space:"O(1)" },
    merge:     { best:"O(n log n)", avg:"O(n log n)", worst:"O(n log n)", space:"O(n)" },
    quick:     { best:"O(n log n)", avg:"O(n log n)", worst:"O(n²)", space:"O(log n)" },
  };

  const INFO = {
    bubble: { title:"Bubble Sort", how:"Repeatedly compares adjacent elements and swaps them if they're in the wrong order. Each pass bubbles the largest unsorted element to the end.", complexity:"Best O(n) when sorted. Average/Worst O(n²). Space O(1).", viz:"Yellow = comparing, Red = swapping, Green = sorted position." },
    selection: { title:"Selection Sort", how:"Finds the minimum element from the unsorted region and places it at the beginning. The sorted region grows one element at a time.", complexity:"All cases O(n²) — always scans entire unsorted portion. Space O(1).", viz:"Yellow = comparing, Purple = current minimum, Red = swapping, Green = final position." },
    insertion: { title:"Insertion Sort", how:"Builds the sorted array one item at a time by inserting each element into its correct position, shifting larger elements right. Like sorting cards.", complexity:"Best O(n) when sorted. Average/Worst O(n²). Space O(1).", viz:"Yellow = element being inserted, Red = elements shifting right, Green = sorted portion." },
    merge: { title:"Merge Sort", how:"Divide-and-conquer: splits array in half recursively, then merges sorted halves back together by comparing elements from each half.", complexity:"All cases O(n log n). Space O(n) for temporary arrays during merge.", viz:"Yellow = comparing during merge, Blue = active merge position, Green = merged sections." },
    quick: { title:"Quick Sort", how:"Picks a pivot, partitions array so smaller elements go left and larger go right, then recursively sorts each partition.", complexity:"Best/Avg O(n log n). Worst O(n²) with bad pivots. Space O(log n) for recursion.", viz:"Purple = pivot, Yellow = comparing to pivot, Red = swapping, Green = final position." },
  };

  function getBars() { return container.querySelectorAll(".bar"); }
  function setStatus(msg) { $("sort-status").textContent = msg; }
  function updateStats() {
    $("sort-comparisons").textContent = state.comparisons.toLocaleString();
    $("sort-swaps").textContent = state.swaps.toLocaleString();
  }
  function swapBars(i, j) {
    [state.array[i], state.array[j]] = [state.array[j], state.array[i]];
    const bars = getBars();
    const t = bars[i].style.height; bars[i].style.height = bars[j].style.height; bars[j].style.height = t;
  }
  function setH(i, v) { const bars = getBars(); if(bars[i]) bars[i].style.height = v + "%"; }

  function generate() {
    const size = parseInt($("sort-size").value);
    state.array = Array.from({length: size}, () => Math.floor(Math.random() * 100) + 1);
    container.innerHTML = "";
    const f = document.createDocumentFragment();
    state.array.forEach(v => { const b = document.createElement("div"); b.className = "bar"; b.style.height = v + "%"; f.appendChild(b); });
    container.appendChild(f);
    state.comparisons = 0; state.swaps = 0; updateStats();
    $("sort-time").textContent = "0 ms";
    setStatus("New array generated. Press Start!");
  }

  function updateInfo(algo) {
    const c = COMPLEXITY[algo], inf = INFO[algo];
    $("sort-best").textContent = c.best; $("sort-avg").textContent = c.avg;
    $("sort-worst").textContent = c.worst; $("sort-space").textContent = c.space;
    $("sort-info").innerHTML = `<h3>${inf.title}</h3><p><strong>How:</strong> ${inf.how}</p><p><strong>Complexity:</strong> ${inf.complexity}</p><p><strong>Visualization:</strong> ${inf.viz}</p>`;
  }

  // ── Bubble Sort ──
  async function bubbleSort() {
    const n = state.array.length, bars = getBars();
    for (let i = 0; i < n - 1; i++) {
      let swapped = false;
      for (let j = 0; j < n - i - 1; j++) {
        if (state.cancelled) return;
        bars[j].classList.add("comparing"); bars[j+1].classList.add("comparing");
        state.comparisons++; setStatus(`Comparing index ${j} and ${j+1}`); updateStats();
        playTone(state.array[j]); await delay(); if (state.cancelled) return;
        if (state.array[j] > state.array[j+1]) {
          bars[j].classList.replace("comparing","swapping"); bars[j+1].classList.replace("comparing","swapping");
          state.swaps++; setStatus(`Swapping index ${j} and ${j+1}`); updateStats();
          await delay(); if (state.cancelled) return;
          swapBars(j, j+1); swapped = true;
          bars[j].classList.remove("swapping"); bars[j+1].classList.remove("swapping");
        } else { bars[j].classList.remove("comparing"); bars[j+1].classList.remove("comparing"); }
      }
      bars[n-i-1].classList.add("sorted");
      if (!swapped) break;
    }
    bars[0].classList.add("sorted");
  }

  // ── Selection Sort ──
  async function selectionSort() {
    const n = state.array.length, bars = getBars();
    for (let i = 0; i < n - 1; i++) {
      let minIdx = i; bars[minIdx].classList.add("pivot");
      for (let j = i + 1; j < n; j++) {
        if (state.cancelled) return;
        bars[j].classList.add("comparing"); state.comparisons++;
        setStatus(`Comparing index ${j} with min at ${minIdx}`); updateStats();
        playTone(state.array[j]); await delay(); if (state.cancelled) return;
        if (state.array[j] < state.array[minIdx]) { bars[minIdx].classList.remove("pivot"); minIdx = j; bars[minIdx].classList.add("pivot"); }
        bars[j].classList.remove("comparing");
      }
      if (minIdx !== i) {
        bars[i].classList.add("swapping"); bars[minIdx].classList.add("swapping");
        state.swaps++; await delay(); if (state.cancelled) return;
        swapBars(i, minIdx);
        bars[i].classList.remove("swapping"); bars[minIdx].classList.remove("swapping");
      }
      bars[minIdx].classList.remove("pivot"); bars[i].classList.add("sorted");
    }
    bars[n-1].classList.add("sorted");
  }

  // ── Insertion Sort ──
  async function insertionSort() {
    const n = state.array.length, bars = getBars();
    bars[0].classList.add("sorted");
    for (let i = 1; i < n; i++) {
      if (state.cancelled) return;
      const key = state.array[i];
      bars[i].classList.add("comparing"); setStatus(`Inserting index ${i} (value ${key})`);
      await delay(); if (state.cancelled) return;
      let j = i - 1;
      while (j >= 0 && state.array[j] > key) {
        if (state.cancelled) return;
        state.comparisons++; state.swaps++;
        bars[j].classList.add("swapping"); setStatus(`Shifting index ${j} right`); updateStats();
        playTone(state.array[j]); await delay(); if (state.cancelled) return;
        state.array[j+1] = state.array[j]; setH(j+1, state.array[j]);
        bars[j].classList.remove("swapping"); j--;
      }
      state.comparisons++; state.array[j+1] = key; setH(j+1, key);
      bars[i].classList.remove("comparing"); updateStats();
      for (let k = 0; k <= i; k++) bars[k].classList.add("sorted");
    }
  }

  // ── Merge Sort ──
  async function mergeSort() { await msSplit(0, state.array.length - 1); }
  async function msSplit(l, r) {
    if (l >= r || state.cancelled) return;
    const m = Math.floor((l+r)/2);
    await msSplit(l, m); if (state.cancelled) return;
    await msSplit(m+1, r); if (state.cancelled) return;
    await msMerge(l, m, r);
  }
  async function msMerge(l, m, r) {
    const bars = getBars(), la = state.array.slice(l, m+1), ra = state.array.slice(m+1, r+1);
    let i=0, j=0, k=l;
    setStatus(`Merging [${l}..${m}] and [${m+1}..${r}]`);
    while (i < la.length && j < ra.length) {
      if (state.cancelled) return;
      state.comparisons++; updateStats(); playTone(la[i]); await delay(); if (state.cancelled) return;
      if (la[i] <= ra[j]) { state.array[k] = la[i]; setH(k, la[i]); i++; }
      else { state.array[k] = ra[j]; setH(k, ra[j]); j++; state.swaps++; }
      bars[k].classList.add("active"); updateStats(); await delay();
      if (state.cancelled) return; bars[k].classList.remove("active"); k++;
    }
    while (i < la.length) { if (state.cancelled) return; state.array[k]=la[i]; setH(k,la[i]); await delay(); i++; k++; }
    while (j < ra.length) { if (state.cancelled) return; state.array[k]=ra[j]; setH(k,ra[j]); await delay(); j++; k++; }
    for (let x=l; x<=r; x++) bars[x].classList.add("sorted");
  }

  // ── Quick Sort ──
  async function quickSort() { await qsHelper(0, state.array.length - 1); }
  async function qsHelper(lo, hi) {
    if (lo >= hi || state.cancelled) return;
    const p = await qsPartition(lo, hi); if (state.cancelled) return;
    getBars()[p].classList.add("sorted");
    await qsHelper(lo, p-1); if (state.cancelled) return;
    await qsHelper(p+1, hi);
  }
  async function qsPartition(lo, hi) {
    const bars = getBars(), pv = state.array[hi];
    bars[hi].classList.add("pivot"); setStatus(`Pivot: index ${hi} (${pv})`);
    let i = lo - 1;
    for (let j = lo; j < hi; j++) {
      if (state.cancelled) return i+1;
      bars[j].classList.add("comparing"); state.comparisons++; updateStats();
      playTone(state.array[j]); await delay(); if (state.cancelled) return i+1;
      if (state.array[j] < pv) {
        i++;
        if (i !== j) {
          bars[i].classList.add("swapping"); bars[j].classList.add("swapping");
          state.swaps++; updateStats(); await delay(); if (state.cancelled) return i+1;
          swapBars(i, j);
          bars[i].classList.remove("swapping"); bars[j].classList.remove("swapping");
        }
      }
      bars[j].classList.remove("comparing");
    }
    i++;
    if (i !== hi) { state.swaps++; await delay(); if (state.cancelled) return i; swapBars(i, hi); }
    bars[hi].classList.remove("pivot");
    return i;
  }

  const ALGOS = { bubble: bubbleSort, selection: selectionSort, insertion: insertionSort, merge: mergeSort, quick: quickSort };

  async function start() {
    if (state.sorting) return;
    const algo = $("sort-algo").value;
    state.sorting = true; state.paused = false; state.cancelled = false;
    state.comparisons = 0; state.swaps = 0; updateStats();
    state.startTime = Date.now();
    getBars().forEach(b => b.classList.remove("comparing","swapping","sorted","pivot","active","celebrate"));
    setControls(true); updateInfo(algo);
    setStatus(`Running ${INFO[algo].title}…`);
    const timer = setInterval(() => { if (state.sorting) $("sort-time").textContent = (Date.now()-state.startTime)+" ms"; else clearInterval(timer); }, 50);
    await ALGOS[algo]();
    clearInterval(timer);
    if (!state.cancelled) {
      const bars = getBars();
      for (let i = 0; i < bars.length; i++) { bars[i].classList.add("sorted","celebrate"); playTone(state.array[i],30); await new Promise(r=>setTimeout(r,15)); }
      $("sort-time").textContent = (Date.now()-state.startTime)+" ms";
      setStatus(`✅ ${INFO[algo].title} complete!`);
    }
    state.sorting = false; state.stepMode = false; setControls(false);
  }

  function reset() {
    state.cancelled = true; state.sorting = false; state.paused = false; state.stepMode = false;
    if (state.stepResolve) { state.stepResolve(); state.stepResolve = null; }
    generate(); setControls(false); setStatus("Reset. Generate a new array.");
  }

  function setControls(sorting) {
    $("sort-generate").disabled = sorting; $("sort-algo").disabled = sorting;
    $("sort-size").disabled = sorting; $("sort-start").disabled = sorting;
    $("sort-pause").disabled = !sorting; $("sort-reset").disabled = !sorting;
    $("sort-step").disabled = !sorting;
    if (!sorting) $("sort-pause").textContent = "⏸ Pause";
  }

  // Events
  $("sort-generate").addEventListener("click", () => { if (!state.sorting) generate(); });
  $("sort-size").addEventListener("input", () => { $("sort-size-val").textContent = $("sort-size").value; if (!state.sorting) generate(); });
  $("sort-speed").addEventListener("input", () => { $("sort-speed-val").textContent = $("sort-speed").value; });
  $("sort-algo").addEventListener("change", () => updateInfo($("sort-algo").value));
  $("sort-start").addEventListener("click", () => { state.stepMode = false; start(); });
  $("sort-pause").addEventListener("click", () => {
    if (!state.sorting) return;
    state.paused = !state.paused;
    $("sort-pause").textContent = state.paused ? "▶ Resume" : "⏸ Pause";
    setStatus(state.paused ? "⏸ Paused" : "▶ Resumed");
  });
  $("sort-step").addEventListener("click", () => {
    if (!state.sorting) { state.stepMode = true; start(); }
    else if (state.stepMode && state.stepResolve) { const r = state.stepResolve; state.stepResolve = null; r(); }
  });
  $("sort-reset").addEventListener("click", reset);

  // Init
  generate();
  updateInfo($("sort-algo").value);
})();
