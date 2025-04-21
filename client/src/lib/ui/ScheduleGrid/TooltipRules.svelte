<script lang="ts">
	let { ruleDescriptions = [] }: { ruleDescriptions: string[] } = $props();
</script>

<div
	class="invisible absolute top-full left-1/2 z-50 mt-1 w-64 -translate-x-1/2 rounded bg-gray-800 p-2 text-xs text-white opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:opacity-100"
>
	<div class="mb-1 border-b border-gray-600 pb-1 font-bold">Booking Rules</div>
	{#if ruleDescriptions.length > 0}
		<ul class="list-disc space-y-1 pl-4 text-left">
			{#each ruleDescriptions as ruleDescription}
				<li>{ruleDescription}</li>
			{/each}
		</ul>
	{:else}
		<p>No special rules - any time can be booked in 1-hour increments.</p>
	{/if}
</div>
