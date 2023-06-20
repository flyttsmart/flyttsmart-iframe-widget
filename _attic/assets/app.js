function log(name, data, color) {
	const logElement = document.getElementById('log');

	// Create a new log entry
	const entry = document.createElement('div');
	entry.textContent = `${name}: ${JSON.stringify(data)}`;
	entry.style.color = color;

	// Append the new log entry to the log
	logElement.appendChild(entry);

	// Scroll to the bottom of the log
	logElement.scrollTop = logElement.scrollHeight;
}

document.addEventListener('DOMContentLoaded', function () {
	const userAgent = navigator.userAgent;
	const language = navigator.language || navigator.language;

	let device;
	if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
		device = 'tablet';
	} else if (/mobile/i.test(userAgent)) {
		device = 'smartphone';
	} else {
		device = 'desktop';
	}

	const environmentDetails = new CustomEvent('environmentDetails', {
		detail: {
			browser: navigator.userAgent,
			language: language,
			device: device
		}
	});

	window.dispatchEvent(environmentDetails);
});

window.addEventListener('environmentDetails', function (e) {
	console.log('Environment details:', e.detail);
});

window.addEventListener('load', () => {
	// Define Bootstrap breakpoints
	const breakpoints = {
		'xs': 0,
		'sm': 576,
		'md': 768,
		'lg': 992,
		'xl': 1200
	};

	let currentBreakpoint = null;

	const checkBreakpoint = () => {
		const viewportWidth = window.innerWidth;

		// Determine current breakpoint
		let newBreakpoint;
		if (viewportWidth < breakpoints.sm) {
			newBreakpoint = 'xs';
		} else if (viewportWidth < breakpoints.md) {
			newBreakpoint = 'sm';
		} else if (viewportWidth < breakpoints.lg) {
			newBreakpoint = 'md';
		} else if (viewportWidth < breakpoints.xl) {
			newBreakpoint = 'lg';
		} else {
			newBreakpoint = 'xl';
		}

		// If the breakpoint has changed, dispatch a custom event
		if (currentBreakpoint !== newBreakpoint) {
			window.dispatchEvent(new CustomEvent(newBreakpoint));
			currentBreakpoint = newBreakpoint;
		}
	};

	// Check the breakpoint initially and whenever the window is resized
	window.addEventListener('resize', checkBreakpoint);
	checkBreakpoint();
});

// Add event listeners for the custom events
window.addEventListener('xs', () => log('Viewport is x-small'));
window.addEventListener('sm', () => console.log('Viewport is small'));
window.addEventListener('md', () => console.log('Viewport is medium'));
window.addEventListener('lg', () => console.log('Viewport is large'));
window.addEventListener('xl', () => console.log('Viewport is x-large'));

var myHeaders = new Headers();
myHeaders.append("clientId", "9df13ab5-db6e-42ac-a67e-0c8906295688");
myHeaders.append("Content-Type", "application/json");
myHeaders.append("Authorization", "Bearer bdbd038af74752538e2ed09903f74ba869c59b66566624fde57e1b09d423b51d59d2908050e7027a05841d942abbe3c3424557d341e95527f5bb8e866d333f867b1839a08136681bb353957056dc63e5034a7e275ffc5b87b575e7d16952c24a6646e18730cfd43a4dc4fafc94cb6dbbce5b9405096b1f5113d480928ad032fcee0aee299d588dcf31397bd788a6188031ec83b559060aec2964df96bc2932b6edf5bcae0f69355149bd4a20529b0eb582dcd7abc88b3550386a8ae7dc656bfe41eb72baa4f9b7405ae3a0621501590129b79247eb6f31a196822b66156e5ea00ea8eb5a899ef7be2aa81c920130392c83fbb540788674306e151737c60d4670859a3cf995c3f3c7ffde23677eb2d87898900410453bba313caaba");

var raw = JSON.stringify({
	"pno": "196009195824"
});


var requestOptions = {
	method: 'POST',
	headers: myHeaders,
	body: raw,
	redirect: 'follow'
};

fetch("http://127.0.0.1:3000/external/users/login", requestOptions)
	.then(response => response.text())
	.then(result => console.log("RES !!!!!! ******", result))
	.catch(error => console.log('error', error));
