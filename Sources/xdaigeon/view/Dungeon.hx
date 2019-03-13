package xdaigeon.view;

import xdaigeon.view.Entity.EntityKind;
import xdaigeon.data.DungeonData;
import xdaigeon.data.RoomData;

class Dungeon {
	public var rooms(default, null) : Array<Room>;
	
	public var cameraWidth : Float;
	public var cameraHeight : Float;
	public var cameraX : Float;
	public var cameraY : Float;

	public function new(data : DungeonData) {
		this.rooms = new Array<Room>();
		for(roomLocation in data.rooms.keys()) {
			var roomData = data.rooms[roomLocation];
			addRoom(roomData);
		}
		data.roomAdded.then(addRoom);
	}

	// TODO add removeRoom
	function addRoom(roomData : RoomData) {
		var newRoom = new Room(roomData);
		newRoom.x = roomData.x * (Room.SIZE + Room.HORIZONTAL_GAP);
		newRoom.y = roomData.y * Room.SIZE;

		newRoom.north = Std.int(Math.random() * 8);
		newRoom.south = Std.int(Math.random() * 8);
		newRoom.east = Std.int(Math.random() * 7);
		newRoom.west = Std.int(Math.random() * 7);

		var entity = new Entity();
		entity.x = newRoom.x;
		entity.y = newRoom.y;
		entity.kind = EntityKind.DWARF;
		newRoom.entities.add(entity);
		
		rooms.push(newRoom);
	}

	public function getRoomContaining(x : Float, y : Float) : Room {
		var i = Std.int((x + (Room.SIZE/2)) / (Room.SIZE + Room.HORIZONTAL_GAP));
		var j = Std.int((y + (Room.SIZE/2)) / Room.SIZE);
		for(room in this.rooms) {
			if(room.data.x == i && room.data.y == j) {
				return room
			}
		}
		return null;
	}

	public function update() {

	}

}