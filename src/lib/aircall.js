import AircallWorkspace from 'aircall-everywhere';

let _instance = null;

export function initAircall(domSelector, { onLogin, onLogout } = {}) {
  if (_instance) return _instance;

  _instance = new AircallWorkspace({
    domToLoadWorkspace: domSelector,
    // Omit size → SDK default 'big' = 376×666px, the dimensions the workspace is designed for
    debug: import.meta.env.DEV,
    onLogin: (settings) => {
      console.log('[Aircall] onLogin fired', settings);
      onLogin && onLogin(settings);
    },
    onLogout: () => {
      console.log('[Aircall] onLogout fired');
      onLogout && onLogout();
    },
  });

  return _instance;
}

export function getAircall() {
  return _instance;
}

export function destroyAircall() {
  _instance = null;
}

export function dial(phoneNumber) {
  return new Promise((resolve, reject) => {
    if (!_instance) {
      reject({ error: 'not_initialized' });
      return;
    }
    _instance.send('dial_number', { phone_number: phoneNumber }, (success, data) => {
      if (success) resolve({ success: true, data });
      else reject({ error: data?.error || data?.code || 'unknown_error', data });
    });
  });
}

export function onCallEvent(name, cb) {
  if (!_instance) return;
  _instance.on(name, cb);
}

export function offCallEvent(name) {
  if (!_instance) return;
  _instance.removeListener(name);
}

export function isLoggedIn() {
  return new Promise((resolve) => {
    if (!_instance) { resolve(false); return; }
    _instance.isLoggedIn((res) => resolve(!!res));
  });
}
