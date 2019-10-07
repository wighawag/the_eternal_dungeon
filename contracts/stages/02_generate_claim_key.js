const rocketh = require('rocketh');
const ethers = require('ethers');
const { Wallet, BigNumber } = ethers;
const {web3, deploy, getDeployedContract, getBalance, tx} = require('rocketh-web3')(rocketh, require('Web3'));
const Dungeon = require('../dungeon');
const fs = require('fs')

const config = require('../../webapp/src/config')(rocketh.chainId); // TODO contract expose min balance / price
module.exports = async ({namedAccounts, isDeploymentChainId}) => {
    const {deployer} = namedAccounts;
    const numClaimKey = 100;
    const claimKeys = [];
    const price = BigNumber.from(config.price);
    const claimKeyValue = price.add(price.div(2));

    await deploy("Batch",  {from: deployer, gas: 1000000}, "Batch"); // TODO deployIfDifferent
    const batch = getDeployedContract('Batch');
    const addresses = [];
    let totalValue = BigNumber.from(0);
    for(let i = 0; i < numClaimKey; i++) {
        let path = "m/44'/60'/" + i + "'/0/0";
        const wallet = Wallet.fromMnemonic('poet state twin chunk pottery boss final sudden matter express nasty control', path)
        claimKeys.push(wallet.privateKey);
        addresses.push(wallet.address);
        totalValue = totalValue.add(claimKeyValue);
        // await tx({from: deployer, gas: 23000, to: wallet.address, value: claimKeyValue.toString()});
    }
    await tx({from: deployer, value: totalValue.toString(), gas: 6000000}, batch, 'transfer', addresses);
    fs.writeFileSync('.claimKeys', JSON.stringify(claimKeys));
    console.log('done');
}