import { json } from '@sveltejs/kit';

export const GET = () => {
	return json({
		status: 'OK',
		message: 'Application is running'
	});
};
