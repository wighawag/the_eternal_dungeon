<script>
export let room;

import TypeWriterText from './TypeWriterText.svelte';
import { typewriter } from '../transitions';
import { room_to_room } from '../db'

let moving = false;
let moving_texts = null;
let currentStage = 0;
let room_described = false;
let roomStage = 0;
let error;

let currentScene = room.scene;
async function performChoice(choice) {
    moving = true;
    room_described = false;
    roomStage = 0;
    text_while_moving();
    const receipt = await room.act(choice)
    console.log('done', receipt);
    moving = false;
    currentScene = room.scene;
}

async function move(direction) {
    moving = true;
    room_described = false;
    roomStage = 0;
    text_while_moving();
    let receipt;
    let failed = false;
    try {
        receipt = await room.move(direction);
    } catch(e) {
        console.log('ERROR move', e);
        failed = true;
        roomStage = 999;
        room_described = true;
    }
    if(failed) {
        roomStage = 999;
        room_described = true;
    } else {
        console.log('done', receipt);
        currentScene = room.scene;
        // TODO currentScene.description.unshift('You reach into the next room');
    }
    moving = false;
}

let breadcrumb = [];
async function readScene(scene) {
    if(typeof scene.actionIndex != 'undefined') {
        moving = true;
        room_described = false;
        roomStage = 0;
        text_while_acting(scene);
        let receipt;
        let failed = false;
        try{
            await room.act(scene.actionIndex);
        } catch(e) {
            console.log('ERROR move', e);
            failed = true;
            roomStage = 999;
            room_described = true;
        }
        if(failed) {
            roomStage = 999;
            room_described = true;
        } else {
            console.log('done', receipt);
            currentScene = room.scene;
            // TODO currentScene.description.unshift('You reach into the next room');
        }
        moving = false;
    } else {
        roomStage = 0;
        breadcrumb.push(currentScene);
        room_described = false;
        currentScene = scene;
    }
}

async function backScene(scene) {
    roomStage = 999;
    currentScene = breadcrumb.pop()
}

async function text_while_moving() {
    currentStage = 0;
    moving_texts = room_to_room[Math.floor(Math.random()*room_to_room.length)];
}

async function text_while_acting(scene) {
    currentStage = 0;
    moving_texts = scene.description;
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
table {
  table-layout: fixed;
  width: 100%;
  /* border-collapse: collapse; */
  /* border: 3px solid purple; */
}
td {
    /* border: 3px solid red; */
}
td > div {
    overflow: hidden;
    height: 50px;
}
tr {
    border: 3px solid green;
}
.center {
    text-align: center;
}
</style>

<div class="content">
{#if room} <!-- description of the current room -->
    <h3>{currentScene.name}</h3>
    {#if moving_texts != null}
        <TypeWriterText texts={moving_texts} charTime=50 bind:stage={currentStage} on:done="{() => {moving_texts=null; currentStage=0;}}"/>
    {:else if moving}
        <!-- <p>...</p> -->
        <p in:typewriter="{{ charTime: 100 }}">..............................................................</p>
    {:else} 
        <TypeWriterText texts={currentScene.description} charTime=50 bind:stage={roomStage} on:nomoretext="{() => {room_described=true;}}"/>    
    <!-- <p>{room.scene.description}</p>  -->
        <!-- <p in:typewriter>{room.scene.description}</p>  -->
    {/if}
{/if}

</div>

<div class="footer">
    <hr/>
    <h3 style="visibility:{(room && !moving && moving_texts == null && room_described && ((currentScene.scenes && currentScene.scenes.length > 0) || currentScene.directions))?'visible':'hidden'}">What do you do ?</h3>
    <table style="visibility:{room?'visible':'hidden'}">
        <tr>
            <td colspan="2"><div>
                {#if room && !moving && moving_texts == null && room_described}
                    {#if currentScene.scenes && currentScene.scenes.length > 0}
                    <button on:click="{() => readScene(currentScene.scenes[0])}" >{currentScene.scenes[0].name}</button> 
                    {/if}
                {/if}
            </div></td>
            <td><div></div></td>
            <td><div></div></td>
            <td><div></div></td>

            <td>
            <div class="center">
                {#if room && currentScene == room.scene && !moving && moving_texts == null && room_described}
                <button disabled={moving || !room.directions.north} on:click="{() => move(0)}" >North</button> 
                {/if}
            </div>
            </td>
            <td><div></div></td>
        </tr>
        <tr>
            <td colspan="2"><div>
                    {#if room && !moving && moving_texts == null && room_described}
                        {#if currentScene.scenes && currentScene.scenes.length > 1}
                        <button on:click="{() => readScene(currentScene.scenes[1])}" >{currentScene.scenes[1].name}</button> 
                        {/if}
                    {/if}
                </div></td>
            <td><div></div></td>
            <td><div></div></td>
            <td>
            <div class="center">
                {#if room && currentScene == room.scene && !moving && moving_texts == null && room_described}
                <button disabled={moving || !room.directions.west} on:click="{() => move(3)}" >West</button>
                {/if}
            </div>
            </td>
            <td><div></div></td> 
            <td>
            <div class="center">
                {#if room && currentScene == room.scene && !moving && moving_texts == null && room_described}
                <button disabled={moving || !room.directions.east} on:click="{() => move(1)}" >East</button>
                {/if}
            </div>
            </td>
        </tr>
        <tr>
            <td colspan="2"><div>
                    {#if room && !moving && moving_texts == null && room_described}
                        {#if currentScene.scenes && currentScene.scenes.length > 2}
                        <button on:click="{() => readScene(currentScene.scenes[2])}" >{currentScene.scenes[2].name}</button> 
                        {/if}
                    {/if}
                </div></td>
            <td><div></div></td>
            <td><div></div></td>
            <td><div></div></td>
            <td>
            <div class="center">
                {#if room && currentScene == room.scene && !moving && moving_texts == null && room_described}
                <button disabled={moving || !room.directions.south} on:click="{() => move(2)}" >South</button>
                {/if}
            </div>
            </td>
            <td>
            <div class="center">
                {#if !moving && moving_texts == null && !room_described}
                    {#if roomStage % 2 ==0}
                        <button on:click="{() => roomStage++}" >skip</button>
                    {:else}
                        <button on:click="{() => roomStage++}" >next</button>
                    {/if}
                {/if}

                {#if !moving && room_described && currentScene != room.scene}
                    <button on:click="{() => backScene()}" >back</button>
                {/if}
                
                {#if moving_texts != null}
                    {#if currentStage % 2 ==0}
                        <button on:click="{() => currentStage++}" >skip</button>
                    {:else}
                        <button on:click="{() => currentStage++}" >next</button>
                    {/if}
                {/if}

            </div>
            </td>
        </tr>
    </table>
</div>
