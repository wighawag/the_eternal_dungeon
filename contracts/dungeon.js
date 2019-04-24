const BN = require('bn.js');

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

const Dungeon = function(provider, address, abi, options) {
    options = options || {
        logLevel: 'info',
        blockInterval: 12,
    }
    const {
        logLevel,
        blockInterval
    } = options;
    if(logLevel) {
        switch(logLevel) {
            case 'info' : this.logLevel = INFO; break;
            case 'error' : this.logLevel = ERROR; break;
            case 'trace' : this.logLevel = TRACE; break;
            case 'debug' : this.logLevel = DEBUG; break;
            default : this._info('logLevel ' + logLevel + ' not supported');
        }
    }
    this.provider = provider;
    this.interval = blockInterval / 2;
    this.energy = 0;
    this.playerMoved = false;
    this.callbacks = {};

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


// STATIC METHODS ///////////////////////////////////////////////////
Dungeon.locationInDirection = function(location, direction) {
    switch(direction) {
        case 0 : return Dungeon.locationAt(location, 0, -1);
        case 1 : return Dungeon.locationAt(location, 1, 0);
        case 2 : return Dungeon.locationAt(location, 0, 1);
        case 3 : return Dungeon.locationAt(location, -1, 0);
    }
}

Dungeon.locationAt = function(location, dx, dy) {
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

//////////////////////////////////////////////////////////////////////
const FATAL = 60;
const ERROR = 50;
const WARN = 40;
const INFO = 30;
const DEBUG = 20;
const TRACE = 10;

function traceCaller(n) {
    if (isNaN(n) || n < 0) {
        n = 1;
    }
    n += 1;
    let s = (new Error()).stack;
    let a = s.indexOf('\n', 5);
    while (n--) {
        a = s.indexOf('\n', a + 1);
        if (a < 0) {
            a = s.lastIndexOf('\n', s.length);
            break;
        }
    }

    let b = s.indexOf('\n', a + 1);
    if (b < 0) {
        b = s.length;
    }
    a = Math.max(s.lastIndexOf(' ', b), s.lastIndexOf('/', b));
    b = s.lastIndexOf(':', b);
    s = s.substring(a + 1, b);
    return s;
}


Dungeon.prototype._error = function(...args) {
    if (this.logLevel <= ERROR) {
        args.unshift(traceCaller(1) + ': ');
        Reflect.apply(console.log, console, args);
    }
}

Dungeon.prototype._info = function(...args) {
    if (this.logLevel <= INFO) {
        args.unshift(traceCaller(1) + ': ');
        Reflect.apply(console.log, console, args);
    }
}

Dungeon.prototype._trace = function(...args) {
    if (this.logLevel <= TRACE) {
        args.unshift(traceCaller(1) + ': ');
        Reflect.apply(console.log, console, args);
    }
}

Dungeon.prototype._debug = function(...args) {
    if (this.logLevel <= DEBUG) {
        args.unshift(traceCaller(1) + ': ');
        Reflect.apply(console.log, console, args);
    }
}

Dungeon.prototype.start = async function(owner) {
    const latestBlock = await getBlock('latest');
    return sendTx({from: owner, gas}, this.contract, 'start', latestBlock.number, latestBlock.hash);
}


Dungeon.prototype.cancelInit = async function() {
    this._trace('canceling init...');
    this._stopInit = true;
    while(this.initializating) {
        await pause(1);
    }
    this._stopInit = false;
    this._trace('canceled');
}

Dungeon.prototype.init = async function(player, delegate) { // TODO return same promise if any whenthis.player == new player
    if(this.initializating) {
        await this.cancelInit();
    }
    this._trace('initializing...');
    this.initializating = true;

    this.player = player;
    this.delegate = delegate;
    await this._stopListening();
    this.playerLocation = null;
    this.rooms = {};

    this.lastBlock = await getBlockNumber();
    this._trace({lastBlock: this.lastBlock});
    const playerData = await this.fetchPlayer(this.lastBlock);
    console.log(playerData);
    this.playerLocation = playerData.location;
    this.energy = playerData.energy;
    this.inDungeon = playerData.inDungeon;

    this._trace({playerLocation: this.playerLocation});
    await this._fetchRoomsAround(this.playerLocation, this.rooms, {
        fromBlock:0,
        toBlock: this.lastBlock
    });

    this.isCurrentDelegate = await this.fetchIsDelegate();

    this._startListening();
    this.initializating = false;
    // TODO emit reset
    this._trace('initialized');
}

Dungeon.prototype._fetchRoomsAround = async function(centre, rooms, options)  {
    for(let dy = -1; dy <= 1; dy++) {
        for(let dx = -1; dx <= 1; dx++) {
            const location = Dungeon.locationAt(centre,dx,dy);
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
            const location = Dungeon.locationAt(centre,dx,dy);
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


Dungeon.prototype.on = function(event, callback) {
    this.callbacks[event] = this.callbacks[event] || [];
    this.callbacks[event].push(callback);
}

Dungeon.prototype.off = function(event, callback) {
    const callbacks = this.callbacks[event];
    for(let i = 0; i < callbacks.length; i ++) {
        if(callbacks[i] == callback) {
            callbacks.splice(i,1);
            return;
        }
    }
}

Dungeon.prototype._emit = function(event, value) {
    const callbacks = this.callbacks[event];
    if(callbacks) {
        for(let i = 0; i < callbacks.length; i ++) {
            callbacks[i](value);
        }
    }
}

Dungeon.prototype.once = function(event, predicate) {
    return new Promise((resolve, reject) => {
        const onEvent = (result) => {
            if(!(predicate && !predicate(result))) {
                this.off(event,onEvent);
                resolve(result)
            }
        }
        this.on(event, onEvent);
    })
    
}

Dungeon.prototype.opositeExit = function (location, direction) {
    const roomLocation = Dungeon.locationInDirection(location, direction);
    // console.log(direction, roomLocation);
    const room = this.rooms[roomLocation];
    // console.log(room);
    const reverseDirection = (direction + 2) % 4;
    // console.log(reverseDirection);
    if(room) {
        return (room.exitsBits & Math.pow(2, reverseDirection)) == Math.pow(2, reverseDirection);
    } else {
        return false;
    }
}

Dungeon.prototype.allExitsFor = function(roomOrLocation) {
    let room;
    if(typeof roomOrLocation == 'string') {
        room = this.rooms[roomOrLocation];
    } else {
        room = roomOrLocation;
    }
    return {
        north: room.exits.north || this.opositeExit(room.location, 0),
        east: room.exits.east || this.opositeExit(room.location, 1),
        south: room.exits.south || this.opositeExit(room.location, 2),
        west: room.exits.west || this.opositeExit(room.location, 3),
    }
}

Dungeon.prototype._findFirstExit = function(roomOrLocation, start) {
    let currentRoom;
    if(typeof roomOrLocation == 'string') {
        currentRoom = this.rooms[roomOrLocation];
    } else {
        currentRoom = roomOrLocation;
    }
    const allExits = this.allExitsFor(currentRoom);
    start = start || 0;
    for(let i = 0; i < 4; i++) {
        const j = (i+start) % 4;
        switch(j) {
            case 0: if(allExits.north) {return j;} break;
            case 1: if(allExits.east) {return j;} break;
            case 2: if(allExits.south) {return j;} break;
            case 3: if(allExits.west) {return j;} break;
        }
    }
    return -1;
}


// Dungeon.prototype.syncOn = async function(blockNumber) {
//     this._trace('syncing on ' + blockNumber);
//     while(true) {
//         if(this.lastBlock == blockNumber) {
//             return;
//         }
//         await pause(0.2);
//     }
// }

Dungeon.prototype._startListening = async function() {
    if(this.listening) {
        return;
    }
    this._trace('start listening...');
    this.listening = true;
    this._stopListeningRequested = false;
    this.interval = this.interval || 5; // TODO
    while(!this._stopListeningRequested) {
        try{
            const latestBlock = await getBlockNumber(); // TODO get the hash for reorg detection
            let newPlayerLocation = false;
            let inDungeonChanged = false;
            let energyChanged = false;
            let delegatedChanged = false;
            const roomsAdded = [];
            const roomsRemoved = [];
            if(latestBlock > this.lastBlock) {
                this._trace('new blocks');
                const newState = {};
                newState.playerLocation = this.playerLocation;
                newState.rooms = {};
                for(let roomLocation of Object.keys(this.rooms)) {
                    newState.rooms[roomLocation] = this.rooms[roomLocation];
                }

                // const events = await this.getPastEvents('PlayerMoved', {
                //     filter:{
                //         player: this.player
                //     },
                //     fromBlock: this.lastBlock+1,
                //     toBlock: latestBlock,
                // })
                // if(events.length > 0) {
                    
                //     const latestEvent = events[events.length-1];
                //     newState.playerLocation = latestEvent.returnValues.newLocation;
                //     this._info('PlayerMoved', newState.playerLocation);
                //     newPlayerLocation = true;
                //     await this._fetchRoomsAround(newState.playerLocation, newState.rooms, {
                //         fromBlock: 0,
                //         toBlock: latestBlock
                //     });
                // }

                const playerData = await this.fetchPlayer(latestBlock);
                console.log(playerData);
                if(playerData.location != this.playerLocation) {
                    newState.playerLocation = playerData.location;
                    this._info('PlayerMoved', newState.playerLocation);
                    newPlayerLocation = true;
                    await this._fetchRoomsAround(newState.playerLocation, newState.rooms, {
                        fromBlock: 0,
                        toBlock: latestBlock
                    });
                }

                if(playerData.energy != this.energy) {
                    energyChanged = true;
                    newState.energy = playerData.energy;
                }

                if(playerData.inDungeon != this.inDungeon) {
                    inDungeonChanged = true;
                    newState.inDungeon = playerData.inDungeon;
                }

                newState.isCurrentDelegate = await this.fetchIsDelegate();
                if(newState.isCurrentDelegate != this.isCurrentDelegate) {
                    delegatedChanged = true;
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
                            this._info('new room from listen', roomLocation);
                            roomsAdded.push(newRoom);
                        }
                    } else {
                        if(newRoom.status != 'listening') {
                            this._info('new room', roomLocation);
                            roomsAdded.push(newRoom);
                        } else {
                            this._info('new listen', roomLocation);
                            roomsAdded.push(newRoom);
                        }
                    }
                    delete clonedRooms[roomLocation];
                }
                for(let roomLocation of Object.keys(clonedRooms)) {
                    const room = clonedRooms[roomLocation];
                    if(room.status != 'listening') {
                        this._info('room removed', roomLocation);
                        roomsRemoved.push(room);
                    } else {
                        this._info('listen removed', roomLocation);
                        roomsRemoved.push(room);
                    }
                }
                this.lastBlock = latestBlock;
                this.playerLocation = newState.playerLocation;
                this.rooms = newState.rooms;
                this.energy = newState.energy;
                this.inDungeon = newState.inDungeon;
                this.isCurrentDelegate = newState.isCurrentDelegate;

                
                for(let room of roomsRemoved) {
                    this._emit('roomRemoved', room);
                }
                for(let room of roomsAdded) {
                    this._emit('roomAdded', room);
                }

                if(newPlayerLocation) {
                    this._emit('playerMoved', this.playerLocation);
                }

                if(energyChanged) {
                    this._emit('energyChanged', this.energy);
                }

                if(inDungeonChanged) {
                    this._emit(this.inDungeon ? 'playerEntered' : 'playerQuit');
                }

                if(delegatedChanged) {
                    // TODO new / not new
                    this._emit('delegated', this.delegate);
                }

                this._emit('block', this.lastBlock);
            }
            if(this._stopListeningRequested) {break;}
            if(this.interval > 0.5) {
                await pause(0.5);
                if(this._stopListeningRequested) {break;}
                await pause(this.interval - 0.5);
            } else {
                await pause(this.interval);
            }
        } catch(e) {
            this._error(e);
        }
    }
    this.listening = false;
    this._trace('listening loop stopped');
}

Dungeon.prototype._stopListening = async function() {
    this._trace('stop listening...');
    this._stopListeningRequested = true;
    while(this.listening) {
        await pause(1);
    }
    this._trace('stopped');
    this._stopListeningRequested = false;
}


Dungeon.prototype.move = async function(direction) {
    return sendTx({from: this.player, gas}, this.contract, 'move', this.player, direction);
}

Dungeon.prototype.join = async function() {
    return sendTx({from: this.player, gas, value: "5000000000000000000"}, this.contract, 'join', this.delegate);
}

Dungeon.prototype.addDelegate = async function() {
    return sendTx({from: this.player, gas, value: "5000000000000000"}, this.contract, 'addDelegate', this.delegate);
}

Dungeon.prototype.getPastEvents = function(eventName, options) {
   return getPastEvents(this.contract, eventName, options); 
}

Dungeon.prototype.fetchRoom = async function(location, options) {
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
        toBlock: options.toBlock,
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
    
    return this.computeRoom(location, roomBlockHash, roomDiscovery.blockNumber, roomDiscovery.numRooms, roomDiscovery.numExits, status);
}

Dungeon.prototype.generateExits = function(location, hash, numRoomsAtDiscovery, numExitsAtDiscovery) {
    function sqrt(x) {
        let z = x.add(new BN(1)).div(new BN(2));
        let y = x;
        while (z.lt(y)) {
            y = z;
            z = x.div(z).add(z).div(new BN(2));
        }
        return y;
    }
    let target =  (new BN(2)).add(sqrt(new BN(numRoomsAtDiscovery))).sub(new BN(numExitsAtDiscovery));
    if(target.lt(new BN(1))) {
        target = new BN(1);
    }
    if(target.gt(new BN(3))) {
        target = new BN(3);
    }
    console.log(location, target.toString(10));
    const random = this.getRandomValue(location, hash, 1, 3);
    let numExits = target.sub(new BN(1)).add(random).toNumber();
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

Dungeon.prototype.computeRoom = async function(location, hash, blockNumber, numRoomsAtDiscovery, numExitsAtDiscovery, status) {
    
    let {
        numExits,
        exits,
        exitsBits
    } = this.generateExits(location, hash, numRoomsAtDiscovery, numExitsAtDiscovery);
    
    const kind = this.getRandomValue(location, hash, 3, 2).add(new BN(1)).toNumber();

    return {
        status,
        location,
        hash,
        blockNumber,
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


Dungeon.prototype.fetchPlayer = function(block) {
    return call({blockNumber: block}, this.contract, 'getPlayer', this.player);
}

Dungeon.prototype.fetchIsDelegate = function(block) {
    return call({blockNumber: block}, this.contract, 'isDelegateFor', this.delegate, this.player);
}

Dungeon.prototype.terminate = async function() {
    this._trace('TERMINATING...');
    if(this.initializating){
        await this.cancelInit();
    }
    await this._stopListening();
    this._trace('TERMINATED');
}

module.exports = Dungeon;
