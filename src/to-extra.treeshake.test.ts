import { describe, it } from 'node:test';
import { expect } from 'expect';

describe('Not importing [toExtra]', () => {
	it('should only modify Object prototype after being imported for the first time', async () => {
		const before = new Set(Object.getOwnPropertySymbols(Object.prototype));
		const { toExtra } = await import('./to-extra');
		const after = new Set(Object.getOwnPropertySymbols(Object.prototype));
		expect(after.difference(before).size).toBe(1);
		expect(toExtra in Object.prototype).toBe(true);
	});
});
