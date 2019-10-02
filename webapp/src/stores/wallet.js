import log from '../utils/log';
import * as SvelteStore from 'svelte/store';
import WalletStore from 'svelte-wallet';
import { rebuildLocationHash } from '../utils/web';

const wallet = WalletStore(SvelteStore, log);
let dev = process.env.NODE_ENV === 'development';

import('contractsInfo').then((contractsInfo) => {
    let supportedChainIds = Object.keys(contractsInfo);
    let fallbackUrl;
    if (dev) {
        fallbackUrl = 'http://localhost:8545';
    } else if (contractsInfo['1']) {
        fallbackUrl = 'https://mainnet.infura.io/v3/c985560c1dc04aed8f2c0300aa5f5efa';
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
        disableBuiltInWallet: window.params.disableBuiltInWallet,
        registerContracts: async ($wallet, chainId) => {
            if ($wallet) {
                chainId = chainId || $wallet.chainId;
                if (contractsInfo[chainId]) {
                    return contractsInfo[chainId];
                } else {
                    console.error('no contract for chainId ' + chainId);
                }
            } else {
                if (process.browser) {
                    // TODO ?
                    console.error('could not compute $wallet.chainId');
                }
            }
            return {};
        }
    });
});

export default wallet; 
