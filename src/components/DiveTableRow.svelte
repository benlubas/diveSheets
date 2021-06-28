<script>
  import {ddTable} from "./../dd.js"; 
  
  export let row = 1; 
  export let numberPos; 

  let numbers; 
  let pos; 
  let twister; 

  $: if (numberPos !== undefined) {
    numbers = numberPos.substring(0, numberPos.length - 1); 
    pos = numberPos.charAt(numberPos.length - 1).toUpperCase(); 
    
    twister = numbers[0] === "5"; 
    if (twister) numbers = numbers.substring(1); 
  }

  
</script>
<tbody class="table-row">
  <tr>
    <td id="number" rowspan="3">
      {row}
    </td>
    <td id="diveNumbers" class="tg-0lax answer" rowspan="3">
      {(twister ? "5" : "") + numbers}
    </td> 
    <td id="pos" class="tg-0lax answer" rowspan="3">
      {pos}
    </td>
    <td id="description" rowspan="3" class="tg-0lax">
      <table class="innerTable table">
        <tr>
          <td>S</td>
          <td>R</td>
          <td class:circle={numbers[0] === "1"}>FWD</td>
          <td class:circle={numbers[0] === "2"}>BAC</td>
          <td class:circle={numbers[0] === "3"}>REV</td>
          <td class:circle={numbers[0] === "4"}>INW</td>
        </tr>
        <tr>
          <td class:circle={numbers[2] === "1"} colspan="2">DIVE</td>
          <td class="answer" colspan="2">
            {numbers[2] >= 2 ? `${Math.floor(parseInt(numbers[2]) / 2)} 
              ${(parseInt(numbers[2]) % 2 === 1 ? "1/2" : "")} SUM` : ""}
          </td>
          <td class="answer" colspan="2">
            {twister ? `${Math.floor(parseInt(numbers[1]) / 2)} 
              ${(parseInt(numbers[1]) % 2 === 1 ? "1/2" : "")} TWIST` : ""}
          </td>
        </tr>
        <tr>
          <td class="col20" colspan="2">FLY</td>
          <td class="col20" class:circle={pos === "C"}>TUC</td>
          <td class="col20" class:circle={pos === "B"}>PIKE</td>
          <td class="col20" class:circle={pos === "A"}>LAY</td>
          <td class="col20" class:circle={pos === "D"}>FREE</td>
        </tr>
      </table>
    </td>
    <td id="dd" class="tg-0lax" rowspan="3">
      {ddTable[numberPos]}
    </td>
    <td id="award1" class="tg-0lax" rowspan="3"></td>
    <td id="award2" class="tg-0lax" rowspan="3"></td>
    <td id="award3" class="tg-0lax" rowspan="3"></td>
    <td id="award4" class="tg-0lax" rowspan="3"></td>
    <td id="award5" class="tg-0lax" rowspan="3"></td>
    <td id="award6" class="tg-0lax" rowspan="3"></td>
    <td id="award7" class="tg-0lax" rowspan="3"></td>
    <td id="netTotal" class="tg-0lax" rowspan="3"></td>
    <td id="score1" class="tg-0lax score" rowspan="3"></td>
    <td id="score2" class="tg-0lax score" rowspan="3"></td>
    <td id="score3" class="tg-0lax score" rowspan="3"></td>
    <td id="score4" class="tg-0lax score" rowspan="3"></td>
    <td id="score5" class="tg-0lax score" rowspan="3"></td>
  </tr>
</tbody>

<style>
 
 .answer {
   font-size: 13pt; 
   font-family:'Courier New', Courier, monospace;
   font-weight: bold;
 }

  .innerTable {
    padding: 0;
    width: 100%;
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
  
  .innerTable td {
    font-size: 10px;
    line-height: normal;
  }
  
  .innerTable tr {
    height: 33.33%;
  }
  
  #description {
    position: relative;
    padding: 0px;
    margin: 0px;
  }
  
</style>