// vkb.js
// Vectair Knowledge Base - CSV data loading and management

/**
 * VKB Data Store
 * Holds all loaded CSV data in memory for fast lookups and autocomplete
 */
const vkbData = {
  aircraftTypes: [],
  callsignsStandard: [],
  callsignsNonstandard: [],
  locations: [],
  registrations: [],
  egowCodes: [],
  callsignKey: [],
  aircraftPilots: [],
  loaded: false,
  loadError: null
};

// Baseline (bundled CSV) data — read-only after CSV load
const vkbBaselineData = {
  registrations: [],
  egowCodes: []
};

// localStorage key for local VKB overrides
export const VKB_OVERRIDES_KEY = "vectair_fdms_vkb_overrides_v1";

/**
 * Parse CSV text into array of objects
 * @param {string} csvText - Raw CSV text
 * @returns {Array} Array of objects with headers as keys
 */
function parseCSV(csvText) {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  // Remove BOM if present
  let headers = lines[0].replace(/^\uFEFF/, '');
  headers = headers.split(',').map(h => h.trim());

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue;

    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] || '';
    }
    rows.push(row);
  }

  return rows;
}

/**
 * Parse a single CSV line, handling quoted values with commas
 * @param {string} line - CSV line
 * @returns {Array} Array of values
 */
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of value
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add last value
  values.push(current.trim());

  return values;
}

/**
 * Load a CSV file from the server
 * @param {string} path - Path to CSV file
 * @returns {Promise<Array>} Parsed CSV data
 */
async function loadCSV(path) {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const text = await response.text();
    return parseCSV(text);
  } catch (error) {
    console.error(`Failed to load ${path}:`, error);
    throw error;
  }
}

/**
 * Load all VKB CSV files
 * @returns {Promise<void>}
 */
export async function loadVKBData() {
  if (vkbData.loaded) {
    console.log('VKB: Data already loaded');
    return;
  }

  console.log('VKB: Loading CSV data...');
  const startTime = performance.now();

  try {
    // Load all CSV files in parallel
    const [
      aircraftTypes,
      callsignsStandard,
      callsignsNonstandard,
      locations,
      registrations,
      egowCodes,
      callsignKey,
      aircraftPilots
    ] = await Promise.all([
      loadCSV('./data/FDMS_AIRCRAFT_TYPES.csv'),
      loadCSV('./data/FDMS_CALLSIGNS_STANDARD.csv'),
      loadCSV('./data/FDMS_CALLSIGNS_NONSTANDARD CALLSIGNS.csv'),
      loadCSV('./data/FDMS_LOCATIONS_B_E_L.csv'),
      loadCSV('./data/FDMS_REGISTRATIONS.csv'),
      loadCSV('./data/FDMS_EGOW_CODES.csv'),
      loadCSV('./data/CALLSIGN_KEY.csv'),
      loadCSV('./data/FDMS_AIRCRAFT_PILOTS.csv')
    ]);

    vkbData.aircraftTypes = aircraftTypes;
    vkbData.callsignsStandard = callsignsStandard;
    vkbData.callsignsNonstandard = callsignsNonstandard;
    vkbData.locations = locations;
    vkbData.callsignKey = callsignKey;
    vkbData.aircraftPilots = aircraftPilots;

    // Store bundled baselines, then apply any local overrides
    vkbBaselineData.registrations = registrations;
    vkbBaselineData.egowCodes = egowCodes;
    vkbData.registrations = applyDatasetOverrides('registrations', registrations);
    vkbData.egowCodes = applyDatasetOverrides('egowCodes', egowCodes);

    vkbData.loaded = true;
    vkbData.loadError = null;

    const endTime = performance.now();
    const loadTime = (endTime - startTime).toFixed(0);

    console.log(`VKB: Loaded ${aircraftTypes.length} aircraft types`);
    console.log(`VKB: Loaded ${callsignsStandard.length} standard callsigns`);
    console.log(`VKB: Loaded ${callsignsNonstandard.length} nonstandard callsigns`);
    console.log(`VKB: Loaded ${locations.length} locations`);
    console.log(`VKB: Loaded ${registrations.length} registrations`);
    console.log(`VKB: Loaded ${egowCodes.length} EGOW codes`);
    console.log(`VKB: Loaded ${aircraftPilots.length} aircraft pilot rows`);
    console.log(`VKB: Load complete in ${loadTime}ms`);

  } catch (error) {
    vkbData.loadError = error.message;
    console.error('VKB: Failed to load data:', error);
    throw error;
  }
}

/**
 * Get VKB data status
 * @returns {Object} Status object
 */
export function getVKBStatus() {
  return {
    loaded: vkbData.loaded,
    error: vkbData.loadError,
    counts: {
      aircraftTypes: vkbData.aircraftTypes.length,
      callsignsStandard: vkbData.callsignsStandard.length,
      callsignsNonstandard: vkbData.callsignsNonstandard.length,
      locations: vkbData.locations.length,
      registrations: vkbData.registrations.length,
      egowCodes: vkbData.egowCodes.length,
      aircraftPilots: vkbData.aircraftPilots.length
    }
  };
}

/**
 * Get VKB registrations data
 * @returns {Array} Registrations array
 */
export function getVKBRegistrations() {
  return vkbData.registrations || [];
}

/**
 * Search aircraft types
 * @param {string} query - Search query
 * @param {number} limit - Max results (default 50)
 * @returns {Array} Matching aircraft types
 */
