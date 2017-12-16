// Usage: ping http://www.webapp.com -t 30s -i

const request = require('request-promise-native')
const ms = require('ms')
const chalk = require('chalk')

const outputError = require('./lib/output')

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
    }, (argv) => ping(argv))
    .argv

async function ping (args) {
  const timeout = ms(args.timeout)
  const line = console.log

  const results = {
    success: {
      requests: 0,
      elapsedTime: 0
    },
    failure: {
      requests: 0,
      elapsedTime: 0
    }
  }

  let isDone = false
  process.on('SIGINT', () => {
    isDone = true
  })

  try {
    do {
      if (isDone) {
        break
      }
      await request({
        url: args.url,
        timeout: timeout,
        time: true,
        resolveWithFullResponse: true
      }).then(response => {
        log(response, response)
      }, error => {
        log(error, error.response)
      })
    } while (args.interval)
  } catch (err) {
    process.exitCode = 1
    outputError(err)
  }
  done()

  function success (...args) {
    line(args.join(' '))
  }
  function error (...args) {
    line(chalk.red(args.join(' ')))
  }
  function done () {
    line('========')
    line('Results  Requests  Elapsed')
    line('Success ', results.success.requests.toString().padStart(8), (results.success.elapsedTime / 1000 + 's').toString().padStart(8))
    line('Failure ', results.failure.requests.toString().padStart(8), (results.failure.elapsedTime / 1000 + 's').toString().padStart(8))
  }

  function log (result, response) {
    if (response) {
      if (result.statusCode >= 200 && result.statusCode <= 399) {
        results.success.requests++
        results.success.elapsedTime += response.elapsedTime
        success(new Date().toLocaleTimeString(), result.statusCode, 'took', response.elapsedTime, 'ms')
      } else {
        results.failure.requests++
        results.failure.elapsedTime += response.elapsedTime
        error(new Date().toLocaleTimeString(), result.statusCode, 'took', response.elapsedTime, 'ms')
      }
    } else {
      results.failure.requests++
      results.failure.elapsedTime += timeout
      error(new Date().toLocaleTimeString(), chalk.red('timeout'))
    }
  }
}
