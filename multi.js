import process from 'node:process'
import { spawn } from 'child_process'

const count = parseInt(process.argv[2]) || 5

console.log(`running ${count} parallel tests`)

const procs = []
const procPromises = []

process.on('exit', () => {
  for (const proc of procs) {
    proc.kill('SIGKILL')
  }
})

for (let i = 0; i < count; ++i) {
  procPromises.push(new Promise((_resolve, _reject) => {
    let waitStart = (200 + (Math.random() * 8000)) | 0
    console.log(`start process ${i} in ${waitStart} ms`)

    setTimeout(() => {
      const proc = spawn('npm', ['test'], {
        stdio: 'inherit',
        env: Object.assign({}, process.env, { LAST_CHAR: i })
      })
      procs.push(proc)
      proc.on('close', () => {
        console.error('close')
        process.exit(127)
      })
      proc.on('error', (err) => {
        console.error('error', err)
        process.exit(127)
      })
    }, waitStart)
  }))
}

await Promise.all(procPromises)
