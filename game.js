"use strict";

const canvas = document.getElementById("game");
const context = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const livesElement = document.getElementById("lives");
const collectiblesElement = document.getElementById("collectibles");
const restartButton = document.getElementById("restartButton");
const startButton = document.getElementById("startButton");
const overlay = document.getElementById("overlay");
const overlayBadge = document.getElementById("overlayBadge");
const overlayKicker = document.getElementById("overlayKicker");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const overlaySummary = document.getElementById("overlaySummary");
const boardStage = document.querySelector(".board-stage");
const boardWrap = document.querySelector(".board-wrap");
const controlButtons = document.querySelectorAll("[data-action]");

const VIEW_WIDTH = 320;
const VIEW_HEIGHT = 192;
const TILE_SIZE = 16;
const LEVEL_WIDTH_TILES = 192;
const LEVEL_HEIGHT_TILES = 12;
const WORLD_WIDTH = LEVEL_WIDTH_TILES * TILE_SIZE;
const WORLD_HEIGHT = LEVEL_HEIGHT_TILES * TILE_SIZE;
const FIXED_DT = 1 / 60;
const GRAVITY = 1800;
const MAX_FALL_SPEED = 980;
const RUN_ACCEL = 2800;
const RUN_FRICTION = 1900;
const MAX_RUN_SPEED = 150;
const JUMP_SPEED = 560;
const JUMP_CUT_MULTIPLIER = 1.65;
const COYOTE_TIME = 0.09;
const JUMP_BUFFER_TIME = 0.12;
const INVINCIBLE_TIME = 1.1;

const TILE = {
  EMPTY: 0,
  SOLID: 1,
  PLATFORM: 2,
};

const ITEM_VALUES = {
  bamboo: 20,
  leaf: 10,
};

const input = {
  left: false,
  right: false,
  jumpHeld: false,
  jumpQueued: false,
};

const game = {
  mode: "title",
  score: 0,
  lives: 3,
  collected: 0,
  totalCollectibles: 0,
  time: 0,
  respawnX: TILE_SIZE * 2,
  respawnY: WORLD_HEIGHT - TILE_SIZE * 2 - 4,
  checkpointLabel: "Początek",
};

let level = createLevel();
let player = createPlayer(level.spawn.x, level.spawn.y);
let cameraX = 0;
let displayScale = 1;
let backingScale = Math.max(1, window.devicePixelRatio || 1);
let cssWidth = VIEW_WIDTH;
let cssHeight = VIEW_HEIGHT;
let accumulator = 0;
let lastTimestamp = 0;

const clouds = [
  { x: 18, y: 26, width: 38, speed: 0.08 },
  { x: 104, y: 18, width: 48, speed: 0.12 },
  { x: 206, y: 34, width: 42, speed: 0.07 },
  { x: 278, y: 22, width: 34, speed: 0.15 },
];

