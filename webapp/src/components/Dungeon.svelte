<script>
import Room from './Room.svelte';
import { room, dungeon} from '../stores/dungeon';

$: utils = $dungeon.utils();

$: roomObj = {
    scene: $room.scene,
    directions: $room.directions,
    move: async (direction) => {
        const receipt = await $dungeon.move(direction).then(utils.waitReceipt);
        await $dungeon.once('block', (block) => block >= receipt.blockNumber);
        return receipt;
    },
    act: async() => {

    },
    claimChest: async () => {
        const receipt = await $dungeon.claimChest($room.location).then(utils.waitReceipt); // TODO try catch
        if(receipt.status == '0x0') {
            console.error('tx failed', receipt);
        }
        await $dungeon.once('block', (block) => block >= receipt.blockNumber);
        return receipt;
    }
};
</script>

<Room room={roomObj} />
    