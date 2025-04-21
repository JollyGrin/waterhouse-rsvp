// Example: which slots are booked (dayIdx, timeIdx, col)
export const booked: [number, number, number][] = [
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
	[0, 6, 4],
	[0, 7, 4],
	[0, 12, 4] // Day 0, 22:00-00:00 Studio 5
];
