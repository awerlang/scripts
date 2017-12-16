// Usage: ping http://www.webapp.com -t 30s -i

const request = require('request-promise-native')
const ms = require('ms')

const {line, success, error, fail} = require('./lib/output')

async function run (constructor, argv) {
  try {
    const command = new constructor(argv)
    await command.run()
  } catch (err) {
    process.exitCode = 1
    fail(err)
  }
}

class Results {
  constructor () {
    this.success = {
      requests: 0,
      elapsedTime: 0
    }
    this.failure = {
      requests: 0,
      elapsedTime: 0
    }
  }

  addSuccess (elapsedTime) {
    this.success.requests++
    this.success.elapsedTime += elapsedTime
  }

  addFailure (elapsedTime) {
    this.failure.requests++
    this.failure.elapsedTime += elapsedTime
  }

  report () {
    line('========')
    line('Results  Requests  Elapsed')
    line('Success ', this.success.requests.toString().padStart(8), (this.success.elapsedTime / 1000 + 's').toString().padStart(8))
    line('Failure ', this.failure.requests.toString().padStart(8), (this.failure.elapsedTime / 1000 + 's').toString().padStart(8))
  }
}

class Ping {
  constructor (args) {
    this.results = new Results()
    this.url = args.url
    this.timeout = ms(args.timeout)
    this.forever = args.interval
    this.onStop = this.stop.bind(this)
  }

  stop () {
    this.isDone = true
  }

  onBegin() {
    process.on('SIGINT', this.onStop)
  }

  onEnd() {
    process.removeListener('SIGINT', this.onStop)
  }

  async onRun() {
    this.isDone = false

    do {
      await request({
        url: this.url,
        timeout: this.timeout,
        time: true,
        resolveWithFullResponse: true
      }).then(response => {
        this.log(response, response)
      }, err => {
        if (err.code !== 'ETIMEDOUT') {
            throw err
        }
        this.log(err, err.response)
      })

      if (this.isDone) {
        break
      }
    } while (this.forever)

    this.results.report()
  }

  async run () {
      this.onBegin()
      try {
          await this.onRun()
      } finally {
          this.onEnd()
      }
  }

  log (result, response) {
    if (response) {
      if (result.statusCode >= 200 && result.statusCode <= 399) {
        this.results.addSuccess(response.elapsedTime)
        success(new Date().toLocaleTimeString(), result.statusCode, 'took', response.elapsedTime, 'ms')
      } else {
        this.results.addFailure(response.elapsedTime)
        error(new Date().toLocaleTimeString(), result.statusCode, 'took', response.elapsedTime, 'ms')
      }
    } else {
      this.results.addFailure(this.timeout)
      error(new Date().toLocaleTimeString(), 'timeout')
    }
  }
}

require('yargs')
    .command('* <url>', 'ping the server', (yargs) => {
      yargs
            .positional('url', {
              describe: 'url to ping'
            })
            .option('interval', {
              alias: 'i',
              describe: 'repeat until stopped',
              default: false
            })
            .option('timeout', {
              alias: 't',
              describe: 'maximum time to wait for a response',
              default: '30s'
            })
    }, (argv) => run(Ping, argv))
    .argv
