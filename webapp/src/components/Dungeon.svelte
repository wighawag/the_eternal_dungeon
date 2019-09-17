<script>
import Room from './Room.svelte';
import { room, dungeon} from '../stores/dungeon';
const utils = $dungeon.utils;
</script>

<Room room={$room} utils={utils} dungeon={$dungeon} />
    