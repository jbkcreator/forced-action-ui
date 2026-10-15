(function () {
  'use strict';

  var apiMeta = document.querySelector('meta[name="api-base"]');
  var BASE = (apiMeta && apiMeta.content) || '/api/lending/routing';
  var KEY = 'ndl_routing_admin_secret';
  var app = document.getElementById('app');
  var lockBtn = document.getElementById('lock');

  var secret = '';
  try { secret = sessionStorage.getItem(KEY) || ''; } catch (e) { secret = ''; }

  var meta = null;
  var state = { tab: 'lenders', lenders: [], openEdit: null, openBoxes: null, files: [], fileFilter: { status: '', q: '' }, selectedFile: null, reasons: [] };

  // ---------- helpers ----------

  // Builds DOM only through textContent / attributes. Borrower names are untrusted, so no innerHTML anywhere.
  function h(tag, props) {
    var el = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) {
      var v = props[k];
      if (v === false || v === null || v === undefined) return;
      if (k === 'class') el.className = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else if (k === 'value') el.value = v;
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    });
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }
  function append(el, kid) {
    if (kid === null || kid === undefined || kid === false) return;
    if (Array.isArray(kid)) { kid.forEach(function (k) { append(el, k); }); return; }
    el.appendChild(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }

  function fileRef(f) { return { id: f.file_id, source: f.source }; }
  function sameFile(a, b) { return !!a && !!b && a.id === b.id && a.source === b.source; }
  function fileQuery(ref) { return '?source=' + encodeURIComponent(ref.source); }
  function fileLabel(f) { return (f.source === 'partner' ? 'Partner file #' : 'File #') + f.file_id; }
  function fromWhere(f) { return f.source === 'partner' ? 'Partner' + (f.partner_name ? ': ' + f.partner_name : '') : 'LendingFlow'; }

  function money(n) { return (n === null || n === undefined) ? '—' : '$' + Number(n).toLocaleString('en-US'); }
  function when(iso) { return iso ? new Date(iso).toLocaleString() : ''; }
  function title(s) { return String(s || '').replace(/_/g, ' ').toLowerCase().replace(/(^| )\w/g, function (c) { return c.toUpperCase(); }); }

  function toast(message, kind) {
    var box = document.getElementById('toast');
    var note = h('div', { class: kind === 'error' ? 'error' : '' }, message);
    box.appendChild(note);
    setTimeout(function () { if (note.parentNode) note.parentNode.removeChild(note); }, kind === 'error' ? 8000 : 3500);
  }

  function detailText(detail) {
    if (!detail) return 'Request failed';
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) return detail.map(function (d) { return (d.loc ? d.loc.slice(1).join('.') + ': ' : '') + d.msg; }).join('; ');
    return JSON.stringify(detail);
  }

  function api(path, opts) {
    opts = opts || {};
    var headers = { 'X-Routing-Admin-Secret': secret };
    var init = { method: opts.method || 'GET', headers: headers };
    if (opts.body !== undefined) { headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(opts.body); }
    return fetch(BASE + path, init).then(function (res) {
      if (res.status === 401 || res.status === 503) {
        var wasLocked = !secret;
        lock(res.status === 503 ? 'The routing admin is not configured on the server.' : (wasLocked ? '' : 'The secret was not accepted.'));
        throw new Error('locked');
      }
      if (res.status === 204) return null;
      return res.text().then(function (text) {
        var data = null;
        try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }
        if (!res.ok) throw new Error(detailText(data && data.detail) + ' (' + res.status + ')');
        return data;
      });
    });
  }

  function guard(promise) {
    return promise.catch(function (err) { if (err.message !== 'locked') toast(err.message, 'error'); throw err; });
  }

  function intOrNull(value, label) {
    var s = String(value).trim().replace(/[$,\s]/g, '');
    if (s === '') return null;
    var n = Number(s);
    if (!isFinite(n) || Math.floor(n) !== n) throw new Error(label + ' must be a whole number');
    return n;
  }
  function pctOrNull(value, label) {
    var s = String(value).trim().replace('%', '');
    if (s === '') return null;
    var n = Number(s);
    if (!isFinite(n) || n < 0 || n > 1000) throw new Error(label + ' must be a percentage');
    return Math.round(n * 100) / 10000;
  }
  function field(label, input, hint) {
    var id = 'f' + Math.random().toString(36).slice(2, 9);
    input.id = id;
    return h('div', null, h('label', { for: id }, label), input, hint ? h('div', { class: 'hint' }, hint) : null);
  }
  function check(label, checked) {
    var id = 'c' + Math.random().toString(36).slice(2, 9);
    var box = h('input', { type: 'checkbox', id: id, checked: checked });
    return { el: h('div', { class: 'check' }, box, h('label', { for: id }, label)), box: box };
  }

  // ---------- gate ----------

  function lock(message) {
    secret = '';
    try { sessionStorage.removeItem(KEY); } catch (e) { /* private mode */ }
    lockBtn.hidden = true;
    renderGate(message);
  }

  function renderGate(message) {
    clear(app);
    var input = h('input', { type: 'password', autocomplete: 'off', autofocus: true });
    var form = h('form', { class: 'panel gate', onsubmit: function (ev) {
      ev.preventDefault();
      secret = input.value.trim();
      if (!secret) return;
      start();
    } },
      h('h2', null, 'Unlock lender routing'),
      h('p', null, 'Enter the routing admin secret. It is kept only for this browser tab and cleared when you lock or close the tab.'),
      message ? h('p', { class: 'error' }, message) : null,
      field('Admin secret', input),
      h('p', null, h('button', { class: 'btn', type: 'submit' }, 'Unlock'))
    );
    app.appendChild(form);
    input.focus();
  }

  function start() {
    api('/meta').then(function (m) {
      meta = m;
      try { sessionStorage.setItem(KEY, secret); } catch (e) { /* private mode */ }
      lockBtn.hidden = false;
      renderShell();
      return switchTab(state.tab);
    }).catch(function (err) {
      if (err.message !== 'locked') renderGate(err.message);
    });
  }

  lockBtn.addEventListener('click', function () { lock(''); });

  // ---------- shell and tabs ----------

  var TABS = [['lenders', 'Lenders'], ['files', 'Files'], ['hold', 'Hold queue'], ['reasons', 'Decline reasons']];

  function renderShell() {
    clear(app);
    var tabs = h('div', { class: 'tabs', role: 'tablist' });
    TABS.forEach(function (t) {
      tabs.appendChild(h('button', {
        class: 'tab', role: 'tab', type: 'button', 'data-tab': t[0], 'aria-selected': String(state.tab === t[0]),
        onclick: function () { switchTab(t[0]); }
      }, t[1]));
    });
    app.appendChild(tabs);
    app.appendChild(h('div', { id: 'view' }));
  }

  function switchTab(name) {
    state.tab = name;
    Array.prototype.forEach.call(app.querySelectorAll('.tab'), function (b) {
      b.setAttribute('aria-selected', String(b.getAttribute('data-tab') === name));
    });
    var loader = { lenders: loadLenders, files: loadFiles, hold: loadHold, reasons: loadReasons }[name];
    return loader();
  }
  function view() { return document.getElementById('view'); }

  // ---------- lenders ----------

  function loadLenders() {
    return guard(api('/lenders')).then(function (rows) {
      state.lenders = rows;
      renderLenders();
    });
  }

  function renderLenders() {
    var v = view();
    clear(v);
    var addPanel = h('div', { id: 'add-lender' });
    v.appendChild(h('div', { class: 'bar' },
      h('h2', { class: 'grow' }, 'Lenders, in waterfall order'),
      h('button', { class: 'btn gold', type: 'button', id: 'add-lender-btn', onclick: function () { toggleAddLender(addPanel); } }, 'Add lender')
    ));
    v.appendChild(h('p', { class: 'hint' }, 'The primary lender gets first look. A lender is only ever routed to when it is Signed and Active. Changes apply to the next file routed; no deploy is needed.'));
    v.appendChild(addPanel);

    if (!state.lenders.length) { v.appendChild(h('div', { class: 'empty' }, 'No lenders yet. Add one to start routing.')); return; }

    var tbody = h('tbody');
    state.lenders.forEach(function (l, i) {
      tbody.appendChild(lenderRow(l, i));
      if (state.openEdit === l.id) tbody.appendChild(h('tr', null, h('td', { colspan: 8, class: 'boxcell' }, editPanel(l))));
      if (state.openBoxes === l.id) tbody.appendChild(h('tr', null, h('td', { colspan: 8, class: 'boxcell' }, h('div', { id: 'boxes-' + l.id }, 'Loading boxes…'))));
    });
    v.appendChild(h('div', { class: 'scroll' }, h('table', { id: 'lenders-table' },
      h('thead', null, h('tr', null,
        ['Order', 'Lender', 'Agreement', 'Status', 'Seat cap / month', 'Ground-up min', 'Takes ground-up', 'Actions'].map(function (c) { return h('th', null, c); }))),
      tbody)));
    if (state.openBoxes !== null) renderBoxes(state.openBoxes);
  }

  function lenderRow(l, index) {
    var last = index === state.lenders.length - 1;
    var statusSelect = h('select', { 'aria-label': 'Agreement status for ' + l.name, onchange: function (ev) {
      patchLender(l.id, { agreement_status: ev.target.value }, 'Agreement set to ' + ev.target.value);
    } }, meta.agreement_statuses.map(function (s) { return h('option', { value: s, selected: s === l.agreement_status }, s); }));
    return h('tr', { 'data-lender': l.id },
      h('td', null, h('div', { class: 'order' },
        h('button', { class: 'btn ghost small', type: 'button', 'aria-label': 'Move ' + l.name + ' up', disabled: index === 0, onclick: function () { move(index, -1); } }, '▲'),
        h('button', { class: 'btn ghost small', type: 'button', 'aria-label': 'Move ' + l.name + ' down', disabled: last, onclick: function () { move(index, 1); } }, '▼'))),
      h('td', null, h('strong', null, l.name), ' ', l.is_primary ? h('span', { class: 'badge primary' }, 'Primary') : null),
      h('td', null, statusSelect),
      h('td', null, h('span', { class: 'badge ' + (l.active ? 'ok' : 'warn') }, l.active ? 'Active' : 'Paused')),
      h('td', { class: 'num' }, l.monthly_cap === null ? 'No cap' : l.monthly_cap),
      h('td', { class: 'num' }, money(l.construction_min_amount)),
      h('td', null, l.takes_ground_up ? 'Yes' : 'No'),
      h('td', null, h('div', { class: 'actions' },
        h('button', { class: 'btn small', type: 'button', onclick: function () { state.openEdit = state.openEdit === l.id ? null : l.id; renderLenders(); } }, 'Edit'),
        h('button', { class: 'btn small', type: 'button', onclick: function () { state.openBoxes = state.openBoxes === l.id ? null : l.id; renderLenders(); } }, 'Boxes'),
        h('button', { class: 'btn ghost small', type: 'button', onclick: function () { patchLender(l.id, { active: !l.active }, l.active ? 'Paused' : 'Resumed'); } }, l.active ? 'Pause' : 'Resume'),
        l.is_primary ? null : h('button', { class: 'btn ghost small', type: 'button', onclick: function () { makePrimary(l); } }, 'Make primary')
      ))
    );
  }

  function patchLender(id, body, okMessage) {
    return guard(api('/lenders/' + id, { method: 'PATCH', body: body })).then(function () { toast(okMessage); return loadLenders(); }).catch(function () { return loadLenders(); });
  }

  function move(index, delta) {
    var ids = state.lenders.map(function (l) { return l.id; });
    var j = index + delta;
    if (j < 0 || j >= ids.length) return;
    var t = ids[index]; ids[index] = ids[j]; ids[j] = t;
    guard(api('/lenders/reorder', { method: 'POST', body: { ordered_ids: ids } })).then(function () { toast('Order saved'); return loadLenders(); });
  }

  function makePrimary(l) {
    if (!window.confirm('Make ' + l.name + ' the primary lender? It gets first look and carries the seat cap. The current primary is demoted.')) return;
    guard(api('/lenders/' + l.id + '/make-primary', { method: 'POST' })).then(function () { toast(l.name + ' is now primary'); return loadLenders(); });
  }

  function lenderFields(l) {
    var f = {
      name: h('input', { type: 'text', value: l ? l.name : '', maxlength: 100 }),
      status: h('select', null, meta.agreement_statuses.map(function (s) { return h('option', { value: s, selected: s === (l ? l.agreement_status : 'pending') }, s); })),
      cap: h('input', { type: 'text', inputmode: 'numeric', value: l && l.monthly_cap !== null ? l.monthly_cap : '' }),
      cmin: h('input', { type: 'text', inputmode: 'numeric', value: l && l.construction_min_amount !== null ? l.construction_min_amount : '' }),
      gu: check('Takes ground-up construction', l ? l.takes_ground_up : false),
      active: check('Active', l ? l.active : true)
    };
    return f;
  }

  function toggleAddLender(slot) {
    if (slot.firstChild) { clear(slot); return; }
    var f = lenderFields(null);
    var nextPriority = state.lenders.reduce(function (m, l) { return Math.max(m, l.priority); }, 0) + 1;
    var primary = check('Primary lender (first look, carries the seat cap)', false);
    slot.appendChild(h('form', { class: 'panel', onsubmit: function (ev) {
      ev.preventDefault();
      var body;
      try {
        body = {
          name: f.name.value.trim(), agreement_status: f.status.value, priority: nextPriority, active: f.active.box.checked,
          monthly_cap: intOrNull(f.cap.value, 'Seat cap'), construction_min_amount: intOrNull(f.cmin.value, 'Ground-up minimum'),
          takes_ground_up: f.gu.box.checked, is_primary: primary.box.checked
        };
      } catch (e) { toast(e.message, 'error'); return; }
      if (!body.name) { toast('Name is required', 'error'); return; }
      guard(api('/lenders', { method: 'POST', body: body })).then(function () { toast('Lender added'); return loadLenders(); });
    } },
      h('h3', null, 'Add lender'),
      h('div', { class: 'form' },
        field('Name', f.name), field('Agreement status', f.status),
        field('Seat cap per month', f.cap, 'Blank = no cap'), field('Ground-up minimum ($)', f.cmin, 'Primary only'),
        f.gu.el, f.active.el, primary.el),
      h('p', { class: 'hint' }, 'It is added at the end of the waterfall (priority ' + nextPriority + '). New lenders should stay Pending until the agreement is signed. Add product boxes after saving.'),
      h('button', { class: 'btn', type: 'submit' }, 'Save lender')
    ));
  }

  function editPanel(l) {
    var f = lenderFields(l);
    return h('form', { class: 'panel', onsubmit: function (ev) {
      ev.preventDefault();
      var body;
      try {
        body = { name: f.name.value.trim(), agreement_status: f.status.value, active: f.active.box.checked,
          monthly_cap: intOrNull(f.cap.value, 'Seat cap'), construction_min_amount: intOrNull(f.cmin.value, 'Ground-up minimum'),
          takes_ground_up: f.gu.box.checked };
      } catch (e) { toast(e.message, 'error'); return; }
      if (!body.name) { toast('Name is required', 'error'); return; }
      state.openEdit = null;
      patchLender(l.id, body, 'Saved ' + body.name);
    } },
      h('h3', null, 'Edit ' + l.name),
      h('div', { class: 'form' }, field('Name', f.name), field('Agreement status', f.status), field('Seat cap per month', f.cap, 'Blank = no cap'),
        field('Ground-up minimum ($)', f.cmin, 'Blank = none'), f.gu.el, f.active.el),
      h('button', { class: 'btn', type: 'submit' }, 'Save'), ' ',
      h('button', { class: 'btn ghost', type: 'button', onclick: function () { state.openEdit = null; renderLenders(); } }, 'Cancel')
    );
  }

  // ---------- product boxes ----------

  function renderBoxes(lenderId) {
    var slot = document.getElementById('boxes-' + lenderId);
    if (!slot) return;
    var lender = state.lenders.filter(function (l) { return l.id === lenderId; })[0];
    if (lender && lender.rule_keys && lender.rule_keys.length) {
      clear(slot);
      slot.appendChild(h('h3', null, 'Rules'));
      slot.appendChild(h('p', { class: 'notice' }, 'This lender’s rules come from the T-05 rule values (' + lender.rule_keys.join(', ') +
        '), the same numbers the lead card uses. Edit them in lending.lender_rule_values; a box added here would be ignored.'));
      return;
    }
    guard(api('/lenders/' + lenderId + '/boxes')).then(function (boxes) {
      clear(slot);
      slot.appendChild(h('h3', null, 'Product boxes'));
      slot.appendChild(h('p', { class: 'hint' }, 'A file matches a lender when it fits at least one box. A lender with no boxes (and no T-05 rules) is never routed to, so add at least one before signing it.'));
      if (!boxes.length) slot.appendChild(h('div', { class: 'empty' }, 'No boxes yet.'));
      else {
        slot.appendChild(h('div', { class: 'scroll' }, h('table', null,
          h('thead', null, h('tr', null, ['Loan types', 'Loan amount', 'States', 'Min credit', 'Max LTV', 'Max LTC', 'Min projects', 'Ground-up build', ''].map(function (c) { return h('th', null, c); }))),
          h('tbody', null, boxes.map(function (b) { return boxRow(lenderId, b); })))));
      }
      slot.appendChild(boxForm(lenderId, null));
    }).catch(function () { clear(slot); });
  }

  function pct(x) { return (x === null || x === undefined) ? '—' : (Math.round(Number(x) * 10000) / 100) + '%'; }

  function boxRow(lenderId, b) {
    return h('tr', null,
      h('td', null, h('div', { class: 'chips' }, b.loan_types.map(function (t) { return h('span', { class: 'chip' }, title(t)); }))),
      h('td', null, (b.min_loan_amount === null && b.max_loan_amount === null) ? 'Any' : money(b.min_loan_amount) + ' – ' + (b.max_loan_amount === null ? 'no max' : money(b.max_loan_amount))),
      h('td', null, b.approved_states && b.approved_states.length ? b.approved_states.join(', ') : 'All'),
      h('td', { class: 'num' }, b.credit_floor === null ? '—' : b.credit_floor),
      h('td', { class: 'num' }, pct(b.max_ltv)), h('td', { class: 'num' }, pct(b.max_ltc)),
      h('td', { class: 'num' }, b.min_completed_projects), h('td', null, b.requires_ground_up_build ? 'Yes' : 'No'),
      h('td', null, h('div', { class: 'actions' },
        h('button', { class: 'btn small', type: 'button', onclick: function () { editBox(lenderId, b); } }, 'Edit'),
        h('button', { class: 'btn ghost small', type: 'button', onclick: function () {
          if (!window.confirm('Remove this box?')) return;
          guard(api('/lenders/' + lenderId + '/boxes/' + b.id, { method: 'DELETE' })).then(function () { toast('Box removed'); renderBoxes(lenderId); });
        } }, 'Remove'))));
  }

  function editBox(lenderId, box) {
    var slot = document.getElementById('boxes-' + lenderId);
    var old = slot.querySelector('form'); if (old) old.parentNode.removeChild(old);
    slot.appendChild(boxForm(lenderId, box));
  }

  function boxForm(lenderId, existing) {
    var types = meta.loan_types.map(function (t) { return check(title(t), existing ? existing.loan_types.indexOf(t) !== -1 : false); });
    var minAmt = h('input', { type: 'text', inputmode: 'numeric', value: existing && existing.min_loan_amount !== null ? existing.min_loan_amount : '' });
    var maxAmt = h('input', { type: 'text', inputmode: 'numeric', value: existing && existing.max_loan_amount !== null ? existing.max_loan_amount : '' });
    var states = h('input', { type: 'text', value: existing && existing.approved_states ? existing.approved_states.join(', ') : '' });
    var credit = h('input', { type: 'text', inputmode: 'numeric', value: existing && existing.credit_floor !== null ? existing.credit_floor : '' });
    var ltv = h('input', { type: 'text', inputmode: 'decimal', value: existing && existing.max_ltv !== null ? Math.round(Number(existing.max_ltv) * 10000) / 100 : '' });
    var ltc = h('input', { type: 'text', inputmode: 'decimal', value: existing && existing.max_ltc !== null ? Math.round(Number(existing.max_ltc) * 10000) / 100 : '' });
    var projects = h('input', { type: 'text', inputmode: 'numeric', value: existing ? existing.min_completed_projects : 0 });
    var build = check('Requires a ground-up build in the track record', existing ? existing.requires_ground_up_build : false);
    return h('form', { class: 'panel', onsubmit: function (ev) {
      ev.preventDefault();
      var body;
      try {
        var chosen = meta.loan_types.filter(function (t, i) { return types[i].box.checked; });
        if (!chosen.length) throw new Error('Pick at least one loan type');
        var st = states.value.split(',').map(function (s) { return s.trim().toUpperCase(); }).filter(Boolean);
        st.forEach(function (s) { if (!/^[A-Z]{2}$/.test(s)) throw new Error('States must be two-letter codes, e.g. FL, GA'); });
        body = { loan_types: chosen, min_loan_amount: intOrNull(minAmt.value, 'Min loan'), max_loan_amount: intOrNull(maxAmt.value, 'Max loan'),
          approved_states: st.length ? st : null, credit_floor: intOrNull(credit.value, 'Min credit'),
          max_ltv: pctOrNull(ltv.value, 'Max LTV'), max_ltc: pctOrNull(ltc.value, 'Max LTC'),
          min_completed_projects: intOrNull(projects.value, 'Min projects') || 0, requires_ground_up_build: build.box.checked };
      } catch (e) { toast(e.message, 'error'); return; }
      // Re-boxing adds the new box first and removes the old one only after that succeeded, so a failure never leaves the lender with no box.
      guard(api('/lenders/' + lenderId + '/boxes', { method: 'POST', body: body })).then(function () {
        if (existing) return guard(api('/lenders/' + lenderId + '/boxes/' + existing.id, { method: 'DELETE' }));
      }).then(function () { toast(existing ? 'Box updated' : 'Box added'); renderBoxes(lenderId); });
    } },
      h('h3', null, existing ? 'Edit box' : 'Add a box'),
      h('div', { class: 'wide' }, h('label', null, 'Loan types'), h('div', { class: 'checks' }, types.map(function (t) { return t.el; }))),
      h('div', { class: 'form' },
        field('Min loan ($)', minAmt), field('Max loan ($)', maxAmt), field('States', states, 'Blank = all states'),
        field('Min credit score', credit), field('Max LTV (%)', ltv), field('Max LTC (%)', ltc), field('Min completed projects', projects), build.el),
      h('p', null, h('button', { class: 'btn', type: 'submit' }, existing ? 'Save box' : 'Add box'))
    );
  }

  // ---------- files ----------

  function statusBadge(s) {
    return h('span', { class: 'badge ' + ({ routed: 'ok', held: 'warn', exhausted: 'bad', unrouted: '' }[s] || '') }, s);
  }

  function loadFiles() {
    var qs = [];
    if (state.fileFilter.status) qs.push('status=' + encodeURIComponent(state.fileFilter.status));
    if (state.fileFilter.q) qs.push('q=' + encodeURIComponent(state.fileFilter.q));
    return guard(api('/files' + (qs.length ? '?' + qs.join('&') : ''))).then(function (res) {
      state.files = res.files;
      renderFiles();
      if (state.selectedFile) return openFile(state.selectedFile);
    });
  }

  function renderFiles() {
    var v = view();
    clear(v);
    var status = h('select', { 'aria-label': 'Status', onchange: function (ev) { state.fileFilter.status = ev.target.value; loadFiles(); } },
      h('option', { value: '' }, 'All statuses'),
      meta.file_statuses.map(function (s) { return h('option', { value: s, selected: s === state.fileFilter.status }, title(s)); }));
    var q = h('input', { type: 'text', placeholder: 'Search by last name', 'aria-label': 'Search by last name', value: state.fileFilter.q, style: null });
    v.appendChild(h('form', { class: 'bar', onsubmit: function (ev) { ev.preventDefault(); state.fileFilter.q = q.value.trim(); loadFiles(); } },
      h('h2', { class: 'grow' }, 'Files'), status, q, h('button', { class: 'btn', type: 'submit' }, 'Search')));
    var left = h('div');
    var right = h('div', { id: 'file-detail' }, h('div', { class: 'empty' }, 'Select a file to see where it is, who is next, and its history.'));
    if (!state.files.length) left.appendChild(h('div', { class: 'empty' }, 'No files match.'));
    else {
      left.appendChild(h('div', { class: 'scroll' }, h('table', { id: 'files-table' },
        h('thead', null, h('tr', null, ['File', 'From', 'Borrower', 'Product', 'Amount', 'Status', 'Lender', 'Updated'].map(function (c) { return h('th', null, c); }))),
        h('tbody', null, state.files.map(function (f) {
          return h('tr', { class: 'click' + (sameFile(state.selectedFile, fileRef(f)) ? ' sel' : ''), 'data-file': f.source + ':' + f.file_id, tabindex: 0,
            onclick: function () { openFile(fileRef(f)); },
            onkeydown: function (ev) { if (ev.key === 'Enter') openFile(fileRef(f)); } },
            h('td', null, '#' + f.file_id), h('td', null, fromWhere(f)), h('td', null, [f.first_name, f.last_name].filter(Boolean).join(' ') || '—'),
            h('td', null, title(f.loan_type)), h('td', { class: 'num' }, money(f.loan_amount)), h('td', null, statusBadge(f.status)),
            h('td', null, f.current_lender_name ? f.current_lender_name + ' (#' + f.route_position + ')' : (f.hold_reason ? title(f.hold_reason) : '—')),
            h('td', null, when(f.updated_at)));
        })))));
    }
    v.appendChild(h('div', { class: 'split' }, left, right));
  }

  function openFile(ref) {
    state.selectedFile = ref;
    Array.prototype.forEach.call(document.querySelectorAll('#files-table tr.click'), function (tr) {
      tr.classList.toggle('sel', tr.getAttribute('data-file') === ref.source + ':' + ref.id);
    });
    var slot = document.getElementById('file-detail');
    if (!slot) { state.tab = 'files'; return switchTab('files'); }
    return guard(Promise.all([api('/files/' + ref.id + fileQuery(ref)), reasonsList()])).then(function (res) { renderFileDetail(slot, res[0], res[1]); });
  }

  function reasonsList() {
    if (state.reasons.length) return Promise.resolve(state.reasons);
    return api('/decline-reasons').then(function (rows) { state.reasons = rows.filter(function (r) { return r.active; }); return state.reasons; });
  }

  function renderFileDetail(slot, rec, reasons) {
    clear(slot);
    var f = rec.file;
    var name = [f.first_name, f.last_name].filter(Boolean).join(' ') || 'Unknown borrower';
    slot.appendChild(h('div', { class: 'panel', id: 'file-panel' },
      h('h2', null, fileLabel(f) + ' · ' + name),
      h('div', null, statusBadge(f.status), ' ', f.hold_reason ? h('span', { class: 'muted' }, title(f.hold_reason)) : null,
        f.source === 'partner' ? h('span', { class: 'muted' }, ' · from ' + (f.partner_name || 'a partner')) : null),
      h('dl', { class: 'facts' },
        h('dt', null, 'Product'), h('dd', null, title(f.loan_type) + ' · ' + money(f.loan_amount) + ' · ' + (f.property_state || '—')),
        h('dt', null, 'Current lender'), h('dd', { id: 'fact-current' }, rec.current ? rec.current.name + ' (position ' + rec.current.position + ')' : '—'),
        h('dt', null, 'Next in line'), h('dd', { id: 'fact-next' }, rec.next ? rec.next.name + ' (position ' + rec.next.position + ')' : 'No lender left — it would go to the hold queue')),
      declineControls(rec, reasons),
      h('h3', null, 'Route history'),
      historyList(rec.history)));
  }

  function declineControls(rec, reasons) {
    var ref = fileRef(rec.file);
    if (!rec.can_decline) return h('p', { class: 'hint' }, 'Nothing to decline: this file is not currently with a lender.');
    var reason = h('select', { 'aria-label': 'Decline reason' }, reasons.map(function (r) { return h('option', { value: r.code, selected: r.code === meta.default_decline_reason }, r.label); }));
    var decline = h('button', { class: 'btn danger', type: 'button', id: 'decline-btn', onclick: function () {
      decline.disabled = true;
      guard(api('/files/' + ref.id + '/decline' + fileQuery(ref), { method: 'POST', body: { reason_code: reason.value } })).then(function () {
        toast('Declined. The file moved on.'); return refreshAfterAction(ref);
      }).catch(function () { decline.disabled = false; });
    } }, 'Decline ' + rec.current.name);
    var outcomeBtns = meta.outcome_actions.map(function (action) {
      var btn = h('button', { class: 'btn ghost small', type: 'button', 'data-outcome': action, onclick: function () {
        if (btn.getAttribute('data-armed') !== '1') { btn.setAttribute('data-armed', '1'); btn.textContent = 'Confirm ' + action + '?'; setTimeout(function () { btn.setAttribute('data-armed', '0'); btn.textContent = 'Mark ' + action; }, 4000); return; }
        guard(api('/files/' + ref.id + '/outcome' + fileQuery(ref), { method: 'POST', body: { action: action } })).then(function (r) { toast(r.detail === 'recorded' ? 'Recorded ' + action : 'Already recorded'); return refreshAfterAction(ref); });
      } }, 'Mark ' + action);
      return btn;
    });
    return h('div', null,
      h('div', { class: 'decline-row' }, decline, reason),
      h('div', { class: 'decline-row' }, h('span', { class: 'hint' }, 'Records an outcome for ' + rec.current.name + (meta.seat_cap_counted_action ? ' (the seat cap counts "' + meta.seat_cap_counted_action + '").' : '.')), outcomeBtns));
  }

  function refreshAfterAction(ref) {
    return loadFiles().then(function () { return openFile(ref); });
  }

  function historyList(history) {
    if (!history.length) return h('p', { class: 'hint' }, 'No events yet.');
    return h('ol', { class: 'timeline' }, history.map(function (e) {
      var text = title(e.action) + (e.lender_name ? ' · ' + e.lender_name : '') + (e.reason_code ? ' · reason: ' + e.reason_code : '');
      return h('li', { class: e.action }, h('div', null, text, e.free_text ? ' — ' + e.free_text : ''), h('div', { class: 'when' }, when(e.created_at) + ' · ' + e.actor));
    }));
  }

  // ---------- hold queue ----------

  function loadHold() {
    return guard(api('/hold-queue')).then(function (res) {
      var v = view();
      clear(v);
      v.appendChild(h('div', { class: 'bar' }, h('h2', { class: 'grow' }, 'Hold queue'), h('span', { class: 'muted' }, res.count + ' file(s)')));
      v.appendChild(h('p', { class: 'hint' }, 'Files no signed lender matched, or every matching lender declined. Nothing is dropped; each one needs a person.'));
      if (!res.files.length) { v.appendChild(h('div', { class: 'empty' }, 'The hold queue is empty.')); return; }
      v.appendChild(h('div', { class: 'scroll' }, h('table', null,
        h('thead', null, h('tr', null, ['File', 'From', 'Borrower', 'Product', 'Amount', 'Status', 'Why', 'Since'].map(function (c) { return h('th', null, c); }))),
        h('tbody', null, res.files.map(function (f) {
          return h('tr', { class: 'click', tabindex: 0, onclick: function () { state.selectedFile = fileRef(f); state.fileFilter = { status: '', q: '' }; switchTab('files'); },
            onkeydown: function (ev) { if (ev.key === 'Enter') { state.selectedFile = fileRef(f); switchTab('files'); } } },
            h('td', null, '#' + f.file_id), h('td', null, fromWhere(f)), h('td', null, [f.first_name, f.last_name].filter(Boolean).join(' ') || '—'), h('td', null, title(f.loan_type)),
            h('td', { class: 'num' }, money(f.loan_amount)), h('td', null, statusBadge(f.status)), h('td', null, title(f.hold_reason)), h('td', null, when(f.updated_at)));
        })))));
    });
  }

  // ---------- decline reasons ----------

  function loadReasons() {
    return guard(api('/decline-reasons')).then(function (rows) {
      var v = view();
      clear(v);
      var code = h('input', { type: 'text', maxlength: 50, placeholder: 'e.g. appraisal_low' });
      var label = h('input', { type: 'text', maxlength: 200, placeholder: 'Shown to the team' });
      v.appendChild(h('h2', null, 'Decline reasons'));
      v.appendChild(h('p', { class: 'hint' }, 'The fixed list of reasons a lender can decline for. A decline must use one of these codes; “unspecified” is what a one-click decline records.'));
      v.appendChild(h('form', { class: 'panel', onsubmit: function (ev) {
        ev.preventDefault();
        var c = code.value.trim().toLowerCase().replace(/\s+/g, '_');
        if (!/^[a-z0-9_]+$/.test(c) || !label.value.trim()) { toast('Use a code of letters, numbers and underscores, and give it a label', 'error'); return; }
        guard(api('/decline-reasons', { method: 'POST', body: { code: c, label: label.value.trim(), active: true } })).then(function () { state.reasons = []; toast('Reason saved'); return loadReasons(); });
      } }, h('div', { class: 'form' }, field('Code', code), field('Label', label), h('div', null, h('button', { class: 'btn', type: 'submit' }, 'Add reason')))));
      v.appendChild(h('div', { class: 'scroll' }, h('table', null,
        h('thead', null, h('tr', null, ['Code', 'Label', 'Active'].map(function (c) { return h('th', null, c); }))),
        h('tbody', null, rows.map(function (r) {
          return h('tr', null, h('td', null, r.code), h('td', null, r.label), h('td', null, h('span', { class: 'badge ' + (r.active ? 'ok' : 'warn') }, r.active ? 'Active' : 'Off')));
        })))));
    });
  }

  // ---------- boot ----------

  if (secret) start(); else renderGate('');
})();