export function searchAircraftTypes(query, limit = 50) {
  if (!vkbData.loaded) return [];

  const q = query.toLowerCase().trim();
  if (!q) return vkbData.aircraftTypes.slice(0, limit);

  return vkbData.aircraftTypes
    .filter(type => {
      const icao = (type['ICAO Type Designator'] || '').toLowerCase();
      const model = (type['Model'] || '').toLowerCase();
      const manufacturer = (type['Manufacturer'] || '').toLowerCase();
      const commonName = (type['Common Name'] || '').toLowerCase();

      return icao.includes(q) ||
             model.includes(q) ||
             manufacturer.includes(q) ||
             commonName.includes(q);
    })
    .slice(0, limit);
}

/**
 * Search callsigns (standard and nonstandard)
 * @param {string} query - Search query
 * @param {number} limit - Max results (default 50)
 * @returns {Array} Matching callsigns
 */
export function searchCallsigns(query, limit = 50) {
  if (!vkbData.loaded) return [];

  const q = query.toLowerCase().trim();
  if (!q) return [...vkbData.callsignsStandard, ...vkbData.callsignsNonstandard].slice(0, limit);

  const results = [];
  const seen = new Set(); // Track unique contractions to avoid duplicates

  // Search standard callsigns first (higher priority)
  for (const cs of vkbData.callsignsStandard) {
    if (results.length >= limit) break;

    const callsign = (cs['CALLSIGN'] || '').toLowerCase();
    const tricode = (cs['TRICODE'] || '').toLowerCase();
    const commonName = (cs['COMMON NAME'] || '').toLowerCase();

    if (callsign.includes(q) || tricode.includes(q) || commonName.includes(q)) {
      const record = { ...cs, _source: 'standard' };
      const contraction = getCallsignContraction(record);
      if (!seen.has(contraction)) {
        results.push(record);
        seen.add(contraction);
      }
    }
  }

  // Search nonstandard callsigns - prioritize approved contractions
  const approved = [];
  const other = [];

  for (const cs of vkbData.callsignsNonstandard) {
    const callsign = (cs['CALLSIGN'] || '').toLowerCase();
    const icao3ld = (cs['ICAO 3LD'] || '').toLowerCase();
    const ssrIndication = (cs['SSR INDICATION'] || '').toLowerCase();
    const commonName = (cs['COMMON NAME'] || '').toLowerCase();

    if (callsign.includes(q) || icao3ld.includes(q) || ssrIndication.includes(q) || commonName.includes(q)) {
      const record = { ...cs, _source: 'nonstandard' };
      const isApproved = cs['APPROVED CONTRACTION'] === 'Y';

      if (isApproved) {
        approved.push(record);
      } else {
        other.push(record);
      }
    }
  }

  // Add approved contractions first, then others
  for (const record of [...approved, ...other]) {
    if (results.length >= limit) break;
    const contraction = getCallsignContraction(record);
    if (!seen.has(contraction)) {
      results.push(record);
      seen.add(contraction);
    }
  }

  return results;
}

/**
 * Search locations
 * @param {string} query - Search query
 * @param {number} limit - Max results (default 50)
 * @returns {Array} Matching locations
 */
export function searchLocations(query, limit = 50) {
  if (!vkbData.loaded) return [];

  const q = query.toLowerCase().trim();
  if (!q) return vkbData.locations.slice(0, limit);

  return vkbData.locations
    .filter(loc => {
      const icao = (loc['ICAO CODE'] || '').toLowerCase();
      const iata = (loc['IATA CODE'] || '').toLowerCase();
      const airport = (loc['AIRPORT'] || '').toLowerCase();
      const served = (loc['LOCATION SERVED'] || '').toLowerCase();

      return icao.includes(q) ||
             iata.includes(q) ||
             airport.includes(q) ||
             served.includes(q);
    })
    .slice(0, limit);
}

/**
 * Search registrations
 * @param {string} query - Search query
 * @param {number} limit - Max results (default 50)
 * @returns {Array} Matching registrations
 */
export function searchRegistrations(query, limit = 50) {
  if (!vkbData.loaded) return [];

  const q = query.toLowerCase().trim().replace(/-/g, ''); // Remove dashes from query
  if (!q) return vkbData.registrations.slice(0, limit);

  return vkbData.registrations
    .filter(reg => {
      const registration = (reg['REGISTRATION'] || '').toLowerCase().replace(/-/g, ''); // Remove dashes
      const operator = (reg['OPERATOR'] || '').toLowerCase();
      const type = (reg['TYPE'] || '').toLowerCase();

      return registration.includes(q) ||
             operator.includes(q) ||
             type.includes(q);
    })
    .slice(0, limit);
}

/**
 * Search all VKB data
 * @param {string} query - Search query
 * @param {number} limit - Max results per category (default 10)
 * @returns {Object} Results grouped by category
 */
export function searchAll(query, limit = 10) {
  return {
    aircraftTypes: searchAircraftTypes(query, limit),
    callsigns: searchCallsigns(query, limit),
    locations: searchLocations(query, limit),
    registrations: searchRegistrations(query, limit)
  };
}

/**
 * Extract the contraction from a callsign record
 * Priority: TRICODE (standard) > ICAO 3LD (nonstandard) > SSR INDICATION (nonstandard)
 * For nonstandard, prioritize entries where APPROVED CONTRACTION = 'Y'
 * @param {Object} callsignRecord - Callsign record from VKB
 * @returns {string} Contraction to display
 */
function getCallsignContraction(callsignRecord) {
  // Standard callsigns: Use TRICODE
  if (callsignRecord._source === 'standard') {
    const tricode = callsignRecord['TRICODE'];
    return tricode && tricode !== '-' ? tricode : callsignRecord['CALLSIGN'] || '';
  }

  // Nonstandard callsigns: Use ICAO 3LD > SSR INDICATION
  const icao3ld = callsignRecord['ICAO 3LD'];
  const ssrIndication = callsignRecord['SSR INDICATION'];

  if (icao3ld && icao3ld !== '-' && icao3ld !== 'N/A') {
    return icao3ld;
  }

  if (ssrIndication && ssrIndication !== '-' && ssrIndication !== 'N/A') {
    return ssrIndication;
  }

  // Fallback to voice callsign
  return callsignRecord['CALLSIGN'] || '';
}

