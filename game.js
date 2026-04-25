const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const helpBox = document.getElementById("helpBox");
const restartBtn = document.getElementById("restartBtn");

// ----- Scaling knobs -----
const TILE_SIZE = 44;

const START_COLS = 9;
const START_ROWS = 9;
const START_MINES = 10;

const MINES_PER_LEVEL = 2;
const EXTRA_COL_EVERY_N_LEVELS = 3;
const EXTRA_ROW_EVERY_N_LEVELS = 4;

const UI_GAP = 16;
const UI_HEIGHT = 92;

// ----- State -----
let state;
let currentLevel = 1;

let BOARD_X = 0;
let BOARD_Y = 0;

const GameStatus = {
  Playing: "playing",
  Won: "won",
  Lost: "lost",
};

class Tile {
  constructor(col, row) {
    this.col = col;
    this.row = row;
    this.isMine = false;
    this.isRevealed = false;
    this.isFlagged = false;
    this.neighbourMines = 0;
  }
}

class GameState {
  constructor(level) {
    const config = getLevelConfig(level);

    this.cols = config.cols;
    this.rows = config.rows;
    this.mineCount = config.mines;

    this.tiles = [];
    this.status = GameStatus.Playing;
    this.statusMessage = "Clear the board";
    this.firstClick = true;

    for (let row = 0; row < this.rows; row++) {
      const currentRow = [];

      for (let col = 0; col < this.cols; col++) {
        currentRow.push(new Tile(col, row));
      }

      this.tiles.push(currentRow);
    }
  }

  getTile(col, row) {
    return this.tiles[row][col];
  }
}

function getLevelConfig(level) {
  return {
    cols: START_COLS + Math.floor((level - 1) / EXTRA_COL_EVERY_N_LEVELS),
    rows: START_ROWS + Math.floor((level - 1) / EXTRA_ROW_EVERY_N_LEVELS),
    mines: START_MINES + (level - 1) * MINES_PER_LEVEL,
  };
}

function isInsideBoard(col, row) {
  return col >= 0 && col < state.cols && row >= 0 && row < state.rows;
}

function getBoardWidth() {
  return state.cols * TILE_SIZE;
}

function getBoardHeight() {
  return state.rows * TILE_SIZE;
}

function resizeCanvas() {
  if (!state) return;

  canvas.width = getBoardWidth() + 80;
  canvas.height = getBoardHeight() + UI_GAP + UI_HEIGHT + 20;

  updateBoardPosition();
  draw();
}

function updateBoardPosition() {
  const boardWidth = getBoardWidth();
  const totalHeight = getBoardHeight() + UI_GAP + UI_HEIGHT;

  BOARD_X = Math.floor((canvas.width - boardWidth) / 2);
  BOARD_Y = Math.floor((canvas.height - totalHeight) / 2);
}

function getCanvasMousePosition(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();

  return {
    x: (clientX - rect.left) * (canvas.width / rect.width),
    y: (clientY - rect.top) * (canvas.height / rect.height),
  };
}

function getTileAtScreenPos(mouseX, mouseY) {
  const localX = mouseX - BOARD_X;
  const localY = mouseY - BOARD_Y;

  if (localX < 0 || localY < 0) return null;

  const col = Math.floor(localX / TILE_SIZE);
  const row = Math.floor(localY / TILE_SIZE);

  if (!isInsideBoard(col, row)) return null;

  return state.getTile(col, row);
}

function getNeighbours(tile) {
  const neighbours = [];

  for (let row = tile.row - 1; row <= tile.row + 1; row++) {
    for (let col = tile.col - 1; col <= tile.col + 1; col++) {
      if (col === tile.col && row === tile.row) continue;
      if (!isInsideBoard(col, row)) continue;

      neighbours.push(state.getTile(col, row));
    }
  }

  return neighbours;
}

function placeMines(firstTile) {
  let minesPlaced = 0;

  const forbidden = new Set();
  forbidden.add(`${firstTile.col},${firstTile.row}`);

  for (const neighbour of getNeighbours(firstTile)) {
    forbidden.add(`${neighbour.col},${neighbour.row}`);
  }

  while (minesPlaced < state.mineCount) {
    const col = Math.floor(Math.random() * state.cols);
    const row = Math.floor(Math.random() * state.rows);
    const tile = state.getTile(col, row);

    if (tile.isMine) continue;
    if (forbidden.has(`${col},${row}`)) continue;

    tile.isMine = true;
    minesPlaced++;
  }
}

