import { writable, readable, derived } from 'svelte/store';
import Dungeon from '../lib/dungeon';
import BN from 'bn.js';
import wallet from './wallet';
import hallDesc from '../data/hall.json';

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
let d;
export const dungeon = derived(wallet, async ($wallet, set) => {
	if ($wallet.status === 'Ready') {
		if(lastWalletAddress !== $wallet.address) {
			lastWalletAddress = $wallet.address;
			set('loading')
			d = await loadDungeon($wallet);
			set(d);
		}
    } else {
		lastWalletAddress = null;
		if (d) {
			// console.log('terminating dungeon...')
			d.terminate();
			// d._stopListening();
			d = null;
		}
		set(null);
	}

	// TODO remove
	window.dungeon = d;
});

async function loadDungeon($wallet) {
	const player = $wallet.address.toLowerCase();

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
	} else {
		key = data.key;
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
			price: '1000000000000000000' //1 // TODO config.price[$wallet.chainId],
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
		const $directions = $dungeon.allExitsFor(room);
		let roomDesc;
		if (room.location == '0') {
			roomDesc = hallDesc;
		} else {
			roomDesc = rooms[$dungeon.getRandomValue(room.location, room.hash, 99, rooms.length)];
		}
		roomDesc.directions = $directions;
		set(textify(roomDesc));
	}
})