/**
 * Get autocomplete suggestions for a field
 * @param {string} fieldType - 'type', 'callsign', 'location', 'registration'
 * @param {string} query - Partial input
 * @param {number} limit - Max suggestions (default 10)
 * @returns {Array} Suggestion objects with primary and secondary text
 */
export function getAutocompleteSuggestions(fieldType, query, limit = 10) {
  if (!vkbData.loaded || !query) return [];

  const q = query.toLowerCase().trim();

  switch (fieldType) {
    case 'type':
      return searchAircraftTypes(q, limit).map(t => ({
        primary: t['ICAO Type Designator'] || '',
        secondary: t['Common Name'] || t['Model'] || ''
      }));

    case 'callsign':
      return searchCallsigns(q, limit).map(c => ({
        primary: getCallsignContraction(c),
        secondary: c['CALLSIGN'] || ''
      }));

    case 'location':
      return searchLocations(q, limit).map(l => ({
        primary: l['ICAO CODE'] || '',
        secondary: l['AIRPORT'] || l['LOCATION SERVED'] || ''
      }));

    case 'registration':
      return searchRegistrations(q, limit).map(r => ({
        primary: r['REGISTRATION'] || '',
        secondary: r['OPERATOR'] || ''
      }));

    default:
      return [];
  }
}

/**
 * Look up a registration in the VKB database
 * @param {string} registration - Registration to look up (e.g., "G-BYUN")
 * @returns {Object|null} Registration data or null if not found
 */
export function lookupRegistration(registration) {
  if (!vkbData.loaded || !registration) return null;

  const normalized = registration.toUpperCase().trim().replace(/-/g, '');

  return vkbData.registrations.find(reg => {
    const regNormalized = (reg['REGISTRATION'] || '').toUpperCase().replace(/-/g, '');
    return regNormalized === normalized;
  }) || null;
}

/**
 * Look up a registration by its fixed callsign
 * @param {string} callsign - Fixed callsign to look up (e.g., "GCLBT")
 * @returns {Object|null} Registration data or null if not found
 */
export function lookupRegistrationByFixedCallsign(callsign) {
  if (!vkbData.loaded || !callsign) return null;

  const normalized = callsign.toUpperCase().trim();

  return vkbData.registrations.find(reg => {
    const fixedCs = (reg['FIXED C/S'] || '').toUpperCase().trim();
    return fixedCs && fixedCs !== '-' && fixedCs === normalized;
  }) || null;
}

/**
 * Normalise a callsign token for EGOW lookup matching only.
 * Uppercase, trim, collapse internal whitespace.
 * Does NOT alter stored or displayed callsigns.
 */
function normalizeCallsignToken(value) {
  return String(value ?? '').toUpperCase().trim().replace(/\s+/g, '');
}

/**
 * Normalise a flight number for EGOW lookup matching only.
 * Strips leading zeroes by parsing as integer so "02", "2", "002" all match.
 * Blank input stays blank (not 0) — blank FLIGHT_NUMBER is the base-strip fallback.
 * Does NOT alter stored or displayed callsigns.
 */
function normalizeFlightNumber(value) {
  const s = String(value ?? '').trim();
  if (!s) return '';
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? String(n) : s.toUpperCase();
}

/**
 * Look up expanded EGOW attribution from a callsign code.
 * Handles base callsigns, approved contractions, and numeric suffixes.
 * Flight-number normalisation is lookup-only. It does not alter stored/displayed callsigns.
 * @param {string} callsignCode - Full callsign (e.g. "UAM03", "MERSY", "MERSY1", "MERSY 1")
 * @returns {Object|null} Attribution object or null if not found
 */
