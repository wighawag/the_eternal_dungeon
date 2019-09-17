<script>
	import Dungeon from '../components/Dungeon.svelte';
	import Adventurer from '../components/Adventurer.svelte';
</script>

<style>
.header {
  flex-shrink: 0;
}
</style>

<div class="header">
	<Adventurer/>
	<hr/>
</div>
<Dungeon/>


