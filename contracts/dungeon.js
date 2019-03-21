const BN = require('bn.js');
const util = require('util');
const EventEmitter = require('events');

function pause(duration) {
    return new Promise((res) => setTimeout(res, duration * 1000));
}

let utils;
let 
instantiateContract,
tx,
call,
getPastEvents,
sendTx,
waitReceipt,
getBlockNumber,
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
    sendTx = utils.sendTx;
    waitReceipt = utils.waitReceipt;
    call = utils.call;
    getPastEvents = utils.getPastEvents;
    getBlock = utils.getBlock;
    getBlockNumber = utils.getBlockNumber;
    soliditySha3 = utils.soliditySha3;

    this.contract = instantiateContract(address, abi);
}
util.inherits(Dungeon, EventEmitter);

Dungeon.prototype.start = async function(owner) {
    const latestBlock = await getBlock('latest');
    return sendTx({from: owner, gas}, this.contract, 'start', latestBlock.number, latestBlock.hash).then(waitReceipt)
}


Dungeon.prototype.cancelInit = async function() {
    console.log('canceling init...');
    this._stopInit = true;
    while(this.initializating) {
        await pause(1);
    }
    this._stopInit = false;
    console.log('canceled');
}

Dungeon.prototype.init = async function(player) {
    if(this.initializating) {
        await this.cancelInit();
    }
    console.log('initializing...');
    this.initializating = true;

    this.player = player;
    await this.stopListening();
    this.playerLocation = null;
    this.rooms = {};

    this.lastBlock = await getBlockNumber();
    this.playerLocation = await this.fetchPlayerLocation();
    await this.fetchRoomsAround(this.playerLocation, this.rooms, {
        fromBlock:0,
        toBlock: this.lastBlock
    });

    this.startListening();
    this.initializating = false;
    // TODO emit reset
    console.log('initialized');
}

Dungeon.prototype.fetchRoomsAround = async function(centre, rooms, options)  {
    for(let dy = -1; dy <= 1; dy++) {
        for(let dx = -1; dx <= 1; dx++) {
            const location = locationAt(centre,dx,dy);
            let room = rooms[location];
            if(room){
                continue;
            }
            let fetchedRoom = await this.fetchRoom(location, options);
            if(!fetchedRoom) {
                fetchedRoom = {
                    location,
                    status: 'listening'
                };
            }
            rooms[location] = fetchedRoom; 
        }
    }
    for(let dy = -2; dy <= 2; dy++) {
        for(let dx = -2; dx <= 2; dx += ((dy == -2 || dy == 2) ? 1 : 4)) {
            const location = locationAt(centre,dx,dy);
            let room = rooms[location];
            if(room){
                // if(room.status == "actualised"){ //TODO save in a cache so no need to retrieve later
                //     continue;    
                // } else {
                delete rooms[location];    
                // }
            }
        }
    }
}

Dungeon.prototype.once = function(event, predicate) {
    return new Promise((resolve, reject) => {
        function onEvent(result) {
            if(!(predicate && !predicate(result))) {
                this.off(event,onEvent);
                resolve(result)
            }
        }
        this.on(event, onEvent);
    })
    
}

Dungeon.prototype.syncOn = async function(blockNumber) {
    console.log('syncing on ' + blockNumber);
    while(true) {
        if(this.lastBlock == blockNumber) {
            return;
        }
        await pause(0.2);
    }
}

