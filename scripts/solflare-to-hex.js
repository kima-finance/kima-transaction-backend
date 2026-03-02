#!/usr/bin/env node
'use strict'

const fs = require('fs')
const bs58 = require('bs58')

const readStdin = () =>
  new Promise((resolve, reject) => {
    let data = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (chunk) => {
      data += chunk
    })
    process.stdin.on('end', () => resolve(data))
    process.stdin.on('error', reject)
  })

const parseInput = (input) => {
  const trimmed = input.trim()
  if (!trimmed) return null

  if (trimmed.startsWith('[')) {
    const bytes = JSON.parse(trimmed)
    if (!Array.isArray(bytes)) {
      throw new Error('JSON input must be an array of numbers.')
    }
    return Buffer.from(bytes)
  }

  return Buffer.from(bs58.decode(trimmed))
}

const main = async () => {
  const args = process.argv.slice(2)
  let raw = ''

  if (args[0] === '--file') {
    const filePath = args[1]
    if (!filePath) throw new Error('Missing file path after --file.')
    raw = fs.readFileSync(filePath, 'utf8')
  } else if (args[0]) {
    raw = args[0]
  } else {
    raw = await readStdin()
  }

  const bytes = parseInput(raw)
  if (!bytes) {
    throw new Error(
      'No input provided. Pass a base58 key, a JSON array, or use --file.'
    )
  }

  process.stdout.write(`0x${Buffer.from(bytes).toString('hex')}\n`)
}

main().catch((err) => {
  console.error(`Error: ${err.message}`)
  process.exit(1)
})
