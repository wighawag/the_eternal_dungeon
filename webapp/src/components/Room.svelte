<script>
import TypeWriterText from './TypeWriterText.svelte';
import {pause} from '../utils/time';
import { room_description, choices, dungeon  } from '../stores/dungeon';
import { typewriter } from '../transitions';
const utils = $dungeon.utils;
let moving = false;
let moving_texts = null;
let currentStage = 0;
let room_described = false;
let roomStage = 0;
async function performChoice(choice) {
    moving = true;
    room_described = false;
    text_while_moving();
    const receipt = await choice.perform().then(utils.waitReceipt);
    await $dungeon.once('block', (block) => block >= receipt.blockNumber);
    console.log('done', receipt);
    moving = false;
}

async function text_while_moving() {
    moving_texts = ["you are walking...", "you stumble upon..."];
}
</script>


{#if $room_description} <!-- description of the current room -->
    <h3>Room xxx</h3>
    {#if moving_texts != null}
        <TypeWriterText texts={moving_texts} charTime=50 bind:stage={currentStage} on:done="{() => {moving_texts=null; currentStage=0;}}"/>
        <button on:click="{() => currentStage++}" >next</button>
    {:else if moving}
        <!-- <p>...</p> -->
        <p in:typewriter="{{ charTime: 100 }}">..............................................................</p>
    {:else} 
        <TypeWriterText texts={[$room_description]} charTime=50 bind:stage={roomStage} on:nomoretext="{() => {room_described=true;}}"/>    
    <!-- <p>{$room_description}</p>  -->
        <!-- <p in:typewriter>{$room_description}</p>  -->
    {/if}
{/if}


<hr/>

{#if !moving && moving_texts == null && room_described}
    {#if $choices} <!-- action player can make , nove north, attack monsters, open chest ... -->
        <h3>What do you do ?</h3>
        <p>
        {#each $choices as choice}
            <button disabled={moving} on:click="{() => performChoice(choice)}" >{choice.name}</button>
        {:else}
            You are stucked.
        {/each}
        </p>
    {/if}
{/if}
