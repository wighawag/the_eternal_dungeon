import { Store } from 'svelte/store.js';
import App from './App.html';
import Web3 from 'web3';
import Dungeon from '../../contracts/dungeon';
import BN from 'bn.js';
import DungeonInfo from '../../contracts/test_deployments/1112/Dungeon.json'

function loadWeb3() {
	if (window.ethereum) {
		return ethereum.enable().then(() => new Web3(window.ethereum));
	} else if (window.web3) {
		return Promise.resolve(new Web3(window.web3.currentProvider));
	} else {
		return Promise.reject('no web3');
	}
}

async function loadData() {
	const web3 = await loadWeb3();
	const chainId = await web3.eth.net.getId();
	const accounts = await web3.eth.getAccounts();
	
	const dungeon = new Dungeon(web3.currentProvider, DungeonInfo.address, DungeonInfo.contractInfo.abi, {
        logLevel: 'trace',
        blockInterval: 12
    });
	await dungeon.init(accounts[0]);
	
	const playerLocation = dungeon.playerLocation;

	const balance = await web3.eth.getBalance(accounts[0]);

	return {
		balance,
		web3,
		chainId,
		dungeon,
		playerLocation,
		account: accounts[0],
	}
}

var loading = new Promise((resolve, reject) => {
	window.addEventListener('load', async () => {
		try{
			const data = await loadData();
			// store.set({eth: loadETH})
			store.set(data);
			
			data.dungeon.on('playedMoved', (newLocation) => {
				store.set({playerLocation: newLocation});
			})
			resolve();	
		} catch(e) {
			reject(e);
		}
	});	
})



const store = new Store({
	loading
});

store.compute(
	'balanceInETH',
	['balance'],
	(balance) => balance ? ((new BN(balance)).div(new BN("1000000000000000")).toNumber() / 1000 ).toPrecision(4) : "0"
);

store.compute(
	'room_description',
	['playerLocation', 'dungeon'],
	(playerLocation, dungeon) => {
		console.log('computing room description')
		if(playerLocation && dungeon) {
			const hash = dungeon.rooms[playerLocation].hash;
			return "Corpses lie all around you. A small fountain is at the center of the room. The smell make you want to vomit.."
		}
	}
);

store.compute(
	'choices',
	['playerLocation', 'dungeon'],
	(playerLocation, dungeon) => {
		console.log('computing room choices')
		if(playerLocation && dungeon) {
			const room = dungeon.rooms[playerLocation];
			console.log(room);
			const choices = [];
			function move(direction) {
				return async function() {
					console.log('moving towards ' + direction);
					await dungeon.move(direction);
				}
			}
			const allExits = dungeon.allExitsFor(room);
			if(allExits.north) { choices.push({name:'Go North', perform: move(0)}); }
			if(allExits.east) { choices.push({name:'Go East', perform: move(1)}); }
			if(allExits.south) { choices.push({name:'Go South', perform: move(2)}); }
			if(allExits.west) { choices.push({name:'Go West', perform: move(3)}); }
			return choices;
		}
	}
);


const app = new App({
	target: document.body,
	store
});

window.store = store; // useful for debugging!

window.app = app;

export default app;