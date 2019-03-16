const BN = require('bn.js');

let utils;
let 
instantiateContract,
tx,
call,
getPastEvents,
getBlock,
soliditySha3;
const gas = 4000000; // TODO per method

function locationAt(location, direction) {

}

const Dungeon = function(provider, user, address, abi) {

    // INITIALISE utils
    utils = require('./utils')(provider);
    instantiateContract = utils.instantiateContract;
    tx = utils.tx;
    call = utils.call;
    getPastEvents = utils.getPastEvents;
    getBlock = utils.getBlock;
    soliditySha3 = utils.soliditySha3;

    this.user = user;
    this.contract = instantiateContract(address, abi);
}

Dungeon.prototype.start = async function(owner) {
    const {blockNumber, blockHash} = await this.findHashThatGivesExitToStartingRoom();
    return tx({from: owner, gas}, this.contract, 'start', blockNumber, blockHash);
}

Dungeon.prototype.move = async function(direction) {
    const {blockNumber, blockHash} = await this.findHashThatGivesExitToStartingRoom();
    return tx({from: this.user, gas}, this.contract, 'move', direction);
}

Dungeon.prototype.getPastEvents = function(eventName, options) {
   return getPastEvents(this.contract, eventName, options); 
}

Dungeon.prototype.fetchRoom = async function(location, options) {
    let roomBlockHash;
    
    const discoveryEvents = await getPastEvents(this.contract, 'RoomDiscovered', {
        filter:{
            location
        }
    });
    if(discoveryEvents.length == 0) {
        return null;
    }
    const actualisationEvents = await getPastEvents(this.contract, 'RoomActualised', {
        filter:{
            location
        }
    });
    const roomDiscovery = discoveryEvents[0].returnValues;
    if(actualisationEvents.length > 0) {
        const roomActualisation = actualisationEvents[0].returnValues;
        roomBlockHash = roomActualisation.blockHash;
    } else {
        roomBlockHash = await getBlock(roomDiscovery.blockNumber);
    }
    
    return this.getRandomRoom(location, roomBlockHash, new BN(roomDiscovery.numRooms), new BN(roomDiscovery.numExits), options);
}

Dungeon.prototype.getRandomRoom = async function(location, hash, numRoomsAtDiscovery, numExitsAtDiscovery, options) {
    var red = BN.red('k256');
    var r1 = (new BN(2)).toRed(red);
    var r2 = numRoomsAtDiscovery.toRed(red);
    var r3 = numExitsAtDiscovery.toRed(red);
    var rr = r1.add(r2.redSqrt()).sub(r3);

    const target =  rr.fromRed(); //(new BN(2)).add(numRoomsAtDiscovery.redSqrt()).sub(numExitsAtDiscovery);
    if(target.lt(new BN(-4))) {
        target = new BN(-4);
    }
    if(target.gt(new BN(4))) {
        target = new BN(4);
    }
   
    const random = this.getRandomValue(location, hash, 1, 3);
    let numExits = target.sub(new BN(1)).add(random.mod(new BN(3))).toNumber();
    if(numExits < 0) {
        numExits = 0;
    }
    let exits = 0;
    if(numExits >= 4) {
        numExits = 4;
        exits = 15;
    } else if(numExits == 3){
        const chosenExits = this.getRandomValue(location, hash, 2, 4).toNumber();
        exits = (chosenExits+1) * 7;
        if(exits == 21) {
            exits = 13;
        } else if(exits == 28) {
            exits = 11;
        }
        // 4 possibilities : 7 // 14 // 13 // 11
    } else if(numExits == 2) {
        const chosenExits = this.getRandomValue(location, hash, 2, 6).toNumber();
        exits = (chosenExits+1) * 3;
        if(exits == 15) {
            exits = 5;
        } else if(exits == 18) {
            exits = 10;
        }
        // 3 // 6 // 9 // 12 // 5 // 10 // 
    } else if(numExits == 1){
        const chosenExits = this.getRandomValue(location, hash, 2, 4).toNumber();
        exits = Math.pow(2,(chosenExits+1));
    }

    const kind = this.getRandomValue(location, hash, 3, 2).add(new BN(1)).toNumber();
    
    if(options && options.fetchNeighbours) {
        // TODO room cache
        // TODO const north = await this.fetchRoom(location, {fetchNeighbours: false});
    }
    
    
    return {
        numExits,
        exits,
        kind
    };
}

Dungeon.prototype.getRandomValue = function(location, hash, index, mod) {
    const random = soliditySha3(
        {type: 'uint256', value: location},
        {type: 'bytes32', value: hash},
        {type: 'uint8', value: index},
    );
    return new BN(random.slice(2), 'hex').mod(new BN(mod));
}

Dungeon.prototype.findFirstExit = function(room) {
    for(let i = 0; i < 4; i++) {
        const exit = Math.pow(2,i)
        if((room.exits & exit) == exit) {
            return i;
        }
    }
    return -1;
}

Dungeon.prototype.findHashThatGivesExitToStartingRoom = async function() {
    const latestBlock = await getBlock('latest');
    return {blockNumber: latestBlock.number, blockHash: latestBlock.hash};
    // for(let blockNumber = latestBlock.number; blockNumber > latestBlock.number - 100; blockNumber--) {
    //     const block = await getBlock(blockNumber);
    //     const room = this.getRandomRoom(0, block.hash)
    //     const firstExit = this.findFirstExit(room);
    //     if(firstExit != -1) {
    //         return {blockNumber: block.number, blockHash: block.hash};
    //     }
    // }
    // return null;
}

Dungeon.prototype.getPlayerLocation = function() {
    return call(this.contract, 'getPlayer', this.user);
}

module.exports = Dungeon;

/*
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
    
    return getRandomRoom(location, roomBlockHash);
}

function getRandomValue(location, hash) {
    return new BN(web3.utils.soliditySha3(location, hash), 'hex');
}

function getRandomRoom(location, hash) {
    const random = getRandomValue(location, hash);

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
        if((room.exits & exit) == exit) {
            return i;
        }
    }
    return -1;
}

async function findHashThatGivesExitToStartingRoom() {
    const latestBlock = await web3.eth.getBlock('latest');
    for(let blockNumber = latestBlock.number; blockNumber > latestBlock.number - 100; blockNumber--) {
        const block = await web3.eth.getBlock(blockNumber);
        const room = getRandomRoom(0, block.hash)
        const firstExit = findFirstExit(room);
        if(firstExit != -1) {
            return {blockNumber: block.number, blockHash: block.hash};
        }
    }
    return null;
}

function getPlayerLocation(dungeon, player) {
    return dungeon.methods.getPlayer(player).call();
}

module.exports = {
    getPlayerLocation,
    findHashThatGivesExitToStartingRoom,
    findFirstExit,
    getRandomRoom,

}
*/