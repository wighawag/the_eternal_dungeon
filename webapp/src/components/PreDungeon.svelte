<script>
import Room from './Room.svelte';
import { dungeon } from '../stores/dungeon';
import rooms from '../data/pre-dungeon.json';
import wallet from '../stores/wallet';

// associate ids
const roomIds = Object.keys(rooms);
for (const roomId of roomIds) {
    rooms[roomId].id = roomId;
}

let player = $dungeon.player;

let room = rooms[localStorage.getItem(player + '_' + $wallet.chainId + '_preDungeon') || 'first'];

$: if(player) { 
    localStorage.setItem(player + '_' + $wallet.chainId + '_preDungeon', room.id);
}

$: roomObj = {
    scene: room.scene,
    directions: room.directions,
    move: async (direction) => {
        let dirName;
        switch (direction) {
            case 0: dirName = 'north'; break;
            case 1: dirName = 'east'; break;
            case 2: dirName = 'south'; break;
            case 3: dirName = 'west'; break;
        }
        room = rooms[room.directions[dirName]]
    },
    act: async (choice) => {
        const tx = await $dungeon.join();
        if (tx) {
            const receipt = await tx.wait();
            await $dungeon.once('block', (block) => block >= receipt.blockNumber);
        } else {
            console.error('error tx');
            throw 'error'
        }
    },
};
</script>

<Room room={roomObj} />
            