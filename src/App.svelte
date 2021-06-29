<script>
  import DivingSheet from "./components/DivingSheet.svelte";
  import Papa from "papaparse";
  import Menu from "./components/Menu.svelte";

  let meetName = "PlyMar vs. ";
  let club = "Ply-Mar";
  let site = "Ply-Mar";
  let date = new Date();

  $: headerData = {
    meetName,
    club,
    site,
    date,
  };

  let data = [
    {
      Age_Group: "19-22",
      Dive_1: "100A",
      Dive_2: "102B",
      Dive_3: "204B",
      Dive_4: "5132D",
      Dive_5: "302C",
      Dive_6: "402C",
      Dive_7: "402C",
      Dive_8: "402C",
      Gender: "male",
      Name: "Ben Lubas",
      Official_Unofficial: "Unofficial",
    },
  ];

  $: names = data.map((val) => val.Name).filter((val) => val !== undefined);

  function parseData() {
    this.files[0];

    Papa.parse(this.files[0], {
      header: true,
      complete: function (res, file) {
        console.log(res.data);
        data = res.data;

        console.log(data);
      },
    });
  }

  let selectAll = true;
</script>

<div id="top" class="hidePrint">
  <div class="form-group">
    <div class="input-group">
      <span>Meet: </span>
      <input type="text" bind:value={meetName} />
    </div>

    <div class="input-group">
      <span>Club: </span>
      <input type="text" bind:value={club} />
    </div>

    <div class="input-group">
      <span>Location: </span>
      <input type="text" bind:value={site} />
    </div>

    <div class="input-group">
      <span>Date: </span>
      <input type="date" bind:value={date} />
    </div>

    <div class="input-group">
      <span>Data: </span>
      <input type="file" on:change={parseData} />
    </div>

    <div class="input-group">
      <input
        type="button"
        on:click={() => (selectAll = true)}
        value="Select All"
      />
      <input
        type="button"
        on:click={() => (selectAll = false)}
        value="Deselect All"
      />
    </div>
  </div>

  <Menu {names} />

  <a href="#top">
    <div class="scroll-top" />
  </a>

  <br />
  <hr />
  <br />
</div>

{#if data == undefined}
  <DivingSheet {headerData} />
{:else}
  {#each data as row}
    {#if row.Age_Group !== ""}
      <DivingSheet print={selectAll} {headerData} {...row} />
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

  .scroll-top {
    position: fixed;
    right: 25px;
    bottom: 25px;
    background: var(--background);
    color: var(--primary);
    text-decoration: none;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: 2px solid var(--primary);
    z-index: 22;
  }

  .scroll-top::after,
  .scroll-top::before {
    content: "";
    width: 10px;
    height: 4px;
    background: var(--primary);
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .scroll-top::after {
    transform-origin: right;
    transform: translateX(-3px) rotateZ(45deg);
  }

  .scroll-top::before {
    transform-origin: left;
    transform: translateX(-4px) rotateZ(-45deg);
  }
  a {
    color: inherit;
    text-decoration: none;
  }
</style>
