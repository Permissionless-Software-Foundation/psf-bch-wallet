/*
  The 'bar' command
*/

// async function start() {
//   console.log('The bar command was executed.')
// }
// start()

class Bar {
  run (args) {
    console.log('Bar.run() executed with args: ', args)
  }
}

export default Bar
