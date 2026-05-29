// metar_builder.js
// Structured METAR/SPECI builder for Vectair Flite.

const STORAGE_KEY = 'vectair_fdms_metar_builder_last_v1';
const DEFAULT_STATION = 'EGOW';

// ── Defaults ──────────────────────────────────────────────────────────────────

function getDefaultState() {
  const now = new Date();
  const dd = String(now.getUTCDate()).padStart(2, '0');
  const hh = String(now.getUTCHours()).padStart(2, '0');
  const mm = String(now.getUTCMinutes()).padStart(2, '0');
  return {
    reportType:    'METAR',
    station:       DEFAULT_STATION,
    time:          `${dd}${hh}${mm}Z`,
    windType:      'calm',         // 'calm' | 'vrb' | 'dir'
    windDir:       '360',
    windSpeed:     '10',
    windUnit:      'KT',
    windGust:      '',
    windVarFrom:   '',
    windVarTo:     '',
    cavok:         false,
    vis:           '9999',
    rvr:           '',
    rvrEnabled:    false,
    wx:            '',
    wxEnabled:     false,
    clouds:        [{ amount: 'FEW', height: '030' }],
    cloudsEnabled: true,
    tempC:         '10',
    dewC:          '08',
    qnh:           '1013',
    recentWx:      '',
    recentWxEnabled:   false,
    windShear:     '',
    windShearEnabled:  false,
    colourState:   '',
    colourEnabled: false,
    rwyState:      '',
    rwyEnabled:    false,
  };
}

// ── Validation ────────────────────────────────────────────────────────────────

function validateState(s) {
  const errors = [];

  if (!/^[A-Z]{4}$/.test(s.station)) {
    errors.push('Station: must be four uppercase letters (e.g. EGOW).');
  }
  if (!/^\d{6}Z$/.test(s.time)) {
    errors.push('Time: must be DDHHMMZ (e.g. 011530Z).');
  }

  if (s.windType === 'dir') {
    if (!/^\d{3}$/.test(s.windDir)) errors.push('Wind direction: must be three digits (e.g. 270).');
    if (!/^\d{2,3}$/.test(s.windSpeed)) errors.push('Wind speed: must be 2–3 digits.');
    if (s.windGust && !/^\d{2,3}$/.test(s.windGust)) errors.push('Wind gust: must be 2–3 digits if provided.');
    if (s.windVarFrom || s.windVarTo) {
      if (!/^\d{3}$/.test(s.windVarFrom) || !/^\d{3}$/.test(s.windVarTo)) {
        errors.push('Variable wind sector: both FROM and TO must be three digits.');
      }
    }
  }
  if (s.windType === 'vrb') {
    if (!/^\d{2,3}$/.test(s.windSpeed)) errors.push('Wind speed (VRB): must be 2–3 digits.');
  }

  if (!s.cavok) {
    if (!/^\d{4}$/.test(s.vis) && s.vis !== 'CAVOK') {
      errors.push('Visibility: must be a four-digit value (e.g. 9999) or CAVOK.');
    }
    if (s.cloudsEnabled) {
      s.clouds.forEach((c, i) => {
        if (!['FEW', 'SCT', 'BKN', 'OVC', 'NSC', 'SKC', 'NCD'].includes(c.amount)) {
          errors.push(`Cloud layer ${i + 1}: invalid amount.`);
        }
        if (!['NSC', 'SKC', 'NCD'].includes(c.amount) && !/^\d{3}$/.test(c.height)) {
          errors.push(`Cloud layer ${i + 1}: height must be three digits (e.g. 030).`);
        }
      });
    }
  }

  if (!/^-?\d{1,2}$/.test(s.tempC)) errors.push('Temperature: must be an integer (e.g. 10 or -5).');
  if (!/^-?\d{1,2}$/.test(s.dewC)) errors.push('Dew point: must be an integer (e.g. 08 or -3).');
  if (!/^\d{3,4}$/.test(s.qnh)) errors.push('QNH: must be 3–4 digits (e.g. 1013).');

  return errors;
}

