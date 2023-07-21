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
			headers: {'clientId': this.clientId}
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
					body: JSON.stringify({authCode: this.authCode})
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
					body: JSON.stringify({pno: this.pno})
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
				if (this.debug) console.debug("*** this.accessToken ::", this.accessToken);
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
		super.addEventListener(type, callback, options);
	}

	dispatchEvent(event) {
		return super.dispatchEvent(event);
	}

	removeEventListener(type, callback, options) {
		super.removeEventListener(type, callback, options);
	}
}

/**
 * Flyttsmart IFRAME API
 *
 * @namespace flyttSmartApi
 */
(function (global) {
	const flyttSmartApi = {
		debugMode: false,
		iFrameOrigin: undefined,
		uiElements: {
			widgetOwner: null,
			statusEl: null,
			widgetFrame: null
		},
		isInitialized: false,
		apiUrl: 'https://api.flyttsmart.se',
		domElementId: '#flyttsmartWidget',
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
		assignSettings: function (props) {
			props = props || {};

			if (props.domElementId.length > 1 && props.domElementId.charAt(0) !== '#') {
				props.domElementId = `#${props.domElementId}`;
			}

			if (!props.clientId || !props.pno) {
				throw new Error('Missing required settings!');
			}

			for (let prop in props) {
				if (this.hasOwnProperty(prop)) {
					this[prop] = props[prop];
				}
			}
		},

		debugDump: function () {
			if (!this.debugMode) return;
			const result = {
				data: this.this
			};

			console.debug("flyttSmartApi ::", this);

			return JSON.stringify(result, null, 4);
		},

		/**
		 * Document ready event handler.
		 *
		 * @memberof flyttSmartApi
		 */
		onDOMReady: function () {
			this.domReady = true;
			const settings = document.flyttSmartSettings || window.flyttSmartSettings;

			if (settings) {
				this.init(settings);
			}
		},

		navigateTo: function (url) {
			this.uiElements.widgetFrame.src = url;
		},
		/**
		 * Initialize the IFrame API.
		 *
		 * @memberof flyttSmartApi
		 * @param {object} props - The initialization properties.
		 * @returns {flyttSmartApi} - The flyttSmartApi object.
		 */
		init: async function (props) {
			if (!this.domReady) {
				throw new Error('init() cannot be called unless DOM is ready!');
			}

			return new Promise((resolve, reject) => {
				this.apiUrl = props.apiUrl || this.apiUrl;
				this.clientId = props.clientId || this.clientId;
				this.pno = props.pno || this.pno;
				this.domElementId = props.domElement || this.domElementId;
				this.baseUrl = props.baseUrl || this.baseUrl;
				try {
					this.authClient = new AuthClient(this.apiUrl, this.baseUrl, this.clientId, this.pno);
					this.doCommand('API:INIT', props);

					this.initUI();

					resolve();
				} catch (error) {
					reject(error);
				}
			});
		},

		log: function (data) {
			if (!this.debugMode) return;
			console.log(data);
		},

		/**
		 * Initialize the UI.
		 *
		 * @memberof flyttSmartApi
		 */
		initUI: function () {
			if (!this.authClient) {
				throw new Error('initUI cannot be called before init.');
			}

			if (this.isInitialized) return;
			this.isInitialized = true;

			this.log("initUI ::", this.domElementId);
			const widgetOwner = document.querySelector(this.domElementId);
			if (!widgetOwner) {
				this.log('Error: Widget Owner not found');
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

			this.initIframe(widgetFrame).then(() => {
				this.doCommand('API:INIT_UI');
			}).catch((error) => {
				this.log('initIframe ::', error);
			});
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
							iframe.contentWindow.postMessage({type: 'ACCESS', accessToken: this.authClient.accessToken});
						}
					}, false);

					intervalId = setInterval(() => {
						if (isIntervalActive) {
							iframe.contentWindow.postMessage({type: 'PING'}, '*');
							console.log("POST MESSAGE");
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
			this.debugMode = true;
			this.init(props);
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

const debug = false;
const DEBUG_URL = "http://localhost:3020/iframe.html";
const EMBED_URL = "https://www.flyttsmart.se";
var IFRAME_URL = debug ? DEBUG_URL : EMBED_URL;


/**
 * Initialize the widget.
 *
 * @param {object} settings - The widget configuration settings.
 */
function initWidget(settings) {
	globalThis.flyttSmartApi.assignSettings(setting);
}

globalThis.initWidget = initWidget;
