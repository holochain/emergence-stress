import process from 'node:process'
import { spawn } from 'child_process'

const count = parseInt(process.argv[2]) || 5

console.log(`running ${count} parallel tests`)

const procs = []

process.on('exit', () => {
  for (const proc of procs) {
    proc.kill('SIGKILL')
  }
})

function run() {
  const proc = spawn('node', ['./index.js'], {
    stdio: 'inherit'
  })

  proc.on('error', (err) => {
    console.error('error', err)
  })

  procs.push(proc)

  console.log(`PROC COUNT NOW ${procs.length}`)
}

run()

setInterval(() => {
  if (procs.length >= count) {
    procs.shift().kill('SIGKILL')
  }

  run()
}, 10000)
