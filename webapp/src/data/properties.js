export default {
    "size": {
        "list": [
            {
                "type": "big",
                "weight": 10
            },
            {
                "type": "small",
                "weight": 10
            },
            {
                "type": "huge",
                "weight": 1
            },
            {
                "type": "tiny",
                "weight": 2
            },
            {
                "type": "spacious",
                "weight": 6
            }
        ],
        "weights": [
            {"weight": 10, "value":10}
        ]
    },
    "light": {
        "list": [
            {
                "type": "dark",
                "weight": 1
            },
            {
                "type": "low",
                "weight": 10
            },
            {
                "type": "bright",
                "weight": 2
            }
        ],
        "weights": [
            {"weight": 10, "value":10}
        ]
    },
    "walls": {
        "list": [
            {
                "material": "stone", // TODO material
                "color": "white", // TODO color
                "weight": 10
            },
            {
                "material": "stone", // TODO material
                "color": "gray", // TODO color
                "weight": 10
            },
            {
                "material": "stone", // TODO material
                "color": "black", // TODO color
                "weight": 10
            },
            {
                "material": "wooden", // TODO material
                "color": "brown", // TODO color
                "weight": 10
            }
        ],
        "weights": [
            {"weight": 10, "value":10}
        ]
    },
    "ceiling": {
        "list": [
            {
                "material": "stone", // TODO material
                "color": "white", // TODO color
                "weight": 10
            }
        ],
        "weights": [
            {"weight": 10, "value":10}
        ]
    },
    "floor": {
        "list": [
            {
                "material": "stone", // TODO material
                "color": "white", // TODO color
                "weight": 10
            }
        ],
        "weights": [
            {"weight": 10, "value":10}
        ]
    },
    "features" : {
        "list": [
            {
                "type": "statue",
                "positionType": "wall",
                "position": "east",
                "weight": 10
            },
            {
                "type": "dead bodies",
                "smell": {"weight": 1000, "type":"smell of dead bodies"},
                "weight": 10
            },
            {
                "type": "statue",
                "of": "woman",
                "positionType": "grounded",
                "position": "center", // center | corner(nw|ne|sw|se) | ceiling | wall(n|w|e|s)
                "material": {"type": "gold", "color": "red"},
                "weight": 10, 
            },
            {
                "type": "table",
                "material": {"type": "wood", "color": "blue"},
                "weight": 10
            },
            {
                "type": "painting",
                "of": "soldiers",
                "material": {"type": "wood", "color": "blue"},
                "weight": 10
            }
        ],
        "weights": [
            {"weight":10, "value": 10},
            {"weight":10, "value": 100}
        ]
    },

    "smell" : {
        "list": [
            {"prefix": "smell", "data": "dead bodies", "weight":1},
            {"prefix": "no", "data": "", "weight":10},
            {"prefix": "smell", "data": "fresh air", "weight":1},
            {"prefix": "adjective", "data": "disgusting", "weight":2},
            {"prefix": "adjective", "data": "nice", "weight":1},
        ],
        "weights" : [
            {"weight":10, "value": 10},
            {"weight":1, "value":100}
        ]
    },
    "chests": {
        "list": [
            {
                "type": "chest",
                "material": "stone", // TODO material
                "weight": 10
            }
        ]
    },
    "monsters": {
        "list": [
            {
                "type": "ghost",
                "positionType": "floating",
                "weight": 10
            }
        ]
    }
}