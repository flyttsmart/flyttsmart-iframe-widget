/**
 * Flyttsmart Auth API Client Class
 *
 * @class AuthClient
 * @extends EventTarget
 * @property {string} apiUrl - Flyttsmart backend API URL
 * @property {string} baseUrl - Base URL to use for deep linking
 * @property {string} clientId - Client ID
 * @property {string} pno - Personal Number
 */
class AuthClient extends EventTarget {
	/**
	 * Create an instance of AuthClient.
	 *
	 * @param {string} apiUrl - Flyttsmart backend API URL
	 * @param {string} baseUrl - Base URL to use for deep linking
	 * @param {string} clientId - Client ID
	 * @param {string} pno - Personal Number
	 */
	constructor(apiUrl, baseUrl, clientId, pno) {
		super();
		this.apiUrl = apiUrl;
		this.baseUrl = baseUrl;
		this.clientId = clientId;
		this.pno = pno;
		this.authCode = null;
		this.accessToken = null;
	}

	/**
	 * Get the auth code from the API.
	 *
	 * @returns {Promise<void>} - A Promise that resolves when the auth code is received.
	 */
	getAuthCode() {
		return fetch(`${this.apiUrl}/external/code`, {
			method: 'POST',
			headers: { 'clientId': this.clientId }
		})
			.then(response => {
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				return response.text();
			})
			.then(authCode => {
				this.authCode = authCode;
				this.dispatchEvent(new CustomEvent('statusEvent', {
					detail: {
						statusText: 'Auth code received...',
						statusType: 'success'
					}
				}));
			})
			.catch(error => {
				this.dispatchEvent(new CustomEvent('statusEvent', {
					detail: {
						statusText: error.message,
						statusType: 'error'
					}
				}));
			});
	}

	/**
	 * Get the access token from the API.
	 *
	 * @returns {Promise<void>} - A Promise that resolves when the access token is received.
	 */
	getAccessToken() {
		return this.getAuthCode()
			.then(() => {
				return fetch(`${this.apiUrl}/external/token`, {
					method: 'POST',
					headers: {
						'clientId': this.clientId,
						'Content-Type': 'application/json',
						'Authorization': 'Basic ' + btoa(this.clientId + ':' + this.authCode)
					},
					body: JSON.stringify({ authCode: this.authCode })
				});
			})
			.then(response => {
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				return response.json();
			})
			.then(responseBody => {
				this.accessToken = responseBody.accessToken;
				this.dispatchEvent(new CustomEvent('statusEvent', {
					detail: {
						statusText: 'Access token received...',
						statusType: 'success'
					}
				}));
			})
			.catch(error => {
				this.dispatchEvent(new CustomEvent('statusEvent', {
					detail: {
						statusText: error.message,
						statusType: 'error'
					}
				}));
			});
	}

	/**
	 * Login the user.
	 *
	 * @returns {Promise<void>} - A Promise that resolves when the user is logged in.
	 */
	loginUser() {
		return this.getAccessToken()
			.then(() => {
				return fetch(`${this.apiUrl}/external/users/login`, {
					method: 'POST',
					headers: {
						'clientId': this.clientId,
						'Content-Type': 'application/json',
						'Authorization': 'Bearer ' + this.accessToken
					},
					body: JSON.stringify({ pno: this.pno })
				});
			})
			.then(response => {
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				return response.text();
			})
			.then(rawBody => {
				const data = JSON.parse(rawBody);
				const url = new URL("https://" + data.url);
				this.accessToken = url.searchParams.get("token");
				console.debug("*** this.accessToken ::", this.accessToken);
				this.dispatchEvent(new CustomEvent('statusEvent', {
					detail: {
						statusText: 'User logged in...',
						statusType: 'success',
						token: this.accessToken
					}
				}));
			})
			.catch(error => {
				this.dispatchEvent(new CustomEvent('statusEvent', {
					detail: {
						statusText: error.message,
						statusType: 'error'
					}
				}));
			});
	}

	addEventListener(type, callback, options) {
	}

	dispatchEvent(event) {
		return false;
	}

	removeEventListener(type, callback, options) {
	}
}

/**
 * Flyttsmart IFRAME API
 *
 * @namespace flyttSmartApi
 */
