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
        await dungeon.start(dungeonOwner).then(waitReceipt);
        await dungeon.init(users[0]);
    });

    t.afterEach(async() => {
        await dungeon.terminate();
    });

    // t.test('move', async() => {
    //     const room = dungeon.rooms[dungeon.playerLocation];
    //     const direction = dungeon._findFirstExit(room);
    //     const receipt = await dungeon.move(direction).then(waitReceipt);
        
    //     await dungeon.once('block', block => block >= receipt.blockNumber);
    //     assert.equal(dungeon.playerLocation, Dungeon.locationInDirection(room.location, direction))
        
    //     const events = await dungeon.getPastEvents('RoomDiscovered', {fromBlock: receipt.blockNumber, toBlock: receipt.blockNumber});
    //     assert.equal(events.length, 1);
    //     const playerMovedEvents = await dungeon.getPastEvents('PlayerMoved', {fromBlock: receipt.blockNumber, toBlock: receipt.blockNumber});
    //     assert.equal(playerMovedEvents.length, 1);
    // });

    t.test('move twice', async() => {
        let room = dungeon.rooms[dungeon.playerLocation];
        let direction = dungeon._findFirstExit(room);

        // console.log({room,direction});
        const firstMoveReceipt = await dungeon.move(direction).then(waitReceipt);
        
        await dungeon.once('block', block => block >= firstMoveReceipt.blockNumber);

        await dungeon.contract.methods.actualiseBlock(firstMoveReceipt.blockNumber).send({from: dungeon.player, gas})
        await dungeon.contract.methods.actualiseRoom(dungeon.playerLocation).send({from: dungeon.player, gas})

        room = dungeon.rooms[dungeon.playerLocation];

        // const discoveryEvents = await dungeon.getPastEvents('RoomDiscovered', {fromBlock: firstMoveReceipt.blockNumber, toBlock: firstMoveReceipt.blockNumber});
        // const discovery = discoveryEvents[0].returnValues;
        // const evmExits = await dungeon.contract.methods.generateExits(room.location, firstMoveReceipt.blockHash, discovery.numRooms, discovery.numExits).call();
        // const jsExits = dungeon.generateExits(room.location, firstMoveReceipt.blockHash, discovery.numRooms, discovery.numExits); 
        // console.log({room, evmExits, jsExits});

        const reverseDirection = (direction+2)%4;
        direction = dungeon._findFirstExit(room, reverseDirection+1);
        // console.log({reverseDirection, direction})
        const receipt = await dungeon.move(direction).then(waitReceipt);

        // await dungeon.once('block', block => block >= receipt.blockNumber);

        const events = await dungeon.getPastEvents('RoomDiscovered', {fromBlock: receipt.blockNumber, toBlock: receipt.blockNumber});
        if(direction != reverseDirection) {
            assert.equal(events.length, 1);
        } else {
            assert.equal(events.length, 0);
        }
    });

    // t.test('move and back', async() => {
    //     let room = dungeon.rooms[dungeon.playerLocation];
    //     let direction = dungeon._findFirstExit(room);
    //     await dungeon.move(direction);

    //     const reverseDirection = (direction+2)%4;
    //     const receipt = await dungeon.move(reverseDirection).then(waitReceipt);
    //     let events = await dungeon.getPastEvents('RoomActualised', {fromBlock: receipt.blockNumber, toBlock: receipt.blockNumber});
    //     assert.equal(events.length, 1);

    //     events = await dungeon.getPastEvents('RoomDiscovered', {fromBlock: receipt.blockNumber, toBlock: receipt.blockNumber});
    //     assert.equal(events.length, 0);
    // });

    // t.test('move and back instant', async() => {
    //     let room = dungeon.rooms[dungeon.playerLocation];
    //     let direction = dungeon._findFirstExit(room);
    //     await dungeon.move(direction);
    //     const reverseDirection = (direction+2)%4;
    //     const receipt = await dungeon.move(reverseDirection).then(waitReceipt);
        
    //     await dungeon.once('block', block => block >= receipt.blockNumber);
    //     assert.equal(dungeon.playerLocation, room.location);
    // });

    // t.test('move twice and back', async() => {
        
    // });
})