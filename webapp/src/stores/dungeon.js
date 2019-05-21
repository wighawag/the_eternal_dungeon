import { writable, readable, derived } from 'svelte/store';
import Web3 from 'web3';
import Dungeon from '../../../contracts/dungeon';
import BN from 'bn.js';
import DungeonInfo from '../../../contracts/test_deployments/Dungeon.json'
import {pause} from '../utils/time';

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
	const accounts = await web3.eth.getAccounts();
	if(accounts && accounts.length > 0) {
		return {
			available: true,
			enabled: true,
			account: accounts[0],
			web3,
		}
	}
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
		try{
            $web3Status = await loadWeb3Status();
			set($web3Status);
			if($web3Status.enabled) {
				dungeon.load();
			}
		} catch(e) {
			console.error(e);
			set({error:e});
		}
	});	

    async function enable() {
		try{
			$web3Status.enabling = true;
			let accounts = await web3.currentProvider.enable();
			if(!accounts) {
				accounts = await web3.eth.getAccounts();
			}
			if(accounts && accounts.length > 0) {
				$web3Status.enabled = true;
				$web3Status.account = accounts[0];
			} else {
				console.log('something wrong');
				// $web3Status.enabled = true;
			}
			$web3Status.enabling = false;
			set($web3Status);
		} catch(e) {
			$web3Status.enabling = false;
			throw new Error("not enabled");
		}
    }
    return { enable, subscribe };
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
			throw new Error('web3 not enabled');
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

export const room_description = derived([dungeon, playerLocation], ([$dungeon, $playerLocation]) => {
    if($playerLocation && $dungeon && !$dungeon.error) {
        const hash = $dungeon.rooms[$playerLocation].hash;
        return "Corpses lie all around you. A small fountain is at the center of the room. The smell make you want to vomit..";
    }
}, "");

export const directions = derived([dungeon, playerLocation], ([$dungeon, $playerLocation], set) => {
    if($playerLocation && $dungeon && !$dungeon.error) {
        console.log('computing room choices')
		const room = $dungeon.rooms[$playerLocation];
        console.log(room);
        const $directions = $dungeon.allExitsFor(room);
        set($directions);
    }
}, []);

export const choices = derived([dungeon, playerLocation], ([$dungeon, $playerLocation], set) => {
    if($playerLocation && $dungeon && !$dungeon.error) {
        // console.log('computing room choices')
		// const room = $dungeon.rooms[$playerLocation];
        // console.log(room);
        // const choices = [];
        // function move(direction) {
        //     return function() {
        //         console.log('moving towards ' + direction);
        //         return $dungeon.move(direction);
        //     }
        // }
        // const allExits = $dungeon.allExitsFor(room);
        // if(allExits.north) { choices.push({type: 'north', name:'Go North', perform: move(0)}); }
        // if(allExits.east) { choices.push({type: 'east', name:'Go East', perform: move(1)}); }
        // if(allExits.south) { choices.push({type: 'south', name:'Go South', perform: move(2)}); }
        // if(allExits.west) { choices.push({type: 'west', name:'Go West', perform: move(3)}); }
        // set(choices);
    }
}, []);
