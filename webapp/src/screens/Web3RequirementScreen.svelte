<script>
import { web3Status } from '../stores/dungeon';

let processing = false;
async function connect() {
    processing = true;
    try{
        await web3Status.useNiftyGateway();
    }catch(e) {
        processing = false;
    }
    processing = false;
}
</script>
    
<p>Please get a wallet</p>

<button disabled={processing} on:click="{connect}" >Connect via Nifty Gateway</button>

<button href="https://metamask.io" >Download</button>
            