function createLevel() {
  const tiles = Array.from({ length: LEVEL_HEIGHT_TILES }, () =>
    Array.from({ length: LEVEL_WIDTH_TILES }, () => TILE.EMPTY),
  );
  const collectibles = [];
  const enemies = [];
  const hazards = [];
  const checkpoints = [];

  const fillTiles = (x, y, width, height, value) => {
    for (let row = y; row < y + height; row += 1) {
      if (row < 0 || row >= LEVEL_HEIGHT_TILES) {
        continue;
      }
      for (let col = x; col < x + width; col += 1) {
        if (col < 0 || col >= LEVEL_WIDTH_TILES) {
          continue;
        }
        tiles[row][col] = value;
      }
    }
  };

  const carveHole = (x, width) => {
    for (let col = x; col < x + width; col += 1) {
      if (col < 0 || col >= LEVEL_WIDTH_TILES) {
        continue;
      }
      tiles[LEVEL_HEIGHT_TILES - 1][col] = TILE.EMPTY;
      hazards.push({
        x: col * TILE_SIZE,
        y: WORLD_HEIGHT - 12,
        width: TILE_SIZE,
        height: 12,
        type: "spike",
      });
    }
  };

  const addCollectible = (x, y, type) => {
    collectibles.push({
      x,
      y,
      width: 12,
      height: type === "bamboo" ? 14 : 12,
      type,
      taken: false,
      phase: Math.random() * Math.PI * 2,
    });
  };

  const addEnemy = (x, y, minX, maxX, speed) => {
    enemies.push({
      x,
      y,
      width: 14,
      height: 14,
      vx: speed,
      vy: 0,
      speed,
      direction: 1,
      minX,
      maxX,
      alive: true,
      onGround: true,
      phase: Math.random() * Math.PI * 2,
    });
  };

  const addCheckpoint = (x, y, label) => {
    checkpoints.push({
      x,
      y,
      width: 18,
      height: 34,
      respawnX: x,
      respawnY: y + 14,
      label,
      activated: false,
    });
  };

  fillTiles(0, LEVEL_HEIGHT_TILES - 1, LEVEL_WIDTH_TILES, 1, TILE.SOLID);

  [
    [15, 3],
    [31, 3],
    [47, 3],
    [63, 3],
    [81, 4],
    [103, 3],
    [127, 4],
    [151, 3],
    [171, 3],
  ].forEach(([start, width]) => carveHole(start, width));

  [
    [8, 8, 5],
    [20, 7, 5],
    [34, 6, 5],
    [50, 8, 5],
    [67, 7, 4],
    [84, 6, 5],
    [102, 8, 5],
    [120, 7, 5],
    [140, 6, 5],
    [162, 8, 5],
  ].forEach(([x, y, width]) => fillTiles(x, y, width, 1, TILE.PLATFORM));

  fillTiles(176, 10, 2, 2, TILE.PLATFORM);
  fillTiles(178, 9, 2, 3, TILE.PLATFORM);
  fillTiles(180, 8, 2, 4, TILE.PLATFORM);
  fillTiles(182, 7, 2, 5, TILE.PLATFORM);
  fillTiles(184, 6, 3, 6, TILE.PLATFORM);
  fillTiles(187, 5, 4, 7, TILE.PLATFORM);

  addCollectible(9 * TILE_SIZE + 1, 7 * TILE_SIZE - 15, "bamboo");
  addCollectible(12 * TILE_SIZE + 1, 6 * TILE_SIZE - 15, "leaf");
  addCollectible(22 * TILE_SIZE + 1, 6 * TILE_SIZE - 15, "bamboo");
  addCollectible(25 * TILE_SIZE + 1, 5 * TILE_SIZE - 15, "leaf");
  addCollectible(36 * TILE_SIZE + 1, 5 * TILE_SIZE - 15, "bamboo");
  addCollectible(40 * TILE_SIZE + 1, 4 * TILE_SIZE - 15, "leaf");
  addCollectible(52 * TILE_SIZE + 1, 7 * TILE_SIZE - 15, "bamboo");
  addCollectible(56 * TILE_SIZE + 1, 6 * TILE_SIZE - 15, "leaf");
  addCollectible(69 * TILE_SIZE + 1, 6 * TILE_SIZE - 15, "bamboo");
  addCollectible(86 * TILE_SIZE + 1, 5 * TILE_SIZE - 15, "leaf");
  addCollectible(103 * TILE_SIZE + 1, 7 * TILE_SIZE - 15, "bamboo");
  addCollectible(123 * TILE_SIZE + 1, 6 * TILE_SIZE - 15, "leaf");
  addCollectible(142 * TILE_SIZE + 1, 5 * TILE_SIZE - 15, "bamboo");
  addCollectible(165 * TILE_SIZE + 1, 7 * TILE_SIZE - 15, "leaf");
  addCollectible(181 * TILE_SIZE + 1, 8 * TILE_SIZE - 15, "bamboo");
  addCollectible(188 * TILE_SIZE + 1, 5 * TILE_SIZE - 15, "leaf");

  addEnemy(5 * TILE_SIZE, 11 * TILE_SIZE - 14, 3 * TILE_SIZE, 13 * TILE_SIZE, 40);
  addEnemy(24 * TILE_SIZE, 11 * TILE_SIZE - 14, 21 * TILE_SIZE, 29 * TILE_SIZE, 44);
  addEnemy(54 * TILE_SIZE, 11 * TILE_SIZE - 14, 50 * TILE_SIZE, 60 * TILE_SIZE, 40);
  addEnemy(72 * TILE_SIZE, 7 * TILE_SIZE - 14, 68 * TILE_SIZE, 77 * TILE_SIZE, 34);
  addEnemy(110 * TILE_SIZE, 8 * TILE_SIZE - 14, 103 * TILE_SIZE, 114 * TILE_SIZE, 34);
  addEnemy(145 * TILE_SIZE, 6 * TILE_SIZE - 14, 141 * TILE_SIZE, 149 * TILE_SIZE, 32);

  addCheckpoint(120 * TILE_SIZE + 2, 7 * TILE_SIZE - 34, "Checkpoint bambusowy");

  const goal = {
    x: 189 * TILE_SIZE,
    y: 5 * TILE_SIZE - 34,
    width: 20,
    height: 50,
  };

  return {
    tiles,
    collectibles,
    enemies,
    hazards,
    checkpoints,
    goal,
    spawn: {
      x: TILE_SIZE * 2,
      y: WORLD_HEIGHT - TILE_SIZE * 2 - 4,
    },
  };
}

function createPlayer(x, y) {
  return {
    x,
    y,
    prevX: x,
    prevY: y,
    width: 14,
    height: 20,
    vx: 0,
    vy: 0,
    facing: 1,
    onGround: true,
    coyote: COYOTE_TIME,
    jumpBuffer: 0,
    invincible: 0,
  };
}

function resetSession() {
  level = createLevel();
  player = createPlayer(level.spawn.x, level.spawn.y);
  game.mode = "title";
  game.score = 0;
  game.lives = 3;
  game.collected = 0;
  game.totalCollectibles = level.collectibles.length;
  game.time = 0;
  game.respawnX = level.spawn.x;
  game.respawnY = level.spawn.y;
  game.checkpointLabel = "Początek";
  cameraX = 0;
  clearInput();
  syncHud();
}

function clearInput() {
  input.left = false;
  input.right = false;
  input.jumpHeld = false;
  input.jumpQueued = false;
}

function syncHud() {
  scoreElement.textContent = String(game.score);
  livesElement.textContent = String(game.lives);
  collectiblesElement.textContent = `${game.collected}/${game.totalCollectibles}`;
}