export function lookupEgowAttributionFromCallsign(callsignCode) {
  if (!vkbData.loaded || !callsignCode) return null;

  // Normalise input for matching: uppercase, trim, remove internal whitespace
  const norm = normalizeCallsignToken(callsignCode);

  // Split trailing numeric suffix: "UAM03" → base="UAM", flightNum="03"
  const splitMatch = norm.match(/^([A-Z]+)(\d+)?$/);
  if (!splitMatch) return null;

  const base = splitMatch[1];
  // Normalise flight number for comparison only (strips leading zeroes)
  const flightNum = normalizeFlightNumber(splitMatch[2] || '');

  // Priority 1: CALLSIGN_BASE + FLIGHT_NUMBER exact normalised match.
  // Domain rule: individual-pilot callsign families (e.g. UAM) use leading-zero
  // format for single-digit numbers (UAM01..UAM09). If the operator enters a
  // bare single digit without a leading zero (e.g. "UAM3"), do NOT silently
  // resolve it as UAM03. The check is skipped for formation families whose
  // highest flight number is < 10 (e.g. VITAL1, MERSY1 — those families do
  // not pad single digits). Formation element callsigns whose base has an
  // APPROVED_CONTRACTION are reached via Priority 2 anyway (e.g. MERSY2).
  let row = null;
  let malformedInput = false;
  if (flightNum) {
    // Detect whether the raw input suffix was a single digit with no leading zero.
    const rawSuffix = splitMatch[2] || '';
    const inputIsSingleDigitNoLeadingZero = /^\d$/.test(rawSuffix); // exactly one digit

    row = vkbData.egowCodes.find(ec => {
      const csBase = normalizeCallsignToken(ec['CALLSIGN_BASE']);
      const fNum = normalizeFlightNumber(ec['FLIGHT_NUMBER']);
      return csBase === base && fNum === flightNum;
    });

    // If we found a match but the input was a bare single digit, check whether
    // this base family contains multi-digit flight numbers (>= 10). If it does,
    // the family uses leading-zero protocol for 1-9 and the input is malformed.
    // Set malformedInput to prevent fallthrough to base-strip (Priority 3/4) rows.
    if (row && inputIsSingleDigitNoLeadingZero) {
      const familyHasMultiDigit = vkbData.egowCodes.some(ec => {
        const csBase = normalizeCallsignToken(ec['CALLSIGN_BASE']);
        return csBase === base && parseInt(ec['FLIGHT_NUMBER'] || '0', 10) >= 10;
      });
      if (familyHasMultiDigit) {
        row = null;
        malformedInput = true;
      }
    }
  }

  // Priority 2: APPROVED_CONTRACTION + FLIGHT_NUMBER exact normalised match
  if (!row && flightNum) {
    row = vkbData.egowCodes.find(ec => {
      // Support corrected spelling; fall back to old typo for any legacy files
      const csContr = normalizeCallsignToken(ec['APPROVED_CONTRACTION'] || ec['APPROVED_CONTRATION']);
      const fNum = normalizeFlightNumber(ec['FLIGHT_NUMBER']);
      return csContr && csContr === base && fNum === flightNum;
    });
  }

  // Malformed input (e.g. bare single digit where leading-zero is required):
  // do not fall through to base-strip fallbacks — no attribution is better than wrong attribution.
  if (malformedInput) return null;

  // Priority 3: CALLSIGN_BASE + blank FLIGHT_NUMBER fallback
  if (!row) {
    row = vkbData.egowCodes.find(ec => {
      const csBase = normalizeCallsignToken(ec['CALLSIGN_BASE']);
      const fNum = normalizeFlightNumber(ec['FLIGHT_NUMBER']);
      return csBase === base && fNum === '';
    });
  }

  // Priority 4: APPROVED_CONTRACTION + blank FLIGHT_NUMBER fallback
  if (!row) {
    row = vkbData.egowCodes.find(ec => {
      const csContr = normalizeCallsignToken(ec['APPROVED_CONTRACTION'] || ec['APPROVED_CONTRATION']);
      const fNum = normalizeFlightNumber(ec['FLIGHT_NUMBER']);
      return csContr && csContr === base && fNum === '';
    });
  }

  // Legacy fallback: old-schema 'Callsign' column
  if (!row) {
    row = vkbData.egowCodes.find(ec =>
      normalizeCallsignToken(ec['Callsign']) === norm
    );
  }

  if (!row) return null;

  return {
    callsignBase: (row['CALLSIGN_BASE'] || '').trim(),
    approvedContraction: (row['APPROVED_CONTRACTION'] || row['APPROVED_CONTRATION'] || '').trim(),
    flightNumber: (row['FLIGHT_NUMBER'] || '').trim(),
    egowCode: (row['EGOW_CODE'] || row['EGOW Code'] || '').trim(),
    unit: (row['UNIT'] || '').trim(),
    unitCode: (row['UNIT_CODE'] || row['UC'] || '').trim(),
    name: (row['NAME'] || row['Name'] || '').trim(),
    position: (row['POSITION'] || row['Position'] || '').trim(),
    notes: (row['NOTES'] || '').trim(),
    source: 'egowCodes'
  };
}

/**
 * Look up a callsign in the VKB database
 * @param {string} callsign - Callsign to look up
 * @returns {Object|null} Callsign data or null if not found
 */
export function lookupCallsign(callsign) {
  if (!vkbData.loaded || !callsign) return null;

  const normalized = callsign.toUpperCase().trim();

  // First check EGOW codes using expanded schema resolver
  const egowAttrib = lookupEgowAttributionFromCallsign(normalized);
  if (egowAttrib) {
    // Return normalized object with UC field for backward compat with existing callers
    return {
      'Callsign': normalized,
      'UC': egowAttrib.unitCode,
      'Name': egowAttrib.name,
      'Unit': egowAttrib.unit,
      'EGOW_CODE': egowAttrib.egowCode,
      '_source': 'egowCodes',
      '_egowAttrib': egowAttrib
    };
  }

  // Search both standard and nonstandard callsigns
  let result = vkbData.callsignsStandard.find(cs =>
    (cs['CALLSIGN'] || '').toUpperCase() === normalized
  );

  if (!result) {
    result = vkbData.callsignsNonstandard.find(cs =>
      (cs['CALLSIGN'] || '').toUpperCase() === normalized
    );
  }

  return result || null;
}

/**
 * Look up aircraft pilots by registration or fixed callsign.
 * @param {string} registration - Aircraft registration (e.g. "G-CKSR" or "GCKSR")
 * @param {string} fixedCallsign - Fixed callsign (e.g. "STEARMAN28")
 * @returns {Array} Sorted array of pilot objects
 */
