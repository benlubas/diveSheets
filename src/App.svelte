<script>
	import DivingSheet from "./components/DivingSheet.svelte";
	import Papa from "papaparse"; 
	

	let meetName = "PlyMar vs. "; 
	let club = "Ply-Mar"; 
	let site = "Ply-Mar";
	let date = new Date(); 

	$: headerData = {
		meetName, club, site, date
	}

	let data = [{
		Age_Group: "19-22", 
		Dive_1: "101A", 
		Dive_2: "103B", 
		Dive_3: "204B", 
		Dive_4: "5132D", 
		Dive_5: "302C", 
		Dive_6: "402C", 
		Gender: "male", 
		Name: "Ben Lubas", 
		Official_Unofficial: "Unofficial",
	}];

	//TODO: finish; 
	function parseData() {
		this.files[0]; 

		Papa.parse(this.files[0], {
			header: true,
			complete: function(res, file) {
				data = res.data; 
			}
		});
	}



	// This is going to come from a table. 
	let diverData = {
		isMale: true, 
		name: "Ben Lubas", 
		ageGroup: "18-22", 
	}

</script>

<div class="hidePrint">
	<div class="form-group">
		<div class='input-group'>
			<span>Meet: </span>
			<input type="text" bind:value={meetName} />
		</div>

		<div class='input-group'>
			<span>Club: </span>
			<input type="text" bind:value={club} />
		</div>

		<div class='input-group'>
			<span>Location: </span>
			<input type="text" bind:value={site} />
		</div>

		<div class='input-group'>
			<span>Date: </span>
			<input type="date" bind:value={date} />
		</div>

		<div class='input-group'>
			<span>Data: </span>
			<input type="file" on:change={parseData} />
		</div>


	</div>
  <br>
	<hr>
	<br>
</div>


{#if data == undefined}
  <DivingSheet {headerData} {diverData} />
{:else}
	{#each data as row}
		{#if row.Age_Group !== ""}
		  <DivingSheet {headerData} {...row} />
		{/if}
	{/each}
{/if}

<style>
	.input-group {
		display: flex; 
		justify-content: space-between;
		max-width: 300px; 
		margin: 3px; 
		font-size: 1.5rem; 
	}
</style>