// ── Assembler ─────────────────────────────────────────────────────────────────

function formatTemp(v) {
  const n = parseInt(v, 10);
  const abs = String(Math.abs(n)).padStart(2, '0');
  return n < 0 ? `M${abs}` : abs;
}

function buildReport(s) {
  const groups = [];

  // 1. Report type / station / time
  groups.push(s.reportType);
  groups.push(s.station);
  groups.push(s.time);

  // 2. Wind
  if (s.windType === 'calm') {
    groups.push('00000KT');
  } else if (s.windType === 'vrb') {
    const spd = String(s.windSpeed).padStart(2, '0');
    groups.push(`VRB${spd}${s.windUnit}`);
  } else {
    const dir = String(s.windDir).padStart(3, '0');
    const spd = String(s.windSpeed).padStart(2, '0');
    let w = `${dir}${spd}`;
    if (s.windGust) w += `G${String(s.windGust).padStart(2, '0')}`;
    w += s.windUnit;
    groups.push(w);
    if (s.windVarFrom && s.windVarTo) {
      groups.push(`${String(s.windVarFrom).padStart(3,'0')}V${String(s.windVarTo).padStart(3,'0')}`);
    }
  }

  // 3. Visibility / CAVOK
  if (s.cavok) {
    groups.push('CAVOK');
  } else {
    groups.push(s.vis || '9999');

    // 4. RVR
    if (s.rvrEnabled && s.rvr.trim()) groups.push(s.rvr.trim().toUpperCase());

    // 5. Present weather
    if (s.wxEnabled && s.wx.trim()) groups.push(s.wx.trim().toUpperCase());

    // 6. Cloud
    if (s.cloudsEnabled && s.clouds.length) {
      s.clouds.forEach(c => {
        if (['NSC', 'SKC', 'NCD'].includes(c.amount)) {
          groups.push(c.amount);
        } else {
          groups.push(`${c.amount}${String(c.height).padStart(3, '0')}`);
        }
      });
    }
  }

  // 7. Temperature/dew point
  groups.push(`${formatTemp(s.tempC)}/${formatTemp(s.dewC)}`);

  // 8. QNH
  groups.push(`Q${String(s.qnh).padStart(4, '0')}`);

  // 9. Recent weather
  if (s.recentWxEnabled && s.recentWx.trim()) groups.push(`RE${s.recentWx.trim().toUpperCase()}`);

  // 10. Wind shear
  if (s.windShearEnabled && s.windShear.trim()) groups.push(`WS ${s.windShear.trim().toUpperCase()}`);

  // 11. Colour state
  if (s.colourEnabled && s.colourState.trim()) groups.push(s.colourState.trim().toUpperCase());

  // 12. Runway state
  if (s.rwyEnabled && s.rwyState.trim()) groups.push(s.rwyState.trim().toUpperCase());

  return groups.join(' ') + '=';
}

// ── localStorage ──────────────────────────────────────────────────────────────

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

function saveState(s) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch (_) {}
}

// ── DOM helpers ───────────────────────────────────────────────────────────────

function el(id) { return document.getElementById(id); }

function setVal(id, v) {
  const e = el(id);
  if (e) e.value = v;
}

function setChecked(id, v) {
  const e = el(id);
  if (e) e.checked = !!v;
}

// ── Cloud row builder ─────────────────────────────────────────────────────────

