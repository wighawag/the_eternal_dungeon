
const app = new App({
	target: document.body,
	props: {
		name: 'world'
	}
});

window.app = app; // useful for debugging!

class RNG{
    constructor(location, blockHash) {

    }

    randomName() {

    }
}

export function generateRoom(location, blockHash, items, monsters, challenges) {
    const rng = new RNG(location, blockHash);
    const name = rng.randomName(rng)
    const spec = {
        size: '',
        smell: {weight:100, type:'hideous'},
        light: {weight: 20, type: ''},
        walls: {weight: 1, material: {weight:2, type:''}, color: {weight: 1, type: ''}},
        ceiling: {weight: 1, material: {weight:2, type:''}, color: {weight: 1, type: ''}},
        floor: {weight: 1, material: {weight:2, type:''}, color: {weight: 1, type: ''}},
        features : [
            {
                type: 'dead bodies',
                smell: {weight: 1000, type:'smell of dead bodies'}
            },
            {
                type: 'statue',
                of: 'woman',
                position: 'center', // center | corner(nw|ne|sw|se) | ceiling | wall(n|w|e|s)
                material: {type: 'gold', color: 'red'},
                size: '' 
            },
            {
                type: 'table',
                material: {type: 'wood', color: 'blue'},
                size: ''
            },
            {
                type: 'painting',
                of: 'woman',
                material: {type: 'wood', color: 'blue'},
                size: ''
            }
        ],
        chests : [{
            trigger: 'open',
            type: 'chest',
            material: {type: 'wood', color: ''},
            size: ''
        }],
        monsters : [{
            type: 'chest',
            material: {type: 'wood', color: ''},
            size: ''
        }],
        exits: {},
    }
    return {
        scene: {
            name,
            description: [
                'The room is quite big with an impressive cross arch on the ceiling. The walls are all white. In the middle stand a statue and in the corner, you can notice a sort of box.',
            ],
            scenes: [
                {
                    name: 'look box',
                    description: ['The box is made of rock, there is what some sort of pressing mechanism'],
                    scenes: [
                        {
                            name: 'press mechanism',
                            description: [
                                'As you press the mechanism, you feel underneath like something is moving',
                                'The box is opening...',
                                'Nothing inside' // TODO remove
                            ],
                            actionIndex: 0, // transition text is description ?
                        },
                    ],
                },
                {
                    name: 'look statue',
                    description: ['The status is magnificient. it depicts a woman carrying in her a slate that she seems to read as one of her fingers touch it'],
                    scenes: [
                        {
                            name: 'touch',
                            description: ['it feels cold']
                        },
                    ],
                },
            ],
        },
    };
}

