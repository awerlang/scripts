// Usage: ping http://www.webapp.com -t 30s -i

const request = require('request-promise-native')
const ms = require('ms')

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
  function log (result, response) {
    if (response) {
      console.log(new Date().toLocaleTimeString(), result.statusCode, 'took', response.elapsedTime, 'ms')
    } else {
      console.log(new Date().toLocaleTimeString(), 'timeout')
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
