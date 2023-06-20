// Import the unit testing stuff
// make sure to install mocha and chai with npm

const { assert } = chai;

// Unit tests for the AuthClient class
describe('AuthClient', () => {
	let authClient;

	// Before each test, create a new instance of AuthClient
	beforeEach(() => {
		authClient = new AuthClient(
			'https://api.flyttsmart.se',
			'http://localhost:3000',
			'5f1b0b3b4b0b0b0b0b0b0b0b',
			'199001010000'
		);
	});

	// Unit test for the getAuthCode method
	describe('getAuthCode', () => {
		it('should resolve with the auth code when successful', async () => {
			const expectedAuthCode = '123456';

			// Mock the fetch response
			global.fetch = sinon.stub().resolves({
				ok: true,
				text: sinon.stub().resolves(expectedAuthCode)
			});

			await authClient.getAuthCode();

			assert.strictEqual(authClient.authCode, expectedAuthCode);
		});

		it('should reject with an error message when fetch fails', async () => {
			const expectedErrorMessage = 'HTTP error! status: 500';

			// Mock the fetch response
			global.fetch = sinon.stub().resolves({
				ok: false,
				status: 500
			});

			try {
				await authClient.getAuthCode();
				assert.fail('Should have thrown an error');
			} catch (error) {
				assert.strictEqual(error.message, expectedErrorMessage);
			}
		});
	});

	// Unit test for the getAccessToken method
	describe('getAccessToken', () => {
		it('should resolve with the access token when successful', async () => {
			const expectedAccessToken = 'abcdef123456';

			// Mock the fetch responses
			global.fetch.onFirstCall().resolves({
				ok: true,
				json: sinon.stub().resolves({ accessToken: expectedAccessToken })
			});
			global.fetch.onSecondCall().resolves({
				ok: true,
				text: sinon.stub().resolves('{"url": "https://example.com?token=abcdef123456"}')
			});

			await authClient.getAccessToken();

			assert.strictEqual(authClient.accessToken, expectedAccessToken);
		});

		it('should reject with an error message when fetch fails', async () => {
			const expectedErrorMessage = 'HTTP error! status: 404';

			// Mock the fetch responses
			global.fetch.onFirstCall().resolves({
				ok: false,
				status: 404
			});

			try {
				await authClient.getAccessToken();
				assert.fail('Should have thrown an error');
			} catch (error) {
				assert.strictEqual(error.message, expectedErrorMessage);
			}
		});
	});

	// Unit test for the loginUser method
	describe('loginUser', () => {
		it('should resolve with the access token when successful', async () => {
			const expectedAccessToken = 'abcdef123456';

			// Mock the fetch responses
			global.fetch.onFirstCall().resolves({
				ok: true,
				json: sinon.stub().resolves({ accessToken: expectedAccessToken })
			});
			global.fetch.onSecondCall().resolves({
				ok: true,
				text: sinon.stub().resolves('{"url": "https://example.com?token=abcdef123456"}')
			});

			await authClient.loginUser();

			assert.strictEqual(authClient.accessToken, expectedAccessToken);
		});

		it('should reject with an error message when fetch fails', async () => {
			const expectedErrorMessage = 'HTTP error! status: 403';

			// Mock the fetch responses
			global.fetch.onFirstCall().resolves({
				ok: false,
				status: 403
			});

			try {
				await authClient.loginUser();
				assert.fail('Should have thrown an error');
			} catch (error) {
				assert.strictEqual(error.message, expectedErrorMessage);
			}
		});
	});
});

// Unit tests for the flyttSmartApi object
describe('flyttSmartApi', () => {
	let widgetOwner;
	let statusEl;
	let widgetFrame;

	// Before each test, create the necessary DOM elements
	beforeEach(() => {
		widgetOwner = document.createElement('div');
		statusEl = document.createElement('div');
		widgetFrame = document.createElement('iframe');

		widgetOwner.id = 'flyttsmartWidget';
		widgetOwner.appendChild(statusEl);
		widgetOwner.appendChild(widgetFrame);

		document.body.appendChild(widgetOwner);
	});

	// After each test, clean up the DOM elements
	afterEach(() => {
		document.body.innerHTML = '';
	});

	// Unit test for the initUI method
	describe('initUI', () => {
		it('should initialize the UI elements and attach event listeners', () => {
			const authClient = new AuthClient(
				'https://api.flyttsmart.se',
				'http://localhost:3000',
				'5f1b0b3b4b0b0b0b0b0b0b0b',
				'199001010000'
			);

			// Mock the authClient methods
			sinon.stub(authClient, 'addEventListener');
			sinon.stub(authClient, 'loginUser').resolves();

			flyttSmartApi.authClient = authClient;
			flyttSmartApi.initUI();

			assert.strictEqual(widgetOwner.childElementCount, 2);
			assert.strictEqual(widgetOwner.querySelector('div'), statusEl);
			assert.strictEqual(widgetOwner.querySelector('iframe'), widgetFrame);
			assert.strictEqual(authClient.addEventListener.callCount, 1);
			assert.strictEqual(authClient.loginUser.callCount, 1);
		});
	});

	// Unit test for the initIframe method
	describe('initIframe', () => {
		it('should initialize the iframe and post messages', async () => {
			const authClient = new AuthClient(
				'https://api.flyttsmart.se',
				'http://localhost:3000',
				'5f1b0b3b4b0b0b0b0b0b0b0b',
				'199001010000'
			);
			const accessToken = 'abcdef123456';

			// Mock the authClient methods
			sinon.stub(authClient, 'loginUser').resolves();
			authClient.accessToken = accessToken;

			flyttSmartApi.authClient = authClient;
			await flyttSmartApi.initIframe(widgetFrame);

			assert.strictEqual(widgetFrame.onload.callCount, 1);
			assert.strictEqual(widgetFrame.style.display, 'block');
		});

		it('should reject with an error message when loginUser fails', async () => {
			const authClient = new AuthClient(
				'https://api.flyttsmart.se',
				'http://localhost:3000',
				'5f1b0b3b4b0b0b0b0b0b0b0b',
				'199001010000'
			);
			const expectedErrorMessage = 'Failed to log in user';

			// Mock the authClient methods
			sinon.stub(authClient, 'loginUser').rejects(new Error(expectedErrorMessage));

			flyttSmartApi.authClient = authClient;

			try {
				await flyttSmartApi.initIframe(widgetFrame);
				assert.fail('Should have thrown an error');
			} catch (error) {
				assert.strictEqual(error.message, expectedErrorMessage);
			}
		});
	});
});

// Run the tests
mocha.run();