function calculateNumbers() {
  for (let row = 0; row < state.rows; row++) {
    for (let col = 0; col < state.cols; col++) {
      const tile = state.getTile(col, row);

      if (tile.isMine) {
        tile.neighbourMines = 0;
        continue;
      }

      tile.neighbourMines = getNeighbours(tile).filter((t) => t.isMine).length;
    }
  }
}

function revealTile(tile) {
  if (state.status !== GameStatus.Playing) return;
  if (tile.isFlagged || tile.isRevealed) return;

  if (state.firstClick) {
    placeMines(tile);
    calculateNumbers();
    state.firstClick = false;
  }

  tile.isRevealed = true;

  if (tile.isMine) {
    loseGame();
    return;
  }

  if (tile.neighbourMines === 0) {
    floodReveal(tile);
  }

  checkWin();
}

function floodReveal(startTile) {
  const queue = [startTile];
  const visited = new Set();

  while (queue.length > 0) {
    const tile = queue.shift();
    const key = `${tile.col},${tile.row}`;

    if (visited.has(key)) continue;
    visited.add(key);

    for (const neighbour of getNeighbours(tile)) {
      if (neighbour.isFlagged || neighbour.isMine || neighbour.isRevealed) continue;

      neighbour.isRevealed = true;

      if (neighbour.neighbourMines === 0) {
        queue.push(neighbour);
      }
    }
  }
}

function toggleFlag(tile) {
  if (state.status !== GameStatus.Playing) return;
  if (tile.isRevealed) return;

  tile.isFlagged = !tile.isFlagged;
  state.statusMessage = tile.isFlagged ? "Flag placed" : "Flag removed";
}

function loseGame() {
  state.status = GameStatus.Lost;
  state.statusMessage = "Boom. Try again.";
  updateActionButton();

  for (let row = 0; row < state.rows; row++) {
    for (let col = 0; col < state.cols; col++) {
      const tile = state.getTile(col, row);
      if (tile.isMine) tile.isRevealed = true;
    }
  }
}

function checkWin() {
  for (let row = 0; row < state.rows; row++) {
    for (let col = 0; col < state.cols; col++) {
      const tile = state.getTile(col, row);

      if (!tile.isMine && !tile.isRevealed) {
        return;
      }
    }
  }

  state.status = GameStatus.Won;
  state.statusMessage = "Level cleared";
  updateActionButton();
}

function getFlagCount() {
  let count = 0;

  for (let row = 0; row < state.rows; row++) {
    for (let col = 0; col < state.cols; col++) {
      if (state.getTile(col, row).isFlagged) count++;
    }
  }

  return count;
}

function updateActionButton() {
  if (state.status === GameStatus.Won) {
    restartBtn.textContent = "Next Level";
    restartBtn.style.visibility = "visible";
  } else if (state.status === GameStatus.Lost) {
    restartBtn.textContent = "Restart";
    restartBtn.style.visibility = "visible";
  } else {
    restartBtn.textContent = "Restart";
    restartBtn.style.visibility = "hidden";
  }
}

function getNumberColor(number) {
  const colors = {
    1: "#1a4cff",
    2: "#15803d",
    3: "#dc2626",
    4: "#1e1b4b",
    5: "#7f1d1d",
    6: "#0f766e",
    7: "#111111",
    8: "#666666",
  };

  return colors[number] || "#111111";
}

