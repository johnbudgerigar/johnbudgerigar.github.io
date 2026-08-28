[Back home](index.md)

# Projects:
## Project 1: Pygame ball physics
<iframe src="https://drive.google.com/file/d/1qkxndQWLZGwugsT9RIgLM-NNatp-nrVU/preview" width="640" height="480" allow="autoplay"></iframe>
This is a cool project in pygame with physics! You can apply an impulse to a ball and watch it bounce around the window. It has gravity and elasticity.

<details markdown="1">
  <summary>Source code</summary>

There may be issues with the code formatting, I apologize for not being able to resolve it!

```python
import pygame

GRAVITY = 300
ELASTICITY = 0.8
BALL_RADIUS = 40
IMPULSE = 300

SCREEN_BOUNDS_X = 1280
SCREEN_BOUNDS_Y = 720

pygame.init()
screen = pygame.display.set_mode((SCREEN_BOUNDS_X, SCREEN_BOUNDS_Y))
clock = pygame.time.Clock()

font = pygame.font.Font(None, 36)

running = True
dt = 0

ball_pos = pygame.Vector2(
    screen.get_width() / 2,
    screen.get_height() / 2
)

xVelocity = 0
yVelocity = 0

while running:

    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    screen.fill("purple")

    # physics
    # gravity changes velocity
    yVelocity += GRAVITY * dt

    # Velocity changes position
    ball_pos.x += xVelocity * dt
    ball_pos.y += yVelocity * dt

    # account for the ball size
    floor = SCREEN_BOUNDS_Y - BALL_RADIUS

    # ceiling
    if ball_pos.y <= BALL_RADIUS:
        print("ball hit ceiling!")
        ball_pos.y = BALL_RADIUS
        yVelocity = -yVelocity * ELASTICITY

    # floor
    if ball_pos.y >= SCREEN_BOUNDS_Y - BALL_RADIUS:
        print("ball hit floor!")
        ball_pos.y = SCREEN_BOUNDS_Y - BALL_RADIUS
        yVelocity = -yVelocity * ELASTICITY

    # left wall
    if ball_pos.x <= BALL_RADIUS:
        print("ball hit LEFT wall!")
        ball_pos.x = BALL_RADIUS
        xVelocity = -xVelocity * ELASTICITY

    # right wall
    if ball_pos.x >= SCREEN_BOUNDS_X - BALL_RADIUS:
        print("ball hit RIGHT wall!")
        ball_pos.x = SCREEN_BOUNDS_X - BALL_RADIUS
        xVelocity = -xVelocity * ELASTICITY

    pygame.draw.circle(
        screen,
        "red",
        ball_pos,
        BALL_RADIUS
    )

    velocity_text = font.render(
        f"X Velocity: {xVelocity:.2f}  Y Velocity: {yVelocity:.2f}",
        True,
        "white"
    )

    keys = pygame.key.get_pressed()
    if keys[pygame.K_w]:
        print("upper impulse applied")
        yVelocity -= IMPULSE
    if keys[pygame.K_s]:
        print("lower impulse applied")
        yVelocity += IMPULSE
    if keys[pygame.K_a]:
        print("left impulse applied")
        xVelocity -= IMPULSE
    if keys[pygame.K_d]:
        print("right impulse applied")
        xVelocity += IMPULSE

    screen.blit(velocity_text, (10, 10))

    pygame.display.flip()

    dt = clock.tick(60) / 1000

pygame.quit()
```
</details>

## Project 2: JavaScript Minesweeper

<div class="minesweeper-project">
    <p>Clear the board without clicking a mine. Numbers show how many mines touch each square.</p>
    <div class="minesweeper-toolbar">
        <span id="mine-count" aria-live="polite">Mines: 10</span>
        <button id="new-game" type="button">New game</button>
        <span id="game-status" aria-live="polite">Ready</span>
    </div>
    <div id="minesweeper-board" class="minesweeper-board" role="grid" aria-label="Minesweeper board"></div>
