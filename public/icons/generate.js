// Run once with: node generate.js
// Generates 192x192 and 512x512 PNG icons using Canvas
const { createCanvas } = require('canvas')
const fs = require('fs')

function makeIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Background
  ctx.fillStyle = '#0d4a1f'
  ctx.beginPath()
  ctx.roundRect(0, 0, size, size, size * 0.2)
  ctx.fill()

  // Spade emoji style
  ctx.fillStyle = '#fbbf24'
  ctx.font = `bold ${size * 0.55}px serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('♠', size / 2, size / 2)

  return canvas.toBuffer('image/png')
}

fs.writeFileSync('icon-192.png', makeIcon(192))
fs.writeFileSync('icon-512.png', makeIcon(512))
console.log('Done')
