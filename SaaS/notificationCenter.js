/* NEWLOOK Enterprise Notification Center
 * Surfaces application messages, console output, browser errors and rejected promises on-screen.
 * Safe to load before application modules. Keeps native console behavior intact.
 */
(function () {
  'use strict';
  if (window.NEWLOOK_NOTIFICATION_CENTER) return;

  const MAX_ITEMS = 80;
  const history = [];
  let panel;
  let list;
  let count;
  let initialized = false;

  function stringify(value) {
    if (value instanceof Error) return value.message || String(value);
    if (typeof value === 'string') return value;
    if (value === undefined) return 'undefined';
    if (value === null) return 'null';
    try {
      return JSON.stringify(value, function (key, val) {
        if (typeof val === 'bigint') return `${val}n`;
        if (val instanceof Error) return { name: val.name, message: val.message, stack: val.stack };
        return val;
      });
    } catch (_) {
      return String(value);
    }
  }

  function messageText(args) {
    return args.map(stringify).join(' ');
  }

  function inferType(type, text) {
    if (type === 'error' || type === 'exception' || type === 'rejection') return 'error';
    if (type === 'warn') return 'warning';
    if (/\b(success|successful|saved|created|updated|completed|approved|activated|registered|synced|loaded|ready|sent|issued|processed|restored)\b/i.test(text)) return 'success';
    return type === 'info' || type === 'log' ? 'info' : 'info';
  }

  function ensureUI() {
    if (initialized || !document.body) return;
    initialized = true;
    const style = document.createElement('style');
    style.id = 'newlook-notification-center-style';
    style.textContent = `
      #newlookNotificationCenter{position:fixed;right:18px;bottom:18px;z-index:2147483000;width:min(430px,calc(100vw - 36px));font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;pointer-events:none}
      #newlookNotificationCenter .nc-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;padding:8px 10px;border:1px solid rgba(100,116,139,.22);border-radius:12px;background:rgba(15,23,42,.94);box-shadow:0 10px 30px rgba(0,0,0,.22);color:#fff;pointer-events:auto}
      #newlookNotificationCenter .nc-title{font-size:12px;font-weight:800;letter-spacing:.04em;text-transform:uppercase}
      #newlookNotificationCenter .nc-count{display:inline-flex;min-width:20px;height:20px;align-items:center;justify-content:center;border-radius:999px;background:#334155;font-size:11px;margin-left:6px}
      #newlookNotificationCenter .nc-actions{display:flex;gap:6px}
      #newlookNotificationCenter button{border:0;border-radius:8px;padding:6px 8px;background:#334155;color:#fff;font-size:11px;font-weight:700;cursor:pointer}
      #newlookNotificationCenter button:hover{background:#475569}
      #newlookNotificationCenter .nc-list{display:flex;flex-direction:column;gap:7px;max-height:min(62vh,520px);overflow:auto;pointer-events:auto}
      #newlookNotificationCenter .nc-item{display:grid;grid-template-columns:5px 1fr auto;gap:9px;align-items:start;padding:10px 11px;border:1px solid rgba(100,116,139,.2);border-radius:12px;background:rgba(255,255,255,.98);box-shadow:0 8px 25px rgba(0,0,0,.15);color:#0f172a}
      #newlookNotificationCenter .nc-bar{width:5px;min-height:36px;border-radius:8px;background:#64748b}
      #newlookNotificationCenter .nc-item.success .nc-bar{background:#16a34a}
      #newlookNotificationCenter .nc-item.info .nc-bar{background:#2563eb}
      #newlookNotificationCenter .nc-item.warning .nc-bar{background:#d97706}
      #newlookNotificationCenter .nc-item.error .nc-bar{background:#dc2626}
      #newlookNotificationCenter .nc-meta{display:flex;align-items:center;gap:7px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:#64748b;margin-bottom:3px}
      #newlookNotificationCenter .nc-text{font-size:12px;line-height:1.45;word-break:break-word;white-space:pre-wrap}
      #newlookNotificationCenter .nc-close{background:transparent;color:#64748b;padding:2px 4px;font-size:15px}
      #newlookNotificationCenter .nc-close:hover{background:#f1f5f9;color:#0f172a}
      #newlookNotificationCenter.nc-collapsed .nc-list{display:none}
      @media(max-width:600px){#newlookNotificationCenter{right:10px;bottom:10px;width:calc(100vw - 20px)}#newlookNotificationCenter .nc-list{max-height:55vh}}
    `;
    document.head.appendChild(style);
    panel = document.createElement('section');
    panel.id = 'newlookNotificationCenter';
    panel.setAttribute('aria-live', 'polite');
    panel.innerHTML = `<div class="nc-head"><div class="nc-title">System Messages <span class="nc-count">0</span></div><div class="nc-actions"><button type="button" data-nc="clear">Clear</button><button type="button" data-nc="toggle">Hide</button></div></div><div class="nc-list"></div>`;
    document.body.appendChild(panel);
    list = panel.querySelector('.nc-list');
    count = panel.querySelector('.nc-count');
    panel.querySelector('[data-nc="clear"]').addEventListener('click', function () { history.length = 0; render(); });
    panel.querySelector('[data-nc="toggle"]').addEventListener('click', function (event) {
      panel.classList.toggle('nc-collapsed');
      event.currentTarget.textContent = panel.classList.contains('nc-collapsed') ? 'Show' : 'Hide';
    });
  }

  function render() {
    ensureUI();
    if (!list) return;
    count.textContent = String(history.length);
    list.innerHTML = history.slice().reverse().map(function (item, index) {
      const safe = item.text.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      return `<article class="nc-item ${item.type}"><span class="nc-bar"></span><div><div class="nc-meta"><span>${item.type}</span><span>${item.time}</span><span>${item.source}</span></div><div class="nc-text">${safe}</div></div><button class="nc-close" type="button" data-nc-index="${history.length - 1 - index}" aria-label="Dismiss message">×</button></article>`;
    }).join('');
    list.querySelectorAll('[data-nc-index]').forEach(function (button) {
      button.addEventListener('click', function () {
        history.splice(Number(button.dataset.ncIndex), 1);
        render();
      });
    });
  }

  function push(type, args, source) {
    ensureUI();
    const text = messageText(Array.isArray(args) ? args : [args]);
    const finalType = inferType(type, text);
    history.push({ type: finalType, text: text || '(no message)', source: source || 'APP', time: new Date().toLocaleTimeString() });
    while (history.length > MAX_ITEMS) history.shift();
    render();
  }

  function nativeConsole(name, args) {
    try {
      const fn = window.__NEWLOOK_NATIVE_CONSOLE__ && window.__NEWLOOK_NATIVE_CONSOLE__[name];
      if (typeof fn === 'function') fn.apply(console, args);
    } catch (_) { /* never break application logging */ }
  }

  const native = {};
  ['log', 'info', 'warn', 'error'].forEach(function (name) {
    native[name] = console[name] ? console[name].bind(console) : function () {};
  });
  window.__NEWLOOK_NATIVE_CONSOLE__ = native;

  window.NEWLOOK_NOTIFICATION_CENTER = {
    show: function (message, type) { push(type || 'info', [message], 'APP'); },
    success: function (message) { push('success', [message], 'APP'); },
    info: function (message) { push('info', [message], 'APP'); },
    warning: function (message) { push('warning', [message], 'APP'); },
    error: function (message) { push('error', [message], 'APP'); },
    history: history,
    clear: function () { history.length = 0; render(); }
  };

  ['log', 'info', 'warn', 'error'].forEach(function (name) {
    console[name] = function () {
      const args = Array.prototype.slice.call(arguments);
      native[name].apply(console, args);
      push(name === 'warn' ? 'warning' : name, args, 'CONSOLE');
    };
  });

  window.addEventListener('error', function (event) {
    const detail = event.error && event.error.message ? event.error.message : event.message || 'Unknown browser error';
    push('error', [`${detail}${event.filename ? ` (${event.filename}:${event.lineno || 0})` : ''}`], 'BROWSER');
  });

  window.addEventListener('unhandledrejection', function (event) {
    push('rejection', [event.reason instanceof Error ? event.reason.message : event.reason || 'Unhandled promise rejection'], 'PROMISE');
  });

  const nativeAlert = window.alert ? window.alert.bind(window) : null;
  window.__NEWLOOK_NATIVE_ALERT__ = nativeAlert;
  window.alert = function (message) {
    const text = String(message == null ? '' : message);
    const type = /\b(fail|failed|error|denied|invalid|unable|cannot|not found|missing|expired|exceed|please)\b/i.test(text) ? 'error' : /\b(success|successful|saved|created|updated|completed|approved|activated|registered|issued|started|finished)\b/i.test(text) ? 'success' : 'info';
    push(type, [text], 'ALERT');
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureUI, { once: true });
  } else {
    ensureUI();
  }
})();