</div>

<style>
    .minesweeper-project {
        max-width: 520px;
        padding: 1rem;
        border: 1px solid #c7d0d9;
        border-radius: 8px;
        background: #eef3f6;
    }

    .minesweeper-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        margin: 1rem 0;
        font-weight: 700;
    }

    .minesweeper-toolbar button {
        padding: 0.45rem 0.8rem;
        border: 1px solid #354b5e;
        border-radius: 4px;
        color: #fff;
        background: #354b5e;
        cursor: pointer;
    }

    .minesweeper-board {
        display: grid;
        grid-template-columns: repeat(10, minmax(0, 1fr));
        grid-template-rows: repeat(10, minmax(0, 1fr));
        gap: 2px;
        width: min(100%, 420px);
        max-width: 420px;
        aspect-ratio: 1;
        padding: 2px;
        background: #354b5e;
    }

    .minesweeper-cell {
        min-width: 0;
        min-height: 0;
        width: 100%;
        height: 100%;
        padding: 0;
        border: 0;
        color: #203040;
        background: #d8e1e8;
        font: 700 1rem/1 sans-serif;
        cursor: pointer;
    }

    .minesweeper-cell:hover,
    .minesweeper-cell:focus-visible {
        background: #b9ccd8;
        outline: 2px solid #d17a22;
        outline-offset: -2px;
    }

    .minesweeper-cell.revealed {
        background: #fff;
        cursor: default;
    }

    .minesweeper-cell.mine {
        background: #d86b5d;
    }

    .minesweeper-cell.flagged {
        color: #d17a22;
    }

    @media (max-width: 560px) {
        .minesweeper-toolbar {
            flex-wrap: wrap;
        }
    }
</style>

<script>
    (() => {
        const boardElement = document.getElementById("minesweeper-board");
        const mineCountElement = document.getElementById("mine-count");
        const statusElement = document.getElementById("game-status");
        const newGameButton = document.getElementById("new-game");
        const size = 10;
        const mineTotal = 10;
        let cells = [];
        let gameOver = false;
        let minesPlaced = false;

        function neighbours(index) {
            const row = Math.floor(index / size);
            const column = index % size;
            const result = [];
            for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
                for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
                    const neighbourRow = row + rowOffset;
                    const neighbourColumn = column + columnOffset;
                    if (neighbourRow >= 0 && neighbourRow < size && neighbourColumn >= 0 && neighbourColumn < size) {
                        const neighbourIndex = neighbourRow * size + neighbourColumn;
                        if (neighbourIndex !== index) result.push(neighbourIndex);
                    }
                }
            }
            return result;
        }

        function reveal(index) {
            const cell = cells[index];
            if (gameOver || cell.revealed || cell.flagged) return;
            if (!minesPlaced) placeMines(index);
            cell.revealed = true;
            cell.element.classList.add("revealed");
            cell.element.disabled = true;
            if (cell.mine) {
                gameOver = true;
                statusElement.textContent = "Game over";
                cells.forEach((item) => {
                    if (item.mine) {
                        item.element.textContent = "*";
                        item.element.classList.add("mine", "revealed");
                    }
                });
                return;
            }
            if (cell.count > 0) {
                cell.element.textContent = cell.count;
            } else {
                neighbours(index).forEach(reveal);
            }
            const safeCells = cells.filter((item) => !item.mine);
            if (safeCells.every((item) => item.revealed)) {
                gameOver = true;
                statusElement.textContent = "You win!";
                cells.forEach((item) => {
                    if (item.mine && !item.flagged) toggleFlag(item);
                });
            }
        }

        function placeMines(firstIndex) {
            const protectedCells = new Set([firstIndex, ...neighbours(firstIndex)]);
            const mineIndexes = new Set();
            while (mineIndexes.size < mineTotal) {
                const candidate = Math.floor(Math.random() * cells.length);
                if (!protectedCells.has(candidate)) mineIndexes.add(candidate);
            }
            mineIndexes.forEach((mineIndex) => { cells[mineIndex].mine = true; });
            cells.forEach((item) => {
                item.count = neighbours(item.index).filter((neighbourIndex) => cells[neighbourIndex].mine).length;
            });
            minesPlaced = true;
        }

        function toggleFlag(cell) {
            if (cell.revealed || gameOver) return;
            cell.flagged = !cell.flagged;
            cell.element.textContent = cell.flagged ? "!" : "";
            cell.element.classList.toggle("flagged", cell.flagged);
            const flags = cells.filter((item) => item.flagged).length;
            mineCountElement.textContent = `Mines: ${mineTotal - flags}`;
        }

        function startGame() {
            gameOver = false;
            minesPlaced = false;
            statusElement.textContent = "Click a tile to begin";
            mineCountElement.textContent = `Mines: ${mineTotal}`;
            boardElement.replaceChildren();
            cells = Array.from({ length: size * size }, (_, index) => ({ index, mine: false, count: 0, revealed: false, flagged: false }));
            cells.forEach((cell) => {
                const button = document.createElement("button");
                button.className = "minesweeper-cell";
                button.type = "button";
                button.setAttribute("role", "gridcell");
                button.setAttribute("aria-label", `Row ${Math.floor(cell.index / size) + 1}, column ${(cell.index % size) + 1}`);
                button.addEventListener("click", () => reveal(cell.index));
                button.addEventListener("contextmenu", (event) => { event.preventDefault(); toggleFlag(cell); });
                cell.element = button;
                boardElement.appendChild(button);
            });
        }

        newGameButton.addEventListener("click", startGame);
        startGame();
    })();
