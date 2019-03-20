const BN = require('bn.js');
const util = require('util');
const EventEmitter = require('events');
const ethers = require('ethers');


let utils;
let 
instantiateContract,
tx,
call,
getPastEvents,
getBlock,
soliditySha3;
const gas = 4000000; // TODO per method

function locationAt(location, dx, dy) {
    const dirNum = new BN(location);
    const p128 = (new BN(2)).pow(new BN(128));
    const p256 = (new BN(2)).pow(new BN(256));
    const x = dirNum.mod(p128);
    const y = dirNum.div(p128);
    let res = y.add(new BN(dy)).mul(p128).add(x.add(new BN(dx)));
    if(res.lt(new BN(0))) {
        res = res.add(p256);
    } else {
        res = res.mod(p256);
    }
    return res.toString(10);
}

const Dungeon = function(provider, address, abi) {
    this.provider = provider;
    EventEmitter.call(this);

    // INITIALISE utils
    utils = require('./utils')(provider);
    instantiateContract = utils.instantiateContract;
    tx = utils.tx;
    call = utils.call;
    getPastEvents = utils.getPastEvents;
    getBlock = utils.getBlock;
    soliditySha3 = utils.soliditySha3;

    this.lastBlock = {

    };

    this.contract = instantiateContract(address, abi);
}
util.inherits(Dungeon, EventEmitter);

Dungeon.prototype.start = async function(owner) {
    const latestBlock = await getBlock('latest');
    return tx({from: owner, gas}, this.contract, 'start', latestBlock.number, latestBlock.hash);
}

Dungeon.prototype.init = async function(player) {
    this.player = player;
    if(this.initializating) {
        this.newPlayer = true;
        return;
    }
    this.stopListenToPlayerMove();
    this.playerLocation = null;
    this.stopListenToRooms();
    this.rooms = {};

    this.initializating = true;
    
    this.playerLocation = await this.fetchPlayerLocation();
    if(!this.newPlayer && !this.terminated) {
        await this.fetchRoomAround(this.playerLocation);
    }
    if(!this.newPlayer && !this.terminated) {
        this.listenForPlayerMove();
    }

    if(this.newPlayer ||  this.terminated) {
        this.newPlayer = false;
        this.initializating = false;
        await this.init();
    }
    this.initializating = false;
    // TODO emit reset
}

Dungeon.prototype.fetchRoomAround = async function(centre)  {
    for(let dy = -1; dy <= 1; dy++) {
        for(let dx = -1; dx <= 1; dx++) {
            const location = locationAt(centre,dx,dy);
            let room = this.rooms[location];
            if(room){
                continue;
            }
            let fetchedRoom = await this.fetchRoom(location);
            if(!fetchedRoom) {
                fetchedRoom = {
                    location,
                    status: 'listening'
                };
                this.listenForRoom(location);
            }
            this.rooms[location] = fetchedRoom; 
            
            if(this.newPlayer || this.terminated) {
                break;
            }
            
        }
        if(this.newPlayer || this.terminated) {
            break;
        }
    }
    for(let dy = -2; dy <= 2; dy++) {
        for(let dx = -2; dx <= 2; dx += ((dy == -2 || dy == 2) ? 1 : 4)) {
            const location = locationAt(centre,dx,dy);
            let room = this.rooms[location];
            if(room){
                if(room.status == "actualised"){
                    continue;    
                } else {
                    this.stopListenToRoom(location);
                    delete this.rooms[location];    
                }
            } else {
                console.log(dx,dy , location);    
            }
            
        }
    }
}


let lastToken = 0;
const jobs = {

}
Dungeon.prototype.listenForPlayerMove = async function() {
    if(this.terminated) {
        return;
    }
    console.log('listennin on player move', this.player);
    const token = 'listenForPlayerMove'; //lastToken++;
    if(jobs[token]) {
        return;
    }
    jobs[token] = true;
    while(jobs[token]) {
        let fromBlock = (this.lastBlock.playerMoved || -1) + 1;
        const events = await this.getPastEvents('PlayerMoved', {
            filter:{
                player: this.player
            },
            fromBlock,
        })
        if(events.length > 0) {
            const latestEvent = events[events.length-1];
            console.log('PlayerMoved', latestEvent.returnValues);
            this.lastBlock.playerMoved = latestEvent.blockNumber;
            this.playerLocation = latestEvent.returnValues.newLocation;
            await this.fetchRoomAround(this.playerLocation); // TODO allow cancel
            this.emit('playerMoved', this.playerLocation);
        }
        // await
    }
}

