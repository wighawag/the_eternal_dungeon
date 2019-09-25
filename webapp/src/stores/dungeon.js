import { writable, readable, derived } from 'svelte/store';
import Dungeon from '../../../contracts/dungeon';
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
	return Array.from(arr, dec2hex).join('')
}

export const dungeon = derived(wallet, async ($wallet, set) => {
    // function _set(obj) {
    //     let diff = 0;
    //     for (let key of Object.keys(obj)) {
    //         if ($data[key] !== obj[key]) {
    //             $data[key] = obj[key];
    //             diff++;
    //         }
    //     }
    //     if (diff > 0) {
    //         log.info('CONTRACT DATA', JSON.stringify($data, null, '  '));
    //         set($data);
    //     }
	// }

	if ($wallet.status === 'Ready') {
		set('loading')
		const d = await loadDungeon($wallet);
		set(d);
    } else {
		set(null);
       // TODO unload ?
    }
	
});
// 	const { subscribe, set, update } = writable();

// 	async function load() {
// 		set("loading");
// 		try {
// 			const dungeon = await loadDungeon();
// 			set(dungeon);
// 		} catch (e) {
// 			console.error(e);
// 			set({ error: e });
// 		}
// 	}
// 	return { load, subscribe };
// })()


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

	const dungeon = new Dungeon(
		window.ethereum,
		'0xAD994DEDAaB665ce5aad2a333253E30708087149',
		[
			{
			  "constant": true,
			  "inputs": [
				{
				  "name": "location",
				  "type": "uint256"
				}
			  ],
			  "name": "debug_room",
			  "outputs": [
				{
				  "name": "blockNumber",
				  "type": "uint256"
				},
				{
				  "name": "exits",
				  "type": "uint8"
				},
				{
				  "name": "kind",
				  "type": "uint8"
				},
				{
				  "name": "",
				  "type": "uint256"
				},
				{
				  "name": "numRooms",
				  "type": "uint64"
				},
				{
				  "name": "numExits",
				  "type": "uint32"
				}
			  ],
			  "payable": false,
			  "stateMutability": "view",
			  "type": "function",
			  "signature": "0x19132a72"
			},
			{
			  "constant": false,
			  "inputs": [
				{
				  "name": "_newDelegate",
				  "type": "address"
				}
			  ],
			  "name": "join",
			  "outputs": [],
			  "payable": true,
			  "stateMutability": "payable",
			  "type": "function",
			  "signature": "0x28ffe6c8"
			},
			{
			  "constant": true,
			  "inputs": [
				{
				  "name": "",
				  "type": "uint256"
				}
			  ],
			  "name": "blockHashes",
			  "outputs": [
				{
				  "name": "",
				  "type": "bytes32"
				}
			  ],
			  "payable": false,
			  "stateMutability": "view",
			  "type": "function",
			  "signature": "0x34cdf78d"
			},
			{
			  "constant": false,
			  "inputs": [],
			  "name": "refill",
			  "outputs": [],
			  "payable": true,
			  "stateMutability": "payable",
			  "type": "function",
			  "signature": "0x538e0759"
			},
			{
			  "constant": true,
			  "inputs": [
				{
				  "name": "playerAddress",
				  "type": "address"
				}
			  ],
			  "name": "getPlayer",
			  "outputs": [
				{
				  "name": "location",
				  "type": "uint256"
				},
				{
				  "name": "energy",
				  "type": "uint256"
				},
				{
				  "name": "inDungeon",
				  "type": "bool"
				}
			  ],
			  "payable": false,
			  "stateMutability": "view",
			  "type": "function",
			  "signature": "0x5c12cd4b"
			},
			{
			  "constant": false,
			  "inputs": [
				{
				  "name": "location",
				  "type": "uint256"
				},
				{
				  "name": "blockHash",
				  "type": "bytes32"
				},
				{
				  "name": "numRoomsAtDiscovery",
				  "type": "uint256"
				},
				{
				  "name": "numExitsAtDiscovery",
				  "type": "uint256"
				}
			  ],
			  "name": "generateExits",
			  "outputs": [
				{
				  "name": "",
				  "type": "uint8"
				},
				{
				  "name": "",
				  "type": "uint8"
				}
			  ],
			  "payable": false,
			  "stateMutability": "nonpayable",
			  "type": "function",
			  "signature": "0x5f74cfed"
			},
			{
			  "constant": false,
			  "inputs": [
				{
				  "name": "_delegate",
				  "type": "address"
				}
			  ],
			  "name": "removeDelegate",
			  "outputs": [],
			  "payable": false,
			  "stateMutability": "nonpayable",
			  "type": "function",
			  "signature": "0x67e7646f"
			},
			{
			  "constant": true,
			  "inputs": [
				{
				  "name": "location",
				  "type": "uint256"
				}
			  ],
			  "name": "getRoom",
			  "outputs": [
				{
				  "name": "blockNumber",
				  "type": "uint256"
				},
				{
				  "name": "exits",
				  "type": "uint8"
				},
				{
				  "name": "kind",
				  "type": "uint8"
				},
				{
				  "name": "",
				  "type": "uint256"
				},
				{
				  "name": "numRooms",
				  "type": "uint64"
				},
				{
				  "name": "numExits",
				  "type": "uint32"
				}
			  ],
			  "payable": false,
			  "stateMutability": "view",
			  "type": "function",
			  "signature": "0x6d8a74cb"
			},
			{
			  "constant": false,
			  "inputs": [
				{
				  "name": "_delegate",
				  "type": "address"
				}
			  ],
			  "name": "_addDelegate",
			  "outputs": [],
			  "payable": true,
			  "stateMutability": "payable",
			  "type": "function",
			  "signature": "0x8473762a"
			},
			{
			  "constant": false,
			  "inputs": [
				{
				  "name": "location",
				  "type": "uint256"
				}
			  ],
			  "name": "actualiseRoom",
			  "outputs": [],
			  "payable": false,
			  "stateMutability": "nonpayable",
			  "type": "function",
			  "signature": "0x8d94073c"
			},
			{
			  "constant": false,
			  "inputs": [
				{
				  "name": "blockNumber",
				  "type": "uint64"
				}
			  ],
			  "name": "actualiseBlock",
			  "outputs": [
				{
				  "name": "",
				  "type": "bytes32"
				}
			  ],
			  "payable": false,
			  "stateMutability": "nonpayable",
			  "type": "function",
			  "signature": "0x8e499127"
			},
			{
			  "constant": false,
			  "inputs": [
				{
				  "name": "delegate",
				  "type": "address"
				},
				{
				  "name": "player",
				  "type": "address"
				}
			  ],
			  "name": "isDelegateFor",
			  "outputs": [
				{
				  "name": "",
				  "type": "bool"
				}
			  ],
			  "payable": false,
			  "stateMutability": "nonpayable",
			  "type": "function",
			  "signature": "0xc23a2465"
			},
			{
			  "constant": false,
			  "inputs": [
				{
				  "name": "blockNumber",
				  "type": "uint64"
				},
				{
				  "name": "blockHash",
				  "type": "bytes32"
				}
			  ],
			  "name": "start",
			  "outputs": [],
			  "payable": false,
			  "stateMutability": "nonpayable",
			  "type": "function",
			  "signature": "0xca6aca51"
			},
			{
			  "constant": false,
			  "inputs": [
				{
				  "name": "_delegate",
				  "type": "address"
				}
			  ],
			  "name": "addDelegate",
			  "outputs": [],
			  "payable": true,
			  "stateMutability": "payable",
			  "type": "function",
			  "signature": "0xe71bdf41"
			},
			{
			  "constant": false,
			  "inputs": [
				{
				  "name": "sender",
				  "type": "address"
				},
				{
				  "name": "direction",
				  "type": "uint8"
				}
			  ],
			  "name": "move",
			  "outputs": [],
			  "payable": false,
			  "stateMutability": "nonpayable",
			  "type": "function",
			  "signature": "0xea01a648"
			},
			{
			  "constant": false,
			  "inputs": [],
			  "name": "quit",
			  "outputs": [],
			  "payable": false,
			  "stateMutability": "nonpayable",
			  "type": "function",
			  "signature": "0xfc2b8cc3"
			},
			{
			  "inputs": [
				{
				  "name": "_owner",
				  "type": "address"
				},
				{
				  "name": "_minBalance",
				  "type": "uint256"
				}
			  ],
			  "payable": false,
			  "stateMutability": "nonpayable",
			  "type": "constructor",
			  "signature": "constructor"
			},
			{
			  "anonymous": false,
			  "inputs": [
				{
				  "indexed": true,
				  "name": "location",
				  "type": "uint256"
				},
				{
				  "indexed": false,
				  "name": "blockNumber",
				  "type": "uint64"
				},
				{
				  "indexed": false,
				  "name": "numRooms",
				  "type": "uint64"
				},
				{
				  "indexed": false,
				  "name": "numExits",
				  "type": "uint32"
				}
			  ],
			  "name": "RoomDiscovered",
			  "type": "event",
			  "signature": "0x58712f0c2676897a1f5fcc66a2a65ea37f397efd6f96b30ec93a80070b3c9b89"
			},
			{
			  "anonymous": false,
			  "inputs": [
				{
				  "indexed": true,
				  "name": "location",
				  "type": "uint256"
				},
				{
				  "indexed": false,
				  "name": "blockHash",
				  "type": "bytes32"
				},
				{
				  "indexed": false,
				  "name": "exits",
				  "type": "uint8"
				},
				{
				  "indexed": false,
				  "name": "kind",
				  "type": "uint8"
				},
				{
				  "indexed": false,
				  "name": "numRooms",
				  "type": "uint64"
				},
				{
				  "indexed": false,
				  "name": "numExits",
				  "type": "uint32"
				}
			  ],
			  "name": "RoomActualised",
			  "type": "event",
			  "signature": "0xcf85dd5b0e0e54647738b98924e08b0526c251f07c4c8ecac8c8989410cc24e3"
			},
			{
			  "anonymous": false,
			  "inputs": [
				{
				  "indexed": true,
				  "name": "player",
				  "type": "address"
				},
				{
				  "indexed": true,
				  "name": "oldLocation",
				  "type": "uint256"
				},
				{
				  "indexed": true,
				  "name": "newLocation",
				  "type": "uint256"
				}
			  ],
			  "name": "PlayerMoved",
			  "type": "event",
			  "signature": "0x717c71b7226e13a6b97d602aded90ba7f6af22014b5c12d972f442a87cd2d50b"
			},
			{
			  "anonymous": false,
			  "inputs": [
				{
				  "indexed": false,
				  "name": "location",
				  "type": "uint256"
				},
				{
				  "indexed": false,
				  "name": "target",
				  "type": "int256"
				},
				{
				  "indexed": false,
				  "name": "random",
				  "type": "uint256"
				}
			  ],
			  "name": "Debug",
			  "type": "event",
			  "signature": "0x6310a54c63254f8e28e3c79fb46d37c31d885c3913bef733c67ba79b59876f05"
			}
		],
		{
		logLevel: 'trace',
		blockInterval: 12,
		price: 1 // TODO config.price[$wallet.chainId],
	});
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
		// console.log({room});
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
