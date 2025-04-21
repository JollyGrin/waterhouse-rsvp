<script lang="ts">
	import { onMount } from 'svelte';

	const studios: string[] = ['Studio 1', 'Studio 2', 'Studio 3', 'Studio 4', 'Studio 5'];
	const times: string[] = [
		'06:00',
		'07:00',
		'08:00',
		'09:00',
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
		'22:00',
		'23:00',
		'00:00',
		'01:00',
		'02:00',
		'03:00'
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

<div
	class="bg-brand-back h-full overflow-x-auto overflow-y-auto rounded-lg p-2"
	bind:this={gridEl}
	on:scroll={handleScroll}
>
	<div
		class="grid"
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
				class="bg-brand-back text-brand-highlight border-brand-shadow text-md sticky top-[-10px] left-0 z-50 border-r-2 px-2 py-1 text-end font-bold"
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
						class="group bg-brand-back text-brand-fore border-brand-shadow border-r border-b px-2 py-1 text-center text-sm"
						class:!bg-[var(--color-brand-highlight)]={isBooked(dayIdx, timeIdx, colIdx)}
					>
						<span
							class="text-brand-fore/5 group-hover:text-brand-fore/25 font-mono transition-all"
							class:text-emerald-500={isBooked(dayIdx, timeIdx, colIdx)}
						>
							{time}
						</span>
					</div>
				{/each}
			{/each}
		{/each}
	</div>
</div>