export function lookupAircraftPilots(registration = '', fixedCallsign = '') {
  if (!vkbData.loaded) return [];

  const normReg = registration.toUpperCase().trim().replace(/-/g, '');
  const normCs = fixedCallsign.toUpperCase().trim();

  if (!normReg && !normCs) return [];

  const matches = vkbData.aircraftPilots.filter(row => {
    const rowReg = (row['REGISTRATION'] || '').toUpperCase().trim().replace(/-/g, '');
    const rowCs = (row['FIXED_CALLSIGN'] || '').toUpperCase().trim();
    return (normReg && rowReg === normReg) || (normCs && rowCs === normCs);
  });

  if (matches.length === 0) return [];

  // Count last names to detect duplicates for disambiguation
  const lastNameCounts = {};
  for (const row of matches) {
    const last = (row['PILOT_NAME_LAST'] || '').trim().toUpperCase();
    lastNameCounts[last] = (lastNameCounts[last] || 0) + 1;
  }

  // Sort alphabetically by last name then first name
  const sorted = [...matches].sort((a, b) => {
    const lastA = (a['PILOT_NAME_LAST'] || '').toUpperCase();
    const lastB = (b['PILOT_NAME_LAST'] || '').toUpperCase();
    if (lastA !== lastB) return lastA.localeCompare(lastB);
    return (a['PILOT_NAME_FIRST'] || '').toUpperCase().localeCompare(
      (b['PILOT_NAME_FIRST'] || '').toUpperCase()
    );
  });

  return sorted.map(row => {
    const lastName = (row['PILOT_NAME_LAST'] || '').trim();
    const firstName = (row['PILOT_NAME_FIRST'] || '').trim();
    const isDuplicate = lastNameCounts[lastName.toUpperCase()] > 1;

    let displayName = lastName;
    if (isDuplicate && firstName) {
      displayName = `${lastName} ${firstName.charAt(0)}`;
    }
    const fullName = firstName ? `${lastName} ${firstName}` : lastName;

    return {
      registration: (row['REGISTRATION'] || '').trim(),
      fixedCallsign: (row['FIXED_CALLSIGN'] || '').trim(),
      lastName,
      firstName,
      displayName,
      fullName
    };
  });
}

/**
 * Look up location by ICAO code
 * @param {string} icaoCode - ICAO airport code (e.g., "EGOW", "EGCC")
 * @returns {Object|null} Location data or null if not found
 */
export function lookupLocation(icaoCode) {
  if (!vkbData.loaded || !icaoCode) return null;

  const normalized = icaoCode.toUpperCase().trim();

  return vkbData.locations.find(loc => {
    const icao = (loc['ICAO CODE'] || '').toUpperCase().trim();
    return icao === normalized;
  }) || null;
}

/**
 * Get location name for display
 * @param {string} icaoCode - ICAO airport code
 * @returns {string} Location name (AIRPORT or LOCATION SERVED)
 */
export function getLocationName(icaoCode) {
  const locationData = lookupLocation(icaoCode);
  if (!locationData) return '';

  // Prefer AIRPORT, fall back to LOCATION SERVED
  const airport = (locationData['AIRPORT'] || '').trim();
  const locationServed = (locationData['LOCATION SERVED'] || '').trim();

  return airport || locationServed || '';
}

/**
 * Look up aircraft type data by ICAO Type Designator
 * @param {string} icaoType - ICAO Type Designator (e.g., "A400", "G115")
 * @returns {Object|null} Aircraft type data or null if not found
 */
export function lookupAircraftType(icaoType) {
  if (!vkbData.loaded || !icaoType) return null;

  const normalized = icaoType.toUpperCase().trim();

  return vkbData.aircraftTypes.find(type => {
    const typeDesignator = (type['ICAO Type Designator'] || '').toUpperCase().trim();
    return typeDesignator === normalized;
  }) || null;
}

/**
 * Derive RECAT-EU category from MCTOM (Maximum Certified Take-Off Mass)
 * RECAT-EU categories: A (Super Heavy) to F (Light)
 * @param {number} mctom - MCTOM in kg
 * @returns {string} RECAT-EU category letter
 */
function deriveRecatFromMctom(mctom) {
  if (!mctom || isNaN(mctom)) return "F"; // Default to Light
  if (mctom >= 560000) return "A"; // Super Heavy (A380 class)
  if (mctom >= 136000) return "B"; // Upper Heavy (B747, A350, etc.)
  if (mctom >= 100000) return "C"; // Lower Heavy (B767, A300, etc.)
  if (mctom >= 18000) return "D";  // Upper Medium (A320, B737, etc.)
  if (mctom >= 8600) return "E";   // Lower Medium (Regional jets, turboprops)
  return "F";                       // Light (<8,600 kg)
}

/**
 * Get Wake Turbulence Category for an aircraft type and movement
 * Supports three WTC standards:
 * - ICAO: L/M/H (global baseline by MTOM)
 * - UK: L/S/LM/UM/H/J (CAP 493, uses different categories for DEP vs ARR)
 * - RECAT: A/B/C/D/E/F (RECAT-EU standard)
 *
 * @param {string} icaoType - ICAO Type Designator (e.g., "A400")
 * @param {string} flightType - Flight type: DEP, ARR, LOC, OVR
 * @param {string} wtcStandard - WTC standard: "ICAO", "UK", or "RECAT" (default "ICAO")
 * @returns {string} WTC string (e.g., "H (UK)" or "M (ICAO)" or "C (RECAT)")
 */
export function getWTC(icaoType, flightType, wtcStandard = "ICAO") {
  const typeData = lookupAircraftType(icaoType);
  if (!typeData) return "L (ICAO)"; // Default fallback

  let wtc = "";

  if (wtcStandard === "UK") {
    // UK CAP 493: Uses different categories for departures vs arrivals
    // DEP/OVR use 5 categories: L, S, M, H, J
    // ARR/LOC use 6 categories: L, S, LM, UM, H, J
    if (flightType === "DEP" || flightType === "OVR") {
      wtc = typeData['UK Departure WTC'] || typeData['ICAO WTC'] || "L";
    } else {
      wtc = typeData['UK Arrival WTC'] || typeData['ICAO WTC'] || "L";
    }
    return `${wtc} (UK)`;
  } else if (wtcStandard === "RECAT") {
    // RECAT-EU: Derive from MCTOM if no specific RECAT column exists
    const mctom = parseFloat(typeData['MCTOM (Kg)']) || 0;
    wtc = deriveRecatFromMctom(mctom);
    return `${wtc} (RECAT)`;
  } else {
    // ICAO: L (< 7t), M (7-136t), H (≥ 136t)
    wtc = typeData['ICAO WTC'] || "L";
    return `${wtc} (ICAO)`;
  }
}

