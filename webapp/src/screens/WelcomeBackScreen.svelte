<script>
import { dungeon } from '../stores/dungeon.js';
const utils = $dungeon.utils;
let addingDelegate = false;
async function addDelegate() {
    try{
        addingDelegate = true;
        await $dungeon.addDelegate().then(utils.waitReceipt);
    } catch(e) {
        addingDelegate = false;
    }
}
</script>

<p>Welcone Back!</p>

<button disabled={addingDelegate} on:click="{addDelegate}" >Sign Back In</button>
