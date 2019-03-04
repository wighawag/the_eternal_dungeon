package xdaigeon.data;

class Dungeon {
	public static function generateRoom(x : Int, y : Int) : Room {
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

	public static inline function idOfRoom(room : Room) : String {
		return idOfLocation(room.x, room.y);
	}

	public static inline function idOfLocation(x: Int, y: Int) : String {
		return "" + x + "," + y;
	}

	public var rooms = new Map<String,Room>();
	public function new() {

	}

	public function addRoom(room: Room) {
		rooms[idOfRoom(room)] = room;
	}

	public function getRoomsAround(x: Int, y: Int, radius: Int) : Array<Room> { // sorted in reverse y order
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