<script>
	import { dungeon, playerLocation, playerInDungeon, newAddress, playerEnergy } from './stores/dungeon.js';
	import wallet from './stores/wallet';
	import claim from './stores/claim';
	import GameScreen from './screens/GameScreen';
	import LoadingScreen from './screens/LoadingScreen';
	import DungeonLoadingScreen from './screens/DungeonLoadingScreen';
	import Web3ConnectingScreen from './screens/Web3ConnectingScreen';
	import Web3ConnectionScreen from './screens/Web3ConnectionScreen';
	import Web3RequirementScreen from './screens/Web3RequirementScreen';
	import ErrorScreen from './screens/ErrorScreen';
	import EnterScreen from './screens/EnterScreen';
	import WelcomeBackScreen from './screens/WelcomeBackScreen';
	import RefillScreen from './screens/RefillScreen';
	import ClaimScreen from './screens/ClaimScreen';
	import InvalidChainScreen from './screens/InvalidChainScreen';
	import WalletChoiceScreen from './screens/WalletChoiceScreen';
	import WalletWrapper from './components/WalletWrapper'

	export let name;
</script>

{#if $claim && $claim.status != "None"}
	<ClaimScreen />
{:else}
	<WalletWrapper>
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
			<DungeonLoadingScreen/>
		{/if}
	</WalletWrapper>
{/if}