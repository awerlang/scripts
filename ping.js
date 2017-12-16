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
  function success (...args) {
    console.log(args.join(' '))
  }
  function error (...args) {
    console.log(chalk.red(args.join(' ')))
  }

  function log (result, response) {
    if (response) {
      if (result.statusCode >= 200 && result.statusCode <= 399) {
        success(new Date().toLocaleTimeString(), result.statusCode, 'took', response.elapsedTime, 'ms')
      } else {
        error(new Date().toLocaleTimeString(), result.statusCode, 'took', response.elapsedTime, 'ms')
      }
    } else {
      error(new Date().toLocaleTimeString(), chalk.red('timeout'))
    }
  }

  try {
    do {
      await request({
        url: args.url,
        timeout: ms(args.timeout),
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
}
