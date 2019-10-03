const rocketh = require('rocketh');
const {web3, deploy, getDeployedContract, getBalance, tx} = require('rocketh-web3')(rocketh, require('Web3'));
const Dungeon = require('../dungeon');

const {
    waitReceipt
} = require('../utils')(rocketh.ethereum);

const config = require('../../webapp/src/config')(rocketh.chainId); // TODO contract expose min balance / price

const gas = 6000000;
module.exports = async ({namedAccounts, isDeploymentChainId}) => {
    const {deployer, users, dungeonOwner} = namedAccounts;
    
    // if(!isDeploymentChainId) {
    //     const latestBlock = web3.eth.getBlock('latest');
    //     if(latestBlock.number < 100) {
    //         for(let i = 0; i < 256; i++) {
    //             await web3.eth.sendTransaction({from: deployer, to: users[0], value:1, gas});
    //         }
    //     }
    // }

    await deploy("Dungeon",  {from: deployer, gas}, "Dungeon", dungeonOwner, config.minBalance); // TODO configure

    const dungeonContract = getDeployedContract('Dungeon');
    const latestBlock = await web3.eth.getBlock('latest');
    const receipt = await tx({from: dungeonOwner, gas: 400000}, dungeonContract, 'start', latestBlock.number, latestBlock.hash);
    console.log(receipt);

    // dungeonContract.methods.start()
    // const dungeon = new Dungeon(rocketh.ethereum, dungeonContract.options.address, dungeonContract.options.jsonInterface);
    // await dungeon.start(dungeonOwner).then(waitReceipt);
}