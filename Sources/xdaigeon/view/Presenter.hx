package xdaigeon.view;

import kha.Framebuffer;
import kha.math.FastMatrix3;

import tilesheet.TileSheet;

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
	

	var dungeon : Dungeon;
	public function new(dungeon : Dungeon) {
		this.dungeon = dungeon;
	}

	var tileSheet : TileSheet;
	public function setup() {
		tileSheet = new TileSheet(kha.Assets.images.tileset, 16);
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

		var tileSize = 16;
		var roomSize = tileSize * 10;
		for(room in dungeon.rooms) {
			trace('room', room);
			var realX = room.x;
			var realY = room.y;
			var topLeftX = Std.int(realX - roomSize/2);
			var topLeftY = Std.int(realY - roomSize/2);
			
			var roomInTheNorth = false;
			//back walls
			for(i in 0...10) {
				tileSheet.drawTile(g2, BASE_TOPWALL, topLeftX + tileSize*i, topLeftY + tileSize*(-2));
				tileSheet.drawTile(g2, BASE_WALL, topLeftX + tileSize*i, topLeftY + tileSize*(-1));
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
			var roomInTheWest = false;
			for(j in 0...10) {
				tileSheet.drawTile(g2, BASE_TOPWALL_RIGHT, topLeftX + tileSize*(-1), topLeftY + tileSize*(j-1));
			}
			var roomInTheEast = false;
			for(j in 0...10) {
				tileSheet.drawTile(g2, BASE_TOPWALL_LEFT, topLeftX + tileSize*10, topLeftY + tileSize*(j-1));
			}
			
			// content
			// tileSheet.drawTile(g2, PLAYER, Std.int(player.x), Std.int(player.y));
			for(entity in room.entities) {
				if(entity.render != null) {
					entity.render(g2);
				}
			}


			var roomInTheSouth = false;
			//front_walls
			for(i in 0...10) {
				tileSheet.drawTile(g2, BASE_TOPWALL, topLeftX + tileSize*i, topLeftY + tileSize*8);
				tileSheet.drawTile(g2, BLACK, topLeftX + tileSize*i, topLeftY + tileSize*9);
				tileSheet.drawTile(g2, roomInTheSouth ? BASE_WALL : BASE_WALL_SHADOW, topLeftX + tileSize*i, topLeftY + tileSize*9);
			}
			tileSheet.drawTile(g2, roomInTheSouth ? BASE_WALL_LEFT : BASE_WALL_LEFT_SHADOW, topLeftX + tileSize*10, topLeftY + tileSize*9);
			tileSheet.drawTile(g2, roomInTheSouth ? BASE_WALL_RIGHT : BASE_WALL_RIGHT_SHADOW, topLeftX + tileSize*(-1), topLeftY + tileSize*9);
		}

/////////////////////////////////////////////
		g2.popTransformation();
		g2.end();
	}
}