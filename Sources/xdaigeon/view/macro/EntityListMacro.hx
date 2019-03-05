package xdaigeon.view.macro;

import haxe.macro.Expr;

class EntityListMacro{

	static function isNull(expr : Expr){
		return switch(expr.expr){
			case EConst(c):
				switch(c){
					case CIdent(s):
						if(s=="null"){
							true;
						}else{
							false;
						}
					default: false;
				}
			default: false;
		}
	}

	macro public static function iterate(list : ExprOf<xdaigeon.view.EntityList>, ident : Expr, conditions : Expr, ?operations : Expr) : Expr{
		if(isNull(operations)){
			operations = conditions;
			conditions = macro true;
		}
		
		return macro {for($e{ident} in @:privateAccess $e{list}.entities){
			if($e{ident} == null){continue;}
			if(!($e{conditions})){continue;}
			$e{operations};
		}};
	}
}
