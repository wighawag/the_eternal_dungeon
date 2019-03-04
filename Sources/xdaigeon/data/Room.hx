package xdaigeon.data;

typedef Exits = {
	var east: Bool;
	var west: Bool;
	var north: Bool;
	var south:Bool;
}

typedef Room = {
	var isCorridor: Bool;
	var x: Int;
	var y: Int;
	var exits: Exits;
};
