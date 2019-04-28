<script>
import { dungeon } from '../stores/dungeon.js';
function enterDungeon() {
    $dungeon.join();
}
</script>

<p>Welcome</p>

<button on:click="{enterDungeon}" >Enter</button>