function showOverlay({ badge, kicker, title, text, summary = "", buttonLabel }) {
  overlayBadge.textContent = badge;
  overlayKicker.textContent = kicker;
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  startButton.textContent = buttonLabel;
  overlaySummary.hidden = summary.length === 0;
  overlaySummary.textContent = summary;
  overlay.hidden = false;
}

function hideOverlay() {
  overlay.hidden = true;
}

function showStartScreen() {
  game.mode = "title";
  showOverlay({
    badge: "Ekran startowy",
    kicker: "W drogę",
    title: "Skacz po bambusowym szlaku",
    text:
      "Biegnij w prawo, zbieraj bambusowe monety i listki, omijaj przeciwników oraz przeszkody i dotrzyj do flagi na końcu poziomu.",
    buttonLabel: "Rozpocznij grę",
  });
}

function startGame() {
  resetSession();
  game.mode = "play";
  hideOverlay();
}

function finishGameOver() {
  game.mode = "over";
  showOverlay({
    badge: "Game Over",
    kicker: "Zabrakło żyć",
    title: "Panda utknęła na szlaku",
    text: "Spróbuj ponownie i przejdź poziom czystszą linią skoków.",
    summary: `Twój wynik: ${game.score} pkt. Zebrane skarby: ${game.collected}/${game.totalCollectibles}. Ostatni checkpoint: ${game.checkpointLabel}.`,
    buttonLabel: "Zagraj ponownie",
  });
}

function finishVictory() {
  game.mode = "victory";
  game.score += game.lives * 100;
  syncHud();
  showOverlay({
    badge: "Zwycięstwo",
    kicker: "Poziom ukończony",
    title: "Błękitna panda dotarła do mety",
    text: "Zebrałeś skarby, ominąłeś pułapki i dotarłeś do końca poziomu.",
    summary: `Wynik końcowy: ${game.score} pkt. Skarby: ${game.collected}/${game.totalCollectibles}. Ostatni checkpoint: ${game.checkpointLabel}.`,
    buttonLabel: "Zagraj ponownie",
  });
}

function setRespawn(checkpoint) {
  game.respawnX = checkpoint.respawnX;
  game.respawnY = checkpoint.respawnY;
  game.checkpointLabel = checkpoint.label;
  checkpoint.activated = true;
}

function respawnPlayer() {
  player.x = game.respawnX;
  player.y = game.respawnY;
  player.prevX = player.x;
  player.prevY = player.y;
  player.vx = 0;
  player.vy = 0;
  player.facing = 1;
  player.onGround = true;
  player.coyote = COYOTE_TIME;
  player.jumpBuffer = 0;
  player.invincible = INVINCIBLE_TIME;
}

function takeDamage(reason) {
  if (game.mode !== "play" || player.invincible > 0) {
    return;
  }

  game.lives -= 1;

  if (game.lives <= 0) {
    game.lives = 0;
    syncHud();
    finishGameOver(reason);
    return;
  }

  respawnPlayer();
  syncHud();
}

function isSolidTile(tile) {
  return tile === TILE.SOLID || tile === TILE.PLATFORM;
}

function tileAt(tileX, tileY) {
  if (
    tileX < 0 ||
    tileY < 0 ||
    tileX >= LEVEL_WIDTH_TILES ||
    tileY >= LEVEL_HEIGHT_TILES
  ) {
    return TILE.EMPTY;
  }

  return level.tiles[tileY][tileX];
}

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function resolveHorizontal(entity) {
  const topTile = Math.floor(entity.y / TILE_SIZE);
  const bottomTile = Math.floor((entity.y + entity.height - 1) / TILE_SIZE);

  if (entity.vx > 0) {
    const rightTile = Math.floor((entity.x + entity.width - 1) / TILE_SIZE);

    for (let tileY = topTile; tileY <= bottomTile; tileY += 1) {
      if (isSolidTile(tileAt(rightTile, tileY))) {
        entity.x = rightTile * TILE_SIZE - entity.width;
        entity.vx = 0;
        break;
      }
    }
  } else if (entity.vx < 0) {
    const leftTile = Math.floor(entity.x / TILE_SIZE);

    for (let tileY = topTile; tileY <= bottomTile; tileY += 1) {
      if (isSolidTile(tileAt(leftTile, tileY))) {
        entity.x = (leftTile + 1) * TILE_SIZE;
        entity.vx = 0;
        break;
      }
    }
  }

  entity.x = clamp(entity.x, 0, WORLD_WIDTH - entity.width);
}

function resolveVertical(entity) {
  let grounded = false;
  const leftTile = Math.floor(entity.x / TILE_SIZE);
  const rightTile = Math.floor((entity.x + entity.width - 1) / TILE_SIZE);

  if (entity.vy > 0) {
    const bottomTile = Math.floor((entity.y + entity.height - 1) / TILE_SIZE);

    for (let tileX = leftTile; tileX <= rightTile; tileX += 1) {
      if (isSolidTile(tileAt(tileX, bottomTile))) {
        entity.y = bottomTile * TILE_SIZE - entity.height;
        entity.vy = 0;
        grounded = true;
        break;
      }
    }
  } else if (entity.vy < 0) {
    const topTile = Math.floor(entity.y / TILE_SIZE);

    for (let tileX = leftTile; tileX <= rightTile; tileX += 1) {
      if (isSolidTile(tileAt(tileX, topTile))) {
        entity.y = (topTile + 1) * TILE_SIZE;
        entity.vy = 0;
        break;
      }
    }
  }

  entity.y = clamp(entity.y, -32, WORLD_HEIGHT - entity.height + 24);
  return grounded;
}

