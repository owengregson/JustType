(function () {
	// Tracking Intervals and Timeouts
	const originalSetInterval = window.setInterval;
	const originalClearInterval = window.clearInterval;
	const originalSetTimeout = window.setTimeout;
	const originalClearTimeout = window.clearTimeout;

	window.intervals = new Map();
	window.timeouts = new Map();

	window.setInterval = function (func, delay) {
		const id = originalSetInterval(func, delay);
		window.intervals.set(id, { func, delay });
		return id;
	};

	window.clearInterval = function (id) {
		window.intervals.delete(id);
		originalClearInterval(id);
	};

	window.setTimeout = function (func, delay) {
		const id = originalSetTimeout(func, delay);
		window.timeouts.set(id, { func, delay });
		return id;
	};

	window.clearTimeout = function (id) {
		window.timeouts.delete(id);
		originalClearTimeout(id);
	};

	// Tracking Event Listeners
	const originalAddEventListener = EventTarget.prototype.addEventListener;
	const originalRemoveEventListener =
		EventTarget.prototype.removeEventListener;

	EventTarget.prototype.addEventListener = function (
		type,
		listener,
		options
	) {
		this._listeners = this._listeners || {};
		this._listeners[type] = this._listeners[type] || [];
		this._listeners[type].push({ listener, options });
		originalAddEventListener.call(this, type, listener, options);
	};

	EventTarget.prototype.removeEventListener = function (
		type,
		listener,
		options
	) {
		if (this._listeners && this._listeners[type]) {
			this._listeners[type] = this._listeners[type].filter(
				(l) => l.listener !== listener
			);
		}
		originalRemoveEventListener.call(this, type, listener, options);
	};

	// Helper to calculate differences
	window.previousListenerCount = 0;
	window.previousIntervalCount = 0;

	// Debug method to print all active intervals, timeouts, and event listeners
	window.printDebugInfo = function () {
		console.log("Active Intervals:");
		console.log(`Total Intervals: ${window.intervals.size}`);
		console.log(
			`Interval Increase: ${
				window.intervals.size - window.previousIntervalCount
			}`
		);
		window.previousIntervalCount = window.intervals.size;

		console.log("Active Timeouts:");
		console.log(`Total Timeouts: ${window.timeouts.size}`);

		let totalListeners = 0;
		console.log("Event Listeners:");
		const allElements = [document, ...document.querySelectorAll("*")];
		allElements.forEach((elem) => {
			if (elem._listeners) {
				Object.keys(elem._listeners).forEach((type) => {
					elem._listeners[type].forEach((listener) => {
						totalListeners++;
						console.log(
							`Element: ${elem.tagName}, Type: ${type}, Listener: ${listener.listener}`
						);
					});
				});
			}
		});

		console.log(`Total Event Listeners: ${totalListeners}`);
		console.log(
			`Listener Increase: ${
				totalListeners - window.previousListenerCount
			}`
		);
		window.previousListenerCount = totalListeners;
	};
})();
