import BCHJS from '@psf/bch-js'
const getBalancesResult = {
  bchBalance: 2,
  send: () => {
    return {
      success: true,
      status: 200,
      endpoint: 'broadcast',
      txid: 'deedc4f82bb77d920b0c867aeaf7b410ee8d71cb76ac9367b8c6d624feff757b'
    }
  },
  bchjs: new BCHJS()
}
const getBalancesResult2 = {
  bchBalance: 2,
  send: () => {
    return {
      success: false,
      status: 422,
      endpoint: 'broadcast',
      txid: ''
    }
  },
  bchjs: new BCHJS()
}
export { getBalancesResult }
export { getBalancesResult2 }
export default {
  getBalancesResult,
  getBalancesResult2
}
