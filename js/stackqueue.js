/* ═══════════════════════════════════════════════
   stackqueue.js — Stack & Queue Visualizer
   ═══════════════════════════════════════════════ */
(function () {
  const $ = (id) => document.getElementById(id);
  const data = [];
  const container = $("sq-container");
  const MAX_SIZE = 15;

  const INFO = {
    stack: { title:"Stack (LIFO)", how:"A Stack follows Last-In-First-Out. The last element added is the first one removed. Think of a stack of plates — you add and remove from the top.", complexity:"Push: O(1), Pop: O(1), Peek: O(1). Space O(n).", viz:"Elements stack vertically. Push adds to the top, Pop removes from the top. The top element is highlighted when peeking." },
    queue: { title:"Queue (FIFO)", how:"A Queue follows First-In-First-Out. The first element added is the first one removed. Think of a line at a store — first person in line gets served first.", complexity:"Enqueue: O(1), Dequeue: O(1), Front: O(1). Space O(n).", viz:"Elements line up horizontally. Enqueue adds to the back, Dequeue removes from the front. The front element is highlighted when peeking." },
  };

  function getMode() { return $("sq-mode").value; }
  function setStatus(msg) { $("sq-status").textContent = msg; }
  function getDelay() { const s = parseInt($("sq-speed").value); return Math.max(50, 400 - s * 3.5); }

  function updateStats() {
    $("sq-size").textContent = data.length;
    const mode = getMode();
    if (data.length === 0) { $("sq-top").textContent = "—"; }
    else if (mode === "stack") { $("sq-top").textContent = data[data.length - 1]; }
    else { $("sq-top").textContent = data[0]; }
  }

  function render() {
    container.innerHTML = "";
    const mode = getMode();
    container.className = "sq-container" + (mode === "queue" ? " queue-mode" : "");

    data.forEach((val, i) => {
      const item = document.createElement("div");
      item.className = "sq-item";
      item.textContent = val;

      // Labels
      if (mode === "stack") {
        if (i === data.length - 1) {
          const lbl = document.createElement("span");
          lbl.className = "sq-label sq-label-top";
          lbl.textContent = "TOP";
          item.appendChild(lbl);
        }
      } else {
        if (i === 0) {
          const lbl = document.createElement("span");
          lbl.className = "sq-label sq-label-top";
          lbl.textContent = "FRONT";
          item.appendChild(lbl);
        }
        if (i === data.length - 1) {
          const lbl = document.createElement("span");
          lbl.className = "sq-label sq-label-top";
          lbl.textContent = "REAR";
          item.appendChild(lbl);
        }
      }
      container.appendChild(item);
    });
    updateStats();
  }

  function updateInfo() {
    const mode = getMode();
    const inf = INFO[mode];
    $("sq-info").innerHTML = `<h3>${inf.title}</h3><p><strong>How:</strong> ${inf.how}</p><p><strong>Complexity:</strong> ${inf.complexity}</p><p><strong>Visualization:</strong> ${inf.viz}</p>`;
  }

  async function push() {
    const val = parseInt($("sq-value").value);
    if (isNaN(val)) { setStatus("⚠️ Enter a valid number."); return; }
    if (data.length >= MAX_SIZE) { setStatus("⚠️ Maximum capacity reached!"); return; }
    const mode = getMode();
    data.push(val);
    render();
    // Animate the new item
    const items = container.querySelectorAll(".sq-item");
    const newItem = mode === "stack" ? items[items.length - 1] : items[items.length - 1];
    newItem.classList.add("adding");
    $("sq-lastop").textContent = mode === "stack" ? `Push(${val})` : `Enqueue(${val})`;
    setStatus(`${mode === "stack" ? "Pushed" : "Enqueued"} ${val}`);
    playTone(val);
    $("sq-value").value = "";
  }

  async function pop() {
    if (data.length === 0) { setStatus("⚠️ Empty! Nothing to remove."); return; }
    const mode = getMode();
    const items = container.querySelectorAll(".sq-item");
    let removedVal, targetItem;

    if (mode === "stack") {
      targetItem = items[items.length - 1];
      removedVal = data[data.length - 1];
    } else {
      targetItem = items[0];
      removedVal = data[0];
    }

    targetItem.classList.add("removing");
    setStatus(`${mode === "stack" ? "Popping" : "Dequeuing"} ${removedVal}…`);
    await new Promise(r => setTimeout(r, 300));

    if (mode === "stack") data.pop();
    else data.shift();

    render();
    $("sq-lastop").textContent = mode === "stack" ? `Pop→${removedVal}` : `Dequeue→${removedVal}`;
    setStatus(`${mode === "stack" ? "Popped" : "Dequeued"} ${removedVal}`);
    playTone(removedVal);
  }

  function peek() {
    if (data.length === 0) { setStatus("⚠️ Empty! Nothing to peek."); return; }
    const mode = getMode();
    const items = container.querySelectorAll(".sq-item");
    let val, targetItem;

    if (mode === "stack") {
      targetItem = items[items.length - 1];
      val = data[data.length - 1];
    } else {
      targetItem = items[0];
      val = data[0];
    }

    items.forEach(i => i.classList.remove("highlight"));
    targetItem.classList.add("highlight");
    $("sq-lastop").textContent = mode === "stack" ? `Peek→${val}` : `Front→${val}`;
    setStatus(`${mode === "stack" ? "Top" : "Front"} element is ${val}`);
    playTone(val);
    setTimeout(() => targetItem.classList.remove("highlight"), 1500);
  }

  function clear() {
    data.length = 0;
    render();
    setStatus("Cleared.");
    $("sq-lastop").textContent = "Clear";
  }

  // Events
  $("sq-push").addEventListener("click", push);
  $("sq-pop").addEventListener("click", pop);
  $("sq-peek").addEventListener("click", peek);
  $("sq-clear").addEventListener("click", clear);
  $("sq-mode").addEventListener("change", () => {
    const mode = getMode();
    $("sq-push").textContent = mode === "stack" ? "⬆ Push" : "⬆ Enqueue";
    $("sq-pop").textContent = mode === "stack" ? "⬇ Pop" : "⬇ Dequeue";
    $("sq-peek").textContent = mode === "stack" ? "👁 Peek" : "👁 Front";
    render(); updateInfo();
  });
  $("sq-speed").addEventListener("input", () => { $("sq-speed-val").textContent = $("sq-speed").value; });

  render();
  updateInfo();
})();
