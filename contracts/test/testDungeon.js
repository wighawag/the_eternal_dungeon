const tap = require('tap');
const assert = require('assert');
const BN = require('bn.js');

const Dungeon = require('../dungeon.js')

const rocketh = require('rocketh');
const {getDeployedContract} = require('rocketh-web3')(rocketh, require('Web3'));

const {users, dungeonOwner} = rocketh.namedAccounts;

const {
    waitReceipt
} = require('../utils')(rocketh.ethereum);

const gas = 4000000;

function logObj(obj) {
    console.log(JSON.stringify(obj, null, '  '));
}

// tap.test('Dungeon init', async(t) => {

//     let dungeon;
//     t.beforeEach(async() => {
//         const deployments = await rocketh.runStages();
//         dungeon = new Dungeon(rocketh.ethereum, deployments.Dungeon.address, deployments.Dungeon.contractInfo.abi, {
//             blockInterval: 0.1,
//             logLevel: 'trace',
//         });
//         await dungeon.start(dungeonOwner).then(waitReceipt);
//     });

//     t.afterEach(async() => {
//         await dungeon.terminate();
//     });


//     t.test('double init', async() => {
//         dungeon.init(users[0]);
//         await dungeon.init(users[1]);
//     });

//     t.test('cancel init', async() => {
//         dungeon.init(users[0]);
//         await dungeon.cancelInit();
//     });

// });


tap.test('Dungeon', async(t) => {
    
    let dungeon;
    t.beforeEach(async() => {
        const deployments = await rocketh.runStages();
        dungeon = new Dungeon(rocketh.ethereum, deployments.Dungeon.address, deployments.Dungeon.contractInfo.abi, {
            blockInterval: 0.1,
            logLevel: 'debug',
        });
        // already done as part of stage : await dungeon.start(dungeonOwner).then(waitReceipt);
        await dungeon.init(users[0]);
    });

    t.afterEach(async() => {
        await dungeon.terminate();
    });

    t.test('move', async() => {
        const room = dungeon.rooms[dungeon.playerLocation];
        const direction = dungeon._findFirstExit(room);
        dungeon.move(direction);
        await dungeon.once('playerMoved');
        assert.equal(dungeon.playerLocation, Dungeon.locationInDirection(room.location, direction))
    });

    t.test('move twice', async() => {
        const firstRoom = dungeon.rooms[dungeon.playerLocation];
        let direction = dungeon._findFirstExit(firstRoom);
        dungeon.move(direction);
        await dungeon.once('playerMoved');

        const secondRoom = dungeon.rooms[dungeon.playerLocation];
        const reverseDirection = (direction+2)%4;
        direction = dungeon._findFirstExit(secondRoom, reverseDirection+1);
        
        dungeon.move(direction);
        await dungeon.once('playerMoved');
        assert.equal(dungeon.playerLocation,  Dungeon.locationInDirection(secondRoom.location, direction));
    });

    t.test('move and back', async() => {
        let firstRoom = dungeon.rooms[dungeon.playerLocation];
        let direction = dungeon._findFirstExit(firstRoom);
        dungeon.move(direction);
        await dungeon.once('playerMoved');

        const reverseDirection = (direction+2)%4;
        dungeon.move(reverseDirection);
        await dungeon.once('playerMoved');
        assert.equal(dungeon.playerLocation, firstRoom.location);
    });

    t.test('move and back instant', async() => {
        let firstRoom = dungeon.rooms[dungeon.playerLocation];
        let direction = dungeon._findFirstExit(firstRoom);
        await dungeon.move(direction);
        const reverseDirection = (direction+2)%4;
        const receipt = await dungeon.move(reverseDirection).then(waitReceipt);
        await dungeon.once('block', block => block >= receipt.blockNumber);
        assert.equal(dungeon.playerLocation, firstRoom.location);
    });

    // t.test('move twice and back', async() => {
        
    // });
})