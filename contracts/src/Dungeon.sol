pragma solidity 0.5.5;

contract Dungeon {

    event RoomDiscovered(uint256 indexed location, uint64 blockNumber, uint64 numRooms, uint32 numExits);
    event RoomActualised(uint256 indexed location, bytes32 blockHash);
    // event BlockActualised();

    // uint256 roomToActualise;
    
    mapping(uint256 => bytes32) blockHashes; // TODO use contract instead
/*
   0
3     1
   2
*/
    struct Room {
        uint64 blockNumber;
        uint64 numRooms;
        uint32 numExits;
        uint8 exits;
        uint8 kind;
    }

    struct Stats {
        uint64 blockToActualise;
        uint64 numRooms;
        uint32 numExits;
    }

    Stats stats;

    event PlayerMoved(address indexed player, uint256 indexed oldLocation, uint256 indexed newLocation);

    mapping(address => Player) players;
    struct Player {
        uint256 location;
    }

    mapping(uint256 => Room) rooms;

    address owner;
    constructor(address _owner) public {
        owner = _owner;
    }

    function start(uint64 blockNumber, bytes32 blockHash) external {
        require(msg.sender == owner, "only owner alllowed to start");
        Room storage room = rooms[0];
        require(room.kind == 0, "dungeon already started");

        require(blockHash == actualiseBlock(blockNumber), "blockHash do not match");
        uint64 numRooms = stats.numRooms++;
        uint32 numExits = stats.numExits;
        rooms[0] = Room({
            blockNumber: blockNumber,
            numRooms: numRooms,
            numExits: numExits,
            exits:0,
            kind:0
        });
        emit RoomDiscovered(0, blockNumber, numRooms, numExits);
        actualiseRoom(0);
    }

    function actualiseBlock(uint64 blockNumber) public returns(bytes32) {
        if(blockNumber > 0 && blockNumber < block.number) {
            bytes32 blockHash = blockhash(blockNumber);
            if(uint256(blockHash) == 0) { // LAST RESORT // CHANGE THE EXPECT ROOM
                blockHash = blockhash(block.number - 1); // TODO module 256
            }
            blockHashes[blockNumber] = blockHash;
            return blockHash;
        }
        return bytes32(0);
    }

    function sqrt(uint x) internal pure returns (uint y) {
        uint z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
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
            uint256 random = uint256(keccak256(abi.encodePacked(location, blockHash, uint8(1))));
            int8 target = int8(sqrt(room.numRooms) - room.numExits); // strictly based on data at the point of discovery // => dungeon could stop
            if(target < 0) {
                target = 0;
            }
            if(target > 4) {
                target = 4;
            }
            uint8 numExits = uint8(target) + uint8(random % 3);
            uint8 exits = 0;
            if(numExits > 4) {
                numExits = 4;
                exits = 15;
            } else if(numExits == 3){
                uint8 chosenExits = uint8(uint256(keccak256(abi.encodePacked(location, blockHash, uint8(2)))) % 4);
                exits = (chosenExits+1) * 7;
                if(exits == 21) {
                    exits = 13;
                } else if(exits == 28) {
                    exits = 11;
                }
                // 4 possibilities : 7 // 14 // 13 // 11
            } else if(numExits == 2) {
                uint8 chosenExits = uint8(uint256(keccak256(abi.encodePacked(location, blockHash, uint8(2)))) % 6);
                exits = (chosenExits+1) * 3;
                if(exits == 15) {
                    exits = 5;
                } else if(exits == 18) {
                    exits = 10;
                }
                // 3 // 6 // 9 // 12 // 5 // 10 // 
            } else if(numExits == 1){
                uint8 chosenExits = uint8(uint256(keccak256(abi.encodePacked(location, blockHash, uint8(2)))) % 4);
                exits = 2**(chosenExits+1);
            }

            room.kind = uint8(uint256(keccak256(abi.encodePacked(location, blockHash, uint8(3)))) % 2 + 1); // TODO ranomize for each access (probably making the entire 256 bit to a 256 bit state)
            room.exits = exits;
            emit RoomActualised(location, blockHash);
            uint8 closedExits = 0;
            if((exits & 2) == 2 || (rooms[location+1].exits & 8) == 8) { // east
                closedExits ++;
            }
            if((exits & 8) == 8 || (rooms[location-1].exits & 2) == 2) { // west
                closedExits ++;
            }
            uint256 y = location/(2**128);
            uint128 x = uint128(location);
            if((exits & 1) == 1 || ( rooms[(y-1)*(2**128)+x].exits & 4) == 4) { // north
                closedExits ++;
            }
            if((exits & 4) == 4 || ( rooms[(y+1)*(2**128)+x].exits & 1) == 1) { // south
                closedExits ++;
            }
            stats.numExits += numExits - closedExits;
        }
    }

    function move(uint8 direction) external {
        actualiseBlock(stats.blockToActualise);
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
        if( (currentRoom.exits & 2**direction) == 2**direction || (nextRoom.exits & 2**((direction +2)%4)) == 2**((direction +2)%4) ) {
            player.location = newLocation;
            if(nextRoom.blockNumber == 0) {
                uint64 numRooms = stats.numRooms;
                uint32 numExits = stats.numExits;
                nextRoom.blockNumber = uint64(block.number);
                stats = Stats({
                    blockToActualise: uint64(block.number),
                    numRooms: numRooms+1,
                    numExits:numExits
                });
                emit RoomDiscovered(newLocation, uint64(block.number), numRooms, numExits);
            } else {
                stats.blockToActualise = 0;
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