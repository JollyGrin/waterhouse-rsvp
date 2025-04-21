<script lang="ts">
	export let onClose: () => void;
	export let selection: {
		dayIdx: number;
		studioIdx: number;
		startHourIdx: number;
		endHourIdx: number;
	} | null;

	// The studios array (copied from ScheduleGrid since we can't directly import from constants-mock)
	const studios: string[] = ['Studio 1', 'Studio 2', 'Studio 3', 'Studio 4', 'Studio 5'];

	// Format a date as 'Tuesday, April 22, 2025'
	function formatFullDate(dayIdx: number): string {
		const date = new Date();
		date.setDate(date.getDate() + dayIdx);
		return date.toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	// Format time range as '10:00 - 14:00'
	function formatTimeRange(startHour: number, endHour: number): string {
		const start = `${startHour.toString().padStart(2, '0')}:00`;
		const end = `${(endHour + 1).toString().padStart(2, '0')}:00`; // End time is exclusive
		return `${start} - ${end}`;
	}

	// Calculate booking duration
	function getDuration(startHour: number, endHour: number): string {
		const hours = endHour - startHour + 1;
		return hours === 1 ? '1 hour' : `${hours} hours`;
	}

	// Form state
	let name = '';
	let email = '';
	let phone = '';
	let notes = '';

	// Form validation
	let submitted = false;
	$: formValid = name.trim() !== '' && email.trim() !== '';

	function handleSubmit() {
		submitted = true;
		if (formValid) {
			// TODO: Add actual submission logic here
			console.log('Booking submitted', {
				name,
				email,
				phone,
				notes,
				selection
			});
			onClose();
		}
	}

	// Event handlers
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}

	function handleOverlayClick() {
		onClose();
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#snippet modalBody()}
	<h2 id="modal-title" class="mb-6 text-center text-2xl font-bold text-emerald-400">
		Confirm Your Booking
	</h2>

	<!-- Booking Details Summary -->
	<div class="mb-6 rounded-lg bg-gray-800/50 p-4">
		<h3 class="mb-2 font-semibold text-emerald-300">Booking Details</h3>
		<dl class="space-y-2 text-sm">
			<div class="grid grid-cols-3 gap-1">
				<dt class="col-span-1 font-medium text-gray-300">Studio:</dt>
				<dd class="col-span-2">{studios[selection?.studioIdx || 0]}</dd>
			</div>
			<div class="grid grid-cols-3 gap-1">
				<dt class="col-span-1 font-medium text-gray-300">Date:</dt>
				<dd class="col-span-2">{formatFullDate(selection?.dayIdx || 0)}</dd>
			</div>
			<div class="grid grid-cols-3 gap-1">
				<dt class="col-span-1 font-medium text-gray-300">Time:</dt>
				<dd class="col-span-2">
					{formatTimeRange(selection?.startHourIdx || 0, selection?.endHourIdx || 0)}
				</dd>
			</div>
			<div class="grid grid-cols-3 gap-1">
				<dt class="col-span-1 font-medium text-gray-300">Duration:</dt>
				<dd class="col-span-2">
					{getDuration(selection?.startHourIdx || 0, selection?.endHourIdx || 0)}
				</dd>
			</div>
		</dl>
	</div>

	<!-- Booking Form -->
	<form onsubmit={() => handleSubmit()} class="space-y-4">
		<div>
			<label for="name" class="mb-1 block text-sm font-medium text-gray-300">Full Name *</label>
			<input
				type="text"
				id="name"
				bind:value={name}
				class="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
				required
			/>
			{#if submitted && name.trim() === ''}
				<p class="mt-1 text-xs text-red-400">Please enter your name</p>
			{/if}
		</div>

		<div>
			<label for="email" class="mb-1 block text-sm font-medium text-gray-300">Email *</label>
			<input
				type="email"
				id="email"
				bind:value={email}
				class="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
				required
			/>
			{#if submitted && email.trim() === ''}
				<p class="mt-1 text-xs text-red-400">Please enter your email</p>
			{/if}
		</div>

		<div>
			<label for="phone" class="mb-1 block text-sm font-medium text-gray-300">Phone Number</label>
			<input
				type="tel"
				id="phone"
				bind:value={phone}
				class="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
			/>
		</div>

		<div>
			<label for="notes" class="mb-1 block text-sm font-medium text-gray-300">Notes</label>
			<textarea
				id="notes"
				bind:value={notes}
				rows="3"
				class="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
			></textarea>
		</div>

		<div class="mt-6 flex items-center justify-end space-x-3">
			<button
				type="button"
				onclick={onClose}
				class="rounded-md border border-gray-600 bg-transparent px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
			>
				Cancel
			</button>
			<button
				type="submit"
				class="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-none"
			>
				Confirm Booking
			</button>
		</div>
	</form>
{/snippet}

<!-- Modal Overlay with Backdrop -->
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
	<!-- Modal Dialog -->
	<dialog
		class="bg-brand-dark text-brand-fore mx-4 w-full max-w-md rounded-lg p-0 shadow-lg open:block"
		open
		aria-labelledby="modal-title"
	>
		<!-- Modal Header with Close Button -->
		<div class="flex justify-end p-2">
			<button
				class="rounded-full p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
				onclick={onClose}
				aria-label="Close"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		</div>

		<!-- Modal Body -->
		<div class="px-6 pb-6">
			{@render modalBody()}
		</div>
	</dialog>

	<!-- Invisible overlay to close modal when clicking outside -->
	<button
		class="fixed inset-0 h-full w-full cursor-default bg-transparent"
		onclick={handleOverlayClick}
		aria-label="Close modal"
		tabindex="-1"
	></button>
</div>

<style>
	/* Dialog styling */
	dialog {
		margin: auto;
		/* background: transparent; */
		/* color: white; */
		/* border: none; */
		z-index: 51;
	}
	dialog::backdrop {
		display: none;
	}
</style>
