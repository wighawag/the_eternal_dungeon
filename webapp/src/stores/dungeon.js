import { writable, readable, derived } from 'svelte/store';
import Dungeon from '../lib/dungeon';
import BN from 'bn.js';
import wallet from './wallet';

const hallDesc = {
	scene: {
		name: 'The hall',
		entryDescriptions: {
			'entrance' : [
				'As you enter the dungeon, the door slam behind you. Fear establish itself but you have to go over it',
				'The room you entered is quite big with an impressive cross arch on the ceiling. The walls are all white. In the middle stand a statue and in the corner, you can notice a sort of box.',	
			],
		} ,
		description: [
			'The room is quite big with an impressive cross arch on the ceiling. The walls are all white. In the middle stand a statue and in the corner, you can notice a sort of box.',
		],
		scenes: [
			{
				name: 'look box',
				description: ['The box is made of rock, there is what some sort of pressing mechanism'],
				scenes: [
					{
						name: 'press mechanism',
						description: [
							'As you press the mechanism, you feel underneath like something is moving',
							'The box is opening...'
						],
						actionIndex: 0, // transition text is description ?
					},
				],
			},
			{
				name: 'look statue',
				description: ['The status is magnificient. it depicts a woman carrying in her a slate that she seems to read as one of her fingers touch it'],
				scenes: [
					{
						name: 'touch',
						description: ['it feels cold']
					},
				],
			},
		],
	},
};

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

let DungeonInfo;

function log(channel, ...args) {
	console.log(channel, ...args);
	// console.log.apply(console, args);
}

// dec2hex :: Integer -> String
// i.e. 0-255 -> '00'-'ff'
function dec2hex(dec) {
	return ('0' + dec.toString(16)).substr(-2)
}

// generateRandomKey :: Void -> String
function generateRandomKey() {
	var arr = new Uint8Array(32);
	crypto.getRandomValues(arr);
	return '0x' + Array.from(arr, dec2hex).join('');
}

let lastWalletAddress;
export const dungeon = derived(wallet, async ($wallet, set) => {
	if ($wallet.status === 'Ready') {
		if(lastWalletAddress !== $wallet.address) {
			lastWalletAddress = $wallet.address;
			set('loading')
			const d = await loadDungeon($wallet);
			set(d);
		}
    } else {
		set(null);
       // TODO unload ?
    }
});

async function loadDungeon($wallet) {
	const player = $wallet.address.toLowerCase();
	console.log({ player });

	let key;
	const dataS = localStorage.getItem(player); // TODO on accounts changed, need to reset // easiest solution : reload page on account change
	let data;
	if (dataS) {
		data = JSON.parse(dataS);
	}
	if (!data || !data.key) {
		key = generateRandomKey();
		try {
			localStorage.setItem(player, JSON.stringify({ key }));
		} catch (e) {
			console.error('could not save to storage');
		}
		// TODO remove
		console.log('new key', key);
	} else {
		key = data.key;
		// TODO remove
		console.log('reusing : ', key);
	}

	const contract = wallet.getContract('Dungeon');
	const dungeon = new Dungeon(
		{
			ethersProvider: window.provider, // TODO fix
			wallet,
			contract
		},
		{
			logLevel: 'trace',
			blockInterval: 12,
			price: '5000000000000000000' //1 // TODO config.price[$wallet.chainId],
		}
	);
	await dungeon.init(player, key);  // TODO on accounts changed, need to reset // easiest solution : reload page on account change

	window.BN = BN;
	window.dungeon = dungeon;

	return dungeon;
}

function deriveFromDungeon(event, fieldName) {
	return derived(dungeon, ($dungeon, set) => {
		if ($dungeon && !$dungeon.error && $dungeon != "loading") {
			set($dungeon[fieldName]);
			$dungeon.on(event, set);
		}
	}, null);
}

export const playerLocation = deriveFromDungeon('playerMoved', 'playerLocation');
export const playerEnergy = deriveFromDungeon('energyChanged', 'energy');

export const newAddress = derived(dungeon, ($dungeon, set) => {
	if ($dungeon && !$dungeon.error && $dungeon != "loading") {
		set(!$dungeon.isCurrentDelegate);
		$dungeon.on('delegated', (delegate) => { set(false); });
	}
}, null);

export const playerInDungeon = derived(dungeon, ($dungeon, set) => {
	if ($dungeon && !$dungeon.error && $dungeon != "loading") {
		set($dungeon.inDungeon);
		$dungeon.on('playerEntered', () => { set(true) });
		$dungeon.on('playerQuit', () => { set(false) });
	}
}, null);

export const roomBlockUpdate = derived(dungeon, ($dungeon, set) => {
	$dungeon.on('roomChanged', (block) => { set(block) }); // TODO roomChanged for new exits (from neighbor rooms)
})


function textify(room) {
	function textifyScene(scene, directions) { // origin
		let description = scene.description;
		if (directions) {
			const exitsArray = [];
			for (let exit of ['north', 'east', 'south', 'west']) {
				if (directions[exit]) {
					exitsArray.push(exit);
				}
			}
			let exitsDescription;
			if (exitsArray.length == 0) {
				exitsDescription = "The room has no exits";
			} else if (exitsArray.length == 1) {
				exitsDescription = "The room has only one exists, on the " + exitsArray[0];
			} else {
				exitsDescription = 'There are ' + exitsArray.length + ' exists, on the ' + exitsArray.slice(0, exitsArray.length - 1).join(', ') + ' and ' + exitsArray[exitsArray.length - 1];
			}
			description.push(exitsDescription)
		}
		scene.description = description;
		return scene;
	}
	room.scene = textifyScene(room.scene, room.directions);
	return room; // TODO clone
}

export const room = derived([dungeon, playerLocation, roomBlockUpdate], ([$dungeon, $playerLocation, $roomBlockUpdate], set) => {
	if ($playerLocation && $dungeon && !$dungeon.error) {
		const room = $dungeon.rooms[$playerLocation];
		console.log('ROOM', {room});
		const $directions = $dungeon.allExitsFor(room);
		let roomDesc;
		if (room.location == '0') {
			console.log('HALL');
			roomDesc = hallDesc;
		} else {
			roomDesc = rooms[$dungeon.getRandomValue(room.location, room.hash, 99, rooms.length)];
		}
		roomDesc.directions = $directions;
		set(textify(roomDesc));
	}
})