function buildCloudRow(idx, cloud) {
  const amounts = ['FEW', 'SCT', 'BKN', 'OVC', 'NSC', 'SKC', 'NCD'];
  const options = amounts.map(a =>
    `<option value="${a}"${a === cloud.amount ? ' selected' : ''}>${a}</option>`
  ).join('');

  const heightInput = ['NSC', 'SKC', 'NCD'].includes(cloud.amount)
    ? `<input type="text" class="mb-cloud-height" style="width:60px;opacity:0.4;pointer-events:none;" value="" disabled placeholder="---" />`
    : `<input type="text" class="mb-cloud-height" maxlength="3" style="width:60px;" value="${cloud.height || '030'}" placeholder="030" />`;

  return `
    <div class="mb-cloud-row" data-cloud-idx="${idx}">
      <select class="mb-cloud-amount">${options}</select>
      ${heightInput}
      <button type="button" class="btn btn-ghost btn-small mb-cloud-remove" title="Remove layer">×</button>
    </div>`;
}

// ── Wind section sync ─────────────────────────────────────────────────────────

function syncWindUi(windType) {
  const dirRow  = el('mbWindDirRow');
  const vrbNote = el('mbWindVrbNote');
  const varRow  = el('mbWindVarRow');

  if (dirRow)  dirRow.style.display  = windType === 'dir' ? '' : 'none';
  if (vrbNote) vrbNote.style.display = windType === 'vrb' ? '' : 'none';
  if (varRow)  varRow.style.display  = windType === 'dir' ? '' : 'none';
}

function syncCavokUi(cavok) {
  const visSection = el('mbVisSection');
  const wxSection  = el('mbWxSection');
  const cloudSection = el('mbCloudSection');
  if (visSection)   visSection.style.display = cavok ? 'none' : '';
  if (wxSection)    wxSection.style.display  = cavok ? 'none' : '';
  if (cloudSection) cloudSection.style.display = cavok ? 'none' : '';
}

// ── Read form state ────────────────────────────────────────────────────────────

function readFormState() {
  const windType = document.querySelector('input[name="mbWindType"]:checked')?.value || 'calm';

  const clouds = [];
  document.querySelectorAll('.mb-cloud-row').forEach(row => {
    const amount = row.querySelector('.mb-cloud-amount')?.value || 'FEW';
    const height = row.querySelector('.mb-cloud-height')?.value || '030';
    clouds.push({ amount, height });
  });

  return {
    reportType:       el('mbReportType')?.value  || 'METAR',
    station:          (el('mbStation')?.value    || DEFAULT_STATION).toUpperCase().trim(),
    time:             (el('mbTime')?.value        || '').toUpperCase().trim(),
    windType,
    windDir:          el('mbWindDir')?.value     || '360',
    windSpeed:        windType === 'vrb'
                        ? (el('mbWindSpeedVrb')?.value || el('mbWindSpeed')?.value || '05')
                        : (el('mbWindSpeed')?.value || '10'),
    windUnit:         el('mbWindUnit')?.value    || 'KT',
    windGust:         el('mbWindGust')?.value    || '',
    windVarFrom:      el('mbWindVarFrom')?.value || '',
    windVarTo:        el('mbWindVarTo')?.value   || '',
    cavok:            el('mbCavok')?.checked     || false,
    vis:              el('mbVis')?.value         || '9999',
    rvr:              el('mbRvr')?.value         || '',
    rvrEnabled:       el('mbRvrEnabled')?.checked || false,
    wx:               el('mbWx')?.value          || '',
    wxEnabled:        el('mbWxEnabled')?.checked  || false,
    clouds,
    cloudsEnabled:    el('mbCloudsEnabled')?.checked !== false,
    tempC:            el('mbTemp')?.value        || '10',
    dewC:             el('mbDew')?.value         || '08',
    qnh:              el('mbQnh')?.value         || '1013',
    recentWx:         el('mbRecentWx')?.value    || '',
    recentWxEnabled:  el('mbRecentWxEnabled')?.checked || false,
    windShear:        el('mbWindShear')?.value   || '',
    windShearEnabled: el('mbWindShearEnabled')?.checked || false,
    colourState:      el('mbColour')?.value      || '',
    colourEnabled:    el('mbColourEnabled')?.checked || false,
    rwyState:         el('mbRwyState')?.value    || '',
    rwyEnabled:       el('mbRwyEnabled')?.checked || false,
  };
}