function updatePlayer(dt) {
  player.prevX = player.x;
  player.prevY = player.y;

  const moveInput = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const wasOnGround = player.onGround;

  player.coyote = wasOnGround
    ? COYOTE_TIME
    : Math.max(0, player.coyote - dt);

  if (moveInput !== 0) {
    player.vx += moveInput * RUN_ACCEL * dt;
    player.facing = moveInput;
    player.vx = clamp(player.vx, -MAX_RUN_SPEED, MAX_RUN_SPEED);
  } else {
    const friction = player.onGround ? RUN_FRICTION : RUN_FRICTION * 0.2;
    if (player.vx > 0) {
      player.vx = Math.max(0, player.vx - friction * dt);
    } else if (player.vx < 0) {
      player.vx = Math.min(0, player.vx + friction * dt);
    }
  }

  if (input.jumpQueued) {
    player.jumpBuffer = JUMP_BUFFER_TIME;
    input.jumpQueued = false;
  } else {
    player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);
  }

  if (player.jumpBuffer > 0 && player.coyote > 0) {
    player.vy = -JUMP_SPEED;
    player.onGround = false;
    player.coyote = 0;
    player.jumpBuffer = 0;
  }

  player.vy += GRAVITY * dt;

  if (!input.jumpHeld && player.vy < 0) {
    player.vy += GRAVITY * (JUMP_CUT_MULTIPLIER - 1) * dt;
  }

  player.vy = Math.min(player.vy, MAX_FALL_SPEED);

  player.x += player.vx * dt;
  resolveHorizontal(player);

  player.y += player.vy * dt;
  player.onGround = resolveVertical(player);

  if (player.y > WORLD_HEIGHT + 32) {
    takeDamage("Wpadłeś w przepaść.");
    return;
  }

  if (player.invincible > 0) {
    player.invincible = Math.max(0, player.invincible - dt);
  }

  checkPlayerInteractions();
}

function checkPlayerInteractions() {
  if (game.mode !== "play") {
    return;
  }

  for (const checkpoint of level.checkpoints) {
    if (rectsOverlap(player, checkpoint)) {
      setRespawn(checkpoint);
    }
  }

  for (const collectible of level.collectibles) {
    if (!collectible.taken && rectsOverlap(player, collectible)) {
      collectible.taken = true;
      game.score += ITEM_VALUES[collectible.type];
      game.collected += 1;
      syncHud();
    }
  }

  for (const hazard of level.hazards) {
    if (rectsOverlap(player, hazard)) {
      takeDamage("Kolce zatrzymały pandę.");
      return;
    }
  }

  for (const enemy of level.enemies) {
    if (!enemy.alive || !rectsOverlap(player, enemy)) {
      continue;
    }

    const wasAboveEnemy =
      player.prevY + player.height <= enemy.y + 5 && player.vy > 0;

    if (wasAboveEnemy) {
      enemy.alive = false;
      player.vy = -JUMP_SPEED * 0.62;
      game.score += 50;
      syncHud();
    } else {
      takeDamage("Przeciwnik uderzył w pandę.");
      return;
    }
  }

  if (rectsOverlap(player, level.goal)) {
    finishVictory();
  }
}

function updateEnemy(enemy, dt) {
  if (!enemy.alive) {
    return;
  }

  enemy.prevX = enemy.x;
  enemy.prevY = enemy.y;
  const wasGrounded = enemy.onGround;

  enemy.vx = enemy.direction * enemy.speed;
  enemy.vy = Math.min(enemy.vy + GRAVITY * dt, MAX_FALL_SPEED);

  enemy.x += enemy.vx * dt;
  resolveHorizontal(enemy);

  if (wasGrounded) {
    const lookAheadX =
      enemy.direction > 0 ? enemy.x + enemy.width + 2 : enemy.x - 2;
    const footY = enemy.y + enemy.height + 2;
    const tileX = Math.floor(lookAheadX / TILE_SIZE);
    const tileY = Math.floor(footY / TILE_SIZE);

    if (!isSolidTile(tileAt(tileX, tileY)) || enemy.vx === 0) {
      enemy.direction *= -1;
      enemy.x = clamp(enemy.x, enemy.minX, enemy.maxX - enemy.width);
    }
  }

  enemy.y += enemy.vy * dt;
  const grounded = resolveVertical(enemy);

  if (enemy.x <= enemy.minX) {
    enemy.direction = 1;
    enemy.x = enemy.minX;
  } else if (enemy.x + enemy.width >= enemy.maxX) {
    enemy.direction = -1;
    enemy.x = enemy.maxX - enemy.width;
  }

  if (enemy.y > WORLD_HEIGHT + 24) {
    enemy.y = enemy.prevY;
    enemy.vy = 0;
  }

  enemy.onGround = grounded;
}

function update(dt) {
  game.time += dt;

  if (game.mode !== "play") {
    return;
  }

  updatePlayer(dt);

  for (const enemy of level.enemies) {
    updateEnemy(enemy, dt);
  }

  cameraX = clamp(
    player.x + player.width / 2 - VIEW_WIDTH / 2,
    0,
    WORLD_WIDTH - VIEW_WIDTH,
  );
}

