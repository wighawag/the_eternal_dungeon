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

tap.test('Dungeon', async(t) => {
    
    let dungeon;
    t.beforeEach(async() => {
        const deployments = await rocketh.runStages();
        dungeon = new Dungeon(rocketh.ethereum, deployments.Dungeon.address, deployments.Dungeon.contractInfo.abi, {
            // logLevel: 'trace',
        });
        // already done as part of stage : await dungeon.start(dungeonOwner).then(waitReceipt);
        await dungeon.init(users[0]);
    });

    t.afterEach(async() => {
        await dungeon.terminate();
    });

    t.test('evm result should equal js result', async() => {
        const room = dungeon.rooms[dungeon.playerLocation];
        let direction = dungeon._findFirstExit(room);
        const firstMoveReceipt = await dungeon.move(direction).then(waitReceipt);
        const discovery = (await dungeon.getPastEvents('RoomDiscovered', {
            fromBlock: firstMoveReceipt.blockNumber,
            toBlock: firstMoveReceipt.blockNumber
        }))[0].returnValues;
        // console.log({discovery});

        const playerMove = (await dungeon.getPastEvents('PlayerMoved', {
            fromBlock: firstMoveReceipt.blockNumber,
            toBlock: firstMoveReceipt.blockNumber
        }))[0].returnValues;
        // console.log({playerMove});

        await dungeon.contract.methods.actualiseBlock(firstMoveReceipt.blockNumber).send({from: dungeon.player, gas})
        
        await dungeon.once('block', block => block >= firstMoveReceipt.blockNumber);
        // console.log({playerLocation: dungeon.playerLocation});
        
        const actualisationReceipt = await dungeon.contract.methods.actualiseRoom(playerMove.newLocation).send({from: dungeon.player, gas})
        const actualisation = (await dungeon.getPastEvents('RoomActualised', {
            fromBlock: actualisationReceipt.blockNumber,
            toBlock: actualisationReceipt.blockNumber
        }))[0].returnValues;
        // console.log({actualisation});

        const evmExits = await dungeon.contract.methods.generateExits(playerMove.newLocation, firstMoveReceipt.blockHash, discovery.numRooms, discovery.numExits).call();
        // console.log({evmExits});
        const jsExits = dungeon.generateExits(playerMove.newLocation, firstMoveReceipt.blockHash, discovery.numRooms, discovery.numExits);
        // console.log({jsExits});
        assert.equal(evmExits[0], jsExits.exitsBits);
    });

})