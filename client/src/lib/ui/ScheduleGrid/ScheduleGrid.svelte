<script lang="ts">
	import { onMount } from 'svelte';
	import ModalBooking from './ModalBooking.svelte';

	const studios: string[] = ['Studio 1', 'Studio 2', 'Studio 3', 'Studio 4', 'Studio 5'];
	const times: string[] = [
		'10:00',
		'11:00',
		'12:00',
		'13:00',
		'14:00',
		'15:00',
		'16:00',
		'17:00',
		'18:00',
		'19:00',
		'20:00',
		'21:00',
		'22:00'
	];

	// Helper to format date as 'Tue, Apr 22'
	function formatDate(date: Date): string {
		return date.toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: '2-digit'
		});
	}

	type Row = { date: Date; time: string; dayIdx: number; timeIdx: number };
	let visibleRows: Row[] = $state([]);
	let startDate: Date = new Date(); // April 22, 2025
	let numDays: number = $state(5);

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
	const booked: [number, number, number][] = $state([
		[0, 0, 0],
		[0, 0, 1],
		[0, 0, 4], // Day 0, 06:00 booked in some studios
		[0, 3, 1],
		[0, 4, 1],
		[0, 5, 1], // Day 0, 09:00-11:00 Studio 2
		[0, 8, 3],
		[0, 9, 3], // Day 0, 14:00-15:00 Studio 4
		[0, 8, 1],
		[0, 9, 1], // Day 0, 14:00-15:00 Studio 2
		[0, 16, 4],
		[0, 17, 4],
		[0, 18, 4] // Day 0, 22:00-00:00 Studio 5
	]);

	function isBooked(dayIdx: number, timeIdx: number, col: number): boolean {
		return booked.some(([d, t, c]) => d === dayIdx && t === timeIdx && c === col);
	}

	// Selection state
	type Selection = {
		dayIdx: number;
		studioIdx: number;
		startHourIdx: number;
		endHourIdx: number;
	} | null;
	let selection: Selection = $state(null);

	function isSelected(dayIdx: number, timeIdx: number, studioIdx: number): boolean {
		if (!selection) return false;
		return (
			selection.dayIdx === dayIdx &&
			selection.studioIdx === studioIdx &&
			timeIdx >= selection.startHourIdx &&
			timeIdx <= selection.endHourIdx
		);
	}

	function handleTileClick(dayIdx: number, timeIdx: number, studioIdx: number) {
		if (isBooked(dayIdx, timeIdx, studioIdx)) return;
		// Always select a block of up to 4 consecutive available hours
		const maxBlock = 4;
		let endHourIdx = timeIdx;
		for (let i = 1; i < maxBlock; i++) {
			const nextIdx = timeIdx + i;
			if (nextIdx >= times.length) break;
			if (isBooked(dayIdx, nextIdx, studioIdx)) break;
			endHourIdx = nextIdx;
		}
		selection = {
			dayIdx,
			studioIdx,
			startHourIdx: timeIdx,
			endHourIdx
		};
	}

	// Hover extension logic is no longer needed
	function handleTileMouseEnter(dayIdx: number, timeIdx: number, studioIdx: number) {
		/* disabled for 4-hour block selection */
	}

	function clearSelection() {
		selection = null;
	}

	let gridEl: HTMLDivElement;
	function handleScroll(e: Event): void {
		const target = e.target as HTMLDivElement;
		console.table({
			scrollTop: target.scrollTop,
			scrollHeight: target.scrollHeight,
			isBottom: target.scrollTop + target.clientHeight >= target.scrollHeight - 300
		});
		if (target.scrollTop + target.clientHeight >= target.scrollHeight - 300) {
			console.log('adding more rows');
			numDays += 2;
			addMoreRows();
		}
	}

	onMount(() => {
		addMoreRows();
	});

	let isBookingModalOpen = $state(false);
</script>

{#if isBookingModalOpen}
	<ModalBooking onClose={() => (isBookingModalOpen = false)} {selection} />
{/if}

<div
	class="bg-brand-back h-full overflow-x-auto overflow-y-auto rounded-lg"
	bind:this={gridEl}
	onscroll={handleScroll}
>
	<div
		class="relative grid"
		style="grid-template-columns: 75px repeat({studios.length}, 1fr); min-width: {140 +
			studios.length * 120}px; border-collapse: separate;"
	>
		<!-- Header Row -->
		<div
			class="text-brand-fore bg-brand-back border-brand-shadow sticky top-0 left-0 z-30 border-r-2 border-b-2 px-2 py-1 text-center font-bold"
		></div>
		{#each studios as studio}
			<div
				class="bg-brand-back text-brand-for border-brand-shadow sticky top-[-10px] z-20 border-b-2 px-2 py-1 text-center font-bold"
			>
				{studio}
			</div>
		{/each}

		{#each Array(numDays) as _, dayIdx}
			<!-- Sticky Date Header Row -->
			<div
				class="bg-brand-back text-brand-highlight border-brand-shadow text-md sticky top-[-10px] left-0 z-30 border-r-2 px-2 py-1 text-end font-bold"
			>
				{formatDate(
					new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + dayIdx)
				)}
			</div>
			{#each studios as studio}
				<div class="bg-brand-fore/5"></div>
			{/each}
			{#each times as time, timeIdx}
				<div
					class="bg-brand-back text-brand-fore border-brand-shadow sticky left-0 z-10 justify-self-end border-r-1 px-2 py-1 font-mono text-sm font-bold"
				>
					{time}
				</div>
				{#each studios as studio, colIdx}
					<div
						class={`group bg-brand-highlight text-brand-fore border-brand-shadow cursor-pointer border-r border-b  px-2 py-1 text-center text-sm transition-all`}
						class:!bg-[var(--color-brand-back)]={isBooked(dayIdx, timeIdx, colIdx)}
						class:!bg-emerald-900={isSelected(dayIdx, timeIdx, colIdx)}
						tabindex="0"
						role="button"
						onclick={() =>
							!selection
								? handleTileClick(dayIdx, timeIdx, colIdx)
								: handleTileMouseEnter(dayIdx, timeIdx, colIdx)}
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') handleTileClick(dayIdx, timeIdx, colIdx);
						}}
					>
						<span
							class="text-brand-fore/5 group-hover:text-brand-fore/25 font-mono transition-all"
							class:text-emerald-500={!isBooked(dayIdx, timeIdx, colIdx)}
							class:text-brand-fore={isSelected(dayIdx, timeIdx, colIdx)}
						>
							{time}
						</span>
					</div>
				{/each}
			{/each}
		{/each}

		{#if selection}
			<button
				class="fixed right-6 bottom-6 z-20 rounded-full bg-emerald-500 px-6 py-3 text-lg font-bold text-white shadow-lg transition hover:bg-emerald-600"
				onclick={() => {
					isBookingModalOpen = true;
					// clearSelection(); // TODO: REMOVE THIS TO SEND DATA, need to add clear inside the modal?
				}}
			>
				{selection.endHourIdx - selection.startHourIdx + 1} Booking{selection.endHourIdx -
					selection.startHourIdx +
					1 >
				1
					? 's'
					: ''}
			</button>
		{/if}
	</div>
</div>
