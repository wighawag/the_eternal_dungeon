import log from '../utils/log';
import * as SvelteStore from 'svelte/store';
import WalletStore from 'svelte-wallet';
import { rebuildLocationHash } from '../utils/web';

const wallet = WalletStore(SvelteStore, log);
let dev = process.env.NODE_ENV === 'development';

import('contractsInfo').then((contractsInfo) => {
    let supportedChainIds = Object.keys(contractsInfo);
    let fallbackUrl;
    console.log('host', location.host);
    if (location.host.startsWith('localhost') || location.host.startsWith('127.0.0.1')) {
        fallbackUrl = 'http://localhost:8545';
    } else if (contractsInfo['1']) {
        fallbackUrl = 'https://mainnet.infura.io/v3/c985560c1dc04aed8f2c0300aa5f5efa';
    } else if(contractsInfo['77']) {
       fallbackUrl = 'https://sokol.poa.network';
    } else if (contractsInfo['4']) {
        fallbackUrl = 'https://rinkeby.infura.io/v3/c985560c1dc04aed8f2c0300aa5f5efa';
    } else {
        fallbackUrl = 'http://localhost:8545';
    }

    const hashParams = window.hashParams || {};
    const privateKey = hashParams.privateKey;
    delete hashParams.privateKey;
    // TODO rebuildLocationHash(hashParams);

    if (process.browser) {
        fallbackUrl = window.params.fallbackUrl || fallbackUrl;
    }

    wallet.load({
        fallbackUrl,
        localKey: privateKey || Boolean(hashParams.claimKey), // TODO require user interaction to create a local Key (when claimKey available)
        supportedChainIds,
        disableBuiltInWallet: typeof window.params.disableBuiltInWallet !== 'undefined'? window.params.disableBuiltInWallet !== 'false' : true,
        registerContracts: async ($wallet, chainId) => {
            chainId = chainId || $wallet.chainId;
            if (contractsInfo[chainId]) {
                return contractsInfo[chainId];
            }
            throw new Error('no contract for chainId ' + chainId);
        }
    });
});

export default wallet; 
