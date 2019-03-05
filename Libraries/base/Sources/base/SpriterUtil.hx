package base;

import spriter.EntityInstance;
import kha.graphics2.Graphics;
using base.FontUtil;
import base.Alignment;

class SpriterUtil{
	public static function boxTextLine(g2 : Graphics, x : Float,  y : Float, spriterInstance : EntityInstance, boxName : String, text : String, font : kha.Font, fontSize : Int, halign : HAlign, valign : VAlign){
		if(spriterInstance.boxNames.exists(boxName)){
			var index = spriterInstance.boxNames.get(boxName);
			var bx = spriterInstance.boxes.x(index) + x;
			var by = - spriterInstance.boxes.y(index) + y;

			//get the scale
			var bsx = spriterInstance.boxes.scaleX(index);
			var bsy = spriterInstance.boxes.scaleY(index);
			
			var tx = bx;
			var ty = by;
			switch(halign){
				case Left: 
				case Center: tx += bsx/2;
				case Right: tx += bsx;
			}
			switch(valign){
				case Top: 
				case Center: ty += bsy/2;
				case Bottom: ty += bsy;
			}
			g2.drawText(font,fontSize,text,tx,ty,halign,valign);
		}
	}

	public static function boxTextMultiLine(g2 : Graphics, x : Float,  y : Float, spriterInstance : EntityInstance, boxName : String, text : String, font : kha.Font, fontSize : Int, halign : HAlign, valign : VAlign){
		if(spriterInstance.boxNames.exists(boxName)){
			var index = spriterInstance.boxNames.get(boxName);
			var bx = spriterInstance.boxes.x(index) + x;
			var by = - spriterInstance.boxes.y(index) + y;

			//get the scale
			var bsx = spriterInstance.boxes.scaleX(index);
			var bsy = spriterInstance.boxes.scaleY(index);
			var tx = bx;
			var ty = by;
			switch(halign){
				case Left: 
				case Center: tx += bsx/2;
				case Right: tx += bsx;
			}
			switch(valign){
				case Top: 
				case Center: ty += bsy/2;
				case Bottom: ty += bsy;
			}
			g2.drawMultiLineText(font,fontSize,text,tx,ty,bsx,halign,valign);
		}
	}
}