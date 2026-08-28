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
        gap: 2px;
        max-width: 420px;
        aspect-ratio: 1;
        padding: 2px;
        background: #354b5e;
    }

    .minesweeper-cell {
        min-width: 0;
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
            statusElement.textContent = "In progress";
            mineCountElement.textContent = `Mines: ${mineTotal}`;
            boardElement.replaceChildren();
            cells = Array.from({ length: size * size }, (_, index) => ({ index, mine: false, count: 0, revealed: false, flagged: false }));
            const mineIndexes = new Set();
            while (mineIndexes.size < mineTotal) mineIndexes.add(Math.floor(Math.random() * cells.length));
            mineIndexes.forEach((index) => { cells[index].mine = true; });
            cells.forEach((cell) => {
                cell.count = neighbours(cell.index).filter((index) => cells[index].mine).length;
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
