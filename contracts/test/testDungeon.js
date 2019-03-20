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
        const direction = dungeon.findFirstExit(room);
        const receipt = await dungeon.move(direction);
        const events = await dungeon.getPastEvents('RoomDiscovered', {fromBlock: receipt.blockNumber, toBlock: receipt.blockNumber});
        assert.equal(events.length, 1);
    });

    t.test('move twice', async() => {
        let location = await dungeon.getPlayerLocation();
        let room = await dungeon.fetchRoom(location);
        let direction = dungeon.findFirstExit(room);
        const firstMoveReceipt = await dungeon.move(direction);
        
        location = await dungeon.getPlayerLocation();
        room = await dungeon.fetchRoom(location);
        await dungeon.contract.methods.actualiseBlock(firstMoveReceipt.blockNumber).send({from: dungeon.player, gas})
        await dungeon.contract.methods.actualiseRoom(location).send({from: dungeon.player, gas})
        
        const reverseDirection = (direction+2)%4;
        direction = dungeon.findFirstExit(room, reverseDirection+1);
        const receipt = await dungeon.move(direction);

        const events = await dungeon.getPastEvents('RoomDiscovered', {fromBlock: receipt.blockNumber, toBlock: receipt.blockNumber});
        if(direction != reverseDirection) {
            assert.equal(events.length, 1);
        } else {
            assert.equal(events.length, 0);
        }
    });

    t.test('move and back', async() => {
        let location = await dungeon.getPlayerLocation();
        let room = await dungeon.fetchRoom(location);
        let direction = dungeon.findFirstExit(room);
        await dungeon.move(direction);

        const reverseDirection = (direction+2)%4;
        const receipt = await dungeon.move(reverseDirection);
        let events = await dungeon.getPastEvents('RoomActualised', {fromBlock: receipt.blockNumber, toBlock: receipt.blockNumber});
        assert.equal(events.length, 1);

        events = await dungeon.getPastEvents('RoomDiscovered', {fromBlock: receipt.blockNumber, toBlock: receipt.blockNumber});
        assert.equal(events.length, 0);
    });

    t.test('move twice and back', async() => {
        
    });
})