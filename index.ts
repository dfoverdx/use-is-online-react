import { useSyncExternalStore } from 'react';

const NOOP_SUBSCRIBE = () => () => { };
const NON_POLLING_GET_SNAPSHOT = () => true;

/**
 * A react hook that returns whether or not the client is connected to the internet.
 *
 * @param poll Whether or not to periodically poll for online status. When `false`, simply returns
 * {@link navigator.onLine | `navigator.onLine`}. `navigator.onLine` may return a false positive if the client is
 * connected to any network even if it does not have access to the global internet. Enabling polling (the default
 * behavior) will make `useIsOnline` more accurate by periodically making a {@link fetch} request to a known endpoint.
 *
 * @returns `true` if the client is connected to the internet, else `false`.
 */
function useIsOnline(poll = true): boolean {
  const simpleIsOnline = useSyncExternalStore(subscribeToNavigator, getNavigatorSnapshot);
  const polledIsOnline = useSyncExternalStore(
    poll ? subscribeToPolling : NOOP_SUBSCRIBE,
    poll ? getPollSnapshot : NON_POLLING_GET_SNAPSHOT
  );
  return simpleIsOnline && (!poll || polledIsOnline);
}

namespace useIsOnline {
  /**
   * The interval (in milliseconds) at which to poll for online status if polling is enabled in the hook. Must be at
   * least `1000`, but recommended to be no lower than `5000`.
   *
   * @default 5000
   */
  export let pollInterval: number;

  /**
   * The URL to poll to detect internet connectivity.  If you want to detect internet connectivity to your server,
   * change this value to an HTTP/HTTPS GET endpoint provided by your server.  The response body is ignored.
   *
   * @default '//captive.apple.com/hotspot-detect.html'
   */
  export let pollingUrl: string = '//captive.apple.com/hotspot-detect.html';

  /** Set to `true` if you want messages logged via `console.debug`. */
  export let debug: boolean;
}

export default useIsOnline;
export { useIsOnline };

// navigator.onLine //
const subscribeToNavigator = (callback: () => void) => {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);

  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
};

const getNavigatorSnapshot = () => navigator.onLine;

// polling //
let intervalId: ReturnType<typeof setInterval> | undefined;
let pollInterval = 5000;
let isOnlinePoll = navigator.onLine;
let curPollerTokenId = 0;
let logDebug: typeof console.debug = () => { };
const pollers = new Set<number>();

Object.defineProperties(useIsOnline, {
  pollInterval: {
    get: () => pollInterval,
    set: (value: number) => {
      if (value < 1000) {
        throw new Error('useIsOnline.pollInterval must be at least 1000ms');
      }

      if (intervalId) {
        console.warn(
          `useIsOnline: Change to useIsOnline.pollInterval will not go into effect until all pollers are unregistered. Currently ${pollers.size} pollers are registered.`
        );
      }

      pollInterval = value;
      return value;
    }
  },
  debug: {
    get() { return !!logDebug; },
    set(value: boolean) {
      if (value) {
        logDebug = console.debug.bind(console);
      } else {
        logDebug = () => { };
      }

      return value;
    }
  }
});

function startPolling() {
  const token = curPollerTokenId++;
  pollers.add(token);
  logDebug(`useIsOnline: registered poller with token id ${token}`);

  if (intervalId) {
    logDebug(`useIsOnline: already polling ${useIsOnline.pollingUrl}`);
    return token;
  }

  logDebug(`useIsOnline: started polling ${useIsOnline.pollingUrl} every ${pollInterval}ms`);

  isOnlinePoll = true;
  intervalId = setInterval(() => {
    fetch(useIsOnline.pollingUrl, { cache: 'no-store' })
      .then(() => {
        logDebug(`useIsOnline: polled ${useIsOnline.pollingUrl} and determined connection is online`);

        if (!isOnlinePoll) {
          isOnlinePoll = true;
          window.dispatchEvent(new Event('polledOnline'));
        }
      })
      .catch(() => {
        logDebug(`useIsOnline: polled ${useIsOnline.pollingUrl} and determined connection is offline`);

        if (isOnlinePoll) {
          isOnlinePoll = false;
          window.dispatchEvent(new Event('polledOffline'));
        }
      });
  }, pollInterval);

  return token;
}

function stopPolling(token: number) {
  pollers.delete(token);
  logDebug(`useIsOnline: unregistered poller with token id ${token}`);

  if (!pollers.size) {
    clearInterval(intervalId);
    intervalId = undefined;
    logDebug(`useIsOnline: stopped polling ${useIsOnline.pollingUrl}`);
  } else {
    logDebug(`useIsOnline: still polling ${useIsOnline.pollingUrl} with ${pollers.size} pollers`);
  }
}

const subscribeToPolling = (callback: () => void) => {
  window.addEventListener('polledOnline', callback);
  window.addEventListener('polledOffline', callback);
  const token = startPolling();

  return () => {
    window.removeEventListener('polledOnline', callback);
    window.removeEventListener('polledOffline', callback);
    stopPolling(token);
  };
}

const getPollSnapshot = () => !intervalId || isOnlinePoll;
