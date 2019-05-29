const rocketh = require('rocketh');
const {tx} = require('rocketh-web3')(rocketh, require('Web3'));

module.exports = async ({namedAccounts}) => {
    const {deployer, portisAccount} = namedAccounts;
    await tx({from: deployer, to: portisAccount, value: '20000000000000000000', gas: 21000})
}
