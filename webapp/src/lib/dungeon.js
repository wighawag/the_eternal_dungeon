import * as BN from 'bn.js';
import * as ethers from 'ethers';
import {soliditySha3} from 'web3-utils';
import log from '../utils/log';

function pause(duration) {
    return new Promise((res) => setTimeout(res, duration * 1000));
}

const Dungeon = function({ethersProvider, wallet, contract}, options) {
    options = options || {
        blockInterval: 12,
    }
    const {
        blockInterval
    } = options;

    this.interval = blockInterval / 2;
    this.energy = 0;
    this.playerMoved = false;
    this.callbacks = {};
    this.price = options.price || '1000000000000000000';

    this.provider = ethersProvider;
    this.wallet = wallet; // to perform tx on behalf of current user
    this.contract = new ethers.Contract(contract.address, contract.abi, this.provider);
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
    if(typeof location === 'object') {
        location = location.toString();
    }
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

Dungeon.prototype.cancelInit = async function() {
    log.trace('canceling init...');
    this._stopInit = true;
    while(this.initializing) {
        await pause(1);
    }
    this._stopInit = false;
    log.trace('canceled');
}

Dungeon.prototype.init = async function(player, delegatePrivateKey) { // TODO return same promise if any when this.player == new player
    if(this.initializing) {
        await this.cancelInit();
    }
    log.trace('initializing...');
    this.initializing = true;

    this.player = player;
    this.delegatePrivateKey = delegatePrivateKey;
    this.delegateWallet = new ethers.Wallet(delegatePrivateKey, this.provider);
    this.contract = this.contract.connect(this.delegateWallet);
    await this._stopListening();
    this.playerLocation = null;
    this.rooms = {};

    this.lastBlock = await this.provider.getBlockNumber();
    log.trace({lastBlock: this.lastBlock});
    const playerData = await this.fetchPlayer(this.lastBlock);
    this.playerLocation = playerData.location.toString();
    this.energy = playerData.energy.toString();
    this.inDungeon = playerData.inDungeon;

    log.trace({playerLocation: this.playerLocation});
    await this._fetchRoomsAround(this.playerLocation, this.rooms, this.lastBlock);

    this.isCurrentDelegate = await this.fetchIsDelegate();
    // console.log('currentDelegate', this.isCurrentDelegate);

    this._startListening();
    this.initializing = false;
    // TODO emit reset
    log.trace('initialized');
}

Dungeon.prototype._fetchRoomsAround = async function(centre, rooms, blockNumber)  {
    for(let dy = -1; dy <= 1; dy++) {
        for(let dx = -1; dx <= 1; dx++) {
            const location = Dungeon.locationAt(centre,dx,dy);
            let room = rooms[location];
            if(room){
                continue;
            }
            let fetchedRoom = await this.fetchRoom(location, blockNumber);
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
//     log.trace('syncing on ' + blockNumber);
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
    log.trace('start listening...');
    this.listening = true;
    this._stopListeningRequested = false;
    this.interval = this.interval || 5; // TODO
    while(!this._stopListeningRequested) {
        try{
            const latestBlock = await this.provider.getBlockNumber(); // TODO get the hash for reorg detection
            let newPlayerLocation = false;
            let inDungeonChanged = false;
            let energyChanged = false;
            let delegatedChanged = false;
            const roomsAdded = [];
            const roomsRemoved = [];
            if(latestBlock > this.lastBlock) {
                log.trace('new blocks');
                const newState = {};
                newState.playerLocation = this.playerLocation;
                newState.rooms = {};
                for(let roomLocation of Object.keys(this.rooms)) {
                    newState.rooms[roomLocation] = this.rooms[roomLocation];
                }

                const playerData = await this.fetchPlayer(latestBlock);
                if(playerData.location != this.playerLocation) {
                    newState.playerLocation = playerData.location;
                    log.info('PlayerMoved', newState.playerLocation);
                    newPlayerLocation = true;
                    await this._fetchRoomsAround(newState.playerLocation, newState.rooms, latestBlock);
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
                        const fetchedRoom = await this.fetchRoom(roomLocation, latestBlock)
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
                            log.info('new room from listen', roomLocation);
                            roomsAdded.push(newRoom);
                        }
                    } else {
                        if(newRoom.status != 'listening') {
                            log.info('new room', roomLocation);
                            roomsAdded.push(newRoom);
                        } else {
                            log.info('new listen', roomLocation);
                            roomsAdded.push(newRoom);
                        }
                    }
                    delete clonedRooms[roomLocation];
                }
                for(let roomLocation of Object.keys(clonedRooms)) {
                    const room = clonedRooms[roomLocation];
                    if(room.status != 'listening') {
                        log.info('room removed', roomLocation);
                        roomsRemoved.push(room);
                    } else {
                        log.info('listen removed', roomLocation);
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
                    this._emit('delegated', this.delegateWallet.address);
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
            log.error(e);
        }
    }
    this.listening = false;
    log.trace('listening loop stopped');
}

Dungeon.prototype._stopListening = async function() {
    log.trace('stop listening...');
    this._stopListeningRequested = true;
    while(this.listening) {
        await pause(1);
    }
    log.trace('stopped');
    this._stopListeningRequested = false;
}


Dungeon.prototype.utils = function () {
    return {
        waitReceipt: async (tx) => {
            const receipt = await tx.wait();
            return receipt;
        },
    };
}

Dungeon.prototype.move = async function(direction) {
    let gasEstimate;
    try {
        gasEstimate = await this.contract.estimate.move(this.player, direction)
    } catch(e) {
        console.error(e);
    }
    // console.log('gasEstimate', gasEstimate);
    if (!gasEstimate) {
        gasEstimate = ethers.BigNumber.from(4000000);
    }
    const gasLimit = gasEstimate.add(15000);

    const balance = await this.provider.getBalance(this.delegateWallet.address);
    const gasPrice = await this.provider.getGasPrice();
    const fee = gasPrice.mul(gasLimit);
    
    if(fee.gt(balance)) {
        throw new Error('not enough balance');
    }

    const overrides = {gasLimit, gasPrice};
    // console.log({overrides});
    return this.contract.functions.move(this.player, direction, overrides);
}

Dungeon.prototype.join = async function() {
    let gasEstimate = ethers.BigNumber.from(200000).toHexString();
    // TODO await estimate({from: this.player, gas: 4000000, value: this.price}, this.contract, 'join', this.delegateWallet.address);
    let value = ethers.BigNumber.from(this.price).toHexString();
    return this.wallet.tx({gas: gasEstimate, value}, 'Dungeon', 'join', this.delegateWallet.address);
}

Dungeon.prototype.addDelegate = async function() {
    const gasEstimate = 4000000; // TODO await estimate({from: this.player, gas: 4000000}, this.contract, 'addDelegate', this.delegateWallet.address);
    return this.wallet.tx({gas: gasEstimate + 15000}, 'Dungeon', 'addDelegate', this.delegateWallet.address);
}

Dungeon.prototype.fetchRoom = async function(location, blockNumber) {
    let roomBlockHash;

    const roomData = await this.wallet.call({blockTag: blockNumber}, 'Dungeon', 'getRoom', location);
    const roomBlockS = roomData.blockNumber.toString();
    if(roomBlockS == "0") {
        return null; // not discovered
    }
    let status = 'discovered';
    if(roomData.kind != 0) {
        roomBlockHash = await this.wallet.call({blockTag: blockNumber}, 'Dungeon', 'blockHashes', roomData.blockNumber);
        status = 'actualised';
    } else {
        const block = await this.provider.getBlock(roomData.blockNumber.toNumber());
        roomBlockHash = block.hash;
    }
    
    return this.computeRoom(location, roomBlockHash, roomData.blockNumber, roomData.numRooms, roomData.numExits, status);
}

Dungeon.prototype.generateExits = function(location, hash, numRoomsAtDiscovery, numExitsAtDiscovery) {
    if(typeof location === 'object') {
        location = location.toString();
    }
    if(typeof numRoomsAtDiscovery === 'object') {
        numRoomsAtDiscovery = numRoomsAtDiscovery.toString();
    }
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
    // console.log(location, target.toString(10));
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

    const exitsBits = exits;
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

    const hasChest = this.getRandomValue(location, hash, 4, 3).toNumber() == 0;
    let chest;
    if (hasChest) {
        chest = this.getRandomValue(location, hash, 5);
    }
    
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
        hasChest,
        chest
    };
}

Dungeon.prototype.getRandomValue = function(location, hash, index, mod) {
    const random = soliditySha3(
        {type: 'uint256', value: location},
        {type: 'bytes32', value: hash},
        {type: 'uint8', value: index},
    );
    const bn = new BN(random.slice(2), 'hex');
    if (mod) {
        return bn.mod(new BN(mod))
    }
    return bn;
}


Dungeon.prototype.fetchPlayer = function(block) {
    return this.wallet.call({blockTag: block}, 'Dungeon', 'getPlayer', this.player);
}

Dungeon.prototype.fetchIsDelegate = function(block) {
    return this.wallet.call({blockTag: block}, 'Dungeon', 'isDelegateFor', this.delegateWallet.address, this.player);
}

Dungeon.prototype.terminate = async function() {
    log.trace('TERMINATING...');
    if(this.initializing){
        await this.cancelInit();
    }
    await this._stopListening();
    log.trace('TERMINATED');
}

export default Dungeon;