function resizeCanvas() {
  const availableWidth = Math.floor(boardStage.clientWidth);
  const availableHeight = Math.floor(boardStage.clientHeight);
  const scale = Math.max(
    1,
    Math.floor(Math.min(availableWidth / VIEW_WIDTH, availableHeight / VIEW_HEIGHT)),
  );

  displayScale = scale;
  cssWidth = VIEW_WIDTH * displayScale;
  cssHeight = VIEW_HEIGHT * displayScale;

  boardWrap.style.width = `${cssWidth}px`;
  boardWrap.style.height = `${cssHeight}px`;

  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;
  canvas.width = Math.round(cssWidth * backingScale);
  canvas.height = Math.round(cssHeight * backingScale);
  context.setTransform(backingScale, 0, 0, backingScale, 0, 0);
  context.imageSmoothingEnabled = false;

  render();
}

function toScreenX(worldX) {
  return Math.round((worldX - cameraX) * displayScale);
}

function toScreenY(worldY) {
  return Math.round(worldY * displayScale);
}

function drawRect(x, y, width, height, color) {
  context.fillStyle = color;
  context.fillRect(
    Math.round(x * displayScale),
    Math.round(y * displayScale),
    Math.round(width * displayScale),
    Math.round(height * displayScale),
  );
}

function drawBackground() {
  const width = cssWidth;
  const height = cssHeight;

  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#8de9ff");
  gradient.addColorStop(0.5, "#69bdff");
  gradient.addColorStop(0.86, "#2f79db");
  gradient.addColorStop(1, "#162747");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  drawRect(18, 16, 38, 38, "rgba(255, 248, 185, 0.9)");
  drawRect(22, 20, 30, 30, "rgba(255, 241, 151, 0.95)");

  drawMountains();
  drawClouds();
  drawSunRays();

  context.fillStyle = "rgba(27, 55, 96, 0.3)";
  context.fillRect(0, height - 22, width, 22);
}

function drawSunRays() {
  const centerX = 36;
  const centerY = 35;
  const rayColor = "rgba(255, 241, 151, 0.2)";

  for (let i = 0; i < 8; i += 1) {
    const offset = i * 6;
    drawRect(centerX + offset, centerY - 16, 2, 12, rayColor);
    drawRect(centerX - offset, centerY - 16, 2, 12, rayColor);
  }
}

function drawClouds() {
  for (const cloud of clouds) {
    const cloudOffset = (cameraX * cloud.speed + game.time * 4) % (VIEW_WIDTH + 80);
    let x = cloud.x - cloudOffset;
    while (x < -100) {
      x += VIEW_WIDTH + 140;
    }
    x = Math.round(x * displayScale);
    const y = Math.round(cloud.y * displayScale);
    const block = Math.round(5 * displayScale);
    const white = "rgba(255, 255, 255, 0.88)";
    drawBlockCloud(x, y, block, white, cloud.width);
  }
}

function drawBlockCloud(x, y, block, color, width) {
  context.fillStyle = color;
  context.fillRect(x + block, y + block, block * 4, block * 2);
  context.fillRect(x + block * 2, y, block * 4, block * 2);
  context.fillRect(x, y + block * 2, block * 6, block * 2);
  context.fillRect(x + block * 2, y + block * 3, block * 5, block * 2);
  context.fillRect(x + block * 7, y + block * 2, block * 2, block * 2);
  if (width > 40) {
    context.fillRect(x + block * 8, y + block, block * 3, block * 2);
  }
}

function drawMountains() {
  const layers = [
    {
      color: "#24519c",
      baseY: 145,
      height: 48,
      parallax: 0.12,
      peaks: [
        { x: 0, width: 104, peak: 46 },
        { x: 92, width: 116, peak: 58 },
        { x: 212, width: 100, peak: 50 },
        { x: 328, width: 110, peak: 44 },
      ],
    },
    {
      color: "#1d3b77",
      baseY: 160,
      height: 34,
      parallax: 0.2,
      peaks: [
        { x: 20, width: 84, peak: 34 },
        { x: 132, width: 92, peak: 42 },
        { x: 256, width: 86, peak: 38 },
        { x: 370, width: 96, peak: 36 },
      ],
    },
  ];

  for (const layer of layers) {
    const offset = (cameraX * layer.parallax) % (VIEW_WIDTH + 180);
    for (const peak of layer.peaks) {
      const x = Math.round((peak.x - offset) * displayScale);
      const w = Math.round(peak.width * displayScale);
      const baseY = Math.round(layer.baseY * displayScale);
      const mountainPeak = Math.round(peak.peak * displayScale);
      drawSteppedMountain(x, baseY, w, mountainPeak, layer.color);
    }
  }
}

function drawSteppedMountain(x, baseY, width, peakHeight, color) {
  const steps = 6;
  const stepWidth = Math.max(1, Math.floor(width / steps));
  const stepHeight = Math.max(1, Math.floor(peakHeight / steps));
  context.fillStyle = color;

  for (let step = 0; step < steps; step += 1) {
    const levelWidth = Math.max(1, width - step * stepWidth);
    context.fillRect(
      x + step * stepWidth,
      baseY - step * stepHeight,
      levelWidth,
      stepHeight + 1,
    );
  }
}

