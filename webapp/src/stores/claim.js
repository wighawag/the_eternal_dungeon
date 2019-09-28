import { writable, readable, derived } from 'svelte/store';
import wallet from './wallet';
import { Wallet, BigNumber } from 'ethers';
import log from '../utils/log';

const params = window.hashParams || {};

let lastWalletAddress;
const $claim = {
    status: params.claimKey ? 'WaitingWallet' : 'None',
}
const store = (() => {
    let setter;
    const derivedStore = derived(wallet, async ($wallet, set) => {
        function _set(obj) {
            let diff = 0;
            for (let key of Object.keys(obj)) {
                if ($claim[key] !== obj[key]) {
                    $claim[key] = obj[key];
                    diff++;
                }
            }
            if (diff > 0) {
                log.trace('claim DATA', JSON.stringify($claim, null, '  '));
                set($claim);
            }
        }
        setter = _set;
    
        // TODO remove :
        if ($wallet.status === 'Ready') {
            const provider = wallet.getProvider();
            const walletBalance = await provider.getBalance($wallet.address);
            log.trace({walletBalance: walletBalance.toString()});
        }
        /////////////////////////////
    
        if($claim.status == 'None') {
            return;
        }
        if ($wallet.status === 'Ready') {
            if(lastWalletAddress !== $wallet.address) {
                set({status: 'Loading'});
                const provider = wallet.getProvider();
                lastWalletAddress = $wallet.address;
                let claimingTxHash;
                let localStorageKeyForClaimTxHash = $wallet.address + '_claimTxHash';
                try {
                    claimingTxHash = localStorage.getItem(localStorageKeyForClaimTxHash);
                } catch(e) {
    
                }
                if(claimingTxHash && claimingTxHash !== '') {
                    const tx = await provider.getTransaction(claimingTxHash);
                    if(tx) {
                        const receipt = await tx.wait();
                        if (tx.blockNumber) {
                            if(receipt.status === 1) {
                                _set({status: 'Claimed'});
                                return;
                            } else {
                                _set({status: 'Failed'});
                            }
                        } else {
                            const receipt = await tx.wait();
                            if(receipt.status === 1) {
                                _set({status: 'Claimed'});
                                return;
                            } else {
                                _set({status: 'Failed'});
                            }
                        }
                    } else {
                        log.trace('cannot find tx ' + claimingTxHash);
                    }
                }
                log.trace({claimKey: params.claimKey});
                const claimWallet = new Wallet(params.claimKey);
                
                const claimBalance = await provider.getBalance(claimWallet.address);
                log.trace({claimBalance});
                if (claimBalance.gt(100000000000)) {
                    const signer = claimWallet.connect(provider);
                    const gasPrice = await provider.getGasPrice();
                    const gasLimit = BigNumber.from(23000);
                    const gasFee = gasLimit.mul(gasPrice);
                    let value = claimBalance.sub(gasFee);
                    const maxValue = BigNumber.from('1010000000000000000');
                    if (value.gt(maxValue)) {
                        value = maxValue;
                    }
                    set({status: 'Claiming'});
                    const tx = await signer.sendTransaction({to: $wallet.address, value, gasLimit});
                    localStorage.setItem(localStorageKeyForClaimTxHash, tx.hash);
                    const receipt = await tx.wait();
                    if(receipt.status === 1) {
                        _set({status: 'ClaimSuccess'});
                        return;
                    } else {
                        _set({status: 'Failed'});
                    }
                } else {
                    _set({status: 'Gone'});
                }
            }
        } else {
            _set({status: 'WaitingWallet'});
        }
    }, $claim);
    
    const s = {}
    s.subscribe = derivedStore.subscribe.bind(s),
    s.acknowledge = () => {
        setter({status: 'None'});
    };
    return s;
})();
export default store;
