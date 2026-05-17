/* ═══════════════════════════════════════════════
   searching.js — Linear & Binary Search Visualizer
   ═══════════════════════════════════════════════ */
(function () {
  const $ = (id) => document.getElementById(id);
  const state = { array: [], sorting: false, cancelled: false, steps: 0 };
  const container = $("search-bars");

  const INFO = {
    linear: { title:"Linear Search", how:"Scans each element one by one from left to right until the target is found or the end is reached. Works on any array (sorted or unsorted).", complexity:"Best O(1) — found at first position. Worst O(n) — at end or not found. Space O(1).", viz:"Yellow = currently checking, Green = found, Red = not the target." },
    binary: { title:"Binary Search", how:"Requires a SORTED array. Compares the target with the middle element — if smaller, search the left half; if larger, search the right half. Eliminates half the elements each step.", complexity:"Best O(1) — middle element. Worst O(log n). Space O(1) iterative.", viz:"Purple = low/high boundaries, Yellow = mid pointer, Green = found, dimmed = eliminated region." },
  };

  function getBars() { return container.querySelectorAll(".bar"); }
  function setStatus(msg) { $("search-status").textContent = msg; }

  function getDelay() {
    const speed = parseInt($("search-speed").value);
    return Math.max(10, Math.floor(500 - speed * 4.5));
  }
  function wait() {
    return new Promise(r => { if (state.cancelled) { r(); return; } setTimeout(r, getDelay()); });
  }

  function generate() {
    const size = parseInt($("search-size").value);
    const algo = $("search-algo").value;
    state.array = Array.from({length: size}, () => Math.floor(Math.random() * 100) + 1);
    if (algo === "binary") state.array.sort((a, b) => a - b);
    container.innerHTML = "";
    const f = document.createDocumentFragment();
    state.array.forEach(v => { const b = document.createElement("div"); b.className = "bar"; b.style.height = v + "%"; f.appendChild(b); });
    container.appendChild(f);
    state.steps = 0; $("search-steps").textContent = "0"; $("search-result").textContent = "—";
    setStatus("Enter a target value and press Search.");
  }

  function updateInfo(algo) {
    const inf = INFO[algo];
    $("search-best").textContent = algo === "linear" ? "O(1)" : "O(1)";
    $("search-worst").textContent = algo === "linear" ? "O(n)" : "O(log n)";
    $("search-info").innerHTML = `<h3>${inf.title}</h3><p><strong>How:</strong> ${inf.how}</p><p><strong>Complexity:</strong> ${inf.complexity}</p><p><strong>Visualization:</strong> ${inf.viz}</p>`;
  }

  // ── Linear Search ──
  async function linearSearch(target) {
    const bars = getBars();
    for (let i = 0; i < state.array.length; i++) {
      if (state.cancelled) return;
      state.steps++;
      $("search-steps").textContent = state.steps;
      bars[i].classList.add("comparing");
      setStatus(`Checking index ${i} — value ${state.array[i]}`);
      playTone(state.array[i]);
      await wait();
      if (state.cancelled) return;
      if (state.array[i] === target) {
        bars[i].classList.remove("comparing");
        bars[i].classList.add("found");
        $("search-result").textContent = `Found at index ${i}`;
        setStatus(`✅ Found ${target} at index ${i}!`);
        return;
      }
      bars[i].classList.remove("comparing");
      bars[i].classList.add("not-found");
    }
    $("search-result").textContent = "Not found";
    setStatus(`❌ ${target} not found in the array.`);
  }

  // ── Binary Search ──
  async function binarySearch(target) {
    const bars = getBars();
    let low = 0, high = state.array.length - 1;

    // Dim all bars first
    while (low <= high) {
      if (state.cancelled) return;
      const mid = Math.floor((low + high) / 2);
      state.steps++;
      $("search-steps").textContent = state.steps;

      // Mark boundaries
      bars[low].classList.add("low-ptr");
      bars[high].classList.add("high-ptr");
      bars[mid].classList.add("comparing", "mid-ptr");
      setStatus(`low=${low}, mid=${mid}, high=${high} — checking value ${state.array[mid]}`);
      playTone(state.array[mid]);
      await wait();
      if (state.cancelled) return;

      if (state.array[mid] === target) {
        bars[mid].classList.remove("comparing", "mid-ptr");
        bars[mid].classList.add("found");
        bars[low].classList.remove("low-ptr");
        bars[high].classList.remove("high-ptr");
        $("search-result").textContent = `Found at index ${mid}`;
        setStatus(`✅ Found ${target} at index ${mid}!`);
        return;
      }

      bars[mid].classList.remove("comparing", "mid-ptr");
      bars[low].classList.remove("low-ptr");
      bars[high].classList.remove("high-ptr");

      if (state.array[mid] < target) {
        // Dim left portion
        for (let x = low; x <= mid; x++) bars[x].classList.add("not-found");
        low = mid + 1;
      } else {
        // Dim right portion
        for (let x = mid; x <= high; x++) bars[x].classList.add("not-found");
        high = mid - 1;
      }
      await wait();
    }
    $("search-result").textContent = "Not found";
    setStatus(`❌ ${target} not found in the array.`);
  }

  async function start() {
    if (state.sorting) return;
    const target = parseInt($("search-target").value);
    if (isNaN(target)) { setStatus("⚠️ Please enter a valid target number."); return; }
    const algo = $("search-algo").value;
    state.sorting = true; state.cancelled = false; state.steps = 0;
    $("search-steps").textContent = "0"; $("search-result").textContent = "—";
    getBars().forEach(b => b.classList.remove("comparing","found","not-found","low-ptr","high-ptr","mid-ptr"));
    $("search-start").disabled = true; $("search-generate").disabled = true; $("search-reset").disabled = false;
    updateInfo(algo);
    if (algo === "linear") await linearSearch(target);
    else await binarySearch(target);
    state.sorting = false;
    $("search-start").disabled = false; $("search-generate").disabled = false;
  }

  function reset() {
    state.cancelled = true; state.sorting = false;
    generate();
    $("search-start").disabled = false; $("search-generate").disabled = false; $("search-reset").disabled = true;
  }

  // Events
  $("search-generate").addEventListener("click", generate);
  $("search-size").addEventListener("input", () => { $("search-size-val").textContent = $("search-size").value; generate(); });
  $("search-speed").addEventListener("input", () => { $("search-speed-val").textContent = $("search-speed").value; });
  $("search-algo").addEventListener("change", () => { updateInfo($("search-algo").value); generate(); });
  $("search-start").addEventListener("click", start);
  $("search-reset").addEventListener("click", reset);

  generate();
  updateInfo($("search-algo").value);
})();
