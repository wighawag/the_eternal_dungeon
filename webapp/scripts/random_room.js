// import { randomBytes } from "crypto";
const Sentencer = require("sentencer");


// Dungeon.prototype.getRandomValue = function(location, hash, index, mod) {
function getRandomValue(mod) {
    return Math.floor(Math.random() * mod);
}

const sentences = {
    "feel" : [{sentence:"{{ room }} feels {{ adjective }}", weight:100}],
    // "feel" : [{sentence:"It feels {{adjective}}", weight:100}],
}

// Structure -> environment description
// look again
const descriptionTree = {
    sentence: "",
    children : [
        {
            sentence: "As you enter the room, ...",
            children: []
        },
        {
            sentence: "The room open up in front of you.",
            children: [
                {
                    sentence: "",
                    children:[]
                }
            ]
        },
    ]
}

const references = {
    "room": [
        {value:"The room", weight:100},
        {value:"It", weight:100},
        {value:"Such place", weight:10},
    ],
    "dungeon": [
        {value:"Such environment", weight:100},
        {value:"The dungeon", weight:100},
    ],
    "chest": [
        {value:"The {{material|adjective}} chest", weight:100},
        {value:"What looks like a chest made of {{material}}", weight:10},
    ],
    "alcove": [
        {value:"The alcove", weight:100},
        // TODO synonyms
    ]
}
const actions = {};
for(refKey of Object.keys(references)) {
    const ref = references[refKey];
    if(typeof ref == 'function') {
        actions[refKey] = ref;
    } else {
        actions[refKey] = () => ref[0].value; // TODO 0 => rnd() % length // weights
    }
}

const atmospheres = [{
    sentence: "feel",
    adjective: "gigantic"
}];

class Random{
    constructor(seed) {
        this.rnd = () => Math.floor(Math.random() * 100000);
    }
    atmosphere() {
        return atmospheres[this.rnd() % (atmospheres.length)]
    }
    smell(){

    }
    light(){

    }
    colors(){

    }
    sounds(){

    }
    size(){

    }
    height(){

    }
    ceiling(){

    }
    walls(){

    }
    exits(){

    }
    content(){

    }
    sentence(arr){
        return arr[this.rnd() % arr.length].sentence; // TODO weights
    }
}

function generateRoom(location, hash) {
    const seed = location + hash + "0";
    const random = new Random(seed);
    return {
        environment: {
            atmosphere: random.atmosphere(),
            smell: random.smell(),
            light: random.light(),
            colors: random.colors(),
            sounds: random.sounds(),
            size: random.size(),
            height: random.height(),
        },
        ceiling: random.ceiling(),
        walls: random.walls(),
        exits: random.exits(),
        content: random.content(),
        actionableContent: {
            // TODO
        },
        location,
        hash,
    }
}

const room = generateRoom("10202020","0xff45");

console.log(JSON.stringify(room, null, '  '));

function describe(room, discovery, firstTime) {
    const seed = room.location + room.hash + "1";
    var random = new Random(seed);

    const pointOfInterstOrder = ["smell", "light", "size"];
    const entranceSentence = "As you enter the room, you smell"
    const secondarySentence = "";
    const thirdSentence = "";
    const featuresDescription = "";

    
    const sentencer = Sentencer.use({
        nounList: [],
        adjectiveList: [],
        actions
    });

    const atmosphereDescription = sentencer.make(random.sentence(sentences[room.environment.atmosphere.sentence]))
    return atmosphereDescription;
}

console.log(describe(room));