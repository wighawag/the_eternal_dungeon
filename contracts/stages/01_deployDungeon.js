const rocketh = require('rocketh');
const {web3, deploy} = require('rocketh-web3')(rocketh, require('Web3'));

const chainId = rocketh.chainId;

const gas = 6000000;
module.exports = async ({namedAccounts}) => {
    const {deployer, others} = namedAccounts;
    if(chainId > 10000) {
        // ensure previous block is not zero block
        await web3.eth.sendTransaction({from: deployer, to: others[0], value:1, gas});
    }

    const dungeon = await deploy("Dungeon", "Dungeon", {from: deployer, gas});
    console.log(dungeon.options.address);
}