<script lang='ts'>
  export let name = "missing name";
  export let ageGroup;
  export let gender;
  export let club;
  export let meetName;
  export let site;

  let date = new Date().toLocaleString(); 
  date = date.substring(0, date.indexOf(",")); 
</script>

<table class="diverInfoTable tg">
  <thead>
    <tr>
      <th class="tg-0pky col40">
        <div>
          <div class="title">Name</div>
          <div class="answer">{name}</div>
        </div>
      </th>
      <th class="tg-0pky col40">
        <div>
          <div class="title">Age Group</div>
          <div class="answer">{ageGroup}</div>
        </div>
        </th>
      <th class="tg-0pky col10">
        <div class="answer"> 
          {gender} 
        </div>
      </th>
      <th class="tg-0lax"></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="tg-0pky">Club Affiliation</td>
      <td class="tg-0pky">Meet</td>
      <td class="tg-0pky col20" colspan="2" rowspan="2">Final Score</td>
    </tr>
    <tr>
      <td class="tg-0pky">Site</td>
      <td class="tg-0pky">Date</td>
    </tr>
    <tr>
      <td class="tg-0pky">Diver's Signature</td>
      <td class="tg-0pky">Coach's Signature</td>
      <td class="center-txt tg-0pky" colspan="2">Place (Official Divers Only) <br>1 2 3 4 5 6</td>
    </tr>
  </tbody>
</table>

<style>
  th div {
    display: flex; 
  }
  .answer {
    margin-left: 50%;
    transform: translateX(-50%);
    font-size: larger; 
    font-family:'Courier New', Courier, monospace;
    font-weight: bold;
  }
</style>