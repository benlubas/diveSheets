<script>

  export let names = []; 

  let ref; 

  let shown = true; 

  function hide() {
    ref.style.right = "-420px"; 
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
    width: 400px; 
    background: var(--background);
    padding: 10px; 
    color: white; 
    transition: right .25s ease; 
    z-index: 21; 
    /* overflow-y: scroll; */
  }

  .row {
    display: flex; 
    padding: 5px; 
    margin: 2px; 
    border: 1px solid var(--primary); 
  }
  .num {
    margin-right: 15px; 
  }

  a {
    color: inherit; 
  }

  .hide {
    position: absolute;
    top: -25px; left: 0; 
    width: 75px; 
    height: 25px; 
    background: var(--background); 
    cursor: pointer; 
  }

  .hide::after, .hide::before {
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
		transform: translateY(2px) rotateZ(45deg); 
	}

	.hide::before {
		transform-origin: right;
		transform: rotateZ(-45deg);
	}
  .show {
    position: absolute;
    top: -25px; left: -25px; 
    width: 25px; 
    height: 75px; 
    background: var(--background); 
    cursor: pointer; 
  }

  .show::after, .show::before {
		content: ""; 
		width: 10px; 
		height: 4px; 
		background: var(--primary); 
		position: absolute;
		top: 50%; 
		left: 45%; 
    transform: translate(-50%, -50%); 
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