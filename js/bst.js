/* ═══════════════════════════════════════════════
   bst.js — Binary Search Tree Visualizer (Canvas)
   ═══════════════════════════════════════════════ */
(function () {
  const $ = (id) => document.getElementById(id);
  const canvas = $("bst-canvas");
  const ctx = canvas.getContext("2d");
  let animating = false;

  // BST Node class
  class BSTNode {
    constructor(val) { this.val = val; this.left = null; this.right = null; this.x = 0; this.y = 0; this.highlight = false; this.found = false; }
  }

  let root = null;
  let nodeCount = 0;

  function setStatus(msg) { $("bst-status").textContent = msg; }
  function getDelay() { const s = parseInt($("bst-speed").value); return Math.max(50, 500 - s * 4.5); }

  function getHeight(node) {
    if (!node) return 0;
    return 1 + Math.max(getHeight(node.left), getHeight(node.right));
  }

  function updateStats() {
    $("bst-nodes").textContent = nodeCount;
    $("bst-height").textContent = getHeight(root);
    $("bst-root").textContent = root ? root.val : "—";
  }

  // ── Insert (no animation) ──
  function insertNode(val) {
    const node = new BSTNode(val);
    if (!root) { root = node; nodeCount++; return; }
    let curr = root;
    while (true) {
      if (val < curr.val) {
        if (!curr.left) { curr.left = node; nodeCount++; return; }
        curr = curr.left;
      } else if (val > curr.val) {
        if (!curr.right) { curr.right = node; nodeCount++; return; }
        curr = curr.right;
      } else { return; } // duplicate
    }
  }

  // ── Delete ──
  function findMin(node) { while (node.left) node = node.left; return node; }
  function deleteNode(node, val) {
    if (!node) return null;
    if (val < node.val) node.left = deleteNode(node.left, val);
    else if (val > node.val) node.right = deleteNode(node.right, val);
    else {
      if (!node.left) { nodeCount--; return node.right; }
      if (!node.right) { nodeCount--; return node.left; }
      const succ = findMin(node.right);
      node.val = succ.val;
      node.right = deleteNode(node.right, succ.val);
    }
    return node;
  }

  // ── Position Calculation ──
  function assignPositions(node, x, y, spread) {
    if (!node) return;
    node.x = x;
    node.y = y;
    assignPositions(node.left, x - spread, y + 70, spread * 0.55);
    assignPositions(node.right, x + spread, y + 70, spread * 0.55);
  }

  // ── Drawing ──
  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = Math.max(380, rect.height);
  }

  function draw() {
    resizeCanvas();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!root) {
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--text-muted").trim();
      ctx.font = "14px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Tree is empty. Insert values to build a BST.", canvas.width / 2, canvas.height / 2);
      return;
    }
    const spread = Math.min(canvas.width * 0.35, 280);
    assignPositions(root, canvas.width / 2, 45, spread);
    drawNode(root);
  }

  function drawNode(node) {
    if (!node) return;
    const style = getComputedStyle(document.documentElement);

    // Draw edges first
    if (node.left) {
      ctx.beginPath(); ctx.moveTo(node.x, node.y); ctx.lineTo(node.left.x, node.left.y);
      ctx.strokeStyle = style.getPropertyValue("--arrow-color").trim(); ctx.lineWidth = 2; ctx.stroke();
    }
    if (node.right) {
      ctx.beginPath(); ctx.moveTo(node.x, node.y); ctx.lineTo(node.right.x, node.right.y);
      ctx.strokeStyle = style.getPropertyValue("--arrow-color").trim(); ctx.lineWidth = 2; ctx.stroke();
    }

    // Draw children
    if (node.left) drawNode(node.left);
    if (node.right) drawNode(node.right);

    // Draw node circle
    const radius = 22;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
    if (node.found) {
      ctx.fillStyle = style.getPropertyValue("--color-sorted").trim();
      ctx.shadowColor = "rgba(52,211,153,.5)"; ctx.shadowBlur = 12;
    } else if (node.highlight) {
      ctx.fillStyle = style.getPropertyValue("--color-compare").trim();
      ctx.shadowColor = "rgba(250,204,21,.5)"; ctx.shadowBlur = 12;
    } else {
      ctx.fillStyle = style.getPropertyValue("--node-bg").trim();
      ctx.shadowColor = "transparent"; ctx.shadowBlur = 0;
    }
    ctx.fill();
    ctx.strokeStyle = node.found ? style.getPropertyValue("--color-sorted").trim() :
                      node.highlight ? style.getPropertyValue("--color-compare").trim() :
                      style.getPropertyValue("--node-border").trim();
    ctx.lineWidth = 2; ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw value
    ctx.fillStyle = node.highlight || node.found ? "#000" : style.getPropertyValue("--node-text").trim();
    ctx.font = "bold 13px 'JetBrains Mono', monospace";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(node.val, node.x, node.y);
  }

  // ── Animated Operations ──
  function clearHighlights(node) {
    if (!node) return;
    node.highlight = false; node.found = false;
    clearHighlights(node.left);
    clearHighlights(node.right);
  }

  async function animatedInsert() {
    if (animating) return;
    const val = parseInt($("bst-value").value);
    if (isNaN(val)) { setStatus("⚠️ Enter a valid number."); return; }
    animating = true;
    clearHighlights(root);

    // Traverse to find insertion point
    let curr = root;
    while (curr) {
      curr.highlight = true; draw();
      setStatus(`Comparing ${val} with ${curr.val}`);
      playTone(curr.val);
      await new Promise(r => setTimeout(r, getDelay()));
      curr.highlight = false;
      if (val < curr.val) curr = curr.left;
      else if (val > curr.val) curr = curr.right;
      else { setStatus(`⚠️ ${val} already exists.`); draw(); animating = false; return; }
    }

    insertNode(val);
    updateStats(); draw();
    setStatus(`✅ Inserted ${val}`);
    playTone(val);
    $("bst-value").value = "";
    animating = false;
  }

  async function animatedSearch() {
    if (animating) return;
    const val = parseInt($("bst-value").value);
    if (isNaN(val)) { setStatus("⚠️ Enter a value to search."); return; }
    animating = true;
    clearHighlights(root);

    let curr = root;
    while (curr) {
      curr.highlight = true; draw();
      setStatus(`Comparing ${val} with ${curr.val}`);
      playTone(curr.val);
      await new Promise(r => setTimeout(r, getDelay()));
      if (val === curr.val) {
        curr.highlight = false; curr.found = true; draw();
        setStatus(`✅ Found ${val}!`);
        animating = false; return;
      }
      curr.highlight = false;
      curr = val < curr.val ? curr.left : curr.right;
    }
    draw();
    setStatus(`❌ ${val} not found.`);
    animating = false;
  }

  async function animatedDelete() {
    if (animating) return;
    const val = parseInt($("bst-value").value);
    if (isNaN(val)) { setStatus("⚠️ Enter a value to delete."); return; }
    animating = true;
    clearHighlights(root);

    // Highlight path
    let curr = root;
    while (curr) {
      curr.highlight = true; draw();
      setStatus(`Looking for ${val} at node ${curr.val}`);
      playTone(curr.val);
      await new Promise(r => setTimeout(r, getDelay()));
      curr.highlight = false;
      if (val === curr.val) break;
      curr = val < curr.val ? curr.left : curr.right;
    }

    if (!curr) { draw(); setStatus(`❌ ${val} not found.`); animating = false; return; }

    root = deleteNode(root, val);
    updateStats(); draw();
    setStatus(`✅ Deleted ${val}`);
    $("bst-value").value = "";
    animating = false;
  }

  // ── Traversals ──
  async function traverse() {
    if (animating) return;
    if (!root) { setStatus("Tree is empty."); return; }
    animating = true;
    clearHighlights(root);
    const type = $("bst-traversal").value;
    const order = [];

    async function visit(node) {
      if (!node) return;
      if (type === "preorder") { node.highlight = true; draw(); order.push(node.val); playTone(node.val); setStatus(`Visiting ${node.val} — Order: [${order.join(", ")}]`); await new Promise(r => setTimeout(r, getDelay())); node.highlight = false; node.found = true; }
      await visit(node.left);
      if (type === "inorder") { node.highlight = true; draw(); order.push(node.val); playTone(node.val); setStatus(`Visiting ${node.val} — Order: [${order.join(", ")}]`); await new Promise(r => setTimeout(r, getDelay())); node.highlight = false; node.found = true; }
      await visit(node.right);
      if (type === "postorder") { node.highlight = true; draw(); order.push(node.val); playTone(node.val); setStatus(`Visiting ${node.val} — Order: [${order.join(", ")}]`); await new Promise(r => setTimeout(r, getDelay())); node.highlight = false; node.found = true; }
    }

    async function levelOrder() {
      const queue = [root];
      while (queue.length) {
        const node = queue.shift();
        node.highlight = true; draw(); order.push(node.val); playTone(node.val);
        setStatus(`Visiting ${node.val} — Order: [${order.join(", ")}]`);
        await new Promise(r => setTimeout(r, getDelay()));
        node.highlight = false; node.found = true;
        if (node.left) queue.push(node.left);
        if (node.right) queue.push(node.right);
      }
    }

    if (type === "levelorder") await levelOrder();
    else await visit(root);

    draw();
    setStatus(`✅ ${type.replace("order"," Order")} traversal: [${order.join(", ")}]`);
    animating = false;
  }

  function randomTree() {
    root = null; nodeCount = 0;
    const count = 7 + Math.floor(Math.random() * 8);
    const vals = new Set();
    while (vals.size < count) vals.add(Math.floor(Math.random() * 99) + 1);
    vals.forEach(v => insertNode(v));
    updateStats(); draw();
    setStatus(`Random tree with ${count} nodes created.`);
  }

  function clear() {
    root = null; nodeCount = 0;
    updateStats(); draw();
    setStatus("Tree cleared.");
  }

  function updateInfo() {
    $("bst-info").innerHTML = `<h3>Binary Search Tree</h3>
      <p><strong>How:</strong> A BST is a tree where each node's left children are smaller and right children are larger. This property enables efficient searching, insertion, and deletion.</p>
      <p><strong>Operations:</strong> Search O(log n) avg / O(n) worst. Insert O(log n) avg. Delete O(log n) avg. Traversals O(n).</p>
      <p><strong>Traversals:</strong> In-Order (Left→Root→Right) gives sorted order. Pre-Order (Root→Left→Right) for copying. Post-Order (Left→Right→Root) for deletion. Level-Order uses BFS.</p>`;
  }

  // Global redraw function for theme changes
  window.bstRedraw = draw;

  // Events
  $("bst-insert").addEventListener("click", animatedInsert);
  $("bst-search").addEventListener("click", animatedSearch);
  $("bst-delete").addEventListener("click", animatedDelete);
  $("bst-traverse").addEventListener("click", traverse);
  $("bst-random").addEventListener("click", randomTree);
  $("bst-clear").addEventListener("click", clear);
  $("bst-speed").addEventListener("input", () => { $("bst-speed-val").textContent = $("bst-speed").value; });
  window.addEventListener("resize", () => { if (root) draw(); });

  draw();
  updateInfo();
})();
