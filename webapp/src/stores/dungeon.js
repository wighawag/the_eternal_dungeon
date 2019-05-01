import { writable, readable, derived } from 'svelte/store';
import Web3 from 'web3';
import Dungeon from '../../../contracts/dungeon';
import BN from 'bn.js';
import DungeonInfo from '../../../contracts/test_deployments/Dungeon.json'

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

function loadWeb3() {
	if (window.ethereum) {
		return ethereum.enable().then(() => new Web3(window.ethereum));
	} else if (window.web3) {
		return Promise.resolve(new Web3(window.web3.currentProvider));
	} else {
		return Promise.reject('no web3');
	}
}

async function loadDungeon() {
	const web3 = await loadWeb3();
	const chainId = await web3.eth.net.getId();
	const accounts = await web3.eth.getAccounts();

	const player = accounts[0];
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

export const dungeon = readable(null, function start(set) {
    set("loading");
    window.addEventListener('load', async () => {
		try{
            const dungeon = await loadDungeon();
			set(dungeon);
		} catch(e) {
			console.error(e);
			set({error:e});
		}
	});	
});

// export const balanceInETH = derived(loading, (set) => {

// })

function deriveFromDungeon(event, fieldName) {
    return derived(dungeon, ($dungeon, set) => {
        if($dungeon != "loading") {
            set($dungeon[fieldName]);
            $dungeon.on(event, set);
        }
    }, null);
}

export const playerLocation = deriveFromDungeon('playerMoved', 'playerLocation');
export const playerEnergy = deriveFromDungeon('energyChanged', 'energy');

export const newAddress = derived(dungeon, ($dungeon, set) => {
    if($dungeon != "loading") {
        set(!$dungeon.isCurrentDelegate);
        $dungeon.on('delegated', (delegate) => { set(false); });
    }
}, null);

export const playerInDungeon = derived(dungeon, ($dungeon, set) => {
    if($dungeon != "loading") {
        set($dungeon.inDungeon);
        $dungeon.on('playerEntered', () => { set(true)});
        $dungeon.on('playerQuit', () => { set(false)});
    }
}, null);

export const room_description = derived([dungeon, playerLocation], ([$dungeon, $playerLocation]) => {
    if($playerLocation && $dungeon) {
        const hash = $dungeon.rooms[$playerLocation].hash;
        return "Corpses lie all around you. A small fountain is at the center of the room. The smell make you want to vomit..";
    }
}, "");

export const choices = derived([dungeon, playerLocation], ([$dungeon, $playerLocation], set) => {
    if($playerLocation && $dungeon) {
        console.log('computing room choices')
		const room = $dungeon.rooms[$playerLocation];
        console.log(room);
        const choices = [];
        function move(direction) {
            return function() {
                console.log('moving towards ' + direction);
                return $dungeon.move(direction);
            }
        }
        const allExits = $dungeon.allExitsFor(room);
        if(allExits.north) { choices.push({name:'Go North', perform: move(0)}); }
        if(allExits.east) { choices.push({name:'Go East', perform: move(1)}); }
        if(allExits.south) { choices.push({name:'Go South', perform: move(2)}); }
        if(allExits.west) { choices.push({name:'Go West', perform: move(3)}); }
        set(choices);
    }
}, []);