// ── Apply state to form ────────────────────────────────────────────────────────

function applyStateToForm(s) {
  setVal('mbReportType', s.reportType);
  setVal('mbStation',    s.station);
  setVal('mbTime',       s.time);

  const windRadio = document.querySelector(`input[name="mbWindType"][value="${s.windType}"]`);
  if (windRadio) windRadio.checked = true;

  setVal('mbWindDir',      s.windDir);
  setVal('mbWindSpeed',    s.windType !== 'vrb' ? s.windSpeed : '10');
  setVal('mbWindSpeedVrb', s.windType === 'vrb' ? s.windSpeed : '');
  setVal('mbWindUnit',    s.windUnit);
  setVal('mbWindGust',    s.windGust);
  setVal('mbWindVarFrom', s.windVarFrom);
  setVal('mbWindVarTo',   s.windVarTo);
  setChecked('mbCavok',  s.cavok);
  setVal('mbVis',         s.vis);
  setVal('mbRvr',         s.rvr);
  setChecked('mbRvrEnabled',  s.rvrEnabled);
  setVal('mbWx',          s.wx);
  setChecked('mbWxEnabled',   s.wxEnabled);
  setChecked('mbCloudsEnabled', s.cloudsEnabled);
  setVal('mbTemp',        s.tempC);
  setVal('mbDew',         s.dewC);
  setVal('mbQnh',         s.qnh);
  setVal('mbRecentWx',    s.recentWx);
  setChecked('mbRecentWxEnabled', s.recentWxEnabled);
  setVal('mbWindShear',   s.windShear);
  setChecked('mbWindShearEnabled', s.windShearEnabled);
  setVal('mbColour',      s.colourState);
  setChecked('mbColourEnabled', s.colourEnabled);
  setVal('mbRwyState',    s.rwyState);
  setChecked('mbRwyEnabled', s.rwyEnabled);

  renderCloudList(s.clouds);
  syncWindUi(s.windType);
  syncCavokUi(s.cavok);
}

// ── Cloud list render ──────────────────────────────────────────────────────────

function renderCloudList(clouds) {
  const list = el('mbCloudList');
  if (!list) return;
  list.innerHTML = clouds.map((c, i) => buildCloudRow(i, c)).join('');
  bindCloudRows();
}

function bindCloudRows() {
  document.querySelectorAll('.mb-cloud-row').forEach(row => {
    const amountSel = row.querySelector('.mb-cloud-amount');
    amountSel?.addEventListener('change', () => {
      const noHeight = ['NSC', 'SKC', 'NCD'].includes(amountSel.value);
      const heightEl = row.querySelector('.mb-cloud-height');
      if (heightEl) {
        heightEl.disabled = noHeight;
        heightEl.style.opacity = noHeight ? '0.4' : '';
        heightEl.style.pointerEvents = noHeight ? 'none' : '';
        if (noHeight) heightEl.value = '';
      }
      handleChange();
    });
    row.querySelector('.mb-cloud-remove')?.addEventListener('click', () => {
      row.remove();
      handleChange();
    });
    row.querySelector('.mb-cloud-height')?.addEventListener('input', handleChange);
  });
}

// ── Output update ─────────────────────────────────────────────────────────────

function handleChange() {
  const s = readFormState();
  const errors = validateState(s);

  const outputEl   = el('mbOutput');
  const validEl    = el('mbValidation');
  const copyBtn    = el('mbCopyBtn');

  if (outputEl) outputEl.textContent = buildReport(s);

  if (validEl) {
    if (errors.length) {
      validEl.innerHTML = errors.map(e => `<div class="mb-error-item">⚠ ${escHtml(e)}</div>`).join('');
      validEl.className = 'mb-validation mb-validation--errors';
    } else {
      validEl.innerHTML = '<div class="mb-ok-item">✓ All enabled groups valid.</div>';
      validEl.className = 'mb-validation mb-validation--ok';
    }
  }

  if (copyBtn) copyBtn.disabled = errors.length > 0;
}

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Current UTC time string ───────────────────────────────────────────────────

