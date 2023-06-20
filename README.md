# Flyttsmart IFrame Widget API

This project allows you to embed Flyttsmart services into your website using an IFrame. The Flyttsmart IFrame Widget API is designed for easy implementation and robust customization.

## Description

The Flyttsmart IFrame Widget is a customizable, responsive widget that you can embed into your web page. It communicates with Flyttsmart's backend via API calls, handles user interactions and responses accordingly.

This widget is built with pure JavaScript without the need for any external libraries. However, if your project is in a Node.js environment, you can use some NPM packages for development and testing. More details are in the **Development Setup** section.

## Features

- Fully customizable look and feel.
- Provides detailed logs for debugging.
- Easy to implement with only a few lines of code.
- Works with any modern web browser.

## Prerequisites

The widget needs a client ID and personal number (PNO) to be passed to the `init` function. You must get these credentials from the Flyttsmart API platform.

## Usage

```javascript
const FLYTTSMART_SETTINGS = {
    apiUrl: 'https://api.flyttsmart.se',
    baseUrl: 'http://localhost:3000',
    clientId: '5f1b0b3b4b0b0b0b0b0b0b0b',
    pno: '199001010000',
    domElement: '#flyttsmartWidget',
};

flyttSmartApi.init(FLYTTSMART_SETTINGS);
flyttSmartApi.initUI();
```

Where:
- `apiUrl` - the base URL for the Flyttsmart API.
- `baseUrl` - the base URL for your app.
- `clientId` - your client ID.
- `pno` - a valid personal number.
- `domElement` - the DOM element where the widget will be loaded.

## Development Setup

This project can be developed using any code editor. If you're using Node.js environment, any of these NPM packages can be used:

- **eslint** - for enforcing a consistent coding style.
- **prettier** - for automatic code formatting.
- **jest** - for running tests.  
- **mocha** - for running tests.


To install required packages, run the following command:

```bash
npm install --save-dev eslint prettier jest
```

## Debugging

For more detailed log messages, the API has a `debug` flag that can ne turned on like this:

```javascript
flyttSmartApi.debug = true;
```

Do not use debugging in production environments as it can expose sensitive information in the logs.
