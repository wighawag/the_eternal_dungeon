import { writable, readable, derived } from 'svelte/store';
import wallet from './wallet';
import { Wallet, BigNumber } from 'ethers';
import log from '../utils/log';
import { rebuildLocationHash } from '../utils/web';

const hashParams = window.hashParams || {};
const claimKey = hashParams.claimKey;
function clearClaimKey() {
    delete hashParams.claimKey;
    rebuildLocationHash(hashParams);
}

let lastWalletAddress;
const $claim = {
    status: claimKey ? 'WaitingWallet' : 'None',
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
                    set({status: 'WaitingOldTx'});
                    const tx = await provider.getTransaction(claimingTxHash);
                    if(tx) {
                        const receipt = await tx.wait();
                        if (tx.blockNumber) {
                            if(receipt.status === 1) {
                                _set({status: 'Claimed'});
                                clearClaimKey();
                                return;
                            } else {
                                _set({status: 'Failed'});
                            }
                        } else {
                            const receipt = await tx.wait();
                            if(receipt.status === 1) {
                                _set({status: 'Claimed'});
                                clearClaimKey();
                                return;
                            } else {
                                _set({status: 'Failed'});
                            }
                        }
                    } else {
                        log.trace('cannot find tx ' + claimingTxHash);
                    }
                }
                const claimWallet = new Wallet(claimKey);
                
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
                    set({status: 'WaitingTx'});
                    const receipt = await tx.wait();
                    if(receipt.status === 1) {
                        _set({status: 'ClaimSuccess'});
                        clearClaimKey();
                        return;
                    } else {
                        _set({status: 'Failed'});
                    }
                } else {
                    _set({status: 'Gone'});
                }
                clearClaimKey();
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
