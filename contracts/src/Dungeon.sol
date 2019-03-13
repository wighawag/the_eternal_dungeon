pragma solidity 0.5.2;

contract Dungeon {

    event RoomDiscovered(uint256 room, uint256 blockNumber);
    // event BlockActualised();

    mapping(uint256 => bytes32) blockHashes; // TODO use contract instead

    struct Room {
        uint256 kind; // corridor or room ?
        uint256 blockNumber;
        bytes32 data;

        address firstPlayer;
        Encounter encounter;
        Search search;
    }

    struct Treasure {
        uint256 blockNumber;
        bytes32 data;
    }

    struct Search {
        uint256 blockNumber;
        bytes32 data;
    }

    struct Quest {
        uint256 blockNumber;
        bytes32 data;
    }

    struct Encounter {
        uint256 blockNumber;
        bytes32 data;
        Quest quest;
        Treasure treasure;
    }

    // event Player(address indexed account, string name);
    mapping(string => Player) playerByName; 

    mapping(address => Player) players;
    struct Player {
        string name; // reverse lookup
        uint256 location;
    }

    mapping(uint256 => Room) rooms;


    constructor() public {

    }

    function move(uint8 direction) external {
        Player player = players[msg.sender];
        Room currentRoom = rooms[player.location];
        // TODO check if can move (fighting, waiting become fight)
        uint256 newLocation = player.location _ direction;
        Room nextRoom = rooms[newLocation];
        if(currentRoom.exit mask direction || nextRoom.exit mask reverseDirection) {

        } else {
            throw;
        }
    }

    function wait() external {
        
    }

    function fight() external {

    }

    function bribe() external {

    }

    function solvePuzzle() external{
        
    }

    function craft() external {

    }

    function use() external {

    }
}