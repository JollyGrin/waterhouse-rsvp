<script lang="ts">
	import { enhance } from '$app/forms';
	import { useClerkContext } from 'svelte-clerk';
	import toast from 'svelte-french-toast';

	let {
		onClose,
		selection
	}: {
		onClose(): void;
		selection: {
			dayIdx: number;
			studioIdx: number;
			startHourIdx: number;
			endHourIdx: number;
		} | null;
	} = $props();

	const clerk = useClerkContext();
	const userId = $derived(clerk.auth.userId);

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
	let name = $state('');
	let email = $state('');
	let phone = $state('');
	let notes = $state('');

	// Form validation
	let submitted = $state(false);
	let submitting = $state(false);
	let error = $state('');

	const formValid = $derived(name.trim() !== '' && email.trim() !== '');

	// Convert selection to absolute date/time
	function getBookingData() {
		if (!selection) return null;

		// Calculate start and end dates
		const startDate = new Date();
		startDate.setDate(startDate.getDate() + selection.dayIdx);
		startDate.setHours(selection.startHourIdx, 0, 0, 0);

		const endDate = new Date(startDate);
		endDate.setHours(selection.endHourIdx + 1, 0, 0, 0); // End hour is inclusive in UI, exclusive in API

		return {
			studioId: (selection.studioIdx + 1).toString(), // Convert to 1-based ID for now
			startTime: startDate.toISOString(),
			endTime: endDate.toISOString(),
			totalPrice: (selection.endHourIdx - selection.startHourIdx + 1) * 75, // Simple price calculation: $75/hour
			userId,
			status: 'pending',
			name,
			email,
			phone,
			notes
		};
	}

	// Form submission handler with enhanced progressive enhancement
	function handleSubmission(event: SubmitEvent) {
		submitted = true;

		if (!formValid) {
			event.preventDefault();
			return;
		}

		if (!userId) {
			event.preventDefault();
			error = 'You must be logged in to make a booking';
			return;
		}

		if (!selection) {
			event.preventDefault();
			error = 'No time slot selected';
			return;
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
	<form
		method="POST"
		action="/api/booking"
		onsubmit={handleSubmission}
		use:enhance={() => {
			submitting = true;
			error = '';

			return async ({ result, update }) => {
				submitting = false;

				if (result.type === 'success') {
					toast.success('Booking confirmed!');
					await update();
					onClose();
				} else if (result.type === 'error') {
					error = result.error?.message || 'Failed to create booking';
					toast.error(error);
				}
			};
		}}
		class="space-y-4"
	>
		<div>
			<label for="name" class="mb-1 block text-sm font-medium text-gray-300">Full Name *</label>
			<input
				type="text"
				id="name"
				name="name"
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
				name="email"
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
				name="phone"
				bind:value={phone}
				class="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
			/>
		</div>

		<div>
			<label for="notes" class="mb-1 block text-sm font-medium text-gray-300">Notes</label>
			<textarea
				id="notes"
				name="notes"
				bind:value={notes}
				rows="3"
				class="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
			></textarea>
		</div>

		{#if error}
			<div class="rounded-md bg-red-900/30 p-3 text-sm text-red-200">
				{error}
			</div>
		{/if}

		<!-- Hidden form fields for API data -->
		{#if selection}
			<input type="hidden" name="studioId" value={(selection.studioIdx + 1).toString()} />
			<input type="hidden" name="userId" value={userId || ''} />
            
			<!-- Format dates properly - create ISO strings -->
			{@const startDate = (() => {
				const date = new Date();
				date.setDate(date.getDate() + selection.dayIdx);
				date.setHours(selection.startHourIdx, 0, 0, 0);
				return date;
			})()}
			
			{@const endDate = (() => {
				const date = new Date();
				date.setDate(date.getDate() + selection.dayIdx);
				date.setHours(selection.endHourIdx + 1, 0, 0, 0);
				return date;
			})()}
			
			<input type="hidden" name="startTime" value={startDate.toISOString()} />
			<input type="hidden" name="endTime" value={endDate.toISOString()} />
			<input
				type="hidden"
				name="totalPrice"
				value={(selection.endHourIdx - selection.startHourIdx + 1) * 75}
			/>
			<input type="hidden" name="status" value="pending" />
		{/if}

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
				disabled={submitting}
				class="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
			>
				{#if submitting}
					Processing...
				{:else}
					Confirm Booking
				{/if}
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
