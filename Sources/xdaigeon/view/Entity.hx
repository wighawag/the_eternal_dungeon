package xdaigeon.view;

import kha.graphics2.Graphics;

@:enum abstract EntityKind(Int) {
	var DWARF = 0;
}

class Entity{
	var _index : Int;
	public var x : Float;
	public var y : Float;
	public var kind : EntityKind;
	// public var render : Graphics -> Entity -> Void;

	public function new() {

	}
}