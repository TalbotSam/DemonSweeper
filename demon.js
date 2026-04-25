const FACE_FRAMES = [
  [
    "..##..##..",
    ".###..###.",
    ".#@....@#.",
    "..#....#..",
    "....##....",
    "...#..#...",
    "..######..",
    "..#....#..",
    "...####...",
    ".........."
  ],
  [
    "..##..##..",
    ".###..###.",
    ".#@....@#.",
    "..#....#..",
    "....##....",
    "...####...",
    "..#....#..",
    "..######..",
    "...####...",
    ".........."
  ]
];

function startInterlude() {
  const config = getLevelConfig(currentLevel);

  state.status = GameStatus.Interlude;
  state.interludeLines = config.interlude ?? ["You survived. Briefly."];
  state.interludeIndex = 0;

  state.interludeStartTime = Date.now();
  state.dialogueStartTime = Date.now();
  state.demonStartDelay = 1000;

  restartBtn.textContent = "Next";
  restartBtn.style.visibility = "hidden";

  draw();
}

function advanceInterlude() {
  state.interludeIndex++;

  if (state.interludeIndex >= state.interludeLines.length) {
    document.body.classList.remove("demonMode");
    currentLevel++;
    startNewGame();
    return;
  }

  state.dialogueStartTime = Date.now();
  draw();
}

function drawDemonFace(progress = 1) {
  const elapsed = Date.now() - state.interludeStartTime;
  const frame = FACE_FRAMES[Math.floor(elapsed / 400) % FACE_FRAMES.length];

  const startCol = Math.floor((state.cols - frame[0].length) / 2);
  const startRow = Math.floor((state.rows - frame.length) / 2);

  const slideOffset = (1 - progress) * 30;

  for (let row = 0; row < frame.length; row++) {
    for (let col = 0; col < frame[row].length; col++) {
      const char = frame[row][col];
      if (char === ".") continue;

      const x = BOARD_X + (startCol + col) * TILE_SIZE;
      const y = BOARD_Y + (startRow + row) * TILE_SIZE + slideOffset;
      const size = TILE_SIZE - 2;

      ctx.fillStyle = char === "@" ? "#d60000" : "#111";
      ctx.fillRect(x, y, size, size);
    }
  }
}

function drawDialogue() {
  const line = state.interludeLines[state.interludeIndex] ?? "";
  const elapsed = Date.now() - state.dialogueStartTime;
  const visibleChars = Math.floor(elapsed / 35);
  const text = line.slice(0, visibleChars);

  const uiX = BOARD_X;
  const uiY = BOARD_Y + getBoardHeight() + UI_GAP;
  const uiWidth = getBoardWidth();

  ctx.fillStyle = "#111";
  ctx.fillRect(uiX, uiY, uiWidth, UI_HEIGHT);

  ctx.strokeStyle = "#5a0000";
  ctx.lineWidth = 2;
  ctx.strokeRect(uiX, uiY, uiWidth, UI_HEIGHT);

  ctx.fillStyle = "#ff3333";
  ctx.font = "16px Arial";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(text, uiX + 14, uiY + 18);
}

function drawInterlude() {
  const elapsed = Date.now() - state.interludeStartTime;
  const delay = state.demonStartDelay || 1000;

  // First second = just admire completed board
    if (elapsed < delay) {
    drawBoard();
    drawUI();
    } else {
    const demonElapsed = elapsed - delay;
    const fadeProgress = Math.min(demonElapsed / 1200, 1);

    if (!document.body.classList.contains("demonMode")) {
        document.body.classList.add("demonMode");
    }

    if (elapsed > delay + 500) {
        restartBtn.style.visibility = "visible";
    }

    ctx.save();
    ctx.globalAlpha = 1;
    drawFadingBoardDetails(1 - fadeProgress);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = fadeProgress;
    drawDemonFace(fadeProgress);
    drawDialogue();
    ctx.restore();
    }

  requestAnimationFrame(() => {
    if (state.status === GameStatus.Interlude) {
      draw();
    }
  });
}

function drawFadingBoardDetails(detailAlpha) {
  for (let row = 0; row < state.rows; row++) {
    for (let col = 0; col < state.cols; col++) {
      const tile = state.getTile(col, row);
      const x = BOARD_X + col * TILE_SIZE;
      const y = BOARD_Y + row * TILE_SIZE;
      const size = TILE_SIZE - 2;

      // Always draw white base squares
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x, y, size, size);

      ctx.strokeStyle = "#dddddd";
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, size, size);

      // Fade out numbers, flags, mines
      ctx.save();
      ctx.globalAlpha = detailAlpha;

      if (tile.isFlagged) {
        ctx.fillStyle = "#f0c94a";
        ctx.beginPath();
        ctx.moveTo(x + 14, y + 11);
        ctx.lineTo(x + 31, y + 18);
        ctx.lineTo(x + 14, y + 25);
        ctx.closePath();
        ctx.fill();
      }

      if (tile.isRevealed && tile.isMine) {
        ctx.fillStyle = "#dc2626";
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, 10, 0, Math.PI * 2);
        ctx.fill();
      }

      if (tile.isRevealed && !tile.isMine && tile.neighbourMines > 0) {
        ctx.fillStyle = getNumberColor(tile.neighbourMines);
        ctx.font = "bold 22px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(tile.neighbourMines, x + size / 2, y + size / 2);
      }

      ctx.restore();
    }
  }
}