/**
 * Look up a callsign by its contraction (TRICODE, ICAO 3LD, or SSR INDICATION)
 * @param {string} contraction - Contraction to look up (e.g., "PLMTR", "BAW")
 * @returns {Object|null} Callsign data or null if not found
 */
export function lookupCallsignByContraction(contraction) {
  if (!vkbData.loaded || !contraction) return null;

  const normalized = contraction.toUpperCase().trim();

  // Search standard callsigns by TRICODE
  let result = vkbData.callsignsStandard.find(cs => {
    const tricode = (cs['TRICODE'] || '').toUpperCase().trim();
    return tricode && tricode !== '-' && tricode === normalized;
  });

  if (result) return result;

  // Search nonstandard callsigns by ICAO 3LD or SSR INDICATION
  result = vkbData.callsignsNonstandard.find(cs => {
    const icao3ld = (cs['ICAO 3LD'] || '').toUpperCase().trim();
    const ssrIndication = (cs['SSR INDICATION'] || '').toUpperCase().trim();

    return (icao3ld && icao3ld !== '-' && icao3ld !== 'N/A' && icao3ld === normalized) ||
           (ssrIndication && ssrIndication !== '-' && ssrIndication !== 'N/A' && ssrIndication === normalized);
  });

  return result || null;
}

/**
 * Check if a code matches a known VKB contraction (TRICODE, ICAO 3LD, or SSR INDICATION)
 * @param {string} code - The code to check (e.g., "BAW", "EOM")
 * @returns {boolean} True if code matches a known contraction
 */
export function isKnownContraction(code) {
  return lookupCallsignByContraction(code) !== null;
}

/**
 * Get voice callsign for display on strip (only if different from contraction and registration)
 * @param {string} contraction - The callsign contraction (e.g., "BAW")
 * @param {string} registration - The aircraft registration (e.g., "G-BYUN")
 * @returns {string} Voice callsign to display, or empty string if shouldn't be shown
 */
export function getVoiceCallsignForDisplay(contraction, registration) {
  if (!vkbData.loaded || !contraction) return '';

  // Look up the callsign (strip flight number to get base callsign)
  const baseCallsign = contraction.replace(/\d+$/, '').trim();
  if (!baseCallsign) return '';

  const csData = lookupCallsignByContraction(baseCallsign);
  if (!csData || !csData['CALLSIGN']) return '';

  const voiceCallsign = csData['CALLSIGN'].toUpperCase().trim();
  const contractionNormalized = baseCallsign.toUpperCase().trim();
  const registrationNormalized = (registration || '').toUpperCase().trim().replace(/-/g, '');

  // Don't show if voice callsign is same as contraction (base only, without flight number)
  if (voiceCallsign === contractionNormalized) {
    return '';
  }

  // Don't show if voice callsign is just the registration (with or without dash)
  if (voiceCallsign === registrationNormalized || voiceCallsign.replace(/-/g, '') === registrationNormalized) {
    return '';
  }

  return voiceCallsign;
}

/**
 * Look up captain name from EGOW codes
 * @param {string} callsignCode - Full callsign code (e.g., "UAM11", "MERSY1")
 * @returns {string} Captain name or empty string
 */
export function lookupCaptainFromEgowCodes(callsignCode) {
  if (!vkbData.loaded || !callsignCode) return '';
  const attrib = lookupEgowAttributionFromCallsign(callsignCode);
  return attrib ? attrib.name : '';
}

/**
 * Look up unit code from EGOW codes
 * @param {string} callsignCode - Full callsign code (e.g., "UAM11", "MERSY1")
 * @returns {string} Unit code (L, M, A) or empty string
 */
export function lookupUnitCodeFromEgowCodes(callsignCode) {
  if (!vkbData.loaded || !callsignCode) return '';
  const attrib = lookupEgowAttributionFromCallsign(callsignCode);
  return attrib ? attrib.unitCode : '';
}

/**
 * Look up unit description from callsign databases
 * @param {string} callsignCode - Full callsign code (e.g., "BAW123", "UAM11")
 * @param {string} acftType - Aircraft type for disambiguation
 * @returns {string} Unit description or '-'
 */
export function lookupUnitFromCallsign(callsignCode, acftType = '') {
  if (!vkbData.loaded || !callsignCode) return '-';

  // Extract tricode/contraction from callsign (remove flight number)
  const baseCallsign = callsignCode.replace(/\d+$/, '').trim().toUpperCase();

  // First try standard callsigns by TRICODE
  const standardMatch = vkbData.callsignsStandard.find(cs => {
    const tricode = (cs['TRICODE'] || '').toUpperCase().trim();
    return tricode && tricode !== '-' && tricode === baseCallsign;
  });

  if (standardMatch) {
    return (standardMatch['COMMON NAME'] || '').trim() || '-';
  }

  // Try nonstandard callsigns by SSR INDICATION
  const ssrMatches = vkbData.callsignsNonstandard.filter(cs => {
    const ssrIndication = (cs['SSR INDICATION'] || '').toUpperCase().trim();
    return ssrIndication && ssrIndication !== '-' && ssrIndication !== 'N/A' && ssrIndication === baseCallsign;
  });

  if (ssrMatches.length === 0) return '-';

  // If multiple matches, try to disambiguate by aircraft type
  if (ssrMatches.length > 1 && acftType) {
    const typeNormalized = acftType.toUpperCase().trim();
    const typeMatch = ssrMatches.find(cs => {
      const csType = (cs['ACFT TYPE'] || '').toUpperCase().trim();
      return csType === typeNormalized;
    });
    if (typeMatch) {
      return (typeMatch['UNIT OR OPERATOR'] || '').trim() || '-';
    }
  }

  // Return first match or best guess
  return (ssrMatches[0]['UNIT OR OPERATOR'] || '').trim() || '-';
}

