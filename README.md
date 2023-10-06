use-is-online-react
===================

A smart-ish React hook to determine if the user's device is online by checking for an internet connection. Improves on other available packages by optionally using a polling mechanism to determine if the computer is online.

Installation
------------

Install the package using npm or yarn:

```bash
npm install use-is-online-react
# or
yarn add use-is-online-react
```

Usage
-----

```javascript
import useIsOnline from 'use-is-online-react';

const MyComponent = () => {
  const isOnline = useIsOnline();

  return <div>{isOnline ? 'Online' : 'Offline'}</div>;
};
```

### Options

#### `useIsOnline(poll: boolean = true): boolean`

- `poll` (optional): A boolean indicating whether to use a smart polling mechanism to check for online status. Default is `true`. When set to `true`, it periodically polls `//captive.apple.com/hotspot-detect.html` (or whatever you set `useIsOnline.pollingUrl` to) to determine if the computer is online. When set to `false`, it simply uses `navigator.online`.

### Properties

- `useIsOnline.pollingInterval: number`: The interval (in milliseconds) at which to poll the `useIsOnline.pollingUrl` endpoint. Default is `5000` (5 seconds). Must be at least `1000`, but recommended to be at least `5000`. Value is ignored if `poll` is set to `false`.  Note: changes to this value will not go into effect until all polling has stopped and restarted.

- `useIsOnline.pollingUrl: string`: The URL to poll to determine if the computer is online. Default is `'//captive.apple.com/hotspot-detect.html'`. If you want to detect internet connectivity to your server, change this value to an HTTP/HTTPS GET endpoint provided by your server. The response body is ignored.

- `useIsOnline.debug: boolean`: A boolean indicating whether to log debug messages to the console. Default is `false`.

Peer Dependencies
-----------------

This package has the following peer dependencies:

- React version 18 or higher

Browser Support
---------------

This package uses the `fetch()` API, so it targets browsers supporting ES2015 or higher.

License
-------

This package is licensed under the [MIT License](LICENSE).

Credits
-------

Thanks to the npm package [is-online](https://github.com/sindresorhus/is-online) for the idea of using the `https://captive.apple.com/hotspot-detect.html` endpoint to determine if the computer is online.
