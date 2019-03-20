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

    t.test('evm result should equal js result', async() => {
        let location = await dungeon.getPlayerLocation();
        let room = await dungeon.fetchRoom(location);
        let direction = dungeon.findFirstExit(room);
        const firstMoveReceipt = await dungeon.move(direction);
        const discovery = (await dungeon.getPastEvents('RoomDiscovered', {
            fromBlock: firstMoveReceipt.blockNumber,
            toBlock: firstMoveReceipt.blockNumber
        }))[0].returnValues;
        location = await dungeon.getPlayerLocation();
        
        room = await dungeon.fetchRoom(location);
        await dungeon.contract.methods.actualiseBlock(firstMoveReceipt.blockNumber).send({from: dungeon.player, gas})
        const actualisationReceipt = await dungeon.contract.methods.actualiseRoom(location).send({from: dungeon.player, gas})
        const actualisation = (await dungeon.getPastEvents('RoomActualised', {
            fromBlock: actualisationReceipt.blockNumber,
            toBlock: actualisationReceipt.blockNumber
        }))[0].returnValues;
        
        const evmExits = await dungeon.contract.methods.generateExits(location, firstMoveReceipt.blockHash, discovery.numRooms, discovery.numExits).call();
        const jsExits = dungeon.generateExits(location, firstMoveReceipt.blockHash, discovery.numRooms, discovery.numExits);
        assert.equal(evmExits[0], jsExits.exitsBits);
    });

})