function drawWorldTiles() {
  const startTile = Math.max(0, Math.floor(cameraX / TILE_SIZE) - 2);
  const endTile = Math.min(
    LEVEL_WIDTH_TILES - 1,
    Math.ceil((cameraX + VIEW_WIDTH) / TILE_SIZE) + 2,
  );

  for (let tileY = 0; tileY < LEVEL_HEIGHT_TILES; tileY += 1) {
    for (let tileX = startTile; tileX <= endTile; tileX += 1) {
      const tile = level.tiles[tileY][tileX];
      if (tile === TILE.EMPTY) {
        continue;
      }

      const screenX = Math.round((tileX * TILE_SIZE - cameraX) * displayScale);
      const screenY = Math.round(tileY * TILE_SIZE * displayScale);

      if (tile === TILE.SOLID) {
        drawGroundTile(screenX, screenY);
      } else if (tile === TILE.PLATFORM) {
        drawPlatformTile(screenX, screenY);
      }
    }
  }
}

function drawGroundTile(x, y) {
  const s = displayScale;
  context.fillStyle = "#5c361b";
  context.fillRect(x, y, TILE_SIZE * s, TILE_SIZE * s);
  context.fillStyle = "#78d96a";
  context.fillRect(x, y, TILE_SIZE * s, 4 * s);
  context.fillStyle = "#a5f66f";
  context.fillRect(x, y + 2 * s, TILE_SIZE * s, 2 * s);
  context.fillStyle = "#8b5d2e";
  context.fillRect(x + 2 * s, y + 8 * s, 12 * s, 2 * s);
  context.fillStyle = "#4d3018";
  context.fillRect(x + 4 * s, y + 12 * s, 6 * s, 2 * s);
}

function drawPlatformTile(x, y) {
  const s = displayScale;
  context.fillStyle = "#3b5ad2";
  context.fillRect(x, y, TILE_SIZE * s, TILE_SIZE * s);
  context.fillStyle = "#8adfff";
  context.fillRect(x, y, TILE_SIZE * s, 3 * s);
  context.fillStyle = "#d8f4ff";
  context.fillRect(x + 2 * s, y + 4 * s, 12 * s, 2 * s);
  context.fillStyle = "#24439a";
  context.fillRect(x + 2 * s, y + 10 * s, 12 * s, 2 * s);
  context.fillStyle = "#17306e";
  context.fillRect(x + 1 * s, y + 13 * s, 14 * s, 2 * s);
}

function drawHazards() {
  for (const hazard of level.hazards) {
    const screenX = toScreenX(hazard.x);
    const screenY = toScreenY(hazard.y);
    const width = Math.round(hazard.width * displayScale);
    drawSpikeCluster(screenX, screenY, width);
  }
}

function drawSpikeCluster(x, y, width) {
  const spikeWidth = Math.max(8 * displayScale, Math.floor(width / 3));
  const count = Math.max(1, Math.floor(width / spikeWidth));
  for (let i = 0; i < count; i += 1) {
    const spikeX = x + i * spikeWidth;
    const bodyWidth = Math.min(spikeWidth, width - i * spikeWidth);
    const bodyHeight = 12 * displayScale;
    context.fillStyle = "#a62f45";
    context.fillRect(spikeX, y + 6 * displayScale, bodyWidth, bodyHeight);
    context.fillStyle = "#ff9467";
    context.fillRect(spikeX + 1 * displayScale, y + 5 * displayScale, bodyWidth - 2 * displayScale, 2 * displayScale);
    context.fillStyle = "#ff6f61";
    context.fillRect(spikeX + 2 * displayScale, y + 3 * displayScale, bodyWidth - 4 * displayScale, 3 * displayScale);
    context.fillStyle = "#ffe39b";
    context.fillRect(spikeX + 3 * displayScale, y, bodyWidth - 6 * displayScale, 3 * displayScale);
  }
}

function drawCollectibles() {
  for (const collectible of level.collectibles) {
    if (collectible.taken) {
      continue;
    }

    const bob = Math.sin(game.time * 5 + collectible.phase) * 2;
    const screenX = toScreenX(collectible.x);
    const screenY = toScreenY(collectible.y + bob);

    if (collectible.type === "bamboo") {
      drawBambooCoin(screenX, screenY);
    } else {
      drawLeafToken(screenX, screenY);
    }
  }
}

function drawBambooCoin(x, y) {
  const s = displayScale;
  context.fillStyle = "#204d22";
  context.fillRect(x + 4 * s, y + 1 * s, 4 * s, 12 * s);
  context.fillStyle = "#79da61";
  context.fillRect(x + 5 * s, y, 2 * s, 14 * s);
  context.fillStyle = "#2f8b34";
  context.fillRect(x + 2 * s, y + 4 * s, 10 * s, 2 * s);
  context.fillStyle = "#9cfa76";
  context.fillRect(x + 1 * s, y + 7 * s, 12 * s, 2 * s);
  context.fillStyle = "#d8ff9c";
  context.fillRect(x + 4 * s, y + 2 * s, 3 * s, 2 * s);
  context.fillRect(x + 8 * s, y + 9 * s, 3 * s, 2 * s);
  context.fillStyle = "#f7ffd4";
  context.fillRect(x + 6 * s, y + 1 * s, 2 * s, 2 * s);
}