Dungeon.prototype.startListening = async function() {
    if(this.listening) {
        return;
    }
    console.log('start listening...');
    this.listening = true;
    this._stopListening = false;
    this.interval = this.interval || 5; // TODO
    while(!this._stopListening) {
        console.log('fetching latest blocknumber ...');
        const latestBlock = await getBlockNumber(); // TODO get the hash for reorg detection
        console.log({latestBlock, lastBlock: this.lastBlock});
        if(latestBlock > this.lastBlock) {
            console.log('new blocks');
            const newState = {};
            newState.playerLocation = this.playerLocation;
            newState.rooms = {};
            for(let roomLocation of Object.keys(this.rooms)) {
                newState.rooms[roomLocation] = this.rooms[roomLocation];
            }

            const events = await this.getPastEvents('PlayerMoved', {
                filter:{
                    player: this.player
                },
                fromBlock: this.lastBlock+1,
                toBlock: latestBlock,
            })
            if(events.length > 0) {
                
                const latestEvent = events[events.length-1];
                newState.playerLocation = latestEvent.returnValues.newLocation;
                console.log('PlayerMoved', newState.playerLocation);
                await this.fetchRoomsAround(newState.playerLocation, newState.rooms, {
                    fromBlock: 0,
                    toBlock: latestBlock
                });
                // console.log(newState.rooms)
            }

            for(let roomLocation of Object.keys(newState.rooms)) {
                const room = newState.rooms[roomLocation];
                if(room.status == 'listening') {
                    const fetchedRoom = await this.fetchRoom(roomLocation, {
                        fromBlock: this.lastBlock+1,
                        toBlock: latestBlock,
                    })
                    if(fetchedRoom) {
                        newState.rooms[roomLocation] = fetchedRoom;
                    }
                }
            }

            const clonedRooms = {};
            for(let roomLocation of Object.keys(this.rooms)) {
                clonedRooms[roomLocation] = this.rooms[roomLocation];
            }
            for(let roomLocation of Object.keys(newState.rooms)) {
                const currentRoom = this.rooms[roomLocation];
                const newRoom = newState.rooms[roomLocation];
                if(currentRoom) {
                    if(currentRoom.status == 'listening' && newRoom.status != 'listening') {
                        console.log('new room from listen', roomLocation);
                    }
                } else {
                    if(newRoom.status != 'listening') {
                        console.log('new room', roomLocation);
                    } else {
                        console.log('new listen', roomLocation);
                    }
                }
                delete clonedRooms[roomLocation];
            }
            for(let roomLocation of Object.keys(clonedRooms)) {
                const room = clonedRooms[roomLocation];
                if(room.status != 'listening') {
                    console.log('room removed', roomLocation);
                } else {
                    console.log('listen removed', roomLocation);
                }
            }
            this.lastBlock = latestBlock;
            this.playerLocation = newState.playerLocation;
            this.rooms = newState.rooms;

            this.emit('block', this.lastBlock);
            // TODO 
            // this.emit('playerMoved', this.playerLocation); // TODO if different
            // this.emit('roomAdded', this); // TODO
            // this.emit('roomRemoved', this); // TODO
        }
        if(this._stopListening) {break;}
        if(this.interval > 0.5) {
            await pause(0.5);
            if(this._stopListening) {break;}
            await pause(this.interval - 0.5)
        } else {
            await pause(this.interval)
        }
    }
    this.listening = false;
    console.log('listening loop stopped');
}

Dungeon.prototype.stopListening = async function() {
    console.log('stop listening...');
    this._stopListening = true;
    while(this.listening) {
        await pause(1);
    }
    console.log('stopped');
    this._stopListening = false;
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
        fromBlock: options.fromBlock,
        toBlock: options.toBlock,
        filter:{
            location : location.toString ? location.toString(10) : location
        }
    });
    if(discoveryEvents.length == 0) {
        return null;
    }
    const actualisationEvents = await getPastEvents(this.contract, 'RoomActualised', {
        fromBlock:0,
        toBlock: this.lastBlock,
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
    return call({blockNumber: this.lastBlock}, this.contract, 'getPlayer', this.player);
}

Dungeon.prototype.terminate = async function() {
    console.log('TERMINATING...');
    if(this.initializating){
        await this.cancelInit();
    }
    await this.stopListening();
    console.log('TERMINATED');
}

module.exports = Dungeon;
