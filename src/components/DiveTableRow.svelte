<script>
  import { ddTable } from "./../dd.js";

  export let row = 1;
  export let numberPos;
  export let firstRow = false;

  let numbers;
  let numbersDisp;
  let pos;

  let scoresDisp = ["", "", "", "", ""];

  $: scores = scoresDisp.map((x) => parseFloat(x) || "");

  const change = () => {
    scoresDisp = scoresDisp;
  };

  let finalScore = "";

  $: netTotal = (
    scores.reduce((total, val) => parseFloat(val) + total, 0) -
    Math.max(...scores) -
    Math.min(...scores)
  ).toFixed(2);

  $: if (netTotal !== "NaN") {
    let n = netTotal * dd;
    let s = n.toFixed(2);
    s = s.split(".").join("");
    s = s.length < 5 ? "0" + s : s;
    finalScore = s;
  } else {
    finalScore = "";
  }

  if (numberPos !== undefined) {
    numbersDisp = numberPos.substring(0, numberPos.length - 1);
    pos = numberPos.charAt(numberPos.length - 1).toUpperCase();
  }

  const reset = () => {
    numbersDisp = numberPos.substring(0, numberPos.length - 1);
    pos = numberPos.charAt(numberPos.length - 1).toUpperCase();
    dd = numbersDisp + pos === "" ? "" : ddTable[numbersDisp + pos];
  };

  $: numbersDisp = numberPos.substring(0, numberPos.length - 1);
  $: pos = numberPos.charAt(numberPos.length - 1).toUpperCase();

  $: pos = pos.toUpperCase();

  $: dd = numbersDisp + pos === "" ? "" : ddTable[numbersDisp + pos];
  $: twister = numbersDisp[0] === "5";
  $: numbers = twister ? numbersDisp.substring(1) : numbersDisp;
</script>

