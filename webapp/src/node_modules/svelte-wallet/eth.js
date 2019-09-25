import * as ethers from 'ethers';

let contracts = {};
let provider;
let signer;
let builtinProvider;

export default {
    _setup: (ethereumOrURL, ethereum) => {
        if (typeof ethereumOrURL === 'string') {
            provider = new ethers.providers.JsonRpcProvider(ethereumOrURL);
            if (ethereum) {
                builtinProvider = new ethers.providers.Web3Provider(ethereum);
            } else {
                builtinProvider = provider;
            }
        } else {
            provider = new ethers.providers.Web3Provider(ethereumOrURL);
            builtinProvider = provider;
            signer = provider.getSigner();
        }

        // TODO remove (debug)
        window.provider = provider;
        window.signer = signer;
        window.builtinProvider = builtinProvider;
    },
    fetchChainId: () => {
        return provider.send('net_version').then((result) => {
            return '' + result;
        });
        // return provider.getNetwork().then((net) => {
        //     const chainId = '' + net.chainId;
        //     if (chainId == '1337') { // detect ganache
        //         return provider.send('net_version').then((result) => {
        //             return '' + result;
        //         });
        //     } else {
        //         return chainId;
        //     }
        // });
    },
    fetchBuiltinChainId: () => {
        return builtinProvider.send('net_version').then((result) => {
            return '' + result;
        });
        // return builtinProvider.getNetwork().then((net) => {
        //     const chainId = '' + net.chainId;
        //     if (chainId == '1337') { // detect ganache
        //         return builtinProvider.send('net_version').then((result) => {
        //             return '' + result;
        //         });
        //     } else {
        //         return chainId;
        //     }
        // });
    },
    fetchAccounts: () => signer ? provider.listAccounts() : [],
    setupContracts: (contractsInfo) => {
        contracts = {};
        for (let key of Object.keys(contractsInfo)) {
            const info = contractsInfo[key];
            contracts[key] = new ethers.Contract(info.address, info.contractInfo.abi, signer || provider);
        }
        
        // TODO remove (debug)
        window.contracts = contracts;
        window.skipMonths = async (m) => {
            const tx = await contracts.Pension.functions.debug_addTimeDelta(m * 2629746);
            console.log({tx});
        };

        return contracts;
    },
    getTransactionReceipt: async (txHash) => {
        let p = await provider.getTransactionReceipt(txHash);
        return p;
    },

};
