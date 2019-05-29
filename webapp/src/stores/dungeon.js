import { writable, readable, derived } from 'svelte/store';
import Web3 from 'web3';
import Dungeon from '../../../contracts/dungeon';
import BN from 'bn.js';
import DungeonInfo from '../../../contracts/test_deployments/Dungeon.json'
import {pause} from '../utils/time';
import NiftyGatewayJS from 'niftygateway';
import Portis from '@portis/web3';


function log(channel, ...args) {
	console.log(channel, ...args);
	// console.log.apply(console, args);
}

// dec2hex :: Integer -> String
// i.e. 0-255 -> '00'-'ff'
function dec2hex (dec) {
	return ('0' + dec.toString(16)).substr(-2)
}
  
// generateRandomKey :: Void -> String
function generateRandomKey () {
	var arr = new Uint8Array(32);
	crypto.getRandomValues(arr);
	return Array.from(arr, dec2hex).join('')
}

async function loadWeb3Status() {
	//console.log('loading web3 status...');
	let provider;
	if (window.ethereum) {
		provider = window.ethereum;
	} else if (window.web3) {
		provider = window.web3.currentProvider;
	}

	if(!provider){
		return {
			available: false,
		}
	}
	const web3 = new Web3(provider);
	window.web3 = web3;
	const accounts = await web3.eth.getAccounts();
	if(accounts && accounts.length > 0) {
		//console.log('accounts available : ' + accounts[0]);
		return {
			available: true,
			enabled: true,
			account: accounts[0],
			web3,
		}
	}
	//console.log('account not available');
	return {
		available: true,
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
		try{
			$web3Status = await loadWeb3Status();
			set($web3Status);
			if($web3Status.enabled) {
				log('dungeon', 'loading')
				dungeon.load();
			}
		} catch(e) {
			// TODO remove and ensure ti never reach there
			console.error('LOAD STATUS ERROR', e);
			set({error:e});
		}
	});	

	async function usePortis() {
		const portis = new Portis('c01effe4-fa7d-496b-9732-105080c3db96', { // 'mainnet');
			nodeUrl: 'http://localhost:8545',
			// chainId: 1,
			nodeProtocol: 'rpc',
		  });
		const web3 = new Web3(portis.provider);
		$web3Status.web3 = web3;
		$web3Status.available = true;
		set($web3Status);
		window.web3 = web3;
		window.portis = portis;
		await dungeon.load();
	}

	async function useNiftyGateway() {
		$web3Status.enabling = true;
		set($web3Status); // TODO set({enabling:true});
		var nftg = new NiftyGatewayJS('rinkeby', process.env.NIFTYGATEWAY_DEVKEY);
		window.nftg = nftg;
		console.log(nftg);
		const nftgUser = await nftg.getWalletAndEmailAddress(); //didSucceed, emailAddress, walletAddress
		console.log(nftgUser);
		if(nftgUser.didSucceed) {
			$web3Status.enabled = true;
			$web3Status.available = true;
			$web3Status.account = nftgUser.walletAddress;
		}
		$web3Status.enabling = false;
		set($web3Status);
	}

    async function enable() {
		try{
			log('wallet', 'enabling');
			$web3Status.enabling = true;
			set($web3Status); // TODO set({enabling:true});
			let accounts = await web3.eth.getAccounts();
			log('wallet', 'getAccounts', accounts);
			if(!accounts || accounts.length == 0) {	
				try{
					accounts = await web3.currentProvider.enable();
					log('wallet', 'enable', accounts);
				} catch(e) {
					log('wallet', 'enable rejection');
				}
				
				// Metamask no privacy allow you to fetch account here even though the user did not enable
				if(!accounts || accounts.length == 0) {
					log('wallet', 'no accounts, fetching...');
					const testAccounts = await web3.eth.getAccounts();
					log('wallet', 'getAccounts again', testAccounts);
					accounts = testAccounts; // TODO remove ?
				}
			}
			
			if(accounts && accounts.length > 0) {
				log('wallet', 'enabled account : ' + accounts[0]);
				$web3Status.enabled = true;
				$web3Status.account = accounts[0];
			} else {
				log('wallet', 'not enabled');
				$web3Status.enabled = false;
			}
			$web3Status.enabling = false;
		} catch(e) {
			console.error('ENABLING ERROR', e);
			$web3Status.enabling = false;
			// throw new Error("not enabled");
		}
		set($web3Status);
    }
    return { enable, subscribe, useNiftyGateway, usePortis };
})()