<tbody class="table-row">
  <tr>
    <td title="Reset Dive" on:click={reset} id="number" rowspan="3">{row}</td>
    <td
      contenteditable
      bind:innerHTML={numbersDisp}
      id="diveNumbers"
      class="tg-0lax answer"
      rowspan="3"
    >
      {(twister ? "5" : "") + numbers}
    </td>
    <td
      contenteditable
      bind:innerHTML={pos}
      id="pos"
      class="tg-0lax answer"
      rowspan="3">{pos}</td
    >
    <td id="description" rowspan="3" class="tg-0lax">
      <table class="innerTable table">
        <tr>
          <td class="center-txt">S</td>
          <td class="center-txt">R</td>
          <td class="center-txt" class:circle={numbers[0] === "1"}>FWD</td>
          <td class="center-txt" class:circle={numbers[0] === "2"}>BAC</td>
          <td class="center-txt" class:circle={numbers[0] === "3"}>REV</td>
          <td class="center-txt" class:circle={numbers[0] === "4"}>INW</td>
        </tr>
        <tr>
          <td
            class="center-txt"
            class:circle={(!twister && numbers[2] === "1") ||
              numbers[1] === "1"}
            colspan="2">DIVE</td
          >
          <td class="center-txt answer" colspan="2">
            {#if twister}
              {numbers[1] >= 2
                ? `${Math.floor(parseInt(numbers[1]) / 2)} 
                ${parseInt(numbers[1]) % 2 === 1 ? "1/2" : ""} S.S.`
                : ""}
            {:else}
              {numbers[2] >= 2
                ? `${Math.floor(parseInt(numbers[2]) / 2)} 
                ${parseInt(numbers[2]) % 2 === 1 ? "1/2" : ""} S.S.`
                : ""}
            {/if}
          </td>
          <td class="center-txt answer" colspan="2">
            {twister
              ? `${
                  Math.floor(parseInt(numbers[2]) / 2) !== 0
                    ? Math.floor(parseInt(numbers[2]) / 2)
                    : ""
                } 
              ${parseInt(numbers[2]) % 2 === 1 ? "1/2" : ""} TWIST`
              : ""}
          </td>
        </tr>
        <tr>
          <td class="col20 center-txt" colspan="2">FLY</td>
          <td class="col20 center-txt" class:circle={pos === "C"}>TUC</td>
          <td class="col20 center-txt" class:circle={pos === "B"}>PIKE</td>
          <td class="col20 center-txt" class:circle={pos === "A"}>LAY</td>
          <td class="col20 center-txt" class:circle={pos === "D"}>FREE</td>
        </tr>
      </table>
    </td>
    <td contenteditable bind:innerHTML={dd} id="dd" class="tg-0lax" rowspan="3">
      {dd}
    </td>

    {#each scoresDisp as score, i}
      <td
        class="tg-0lax fix"
        contenteditable
        bind:innerHTML={scoresDisp[i]}
        rowspan="3"
      >
        {score}
      </td>
    {/each}
    <td id="award6" class="tg-0lax" rowspan="3" />
    <td id="award7" class="tg-0lax" rowspan="3" />
    <td id="netTotal" class="tg-0lax" rowspan="3">
      {netTotal == "NaN" ? "" : netTotal}
    </td>

    {#if firstRow}
      <td colspan="5" class="table-housing">
        <table class="scoresTable table">
          <tr>
            <td id="score" colspan="5">Score</td>
          </tr>
          <tr>
            <td id="score1" class="tg-0lax invis">1</td>
            <td id="score2" class="tg-0lax invis">1</td>
            <td id="score3" class="tg-0lax invis">1</td>
            <td id="score4" class="tg-0lax invis">1</td>
            <td id="score5" class="tg-0lax invis">1</td>
          </tr>
        </table>
      </td>
    {:else}
      <td id="score1" class="tg-0lax score" rowspan="3" />
      <td id="score2" class="tg-0lax score" rowspan="3" />
      <td id="score3" class="tg-0lax score" rowspan="3" />
      <td id="score4" class="tg-0lax score" rowspan="3" />
      <td id="score5" class="tg-0lax score" rowspan="3" />
    {/if}
  </tr>
</tbody>

<style>
  .invis {
    visibility: hidden;
    position: relative;
    width: 20%;
    overflow: visible;
  }

  .invis::after {
    content: "";
    position: absolute;
    top: 0px;
    left: -2px;
    width: 1px;
    height: calc(100% + 2px);
    background: black;
    visibility: visible;
  }
  .invis:first-child::after {
    visibility: hidden;
  }

  .table-housing {
    padding: 0px;
  }
  #score {
    box-sizing: border-box;
    padding: 0px;
    margin: 0px;
    text-align: center;
    font-size: larger;
    text-transform: uppercase;
  }
  .answer {
    font-size: 13pt;
    font-family: "Courier New", Courier, monospace;
    font-weight: bold;
  }

  .innerTable .answer {
    color: red;
  }

  .innerTable,
  .scoresTable {
    padding: 0;
    margin: 0;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
  }

  .innerTable td {
    font-size: 10px;
    line-height: normal;
    padding: 6px;
  }

  .innerTable tr {
    height: 33.33%;
  }

  .scoresTable td {
    padding: 0px;
  }

  .scoresTable tr {
    height: 100%;
    line-height: 33px;
  }

  #description,
  .table-housing {
    position: relative;
    padding: 0px;
    margin: 0px;
  }
  .table {
    border-collapse: collapse;
  }
  .table td {
    border: 1px solid black;
  }
  .table tr:first-child td {
    border-top: none;
  }
  .table tr:last-child td {
    border-bottom: none;
  }
  .table tr td:first-child {
    border-left: none;
  }
  .table tr td:last-child {
    border-right: none;
  }

  #diveNumbers {
    width: 7%;
  }

  #dd {
    width: 5%;
    text-align: center;
  }

  #number {
    cursor: pointer;
  }

  #netTotal {
    width: 7%;
    text-align: center;
  }

  .score {
    position: relative;
  }

  .score::after {
    content: "";
    position: absolute;
    width: 100%;
    height: 1px;
    background-color: black;
    top: 60%;
    left: 0;
  }

  .fix {
    width: 32px;
    box-sizing: border-box;
  }
</style>
