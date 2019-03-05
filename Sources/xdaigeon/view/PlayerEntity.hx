package xdaigeon.view;

import xdaigeon.data.PlayerData;

class PlayerEntity extends Entity{
	public function new(playerData : PlayerData) {
		// TODO playerData.onActionTriggered(respondToAction);
		initWithData(playerData);
	}

	function initWithData(playerData : PlayerData) {
		// TODO
	}

	function respondToAction(action) {
		// TODO find path to action and move there
	}
}
