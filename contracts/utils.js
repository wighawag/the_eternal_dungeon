const Web3 = require('web3');
const rocketh = require('rocketh');
const web3 = new Web3(rocketh.ethereum);

module.exports = {
    getBlock: web3.eth.getBlock,
    soliditySha3: web3.utils.soliditySha3,
    call: (options, contract, methodName, ...args) => {
        if(typeof contract == 'string') {
            args = args.slice();
            args.splice(0,0,methodName);
            methodName = contract;
            contract = options;
            options = null;
        }
        return contract.methods[methodName](...args).call(options);
    },
    tx: (options, contract, methodName, ...args) => {
        return contract.methods[methodName](...args).send(options);
    },
    getPastEvents: (contract, eventName, options) => {
        return contract.getPastEvents(eventName, options);
    },
    instantiateContract: (address, abi) => {
        return new web3.eth.Contract(abi, address);
    }
}