function drawLeafToken(x, y) {
  const s = displayScale;
  context.fillStyle = "#1f6f55";
  context.fillRect(x + 5 * s, y + 1 * s, 2 * s, 10 * s);
  context.fillStyle = "#8df56e";
  context.fillRect(x + 4 * s, y + 2 * s, 4 * s, 8 * s);
  context.fillStyle = "#b9ff90";
  context.fillRect(x + 3 * s, y + 3 * s, 6 * s, 6 * s);
  context.fillStyle = "#f3ffb4";
  context.fillRect(x + 5 * s, y + 4 * s, 2 * s, 2 * s);
}

function drawCheckpoints() {
  for (const checkpoint of level.checkpoints) {
    const screenX = toScreenX(checkpoint.x);
    const screenY = toScreenY(checkpoint.y);
    drawCheckpointPole(screenX, screenY, checkpoint.activated);
  }
}

function drawCheckpointPole(x, y, activated) {
  const s = displayScale;
  context.fillStyle = "#6d4625";
  context.fillRect(x + 6 * s, y, 4 * s, 34 * s);
  context.fillStyle = activated ? "#66e6ff" : "#ffcf71";
  context.fillRect(x + 2 * s, y + 4 * s, 14 * s, 8 * s);
  context.fillStyle = activated ? "#baf7ff" : "#ffe7a9";
  context.fillRect(x + 4 * s, y + 6 * s, 10 * s, 4 * s);
  context.fillStyle = "#e5b86c";
  context.fillRect(x + 6 * s, y, 4 * s, 34 * s);
}

function drawGoal() {
  const screenX = toScreenX(level.goal.x);
  const screenY = toScreenY(level.goal.y);
  const s = displayScale;

  context.fillStyle = "#7d532a";
  context.fillRect(screenX, screenY, 4 * s, 50 * s);
  context.fillRect(screenX + 18 * s, screenY, 4 * s, 50 * s);
  context.fillStyle = "#f7d761";
  context.fillRect(screenX - 2 * s, screenY + 3 * s, 28 * s, 6 * s);
  context.fillStyle = "#65e2ff";
  context.fillRect(screenX + 5 * s, screenY + 12 * s, 14 * s, 10 * s);
  context.fillStyle = "#8df56e";
  context.fillRect(screenX + 7 * s, screenY + 4 * s, 10 * s, 6 * s);
  context.fillStyle = "#f9fbff";
  context.fillRect(screenX + 8 * s, screenY + 16 * s, 8 * s, 18 * s);
}

function drawEnemies() {
  for (const enemy of level.enemies) {
    if (!enemy.alive) {
      continue;
    }

    const bob = Math.sin(game.time * 7 + enemy.phase) * 1;
    const screenX = toScreenX(enemy.x);
    const screenY = toScreenY(enemy.y + bob);
    drawEnemySprite(screenX, screenY, enemy.direction, Math.floor(game.time * 12) % 2);
  }
}

function drawEnemySprite(x, y, facing, frame) {
  const s = displayScale;
  context.save();
  context.translate(x, y);
  if (facing < 0) {
    context.translate(14 * s, 0);
    context.scale(-1, 1);
  }

  context.fillStyle = "#4f1f22";
  context.fillRect(1 * s, 4 * s, 12 * s, 7 * s);
  context.fillStyle = "#ff7b73";
  context.fillRect(2 * s, 5 * s, 10 * s, 5 * s);
  context.fillStyle = "#ffb073";
  context.fillRect(3 * s, 6 * s, 8 * s, 3 * s);
  context.fillStyle = "#ffdba1";
  context.fillRect(5 * s, 4 * s, 4 * s, 2 * s);
  context.fillStyle = "#f5fbff";
  context.fillRect(4 * s, 5 * s, 2 * s, 2 * s);
  context.fillRect(8 * s, 5 * s, 2 * s, 2 * s);
  context.fillStyle = "#1b2436";
  context.fillRect(5 * s, 6 * s, 1 * s, 1 * s);
  context.fillRect(9 * s, 6 * s, 1 * s, 1 * s);
  context.fillStyle = "#6f2c33";
  context.fillRect(2 * s, 10 * s, 2 * s, 4 * s - frame * s);
  context.fillRect(6 * s, 10 * s + frame * s, 2 * s, 4 * s - frame * s);
  context.fillRect(10 * s, 10 * s, 2 * s, 4 * s - frame * s);
  context.fillStyle = "#ff9467";
  context.fillRect(4 * s, 1 * s, 2 * s, 2 * s);
  context.fillRect(8 * s, 1 * s, 2 * s, 2 * s);
  context.restore();
}

function drawPlayerSprite() {
  const screenX = toScreenX(player.x);
  const screenY = toScreenY(player.y);
  const walking = player.onGround && Math.abs(player.vx) > 12;
  const frame = !player.onGround ? 3 : walking ? Math.floor(game.time * 14) % 2 : 0;
  const s = displayScale;

  context.save();
  if (player.invincible > 0 && Math.floor(game.time * 20) % 2 === 0) {
    context.globalAlpha = 0.45;
  }

  context.translate(screenX, screenY);
  if (player.facing < 0) {
    context.translate(18 * s, 0);
    context.scale(-1, 1);
  }

  drawPandaBlocks(frame);
  context.restore();
}

