let spinCount = 0;
const tiles = ['🀄', '🀇', '🀈', '🀉', '🀊', '🀋', '🀌', '🀍', '🀎', '🀏'];
const tileValues = {
  '🀄': 100,
  '🀇': 80,
  '🀈': 70,
  '🀉': 60,
  '🀊': 50,
  '🀋': 40,
  '🀌': 30,
  '🀍': 20,
  '🀎': 10,
  '🀏': 10
};

let balance = 1000;
let bet = 100;
let totalWin = 0;
let multiplier = 1;
let autoMode = false;
let turbo = false;

const COLS = 5;
const ROWS = 4;
let grid = [];

function createEmptyGrid() {
  grid = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => '')
  );
}

function fillGridRandomly() {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      grid[row][col] = tiles[Math.floor(Math.random() * tiles.length)];
    }
  }
}

function renderGrid() {
  const gridContainer = document.getElementById('slotGrid');
  gridContainer.innerHTML = '';

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.textContent = grid[row][col];
      gridContainer.appendChild(tile);
    }
  }
}

function findMatches() {
  const matched = Array.from({ length: ROWS }, () =>
    Array(COLS).fill(false)
  );

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col <= COLS - 3; col++) {
      const t = grid[row][col];
      if (t && t === grid[row][col + 1] && t === grid[row][col + 2]) {
        matched[row][col] = matched[row][col + 1] = matched[row][col + 2] = true;
      }
    }
  }

  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row <= ROWS - 3; row++) {
      const t = grid[row][col];
      if (t && t === grid[row + 1][col] && t === grid[row + 2][col]) {
        matched[row][col] = matched[row + 1][col] = matched[row + 2][col] = true;
      }
    }
  }

  return matched;
}

function removeMatchesAndScore(matched) {
  let score = 0;

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (matched[row][col]) {
        const tile = grid[row][col];
        score += tileValues[tile] || 0;
        grid[row][col] = null;
      }
    }
  }

  return score;
}

function collapseGrid() {
  for (let col = 0; col < COLS; col++) {
    let emptyRow = ROWS - 1;
    for (let row = ROWS - 1; row >= 0; row--) {
      if (grid[row][col] !== null && grid[row][col] !== '') {
        grid[emptyRow][col] = grid[row][col];
        if (emptyRow !== row) grid[row][col] = null;
        emptyRow--;
      }
    }
    for (let row = emptyRow; row >= 0; row--) {
      grid[row][col] = tiles[Math.floor(Math.random() * tiles.length)];
    }
  }
}

async function runCascade() {
  let hasMatch = true;
  multiplier = 1;
  totalWin = 0;

  while (hasMatch) {
    renderGrid();
    await new Promise((r) => setTimeout(r, turbo ? 100 : 600));

    const matched = findMatches();
    const score = removeMatchesAndScore(matched);

    if (score > 0) {
      const winAmount = score * multiplier;
      totalWin += winAmount;

      multiplier = multiplier === 1 ? 2 : multiplier === 2 ? 3 : 5;
      document.getElementById('multiplier').innerText = `x${multiplier}`;

      await new Promise((r) => setTimeout(r, turbo ? 100 : 400));
      collapseGrid();
    } else {
      hasMatch = false;
    }
  }
}

async function spin() {
  if (balance < bet) {
    alert('ยอดเงินไม่พอ!');
    return;
  }

  document.getElementById('popup').style.display = 'none';
  document.getElementById('win').innerText = '0';
  document.getElementById('multiplier').innerText = 'x1';

  createEmptyGrid();
  fillGridRandomly();
  await runCascade();

  // ✅ SECURITY FIX: Only send bet and grid - NOT totalWin
  // Server will calculate and validate everything
  fetch('http://127.0.0.1:3001/spin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      bet: bet,     // ✅ Send bet amount
      grid: grid    // ✅ Send grid for server validation
      // ❌ NO totalWin - Server calculates this!
    })
  })
    .then(res => {
      if (!res.ok) {
        throw new Error('Server rejected the request');
      }
      return res.json();
    })
    .then(data => {
      // ✅ Trust ONLY server response
      balance = data.balance;
      totalWin = data.totalWin || 0;
    
      document.getElementById('balance').innerText = balance;
      document.getElementById('win').innerText = totalWin;
      document.getElementById('popup').innerText = data.message;
      document.getElementById('popup').style.display = 'block';
    
      if (autoMode) setTimeout(spin, turbo ? 200 : 1000);
    })
    .catch(err => {
      console.error('❌ Error:', err);
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
      if (autoMode) {
        autoMode = false;
        document.getElementById('auto').classList.remove('active');
      }
    });
}

document.getElementById('spinButton').addEventListener('click', spin);
document.getElementById('plus').addEventListener('click', () => {
  bet += 10;
  if (bet > 1000) bet = 1000; // ✅ Client-side limit (server validates too)
  document.getElementById('betAmount').innerText = bet;
});
document.getElementById('minus').addEventListener('click', () => {
  if (bet > 10) bet -= 10;
  document.getElementById('betAmount').innerText = bet;
});
document.getElementById('auto').addEventListener('click', () => {
  autoMode = !autoMode;
  document.getElementById('auto').classList.toggle('active', autoMode);
  if (autoMode) spin();
});
document.getElementById('turbo').addEventListener('click', () => {
  turbo = !turbo;
  document.getElementById('turbo').classList.toggle('active', turbo);
});
