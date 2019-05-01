<script>
	import { dungeon, playerLocation, playerInDungeon, newAddress, playerEnergy } from './stores/dungeon.js';
	import GameScreen from './screens/GameScreen.svelte';
	import LoadingScreen from './screens/LoadingScreen.svelte';
	import ErrorScreen from './screens/ErrorScreen.svelte';
	import EnterScreen from './screens/EnterScreen.svelte';
	import WelcomeBackScreen from './screens/WelcomeBackScreen.svelte';
	import RefillScreen from './screens/RefillScreen.svelte';

	export let name;
</script>

<style>
	h1 {
		color: purple;
	}
</style>

<!-- <h1>Hello {name}!</h1> -->

<!-- <p>{JSON.stringify($loading,null,'  ')}</p> -->

<!-- <p>{$dungeon}</p> -->
<!-- <p>{$playerLocation}</p> -->

{#if $dungeon && $dungeon != "loading"}
	{#if $playerInDungeon}
		{#if $newAddress}
			<WelcomeBackScreen/>
		{:else}
			{#if $playerEnergy > 0}
				<GameScreen/>
			{:else}
				<RefillScreen/>
			{/if}
		{/if}
	{:else}
		<EnterScreen/>
	{/if}
{:else}
<LoadingScreen/>
{/if}
