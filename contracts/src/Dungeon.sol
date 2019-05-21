pragma solidity 0.5.5;

contract Dungeon {

    uint256 private constant MIN_BALANCE = 5000000000000000; // TODO

    event RoomDiscovered(uint256 indexed location, uint64 blockNumber, uint64 numRooms, uint32 numExits);
    event RoomActualised(uint256 indexed location, bytes32 blockHash, uint8 exits, uint8 kind, uint64 numRooms, uint32 numExits); // TODO remve exits and kind and room.numRooms and room.numExits
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
        bool inDungeon;
        uint256 energy;
        uint256 location;
    }
    mapping(address => address) delegates;

    mapping(uint256 => Room) rooms;

    address owner;
    constructor(address _owner) public {
        owner = _owner;
    }

    modifier withCorrectSender(address sender) {
        if(msg.sender != sender) {
            require(delegates[msg.sender] == sender);
            if(msg.sender.balance < MIN_BALANCE) {
                uint256 balanceToGive = MIN_BALANCE - msg.sender.balance; // TODO consider gasleft()
                Player storage player = players[sender];
                uint256 energy = player.energy;
                if(balanceToGive > energy) {
                    balanceToGive = energy;
                }
                if(balanceToGive  > 0) {
                    player.energy = energy - balanceToGive;
                    msg.sender.transfer(balanceToGive);
                }
            }
        }
        _;
    }

    function isDelegateFor(address delegate, address player) external returns (bool) {
        return delegates[delegate] == player;
    }

    function refill() public payable {
        require(players[msg.sender].inDungeon, "not in dungeon");
        _refill(msg.value);
    }

    function _refill(uint256 value) internal {
        players[msg.sender].energy += value;
    }

    function join(address payable _newDelegate) external payable {
        require(!players[msg.sender].inDungeon, "already in dungeon");
        players[msg.sender].inDungeon = true;
        
        if(_newDelegate != address(0)) {
            _refill(msg.value - MIN_BALANCE);
            _addDelegate(_newDelegate);
        } else {
            // can play without energy ? // TODO remove
        }
    }

    function quit() external {
        require(players[msg.sender].inDungeon, "not in dungeon");
        uint256 energy = players[msg.sender].energy;
        require(energy > 0, "no energy left");
        players[msg.sender].energy = 0;
        players[msg.sender].inDungeon = false;
        msg.sender.transfer(energy);
    }

    // TODO add Events for Delegates
    function addDelegate(address payable _delegate) public payable {
        require(players[msg.sender].inDungeon, "not in dungeon");
        if(msg.value > 0) {
            _refill(msg.value);
        }
        _addDelegate(_delegate);
    }
    function _addDelegate(address payable _delegate) public payable {
        require(_delegate != address(0), "no zero address delegate");
        require(players[msg.sender].energy >= MIN_BALANCE, "not enought energy");
        players[msg.sender].energy -= MIN_BALANCE;
        _delegate.transfer(MIN_BALANCE);
        delegates[_delegate] = msg.sender;
    }
    function removeDelegate(address _delegate) public {
        delegates[_delegate] = address(0);
    }

    function start(uint64 blockNumber, bytes32 blockHash) external {
        require(msg.sender == owner, "only owner alllowed to start");
        Room storage room = rooms[0];
        require(room.kind == 0, "dungeon already started"); // TODO allow start anywhere (with random chance of not going anywhere ?)
        emit RoomDiscovered(0, blockNumber, 0, 0);
        rooms[0] = Room({
            blockNumber: blockNumber,
            numRooms: 0,
            numExits: 0,
            exits:0,
            kind:0
        });
        require(blockHash == actualiseBlock(blockNumber), "blockHash do not match");
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

    function sqrt(uint x) internal pure returns (uint y) { // compute worst case (high numnber of rooms)
        uint z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }

    event Debug(uint256 location, int256 target, uint256 random);
    // TODO make it internal and pure
    function generateExits(uint256 location, bytes32 blockHash, uint256 numRoomsAtDiscovery, uint256 numExitsAtDiscovery) public /*TODO pure*/ returns(uint8, uint8) {
        int256 target =  int256((2 + sqrt(numRoomsAtDiscovery)) - numExitsAtDiscovery); // strictly based on data at the point of discovery // => dungeon could stop
        if(target < 1) {
            target = 1;
        }
        if(target > 3) {
            target = 3;
        }
        uint256 random = uint256(keccak256(abi.encodePacked(location, blockHash, uint8(1))));
        emit Debug(location, target, random);
        int8 numExits = int8(target-1 + uint8(random % 3));
        if(numExits < 0) {
            numExits = 0;
        }
        uint8 exits = 0;
        if(numExits >= 4) {
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
            exits = 2**chosenExits;
        }
        return (exits, uint8(numExits));
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
            (uint8 exits, uint8 numExits) = generateExits(location, blockHash, room.numRooms, room.numExits);
            
            room.kind = uint8(uint256(keccak256(abi.encodePacked(location, blockHash, uint8(3)))) % 2 + 1); // TODO ranomize for each access (probably making the entire 256 bit to a 256 bit state)
            room.exits = exits;
            
            emit RoomActualised(location, blockHash, exits, room.kind, room.numRooms, room.numExits);
            uint8 closedExits = 0;
            if(rooms[location+1].kind > 0) {
                if((exits & 2) == 2) {
                    closedExits ++;
                }
                if((rooms[location+1].exits & 8) == 8) { // east
                    closedExits ++;
                }
            }
            if(rooms[location-1].kind > 0) {
                if((exits & 8) == 8) {
                    closedExits ++;
                }
                if((rooms[location-1].exits & 2) == 2) { // west
                    closedExits ++;
                }
            }
            uint256 y = location/(2**128);
            uint128 x = uint128(location);
            if(rooms[(y-1)*(2**128)+x].kind > 0) {
                if((exits & 1) == 1) {
                    closedExits ++;
                }
                if((rooms[(y-1)*(2**128)+x].exits & 4) == 4) { // north
                    closedExits ++;
                }
            }
            if(rooms[(y+1)*(2**128)+x].kind > 0) {
                if((exits & 1) == 1) {
                    closedExits ++;
                }
                if((rooms[(y+1)*(2**128)+x].exits & 4) == 4) { // south
                    closedExits ++;
                }
            }
            stats.numExits += numExits;
            stats.numExits -= closedExits;
            stats.numRooms++;
        }
    }

    function move(address sender, uint8 direction) external withCorrectSender(sender) {
        actualiseBlock(stats.blockToActualise);
        Player storage player = players[sender];
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
                nextRoom.blockNumber = uint64(block.number);
                nextRoom.numRooms = stats.numRooms;
                nextRoom.numExits = stats.numExits;
                stats.blockToActualise = uint64(block.number);
                emit RoomDiscovered(newLocation, uint64(block.number), nextRoom.numRooms, nextRoom.numExits);
            } else {
                stats.blockToActualise = 0;
                actualiseRoom(newLocation);
            }
            emit PlayerMoved(sender, oldLocation, newLocation);
        } else {
            revert("cant move this way");
        }
    }


    ///////////////// GETTERS ///////////////// 
    function getPlayer(address playerAddress) external view returns(uint256 location, uint256 energy, bool inDungeon) {
        Player storage player = players[playerAddress];
        location = player.location;
        energy = player.energy;
        inDungeon = player.inDungeon;
    }


    /////////////////////  DEBUG GETTERS //////////////// // TODO REMOVE
    function debug_room(uint256 location) external view returns(uint256 blockNumber, uint8 exits, uint8 kind, uint256, uint64 numRooms, uint32 numExits){
        Room storage room = rooms[location];
        exits = room.exits;
        kind = room.kind;
        blockNumber = room.blockNumber;
        numRooms = room.numRooms;
        numExits = room.numExits;
    }
    
}