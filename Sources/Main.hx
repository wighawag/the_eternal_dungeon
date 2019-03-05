package;

import kha.input.Mouse;
import kha.Assets;
import kha.Framebuffer;
import kha.Scheduler;
import kha.System;

import kha.math.FastMatrix3;

import xdaigeon.data.DungeonData;
import xdaigeon.data.PlayerData;

import tilesheet.TileSheet;

class Main {
	
	// static var player : PlayerData = {
	// 	room: {
	// 		x: 0,
	// 		y: 0
	// 	},
	// 	x: 0,
	// 	y: 0
	// }
	// static var playerPath : Array<{x: Int, y:Int}>;
	
	// static function update(): Void {
	// 	if(playerPath != null && playerPath.length > 0) {
	// 		var destination = playerPath[0];
	// 		var playerSpot = {
	// 			x: Std.int(player.x),
	// 			y: Std.int(player.y)
	// 		}
	// 		if(destination.x == playerSpot.x && destination.y == playerSpot.y) {
	// 			playerPath.shift();
	// 			if(playerPath.length > 0) {
	// 				destination = playerPath[0];
	// 			} else {
	// 				destination = {x: playerSpot.x, y: playerSpot.y};
	// 				playerPath = null;
	// 			}
	// 		}
	// 		if(destination.x != playerSpot.x || destination.y != playerSpot.y) {
	// 			if(player.x > destination.x) {
	// 				player.x -= 0.1;
	// 			}
	// 			if(player.x < destination.x) {
	// 				player.x += 0.1;
	// 			}
	// 			if(player.y > destination.y) {
	// 				player.y -= 0.1;
	// 			}
	// 			if(player.y < destination.y) {
	// 				player.y += 0.1;
	// 			}
	// 		}
	// 	}
	// }

	public static function main() {


		System.start({title: "Project", width: 1024, height: 768}, function (_) {
			// Just loading everything is ok for small projects
			Assets.loadEverything(function () {
				// tileSheet = new TileSheet(Assets.images.tileset, 16);
				// Mouse.get(0).notify(mouseDown, mouseUp, null, null);
			

				// Scheduler.addTimeTask(function () { update(); }, 0, 1 / 60);

				var dungeonData = new DungeonData();
				var presenter = new xdaigeon.view.Presenter(new xdaigeon.view.Dungeon(dungeonData));
				presenter.setup();

				dungeonData.addRoom(DungeonData.generateRoom(0,0));

				// Avoid passing update/render directly,
				// so replacing them via code injection works
				System.notifyOnFrames(function (frames) { presenter.render(frames); });
			});
		});
	}

	// static function mouseDown(x : Int, y : Int, button : Int) {
	// 	playerPath = [{x:0, y:1}]; // TODO path finding
	// }

	// static function mouseUp(x : Int, y : Int, button : Int) {

	// }

}
