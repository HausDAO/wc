module.exports = {
  compilers: {
    solc: {
      version: '0.5.11',
      settings: {
        optimizer: {
          enabled: true, // Default: false
          runs: 200      // Default: 200
        },
      }
    }
  }
}
