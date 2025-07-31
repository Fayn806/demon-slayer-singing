export function calculateEarnings(base: number, multiple: number, size = 1, dt = 1): number {
	return base * size * multiple * dt;
}
