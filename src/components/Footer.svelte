<script>
  export let official = ""; 
</script>

<br>

<div class='container'>
  <div class:x={official.toLowerCase() === "official"}>____ Official Diver (Points Awarded)</div>
  <div class:x={official.toLowerCase() === "unofficial"}>____ UnOfficial Diver (No Points Awarded)</div>
</div>

<style>

  .container {
    display: flex; 
    flex-direction: column;
    justify-content: end;
    align-items: flex-end;
  }
  .container div {
    width: 400px; 
    position: relative;
    text-transform: uppercase;
  }

  .x::after {
    content: "X"; 
    position: absolute;
    top: 0px; 
    left: 0px; 
  }
</style>