function drawPandaBlocks(frame) {
  const s = displayScale;
  const jumpLift = frame === 3 ? -1 : 0;

  const block = (x, y, width, height, color) => {
    context.fillStyle = color;
    context.fillRect(x * s, y * s, width * s, height * s);
  };

  block(3, 7 + jumpLift, 11, 8, "#16325e");
  block(4, 8 + jumpLift, 9, 6, "#4ea7ff");
  block(5, 9 + jumpLift, 7, 4, "#8de8ff");
  block(4, 4 + jumpLift, 8, 5, "#16325e");
  block(5, 5 + jumpLift, 6, 3, "#a6efff");
  block(6, 6 + jumpLift, 1, 1, "#f8fdff");
  block(9, 6 + jumpLift, 1, 1, "#f8fdff");
  block(7, 6 + jumpLift, 2, 1, "#091224");
  block(4, 3 + jumpLift, 2, 2, "#16325e");
  block(9, 3 + jumpLift, 2, 2, "#16325e");
  block(5, 2 + jumpLift, 1, 1, "#4ea7ff");
  block(10, 2 + jumpLift, 1, 1, "#4ea7ff");
  block(10, 4 + jumpLift, 5, 3, "#2b5a9a");
  block(12, 3 + jumpLift, 3, 4, "#16325e");
  block(13, 5 + jumpLift, 2, 2, "#8de8ff");
  block(13, 8 + jumpLift, 3, 3, "#2b5a9a");
  block(11, 8 + jumpLift, 4, 4, "#16325e");
  block(12, 9 + jumpLift, 2, 2, "#5fcfff");

  if (frame === 0) {
    block(4, 12, 2, 3, "#16325e");
    block(8, 12, 2, 3, "#16325e");
    block(12, 11, 2, 4, "#16325e");
  } else if (frame === 1) {
    block(4, 12, 2, 3, "#16325e");
    block(8, 11, 2, 4, "#16325e");
    block(12, 12, 2, 3, "#16325e");
  } else if (frame === 2) {
    block(4, 11, 2, 4, "#16325e");
    block(8, 12, 2, 3, "#16325e");
    block(12, 11, 2, 4, "#16325e");
  } else {
    block(4, 11, 2, 3, "#16325e");
    block(8, 11, 2, 3, "#16325e");
    block(12, 11, 2, 3, "#16325e");
  }

  block(14, 6, 2, 3, "#16325e");
  block(15, 5, 2, 4, "#2b5a9a");
  block(16, 6, 1, 1, "#5fcfff");
  block(16, 8, 1, 1, "#5fcfff");
}

function render() {
  context.setTransform(backingScale, 0, 0, backingScale, 0, 0);
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, cssWidth, cssHeight);

  drawBackground();
  drawWorldTiles();
  drawHazards();
  drawCollectibles();
  drawCheckpoints();
  drawGoal();
  drawEnemies();
  drawPlayerSprite();
}

function step(timestamp) {
  if (!lastTimestamp) {
    lastTimestamp = timestamp;
  }

  const delta = Math.min(0.05, (timestamp - lastTimestamp) / 1000);
  lastTimestamp = timestamp;
  accumulator += delta;

  while (accumulator >= FIXED_DT) {
    update(FIXED_DT);
    accumulator -= FIXED_DT;
  }

  render();
  requestAnimationFrame(step);
}

function handleKeyboardStart(event) {
  if (event.code === "Space" || event.key === "Enter") {
    event.preventDefault();
    startGame();
  }
}

document.addEventListener("keydown", (event) => {
  if (event.code === "Space" || event.key === "Enter") {
    if (game.mode !== "play") {
      handleKeyboardStart(event);
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();
      input.jumpHeld = true;
      if (!event.repeat) {
        input.jumpQueued = true;
      }
      return;
    }
  }

  if (event.key === "r" || event.key === "R") {
    event.preventDefault();
    startGame();
    return;
  }

  if (game.mode !== "play") {
    return;
  }

  if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
    event.preventDefault();
    input.left = true;
  } else if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
    event.preventDefault();
    input.right = true;
  } else if (event.key === "ArrowUp" || event.key === "w" || event.key === "W") {
    event.preventDefault();
    input.jumpHeld = true;
    if (!event.repeat) {
      input.jumpQueued = true;
    }
  }
});

document.addEventListener("keyup", (event) => {
  if (event.code === "Space" || event.key === "Enter") {
    input.jumpHeld = false;
  }

  if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
    input.left = false;
  } else if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
    input.right = false;
  } else if (event.key === "ArrowUp" || event.key === "w" || event.key === "W") {
    input.jumpHeld = false;
  }
});

startButton.addEventListener("click", () => {
  startGame();
});

restartButton.addEventListener("click", () => {
  startGame();
});

controlButtons.forEach((button) => {
  const action = button.dataset.action;

  const release = () => {
    if (action === "left") {
      input.left = false;
    } else if (action === "right") {
      input.right = false;
    } else if (action === "jump") {
      input.jumpHeld = false;
    }
  };

  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);

    if (game.mode !== "play") {
      return;
    }

    if (action === "left") {
      input.left = true;
    } else if (action === "right") {
      input.right = true;
    } else if (action === "jump") {
      input.jumpHeld = true;
      input.jumpQueued = true;
    }
  });

  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
});

const resizeObserver = new ResizeObserver(() => {
  resizeCanvas();
});

resizeObserver.observe(boardStage);
window.addEventListener("resize", resizeCanvas);

resetSession();
showStartScreen();
resizeCanvas();
requestAnimationFrame(step);
