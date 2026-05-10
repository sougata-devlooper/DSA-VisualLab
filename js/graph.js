/* ═══════════════════════════════════════════════
   graph.js — Graph Pathfinding Visualizer (BFS, DFS, Dijkstra)
   ═══════════════════════════════════════════════ */
(function () {
  const $ = (id) => document.getElementById(id);
  const gridContainer = $("graph-grid-container");
  let grid = [];
  let rows = 20, cols = 20;
  let startCell = null, endCell = null;
  let running = false, mouseDown = false;

  function setStatus(msg) { $("graph-status").textContent = msg; }
  function getDelay() { const s = parseInt($("graph-speed").value); return Math.max(1, Math.floor(100 - s)); }

  // Cell types: 0=empty, 1=wall, 2=start, 3=end, 4=weight
  function createGrid() {
    rows = cols = parseInt($("graph-grid").value);
    grid = [];
    gridContainer.innerHTML = "";
    gridContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    gridContainer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    for (let r = 0; r < rows; r++) {
      grid[r] = [];
      for (let c = 0; c < cols; c++) {
        const cell = document.createElement("div");
        cell.className = "graph-cell";
        cell.dataset.r = r;
        cell.dataset.c = c;
        grid[r][c] = { type: 0, el: cell, dist: Infinity, prev: null, weight: 1 };
        gridContainer.appendChild(cell);
      }
    }

    // Default start and end
    const sr = Math.floor(rows / 2), sc = 3, er = Math.floor(rows / 2), ec = cols - 4;
    setCell(sr, sc, 2);
    setCell(er, ec, 3);
    startCell = { r: sr, c: sc };
    endCell = { r: er, c: ec };

    $("graph-visited").textContent = "0";
    $("graph-path").textContent = "0";
    $("graph-time").textContent = "0 ms";
  }

  function setCell(r, c, type) {
    const cell = grid[r][c];
    cell.type = type;
    cell.el.className = "graph-cell";
    if (type === 1) cell.el.classList.add("wall");
    else if (type === 2) cell.el.classList.add("start");
    else if (type === 3) cell.el.classList.add("end");
    else if (type === 4) { cell.el.classList.add("weight"); cell.weight = 5; }
  }

  function clearPath() {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = grid[r][c];
        cell.dist = Infinity; cell.prev = null;
        cell.el.classList.remove("visited", "path", "visiting");
      }
    }
    $("graph-visited").textContent = "0";
    $("graph-path").textContent = "0";
  }

  // ── Grid Interaction (mouse) ──
  gridContainer.addEventListener("mousedown", (e) => {
    if (running) return;
    mouseDown = true;
    handleCellClick(e.target);
  });
  gridContainer.addEventListener("mousemove", (e) => {
    if (!mouseDown || running) return;
    handleCellClick(e.target);
  });
  document.addEventListener("mouseup", () => { mouseDown = false; });

  function handleCellClick(el) {
    if (!el.classList.contains("graph-cell")) return;
    const r = parseInt(el.dataset.r), c = parseInt(el.dataset.c);
    const tool = $("graph-tool").value;

    if (tool === "start") {
      if (startCell) setCell(startCell.r, startCell.c, 0);
      setCell(r, c, 2); startCell = { r, c };
    } else if (tool === "end") {
      if (endCell) setCell(endCell.r, endCell.c, 0);
      setCell(r, c, 3); endCell = { r, c };
    } else if (tool === "wall") {
      if (grid[r][c].type === 0) setCell(r, c, 1);
      else if (grid[r][c].type === 1) setCell(r, c, 0);
    } else if (tool === "weight") {
      if (grid[r][c].type === 0) setCell(r, c, 4);
      else if (grid[r][c].type === 4) setCell(r, c, 0);
    }
  }

  // ── Neighbors ──
  function getNeighbors(r, c) {
    const dirs = [[0,1],[1,0],[0,-1],[-1,0]];
    const result = [];
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc].type !== 1) {
        result.push({ r: nr, c: nc });
      }
    }
    return result;
  }

  // ── BFS ──
  async function bfs() {
    const queue = [startCell];
    const visited = new Set();
    visited.add(`${startCell.r},${startCell.c}`);
    grid[startCell.r][startCell.c].dist = 0;
    let visitCount = 0;

    while (queue.length > 0) {
      const { r, c } = queue.shift();
      visitCount++;
      $("graph-visited").textContent = visitCount;

      if (r === endCell.r && c === endCell.c) return true;

      if (grid[r][c].type !== 2 && grid[r][c].type !== 3) {
        grid[r][c].el.classList.add("visited");
      }
      playTone(r * cols + c, 20);
      await new Promise(res => setTimeout(res, getDelay()));

      for (const n of getNeighbors(r, c)) {
        const key = `${n.r},${n.c}`;
        if (!visited.has(key)) {
          visited.add(key);
          grid[n.r][n.c].prev = { r, c };
          grid[n.r][n.c].dist = grid[r][c].dist + 1;
          if (grid[n.r][n.c].type !== 3) grid[n.r][n.c].el.classList.add("visiting");
          queue.push(n);
        }
      }
    }
    return false;
  }

  // ── DFS ──
  async function dfs() {
    const stack = [startCell];
    const visited = new Set();
    grid[startCell.r][startCell.c].dist = 0;
    let visitCount = 0;

    while (stack.length > 0) {
      const { r, c } = stack.pop();
      const key = `${r},${c}`;
      if (visited.has(key)) continue;
      visited.add(key);
      visitCount++;
      $("graph-visited").textContent = visitCount;

      if (r === endCell.r && c === endCell.c) return true;

      if (grid[r][c].type !== 2 && grid[r][c].type !== 3) {
        grid[r][c].el.classList.add("visited");
      }
      playTone(r * cols + c, 20);
      await new Promise(res => setTimeout(res, getDelay()));

      for (const n of getNeighbors(r, c)) {
        const nkey = `${n.r},${n.c}`;
        if (!visited.has(nkey)) {
          grid[n.r][n.c].prev = { r, c };
          grid[n.r][n.c].dist = grid[r][c].dist + 1;
          stack.push(n);
        }
      }
    }
    return false;
  }

  // ── Dijkstra ──
  async function dijkstra() {
    // Simple priority queue using array
    const pq = [{ r: startCell.r, c: startCell.c, dist: 0 }];
    const visited = new Set();
    grid[startCell.r][startCell.c].dist = 0;
    let visitCount = 0;

    while (pq.length > 0) {
      pq.sort((a, b) => a.dist - b.dist);
      const { r, c, dist } = pq.shift();
      const key = `${r},${c}`;
      if (visited.has(key)) continue;
      visited.add(key);
      visitCount++;
      $("graph-visited").textContent = visitCount;

      if (r === endCell.r && c === endCell.c) return true;

      if (grid[r][c].type !== 2 && grid[r][c].type !== 3) {
        grid[r][c].el.classList.add("visited");
      }
      playTone(r * cols + c, 20);
      await new Promise(res => setTimeout(res, getDelay()));

      for (const n of getNeighbors(r, c)) {
        const nkey = `${n.r},${n.c}`;
        if (!visited.has(nkey)) {
          const newDist = dist + grid[n.r][n.c].weight;
          if (newDist < grid[n.r][n.c].dist) {
            grid[n.r][n.c].dist = newDist;
            grid[n.r][n.c].prev = { r, c };
            pq.push({ r: n.r, c: n.c, dist: newDist });
          }
        }
      }
    }
    return false;
  }

  // ── Trace Path ──
  async function tracePath() {
    const path = [];
    let curr = endCell;
    while (curr) {
      path.unshift(curr);
      curr = grid[curr.r][curr.c].prev;
    }
    $("graph-path").textContent = path.length;
    for (const p of path) {
      if (grid[p.r][p.c].type !== 2 && grid[p.r][p.c].type !== 3) {
        grid[p.r][p.c].el.classList.add("path");
      }
      playTone(50, 15);
      await new Promise(r => setTimeout(r, 30));
    }
  }

  // ── Maze Generation (recursive backtracking) ──
  async function generateMaze() {
    if (running) return;
    running = true;
    // Fill all walls first
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        setCell(r, c, 1);

    // Carve paths using DFS
    const visited = new Set();
    const stack = [{ r: 1, c: 1 }];
    setCell(1, 1, 0);
    visited.add("1,1");

    while (stack.length > 0) {
      const { r, c } = stack[stack.length - 1];
      const dirs = [[0,2],[2,0],[0,-2],[-2,0]].sort(() => Math.random() - 0.5);
      let found = false;

      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr > 0 && nr < rows - 1 && nc > 0 && nc < cols - 1 && !visited.has(`${nr},${nc}`)) {
          visited.add(`${nr},${nc}`);
          setCell(r + dr / 2, c + dc / 2, 0); // wall between
          setCell(nr, nc, 0);
          stack.push({ r: nr, c: nc });
          found = true;
          await new Promise(res => setTimeout(res, 5));
          break;
        }
      }
      if (!found) stack.pop();
    }

    // Reset start and end
    const sr = 1, sc = 1, er = rows - 2, ec = cols - 2;
    setCell(sr, sc, 2); startCell = { r: sr, c: sc };
    setCell(er, ec, 3); endCell = { r: er, c: ec };
    setStatus("Maze generated! Click Visualize to find the path.");
    running = false;
  }

  // ── Run Algorithm ──
  async function run() {
    if (running) return;
    if (!startCell || !endCell) { setStatus("⚠️ Place start and end points first."); return; }
    running = true;
    clearPath();
    $("graph-start").disabled = true; $("graph-reset").disabled = false;
    const algo = $("graph-algo").value;
    const startTime = Date.now();
    setStatus(`Running ${algo.toUpperCase()}…`);

    const ALGOS = { bfs, dfs, dijkstra };
    const found = await ALGOS[algo]();

    $("graph-time").textContent = (Date.now() - startTime) + " ms";
    if (found) {
      setStatus(`✅ Path found! Tracing…`);
      await tracePath();
      setStatus(`✅ ${algo.toUpperCase()} complete — path length: ${$("graph-path").textContent}`);
    } else {
      setStatus(`❌ No path found.`);
    }
    running = false;
    $("graph-start").disabled = false;
  }

  function clearWalls() {
    if (running) return;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        if (grid[r][c].type === 1 || grid[r][c].type === 4) setCell(r, c, 0);
    clearPath();
    setStatus("Walls cleared.");
  }

  function reset() {
    running = false;
    createGrid();
    setStatus("Grid reset. Place start/end, draw walls, then visualize!");
  }

  function updateInfo() {
    $("graph-info").innerHTML = `<h3>Graph Pathfinding</h3>
      <p><strong>BFS:</strong> Explores level by level using a queue. Guarantees shortest path in unweighted graphs. Time O(V+E), Space O(V).</p>
      <p><strong>DFS:</strong> Explores as deep as possible using a stack. Does NOT guarantee shortest path. Time O(V+E), Space O(V).</p>
      <p><strong>Dijkstra:</strong> Finds shortest path in weighted graphs using a priority queue. Always picks the closest unvisited node. Time O(V² or V log V with heap).</p>
      <p><strong>Tools:</strong> Place Start (green) and End (red) points. Draw walls (grey) to create obstacles. Add weights (purple) for Dijkstra — weighted cells cost 5x more to traverse.</p>`;
  }

  // Events
  $("graph-start").addEventListener("click", run);
  $("graph-maze").addEventListener("click", generateMaze);
  $("graph-clear-walls").addEventListener("click", clearWalls);
  $("graph-reset").addEventListener("click", reset);
  $("graph-grid").addEventListener("input", () => {
    $("graph-grid-val").textContent = $("graph-grid").value;
    $("graph-grid-val2").textContent = $("graph-grid").value;
    if (!running) createGrid();
  });
  $("graph-speed").addEventListener("input", () => { $("graph-speed-val").textContent = $("graph-speed").value; });

  createGrid();
  updateInfo();
})();
