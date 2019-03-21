const Web3 = require('web3');

function pause(duration) {
    return new Promise((res) => setTimeout(res, duration * 1000));
}

module.exports = function(provider) {
    const web3 = new Web3(provider);
    return {
        getBlock: web3.eth.getBlock,
        getBlockNumber: web3.eth.getBlockNumber,
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
        waitReceipt: async (txHash, token, interval) => {
            if(!interval) {
                interval = 5; // TODO config
            }
            let canceled = false;
            if(token) {
                token.cancel = () => {
                    canceled = true;
                }
            }
            while(!canceled) {
                const receipt = await web3.eth.getTransactionReceipt(txHash);
                if(receipt != null && receipt.blockHash != null) {
                    return receipt;
                }
                await pause(interval);
            }
        },
        sendTx: (options, contract, methodName, ...args) => {
            return new Promise((resolve, reject) => {
                let promiEvent;
                if(contract) {
                    promiEvent = contract.methods[methodName](...args).send(options);
                } else {
                    promiEvent = web3.eth.sendTransaction(options);
                }
                function onTxHash(txHash) {
                    promiEvent.off('error', onError);
                    resolve(txHash);
                }
                function onError(error) {
                    promiEvent.off('transactionhash', onTxHash);
                    reject(error);
                }
                promiEvent.once('transactionHash', onTxHash)
                promiEvent.once('error', onError);
            })
            
        },
        getPastEvents: (contract, eventName, options) => {
            return contract.getPastEvents(eventName, options);
        },
        instantiateContract: (address, abi) => {
            return new web3.eth.Contract(abi, address);
        }
    };
}