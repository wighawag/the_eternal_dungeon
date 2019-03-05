package base;

class Slot<T>{
	public var func(default,null) : T -> Void;
	public var once(default,null) : Bool;
	public function new(func : T -> Void, ?once : Bool = false){
		this.func = func;
		this.once = once;
	}
}

#if !js
@:generic
#end
class Stream<T>{
	var slots : Array<Slot<T>>;
	public function new(){
		slots = new Array();
	}

	public function detachAll(){
		slots.splice(0,slots.length);
	}
	
	public function then(func : T -> Void){
		slots.push(new Slot(func));
	}
	
	public function once(func : T -> Void){
		slots.push(new Slot(func,true));
	};
	
	public function detach(func : T -> Void){
		for(i in 0...slots.length){
			if(Reflect.compareMethods(slots[i].func, func)){
				slots.splice(i,1);
				return;
			}
		}
	}
	
	public function propagate(value : T):Void{
		var i = 0;
		while(i < slots.length){
			var slot = slots[i];
			var func = slot.func;
			func(value);
			if(slot.once){
				slots.remove(slot);
			}else{
				i++;
			}
		}
	} 
	
}
