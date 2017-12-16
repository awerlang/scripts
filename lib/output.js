const chalk = require('chalk')

const line = console.log

function success (...args) {
  line(args.join(' '))
}
function error (...args) {
  line(chalk.red(args.join(' ')))
}

function fail (err) {
  if (process.env.NODE_ENV !== 'production') {
    console.error(err)
  }
}

module.exports = {
  line,
  success,
  error,
  fail
}
