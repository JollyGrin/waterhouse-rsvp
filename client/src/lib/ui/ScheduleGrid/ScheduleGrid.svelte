<script>
  // Example data for demonstration
  const studios = ['Studio 1', 'Studio 2', 'Studio 3', 'Studio 4', 'Studio 5'];
  const times = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
    '20:00', '21:00', '22:00', '23:00', '00:00', '01:00', '02:00', '03:00'
  ];
  const day = 'Tue, Apr 22';

  // Example: which slots are booked (row, col)
  const booked = [
    [0, 0], [0, 1], [0, 4], // 06:00 booked in some studios
    [3, 1], [4, 1], [5, 1], // 09:00-11:00 Studio 2
    [8, 3], [9, 3], // 14:00-15:00 Studio 4
    [8, 1], [9, 1], // 14:00-15:00 Studio 2
    [16, 4], [17, 4], [18, 4], // 22:00-00:00 Studio 5
  ];

  function isBooked(row, col) {
    return booked.some(([r, c]) => r === row && c === col);
  }
</script>

<div class="schedule-outer">
  <div class="schedule-grid">
    <!-- Header Row -->
    <div class="sticky-col header day-time-header">{day}</div>
    {#each studios as studio}
      <div class="header studio-header">{studio}</div>
    {/each}

    <!-- Time Rows -->
    {#each times as time, rowIdx}
      <div class="sticky-col time-cell">{time}</div>
      {#each studios as studio, colIdx}
        <div class="slot-cell {isBooked(rowIdx, colIdx) ? 'booked' : ''}"></div>
      {/each}
    {/each}
  </div>
</div>

<style>
.schedule-outer {
  overflow-x: auto;
  background: #f7f8fa;
  border-radius: 8px;
  padding: 8px;
}
.schedule-grid {
  display: grid;
  grid-template-columns: 120px repeat(5, 1fr);
  min-width: 700px;
  border-collapse: separate;
}
.header {
  font-weight: bold;
  background: #f5f6f8;
  border-bottom: 2px solid #e0e3e8;
  padding: 8px 4px;
  text-align: center;
  position: sticky;
  top: 0;
  z-index: 2;
}
.sticky-col {
  position: sticky;
  left: 0;
  background: #f5f6f8;
  z-index: 3;
  border-right: 2px solid #e0e3e8;
}
.day-time-header {
  text-align: left;
  font-size: 1rem;
  padding-left: 10px;
}
.studio-header {
  min-width: 120px;
}
.time-cell {
  padding: 6px 10px;
  font-size: 0.95rem;
  background: #fff;
  border-bottom: 1px solid #e0e3e8;
  text-align: left;
}
.slot-cell {
  border-bottom: 1px solid #e0e3e8;
  border-right: 1px solid #e0e3e8;
  height: 32px;
  background: #fff;
}
.slot-cell.booked {
  background: #bfc8d8;
}
</style>
