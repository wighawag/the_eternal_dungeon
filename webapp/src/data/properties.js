export default {
    "sizes": {
        "list": [
            {
                "type": "big",
                "weight": 10
            }
        ],
        "weights": [
            {"weight": 10, "value":10}
        ]
    },
    "lights": {
        "list": [
            {
                "type": "dark",
                "weight": 10
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
            }
        ],
        "weights": [
            {"weight": 10, "value":10}
        ]
    },
    "ceilings": {
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
    "floors": {
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
                "positionType": "grounded",
                "weight": 10
            },
            {
                "type": "statue",
                "positionType": "wall",
                "position": "east",
                "weight": 10
            },
            {
                "type": "statue",
                "weight": 10
            },
            {
                "type": "statue",
                "weight": 10
            },
            {
                "type": "statue",
                "weight": 10
            }
        ],
        "weights": [
            {"weight":10, "value": 10},
            {"weight":10, "value": 100}
        ]
    },

    "smells" : {
        "list": [
            {"prefix": "smell", "data": "dead bodies"},
            {"prefix": "no", "data": ""},
            {"prefix": "smell", "data": "fresh air"},
            {"prefix": "adjective", "data": "disgusting"},
            {"prefix": "adjective", "data": "nice"},
            "fermented",
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