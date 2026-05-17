/* ═══════════════════════════════════════════════
   linkedlist.js — Singly Linked List Visualizer
   ═══════════════════════════════════════════════ */
(function () {
  const $ = (id) => document.getElementById(id);
  const list = []; // simple array to represent linked list nodes
  const container = $("ll-container");
  let animating = false;

  function setStatus(msg) { $("ll-status").textContent = msg; }
  function getDelay() { const s = parseInt($("ll-speed").value); return Math.max(50, 400 - s * 3.5); }

  function updateStats() {
    $("ll-length").textContent = list.length;
    $("ll-head").textContent = list.length ? list[0] : "—";
    $("ll-tail").textContent = list.length ? list[list.length - 1] : "—";
  }

  function render(highlightIdx = -1, foundIdx = -1, removingIdx = -1) {
    container.innerHTML = "";
    if (list.length === 0) {
      container.innerHTML = '<span class="ll-null">NULL (empty list)</span>';
      updateStats();
      return;
    }
    list.forEach((val, i) => {
      const nodeDiv = document.createElement("div");
      nodeDiv.className = "ll-node";

      const box = document.createElement("div");
      box.className = "ll-node-box";
      box.textContent = val;

      if (i === highlightIdx) box.classList.add("highlight");
      if (i === foundIdx) box.classList.add("found");
      if (i === removingIdx) box.classList.add("removing");

      // Head/Tail labels
      if (i === 0) {
        const lbl = document.createElement("span");
        lbl.className = "ll-head-label";
        lbl.textContent = "HEAD";
        box.appendChild(lbl);
      }
      if (i === list.length - 1) {
        const lbl = document.createElement("span");
        lbl.className = "ll-tail-label";
        lbl.textContent = "TAIL";
        box.appendChild(lbl);
      }

      nodeDiv.appendChild(box);

      // Arrow to next node
      if (i < list.length - 1) {
        const arrow = document.createElement("span");
        arrow.className = "ll-arrow";
        arrow.textContent = "→";
        nodeDiv.appendChild(arrow);
      }
      container.appendChild(nodeDiv);
    });

    // NULL at the end
    const nullSpan = document.createElement("span");
    nullSpan.className = "ll-null";
    nullSpan.textContent = "→ NULL";
    container.appendChild(nullSpan);
    updateStats();
  }

  async function append() {
    if (animating) return;
    const val = parseInt($("ll-value").value);
    if (isNaN(val)) { setStatus("⚠️ Enter a valid number."); return; }
    animating = true;
    list.push(val);
    render(list.length - 1);
    setStatus(`Appended ${val} at the end.`);
    playTone(val);
    $("ll-value").value = "";
    await new Promise(r => setTimeout(r, getDelay()));
    render();
    animating = false;
  }

  async function prepend() {
    if (animating) return;
    const val = parseInt($("ll-value").value);
    if (isNaN(val)) { setStatus("⚠️ Enter a valid number."); return; }
    animating = true;
    list.unshift(val);
    render(0);
    setStatus(`Prepended ${val} at the beginning.`);
    playTone(val);
    $("ll-value").value = "";
    await new Promise(r => setTimeout(r, getDelay()));
    render();
    animating = false;
  }

  async function insertAt() {
    if (animating) return;
    const val = parseInt($("ll-value").value);
    const idx = parseInt($("ll-index").value);
    if (isNaN(val)) { setStatus("⚠️ Enter a valid value."); return; }
    if (isNaN(idx) || idx < 0 || idx > list.length) { setStatus(`⚠️ Index must be 0–${list.length}.`); return; }
    animating = true;

    // Traverse to position
    for (let i = 0; i <= idx && i < list.length; i++) {
      render(i);
      setStatus(`Traversing to index ${i}…`);
      playTone(list[i]);
      await new Promise(r => setTimeout(r, getDelay()));
    }

    list.splice(idx, 0, val);
    render(idx);
    setStatus(`Inserted ${val} at index ${idx}.`);
    playTone(val);
    $("ll-value").value = "";
    $("ll-index").value = "";
    await new Promise(r => setTimeout(r, getDelay()));
    render();
    animating = false;
  }

  async function deleteAt() {
    if (animating) return;
    const idx = parseInt($("ll-index").value);
    if (list.length === 0) { setStatus("⚠️ List is empty."); return; }
    const target = isNaN(idx) ? list.length - 1 : idx;
    if (target < 0 || target >= list.length) { setStatus(`⚠️ Index must be 0–${list.length - 1}.`); return; }
    animating = true;

    // Traverse to position
    for (let i = 0; i <= target; i++) {
      render(i);
      setStatus(`Traversing to index ${i}…`);
      playTone(list[i]);
      await new Promise(r => setTimeout(r, getDelay()));
    }

    const removed = list[target];
    render(-1, -1, target);
    setStatus(`Removing ${removed} at index ${target}…`);
    await new Promise(r => setTimeout(r, 400));

    list.splice(target, 1);
    render();
    setStatus(`Deleted ${removed} from index ${target}.`);
    $("ll-index").value = "";
    animating = false;
  }

  async function search() {
    if (animating) return;
    const val = parseInt($("ll-value").value);
    if (isNaN(val)) { setStatus("⚠️ Enter a value to search."); return; }
    if (list.length === 0) { setStatus("⚠️ List is empty."); return; }
    animating = true;

    for (let i = 0; i < list.length; i++) {
      render(i);
      setStatus(`Checking index ${i} — value ${list[i]}`);
      playTone(list[i]);
      await new Promise(r => setTimeout(r, getDelay()));

      if (list[i] === val) {
        render(-1, i);
        setStatus(`✅ Found ${val} at index ${i}!`);
        animating = false;
        return;
      }
    }
    render();
    setStatus(`❌ ${val} not found in the list.`);
    animating = false;
  }

  async function reverse() {
    if (animating) return;
    if (list.length <= 1) { setStatus("Nothing to reverse."); return; }
    animating = true;
    setStatus("Reversing the linked list…");

    // Animate each swap
    let left = 0, right = list.length - 1;
    while (left < right) {
      render(left);
      await new Promise(r => setTimeout(r, getDelay()));
      render(right);
      await new Promise(r => setTimeout(r, getDelay()));
      [list[left], list[right]] = [list[right], list[left]];
      playTone(list[left]);
      left++;
      right--;
    }
    render();
    setStatus("✅ List reversed!");
    animating = false;
  }

  function clear() {
    list.length = 0;
    render();
    setStatus("List cleared.");
  }

  function updateInfo() {
    $("ll-info").innerHTML = `<h3>Singly Linked List</h3>
      <p><strong>How:</strong> A linked list is a linear data structure where each element (node) contains a value and a pointer to the next node. Unlike arrays, elements are not stored contiguously in memory.</p>
      <p><strong>Operations:</strong> Append O(1), Prepend O(1), Insert at index O(n), Delete O(n), Search O(n), Reverse O(n). Space O(n).</p>
      <p><strong>Visualization:</strong> Each box is a node showing its value. Arrows represent the "next" pointer. HEAD marks the first node, TAIL marks the last. Yellow highlight shows traversal, Green shows a found node.</p>`;
  }

  // Events
  $("ll-append").addEventListener("click", append);
  $("ll-prepend").addEventListener("click", prepend);
  $("ll-insert").addEventListener("click", insertAt);
  $("ll-delete").addEventListener("click", deleteAt);
  $("ll-search").addEventListener("click", search);
  $("ll-reverse").addEventListener("click", reverse);
  $("ll-clear").addEventListener("click", clear);
  $("ll-speed").addEventListener("input", () => { $("ll-speed-val").textContent = $("ll-speed").value; });

  render();
  updateInfo();
})();
