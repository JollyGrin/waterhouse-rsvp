<script lang="ts">
	import { booked } from './constants-mock';
	import { onMount } from 'svelte';
	import ModalBooking from './ModalBooking.svelte';
	import type { Selection } from './types';
	import { BookingRuleEngine, FixedSlotRule, FixedDurationRule, MinMaxDurationRule } from './rules-selection';

	const studios: string[] = ['Studio 1', 'Studio 2', 'Studio 3', 'Studio 4', 'Studio 5'];
	const times: string[] = Array.from({ length: 24 }).map(
		(_, i) => `${i.toString().padStart(2, '0')}:00`
	);

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
	let numDays: number = $state(2);

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

	function isBooked(dayIdx: number, timeIdx: number, col: number): boolean {
		return booked.some(([d, t, c]) => d === dayIdx && t === timeIdx && c === col);
	}

	let selection: Selection | null = $state(null);

	function isSelected(dayIdx: number, timeIdx: number, studioIdx: number): boolean {
		if (!selection || selection === null) return false;
		return (
			selection.dayIdx === dayIdx &&
			selection.studioIdx === studioIdx &&
			timeIdx >= selection.startHourIdx &&
			timeIdx <= selection.endHourIdx
		);
	}

	// Initialize booking rule engine with our rules
	const ruleEngine = new BookingRuleEngine([
		// Fixed slot rule example: Studios 1-3 can only be booked in 4-hour blocks at specific times
		new FixedSlotRule({
			name: "3×4h windows",
			days: [],  // All days
			studios: [0, 1, 2],  // Studios 1, 2, 3 (0-indexed)
			slots: [[10, 14], [14, 18], [18, 22]]
		}),
		// Fixed duration rule example: Weekdays in Studios 1-2 must be booked in 4-hour blocks
		new FixedDurationRule({
			name: "Weekday 4h fixed blocks",
			days: [1, 2, 3, 4, 5],  // Weekdays (Monday = 1)
			studios: [0, 1],  // Studios 1-2 (0-indexed)
			startHour: 10,
			endHour: 22,
			duration: 4
		}),
		// Min/Max duration rule: Evening in Studio 3 can be booked for 1-2 hours
		new MinMaxDurationRule({
			name: "Evening max 2h",
			days: [], // All days
			studios: [2], // Studio 3 (0-indexed)
			startHour: 15,
			endHour: 20,
			minDuration: 1,
			maxDuration: 2
		})
	]);

	function handleTileClick(dayIdx: number, timeIdx: number, studioIdx: number) {
		if (isBooked(dayIdx, timeIdx, studioIdx)) return;
		if (isSelected(dayIdx, timeIdx, studioIdx)) return clearSelection();

		// Check if we're extending an existing selection
		if (selection && selection.dayIdx === dayIdx && selection.studioIdx === studioIdx) {
			// Attempting to extend selection
			if (timeIdx === selection.endHourIdx + 1 || timeIdx === selection.startHourIdx - 1) {
				// Adjacent to current selection - try to extend
				selection = ruleEngine.extendSelection(selection, timeIdx, isBooked);
				return;
			}
		}

		// Otherwise, create a new selection based on applicable rules
		selection = ruleEngine.calculateSelection(dayIdx, timeIdx, studioIdx, isBooked);
	}

	function clearSelection() {
		selection = null;
	}

	let gridEl: HTMLDivElement;
	function handleScroll(e: Event): void {
		const target = e.target as HTMLDivElement;
		if (target.scrollTop + target.clientHeight >= target.scrollHeight - 300) {
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
	class="bg-brand-back booking-grid h-full overflow-x-auto overflow-y-auto rounded-lg"
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
					class:opacity-50={time.startsWith('0') || time.startsWith('23')}
				>
					{time}
				</div>
				{#each studios as studio, colIdx}
					<div
						class={`group bg-brand-highlight text-brand-fore border-brand-shadow cursor-pointer border-r border-b  px-2 py-1 text-center text-sm transition-all`}
						class:!bg-[var(--color-brand-back)]={isBooked(dayIdx, timeIdx, colIdx)}
						class:!bg-emerald-900={isSelected(dayIdx, timeIdx, colIdx)}
						class:opacity-50={time.startsWith('0') || time.startsWith('23')}
						tabindex="0"
						role="button"
						onclick={() => handleTileClick(dayIdx, timeIdx, colIdx)}
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

<style>
	.booking-grid {
		scrollbar-color: var(--color-brand-highlight) var(--color-brand-back);
		scrollbar-width: thin;
	}
</style>