function currentUtcTimeStr() {
  const now = new Date();
  const dd  = String(now.getUTCDate()).padStart(2, '0');
  const hh  = String(now.getUTCHours()).padStart(2, '0');
  const mm  = String(now.getUTCMinutes()).padStart(2, '0');
  return `${dd}${hh}${mm}Z`;
}

// ── Init ──────────────────────────────────────────────────────────────────────

export function initMetarBuilder() {
  const container = el('tab-metar');
  if (!container) return;

  const def = getDefaultState();
  applyStateToForm(def);
  handleChange();

  // Report type
  el('mbReportType')?.addEventListener('change', handleChange);

  // Station / time
  el('mbStation')?.addEventListener('input', handleChange);
  el('mbTime')?.addEventListener('input', handleChange);

  // Now button
  el('mbTimeNow')?.addEventListener('click', () => {
    setVal('mbTime', currentUtcTimeStr());
    handleChange();
  });

  // Wind type radios
  document.querySelectorAll('input[name="mbWindType"]').forEach(r => {
    r.addEventListener('change', () => {
      syncWindUi(r.value);
      handleChange();
    });
  });

  // Wind fields
  ['mbWindDir','mbWindSpeed','mbWindSpeedVrb','mbWindUnit','mbWindGust','mbWindVarFrom','mbWindVarTo'].forEach(id => {
    el(id)?.addEventListener('input', handleChange);
    el(id)?.addEventListener('change', handleChange);
  });

  // CAVOK
  el('mbCavok')?.addEventListener('change', () => {
    syncCavokUi(el('mbCavok').checked);
    handleChange();
  });

  // Visibility / weather / clouds section toggles + inputs
  ['mbVis','mbRvr','mbWx','mbTemp','mbDew','mbQnh','mbRecentWx','mbWindShear','mbColour','mbRwyState'].forEach(id => {
    el(id)?.addEventListener('input', handleChange);
  });
  ['mbRvrEnabled','mbWxEnabled','mbCloudsEnabled','mbRecentWxEnabled','mbWindShearEnabled','mbColourEnabled','mbRwyEnabled'].forEach(id => {
    el(id)?.addEventListener('change', handleChange);
  });

  // Add cloud layer
  el('mbAddCloud')?.addEventListener('click', () => {
    const list = el('mbCloudList');
    if (!list) return;
    const idx = list.querySelectorAll('.mb-cloud-row').length;
    const div = document.createElement('div');
    div.innerHTML = buildCloudRow(idx, { amount: 'SCT', height: '030' });
    list.appendChild(div.firstElementChild);
    bindCloudRows();
    handleChange();
  });

  // Copy
  el('mbCopyBtn')?.addEventListener('click', () => {
    const text = el('mbOutput')?.textContent || '';
    const s = readFormState();
    saveState(s);

    navigator.clipboard.writeText(text).then(() => {
      showCopyFeedback('Copied!');
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0;';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showCopyFeedback('Copied!');
    });
  });

  // Reset
  el('mbResetBtn')?.addEventListener('click', () => {
    applyStateToForm(getDefaultState());
    handleChange();
  });

  // Recall Previous
  el('mbRecallBtn')?.addEventListener('click', () => {
    const saved = loadSaved();
    if (saved) {
      applyStateToForm({ ...getDefaultState(), ...saved });
      handleChange();
      showCopyFeedback('Previous observation recalled.');
    } else {
      showCopyFeedback('No previous observation saved.');
    }
  });
}

function showCopyFeedback(msg) {
  const fb = el('mbCopyFeedback');
  if (!fb) return;
  fb.textContent = msg;
  fb.style.visibility = 'visible';
  setTimeout(() => { fb.style.visibility = 'hidden'; }, 2500);
}
