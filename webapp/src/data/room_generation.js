import {soliditySha3} from 'web3-utils';
import * as BN from 'bn.js';
import properties from './properties';

function getRandomValue(location, hash, index, mod) {
    const random = soliditySha3(
        {type: 'uint256', value: location},
        {type: 'bytes32', value: hash},
        {type: 'uint8', value: index},
    );
    return new BN(random.slice(2), 'hex').mod(new BN(mod));
}

class RNG {
    constructor(dungeonHash, roomLocation, roomHash) {
        this.dungeonHash = dungeonHash;
        this.roomLocation = roomLocation;
        this.roomHash = roomHash;
    }

    randomInteger(from, to) {
        from = from || 0;
        to = to || Number.MAX_SAFE_INTEGER;
        const mod = to - from;
        const bn = getRandomValue(this.roomLocation, this.roomHash, this.counter++, mod)
        return bn.toNumber() + from;
    }

    randomItem(array) {
        const index = this.randomInteger(0, array.length);
        return array[index]; 
    }

    randomName() {
        return 'random Room'; // TODO
    }
    randomSize() {
        return this.randomItem(properties.size.list);
    }
    randomSmell() {
        return this.randomItem(properties.smell.list);
    }
    randomLight() {
        return this.randomItem(properties.light.list);
    }
    randomWalls() {
        return this.randomItem(properties.walls.list);
    }
    randomCeiling() {
        return this.randomItem(properties.ceiling.list);
    }
    randomFloor() {
        return this.randomItem(properties.floor.list);
    }
    randomFeatures() {
        const features = [this.randomItem(properties.features.list)];
        if(this.randomInteger(0,100) < 10) {
            const secondFeature = this.randomItem(properties.features.list);
            if (secondFeature.type !== features[0].type) {
                features.push(secondFeature);
            }
        }
        return features;
    }
    randomChests(blockchainData) {
        return [];
    }
    randomMonsters(blockchainData){
        return [];
    }

}


function textify(spec) {
    let actionCounter = 0;

    const scene = {
        name: spec.name,
        description: [],
        scenes: [],
    };

    // TODO pick 2 properties and generate description from it.

    for (const feature of spec.features) {
        scene.scenes.push({
            name: 'Look ' + feature.type,
            description: [
                '' + feature.type + (feature.of ? ' of ' + feature.of : '') + (feature.material ? ' is made of ' + feature.material.type : '')
            ],
        });
        scene.description.push('There is ' + feature.type);
    }

    // TODO entryDescription

    for (const chest of spec.chests) {
        scene.scenes.push({
            name: 'Open Chest', //TODO
            description: ['You open the chest'],
            actionIndex: actionCounter++
        });
    }

    if(spec.monsters && spec.monsters.length > 0) {
        for (const monster of spec.monsters) {
            // TODO
        }
        // TODO scene.scenes.push({});
    }
    


    if (spec.directions) {
        const exitsArray = [];
        for (let exit of ['north', 'east', 'south', 'west']) {
            if (spec.directions[exit]) {
                exitsArray.push(exit);
            }
        }
        let exitsDescription;
        if (exitsArray.length == 0) {
            exitsDescription = "The room has no exits";
        } else if (exitsArray.length == 1) {
            exitsDescription = "The room has only one exists, on the " + exitsArray[0];
        } else {
            exitsDescription = 'There are ' + exitsArray.length + ' exists, on the ' + exitsArray.slice(0, exitsArray.length - 1).join(', ') + ' and ' + exitsArray[exitsArray.length - 1];
        }
        scene.description.push(exitsDescription);
    }

    
    scene.id = 0;
    let i = 1;
    for (const innerScene of scene.scenes) {
        innerScene.id = i++;
    }
    const roomDesc = {
        scene,
        directions: spec.directions
    }
    console.log({roomDesc});
    return roomDesc;
}

export function generateRoom(dungeonHash, roomLocation, roomHash, directions, blockchainData) {
    const rng = new RNG(dungeonHash, roomLocation, roomHash);
    const spec = {
        name: rng.randomName(),
        size: rng.randomSize(),
        smell: rng.randomSmell(),
        light: rng.randomLight(),
        walls: rng.randomWalls(),
        ceiling: rng.randomCeiling(),
        floor: rng.randomFloor(),
        features : rng.randomFeatures(),
        chests : rng.randomChests(blockchainData),
        monsters : rng.randomMonsters(blockchainData),
        directions
    }
    console.log({spec});
    const roomDesc = textify(spec);
    return roomDesc;
}