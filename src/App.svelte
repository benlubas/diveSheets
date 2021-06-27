<script>
import DiveTableHead from "./components/DiveTableHead.svelte";

	import DiveTableRow from "./components/DiveTableRow.svelte";
import SheetHeader from "./components/SheetHeader.svelte";

</script>

<div class='header'>
	<div class='orderOfDiving'>Order of Diving</div>
<h1>
	Suburban Aquatic League 
	<br>
	Duel Meet Diving Form
</h1>
</div>

<SheetHeader name="Ben Lubas" />

<br>

<table class='tg divesTable' >
	<DiveTableHead />

	
	<DiveTableRow />
	<DiveTableRow />
	<DiveTableRow />
	<DiveTableRow />
	<DiveTableRow />
	<DiveTableRow />
	<DiveTableRow />
</table>

<style>
	h1 { 
		text-align: center;
		font-family: 'Arial'; 
		text-transform: uppercase;
		font-weight: normal
	}
	.orderOfDiving {
		position: relative;
		display: inline-block; 
		width: 20px; 
		margin-top: 30px; 
		margin-left: 110px; 
	}
	.orderOfDiving::after {
		content: "";
		padding: 35px;
		display: inline; 
		border: 1px solid black; 
		position: absolute;
		top: 0px; 
		right: 0px; 
		transform: translateX(-50%) translateY(-10px); 
	}
</style>