</script>

## Project 3: A* Pathfinding Studio

<div class="astar-project">
    <div class="astar-heading">
        <div>
            <p class="astar-kicker">Pathfinding lab</p>
            <h3>Explore a route, one decision at a time</h3>
            <p>Paint a landscape, tune the algorithm, and watch A* search for the lowest-cost route.</p>
        </div>
        <span class="astar-badge">A*</span>
    </div>
    <div class="astar-layout">
        <div id="astar-board" class="astar-board" role="grid" aria-label="A star pathfinding grid"></div>
        <div class="astar-controls">
            <div class="astar-control-group">
                <label>Paint tool</label>
                <div class="astar-tools">
                    <button class="astar-tool active" data-tool="wall" type="button">Wall</button>
                    <button class="astar-tool" data-tool="start" type="button">Start</button>
                    <button class="astar-tool" data-tool="goal" type="button">Goal</button>
                    <button class="astar-tool" data-tool="erase" type="button">Erase</button>
                </div>
            </div>
            <div class="astar-control-group astar-fields">
                <label for="astar-columns">Grid size</label>
                <div>
                    <input id="astar-columns" type="number" min="12" max="32" value="24" aria-label="Columns">
                    <span>x</span>
                    <input id="astar-rows" type="number" min="8" max="20" value="14" aria-label="Rows">
                </div>
            </div>
            <div class="astar-control-group">
                <label for="astar-speed">Simulation speed <output id="astar-speed-value">60 ms</output></label>
                <input id="astar-speed" type="range" min="15" max="240" value="60">
            </div>
            <div class="astar-control-group">
                <label for="astar-display">Calculation display</label>
                <select id="astar-display">
                    <option value="path">Strongest path only</option>
                    <option value="all">Show all calculations</option>
                </select>
            </div>
            <label class="astar-check"><input id="astar-diagonal" type="checkbox"> Allow diagonal movement</label>
            <div class="astar-actions">
                <button id="astar-start" class="astar-primary" type="button">Start simulation</button>
                <button id="astar-pause" type="button">Pause</button>
                <button id="astar-resume" type="button">Resume</button>
                <button id="astar-end" type="button">End simulation</button>
                <button id="astar-clear" type="button">Clear walls</button>
            </div>
            <p id="astar-status" class="astar-status" aria-live="polite">Ready to paint your grid.</p>
            <div class="astar-legend"><span class="legend-wall"></span>Wall <span class="legend-search"></span>Search <span class="legend-path"></span>Path</div>
        </div>
    </div>
