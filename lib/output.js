module.exports = outputError

function outputError (err) {
  if (process.env.NODE_ENV !== 'production') {
    console.error(err)
  }
}
