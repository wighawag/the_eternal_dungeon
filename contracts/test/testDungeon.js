const tap = require('tap');
const assert = require('assert');
const BN = require('bn.js');

const rocketh = require('rocketh');
const {web3, getDeployedContract} = require('rocketh-web3')(rocketh, require('Web3'));

const namedAccounts = rocketh.namedAccounts;
const users = namedAccounts.others;

const gas = 4000000;

function logObj(obj) {
    console.log(JSON.stringify(obj, null, '  '));
}

async function fetchRoomDataUsingEvents(dungeon, location) {
    let roomBlockHash;
    
    const discoveryEvents = await dungeon.getPastEvents('RoomDiscovered', {
        filter:{
            location
        }
    });
    if(discoveryEvents.length == 0) {
        return null;
    }
    const actualisationEvents = await dungeon.getPastEvents('RoomActualised', {
        filter:{
            location
        }
    });
    if(actualisationEvents.length > 0) {
        const roomActualisation = actualisationEvents[0].returnValues;
        roomBlockHash = roomActualisation.blockHash;
    } else {
        const roomDiscovery = discoveryEvents[0].returnValues;
        roomBlockHash = await web3.eth.getBlock(roomDiscovery.blockNumber);
    }
    
    // const randomFromSolc = new BN(await dungeon.methods.debug_keccak256(location, roomBlockHash).call(), 'hex');
    // const roomFromStorage = await dungeon.methods.debug_room(location).call();
    const random = new BN(web3.utils.soliditySha3(location, roomBlockHash), 'hex');

    // logObj(randomFromSolc)

    // logObj(roomFromStorage)
    // logObj(random);

    const exits = random.mod(new BN(16)).toNumber();
    const kind = random.mod(new BN(2)).add(new BN(1)).toNumber(); // TODO ranomize for each access
    
    // TODO fetch adjacent room for outward exits
    
    return {
        exits,
        kind
    };
}

function findFirstExit(room) {
    for(let i = 0; i < 4; i++) {
        const exit = Math.pow(2,i)
        console.log(room.exits, exit, room.exits & exit);
        if((room.exits & exit) == exit) {
            return i;
        }
    }
    return -1;
}

tap.test('Dungeon', async(t) => {
    
    let dungeon;
    t.beforeEach(async() => {
        await rocketh.runStages();
        dungeon = getDeployedContract('Dungeon');
    })

    t.test('move', async() => {
        const result = await dungeon.methods.getPlayer(users[0]).call();
        const location = result;
        const room = await fetchRoomDataUsingEvents(dungeon, location);
        logObj(room);
        const direction = findFirstExit(room);
        if(direction == -1) {
            throw new Error('no exit');
        }
        console.log(direction, users[0]);
        const receipt = await dungeon.methods.move(direction).send({from: users[0], gas});
        console.log(receipt);
        // const events = await dungeon.getPastEvents('RoomDiscovered', {fromBlock: receipt.blockNumber, toBlock: receipt.blockNumber});
        // assert.equal(events.length, 1);
    })
})