
export const memoriesPermissions = [
	{
		name: 'create_memory',
		description: 'Create new memory',
		category: 'memories',
		route: '/api/admin/memories',
		method: 'POST',
	},
	{
		name: 'read_memory',
		description: 'View memory information',
		category: 'memories',
		route: '/api/admin/memories',
		method: 'GET',
	},
	{
		name: 'get_memories',
		description: 'Get all memories',
		category: 'memories',
		route: '/api/admin/memories',
		method: 'GET',
	},
	{
		name: 'update_memory',
		description: 'Update memory information',
		category: 'memories',
		route: '/api/admin/memories/:id',
		method: 'PUT',
	},
	{
		name: 'update_memories',
		description: 'Update multiple memories',
		category: 'memories',
		route: '/api/admin/memories',
		method: 'PUT',
	},
	{
		name: 'delete_memory',
		description: 'Delete memory',
		category: 'memories',
		route: '/api/admin/memories/:id',
		method: 'DELETE',
	},
	{
		name: 'manage_memories',
		description: 'Full memory management access',
		category: 'memories',
	},
];
