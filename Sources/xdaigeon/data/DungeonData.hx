package xdaigeon.data;

import base.Stream;

class DungeonData {
	public static function generateRoom(x : Int, y : Int) : RoomData {
		return {
			isCorridor: false,//Math.random,
			x: x,
			y: x,
			exits: {
				east: Math.random() > 0.5,
				west: Math.random() > 0.5,
				north: Math.random() > 0.5,
				south: Math.random() > 0.5
			}
		};
	}

	public static inline function idOfRoom(room : RoomData) : String {
		return idOfLocation(room.x, room.y);
	}

	public static inline function idOfLocation(x: Int, y: Int) : String {
		return "" + x + "," + y;
	}

	public var rooms = new Map<String,RoomData>();
	public function new() {

	}

	public var roomAdded : Stream<RoomData> = new Stream<RoomData>();

	public function addRoom(room: RoomData) {
		rooms[idOfRoom(room)] = room;
		roomAdded.propagate(room);
	}

	public function getRoomsAround(x: Int, y: Int, radius: Int) : Array<RoomData> { // sorted in reverse y order
		// TODO 
		return [{
			isCorridor: false,
			x:x,
			y:y,
			exits: {
				north: true,
				east: false,
				west: false,
				south: false
			}
		}];
	}

}