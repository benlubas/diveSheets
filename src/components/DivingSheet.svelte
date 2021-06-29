<script>
  import DiveTableHead from "./DiveTableHead.svelte";
  import DiveTableRow from "./DiveTableRow.svelte";
  import SheetHeader from "./SheetHeader.svelte";
  import Footer from "./Footer.svelte";

  export let Age_Group;
  export let Dive_1;
  export let Dive_2;
  export let Dive_3;
  export let Dive_4;
  export let Dive_5;
  export let Dive_6;
  export let Dive_7;
  export let Dive_8;

  export let Name;
  export let Official_Unofficial = "";
  export let Gender;

  export let headerData;

  let formTitle = "Suburban Swim League <br /> Diving Form";

  let diverData;

  $: if (Gender) {
    diverData = {
      ageGroup: Age_Group,
      name: Name,
      gender: Gender.toLowerCase(),
    };
  }

  export let print = true;
</script>

<div class:hidePrint={!print}>
  <div id={Name} class="hidePrint">
    <span>Print This One: </span>
    <input type="checkbox" bind:checked={print} />
  </div>
  <div class="header">
    <div class="orderOfDiving">Order of Diving</div>
    <div class="title" contenteditable bind:innerHTML={formTitle} />
  </div>

  <SheetHeader {...headerData} {...diverData} />

  <br />

  <table class="tg divesTable">
    <DiveTableHead />

    <DiveTableRow firstRow row="1" numberPos={Dive_1} />
    <DiveTableRow row="2" numberPos={Dive_2} />
    <DiveTableRow row="3" numberPos={Dive_3} />
    <DiveTableRow row="4" numberPos={Dive_4} />
    <DiveTableRow row="5" numberPos={Dive_5} />
    <DiveTableRow row="6" numberPos={Dive_6} />
    <DiveTableRow row="7" numberPos={Dive_7} />
    <DiveTableRow row="8" numberPos={Dive_8} />
  </table>
  <Footer official={Official_Unofficial.toLowerCase()} />

  <div style="page-break-after: always" />
</div>

<style>
  .header {
    width: 100%;
    padding-bottom: 15px;
    /* display: flex;
    justify-content: space-between;
    align-items: center; */
  }
  .title {
    text-align: center;
    font-family: "Arial";
    font-size: 18pt;
    text-transform: uppercase;
    font-weight: normal;
    justify-self: center;
    display: inline-block;
    margin-left: 40%;
    transform: translateX(-50%);
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