export const dungeon = (() => {
	const { subscribe, set, update } = writable();

    async function load() {
		set("loading");
        try{
            const dungeon = await loadDungeon();
			set(dungeon);
		} catch(e) {
			console.error(e);
			set({error:e});
		}
    }
    return { load, subscribe };
})()


async function loadDungeon() {
	
	if(!($web3Status.available)) {
		throw new Error('web3 not available');
	}
	const web3 = $web3Status.web3;

	
	if(!$web3Status.enabled){
		try{
			await web3Status.enable();
		} catch(e) {
			throw new Error('web3 enabling error');
		}
		if(!$web3Status.enabled) {
			console.log('still not enabled');
			return;
		}
	}

	const player = $web3Status.account;
	console.log({player});

	let key = localStorage.getItem(player); // TODO on accounts changed, need to reset // easiest solution : reload page on account change
	if(!key) {
		key = generateRandomKey();
		try {
			localStorage.setItem(player, key);
		} catch(e) {
			console.error('could not save to storage');
		}
		// TODO remove
		console.log('new key', key);
	} else {
		// TODO remove
		console.log('resuse', key);
	}
	
	const dungeon = new Dungeon(web3.currentProvider, DungeonInfo.address, DungeonInfo.contractInfo.abi, {
        logLevel: 'trace',
		blockInterval: 12,
    });
	await dungeon.init(player, key);  // TODO on accounts changed, need to reset // easiest solution : reload page on account change

	window.web3 = web3; // DEBUGING
	window.BN = BN;
	
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
        if($dungeon && !$dungeon.error && $dungeon != "loading") {
            set($dungeon[fieldName]);
            $dungeon.on(event, set);
        }
    }, null);
}

export const playerLocation = deriveFromDungeon('playerMoved', 'playerLocation');
export const playerEnergy = deriveFromDungeon('energyChanged', 'energy');

export const newAddress = derived(dungeon, ($dungeon, set) => {
    if($dungeon && !$dungeon.error && $dungeon != "loading") {
        set(!$dungeon.isCurrentDelegate);
        $dungeon.on('delegated', (delegate) => { set(false); });
    }
}, null);

export const playerInDungeon = derived(dungeon, ($dungeon, set) => {
    if($dungeon && !$dungeon.error && $dungeon != "loading") {
        set($dungeon.inDungeon);
        $dungeon.on('playerEntered', () => { set(true)});
        $dungeon.on('playerQuit', () => { set(false)});
    }
}, null);

export const roomBlockUpdate = derived(dungeon, ($dungeon, set) => {
	$dungeon.on('roomChanged', (block) => { set(block)}); // TODO roomChanged for new exits (from neighbor rooms)
})

export const room = derived([dungeon, playerLocation, roomBlockUpdate], ([$dungeon, $playerLocation, $roomBlockUpdate], set) => {
	if($playerLocation && $dungeon && !$dungeon.error) {
		const room = $dungeon.rooms[$playerLocation];
        const $directions = $dungeon.allExitsFor(room);
		// TODO
		set({
			scene: {
				name: 'The hall',
				description: [
					'The room is quite big with an impressive cross arch on the ceiling. The walls are all white. In the middle stand a statue and in the corner, you can notice a sort of box.',
					'exits ...'
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
								actionIndex: 0,
							}
						],
					},
					{
						name: 'look statue',
						description: ['The status is magnificient. it depicts a woman carrying in her a slate that she seems to read as one of her fingers touch it'],
						scenes: [
							{
								name: 'touch',
								description: ['it feels cold']
							}
						],
					},
					{
						name: 'attack',
						description: ['<moving_text>'],
						actionIndex: 1,
					},
				],
			},
			directions: $directions
		});
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
