const rocketh = require('rocketh');
const {web3, deploy, getDeployedContract} = require('rocketh-web3')(rocketh, require('Web3'));
const Dungeon = require('../dungeon');

const {
    waitReceipt
} = require('../utils')(rocketh.ethereum);

const gas = 6000000;
module.exports = async ({namedAccounts}) => {
    const {deployer, users, dungeonOwner} = namedAccounts;
    const latestBlock = web3.eth.getBlock('latest');
    if(latestBlock.number < 100) {
        for(let i = 0; i < 256; i++) {
            await web3.eth.sendTransaction({from: deployer, to: users[0], value:1, gas});
        }
    }

    await deploy("Dungeon",  {from: deployer, gas}, "Dungeon", dungeonOwner);

    const dungeonContract = getDeployedContract('Dungeon');
    // dungeonContract.methods.start()
    const dungeon = new Dungeon(rocketh.ethereum, dungeonContract.options.address, dungeonContract.options.jsonInterface);
    await dungeon.start(dungeonOwner).then(waitReceipt);
}