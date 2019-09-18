<script>
import Room from './Room.svelte';
import { room, dungeon} from '../stores/dungeon';
const utils = $dungeon.utils;

$: roomObj = {
    scene: $room.scene,
    directions: $room.directions,
    move: async (direction) => {
        const receipt = await $dungeon.move(direction).then(utils.waitReceipt);
        await $dungeon.once('block', (block) => block >= receipt.blockNumber);
        return receipt;
    },
    act: async (choice) => {
        const receipt = await choice.perform().then(utils.waitReceipt); // TODO try catch
        await $dungeon.once('block', (block) => block >= receipt.blockNumber);
        return receipt;
    }
};
</script>

<Room room={roomObj} />
    