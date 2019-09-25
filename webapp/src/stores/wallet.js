import log from '../utils/log';
import WalletStore from 'svelte-wallet';
import contractsInfo from 'contractsInfo';

function findGetParameter(parameterName) {
    var result = null,
        tmp = [];
    var items = location.search.substr(1).split("&");
    for (var index = 0; index < items.length; index++) {
        tmp = items[index].split("=");
        if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
    }
    return result;
}

const wallet = WalletStore(log);
let dev = process.env.NODE_ENV === 'development';
if (dev) {
    console.log('DEVELOPMENT MODE');
}

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
if (process.browser) {
    fallbackUrl = findGetParameter('fallbackUrl') || fallbackUrl;
}

wallet.load({
    fallbackUrl,
    supportedChainIds,
    registerContracts: ($wallet) => {
        if ($wallet && $wallet.chainId) {
            const chainId = $wallet.chainId;
            if (contractsInfo[chainId]) {
                console.log('setting up contract for chainId', contractsInfo[chainId]);
                return contractsInfo[chainId];
            } else {
                console.log('no contract for chainId ' + chainId);
            }
        } else {
            if (process.browser) {
                // TODO ?
                console.log('could not compute $wallet.chainId');
            }
        }
        return {};
    }
});
export default wallet; 
