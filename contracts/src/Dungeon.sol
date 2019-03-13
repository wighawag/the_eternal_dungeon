pragma solidity 0.5.5;

contract Dungeon {

    event RoomDiscovered(uint256 indexed location, uint256 blockNumber);
    event RoomActualised(uint256 indexed location, bytes32 blockHash);
    // event BlockActualised();

    // uint256 roomToActualise;
    
    uint256 blockToActualise;
    mapping(uint256 => bytes32) blockHashes; // TODO use contract instead
/*
   0
3     1
   2
*/
    struct Room {
        uint256 blockNumber;
        uint8 exits;
        uint8 kind;
    }


    event PlayerMoved(address indexed player, uint256 indexed oldLocation, uint256 indexed newLocation);

    mapping(address => Player) players;
    struct Player {
        uint256 location;
    }

    mapping(uint256 => Room) rooms;

    constructor() public {
        rooms[0] = Room({
            blockNumber:block.number-1,
            exits:0,
            kind:0
        });
        emit RoomDiscovered(0, block.number -1);
        actualiseBlock(block.number-1);
        actualiseRoom(0);
    }

    function actualiseBlock(uint256 blockNumber) public {
        if(blockNumber > 0 && blockNumber < block.number) {
            bytes32 blockHash = blockhash(blockNumber);
            if(uint256(blockHash) == 0) { // LAST RESORT // CHANGE THE EXPECT ROOM
                blockHash = blockhash(block.number - 1); // TODO module 256
                // does not need to save it on storage since room to actualise in the same block will be able to pickup the same value
            }
            blockHashes[blockNumber] = blockHash;
        }
    }

    function actualiseRoom(uint256 location) public {
        Room storage room = rooms[location];
        require(room.blockNumber > 0, "room not created yet");
        if(room.kind == 0) {
            bytes32 blockHash = blockHashes[room.blockNumber]; // block need to have been actualised
            // if(uint256(blockHash) == 0) {
            //     // TODO
            //     // does it change the blockNumber of the room ?
            //     // or do we simply emit an event with blockHash used ?
            // }
            require(uint256(blockHash) > 0, "block not actualised");
            uint256 random = uint256(keccak256(abi.encodePacked(location, blockHash)));
            room.exits = uint8(random % 16);
            room.kind = uint8(random % 2 + 1); // TODO ranomize for each access (probably making the entire 256 bit to a 256 bit state)
            emit RoomActualised(location, blockHash);
        }
    }

    function move(uint8 direction) external {
        actualiseBlock(blockToActualise);
        Player storage player = players[msg.sender];
        uint256 oldLocation = player.location;
        actualiseRoom(oldLocation);
        Room memory currentRoom = rooms[oldLocation]; // storage?
        uint256 x = oldLocation % 2**128;
        uint256 y = oldLocation / 2**128;
        if(direction == 0) { // north
            y--; 
        } else if(direction == 1) {
            x++;
        } else if(direction == 2) {
            y++;
        } else if(direction == 3) {
            x--;
        } else {
            revert("impossibke direction");
        }
        uint256 newLocation = y * 2**128 + x;
        Room storage nextRoom = rooms[newLocation];
        // TODO check if can move (fighting, waiting become fight)
        if( (currentRoom.exits & 2**direction) == 2**direction || (nextRoom.exits & 2**((direction +2)%3)) == 2**((direction +2)%3) ) {
            player.location = newLocation;
            if(nextRoom.blockNumber == 0) {
                nextRoom.blockNumber = block.number;
                blockToActualise = block.number;
                emit RoomDiscovered(newLocation, block.number);
            } else {
                blockToActualise = 0;
                actualiseRoom(newLocation);
            }
            emit PlayerMoved(msg.sender, oldLocation, newLocation);
        } else {
            revert("cant move this way");
        }
    }


    ///////////////// GETTERS ///////////////// 
    function getPlayer(address playerAddress) external view returns(uint256 location) {
        Player storage player = players[playerAddress];
        location = player.location;
    }


    /////////////////////  DEBUG GETTERS //////////////// // TODO REMOVE
    function debug_room(uint256 location) external view returns(uint256 blockNumber, uint8 exits, uint8 kind, uint256 ){
        Room storage room = rooms[location];
        exits = room.exits;
        kind = room.kind;
        blockNumber = room.blockNumber;
    }

}