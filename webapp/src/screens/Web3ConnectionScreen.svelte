<script>
import { dungeon  } from '../stores/dungeon';
let loading = false;
async function loadDungeon() {
    loading = true;
    try{
        await dungeon.load().then(utils.waitReceipt);
    }catch(e) {
        loading = false;
    }
}
</script>
    
<p>Please connect your wallet</p>

<button disabled={loading} on:click="{loadDungeon}" >Connect</button>
    