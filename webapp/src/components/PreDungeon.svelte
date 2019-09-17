<script>
import Room from './Room.svelte';
let room = {
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
        north:false,
        east: true,
        west: false,
        south: true,
    }
};
const utils = {
    waitReceipt: async (txHash) => {blockNumber: 1},
};
const dungeon = {
    move: async (direction) => {
        room = {
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
                north:false,
                east: true,
                west: false,
                south: true,
            }
        };
        return "0xff";
    },
    once: async () => {}
}
</script>

<Room room={room} utils={utils} dungeon={dungeon} />
            