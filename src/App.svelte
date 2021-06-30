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

  let blankSheet = {
    Age_Group: " ",
    Dive_1: "",
    Dive_2: "",
    Dive_3: "",
    Dive_4: "",
    Dive_5: "",
    Dive_6: "",
    Dive_7: "",
    Dive_8: "",
    Gender: "un selected",
    Name: "",
    Official_Unofficial: "",
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

  let changeName = (name, index) => {
    data[index].Name = name;
  };
  let remove = (index) => {
    data.splice(index, 1);
    data = data;
  };

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
        value="Add New Sheet"
        on:click={() => (data = [{ ...blankSheet }, ...data])}
      />
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

  <Menu {names} {remove} />

  <br />
  <hr />
  <br />
</div>

{#if data == undefined}
  <DivingSheet {headerData} />
{:else}
  {#each data as row, i (row)}
    {#if row.Age_Group !== ""}
      <DivingSheet
        updateName={(nName) => changeName(nName, i)}
        print={selectAll}
        {headerData}
        {...row}
      />
    {/if}
  {/each}
{/if}

<style>
  .input-group {
    display: flex;
    justify-content: space-between;
    max-width: 300px;
    margin: 5px;
    font-size: 1.5rem;
  }

  input[type="button"] {
    padding: 10px;
  }
</style>
