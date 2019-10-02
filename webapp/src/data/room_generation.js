import {soliditySha3} from 'web3-utils';
import * as BN from 'bn.js';
import properties from './properties';

function getRandomValue(location, hash, index, mod) {
    const random = soliditySha3(
        {type: 'uint256', value: location},
        {type: 'bytes32', value: hash},
        {type: 'uint8', value: index},
    );
    return new BN(random.slice(2), 'hex').mod(new BN(mod));
}


const rooms = [
	{
		scene: {
			name: 'A random room',
			description: [
				'As you reach into the next room, you smells something horrible, like some rotten eggs. Then you realize why, the walls seems to covered by some sort of fungi. Nothing else seems to be present here.',
			],
			scenes: [
				{
					name: 'look at fungi',
					description: ['The smells is very strong but you indeed confirm that this some sort of life form'],
				},
			],
		},
	},
	{
		scene: {
			name: 'The lair',
			description: [
				'The next room is filled with smoke',
				'Inside, you quickly noticed some being sitting in the middle. He looks at you in a way that makes you feel umcomfortable',
			],
			scenes: [
				{
					name: 'attack',
					description: ['<moving_text>'],
					actionIndex: 1,
				},
			],
		},
	},
	{
		scene: {
			name: 'Another room',
			description: [
				'The next room is filled with smoke',
				'Inside, you quickly noticed some being sitting in the middle. He looks at you in a way that makes you feel umcomfortable',
			],
			scenes: [
				{
					name: 'attack',
					description: ['<moving_text>'],
					actionIndex: 1,
				},
			],
		},
	},
]

export function generateRoom(dungeonHash, roomLocation, roomHash) {
    return rooms[getRandomValue(roomLocation, roomHash, 99, rooms.length)];
}