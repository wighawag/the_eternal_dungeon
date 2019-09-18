<script>
import Room from './Room.svelte';
import { dungeon } from '../stores/dungeon.js';

let rooms = {
    'final' : {
        scene: {
            id: 'entrance',
            name: 'The Entrance',
            description: [
                'You finally reached the entrance of the dungeon. From the number of skeleton around the massive door, you guess many have tempted to reached inside.',
                'Hopefully for you, you already now how to enter and it is time for you to incant the spell',
                'The energy required is 100000100 DAI, Are you ready?, The adventure awaits'
            ],
            scenes: [
                {
                    name: 'look Door',
                    description: [
                        'The door is made of 2 massive panel made of what looks like some sort of metal',
                        'There is no visible locking mechanism and your heads woner how the spell works.',
                        'You trust the efficiency of magic but you always like to find an explanation beind its working'
                    ],
                    scenes: [
                        {
                            name: 'scratch the door with your sword',
                            description: [
                                'Just as you draw your sword, you feel some electricity in the air',
                                'the electricity intisify as you approach the blade to the door',
                                'It is probably a good idea to put your sword back'
                            ],
                        },
                    ],
                },
                {
                    name: 'look behind',
                    description: [
                        'it has been a long way and you wonder if you ll ever see again these hills',
                        'And if you do, In how long would it be?'
                    ],
                },
                {
                    name: 'open the door',
                    description: [
                        'Your remember the spell words and incant them',
                        'You feel the energy being drained...'
                    ],
                    actionIndex: 0,
                }
            ],
        },
        directions: {
            north: false,
            east: false,
            west: 'second',
            south: false,
        }
    },
    'first' : {
        scene: {
            name: 'The Test',
            description: [
                'The roosadasd',
            ],
            scenes: [
                {
                    name: 'look wall',
                    description: ['the wall is white'],
                    scenes: [
                        {
                            name: 'inspect hole',
                            description: [
                                'as you look, you see an insect coming out',
                                'There is light other side...',
                            ],
                        },
                    ],
                },
                {
                    name: 'look ceiling',
                    description: ['The ceiling is weird'],
                    scenes: [
                        {
                            name: 'jump',
                            description: ['too high']
                        },
                    ],
                },
            ],
        },
        directions: {
            north:'second',
            east: false,
            west: false,
            south: false,
        }
    },
    'second': {
        scene: {
            name: 'The dasdas',
            description: [
                'Nowhere',
            ],
            scenes: [
                {
                    name: 'look ground',
                    description: ['the ground is green'],
                    scenes: [
                        {
                            name: 'break',
                            description: [
                                'Nothing happened',
                            ],
                        },
                    ],
                },
            ],
        },
        directions: {
            north: false,
            east: 'final',
            west: false,
            south: 'first',
        }
    }
};

let room = rooms['first'];

const utils = {
    waitReceipt: async (txHash) => {blockNumber: 1},
};
const dungeonObj = {
    move: async (direction) => {
        let dirName;
        switch (direction) {
            case 0: dirName = 'north'; break;
            case 1: dirName = 'east'; break;
            case 2: dirName = 'south'; break;
            case 3: dirName = 'west'; break;
        }
        room = rooms[room.directions[dirName]];
        return "0xff";
    },
    once: async () => {}
}

$: roomObj = {
    scene: room.scene,
    directions: room.directions,
    move: async (direction) => {
        return dungeonObj.move(direction).then(utils.waitReceipt);
    },
    act: async (choice) => {
        const receipt = $dungeon.join().then(utils.waitReceipt);
        await $dungeon.once('block', (block) => block >= receipt.blockNumber);
    },
};
</script>

<Room room={roomObj} />
            