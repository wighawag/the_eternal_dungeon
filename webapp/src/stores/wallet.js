import log from '../utils/log';
import WalletStore from 'svelte-wallet';

const wallet = WalletStore(log);
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

    const params = window.hashParams || {};
    if (process.browser) {
        fallbackUrl = window.params.fallbackUrl || fallbackUrl;
    }

    wallet.load({
        fallbackUrl,
        localKey: params.privateKey || true,
        supportedChainIds,
        disableBuiltInWallet: window.params.disableBuiltInWallet,
        registerContracts: async ($wallet) => {
            if ($wallet && $wallet.chainId) {
                const chainId = $wallet.chainId;
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
