const Web3 = require('web3');
module.exports = function(provider) {
    const web3 = new Web3(provider);
    return {
        getBlock: web3.eth.getBlock,
        soliditySha3: web3.utils.soliditySha3,
        call: (options, contract, methodName, ...args) => {
            let blockNumber;
            if(typeof contract == 'string') {
                args = args.slice();
                args.splice(0,0,methodName);
                methodName = contract;
                contract = options;
                options = null;
            } else {
                blockNumber = options.blockNumber;
                delete options.blockNumber;
            }
            return contract.methods[methodName](...args).call(options, blockNumber);
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
    };
}