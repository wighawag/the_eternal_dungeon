import { writable, readable, derived } from 'svelte/store';
import Web3 from 'web3';
import Dungeon from '../../../contracts/dungeon';
import BN from 'bn.js';
import { pause } from '../utils/time';
import NiftyGatewayJS from 'niftygateway';
import Portis from '@portis/web3';
import { Bitski, AuthenticationStatus } from 'bitski';
import axios from 'axios';

const hallDesc = {
	scene: {
		name: 'The hall',
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
							'The box is opening...',
							'Nothing inside' // TODO remove
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
			name: 'The random',
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


async function fetchChainInfos() {
	const validChains = [];
	let contracts;
	try {
		const response = await axios.get('contracts');
		contracts = response.data;
		for (let chainId of Object.keys(contracts)) {
			validChains.push(chainId);
		}
	} catch (e) {
		console.error('no contracts configured');
	}
	return { validChains, contracts };
}

function getProviderType(provider) {
	if (provider.isMetaMask)
		return 'metamask';

	if (provider.isTrust)
		return 'trust';

	if (provider.isGoWallet)
		return 'goWallet';

	if (provider.isAlphaWallet)
		return 'alphaWallet';

	if (provider.isStatus)
		return 'status';

	if (provider.isToshi)
		return 'coinbase';

	if (typeof window.__CIPHER__ !== 'undefined')
		return 'cipher';

	if (provider.constructor.name === 'EthereumProvider')
		return 'mist';

	if (provider.constructor.name === 'Web3FrameProvider')
		return 'parity';

	if (provider.host && provider.host.indexOf('infura') !== -1)
		return 'infura';

	if (provider.host && provider.host.indexOf('localhost') !== -1)
		return 'localhost';
}

async function generateWeb3Status(web3, providerUsed, checkAccounts = true) {
	if (providerUsed) {
		localStorage.setItem('lastProvider', JSON.stringify(providerUsed));
	}
	const { validChains, contracts } = await fetchChainInfos();
	let validChain = false;
	let chainId;
	try {
		chainId = await web3.eth.net.getId();
	} catch (e) {
	}

	let config;
	if (chainId) {
		if (validChains.indexOf('' + chainId) != -1) {
			validChain = true;
			DungeonInfo = contracts[chainId]['Dungeon'];
		}
		config = require('../../../config')(chainId)
		if (checkAccounts) {
			const accounts = await web3.eth.getAccounts();
			if (accounts && accounts.length > 0) {
				//console.log('accounts available : ' + accounts[0]);
				return {
					available: true,
					validChain,
					validChains,
					currentChain: chainId,
					config,
					enabled: true,
					account: accounts[0],
					web3,
				}
			}
			//console.log('account not available');
		}
	}

	return {
		available: true,
		validChain,
		validChains,
		currentChain: chainId,
		config,
		enabled: false,
		web3,
	}
}

let $web3Status;
export const web3Status = (() => {
	const { subscribe, set, update } = writable();

	set("loading");
	window.addEventListener('load', async () => {
		//console.log('page loaded');
		try {
			$web3Status = await loadWeb3Status();
			set($web3Status);
			if ($web3Status.enabled && $web3Status.validChain) {
				log('dungeon', 'loading')
				dungeon.load();
			}
		} catch (e) {
			// TODO remove and ensure ti never reach there
			console.error('LOAD STATUS ERROR', e);
			set({ error: e });
		}
	});

	async function loadWeb3Status() {
		const lastProviderUsedS = localStorage.getItem('lastProvider');
		if (lastProviderUsedS) {
			const lastProviderUsed = JSON.parse(lastProviderUsedS);
			console.log({ lastProviderUsed })
			if (lastProviderUsed.type == 'portis') {
				console.log('using portis');
				return setupPortis(lastProviderUsed.params);
			} else if (lastProviderUsed.type == 'bitski') {
				console.log('using bitski');
				return setupBitski(lastProviderUsed.params);
			} else {
				return setupBuiltInWallet();
			}
		}

		const { validChains, contracts } = await fetchChainInfos();
		const { provider, checkAccounts, providerType } = getBuiltInProvider();
		return {
			firstTime: true,
			available: !!provider,
			validChains,
			enabled: false
		}
	}

	async function setupPortis(chainName) {
		const portis = new Portis('c01effe4-fa7d-496b-9732-105080c3db96', chainName); //'rinkeby'); // 'mainnet');
		// {
		// 	nodeUrl: 'http://localhost:8545',
		// 	// chainId: 1,
		// 	nodeProtocol: 'rpc',
		//   });
		const web3 = new Web3(portis.provider);
		window.web3 = web3;
		window.portis = portis;
		return generateWeb3Status(web3, { type: 'portis', params: chainName });
	}

	async function usePortis(chainName) {
		$web3Status = await setupPortis(chainName)
		set($web3Status)
		if ($web3Status.validChain) {
			await dungeon.load();
		} else {
			console.log('WRONG CHAIN IN PORTIS')
			// TODO allow to manually switch for portis
		}
	}

	async function setupBitski(chainName) {
		const bitski = new Bitski('5234dddb-af72-4c6d-a195-ab8fcf8cae13', 'http://localhost:8080/bitski.html');
		const bitskiProvider = bitski.getProvider({ networkName: chainName });
		const web3 = new Web3(bitskiProvider);
		window.web3 = web3;
		window.bitski = bitski;
		if (bitski.authStatus === AuthenticationStatus.Connected) {
			console.log('already connected');
			return generateWeb3Status(web3, { type: 'bitski', params: chainName });
		} else if (bitski.authStatus === AuthenticationStatus.NotConnected) {
			console.log('bitski not connected');
		} else if (bitski.authStatus === AuthenticationStatus.Expired) {
			console.log('bitski expired');
		} else {
			console.error('wrong connection status', bitski.authStatus);
		}

		const { validChains, contracts } = await fetchChainInfos();
		const { provider, checkAccounts, providerType } = getBuiltInProvider();
		return {
			firstTime: true,
			available: !!provider,
			validChains,
			enabled: false
		}
	}

	async function useBitski(chainName) {
		$web3Status = await setupBitski(chainName)
		if (!$web3Status.enabled) {
			await bitski.signIn(); // force popup
			$web3Status = await generateWeb3Status(web3, { type: 'bitski', params: chainName });
		}
		set($web3Status)
		if ($web3Status.validChain) {
			await dungeon.load();
		} else {
			console.log('WRONG CHAIN IN BITSKI')
			// TODO allow to manually switch for portis
		}
	}

	function getBuiltInProvider() {
		let provider;
		let checkAccounts = true;
		let providerType;
		if (window.ethereum) {
			provider = window.ethereum;
			providerType = getProviderType(window.ethereum);

			if (typeof providerType == 'undefined') {
				checkAccounts = false;// TODO only for navigator.userAgent.indexOf("Opera");
				console.log('unknown provider type');
			} else {
				console.log({ providerType });
			}
		} else if (window.web3) {
			provider = window.web3.currentProvider;
		}
		return { provider, checkAccounts, providerType };
	}

	async function setupBuiltInWallet() {

		const { provider, checkAccounts, providerType } = getBuiltInProvider();
		if (!provider) {
			return {
				available: false,
			}
		}

		const web3 = new Web3(provider);
		window.web3 = web3;
		return generateWeb3Status(web3, { type: providerType }, checkAccounts);
	}

	async function useBuiltInWallet() {
		$web3Status = await setupBuiltInWallet()
		set($web3Status)
		if ($web3Status.validChain) {
			await dungeon.load();
		} else {
			// TODO allow to manually switch for portis
		}
	}

	async function useNiftyGateway() {
		$web3Status = await setupNiftyGateway()
		set($web3Status)
		if ($web3Status.validChain) {
			await dungeon.load();
		} else {
			// TODO allow to manually switch for portis
		}
	}

	async function setupNiftyGateway() {
		$web3Status.enabling = true;
		set($web3Status); // TODO set({enabling:true});
		var nftg = new NiftyGatewayJS('rinkeby', process.env.NIFTYGATEWAY_DEVKEY);
		window.nftg = nftg;
		console.log(nftg);
		const nftgUser = await nftg.getWalletAndEmailAddress(); //didSucceed, emailAddress, walletAddress
		console.log(nftgUser);
		if (nftgUser.didSucceed) {
			$web3Status.enabled = true;
			$web3Status.available = true;
			$web3Status.account = nftgUser.walletAddress;
		}
		$web3Status.enabling = false;
		return $web3Status;
	}

	async function enable() {
		try {
			log('wallet', 'enabling');
			$web3Status.enabling = true;
			set($web3Status); // TODO set({enabling:true});
			let accounts = await web3.eth.getAccounts();
			log('wallet', 'getAccounts', accounts);
			if (!accounts || accounts.length == 0) {
				try {
					accounts = await web3.currentProvider.enable();
					log('wallet', 'enable', accounts);
				} catch (e) {
					log('wallet', 'enable rejection');
				}

				// Metamask no privacy allow you to fetch account here even though the user did not enable
				if (!accounts || accounts.length == 0) {
					log('wallet', 'no accounts, fetching...');
					const testAccounts = await web3.eth.getAccounts();
					log('wallet', 'getAccounts again', testAccounts);
					accounts = testAccounts; // TODO remove ?
				}
			}

			if (accounts && accounts.length > 0) {
				log('wallet', 'enabled account : ' + accounts[0]);
				$web3Status.enabled = true;
				$web3Status.account = accounts[0];
			} else {
				log('wallet', 'not enabled');
				$web3Status.enabled = false;
			}
			$web3Status.enabling = false;
		} catch (e) {
			console.error('ENABLING ERROR', e);
			$web3Status.enabling = false;
			// throw new Error("not enabled");
		}
		set($web3Status);
	}
	return { enable, subscribe, useNiftyGateway, usePortis, useBitski, useBuiltInWallet };
})()


export const dungeon = (() => {
	const { subscribe, set, update } = writable();

	async function load() {
		set("loading");
		try {
			const dungeon = await loadDungeon();
			set(dungeon);
		} catch (e) {
			console.error(e);
			set({ error: e });
		}
	}
	return { load, subscribe };
})()


async function loadDungeon() {

	if (!($web3Status.available)) {
		throw new Error('web3 not available');
	}
	const web3 = $web3Status.web3;


	if (!$web3Status.enabled) {
		try {
			await web3Status.enable();
		} catch (e) {
			throw new Error('web3 enabling error');
		}
		if (!$web3Status.enabled) {
			console.log('still not enabled');
			return;
		}
	}

	const player = $web3Status.account.toLowerCase();
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

	const dungeon = new Dungeon(web3.currentProvider, DungeonInfo.address, DungeonInfo.contractInfo.abi, {
		logLevel: 'trace',
		blockInterval: 12,
		price: $web3Status.config.price,
	});
	await dungeon.init(player, key);  // TODO on accounts changed, need to reset // easiest solution : reload page on account change

	window.web3 = web3; // DEBUGING
	window.BN = BN;
	window.dungeon = dungeon;

	return dungeon;
}

// export const web3Status = readable(null, function start(set) {
//     set("loading");
//     window.addEventListener('load', async () => {
// 		try{
//             $web3Status = await loadWeb3Status();
// 			set($web3Status);
// 		} catch(e) {
// 			console.error(e);
// 			set({error:e});
// 		}
// 	});	
// });



// export const balanceInETH = derived(loading, (set) => {

// })

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

// export const room_description = derived([dungeon, playerLocation], ([$dungeon, $playerLocation]) => {
//     if($playerLocation && $dungeon && !$dungeon.error) {
//         const hash = $dungeon.rooms[$playerLocation].hash;
//         return "Corpses lie all around you. A small fountain is at the center of the room. The smell make you want to vomit..";
//     }
// }, "");

// export const directions = derived([dungeon, playerLocation], ([$dungeon, $playerLocation], set) => {
//     if($playerLocation && $dungeon && !$dungeon.error) {
//         console.log('computing room choices')
// 		const room = $dungeon.rooms[$playerLocation];
//         console.log(room);
//         const $directions = $dungeon.allExitsFor(room);
//         set($directions);
//     }
// }, []);

// export const choices = derived([dungeon, playerLocation], ([$dungeon, $playerLocation], set) => {
//     if($playerLocation && $dungeon && !$dungeon.error) {
//         // console.log('computing room choices')
// 		// const room = $dungeon.rooms[$playerLocation];
//         // console.log(room);
//         // const choices = [];
//         // function move(direction) {
//         //     return function() {
//         //         console.log('moving towards ' + direction);
//         //         return $dungeon.move(direction);
//         //     }
//         // }
//         // const allExits = $dungeon.allExitsFor(room);
//         // if(allExits.north) { choices.push({type: 'north', name:'Go North', perform: move(0)}); }
//         // if(allExits.east) { choices.push({type: 'east', name:'Go East', perform: move(1)}); }
//         // if(allExits.south) { choices.push({type: 'south', name:'Go South', perform: move(2)}); }
//         // if(allExits.west) { choices.push({type: 'west', name:'Go West', perform: move(3)}); }
//         // set(choices);
//     }
// }, []);
