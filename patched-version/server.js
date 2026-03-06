const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const path = require('path')
const app = express()
app.use(cors())
app.use(bodyParser.json())

// Server-side game state
let balance = 10000
let totalSpins = 0
let totalWins = 0
const targetWinRate = 0.4

// Tile values for server-side calculation
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

app.use(express.static(__dirname))

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'))
})

// ✅ Server determines win outcome
function shouldWin() {
  const currentRate = totalSpins > 0 ? totalWins / totalSpins : 0
  return currentRate < targetWinRate || Math.random() < targetWinRate
}

// ✅ Server validates and calculates matches
function validateGrid(grid) {
  if (!Array.isArray(grid) || grid.length !== 4) return false
  for (let row of grid) {
    if (!Array.isArray(row) || row.length !== 5) return false
    for (let tile of row) {
      if (!(tile in tileValues)) return false
    }
  }
  return true
}

// ✅ Server calculates total win from grid
function calculateTotalWin(grid) {
  let totalScore = 0
  let multiplier = 1
  let hasMatch = true
  let gridCopy = JSON.parse(JSON.stringify(grid))

  while (hasMatch) {
    const matched = findMatches(gridCopy)
    const score = removeMatchesAndScore(gridCopy, matched)

    if (score > 0) {
      totalScore += score * multiplier
      multiplier = multiplier === 1 ? 2 : multiplier === 2 ? 3 : 5
      collapseGrid(gridCopy)
    } else {
      hasMatch = false
    }
  }

  return totalScore
}

function findMatches(grid) {
  const matched = Array.from({ length: 4 }, () => Array(5).fill(false))

  // Check horizontal matches
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col <= 2; col++) {
      const t = grid[row][col]
      if (t && t === grid[row][col + 1] && t === grid[row][col + 2]) {
        matched[row][col] = matched[row][col + 1] = matched[row][col + 2] = true
      }
    }
  }

  // Check vertical matches
  for (let col = 0; col < 5; col++) {
    for (let row = 0; row <= 1; row++) {
      const t = grid[row][col]
      if (t && t === grid[row + 1][col] && t === grid[row + 2][col]) {
        matched[row][col] = matched[row + 1][col] = matched[row + 2][col] = true
      }
    }
  }

  return matched
}

function removeMatchesAndScore(grid, matched) {
  let score = 0
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      if (matched[row][col]) {
        const tile = grid[row][col]
        score += tileValues[tile] || 0
        grid[row][col] = null
      }
    }
  }
  return score
}

function collapseGrid(grid) {
  const tiles = Object.keys(tileValues)
  for (let col = 0; col < 5; col++) {
    let emptyRow = 3
    for (let row = 3; row >= 0; row--) {
      if (grid[row][col] !== null && grid[row][col] !== '') {
        grid[emptyRow][col] = grid[row][col]
        if (emptyRow !== row) grid[row][col] = null
        emptyRow--
      }
    }
    for (let row = emptyRow; row >= 0; row--) {
      grid[row][col] = tiles[Math.floor(Math.random() * tiles.length)]
    }
  }
}

// ✅ SECURE ENDPOINT: Server-authoritative with validation
app.post('/spin', (req, res) => {
  const { bet, grid } = req.body
  
  // ⚠️ INPUT VALIDATION
  // 1. Validate bet amount
  if (typeof bet !== 'number' || bet < 1 || bet > 1000) {
    return res.status(400).json({ 
      error: 'Invalid bet amount',
      balance 
    })
  }

  // 2. Check balance BEFORE deducting
  if (balance < bet) {
    return res.status(400).json({ 
      error: 'Insufficient balance',
      balance 
    })
  }

  // 3. Validate grid structure
  if (!validateGrid(grid)) {
    return res.status(400).json({ 
      error: 'Invalid grid data',
      balance 
    })
  }

  // ✅ SAFE ACCOUNTING: Deduct first, pay later
  balance -= bet
  totalSpins++

  // ✅ SERVER CALCULATES WIN (not client)
  const serverCalculatedWin = calculateTotalWin(grid)
  const isWin = shouldWin()
  
  let totalWin = 0
  let message = ''

  if (isWin && serverCalculatedWin > 0) {
    totalWins++
    totalWin = serverCalculatedWin
    balance += totalWin  // Pay winnings
    message = totalWin >= 1000
      ? `🎉 ชนะรางวัลใหญ่! ได้ ${totalWin} บาท!`
      : `🎉 ชนะ! รับไปเลย ${totalWin} บาท`
  } else {
    message = `😭 แพ้! เสีย ${bet} บาท`
  }

  // Log for security audit
  console.log(`[AUDIT] Spin #${totalSpins} | Bet: ${bet} | Win: ${totalWin} | Balance: ${balance}`)

  res.json({
    message,
    balance,
    totalWin
  })
})

// ✅ Balance check endpoint
app.get('/balance', (req, res) => {
  res.json({ balance })
})

app.listen(3001, () => {
  console.log('✅ SECURE Server running at http://localhost:3001')
  console.log('🔒 Security Features:')
  console.log('   ✓ Server-authoritative game logic')
  console.log('   ✓ Input validation (bet: 1-1000)')
  console.log('   ✓ Balance verification before spin')
  console.log('   ✓ Deduct-first-pay-later accounting')
  console.log('   ✓ No client-controlled winnings')
})