(function (global) {
	const flyttSmartApi = {
		iFrameOrigin: undefined,
		uiElements: {
			widgetOwner: null,
			statusEl: null,
			widgetFrame: null
		},
		isInitialized: false,
		apiUrl: 'https://api.flyttsmart.se',
		domElement: '#flyttsmartWidget',
		baseUrl: '',
		clientId: '',
		pno: '',
		eventListeners: {
			onEvent: [],
			onCmdRequest: []
		},
		client: AuthClient,
		/**
		 * Set the properties for the Flyttsmart IFRAME API.
		 *
		 * @memberof flyttSmartApi
		 * @param {object} props - The properties to set.
		 */
		setProperties: function (props) {
			for (let prop in props) {
				if (this.hasOwnProperty(prop)) {
					this[prop] = props[prop];
				}
			}
			this.init();
		},
		/**
		 * Document ready event handler.
		 *
		 * @memberof flyttSmartApi
		 */
		onDOMReady: function () {
			if (!this.isInitialized) {
				this.initUI();
				this.isInitialized = true;
			}
		},
		/**
		 * Initialize the IFrame API.
		 *
		 * @memberof flyttSmartApi
		 * @param {object} props - The initialization properties.
		 * @returns {flyttSmartApi} - The flyttSmartApi object.
		 */
		init: function (props) {
			this.apiUrl = props.apiUrl || this.apiUrl;
			this.clientId = props.clientId || this.clientId;
			this.pno = props.pno || this.pno;
			this.domElement = props.domElement || this.domElement;
			this.baseUrl = props.baseUrl || this.baseUrl;
			this.authClient = new AuthClient(this.apiUrl, this.baseUrl, this.clientId, this.pno);
			this.doCommand('API:INIT', props);
			return this;
		},

		/**
		 * Initialize the UI.
		 *
		 * @memberof flyttSmartApi
		 */
		initUI: function () {
			console.log("initUI ::", this.domElement);
			const widgetOwner = document.querySelector(this.domElement);
			if (!widgetOwner) {
				console.log('Error: Widget Owner not found');
				return;
			}
			const statusEl = document.createElement('div');
			const widgetFrame = document.createElement('iframe');
			widgetOwner.appendChild(statusEl);
			widgetOwner.appendChild(widgetFrame);

			widgetFrame.style.display = 'none';

			this.authClient.addEventListener('statusEvent', (event) => {
				statusEl.textContent = event.detail.statusText;
				if (event.detail.statusType === 'error') {
					statusEl.style.color = 'red';
				} else {
					statusEl.style.color = 'black';
					if (event.detail.statusText === 'User logged in...') {
						statusEl.style.display = 'none';
						widgetFrame.style.display = 'block';
						IFRAME_URL += "?token=" + this.authClient.accessToken;
						widgetFrame.src = IFRAME_URL;
					}
				}
			});

			this.doCommand('API:INIT_UI');
		},

		/**
		 * Initialize the iframe.
		 *
		 * @memberof flyttSmartApi
		 * @param {HTMLIFrameElement} iframe - The iframe element to initialize.
		 * @returns {Promise<void>} - A Promise that resolves when the iframe is initialized.
		 */
		initIframe: async function (iframe) {
			return new Promise((resolve, reject) => {
				iframe.onload = () => {
					let intervalId = null;
					let isIntervalActive = true;

					window.addEventListener('message', event => {
						// IMPORTANT: Check the origin of the data!
						if (this.iFrameOrigin && event.origin !== this.iFrameOrigin) return;

						if (event.data.type === 'PONG' && isIntervalActive) {
							clearInterval(intervalId);
							isIntervalActive = false;
							iframe.contentWindow.postMessage({ type: 'ACCESS', accessToken: this.authClient.accessToken });
						}
					}, false);

					intervalId = setInterval(() => {
						if (isIntervalActive) {
							iframe.contentWindow.postMessage({ type: 'PING' }, '*');
						}
					}, 1000);

					resolve();
				};

				this.authClient.loginUser()
					.catch(error => {
						reject(error);
					});
			});
		},

		/**
		 * Initialize the debug widget.
		 *
		 * @memberof flyttSmartApi
		 * @param {object} props - The initialization properties.
		 */
		initDebugWidget: function (props) {
			this.initUI();
		},

		/**
		 * Execute a command.
		 *
		 * @memberof flyttSmartApi
		 * @param {string} name - The name of the command.
		 * @param {*} val - The value of the command.
		 */
		doCommand: function (name, val) {
			this.triggerEvent('onCmdRequest', { cmd: name, value: val });
		},

		/**
		 * Add an event listener for events.
		 *
		 * @memberof flyttSmartApi
		 * @param {function} listener - The event listener function.
		 */
		onEvent: function (listener) {
			this.addEventListener('onEvent', listener);
		},

		/**
		 * Add an event listener for command requests.
		 *
		 * @memberof flyttSmartApi
		 * @param {function} listener - The event listener function.
		 */
		onCmdRequest: function (listener) {
			this.addEventListener('onCmdRequest', listener);
		},

		/**
		 * Trigger an event.
		 *
		 * @memberof flyttSmartApi
		 * @param {string} eventName - The name of the event.
		 * @param {object} event - The event object.
		 */
		triggerEvent: function (eventName, event) {
			this.eventListeners[eventName].forEach(listener => listener(event));
		},

		/**
		 * Add an event listener.
		 *
		 * @memberof flyttSmartApi
		 * @param {string} eventName - The name of the event.
		 * @param {function} listener - The event listener function.
		 */
		addEventListener: function (eventName, listener) {
			if (typeof listener === "function") {
				this.eventListeners[eventName].push(listener);
			}
		}
	};

	global.flyttSmartApi = flyttSmartApi;

	document.addEventListener("DOMContentLoaded", function () {
		flyttSmartApi.onDOMReady();
	});

})(window);


//
// Init API,
// Attach event listeners, etc...

const debug = true;
const DEBUG_URL = "http://localhost:3020/iframe.html";
const EMBED_URL = "https://www.flyttsmart.se";
var IFRAME_URL = debug ? DEBUG_URL : EMBED_URL;


/**
 * Initialize the widget.
 *
 * @param {object} settings - The widget configuration settings.
 */
function initWidget(settings) {
	globalThis.flyttSmartApi.setProperties(settings);
}

globalThis.initWidget = initWidget;