/**
 * Look up operator from callsign databases
 * @param {string} callsignCode - Full callsign code (e.g., "BAW123", "UAM11")
 * @param {string} acftType - Aircraft type for disambiguation
 * @returns {string} Operator name or '-'
 */
export function lookupOperatorFromCallsign(callsignCode, acftType = '') {
  if (!vkbData.loaded || !callsignCode) return '-';

  // Extract tricode/contraction from callsign (remove flight number)
  const baseCallsign = callsignCode.replace(/\d+$/, '').trim().toUpperCase();

  // First try standard callsigns by TRICODE
  const standardMatch = vkbData.callsignsStandard.find(cs => {
    const tricode = (cs['TRICODE'] || '').toUpperCase().trim();
    return tricode && tricode !== '-' && tricode === baseCallsign;
  });

  if (standardMatch) {
    return (standardMatch['COMPANY/CORPORATE NAME'] || '').trim() || '-';
  }

  // Try nonstandard callsigns by SSR INDICATION
  const ssrMatches = vkbData.callsignsNonstandard.filter(cs => {
    const ssrIndication = (cs['SSR INDICATION'] || '').toUpperCase().trim();
    return ssrIndication && ssrIndication !== '-' && ssrIndication !== 'N/A' && ssrIndication === baseCallsign;
  });

  if (ssrMatches.length === 0) return '-';

  // If multiple matches, try to disambiguate by aircraft type
  if (ssrMatches.length > 1 && acftType) {
    const typeNormalized = acftType.toUpperCase().trim();
    const typeMatch = ssrMatches.find(cs => {
      const csType = (cs['ACFT TYPE'] || '').toUpperCase().trim();
      return csType === typeNormalized;
    });
    if (typeMatch) {
      return (typeMatch['FORCE'] || '').trim() || '-';
    }
  }

  // Return first match or best guess
  return (ssrMatches[0]['FORCE'] || '').trim() || '-';
}

// ── VKB Local Override Layer ───────────────────────────────────────────────

/**
 * Build the composite key for an EGOW code row.
 * Format: CALLSIGN_BASE|APPROVED_CONTRACTION|FLIGHT_NUMBER
 * FLIGHT_NUMBER preserves leading zeroes — do not normalise to integer.
 */
export function buildEgowCodeKey(row) {
  const base = (row['CALLSIGN_BASE'] || '').toUpperCase().trim();
  const contraction = (row['APPROVED_CONTRACTION'] || row['APPROVED_CONTRATION'] || '').toUpperCase().trim();
  const flightNum = (row['FLIGHT_NUMBER'] || '').trim();
  return `${base}|${contraction}|${flightNum}`;
}

/**
 * Build the storage key for a registration row or registration string.
 * Uppercase, trim, remove hyphens and spaces.
 */
export function buildRegistrationKey(rowOrRegistration) {
  const reg = typeof rowOrRegistration === 'string'
    ? rowOrRegistration
    : (rowOrRegistration['REGISTRATION'] || '');
  return reg.toUpperCase().trim().replace(/[-\s]/g, '');
}

/**
 * Read local VKB overrides from localStorage.
 */
export function getVKBOverrides() {
  try {
    const raw = window.localStorage.getItem(VKB_OVERRIDES_KEY);
    if (!raw) return _emptyOverrides();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return _emptyOverrides();
    if (!parsed.datasets) parsed.datasets = {};
    if (!parsed.datasets.egowCodes) parsed.datasets.egowCodes = {};
    if (!parsed.datasets.registrations) parsed.datasets.registrations = {};
    return parsed;
  } catch (_) {
    return _emptyOverrides();
  }
}

function _emptyOverrides() {
  return { version: 1, updatedAt: null, datasets: { egowCodes: {}, registrations: {} } };
}

/**
 * Persist local VKB overrides to localStorage and recompute effective arrays.
 */
export function saveVKBOverrides(overrides) {
  overrides.updatedAt = new Date().toISOString();
  window.localStorage.setItem(VKB_OVERRIDES_KEY, JSON.stringify(overrides));
}

/** Count of override entries by dataset and total. */
export function getVKBOverrideSummary() {
  const overrides = getVKBOverrides();
  const egowCount = Object.keys(overrides.datasets.egowCodes || {}).length;
  const regCount = Object.keys(overrides.datasets.registrations || {}).length;
  return { egowCodes: egowCount, registrations: regCount, total: egowCount + regCount };
}

export function getBaselineEgowCodes() { return vkbBaselineData.egowCodes; }
export function getBaselineRegistrations() { return vkbBaselineData.registrations; }
export function getEffectiveEgowCodes() { return vkbData.egowCodes; }
export function getEffectiveRegistrations() { return vkbData.registrations; }

/**
 * Return provenance status for a record key in a dataset.
 * Returns 'bundled' | 'locally-edited' | 'locally-added' | 'locally-hidden'
 */
export function getVKBRecordStatus(datasetName, key) {
  const overrides = getVKBOverrides();
  const entry = (overrides.datasets[datasetName] || {})[key];
  if (!entry) return 'bundled';
  if (entry.action === 'add') return 'locally-added';
  if (entry.action === 'edit') return 'locally-edited';
  if (entry.action === 'hide') return 'locally-hidden';
  return 'bundled';
}

