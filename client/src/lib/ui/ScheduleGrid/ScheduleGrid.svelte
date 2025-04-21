<script lang="ts">
  import { onMount } from 'svelte';

  const studios: string[] = ['Studio 1', 'Studio 2', 'Studio 3', 'Studio 4', 'Studio 5'];
  const times: string[] = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
    '20:00', '21:00', '22:00', '23:00', '00:00', '01:00', '02:00', '03:00'
  ];

  // Helper to format date as 'Tue, Apr 22'
  function formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: '2-digit'
    });
  }

  type Row = { date: Date; time: string; dayIdx: number; timeIdx: number };
  let visibleRows: Row[] = [];
  let startDate: Date = new Date(2025, 3, 22); // April 22, 2025
  let numDays: number = 5;

  function addMoreRows(): void {
    const rows: Row[] = [];
    for (let d = 0; d < numDays; d++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + d);
      for (let t = 0; t < times.length; t++) {
        rows.push({ date: new Date(date), time: times[t], dayIdx: d, timeIdx: t });
      }
    }
    visibleRows = rows;
  }

  addMoreRows();

  // Example: which slots are booked (dayIdx, timeIdx, col)
  const booked: [number, number, number][] = [
    [0, 0, 0], [0, 0, 1], [0, 0, 4], // Day 0, 06:00 booked in some studios
    [0, 3, 1], [0, 4, 1], [0, 5, 1], // Day 0, 09:00-11:00 Studio 2
    [0, 8, 3], [0, 9, 3], // Day 0, 14:00-15:00 Studio 4
    [0, 8, 1], [0, 9, 1], // Day 0, 14:00-15:00 Studio 2
    [0, 16, 4], [0, 17, 4], [0, 18, 4], // Day 0, 22:00-00:00 Studio 5
  ];

  function isBooked(dayIdx: number, timeIdx: number, col: number): boolean {
    return booked.some(([d, t, c]) => d === dayIdx && t === timeIdx && c === col);
  }

  let gridEl: HTMLDivElement;
  function handleScroll(e: Event): void {
    const target = e.target as HTMLDivElement;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 200) {
      numDays += 2;
      addMoreRows();
    }
  }

  onMount(() => {
    addMoreRows();
  });
</script>

<div class="schedule-outer" bind:this={gridEl} on:scroll={handleScroll} style="max-height: 70vh; overflow-y: auto;">
  <div class="schedule-grid" style="grid-template-columns: 140px repeat({studios.length}, 1fr); min-width: {140 + studios.length * 120}px;">
    <!-- Header Row -->
    <div class="sticky-col header day-time-header"></div>
    {#each studios as studio}
      <div class="header studio-header">{studio}</div>
    {/each}

    {#each Array(numDays) as _, dayIdx}
      <!-- Sticky Date Header Row -->
      <div class="sticky-col sticky-date-row">{formatDate(new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + dayIdx))}</div>
      {#each studios as studio}
        <div class="sticky-date-row"></div>
      {/each}
      {#each times as time, timeIdx}
        <div class="sticky-col time-cell">{time}</div>
        {#each studios as studio, colIdx}
          <div class="slot-cell {isBooked(dayIdx, timeIdx, colIdx) ? 'booked' : ''}"></div>
        {/each}
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
.sticky-date-row {
  position: sticky;
  top: 52px;
  background: #f5f6f8;
  font-weight: bold;
  font-size: 1.1rem;
  padding: 8px 10px 8px 10px;
  border-bottom: 2px solid #e0e3e8;
  border-right: 2px solid #e0e3e8;
  z-index: 4;
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