</div>

<style>
    .astar-project {
        --ink: #18242d;
        --muted: #687783;
        --line: #7f8c98;
        --panel: #d7dce2;
        --teal: #245a87;
        --orange: #8a4f21;
        margin: 1rem 0 2rem;
        padding: 0.5rem;
        border: 2px outset #f5f5f5;
        border-radius: 0;
        color: var(--ink);
        background: #c5ccd4;
        font-family: "Trebuchet MS", Tahoma, sans-serif;
    }

    .astar-heading { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; }
    .astar-heading h3 { margin: 0.1rem 0 0.4rem; font-size: 1.35rem; }
    .astar-heading p { margin: 0; color: var(--muted); }
    .astar-kicker { color: var(--teal) !important; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
    .astar-badge { padding: 0.25rem 0.5rem; border: 2px outset #f5f5f5; color: #fff; background: var(--teal); font-weight: 800; }
    .astar-layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(210px, 260px); gap: 1.25rem; margin-top: 1.5rem; }
    .astar-board { display: grid; gap: 0; width: 100%; min-width: 0; aspect-ratio: 24 / 14; padding: 0; border: 2px inset #f5f5f5; background: #fff; }
    .astar-cell { min-width: 0; min-height: 0; width: 100%; height: 100%; padding: 0; border: 0; outline: 1px solid #c8d0d8; outline-offset: -1px; background: #fff; cursor: crosshair; }
    .astar-cell.wall { background: #263641; }
    .astar-cell.start { background: #e08b4f; box-shadow: inset 0 0 0 3px #fff; }
    .astar-cell.goal { background: #147d78; box-shadow: inset 0 0 0 3px #fff; }
    .astar-cell.open { background: #c5d9ed; }
    .astar-cell.open { opacity: 0.72; }
    .astar-cell.closed { background: #9db8d1; opacity: 0.56; }
    .astar-cell.explored { background: #e0e8f0; opacity: 0.42; }
    .astar-cell.path { background: #d99558; }
    .astar-controls { display: flex; flex-direction: column; gap: 0.75rem; padding: 0.65rem; border: 2px inset #f5f5f5; background: var(--panel); }
    .astar-control-group { display: flex; flex-direction: column; gap: 0.4rem; }
    .astar-control-group > label, .astar-check { color: var(--muted); font-size: 0.78rem; font-weight: 800; text-transform: uppercase; }
    .astar-control-group output { float: right; color: var(--teal); text-transform: none; }
    .astar-tools { display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem; }
    .astar-project button, .astar-project input, .astar-project select { font: inherit; }
    .astar-project button { padding: 0.4rem 0.55rem; border: 2px outset #f5f5f5; border-radius: 0; color: var(--ink); background: #d7dce2; cursor: pointer; }
    .astar-project button:hover, .astar-project button.active { border-style: inset; color: #fff; background: var(--teal); }
    .astar-project input[type="number"], .astar-project select { box-sizing: border-box; width: 100%; padding: 0.35rem; border: 2px inset #f5f5f5; border-radius: 0; background: #fff; }
    .astar-fields > div { display: flex; align-items: center; gap: 0.4rem; }
    .astar-fields input { width: 5rem !important; }
    .astar-check { display: flex; align-items: center; gap: 0.5rem; text-transform: none; }
    .astar-check input { accent-color: var(--teal); }
    .astar-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
    .astar-project button.astar-primary { border-color: var(--orange); color: #fff; background: var(--orange); }
    .astar-project button.astar-primary:hover { border-color: #653815; background: #653815; }
    .astar-status { min-height: 2.5rem; margin: 0; padding-top: 0.75rem; border-top: 1px solid var(--line); color: var(--muted); font-size: 0.85rem; }
    .astar-legend { display: flex; flex-wrap: wrap; gap: 0.65rem; color: var(--muted); font-size: 0.72rem; }
    .astar-legend span { display: inline-block; width: 0.8rem; height: 0.8rem; margin-right: -0.45rem; border-radius: 2px; }
    .legend-wall { background: #263641; } .legend-search { background: #a9cfca; } .legend-path { background: #e08b4f; }
    @media (max-width: 700px) { .astar-layout { grid-template-columns: 1fr; } .astar-controls { order: -1; } }
</style>

<script>
    (() => {
        const board = document.getElementById("astar-board");
        const status = document.getElementById("astar-status");
        const columnsInput = document.getElementById("astar-columns");
        const rowsInput = document.getElementById("astar-rows");
        const speedInput = document.getElementById("astar-speed");
        const speedValue = document.getElementById("astar-speed-value");
        const displayInput = document.getElementById("astar-display");
        const diagonalInput = document.getElementById("astar-diagonal");
        let columns = 24;
        let rows = 14;
        let grid = [];
        let tool = "wall";
        let running = false;
        let painting = false;
        let paused = false;
        let timerId = null;
        let runToken = 0;
        let resumeSearch = null;

        function index(row, column) { return row * columns + column; }
        function neighbours(node) {
            const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            if (diagonalInput.checked) directions.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
            return directions.map(([rowOffset, columnOffset]) => [node.row + rowOffset, node.column + columnOffset])
                .filter(([row, column]) => row >= 0 && row < rows && column >= 0 && column < columns)
                .map(([row, column]) => grid[index(row, column)]);
        }
        function render() {
            board.style.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
            board.style.gridTemplateRows = `repeat(${rows}, minmax(0, 1fr))`;
            board.style.aspectRatio = `${columns} / ${rows}`;
            board.replaceChildren();
            grid.forEach((node) => {
                const cell = document.createElement("button");
                cell.className = `astar-cell ${node.type}`;
                cell.type = "button";
                cell.setAttribute("role", "gridcell");
                cell.setAttribute("aria-label", `${node.type || "open"}, row ${node.row + 1}, column ${node.column + 1}`);
                cell.addEventListener("pointerdown", (event) => { event.preventDefault(); painting = true; paint(node); });
                cell.addEventListener("pointerenter", () => { if (painting) paint(node); });
                node.element = cell;
                board.appendChild(cell);
            });
            board.onpointerup = () => { painting = false; };
        }
        function createGrid() {
            columns = Math.max(12, Math.min(32, Number(columnsInput.value) || 24));
            rows = Math.max(8, Math.min(20, Number(rowsInput.value) || 14));
            columnsInput.value = columns; rowsInput.value = rows;
            grid = Array.from({ length: rows * columns }, (_, cellIndex) => ({ row: Math.floor(cellIndex / columns), column: cellIndex % columns, type: "" }));
            grid[index(Math.floor(rows / 2), 2)].type = "start";
            grid[index(Math.floor(rows / 2), columns - 3)].type = "goal";
            render();
        }
        function paint(node) {
            if (running) return;
            if (tool === "start" || tool === "goal") grid.filter((item) => item.type === tool).forEach((item) => { item.type = ""; updateNode(item); });
            node.type = tool === "erase" ? "" : tool;
            updateNode(node);
        }
        function updateNode(node) {
            node.element.className = `astar-cell ${node.type}`;
            node.element.setAttribute("aria-label", `${node.type || "open"}, row ${node.row + 1}, column ${node.column + 1}`);
        }
        function heuristic(first, second) {
            const rowDistance = Math.abs(first.row - second.row);
            const columnDistance = Math.abs(first.column - second.column);
            if (!diagonalInput.checked) return rowDistance + columnDistance;
            const diagonalDistance = Math.min(rowDistance, columnDistance);
            return rowDistance + columnDistance + (Math.SQRT2 - 2) * diagonalDistance;
        }
        function clearSearch() {
            grid.forEach((node) => {
                node.element.classList.remove("open", "closed", "explored", "path");
                node.element.style.opacity = "";
            });
        }
        function runSearch() {
            if (running) return;
            const start = grid.find((node) => node.type === "start");
            const goal = grid.find((node) => node.type === "goal");
            if (!start || !goal) { status.textContent = "Add both a start and a goal first."; return; }
            running = true; paused = false; runToken += 1; clearSearch(); status.textContent = "Calculating the route...";
            const thisRun = runToken;
            const open = [start]; const closed = new Set(); const cameFrom = new Map(); const cost = new Map([[start, 0]]); const visited = [];
            function tick() {
                if (thisRun !== runToken || paused) return;
                if (!open.length) { running = false; status.textContent = "No route found through this landscape."; return; }
                open.sort((first, second) => (cost.get(first) + heuristic(first, goal)) - (cost.get(second) + heuristic(second, goal)));
                const current = open.shift(); visited.push(current);
                if (current === goal) { showPath(cameFrom, goal); return; }
                closed.add(current);
                if (displayInput.value === "all") current.element.classList.add("closed");
                neighbours(current).forEach((next) => {
                    if (next.type === "wall" || closed.has(next)) return;
                    const nextCost = cost.get(current) + ((next.row !== current.row && next.column !== current.column) ? 1.4 : 1);
                    if (!cost.has(next) || nextCost < cost.get(next)) {
                        cost.set(next, nextCost); cameFrom.set(next, current);
                        if (!open.includes(next)) { open.push(next); if (displayInput.value === "all") next.element.classList.add("open"); }
                    }
                });
                if (displayInput.value === "all") visited.forEach((node) => node.element.classList.add("explored"));
                timerId = setTimeout(tick, Number(speedInput.value));
            }
            function showPath(cameFrom, current) {
                const path = [];
                while (current) { path.unshift(current); current = cameFrom.get(current); }
                path.forEach((node, pathIndex) => setTimeout(() => { if (thisRun === runToken) node.element.classList.add("path"); }, pathIndex * 35));
                timerId = setTimeout(() => { if (thisRun === runToken) { running = false; status.textContent = `Route found in ${path.length - 1} steps.`; } }, path.length * 35);
            }
            resumeSearch = tick;
            tick();
        }
        document.querySelectorAll(".astar-tool").forEach((button) => button.addEventListener("click", () => { document.querySelectorAll(".astar-tool").forEach((item) => item.classList.remove("active")); button.classList.add("active"); tool = button.dataset.tool; }));
        document.getElementById("astar-start").addEventListener("click", runSearch);
        document.getElementById("astar-pause").addEventListener("click", () => { if (running && !paused) { paused = true; clearTimeout(timerId); status.textContent = "Simulation paused."; } });
        document.getElementById("astar-resume").addEventListener("click", () => { if (running && paused && resumeSearch) { paused = false; status.textContent = "Calculating the route..."; resumeSearch(); } });
        document.getElementById("astar-end").addEventListener("click", () => { if (running) { runToken += 1; clearTimeout(timerId); running = false; paused = false; clearSearch(); status.textContent = "Simulation ended."; } });
        document.getElementById("astar-clear").addEventListener("click", () => { grid.forEach((node) => { if (node.type === "wall") node.type = ""; }); render(); status.textContent = "Walls cleared."; });
        columnsInput.addEventListener("change", createGrid); rowsInput.addEventListener("change", createGrid);
        speedInput.addEventListener("input", () => { speedValue.textContent = `${speedInput.value} ms`; });
        createGrid();
    })();
</script>
