<script>
import TypeWriterText from './TypeWriterText.svelte';
import {pause} from '../utils/time';
import { room_description, choices, dungeon  } from '../stores/dungeon';
import { typewriter } from '../transitions';
import { room_to_room } from '../db'
const utils = $dungeon.utils;
let moving = false;
let moving_texts = null;
let currentStage = 0;
let room_described = false;
let roomStage = 0;
async function performChoice(choice) {
    moving = true;
    room_described = false;
    roomStage = 0;
    text_while_moving();
    const receipt = await choice.perform().then(utils.waitReceipt);
    await $dungeon.once('block', (block) => block >= receipt.blockNumber);
    console.log('done', receipt);
    moving = false;
}

async function text_while_moving() {
    currentStage = 0;
    moving_texts = room_to_room[Math.floor(Math.random()*room_to_room.length)];
}
</script>

<style>
:global(body), :global(html) {
    height:100%;
    min-height:100%;
}
:global(body) {
    display: flex;
    flex-direction: column;
}

.content {
  flex: 1 0 auto;
}
.footer {
  flex-shrink: 0;
}
</style>

<div class="content">
{#if $room_description} <!-- description of the current room -->
    <h3>Room xxx</h3>
    {#if moving_texts != null}
        <TypeWriterText texts={moving_texts} charTime=50 bind:stage={currentStage} on:done="{() => {moving_texts=null; currentStage=0;}}"/>
    {:else if moving}
        <!-- <p>...</p> -->
        <p in:typewriter="{{ charTime: 100 }}">..............................................................</p>
    {:else} 
        <TypeWriterText texts={[$room_description]} charTime=50 bind:stage={roomStage} on:nomoretext="{() => {room_described=true;}}"/>    
    <!-- <p>{$room_description}</p>  -->
        <!-- <p in:typewriter>{$room_description}</p>  -->
    {/if}
{/if}

</div>

<div class="footer">
<hr/>
{#if !moving && moving_texts == null}
    {#if room_described}
        <h3>What do you do ?</h3>
        <p>
        {#if $choices} <!-- action player can make , nove north, attack monsters, open chest ... -->
            {#each $choices as choice}
                <button disabled={moving} on:click="{() => performChoice(choice)}" >{choice.name}</button>
            {:else}
                You are stuck.
            {/each}
        {/if}
        </p>
    {:else}
        <h3>&nbsp;</h3>
        <p>
        <button on:click="{() => roomStage++}" >skip</button>        
        </p>
    {/if}
{:else if moving_texts != null}
    <h3>&nbsp;</h3>
    <p>
    {#if currentStage % 2 ==0}
        <button on:click="{() => currentStage++}" >skip</button>
    {:else}
        <button on:click="{() => currentStage++}" >next</button>
    {/if}
    </p>
{:else}
<h3>&nbsp;</h3>
<p>
        <button style="visibility: hidden" >next</button>
</p>
{/if}
</div>