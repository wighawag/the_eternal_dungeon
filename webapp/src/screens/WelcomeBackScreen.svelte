<script>
import { dungeon } from '../stores/dungeon.js';
function addDelegate() {
    $dungeon.addDelegate();
}
</script>

<p>Welcone Back!</p>

<button on:click="{addDelegate}" >Sign in</button>
