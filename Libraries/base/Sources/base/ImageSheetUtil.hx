package base;

import kha.graphics2.Graphics;

import imagesheet.ImageSheet;

class ImageSheetUtil{
	public static function drawImageSheetSubImage(g2 : Graphics, subImage : SubImage,x : Float, y : Float, scaleX : Float, scaleY : Float){
		var offsetX = subImage.offsetX;
		var offsetY = subImage.offsetY;
		
		// var width = subImage.originalWidth;
		// var height = subImage.originalHeight;
		var originX = - offsetX;
		var originY = - offsetY;
		// if(subImage.rotated){
		// 	var tmp = originX;
		// 	originX = pivotY * height - (height - subImage.height - offsetY);
		// 	originY = pivotX * width - offsetX;
		// }
		
		var subWidth = subImage.width;
		var subHeight = subImage.height;
		// if(subImage.rotated){
		// 	subWidth = subHeight;
		// 	subHeight = subImage.width;
		// }
		
		// g2.pushTransformation(g2.transformation.multmat(kha.math.FastMatrix3.scale(scaleX,scaleY)));
		g2.drawScaledSubImage(subImage.image, subImage.x, subImage.y, subWidth, subHeight,x,y,subWidth*scaleX, subHeight*scaleY);
		// g2.popTransformation();
			
	}
}