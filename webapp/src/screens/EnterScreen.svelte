<script>
import { dungeon } from '../stores/dungeon.js';
const utils = $dungeon.utils;
let entering = false;
async function enterDungeon() {
    entering = true;
    try{
        await $dungeon.join().then(utils.waitReceipt);
    }catch(e) {
        console.error(e);
        entering = false;
    }
    // await dungeon.wa
    // entering = false;
}
</script>

<p>Welcome</p>

<button disabled={entering} on:click="{enterDungeon}" >Enter</button>
