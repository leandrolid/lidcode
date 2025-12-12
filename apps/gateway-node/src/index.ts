import os from 'node:os'
import cluster from 'node:cluster'

function runPrimaryProcess() {
  const processesCount = os.cpus().length
  console.log(`Primary ${process.pid} is running.`)
  console.log(`Starting primary process. Spawning ${processesCount} worker processes...`)
  for (let i = 0; i < processesCount; i++) {
    cluster.fork()
  }
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Code: ${code}, Signal: ${signal}`)
    console.log('Starting a new worker process...')
    cluster.fork()
  })
}

async function runWorkerProcess() {
  await import('./app/server.js')
}

if (cluster.isPrimary) {
  runPrimaryProcess()
} else {
  runWorkerProcess()
}
