const BN = require('bn.js');
const {
    instantiateContract,
    tx,
    call,
    getPastEvents,
    getBlock,
    soliditySha3,
} = require('./utils');

const gas = 4000000; // TODO per method

const Dungeon = function(user, address, abi) {
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

Dungeon.prototype.fetchRoom = async function(location) {
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
    if(actualisationEvents.length > 0) {
        const roomActualisation = actualisationEvents[0].returnValues;
        roomBlockHash = roomActualisation.blockHash;
    } else {
        const roomDiscovery = discoveryEvents[0].returnValues;
        roomBlockHash = await getBlock(roomDiscovery.blockNumber);
    }
    
    return this.getRandomRoom(location, roomBlockHash);
}

Dungeon.prototype.getRandomRoom = function(location, hash) {
    const random = this.getRandomValue(location, hash);

    const exits = random.mod(new BN(16)).toNumber();
    const kind = random.mod(new BN(2)).add(new BN(1)).toNumber(); // TODO ranomize for each access
    
    // TODO fetch adjacent room for outward exits
    
    return {
        exits,
        kind
    };
}

Dungeon.prototype.getRandomValue = function(location, hash) {
    return new BN(soliditySha3(location, hash), 'hex');
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
    for(let blockNumber = latestBlock.number; blockNumber > latestBlock.number - 100; blockNumber--) {
        const block = await getBlock(blockNumber);
        const room = this.getRandomRoom(0, block.hash)
        const firstExit = this.findFirstExit(room);
        if(firstExit != -1) {
            return {blockNumber: block.number, blockHash: block.hash};
        }
    }
    return null;
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