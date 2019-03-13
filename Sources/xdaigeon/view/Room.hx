package xdaigeon.view;

import xdaigeon.data.RoomData;

class Room {
	public static inline var TILE_SIZE = 16;
	public static inline var HORIZONTAL_GAP = 5;
	public static inline var NUM_ROOM_TILES = 10;
	public static inline var SIZE = 10*16; // TODO remove

	public var entities: EntityList;
	
	public var x : Float = 0;
	public var y : Float = 0;

	public var north : Int; // 7 options
	public var south : Int; // 7 options
	public var east : Int; // 6 options
	public var west : Int; // 6 options
	
	public var data: RoomData
	public function new(data: RoomData) {
		this.data = data;
		this.entities = new EntityList();
	}
}