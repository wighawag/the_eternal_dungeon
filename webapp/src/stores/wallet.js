import log from '../utils/log';
import WalletStore from 'svelte-wallet';

const wallet = WalletStore(log);
wallet.load();
export default wallet; 
