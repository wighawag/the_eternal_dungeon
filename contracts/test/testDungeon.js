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
        console.log('MOVE', 'room', room)
        const roomSolc = await dungeon.contract.methods.debug_room(location).call();
        console.log('MOVE', 'roomSolc', roomSolc)
        const direction = dungeon.findFirstExit(room);
        const receipt = await dungeon.move(direction);
        const events = await dungeon.getPastEvents('RoomDiscovered', {fromBlock: receipt.blockNumber, toBlock: receipt.blockNumber});
        assert.equal(events.length, 1);
    });

    t.test('move twice', async() => {
        let location = await dungeon.getPlayerLocation();
        console.log('TWICE', 'location1', location);
        let room = await dungeon.fetchRoom(location);
        console.log('TWICE', 'room1', room);
        let direction = dungeon.findFirstExit(room);
        console.log('TWICE', 'direction1', direction);
        const firstMoveReceipt = await dungeon.move(direction);
        
        location = await dungeon.getPlayerLocation();
        console.log('TWICE', 'location2', location);
        room = await dungeon.fetchRoom(location);
        console.log('TWICE', 'room2', room);
        await dungeon.contract.methods.actualiseBlock(firstMoveReceipt.blockNumber).send({from: dungeon.player, gas})
        await dungeon.contract.methods.actualiseRoom(location).send({from: dungeon.player, gas})
        const roomSolc2 = await dungeon.contract.methods.debug_room(location).call();
        console.log('TWICE', 'roomSolc2', roomSolc2)
        const reverseDirection = (direction+2)%4;
        console.log('TWICE', 'reverseDirection', reverseDirection);
        direction = dungeon.findFirstExit(room, reverseDirection+1);
        console.log('TWICE', 'direction2', direction);
        const receipt = await dungeon.move(direction);

        if(room.numExits > 1) {
            const events = await dungeon.getPastEvents('RoomDiscovered', {fromBlock: receipt.blockNumber, toBlock: receipt.blockNumber});
            assert.equal(events.length, 1);
        }
    });

    t.test('move and back', async() => {
        let location = await dungeon.getPlayerLocation();
        let room = await dungeon.fetchRoom(location);
        console.log('first', room);
        let direction = dungeon.findFirstExit(room);
        console.log('first', direction);
        await dungeon.move(direction);

        const reverseDirection = (direction+2)%4;
        console.log('second', reverseDirection);
        const receipt = await dungeon.move(reverseDirection);
        let events = await dungeon.getPastEvents('RoomActualised', {fromBlock: receipt.blockNumber, toBlock: receipt.blockNumber});
        assert.equal(events.length, 1);

        events = await dungeon.getPastEvents('RoomDiscovered', {fromBlock: receipt.blockNumber, toBlock: receipt.blockNumber});
        assert.equal(events.length, 0);
    });

    t.test('move twice and back', async() => {
        
    });
})