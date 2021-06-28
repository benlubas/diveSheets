<script>
  export let name = "missing name";
  export let ageGroup;
  export let isMale;
  export let club;
  export let meetName;
  export let site;

  export let date;
  $: dateObj = new Date(date); 
  $: dateObj.setDate(dateObj.getDate() + 1); 
  $: dateString = dateObj.toLocaleString().substring(0, dateObj.toLocaleString().indexOf(",")); 
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
      <th class:circle={isMale} class="tg-0pky col10">
        <div>
          <div class="answer">Male</div>
        </div>
      </th>
      <th class:circle={!isMale} class="tg-0lax">
        <div>
          <div class="answer">Female</div>
        </div>
      </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="tg-0pky">
        <div>
          <div class="title">Club Affiliation</div>
          <div class="answer">{club}</div>
        </div>
        </td>
      <td class="tg-0pky">
        <div>
          <div class="title">Meet</div>
          <div class="answer">{meetName}</div>
        </div>
      </td>
      <td class="tg-0pky col20" colspan="2" rowspan="2">Final Score</td>
    </tr>
    <tr>
      <td class="tg-0pky">
        <div>
          <div class="title">Site</div>
          <div class="answer">{site}</div>
        </div>
      </td>
      <td class="tg-0pky">
        <div>
          <div class="title">Date</div>
          <div class="answer">{dateString}</div>
        </div>
      </td>
    </tr>
    <tr>
      <td class="tg-0pky">Diver's Signature</td>
      <td class="tg-0pky">Coach's Signature</td>
      <td class="center-txt tg-0pky" colspan="2">
        Place (Official Divers Only) 
        1 2 3 4 5 6
      </td>
    </tr>
  </tbody>
</table>

<style>
  th div, td div {
    position: relative;
    display: flex; 
  }
  .answer {
    position: absolute;
    right: 0px; 
    font-size: larger; 
    font-family:'Courier New', Courier, monospace;
    font-weight: bold;
    word-wrap: unset; 
    line-break: unset; 
  }
  .title {
    display: inline; 
  }
</style>