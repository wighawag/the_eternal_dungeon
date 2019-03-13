package;

import xdaigeon.view.Presenter.Action;
import kha.Assets;
import kha.Scheduler;
import kha.System;

import xdaigeon.data.DungeonData;

class Main {
	
	public static function main() {


		System.start({title: "Project", width: 1024, height: 768}, function (_) {
			// Just loading everything is ok for small projects
			Assets.loadEverything(function () {
				var dungeonData = new DungeonData();
				var dungeon = new xdaigeon.view.Dungeon(dungeonData);
				var presenter = new xdaigeon.view.Presenter(dungeon);
				presenter.setup();

				dungeonData.addRoom(DungeonData.generateRoom(0,0));
				dungeonData.addRoom(DungeonData.generateRoom(-1,0));
				dungeonData.addRoom(DungeonData.generateRoom(1,0));
				dungeonData.addRoom(DungeonData.generateRoom(0,1));

				presenter.actionPerformed.then(function(action: Action) {
					var room = dungeon.getRoomContaining(action.x, action.y);
					dungeonData.player.roomData = room.data;
					// dungeonData.player.pending = txHash;
					// dungeonData.player.blockNumber = blockNumber;
					// if(room)
				});

				// Avoid passing update/render directly,
				// so replacing them via code injection works
				System.notifyOnFrames(function (frames) { presenter.render(frames); });
				Scheduler.addTimeTask(function () { dungeon.update(); }, 0, 1 / 60);
			});
		});
	}

}
