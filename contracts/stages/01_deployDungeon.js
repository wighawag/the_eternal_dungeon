const rocketh = require('rocketh');
const {web3, deploy} = require('rocketh-web3')(rocketh, require('Web3'));

const chainId = rocketh.chainId;

const gas = 6000000;
module.exports = async ({namedAccounts}) => {
    const {deployer, users, dungeonOwner} = namedAccounts;
    const latestBlock = web3.eth.getBlock('latest');
    if(latestBlock.number < 100) {
        for(let i = 0; i < 256; i++) {
            await web3.eth.sendTransaction({from: deployer, to: users[0], value:1, gas});
        }
    }

    const dungeon = await deploy("Dungeon", "Dungeon", {from: deployer, gas}, dungeonOwner);
}