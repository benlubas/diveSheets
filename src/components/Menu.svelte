<script>

  export let names = []; 

  let ref; 

  let shown = true; 

  function hide() {
    ref.style.right = "-400px"; 
    shown = false; 
  }
  function show() {
    ref.style.right = "20px"; 
    shown = true; 
  }

</script>

<div bind:this={ref} class="container hidePrint">
  <div class:vis={!shown} class="hide" on:click={hide}></div>
  <div class:vis={shown} class="show" on:click={show}></div>
  {#each names as name, i}
    <div class='row'>
      <div class="num">{i + 1}</div>
      <div class="link"><a href={`#${name}`} >{name}</a></div>
    </div>
  {/each}
</div>

<style>

  .vis {
    opacity: 0; 
    pointer-events: none;
  }
  .hide, .show {
    transition: opacity .25s ease; 
  }

  .container {
    position: fixed;
    top: 50px; 
    right: 20px; 
    width: 425px; 
    min-height: 75px; 
    max-height: calc(100vh - 100px); 
    /* background: var(--background); */
    padding: 10px; 
    color: white; 
    transition: right .25s ease; 
    z-index: 21; 
    border-top: 2px solid var(--primary); 
    box-sizing: border-box;
    overflow: auto; 
  }
  .container::after {
    content: ""; 
    position: absolute;
    width: calc(100% - 25px); 
    height: 100%; 
    top: 0; 
    left: 25px; 
    z-index: -1;
    background: var(--background); 
    border: 2px solid var(--primary);
    box-sizing: border-box; 
    border-top: none; 
    border-left: none; 
  }

  .container::before {
    content: ""; 
    position: absolute;
    width: 2px; 
    height: calc(100% - 73px); 
    left: 25px; 
    top: 72px; 
    background: var(--primary); 
  }

  .row {
    display: flex; 
    padding: 5px; 
    margin: 2px; 
    margin-left: 25px; 
    border: 1px solid var(--primary); 
    background: var(--background); 
  }
  .num {
    margin-right: 15px; 
  }

  a {
    color: inherit; 
  }


  .show, .hide {
    position: absolute;
    top: -2px; left: 0px; 
    width: 25px; 
    height: 75px; 
    background: var(--background); 
    cursor: pointer; 
    border: 2px solid var(--primary); 
    border-right: none; 
    box-sizing: border-box;
  }

  .hide::after, .hide::before, .show::after, .show::before {
		content: ""; 
		width: 10px; 
		height: 4px; 
		background: var(--primary); 
		position: absolute;
		top: 50%; 
		left: 45%; 
    transform: translate(-50%, -50%); 
	}
	.hide::after {
    transform-origin: right;
		transform: translate(-4px, -1px) rotateZ(45deg); 
	}

	.hide::before {
    transform-origin: right;
		transform: translate(-4px, -3px) rotateZ(-45deg);
	}

	.show::after {
		transform-origin: left;
		transform: translateY(-2px) rotateZ(45deg); 
	}

	.show::before {
		transform-origin: left;
		transform: rotateZ(-45deg);
	}
</style>