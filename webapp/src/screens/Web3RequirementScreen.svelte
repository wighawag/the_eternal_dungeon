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
async function connectWithPortis() {
    processing = true;
    try{
        await web3Status.usePortis();
    }catch(e) {
        processing = false;
    }
    processing = false;
}
</script>
    
<p>Please get a wallet</p>

<button disabled={processing} on:click="{connectWithNifty}" >Connect via Nifty Gateway</button>
<button disabled={processing} on:click="{connectWithPortis}" >Connect via Portis</button>
<button on:click="{() => window.open('https://metamask.io', '_blank')}">Download Metamask</button>
            