/**
 * Save an edit or add override for a record.
 * Determines action by checking whether the key exists in the bundled baseline.
 */
export function upsertVKBOverride(datasetName, key, fields, note = '') {
  const overrides = getVKBOverrides();
  if (!overrides.datasets[datasetName]) overrides.datasets[datasetName] = {};

  const existing = overrides.datasets[datasetName][key];
  const now = new Date().toISOString();

  let action;
  if (existing && existing.action === 'add') {
    action = 'add';
  } else {
    const baselineArray = datasetName === 'egowCodes' ? vkbBaselineData.egowCodes : vkbBaselineData.registrations;
    const keyFn = datasetName === 'egowCodes' ? buildEgowCodeKey : buildRegistrationKey;
    const inBaseline = baselineArray.some(row => keyFn(row) === key);
    action = inBaseline ? 'edit' : 'add';
  }

  overrides.datasets[datasetName][key] = {
    action,
    key,
    fields,
    createdAt: existing ? existing.createdAt : now,
    updatedAt: now,
    createdFrom: 'admin-vkb-editor',
    note,
    submitStatus: 'local-only'
  };

  saveVKBOverrides(overrides);
  _reapplyOverrides();
}

/**
 * Hide a bundled record from active lookup, or remove a locally-added record.
 */
export function hideVKBRecord(datasetName, key, note = '') {
  const overrides = getVKBOverrides();
  if (!overrides.datasets[datasetName]) overrides.datasets[datasetName] = {};

  const existing = overrides.datasets[datasetName][key];
  if (existing && existing.action === 'add') {
    delete overrides.datasets[datasetName][key];
    saveVKBOverrides(overrides);
    _reapplyOverrides();
    return;
  }

  const now = new Date().toISOString();
  overrides.datasets[datasetName][key] = {
    action: 'hide',
    key,
    fields: existing ? existing.fields : {},
    createdAt: existing ? existing.createdAt : now,
    updatedAt: now,
    createdFrom: 'admin-vkb-editor',
    note,
    submitStatus: 'local-only'
  };

  saveVKBOverrides(overrides);
  _reapplyOverrides();
}

/**
 * Remove a local override, restoring the record to bundled baseline.
 */
export function resetVKBOverride(datasetName, key) {
  const overrides = getVKBOverrides();
  if (overrides.datasets[datasetName]) {
    delete overrides.datasets[datasetName][key];
    saveVKBOverrides(overrides);
    _reapplyOverrides();
  }
}

/**
 * Apply stored overrides to a baseline array.
 * - edit: merges fields over the baseline row (shallow copy, no mutation)
 * - add: appends new rows after baseline, sorted by key
 * - hide: excludes the row from the result
 * - malformed entries: silently ignored
 * Never mutates the original baseline array.
 */
function applyDatasetOverrides(datasetName, baselineRows) {
  let overrides;
  try {
    overrides = getVKBOverrides();
  } catch (_) {
    return baselineRows.map(r => ({ ...r }));
  }

  const datasetOverrides = (overrides.datasets && overrides.datasets[datasetName]) || {};
  const keyFn = datasetName === 'egowCodes' ? buildEgowCodeKey : buildRegistrationKey;

  const baselineKeys = new Set();
  const result = [];

  for (const row of baselineRows) {
    const key = keyFn(row);
    baselineKeys.add(key);
    const entry = datasetOverrides[key];

    if (!entry || !entry.action) {
      result.push({ ...row });
    } else if (entry.action === 'edit' && entry.fields && typeof entry.fields === 'object') {
      result.push({ ...row, ...entry.fields });
    } else if (entry.action === 'hide') {
      // excluded
    } else {
      result.push({ ...row }); // malformed: fall back to baseline
    }
  }

  // Append locally-added rows (keys not in baseline), sorted deterministically
  const addedEntries = Object.entries(datasetOverrides)
    .filter(([key, entry]) => entry.action === 'add' && !baselineKeys.has(key))
    .sort(([a], [b]) => a.localeCompare(b));

  for (const [, entry] of addedEntries) {
    if (entry.fields && typeof entry.fields === 'object') {
      result.push({ ...entry.fields });
    }
  }

  return result;
}

/** Recompute effective arrays after any override change and notify listeners. */
function _reapplyOverrides() {
  vkbData.registrations = applyDatasetOverrides('registrations', vkbBaselineData.registrations);
  vkbData.egowCodes = applyDatasetOverrides('egowCodes', vkbBaselineData.egowCodes);
  window.dispatchEvent(new CustomEvent('fdms:vkb-overrides-changed'));
}

// ── End VKB Override Layer ──────────────────────────────────────────────────

/**
 * Validate squawk code
 * @param {string} squawk - Squawk code to validate (with or without #)
 * @returns {Object} {valid: boolean, errors: string[]}
 */
export function validateSquawkCode(squawk) {
  const errors = [];

  if (!squawk || squawk === '—' || squawk === '-') {
    return { valid: true, errors: [] };
  }

  // Remove # if present for validation
  const code = squawk.replace('#', '').trim();

  // Check if it's exactly 4 digits
  if (!/^\d{4}$/.test(code)) {
    if (code.length < 4) {
      errors.push('Squawk code must be exactly 4 digits (currently too few)');
    } else if (code.length > 4) {
      errors.push('Squawk code must be exactly 4 digits (currently too many)');
    } else {
      errors.push('Squawk code must contain only digits');
    }
  }

  // Check for 8 or 9
  if (/[89]/.test(code)) {
    errors.push('Squawk code cannot contain 8 or 9');
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}
