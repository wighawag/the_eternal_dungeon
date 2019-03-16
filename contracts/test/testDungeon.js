const tap = require('tap');
const assert = require('assert');
const BN = require('bn.js');

const Dungeon = require('../dungeon.js')

const rocketh = require('rocketh');
const {getDeployedContract} = require('rocketh-web3')(rocketh, require('Web3'));

const {users, dungeonOwner} = rocketh.namedAccounts;

const gas = 4000000;

function logObj(obj) {
    console.log(JSON.stringify(obj, null, '  '));
}

tap.test('Dungeon', async(t) => {
    
    let dungeon;
    t.beforeEach(async() => {
        const deployments = await rocketh.runStages();
        dungeon = new Dungeon(rocketh.ethereum, users[0], deployments.Dungeon.address, deployments.Dungeon.contractInfo.abi);
        await dungeon.start(dungeonOwner);
    });

    t.test('move', async() => {
        const location = await dungeon.getPlayerLocation();
        const room = await dungeon.fetchRoom(location);
        console.log(await dungeon.getPastEvents('Debug'));
        console.log(room);
        const roomSolc = await dungeon.contract.methods.debug_room(location).call();
        console.log(roomSolc);
        const direction = dungeon.findFirstExit(room);
        const receipt = await dungeon.move(direction);
        const events = await dungeon.getPastEvents('RoomDiscovered', {fromBlock: receipt.blockNumber, toBlock: receipt.blockNumber});
        assert.equal(events.length, 1);
    });

    // t.test('move twice', async() => {
    //     let location = await dungeon.getPlayerLocation();
    //     let room = await dungeon.fetchRoom(location);
    //     let direction = dungeon.findFirstExit(room);
    //     await dungeon.move(direction);
        
    //     location = await dungeon.getPlayerLocation();
    //     room = await dungeon.fetchRoom(location);
    //     direction = dungeon.findFirstExit(room);
    //     const receipt = await dungeon.move(direction);
    //     const events = await dungeon.getPastEvents('RoomDiscovered', {fromBlock: receipt.blockNumber, toBlock: receipt.blockNumber});
    //     assert.equal(events.length, 1);
    // });

    // t.test('move and back', async() => {
    //     let location = await dungeon.getPlayerLocation();
    //     let room = await dungeon.fetchRoom(location);
    //     let direction = dungeon.findFirstExit(room);
    //     await dungeon.move(direction);

    //     const receipt = await dungeon.move((direction+2)%4);
    //     let events = await dungeon.getPastEvents('RoomActualised', {fromBlock: receipt.blockNumber, toBlock: receipt.blockNumber});
    //     assert.equal(events.length, 1);

    //     events = await dungeon.getPastEvents('RoomDiscovered', {fromBlock: receipt.blockNumber, toBlock: receipt.blockNumber});
    //     assert.equal(events.length, 0);
    // });

    // t.test('move twice and back', async() => {
        
    // });
})