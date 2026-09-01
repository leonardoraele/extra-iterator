import { AsyncIterator } from 'async-iterator-helpers-ponyfill';
import { ExtraAsyncIterator } from './ExtraAsyncIterator.js';

export class AsyncIteratorSwitch<T> {
	constructor(source: AsyncIterator<T>) {
		source.forEach(item => {
			for (const controller of this.controllers) {
				controller.enqueue(item);
			}
		}).then(() => {
			for (const controller of this.controllers) {
				controller.close();
			}
		}).catch(error => {
			for (const controller of this.controllers) {
				controller.error(error);
			}
		}).finally(() => {
			this.controllers.clear();
		});
	}

	private controllers: Set<ReadableStreamDefaultController<T>> = new Set();

	public createBranch({ signal = null as AbortSignal | null } = {}): ExtraAsyncIterator<T> {
		const { iterator, controller } = ExtraAsyncIterator.withController<T>();
		this.controllers.add(controller);
		signal?.addEventListener('abort', () => {
			this.controllers.delete(controller);
			controller.close();
		});
		return iterator;
	}
}
