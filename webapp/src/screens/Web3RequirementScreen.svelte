<script>
import { web3Status } from '../stores/dungeon';

let processing = false;
async function connectWithNifty() {
    processing = true;
    try{
        await web3Status.useNiftyGateway();
    }catch(e) {
        processing = false;
    }
    processing = false;
}
async function connectWithPortis(chainName) {
    processing = true;
    try{
        await web3Status.usePortis(chainName);
    }catch(e) {
        processing = false;
    }
    processing = false;
}
</script>
    
<p>Please get a wallet</p>

<!-- <button disabled={processing} on:click="{connectWithNifty}" >Connect via Nifty Gateway</button> -->
<button disabled={processing} on:click="{() => connectWithPortis('rinkeby')}" >Connect via Portis (Rinkeby)</button>
<button disabled={processing} on:click="{() => connectWithPortis('sokol')}" >Connect via Portis (Sokol)</button>
<button on:click="{() => window.open('https://metamask.io', '_blank')}">Download Metamask</button>
            