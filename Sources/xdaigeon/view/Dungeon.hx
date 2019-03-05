package xdaigeon.view;

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
		var newRoom = new Room();
		newRoom.x = roomData.x;
		newRoom.y = roomData.y;
		rooms.push(newRoom);
	}

}