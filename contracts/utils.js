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
        waitReceipt: async (txHash, token, interval) => { // TODO rename to waitMiningReceipt
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
        estimate: async (options, contract, methodName, ...args) => {
            if(options.privateKey) {
                const privateKey = options.privateKey;
                delete options.privateKey; // TODO better
                if(contract) {
                    options.data = contract.methods[methodName](...args).encodeABI();
                    options.to = contract.options.address;
                }
                options.gas = web3.utils.toHex(options.gas);
                        
                const from = web3.eth.accounts.privateKeyToAccount(privateKey).address;
                options.from = from;
                options.nonce = web3.utils.toHex(options.nonce || await web3.eth.getTransactionCount(from));
                
                const signedTx = web3.eth.accounts.signTransaction(options, privateKey);
                return web3.eth.estimateGas(options);
            } else {
                if(contract) {
                    return contract.methods[methodName](...args).estimateGas(options);
                } else {
                    return web3.eth.estimateGas(options);
                }
            }
        },
        estimateFrom: (options, contract, methodName, ...args) =>{
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
            return contract.methods[methodName](...args).estimateGas(options, blockNumber);
        },
        sendTx: (options, contract, methodName, ...args) => {
            return new Promise(async (resolve, reject) => {
                if(options.privateKey) {
                    const privateKey = options.privateKey;
                    delete options.privateKey; // TODO better
                    if(contract) {
                        options.data = contract.methods[methodName](...args).encodeABI();
                        options.to = contract.options.address;
                    }
                    options.gas = web3.utils.toHex(options.gas);
                            
                    const from = web3.eth.accounts.privateKeyToAccount(privateKey).address;
                    options.from = from;
                    console.log(await web3.eth.getBalance(from));
                    options.nonce = web3.utils.toHex(options.nonce || await web3.eth.getTransactionCount(from));
                    
                    console.log(JSON.stringify(options, null, '  '));
                    web3.eth.accounts.signTransaction(options, privateKey).then((signedTx) => {
                        console.log('rawTransaction : ' + signedTx.rawTransaction);
                        dealWithPromiEvent(web3.eth.sendSignedTransaction(signedTx.rawTransaction));
                    })
                } else {
                    let promiEvent;
                    if(contract) {
                        promiEvent = contract.methods[methodName](...args).send(options);
                    } else {
                        promiEvent = web3.eth.sendTransaction(options);
                    }
                    dealWithPromiEvent(promiEvent);
                }
                
                function dealWithPromiEvent(promiEvent) {
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
                }
                
            })
            
        },
        getPastEvents: (contract, eventName, options) => {
            return contract.getPastEvents(eventName, options);
        },
        instantiateContract: (address, abi) => {
            return new web3.eth.Contract(abi, address);
        },
        privateKeyToAccount: (pk) => web3.eth.accounts.privateKeyToAccount(pk),
    };
}