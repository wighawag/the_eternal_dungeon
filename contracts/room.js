const BN = require('bn.js');
const {
    soliditySha3,
} = require('./utils');

function getRandomValue(location, hash) {
    return new BN(soliditySha3(location, hash), 'hex');
}

const Room = function(dungeon, location, hash) {
    this.dungeon;
    const random = getRandomValue(location, hash);

    const exits = random.mod(new BN(16)).toNumber();
    const kind = random.mod(new BN(2)).add(new BN(1)).toNumber(); // TODO ranomize for each access
    
    // TODO fetch adjacent room for outward exits
    this.exits = exits;
    this.kind = kind;
}

Room.prototype.firstExit = function() {
    for(let i = 0; i < 4; i++) {
        const exit = Math.pow(2,i)
        if((this.exits & exit) == exit) {
            return i;
        }
    }
    return -1;
}