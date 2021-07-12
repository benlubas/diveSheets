<script>
  export let name = "";
  export let ageGroup = "";
  export let gender;
  export let club;
  export let meetName;
  export let site;
  export let updateName = () => {};

  export let date;
  $: dateObj = new Date(date);
  $: dateObj.setDate(dateObj.getDate() + 1);
  $: dateString = dateObj
    .toLocaleString()
    .substring(0, dateObj.toLocaleString().indexOf(","));

  let nameDiv;
  let ageGroupDiv;

  const focusName = () => {
    nameDiv.focus();
  };
  const focusAgeGroup = () => {
    ageGroupDiv.focus();
  };
</script>

<table class="diverInfoTable tg">
  <thead>
    <tr>
      <th on:click={focusName} class="tg-0pky col40">
        <div>
          <div class="title">Name</div>
          <div
            contenteditable
            bind:this={nameDiv}
            bind:innerHTML={name}
            on:input={updateName(name)}
            class="answer"
          >
            {name}
          </div>
        </div>
      </th>
      <th on:click={focusAgeGroup} class="tg-0pky col40">
        <div>
          <div class="title">Age Group</div>
          <div
            bind:this={ageGroupDiv}
            contenteditable
            bind:innerHTML={ageGroup}
            class="answer"
          >
            {ageGroup}
          </div>
        </div>
      </th>
      <th
        on:click={() => (gender = "male")}
        class:circle={gender === "male"}
        class="tg-0pky col10 pointer"
      >
        <div>
          <div class="answer center-txt">Male</div>
        </div>
      </th>
      <th
        on:click={() => (gender = "female")}
        class:circle={gender === "female"}
        class="tg-0lax pointer"
      >
        <div>
          <div class="answer center-txt">Female</div>
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
        Place (Official Divers Only) 1 2 3 4 5 6
      </td>
    </tr>
  </tbody>
</table>

<style>
  th div,
  td div {
    position: relative;
    display: flex;
  }
  .answer {
    position: absolute;
    right: 0px;
    font-size: larger;
    font-family: "Courier New", Courier, monospace;
    font-weight: bold;
    word-wrap: unset;
    line-break: unset;
  }
  .title {
    display: inline;
  }
</style>