function drawTile(tile) {
  const x = BOARD_X + tile.col * TILE_SIZE;
  const y = BOARD_Y + tile.row * TILE_SIZE;
  const size = TILE_SIZE - 2;

  if (tile.isRevealed) {
    ctx.fillStyle = "#ffffff";
  } else {
    ctx.fillStyle = "#d8d8d8";
  }

  ctx.fillRect(x, y, size, size);

  ctx.strokeStyle = "#bdbdbd";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, size, size);

  if (tile.isFlagged && !tile.isRevealed) {
    ctx.fillStyle = "#f0c94a";
    ctx.beginPath();
    ctx.moveTo(x + 14, y + 11);
    ctx.lineTo(x + 31, y + 18);
    ctx.lineTo(x + 14, y + 25);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 14, y + 10);
    ctx.lineTo(x + 14, y + 33);
    ctx.stroke();
  }

  if (tile.isRevealed && tile.isMine) {
    ctx.fillStyle = "#dc2626";
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  if (tile.isRevealed && !tile.isMine && tile.neighbourMines > 0) {
    ctx.fillStyle = getNumberColor(tile.neighbourMines);
    ctx.font = "bold 22px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(tile.neighbourMines, x + size / 2, y + size / 2);
  }
}

function drawBoard() {
  for (let row = 0; row < state.rows; row++) {
    for (let col = 0; col < state.cols; col++) {
      drawTile(state.getTile(col, row));
    }
  }
}

function drawUI() {
  const uiX = BOARD_X;
  const uiY = BOARD_Y + getBoardHeight() + UI_GAP;
  const uiWidth = getBoardWidth();

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(uiX, uiY, uiWidth, UI_HEIGHT);

  ctx.strokeStyle = "#cfcfcf";
  ctx.lineWidth = 2;
  ctx.strokeRect(uiX, uiY, uiWidth, UI_HEIGHT);

  ctx.fillStyle = "#111";
  ctx.font = "16px Arial";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  ctx.fillText(`Level: ${currentLevel}`, uiX + 14, uiY + 12);
  ctx.fillText(`Mines: ${state.mineCount}`, uiX + 14, uiY + 36);
  ctx.fillText(`Flags: ${getFlagCount()}`, uiX + 120, uiY + 36);

  ctx.textAlign = "right";

  if (state.status === GameStatus.Won) {
    ctx.fillStyle = "#15803d";
  } else if (state.status === GameStatus.Lost) {
    ctx.fillStyle = "#dc2626";
  } else {
    ctx.fillStyle = "#333";
  }

  ctx.fillText(state.statusMessage, uiX + uiWidth - 14, uiY + 12);

  ctx.fillStyle = "#666";
  ctx.font = "13px Arial";
  ctx.fillText("Tap/click to reveal • Right click/long press to flag", uiX + uiWidth - 14, uiY + 42);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBoard();
  drawUI();
}

function hideHelpBox() {
  if (!helpBox) return;
  helpBox.style.display = "none";
}

function startNewGame() {
  state = new GameState(currentLevel);
  resizeCanvas();
  updateActionButton();
  draw();
}

function goToNextLevel() {
  currentLevel++;
  startNewGame();
}

restartBtn.addEventListener("click", () => {
  if (state.status === GameStatus.Won) {
    goToNextLevel();
  } else {
    startNewGame();
  }
});

canvas.addEventListener("click", (event) => {
  hideHelpBox();

  const mouse = getCanvasMousePosition(event.clientX, event.clientY);
  const tile = getTileAtScreenPos(mouse.x, mouse.y);
  if (!tile) return;

  revealTile(tile);
  draw();
});

canvas.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  hideHelpBox();

  const mouse = getCanvasMousePosition(event.clientX, event.clientY);
  const tile = getTileAtScreenPos(mouse.x, mouse.y);
  if (!tile) return;

  toggleFlag(tile);
  draw();
});

let longPressTimer = null;
let longPressTriggered = false;

canvas.addEventListener("touchstart", (event) => {
  hideHelpBox();
  longPressTriggered = false;

  const touch = event.touches[0];
  if (!touch) return;

  longPressTimer = setTimeout(() => {
    const touchPos = getCanvasMousePosition(touch.clientX, touch.clientY);
    const tile = getTileAtScreenPos(touchPos.x, touchPos.y);
    if (!tile) return;

    longPressTriggered = true;
    toggleFlag(tile);
    draw();

    if (navigator.vibrate) navigator.vibrate(30);
  }, 400);
}, { passive: true });

canvas.addEventListener("touchend", () => {
  clearTimeout(longPressTimer);
});

window.addEventListener("resize", resizeCanvas);

startNewGame();