Dungeon.prototype.listenForRoom = async function(location) {
    if(this.terminated) {
        return;
    }
    console.log('listennin on room ', location);
    const token = location; //lastToken++;
    if(jobs[token]) {
        return;
    }
    jobs[token] = true;
    while(jobs[token]) {
        let fromBlock = (this.lastBlock.roomDiscovered || -1) + 1;
        const events = await this.getPastEvents('RoomDiscovered', {
            filter:{
                location
            },
            fromBlock,
        })
        if(events.length > 0) {
            const latestEvent = events[events.length-1];
            this.lastBlock.roomDiscovered = latestEvent.blockNumber; //conflit with playerMove // dictionary
            console.log('roomAdded', location);
            this.emit('roomAdded', location);
            this.stopListenToRoom(location);
        }
        // await
    }
}

Dungeon.prototype.stopListenToRooms = function() {
    if(this.rooms) {
        const roomLocations = Object.keys(this.rooms);
        for(let roomLocation of roomLocations) {
            this.stopListenToRoom(roomLocation);
        }
    }
}

Dungeon.prototype.stopListenToRoom = function(location) {
    console.log('stop listennin on room', location);
    delete jobs[location];
}

Dungeon.prototype.stopListenToPlayerMove = function() {
    console.log('stop listennin on player move');
    delete jobs['listenForPlayerMove'];
}


Dungeon.prototype.move = async function(direction) {
    return tx({from: this.player, gas}, this.contract, 'move', direction);
}

Dungeon.prototype.getPastEvents = function(eventName, options) {
   return getPastEvents(this.contract, eventName, options); 
}

Dungeon.prototype.fetchRoom = async function(location, options) {
    if(!options) {
        options = {};
    }
    if(typeof options.fetchNeighbours == 'undefined') {
        options.fetchNeighbours = true;
    }
    
    let roomBlockHash;
    
    const discoveryEvents = await getPastEvents(this.contract, 'RoomDiscovered', {
        fromBlock:0,
        filter:{
            location : location.toString ? location.toString(10) : location
        }
    });
    if(discoveryEvents.length == 0) {
        return null;
    }
    const actualisationEvents = await getPastEvents(this.contract, 'RoomActualised', {
        fromBlock:0,
        filter:{
            location : location.toString ? location.toString(10) : location
        }
    });
    const roomDiscovery = discoveryEvents[0].returnValues;
    let status = 'discovered';
    if(actualisationEvents.length > 0) {
        const roomActualisation = actualisationEvents[0].returnValues;
        roomBlockHash = roomActualisation.blockHash;
        status = 'actualised';
    } else {
        roomBlockHash = (await getBlock(roomDiscovery.blockNumber)).hash;
    }
    
    return this.computeRoom(location, roomBlockHash, roomDiscovery.numRooms, roomDiscovery.numExits, status);
}

Dungeon.prototype.generateExits = function(location, hash, numRoomsAtDiscovery, numExitsAtDiscovery) {
    var red = BN.red('k256');
    var r1 = (new BN(2)).toRed(red);
    var r2 = (new BN(numRoomsAtDiscovery)).toRed(red);
    var r3 = (new BN(numExitsAtDiscovery)).toRed(red);
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
        exits = Math.pow(2,chosenExits);
    }

    exitsBits = exits;
    exits = {
        north: (exitsBits & 1) == 1,
        east: (exitsBits & 2) == 2,
        south: (exitsBits & 4) == 4,
        west: (exitsBits & 8) == 8,
    };

    return {
        numExits,
        exits,
        exitsBits
    }
}

Dungeon.prototype.computeRoom = async function(location, hash, numRoomsAtDiscovery, numExitsAtDiscovery, status) {
    
    let {
        numExits,
        exits,
        exitsBits
    } = this.generateExits(location, hash, numRoomsAtDiscovery, numExitsAtDiscovery);
    
    const kind = this.getRandomValue(location, hash, 3, 2).add(new BN(1)).toNumber();

    return {
        status,
        location,
        numExits,
        exits,
        exitsBits,
        kind,
        numRoomsAtDiscovery,
        numExitsAtDiscovery,
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

Dungeon.prototype.findFirstExit = function(room, start) {
    start = start || 0;
    for(let i = 0; i < 4; i++) {
        const j = (i+start) % 4;
        const exit = Math.pow(2,j)
        if((room.exitsBits & exit) == exit) {
            return j;
        }
    }
    return -1;
}


Dungeon.prototype.fetchPlayerLocation = function() {
    return call(this.contract, 'getPlayer', this.player);
}

Dungeon.prototype.terminate = function() {
    this.terminated = true;
    console.log('TERMINATING...');
    this.stopListenToPlayerMove();
    this.stopListenToRooms();
}

module.exports = Dungeon;
