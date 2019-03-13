package xdaigeon.view;

import base.Stream;
import kha.System;
import xdaigeon.view.Entity.EntityKind;
import kha.input.Mouse;
import kha.Framebuffer;
import kha.math.FastMatrix3;

import tilesheet.TileSheet;

// typedef Action = {
// 	var type: String;
// 	var x : Float;
// 	var y : Float;
// }

typedef Action = {
	var type: String;
	var room: Room;
	var tileX: Int;
	var tileY: Int;
}

class Presenter {
	static inline var BASE_FLOOR = 370;
	static inline var BASE_WALL = 17;
	static inline var BASE_TOPWALL = 1;
	static inline var BLACK = 100;
	static inline var BASE_WALL_SHADOW = 321;
	static inline var BASE_WALL_RIGHT_SHADOW = 320;
	static inline var BASE_WALL_LEFT_SHADOW = 324;
	static inline var BASE_TOPWALL_RIGHT = 272;
	static inline var BASE_TOPWALL_LEFT = 274;
	static inline var BASE_TOPWALL_RIGHT_CORNER = 256;
	static inline var BASE_TOPWALL_LEFT_CORNER = 258;
	static inline var BASE_WALL_RIGHT = 304;
	static inline var BASE_WALL_LEFT = 306;
	static inline var PLAYER = 248;
	
	public var actionPerformed : Stream<Action> = new Stream();

	var dungeon : Dungeon;
	public function new(dungeon : Dungeon) {
		this.dungeon = dungeon;
	}

	var tileSheet : TileSheet;
	public function setup() {
		tileSheet = new TileSheet(kha.Assets.images.tileset, 16);
		Mouse.get(0).notify(mouseDown, mouseUp, null, null);
	}

	var lastDown : {
		x: Float,
		y: Float,
		time: Float
	};
	function mouseDown(x : Int, y : Int, button : Int) {
		if(button == 0) {
			lastDown = {
				x: x,
				y: y,
				time: System.time
			};
		}
		
	}

	function mouseUp(x : Int, y : Int, button : Int) {
		if(lastDown != null) {
			if(System.time - lastDown.time < 0.3) {
				actionPerformed.propagate({
					type: "click",
					// x: lastDown.x,
					// y: lastDown.y
				});
			}
			lastDown = null;
		}
	}

	public function render(frames: Array<Framebuffer>) : Void {
		var framebuffer = frames[0];
		var g2 = framebuffer.g2;

		g2.begin(true, 0x0000000);
		g2.imageScaleQuality = kha.graphics2.ImageScaleQuality.Low;
		var frameWidth : Float = framebuffer.width;
		var frameHeight : Float  = framebuffer.height;
		var trans = FastMatrix3.translation(frameWidth/2,frameHeight/2).multmat(FastMatrix3.scale(2,2));
		g2.pushTransformation(trans);
/////////////////////////////////////////////


		var tileSize = Room.TILE_SIZE;
		var roomSize = Room.SIZE;
		for(room in dungeon.rooms) {
			trace('room', room);
			var realX = room.x;
			var realY = room.y;
			var topLeftX = Std.int(realX - roomSize/2);
			var topLeftY = Std.int(realY - roomSize/2);
			
			//back walls
			for(i in 0...10) {
				if(room.north > 0 && (i == room.north || i == room.north +1)) {
					tileSheet.drawTile(g2, BASE_FLOOR, topLeftX + tileSize*i, topLeftY + tileSize*(-1));
					// TODO shadow
				} else {
					tileSheet.drawTile(g2, BASE_TOPWALL, topLeftX + tileSize*i, topLeftY + tileSize*(-2));
					tileSheet.drawTile(g2, BASE_WALL, topLeftX + tileSize*i, topLeftY + tileSize*(-1));
				}
			}
			tileSheet.drawTile(g2, BASE_TOPWALL_RIGHT_CORNER, topLeftX + tileSize*(-1), topLeftY + tileSize*(-2));
			tileSheet.drawTile(g2, BASE_TOPWALL_LEFT_CORNER, topLeftX + tileSize*10, topLeftY + tileSize*(-2));
			

			// floor
			for(i in 0...10) {
				for(j in 0...10) {
					tileSheet.drawTile(g2, BASE_FLOOR, topLeftX + tileSize*i, topLeftY + tileSize*j);
				}
			}

			// side walls
			for(j in 0...10) {
				if(room.west > 0 && (j == room.west || j == room.west +1)) {
					tileSheet.drawTile(g2, BASE_FLOOR, topLeftX + tileSize*(-1), topLeftY + tileSize*(j-1));
					// TODO shadow
				} else {
					tileSheet.drawTile(g2, BASE_TOPWALL_RIGHT, topLeftX + tileSize*(-1), topLeftY + tileSize*(j-1));
				}
				
			}
			
			for(j in 0...10) {
				if(room.east > 0 && (j == room.east || j == room.east +1)) {
					tileSheet.drawTile(g2, BASE_FLOOR, topLeftX + tileSize*10, topLeftY + tileSize*(j-1));
					// TODO shadow
				} else {
					tileSheet.drawTile(g2, BASE_TOPWALL_LEFT, topLeftX + tileSize*10, topLeftY + tileSize*(j-1));
				}
			}
			
			// content
			// tileSheet.drawTile(g2, PLAYER, Std.int(player.x), Std.int(player.y));
			for(entity in room.entities) {
				// if(entity.render != null) {
				// 	entity.render(g2);
				// }
				if(entity.kind == EntityKind.DWARF) {
					tileSheet.drawTile(g2, PLAYER, entity.x, entity.y);
				}
			}


			var roomInTheSouth = room.south > 0;
			//front_walls
			for(i in 0...10) {
				if(room.south > 0 && (i == room.south || i == room.south +1)) {
					tileSheet.drawTile(g2, BASE_FLOOR, topLeftX + tileSize*i, topLeftY + tileSize*10);
					// TODO shadow
				} else {
					tileSheet.drawTile(g2, BASE_TOPWALL, topLeftX + tileSize*i, topLeftY + tileSize*8);
					tileSheet.drawTile(g2, BLACK, topLeftX + tileSize*i, topLeftY + tileSize*9);
					tileSheet.drawTile(g2, roomInTheSouth ? BASE_WALL : BASE_WALL_SHADOW, topLeftX + tileSize*i, topLeftY + tileSize*9);
				}
			}
			tileSheet.drawTile(g2, roomInTheSouth ? BASE_WALL_LEFT : BASE_WALL_LEFT_SHADOW, topLeftX + tileSize*10, topLeftY + tileSize*9);
			tileSheet.drawTile(g2, roomInTheSouth ? BASE_WALL_RIGHT : BASE_WALL_RIGHT_SHADOW, topLeftX + tileSize*(-1), topLeftY + tileSize*9);
		}

/////////////////////////////////////////////
		g2.popTransformation();
		g2.end();
	}
}