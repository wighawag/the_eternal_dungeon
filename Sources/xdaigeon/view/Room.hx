package xdaigeon.view;

class Room {
	public var entities: EntityList;
	
	public var x : Float;
	public var y : Float;
	
	public function new() {
		this.entities = new EntityList();
	}
}