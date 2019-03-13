package xdaigeon.view;

class EntityIterator {
	
	var i = 0;
	var entities : Array<Entity>;
	public function new(list : EntityList) {
		this.entities = @:privateAccess list.entities;
		this.i = 0;
		while(i < this.entities.length && this.entities[i] == null) {
			this.i++;
		}
	}

	public function hasNext() : Bool {
		return i < this.entities.length;
	}

    public function next() : Entity {
		var toReturn = i;
		i++;
		while(i < this.entities.length && this.entities[i] == null) {
			this.i++;
		}
		return this.entities[toReturn];
	}
}

@:access(xdaigeon.view.Entity)
@:allow(xdaigeon.view.EntityList.EntityIterator)
class EntityList{
	var minRemoved = -1;
	var nextIndex = 0;
	var entities : Array<Entity>;
	
	public function new(){
		entities = new Array();
		minRemoved = -1;
		nextIndex = 0;
	}
	
	public function add(entity : Entity){
		entity._index = nextIndex;
		if(entities.length > nextIndex){
			entities[nextIndex] = entity;
		}else{
			entities.push(entity);
		}
		
		nextIndex ++;
	}
	
	public function remove(entity : Entity){
		entities[entity._index] = null;
		minRemoved = (minRemoved == -1 || minRemoved > entity._index)?entity._index:minRemoved;
	}
	
	public function pack(){
		if(minRemoved != -1){
			var i = minRemoved;
			var gap = 1;
			while(i + gap < nextIndex){
				var j = i+gap;
				entities[i] = entities[j];
				if(entities[i] != null){
					entities[i]._index = i;
					entities[j] = null;
					i++;
				}else{
					gap++;
				}
				
			}
			nextIndex = nextIndex - gap;
			minRemoved = -1;
		}
	}

	public function iterator() : EntityIterator {
		return new EntityIterator(this);
	}
}
