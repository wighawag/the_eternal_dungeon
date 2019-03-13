package tilesheet;

class TileSheet {

	var numTilesInWidth : Int;
	var image: kha.Image;
	var size : Int;
	public function new(image: kha.Image, size: Int) {
		this.size = size;
		this.image = image;
		this.numTilesInWidth = Std.int(image.width / size);
	}
	public function drawTile(g2 : kha.graphics2.Graphics, i : Int, x: Float, y: Float) {
		var sx : Int = (i % numTilesInWidth) * size;
		var sy : Int = Std.int(i / numTilesInWidth) * size;
		g2.drawSubImage(image, x, y, sx, sy, size, size);
	}
}