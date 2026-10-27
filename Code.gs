/**
 * Główna funkcja serwująca aplikację w środowisku Google Apps Script (Web App)
 */
function doGet(e) {
  // ==========================================================
  // 1. OBSŁUGA LOCALHOSTA (Zwraca czysty JSON dla API)
  // ==========================================================
  if (e && e.parameter && e.parameter.action) {
    var action = e.parameter.action;
    var data = {};

    if (action === 'getScheduleData') data = getScheduleData();
    else if (action === 'getClientsData') data = getClientsData();
    else if (action === 'getBillingsDataForFrontend') data = getBillingsDataForFrontend();
    else if (action === 'getAxonDataForFrontend') data = getAxonDataForFrontend();
    else if (action === 'getTicketsData') data = getTicketsData();
    else if (action === 'getTicketsFromSheet') data = getTicketsFromSheet();
    else if (action === 'getMapData') data = getMapData();
    else if (action === 'getTechniciansFromBase') data = getTechniciansFromBase();
    else if (action === 'getStorageData') data = getStorageData();

    return ContentService.createTextOutput(typeof data === 'string' ? data : JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // ==========================================================
  // 2. PRODUKCJA: Ładowanie szablonu i wstrzykiwanie danych
  // ==========================================================
  var template = HtmlService.createTemplateFromFile('Index');
  
  // Wrzucamy pakiety startowe do szablonu (Teraz to będzie w ułamku sekundy dzięki Cache!)
  template.scheduleDataInit    = getScheduleData(); 
  template.clientsDataInit     = getClientsData();
  template.billingsDataInit    = getBillingsDataForFrontend();
  template.axonDataInit        = getAxonDataForFrontend();
  template.ekoenDataInit       = getTicketsData();
  template.mapDataInit         = getMapData();
  template.techniciansDataInit = getTechniciansFromBase();
  template.storageDataInit     = getStorageData();

  return template.evaluate()
    .setTitle('EKOEN Field Service Management')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
} 

// =========================================================================
// UNIWERSALNE NARZĘDZIA BAZY DANYCH (ZAAWANSOWANY CACHE CHUNKOWY)
// =========================================================================

/**
 * Bezpiecznie konwertuje dowolną wartość z komórki na tekst
 */
function safeString(val) {
  if (val instanceof Date) {
    return val.toISOString(); // Zwracamy czysty format ISO
  }
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

/**
 * Zapisuje długi ciąg tekstowy (np. JSON) do Cache, dzieląc go na 90KB fragmenty
 */
function putLargeCache(key, valueString, expirationInSeconds) {
  var cache = CacheService.getScriptCache();
  var chunkSize = 90000; // Limit GAS to 100KB (100,000 bytes)
  var numChunks = Math.ceil(valueString.length / chunkSize);
  
  cache.put(key + '_CHUNKS', String(numChunks), expirationInSeconds);
  
  for (var i = 0; i < numChunks; i++) {
    var chunk = valueString.substring(i * chunkSize, (i + 1) * chunkSize);
    cache.put(key + '_' + i, chunk, expirationInSeconds);
  }
}

/**
 * Odczytuje pofragmentowany Cache z pamięci
 */
function getLargeCache(key) {
  var cache = CacheService.getScriptCache();
  var numChunks = cache.get(key + '_CHUNKS');
  if (!numChunks) return null;
  
  var fullString = "";
  for (var i = 0; i < parseInt(numChunks); i++) {
    var chunk = cache.get(key + '_' + i);
    if (!chunk) return null; // Brak jakiegoś fragmentu - uznajemy cache za zepsuty
    fullString += chunk;
  }
  
  return fullString;
}

/**
 * Usuwa cały pofragmentowany klucz z pamięci Cache
 */
function removeLargeCache(key) {
  var cache = CacheService.getScriptCache();
  var numChunks = cache.get(key + '_CHUNKS');
  if (numChunks) {
    for (var i = 0; i < parseInt(numChunks); i++) {
      cache.remove(key + '_' + i);
    }
    cache.remove(key + '_CHUNKS');
  }
}

/**
 * UNIWERSALNY ODCZYT (CACHE 12h): Pobiera dane z dowolnej tabeli 'sys_' i zamienia je na tablicę obiektów.
 * Użycie: db_readTable('sys_clients')
 */
function db_readTable(tableName) {
  var cacheKey = "DB_TABLE_" + tableName;
  
  // 1. Sprawdzamy, czy dane istnieją w szybkim Cache
  var cachedData = getLargeCache(cacheKey);
  if (cachedData) {
    // Odczyt z pamięci
    return cachedData;
  }
  
  // 2. Jeśli nie ma w cache (bo wygasło lub to pierwszy odczyt po nadpisaniu), czytamy bezpośrednio z arkusza
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(tableName);
    
    if (!sheet) {
      return JSON.stringify({ success: false, error: "Tabela " + tableName + " nie istnieje w bazie." });
    }
    
    var data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      return JSON.stringify({ success: true, data: [] });
    }
    
    var headers = data[0].map(function(h) { return safeString(h); });
    var records = [];
    
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!safeString(row[0]) && !safeString(row[1])) continue; 
      
      var record = {};
      for (var j = 0; j < headers.length; j++) {
        record[headers[j]] = safeString(row[j]);
      }
      records.push(record);
    }
    
    var jsonOutput = JSON.stringify({ success: true, data: records });
    
    // 3. Zapisujemy odczytaną bazę do superszybkiego Cache na 12 godzin (43200 sekund)
    putLargeCache(cacheKey, jsonOutput, 43200);
    
    return jsonOutput;
    
  } catch (e) {
    return JSON.stringify({ success: false, error: e.toString() });
  }
}

// =========================================================================
// STRUKTURA I INSTALACJA BAZY
// =========================================================================

function setupDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var dbSchema = {
    'sys_stations': [
      "id", "public_id", "client_id", "status", "model", "inspection_date", 
      "country", "city", "street", "street_number", "region", "gps_lat", "gps_lng", 
      "logistics_info", "technician_id", "active_ticket_id", "ticket_category", 
      "ticket_status", "ticket_technician", "is_muted", "created_at"
    ],
    'sys_clients': [
      "id", "name", "contact_person", "email", "phone", 
      "sla_hours", "color_hex", "mrr", "notes", "created_at"
    ],
    'sys_technicians': [
      "id", "name", "zone_color", "zone_geometry", "phone", 
      "car_plate", "car_category", "sep_expiry", "contract_expiry", "shortcut_key"
    ],
    'sys_area': [
      "id", "name", "color", "zone_geometry"
    ],
    'sys_calendar_events': [
  "id", "ticket_id", "technician_id", "title","start_time", "end_time", 
  "event_type", "created_at"
    ],
    'sys_tickets': [
      "id", "ticket_number", "station_id", "technician_id", "status", 
      "priority", "subject", "description", "created_at", "closed_at", 
      "start_datetime", "end_datetime", "all_day", "attachments_url",
      "manufacturer", "city", "street", "zip", "contact_name", "contact_phone", "contact_email",
      "ticket_status", "req_status", "raw_info", "raw_diagnoza", "notes"
    ],
    'sys_parts': [
      "id_sku", "name", "category", "unit", "zg_stock", "warsaw_stock", "used_stock",
      "min_stock", "serial_number", "service_status", "inspection_insurance_date", "created_at"
    ],
    'sys_inventory_logs': [
      "id", "date", "operation_type", "part_sku", "quantity", 
      "technician_id", "ticket_id", "notes"
    ],
    'sys_users': [
      "id", "email", "password", "role", "status", 
      "allowed_panels", "last_login", "settings"
    ]
  };

  for (var sheetName in dbSchema) {
    var sheet = ss.getSheetByName(sheetName);
    var headers = dbSchema[sheetName];
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(headers); 
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold").setBackground("#f1f5f9");
      sheet.setFrozenRows(1);
      sheet.autoResizeColumns(1, headers.length);
      Logger.log("Utworzono: " + sheetName);
    } else {
      var currentHeaders = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
      if (currentHeaders.length === 1 && currentHeaders[0] === "") {
         sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
         sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f1f5f9");
         sheet.setFrozenRows(1);
      }
    }
  }
}

// === KONFIGURACJA ARKUSZA SYS_USERS ===

function setupSysUsersDropdowns() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('sys_users');
  
  if (!sheet) {
    console.error("Brak arkusza sys_users.");
    return;
  }
  
  var lastRow = sheet.getMaxRows();
  if (lastRow < 2) return;
  
  var roleRange = sheet.getRange(2, 4, lastRow - 1, 1);
  var statusRange = sheet.getRange(2, 5, lastRow - 1, 1);
  
  // 1. Dropdown dla ROLI
  var roleRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['ADMIN', 'MANAGER', 'DISPATCHER', 'TECHNICIAN'], true)
    .setAllowInvalid(false)
    .build();
  roleRange.setDataValidation(roleRule);
  
  // 2. Dropdown dla STATUSU
  var statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['ACTIVE', 'SUSPENDED'], true)
    .setAllowInvalid(false)
    .build();
  statusRange.setDataValidation(statusRule);

  // UWAGA: Usunięto nadpisywanie kolumny F (Panele). 
  // Możesz teraz swobodnie używać menu z checkboxami stworzonego prosto z Google Sheets!
}

// =========================================================================
// MODUŁ: KLIENCI (CRM)
// =========================================================================

function getClientsData() {
  try {
    var clRes = JSON.parse(db_readTable('sys_clients'));
    var stRes = JSON.parse(db_readTable('sys_stations'));
    
    return JSON.stringify({
      success: true,
      data: {
        clients: clRes.success ? clRes.data : [],
        stations: stRes.success ? stRes.data : []
      },
      clients: clRes.success ? clRes.data : [], // Fallback
      stations: stRes.success ? stRes.data : [] // Fallback
    });
  } catch (e) {
    return JSON.stringify({ success: false, error: e.toString() });
  }
}

function getClientsFromBase() { return db_readTable('sys_clients'); }
function getStationsFromSheet() { return db_readTable('sys_stations'); }

function saveClientToBase(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('sys_clients');
  if (!sheet) throw new Error("Brak zakładki sys_clients w bazie. Uruchom setupDatabase().");

  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;

  if (payload.id) {
    for (var i = 1; i < data.length; i++) {
      if (safeString(data[i][0]) === safeString(payload.id)) {
        rowIndex = i + 1;
        break;
      }
    }
  }

  var id = payload.id || Utilities.getUuid(); 
  var now = new Date().toISOString();

  var rowData = [
    id,
    payload.name || "",
    payload.contact_person || "",
    payload.email || "",
    payload.phone || "",
    payload.sla_hours || 48,
    payload.color || "#58b347",
    0, 
    payload.notes || "",
    now
  ];

  if (rowIndex !== -1) {
    rowData[7] = data[rowIndex-1][7]; 
    rowData[9] = data[rowIndex-1][9];
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  removeLargeCache("DB_TABLE_sys_clients");
  return true;
}

function deleteClientFromBase(id) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('sys_clients');
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (safeString(data[i][0]) === safeString(id)) {
      sheet.deleteRow(i + 1);
      removeLargeCache("DB_TABLE_sys_clients");
      return true;
    }
  }
  removeLargeCache("DB_TABLE_sys_clients");
  return false;
}

function syncClientsFromStations() {
  var stRes = JSON.parse(db_readTable('sys_stations'));
  var clRes = JSON.parse(db_readTable('sys_clients'));
  
  if (!stRes.success) throw new Error(stRes.error);
  
  var stations = stRes.data || [];
  var clients = clRes.data || [];
  
  var existingNames = clients.map(function(c) { return safeString(c.name).toLowerCase(); });
  var newClients = {};
  
  stations.forEach(function(s) {
    var cName = s.client_id; 
    if (cName && cName.trim() !== "") {
      var nameLow = cName.trim().toLowerCase();
      if (existingNames.indexOf(nameLow) === -1 && !newClients[nameLow]) {
        newClients[nameLow] = cName.trim();
      }
    }
  });
  
  var keys = Object.keys(newClients);
  if (keys.length === 0) return 0;
  
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('sys_clients');
  var now = new Date().toISOString();
  var rowsToAppend = [];
  
  keys.forEach(function(k) {
    rowsToAppend.push([ Utilities.getUuid(), newClients[k], "", "", "", 48, "#58b347", 0, "", now ]);
  });
  
  sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAppend.length, rowsToAppend[0].length).setValues(rowsToAppend);
  removeLargeCache("DB_TABLE_sys_clients");
  return rowsToAppend.length;
}

function updateGeneratedClientIdInBase(clientName, newUuid) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('sys_clients');
  if (!sheet) return;
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const idCol = headers.indexOf('id');
  const nameCol = headers.indexOf('name');
  const slaCol = headers.indexOf('sla_hours');
  const colorCol = headers.indexOf('color_hex');
  const createdCol = headers.indexOf('created_at');
  
  if (idCol === -1 || nameCol === -1) return;
  const now = new Date().toISOString();
  
  for (let i = 1; i < data.length; i++) {
    // Szukamy klienta po nazwie, który ma puste ID
    if (String(data[i][nameCol]).trim() === String(clientName).trim() && String(data[i][idCol]) === '') {
      
      // Nadajemy wygenerowane UUID
      sheet.getRange(i + 1, idCol + 1).setValue(newUuid);
      
      // Uzupełniamy domyślne dane, aby CRM poprawnie wyświetlał klienta
      if (slaCol !== -1 && String(data[i][slaCol]) === '') {
        sheet.getRange(i + 1, slaCol + 1).setValue(48);
      }
      if (colorCol !== -1 && String(data[i][colorCol]) === '') {
        sheet.getRange(i + 1, colorCol + 1).setValue("#58b347");
      }
      if (createdCol !== -1 && String(data[i][createdCol]) === '') {
        sheet.getRange(i + 1, createdCol + 1).setValue(now);
      }
      break; // Przerywamy pętlę po zaktualizowaniu właściwego rekordu
    }
  }
  removeLargeCache("DB_TABLE_sys_clients");
}

function forceFillMissingClientIds() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('sys_clients');
  if (!sheet) {
    Logger.log("Brak zakładki sys_clients");
    return;
  }
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  
  var idCol = headers.indexOf('id');
  var nameCol = headers.indexOf('name');
  var slaCol = headers.indexOf('sla_hours');
  var colorCol = headers.indexOf('color_hex');
  var mrrCol = headers.indexOf('mrr');
  var createdCol = headers.indexOf('created_at');
  
  if (idCol === -1 || nameCol === -1) return;
  
  var now = new Date().toISOString();
  var changed = 0;
  
  for (var i = 1; i < data.length; i++) {
    // Sprawdzamy czy ID jest puste, ale nazwa firmy istnieje
    if (String(data[i][idCol]) === '' && String(data[i][nameCol]).trim() !== '') {
      
      sheet.getRange(i + 1, idCol + 1).setValue(Utilities.getUuid());
      
      if (slaCol !== -1 && String(data[i][slaCol]) === '') sheet.getRange(i + 1, slaCol + 1).setValue(48);
      if (colorCol !== -1 && String(data[i][colorCol]) === '') sheet.getRange(i + 1, colorCol + 1).setValue("#58b347");
      if (mrrCol !== -1 && String(data[i][mrrCol]) === '') sheet.getRange(i + 1, mrrCol + 1).setValue(0);
      if (createdCol !== -1 && String(data[i][createdCol]) === '') sheet.getRange(i + 1, createdCol + 1).setValue(now);
      
      changed++;
    }
  }
  
  Logger.log("Zaktualizowano brakujące ID dla " + changed + " klientów.");
  removeLargeCache("DB_TABLE_sys_clients");
}

// =========================================================================
// MODUŁ: TECHNICY / KADRY (sys_technicians)
// =========================================================================

function getTechniciansFromBase() { return db_readTable('sys_technicians'); }

function saveTechnicianToBase(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('sys_technicians');
  if (!sheet) throw new Error("Brak zakładki sys_technicians.");

  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;

  if (payload.id) {
    for (var i = 1; i < data.length; i++) {
      if (safeString(data[i][0]) === safeString(payload.id)) {
        rowIndex = i + 1;
        break;
      }
    }
  }

  var id = payload.id || Utilities.getUuid();
  var rowData = [
    id, payload.name || "", payload.zone_color || "#3b82f6", payload.zone_geometry || "",
    payload.phone || "", payload.car_plate || "", payload.car_category || "Osobowy",
    payload.sep_expiry || "", payload.contract_expiry || "", payload.shortcut_key || ""
  ];

  if (rowIndex !== -1) {
    if (!payload.zone_geometry && data[rowIndex-1][3]) { rowData[3] = data[rowIndex-1][3]; }
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  removeLargeCache("DB_TABLE_sys_technicians");
  return true;
}

function deleteTechnicianFromBase(id) { return deleteTechniciansBulk([id]); }

function deleteTechniciansBulk(idsArray) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetTechs = ss.getSheetByName('sys_technicians');
  if (!sheetTechs) throw new Error("Brak zakładki sys_technicians.");

  var dataTechs = sheetTechs.getDataRange().getValues();
  var rowsToDelete = [];
  var namesToRemove = [];

  for (var i = 1; i < dataTechs.length; i++) {
    var rowId = dataTechs[i][0] ? String(dataTechs[i][0]).trim() : "";
    if (idsArray.indexOf(rowId) !== -1) {
      rowsToDelete.push(i + 1);
      var techName = dataTechs[i][1] ? String(dataTechs[i][1]).trim() : "";
      if (techName) namesToRemove.push(techName);
    }
  }

  rowsToDelete.reverse().forEach(function(rowIdx) { sheetTechs.deleteRow(rowIdx); });

  if (namesToRemove.length > 0) {
    var sheetStations = ss.getSheetByName('sys_stations'); 
    if (sheetStations) {
      var statData = sheetStations.getDataRange().getValues();
      var headers = statData[0];
      var techColIdx = headers.findIndex(function(h) { 
        let str = String(h).trim().toLowerCase(); 
        return str === 'technician_id' || str === 'technician' || str === 'opiekun'; 
      });

      if (techColIdx !== -1) {
        for (var r = 1; r < statData.length; r++) {
          var currentVal = statData[r][techColIdx] ? String(statData[r][techColIdx]) : "";
          var updatedVal = currentVal;
          var changed = false;

          namesToRemove.forEach(function(nameToRemove) {
            if (updatedVal.indexOf(nameToRemove) !== -1) {
              var techArray = updatedVal.split(',').map(function(t) { return t.trim(); });
              techArray = techArray.filter(function(t) { return t !== nameToRemove; });
              updatedVal = techArray.join(', ');
              changed = true;
            }
          });

          if (changed) sheetStations.getRange(r + 1, techColIdx + 1).setValue(updatedVal);
        }
      }
    }
  }
  removeLargeCache("DB_TABLE_sys_technicians");
  removeLargeCache("DB_TABLE_sys_stations");
  return true;
}

// =========================================================================
// MODUŁ: MAGAZYN I FLOTA (ZAKTUALIZOWANY DLA DYNAMICZNYCH KOLUMN)
// =========================================================================

function getStorageData() {
  try {
    var partsRes = JSON.parse(db_readTable('sys_parts'));
    var techsRes = JSON.parse(db_readTable('sys_technicians'));
    var logsRes = JSON.parse(db_readTable('sys_inventory_logs'));

    return JSON.stringify({
      success: true,
      parts: (partsRes && partsRes.success) ? partsRes.data : [],
      techs: (techsRes && techsRes.success) ? techsRes.data : [],
      inventory: [], // Przesyłamy puste, bo frontend będzie czytał to z 'parts'
      logs: (logsRes && logsRes.success) ? logsRes.data.reverse() : []
    });
  } catch (e) {
    return JSON.stringify({ success: false, error: e.toString() });
  }
}

function savePartToBase(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('sys_parts');
  if (!sheet) throw new Error("Brak zakładki sys_parts.");

  var data = sheet.getDataRange().getValues();
  var headers = data[0] || []; 
  var rowIndex = -1;

  if (payload.id_sku) {
    for (var i = 1; i < data.length; i++) {
      if (safeString(data[i][0]).toLowerCase() === safeString(payload.id_sku).toLowerCase()) {
        rowIndex = i + 1;
        break;
      }
    }
  }

  var now = new Date().toISOString();
  // ROW DATA ZAKTUALIZOWANE O 12 KOLUMN
  var rowData = [
    payload.id_sku || ('SKU-' + Math.floor(Math.random()*899999 + 100000)),
    payload.name || "", payload.category || "Części zamienne", payload.unit || "szt.",
    parseInt(payload.zg_stock) || 0,
    0, // warsaw_stock domyślnie
    0, // used_stock domyślnie
    parseInt(payload.min_stock) || 3,
    payload.serial_number || "", payload.service_status || "Sprawny",
    payload.inspection_insurance_date || "", now
  ];

  if (rowIndex !== -1) {
    var existingRow = data[rowIndex - 1];
    rowData[5] = existingRow[5]; // Zachowaj stan WAW
    rowData[6] = existingRow[6]; // Zachowaj stan Zużytych
    rowData[11] = existingRow[11] || now; 
    
    if (existingRow.length > 12) {
      var techColumns = existingRow.slice(12);
      rowData = rowData.concat(techColumns);
    }
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    while (rowData.length < headers.length) rowData.push("");
    sheet.appendRow(rowData);
  }
  removeLargeCache("DB_TABLE_sys_parts");
  return true;
}

function saveStorageOperation(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var partsSheet = ss.getSheetByName('sys_parts');
  var techsSheet = ss.getSheetByName('sys_technicians');
  var logsSheet = ss.getSheetByName('sys_inventory_logs');

  if (!partsSheet || !techsSheet || !logsSheet) throw new Error("Brak tabel magazynowych.");

  var qty = parseInt(payload.quantity) || 0;
  if (qty <= 0) throw new Error("Nieprawidłowa ilość!");

  var partsData = partsSheet.getDataRange().getValues();
  var headers = partsData[0].map(function(h) { return safeString(h); });
  var partRowIndex = -1;

  for (var i = 1; i < partsData.length; i++) {
    if (safeString(partsData[i][0]) === safeString(payload.part_sku)) {
      partRowIndex = i + 1;
      break;
    }
  }
  if (partRowIndex === -1) throw new Error("Nie odnaleziono części.");

  var mainStockCol = headers.indexOf('zg_stock');
  var wawStockCol = headers.indexOf('warsaw_stock');
  var usedStockCol = headers.indexOf('used_stock');
  
  if (mainStockCol === -1 || wawStockCol === -1 || usedStockCol === -1) {
      throw new Error("Baza jest nieaktualna. Kliknij 'Generuj sys_parts' w arkuszu!");
  }

  // Źródło operacji (ZG lub WAW)
  var sourceCol = payload.source === 'WAW' ? wawStockCol : mainStockCol;
  var currentSourceQty = parseInt(partsData[partRowIndex - 1][sourceCol]) || 0;

  var techName = payload.technician_id; 
  var techColIndex = -1;
  var currentTechQty = 0;

  if (payload.type === 'WYDANIE' || payload.type === 'ZWROT') {
    var techsData = techsSheet.getDataRange().getValues();
    for (var t = 1; t < techsData.length; t++) {
      if (safeString(techsData[t][0]) === safeString(payload.technician_id)) {
        techName = safeString(techsData[t][1]); 
        break;
      }
    }
    techColIndex = headers.indexOf(techName);
    if (techColIndex === -1) throw new Error("Technik " + techName + " nie ma kolumny w sys_parts.");
    currentTechQty = parseInt(partsData[partRowIndex - 1][techColIndex]) || 0;
  }

  var now = new Date().toISOString();

  // WYKONYWANIE LOGIKI
  if (payload.type === 'WYDANIE') {
    if (currentSourceQty < qty) throw new Error("Brak wystarczającej ilości w wybranym magazynie!");
    partsSheet.getRange(partRowIndex, sourceCol + 1).setValue(currentSourceQty - qty);
    partsSheet.getRange(partRowIndex, techColIndex + 1).setValue(currentTechQty + qty);

  } else if (payload.type === 'DOSTAWA') {
    partsSheet.getRange(partRowIndex, sourceCol + 1).setValue(currentSourceQty + qty);

  } else if (payload.type === 'PRZESUNIECIE') {
    // Przesunięcie Z ZG do WAW
    var currentWawQty = parseInt(partsData[partRowIndex - 1][wawStockCol]) || 0;
    if (currentSourceQty < qty) throw new Error("Brak ilości w ZG do przesunięcia!");
    partsSheet.getRange(partRowIndex, mainStockCol + 1).setValue(currentSourceQty - qty);
    partsSheet.getRange(partRowIndex, wawStockCol + 1).setValue(currentWawQty + qty);

  } else if (payload.type === 'ZWROT') {
    if (currentTechQty < qty) throw new Error("Technik nie ma tylu sztuk do zwrotu!");
    var currentUsedQty = parseInt(partsData[partRowIndex - 1][usedStockCol]) || 0;
    
    // ZWROT zawsze dodaje się do kolumny ZUŻYTYCH
    partsSheet.getRange(partRowIndex, techColIndex + 1).setValue(Math.max(0, currentTechQty - qty));
    partsSheet.getRange(partRowIndex, usedStockCol + 1).setValue(currentUsedQty + qty);
  }

  logsSheet.appendRow([ Utilities.getUuid(), now, payload.type, payload.part_sku, qty, payload.technician_id || payload.source || "", payload.ticket_id || "", payload.notes || "Operacja: " + payload.type ]);

  removeLargeCache("DB_TABLE_sys_parts");
  removeLargeCache("DB_TABLE_sys_inventory_logs");
  return true;
}

function deletePartFromBase(sku) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('sys_parts');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (safeString(data[i][0]) === safeString(sku)) {
      sheet.deleteRow(i + 1);
      removeLargeCache("DB_TABLE_sys_parts");
      return true;
    }
  }
  return false;
}

// =========================================================================
// MODUŁ: BAZA STACJI (sys_stations)
// =========================================================================

function getStationsData() {
  try {
    var stRes = JSON.parse(db_readTable('sys_stations'));
    var clRes = JSON.parse(db_readTable('sys_clients'));
    var teRes = JSON.parse(db_readTable('sys_technicians'));
    var arRes = JSON.parse(db_readTable('sys_area')); // <--- POBIERANIE OBSZARÓW

    return JSON.stringify({
      success: true,
      stations: stRes.success ? stRes.data : [],
      clients: clRes.success ? clRes.data : [],
      techs: teRes.success ? teRes.data : [],
      areas: arRes.success ? arRes.data : [] // <--- WYSYŁANIE OBSZARÓW NA FRONTEND
    });
  } catch (e) {
    return JSON.stringify({ success: false, error: e.toString() });
  }
}

function saveStationToBase(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('sys_stations');
  if (!sheet) throw new Error("Brak zakładki sys_stations w bazie.");

  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;

  if (payload.id) {
    for (var i = 1; i < data.length; i++) {
      if (safeString(data[i][0]) === safeString(payload.id)) {
        rowIndex = i + 1;
        break;
      }
    }
  }

  var id = payload.id || Utilities.getUuid();
  var now = new Date().toISOString();

  var countryVal = payload.country ? payload.country.trim() : "";
  if (!countryVal) countryVal = payload.region ? payload.region.trim() : "Polska";

  // Mamy teraz 21 kolumn. 
  // Zgłoszenia domyślnie są puste w momencie pierwszego utworzenia stacji.
  var rowData = [
    id, payload.public_id || "", payload.client_id || "", payload.status || "Działa",
    payload.model || "", payload.inspection_date || "", countryVal, payload.city || "",
    payload.street || "", payload.street_number || "", payload.region || "", payload.gps_lat || "",
    payload.gps_lng || "", payload.logistics_info || "", payload.technician_id || "", 
    "", "", "", "", "NIE", now 
    // Indeksy 15,16,17,18 to nowe dane ze zgłoszeń (active_ticket_id, ticket_category, ticket_status, ticket_technician)
  ];

  if (rowIndex !== -1) {
    // Zachowujemy istniejące wartości dla zgłoszeń i metadanych, o ile nie są przesyłane w payload
    rowData[15] = data[rowIndex-1][15] || ""; // active_ticket_id
    rowData[16] = data[rowIndex-1][16] || ""; // ticket_category
    rowData[17] = data[rowIndex-1][17] || ""; // ticket_status
    rowData[18] = data[rowIndex-1][18] || ""; // ticket_technician
    rowData[19] = data[rowIndex-1][19] || "NIE"; // is_muted
    rowData[20] = data[rowIndex-1][20] || now; // created_at
    
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  removeLargeCache("DB_TABLE_sys_stations");
  return true;
}

function updateStationsBulk(updatesArray) {
  if(!updatesArray || updatesArray.length === 0) return false;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('sys_stations');
  if (!sheet) return false;
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  
  var idCol = headers.indexOf('id');
  var regionCol = headers.indexOf('region');
  var techCol = headers.indexOf('technician_id');
  var latCol = headers.indexOf('gps_lat');
  var lngCol = headers.indexOf('gps_lng');
  var muteCol = headers.indexOf('is_muted');
  
  if(idCol === -1) return false;
  
  var changed = false;
  var updateMap = {};
  updatesArray.forEach(function(u) { updateMap[u.id] = u; });
  
  for (var i = 1; i < data.length; i++) {
    var rowId = safeString(data[i][idCol]);
    if (updateMap[rowId]) {
      var u = updateMap[rowId];
      if (u.region !== undefined && safeString(data[i][regionCol]) !== safeString(u.region)) { data[i][regionCol] = u.region; changed = true; }
      if (u.technician_id !== undefined && safeString(data[i][techCol]) !== safeString(u.technician_id)) { data[i][techCol] = u.technician_id; changed = true; }
      if (u.gps_lat !== undefined && safeString(data[i][latCol]) !== safeString(u.gps_lat)) { data[i][latCol] = u.gps_lat; changed = true; }
      if (u.gps_lng !== undefined && safeString(data[i][lngCol]) !== safeString(u.gps_lng)) { data[i][lngCol] = u.gps_lng; changed = true; }
      if (muteCol !== -1 && u.is_muted !== undefined) {
         var muteVal = u.is_muted ? "TAK" : "NIE";
         if (safeString(data[i][muteCol]) !== muteVal) { data[i][muteCol] = muteVal; changed = true; }
      }
    }
  }
  
  if (changed) sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
  removeLargeCache("DB_TABLE_sys_stations");
  return true;
}

function deleteStationFromBase(id) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('sys_stations');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (safeString(data[i][0]) === safeString(id)) {
      sheet.deleteRow(i + 1);
      removeLargeCache("DB_TABLE_sys_stations");
      return true;
    }
  }
  return false;
}

function deleteStationsBulk(idsArray) {
  if (!idsArray || idsArray.length === 0) return false;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('sys_stations');
  if (!sheet) return false;
  
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i > 0; i--) {
    if (idsArray.indexOf(safeString(data[i][0])) !== -1) {
      sheet.deleteRow(i + 1);
    }
  }
  removeLargeCache("DB_TABLE_sys_stations");
  return true;
}

function updateGeneratedIdInBase(publicId, newUuid) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('sys_stations');
  if (!sheet) return;
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const idCol = headers.indexOf('id');
  const pubIdCol = headers.indexOf('public_id');
  const muteCol = headers.indexOf('is_muted');
  const createdCol = headers.indexOf('created_at');
  
  if (idCol === -1 || pubIdCol === -1) return;
  const now = new Date().toISOString();
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][pubIdCol]) === String(publicId) && String(data[i][idCol]) === '') {
      sheet.getRange(i + 1, idCol + 1).setValue(newUuid);
      if (muteCol !== -1 && String(data[i][muteCol]) === '') sheet.getRange(i + 1, muteCol + 1).setValue("NIE");
      if (createdCol !== -1 && String(data[i][createdCol]) === '') sheet.getRange(i + 1, createdCol + 1).setValue(now);
      break; 
    }
  }
  removeLargeCache("DB_TABLE_sys_stations");
}

function forceFillMissingStationIds() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('sys_stations');
  if (!sheet) {
    Logger.log("Brak zakładki sys_stations");
    return;
  }
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  
  var idCol = headers.indexOf('id');
  var pubIdCol = headers.indexOf('public_id');
  var muteCol = headers.indexOf('is_muted');
  var createdCol = headers.indexOf('created_at');
  
  if (idCol === -1) return;
  
  var now = new Date().toISOString();
  var changed = 0;
  
  for (var i = 1; i < data.length; i++) {
    // Sprawdzamy czy 'id' jest puste, ale wiersz nie jest całkowicie pusty (np. ma wpisane public_id lub cokolwiek innego)
    if (String(data[i][idCol]) === '' && String(data[i][1]).trim() !== '') {
      
      // Nadajemy wygenerowane UUID
      sheet.getRange(i + 1, idCol + 1).setValue(Utilities.getUuid());
      
      // Uzupełniamy domyślne dane
      if (muteCol !== -1 && String(data[i][muteCol]) === '') {
        sheet.getRange(i + 1, muteCol + 1).setValue("NIE");
      }
      if (createdCol !== -1 && String(data[i][createdCol]) === '') {
        sheet.getRange(i + 1, createdCol + 1).setValue(now);
      }
      
      changed++;
    }
  }
  
  Logger.log("Zaktualizowano brakujące ID dla " + changed + " stacji.");
  removeLargeCache("DB_TABLE_sys_stations");
}

// =========================================================================
// AUTOMATYZACJA ARKUSZA (WYZWALACZE W TLE)
// =========================================================================

/**
 * Ta funkcja uruchamia się automatycznie za każdym razem, gdy użytkownik 
 * edytuje coś w arkuszu Google (np. wpisując ręcznie nowe wiersze).
 */
function onEdit(e) {
  if (!e || !e.range) return;
  
  var sheet = e.range.getSheet();
  var sheetName = sheet.getName();
  
  // 1. ZAWSZE CZYŚĆ CACHE jeśli zmieniamy dowolny arkusz 'sys_'
  if (sheetName.indexOf('sys_') === 0) {
    removeLargeCache("DB_TABLE_" + sheetName);
  }

  // 2. Specjalna logika tworząca UUID dla ręcznie wpisywanych stacji i klientów
  if (sheetName === 'sys_stations' || sheetName === 'sys_clients') {
    var row = e.range.getRow();
    var col = e.range.getColumn();
    
    // Ignorujemy edycję nagłówków (wiersz 1) i edycję samej kolumny ID (kolumna 1)
    if (row > 1 && col > 1) {
      var idCell = sheet.getRange(row, 1);
      
      // Jeśli komórka z ID jest pusta, a wpisaliśmy coś w innej komórce w tym wierszu
      if (idCell.getValue() === '') {
        // Generujemy i wstawiamy nowe UUID!
        idCell.setValue(Utilities.getUuid());
        
        // Możemy tu też dodać datę utworzenia
        var data = sheet.getDataRange().getValues();
        var headers = data[0];
        var createdColIndex = headers.indexOf('created_at');
        
        if (createdColIndex !== -1) {
          sheet.getRange(row, createdColIndex + 1).setValue(new Date().toISOString());
        }
      }
    }
  }
}

// =========================================================================
// NOWOŚĆ: Synchronizacja aktywnych zgłoszeń z Axon Connect do sys_stations
// =========================================================================

function syncActiveTicketsFromAxon() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var axonSheet = ss.getSheetByName('Axon Connect');
  var stationsSheet = ss.getSheetByName('sys_stations');
  
  if (!axonSheet || !stationsSheet) return false;
  
  var axonData = axonSheet.getDataRange().getValues();
  var stationsData = stationsSheet.getDataRange().getValues();
  var sHeaders = stationsData[0];
  
  // Znajdź pozycje odpowiednich kolumn w arkuszu stacji:
  var pubIdCol = sHeaders.indexOf('public_id'); 
  var actTicketCol = sHeaders.indexOf('active_ticket_id');
  var catCol = sHeaders.indexOf('ticket_category');
  var statCol = sHeaders.indexOf('ticket_status');
  var techCol = sHeaders.indexOf('ticket_technician');
  
  if (pubIdCol === -1 || actTicketCol === -1) {
    Logger.log("Brakuje kolumn dla zgłoszeń w sys_stations. Sprawdź nagłówki.");
    return false;
  }
  
  var AXON_STATION_COL_INDEX = 1; 

  // Tymczasowa mapa aktywnych zgłoszeń wyciągniętych z Axona
  var activeTicketsMap = {};
  
  // Czytamy dane z Axona (od drugiego wiersza, pomijając nagłówki)
  for (var i = 1; i < axonData.length; i++) {
    var ticketId = String(axonData[i][0]).trim();     // Kolumna A (ID Zgłoszenia)
    var stationId = String(axonData[i][AXON_STATION_COL_INDEX]).trim(); // Np. Kolumna B (ID Stacji)
    var category = String(axonData[i][5]).trim();     // Kolumna F (Kategoria - indeks 5)
    var techName = String(axonData[i][12]).trim();    // Kolumna M (Aktualny technik - indeks 12)
    var status = String(axonData[i][21]).trim();       // Kolumna V (Status - indeks 21)
    
    // ZMIANA: Skuteczniejsze wyłapywanie zamkniętych/anulowanych zgłoszeń
    var isClosedOrCancelled = false;a
    var statusUpper = status.toUpperCase();
    
    // Sprawdzanie również kolumny systemowej z Axona (często Kolumna G, indeks 6)
    var systemStatusAxon = String(axonData[i][6]).trim().toUpperCase();

    // UWAGA: Usunięto 'WYKONANO' - zgłoszenie z tym statusem pozostanie na liście stacji!
    if (statusUpper.indexOf('ZAMKNIĘT') > -1 || 
        statusUpper.indexOf('ZAKOŃCZ') > -1 || 
        statusUpper.indexOf('ANULOWAN') > -1 || 
        statusUpper.indexOf('CLOSED') > -1 || 
        statusUpper.indexOf('CANCELLED') > -1 ||
        axonData[i][18] || // Data zamknięcia ustawiona (Kolumna S)
        axonData[i][19]    // Data anulowania ustawiona (Kolumna T)
    ) {
        isClosedOrCancelled = true;
    }

    // Zignoruj to zgłoszenie, jeśli jest definitywnie zamknięte lub anulowane
    if (isClosedOrCancelled) {
      continue;
    }
    
    // Zapisz do mapy aktywne zgłoszenie dla tej stacji (nadpisze poprzednie, jeśli są zduplikowane, co jest ok, bo bierzemy ostatnie)
    if (ticketId && stationId) {
      activeTicketsMap[stationId] = {
        id: ticketId,
        category: category,
        status: status,
        technician: techName
      };
    }
  }
  
  var changed = false;
  
  // Zaktualizuj bazę stacji z uwzględnieniem mapy
  for (var j = 1; j < stationsData.length; j++) {
    var currentStationId = String(stationsData[j][pubIdCol]).trim();
    
    if (activeTicketsMap[currentStationId]) {
      // Stacja ma przypisane aktywne zgłoszenie
      var t = activeTicketsMap[currentStationId];
      if (stationsData[j][actTicketCol] !== t.id || stationsData[j][statCol] !== t.status) {
        stationsData[j][actTicketCol] = t.id;
        stationsData[j][catCol] = t.category;
        stationsData[j][statCol] = t.status;
        stationsData[j][techCol] = t.technician;
        changed = true;
      }
    } else {
      // Brak aktywnego zgłoszenia (np. poprzednie zostało zamknięte) - GŁĘBOKIE resetowanie pól
      if (stationsData[j][actTicketCol] !== "" || stationsData[j][statCol] !== "") {
        stationsData[j][actTicketCol] = "";
        stationsData[j][catCol] = "";
        stationsData[j][statCol] = "";
        stationsData[j][techCol] = "";
        
        // Bonusowe zabezpieczenie: aktualizujemy główny status stacji na "Działa", jeśli pękł
        var mainStatusCol = sHeaders.indexOf('status');
        if(mainStatusCol > -1) {
            stationsData[j][mainStatusCol] = "Działa";
        }

        changed = true;
      }
    }
  }
  
  if (changed) {
    stationsSheet.getRange(1, 1, stationsData.length, stationsData[0].length).setValues(stationsData);
  }

  autoFillMissingTicketStatuses();
  removeLargeCache("DB_TABLE_sys_stations");
  return true;
}


// =========================================================================
// MODUŁ: MAPA SYSTEMU
// =========================================================================

function getMapData() {
  try {
    var stRes = JSON.parse(db_readTable('sys_stations'));
    var clRes = JSON.parse(db_readTable('sys_clients'));
    var teRes = JSON.parse(db_readTable('sys_technicians'));
    var arRes = JSON.parse(db_readTable('sys_area')); // Odczyt obszarów analitycznych!
    
    return JSON.stringify({
      success: true,
      stations: stRes.success ? stRes.data : [],
      clients: clRes.success ? clRes.data : [],
      techs: teRes.success ? teRes.data : [],
      areas: arRes.success ? arRes.data : [] // Przesyłamy obszary na front
    });
  } catch (e) {
    return JSON.stringify({ success: false, error: e.toString() });
  }
}

function fetchGeoJSONFromDrive(url) {
  try {
    var response = UrlFetchApp.fetch(url);
    return JSON.parse(response.getContentText());
  } catch (e) {
    Logger.log("Błąd pobierania GeoJSON: " + e.message);
    throw new Error("Nie udało się pobrać danych z chmury wektorów.");
  }
}

function updateTechnicianGeometry(id, geoString) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('sys_technicians');
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (safeString(data[i][0]) === safeString(id)) {
      sheet.getRange(i + 1, 4).setValue(geoString || ""); 
      removeLargeCache("DB_TABLE_sys_technicians");
      return true;
    }
  }
  return false;
}

/**
 * -----------------------------------------------------------------
 * OBSŁUGA OBSZARÓW ANALITYCZNYCH (SYS_AREA)
 * -----------------------------------------------------------------
 */

// 1. Pobieranie listy obszarów z arkusza sys_area
function getAreas() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('sys_area');
  if (!sheet) return [];
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var areas = [];
  
  // Zabezpieczenie przed pustym arkuszem
  if (data.length < 2) return [];

  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    areas.push(obj);
  }
  
  return areas;
}

// 2. Aktualizacja geometrii (strefy) dla konkretnego obszaru
function updateAreaGeometry(areaId, geometryJson) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('sys_area');
  if (!sheet) throw new Error("Arkusz sys_area nie istnieje.");

  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  var idIndex = headers.indexOf('id');
  var geomIndex = headers.indexOf('zone_geometry');

  if (idIndex === -1 || geomIndex === -1) {
    throw new Error("Brak wymaganych kolumn 'id' lub 'zone_geometry' w arkuszu sys_area.");
  }

  for (var i = 1; i < data.length; i++) {
    // Sprawdzamy czy ID się zgadza
    if (data[i][idIndex] == areaId) {
      // Arkusze są indeksowane od 1, więc i+1 (numer wiersza), geomIndex+1 (numer kolumny)
      sheet.getRange(i + 1, geomIndex + 1).setValue(geometryJson);
      removeLargeCache("DB_TABLE_sys_area");
      return { success: true, message: "Zapisano geometrię obszaru." };
    }
  }

  throw new Error("Nie znaleziono obszaru o ID: " + areaId);
}

// 3. Dodawanie nowego obszaru do arkusza (z poziomu przeglądarki)
function createNewAreaRecord(id, name, color) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('sys_area');
  if (!sheet) throw new Error("Arkusz sys_area nie istnieje.");
  
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var newRow = new Array(headers.length).fill("");
  
  // Wypełniamy odpowiednie kolumny danymi
  var idIndex = headers.indexOf('id');
  var nameIndex = headers.indexOf('name');
  var colorIndex = headers.indexOf('color');
  
  if (idIndex !== -1) newRow[idIndex] = id;
  if (nameIndex !== -1) newRow[nameIndex] = name;
  if (colorIndex !== -1) newRow[colorIndex] = color || '#3b82f6';
  
  // Dodajemy wiersz na końcu arkusza
  sheet.appendRow(newRow);
  
  removeLargeCache("DB_TABLE_sys_area");
  return { success: true, id: id, name: name };
}

// 4. Całkowite usuwanie obszaru z bazy
function deleteAreaFromBase(id) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('sys_area');
  if (!sheet) return false;
  
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    // safeString upewni się, że typy danych się zgadzają
    if (safeString(data[i][0]) === safeString(id)) {
      sheet.deleteRow(i + 1);
      removeLargeCache("DB_TABLE_sys_area");
      return true;
    }
  }
  return false;
}

// =========================================================================
// MODUŁ: ZGŁOSZENIA (AXON CONNECT)
// =========================================================================

/**
 * Pobieranie zgłoszeń z nowej struktury Axon Connect + Inteligentne złączenie ze stacjami i rozliczeniami
 */
function getTicketsFromSheet() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Axon Connect"); 
    if (!sheet) throw new Error("Brak zakładki Axon Connect w arkuszu!");

    var data = sheet.getDataRange().getValues();
    if (data.length < 2) return []; 

    // Pobieramy stacje, żeby awaryjnie wyciągnąć z nich Klienta, jeśli brakuje w zgłoszeniu
    var stations = [];
    try {
      var stRes = JSON.parse(db_readTable('sys_stations'));
      if (stRes && stRes.success) stations = stRes.data;
    } catch(e) {}

    // NOWOŚĆ: Odczyt zapisanych rozliczeń, aby Centrum Zgłoszeń ładowało je do pamięci (Brak kasowania wizyt!)
    var billingsMap = {};
    try {
      var bSheet = ss.getSheetByName("sys_billings");
      if(bSheet) {
        var bData = bSheet.getDataRange().getValues();
        for(var b=1; b<bData.length; b++) {
          var bId = bData[b][0] ? bData[b][0].toString().trim() : "";
          var bJson = bData[b][15] ? bData[b][15].toString().trim() : "";
          if(bId && bJson) {
              try { billingsMap[bId] = JSON.parse(bJson); } catch(e){}
          }
        }
      }
    } catch(e) {}

    var tickets = [];

    // Omijamy nagłówki
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[0] && !row[1]) continue; 

      var ticketCode = row[0] ? row[0].toString().trim() : ''; // Col A
      var qpFull = row[1] ? row[1].toString().trim() : '';     // Col B
      
      var qpShort = qpFull;
      if (qpFull.indexOf('-') > -1) {
         var parts = qpFull.split('-');
         if (parts.length >= 2) {
             qpShort = parts[0] + '-' + parts[1];
         }
      }

      var matchedStation = stations.find(function(s) {
          return String(s.public_id).toLowerCase() === qpShort.toLowerCase() || 
                 String(s.id).toLowerCase() === qpShort.toLowerCase();
      });

      var desc = row[8] ? row[8].toString().trim() : ''; 
      
      var extractedClient = '';
      var clientMatch = desc.match(/Klient:\s*(.*?)(?=\n|$)/i);
      if (clientMatch && clientMatch[1].trim() !== '') {
          extractedClient = clientMatch[1].trim();
      }

      var extractedPriority = 'Normalny';
      var prioMatch = desc.match(/Priorytet.*?\:\s*(.*?)(?=\n|$)/i);
      if (prioMatch && prioMatch[1].trim() !== '') {
          extractedPriority = prioMatch[1].trim();
      }

      var clientName = extractedClient || (matchedStation ? matchedStation.client_id : 'Brak danych');
      var category = row[5] ? row[5].toString().trim() : ''; 
      var product = row[7] ? row[7].toString().trim() : '';  

      var axStatRaw = row[6] ? row[6].toString().trim() : '';
      var intStatRaw = row[21] ? row[21].toString().trim() : '';
      var axStat = axStatRaw.toUpperCase();
      var intStat = intStatRaw.toUpperCase();

      // --- LOGIKA PING-PONG (AUTOMATYCZNE STATUSY Z AXONA) ---
      if (axStat.includes('FAKTUROWANIE') || axStat.includes('INVOICING')) {
          intStatRaw = 'Rozliczone';
      } else if (axStat.includes('RAPORT ZATWIERDZONY') || axStat.includes('REPORT_APPROVED')) {
          if (intStat !== 'ROZLICZONE') intStatRaw = 'Wstępnie rozliczone';
      } else if (axStat.includes('RAPORT DO ZATWIERDZENIA') || axStat.includes('REPORT_FOR_APPROVAL')) {
          if (intStat !== 'WSTĘPNIE ROZLICZONE' && intStat !== 'WSTEPNIE ROZLICZONE' && intStat !== 'ROZLICZONE') {
              intStatRaw = 'Wykonano';
          }
      } else if (axStat.includes('WYKONANIE') || axStat.includes('ZAPLANOWANA') || axStat.includes('NA RAPORT') || axStat.includes('PLANNED') || axStat.includes('PENDING')) {
          if (intStat !== 'OCZEKUJE NA CZĘŚCI' && intStat !== 'WYKONANO' && !intStat.includes('ROZLICZ')) {
              intStatRaw = 'Oczekuje na realizację';
          }
      } else if (axStat.includes('WYSŁANE') || axStat.includes('ZAAKCEPTOWANE') || axStat.includes('REQUEST_SENT') || axStat.includes('REQUEST_ACCEPTED')) {
          if (!intStat || intStat === 'BRAK STATUSU' || intStat === 'NOWE') {
              intStatRaw = 'Nowe';
          }
      }

      var finalMainStatus = axStatRaw;
      if (axStat.includes('ZAMKNIĘT') || axStat.includes('CLOSED') || axStat.includes('ANULOWAN') || axStat.includes('CANCELED') || axStat.includes('CANCELLED')) {
          finalMainStatus = 'Zakończone'; 
      }

      tickets.push({
        id: ticketCode || 'TCK_' + i,
        ticket_code: ticketCode,
        qp_id: qpShort,
        qp_id_full: qpFull,
        client: clientName,
        product: product,                                       
        category: category,                                     
        address: row[13] ? row[13].toString().trim() : '',       
        postcode: row[14] ? row[14].toString().trim() : '',      
        city: row[15] ? row[15].toString().trim() : '',          
        contact_person: row[9] ? row[9].toString().trim() : '',  
        contact_phone: row[10] ? row[10].toString().trim() : '', 
        contact_email: row[11] ? row[11].toString().trim() : '', 
        priority: extractedPriority,                            
        title: row[2] ? row[2].toString().trim() : '',          
        description: desc,                                      
        status: finalMainStatus,        
        technician_id: row[12] ? row[12].toString().trim() : '', 
        created_at: row[16] ? row[16].toString().trim() : '',  
        date_finished: row[17] ? row[17].toString().trim() : '', 
        date_closed: row[18] ? row[18].toString().trim() : '',   
        date_canceled: row[19] ? row[19].toString().trim() : '', 
        ticket_status: intStatRaw,
        raw_info: row[22] ? row[22].toString().trim() : '',      
        req_status: row[23] ? row[23].toString().trim() : '',    
        raw_diagnoza: row[24] ? row[24].toString().trim() : '',  
        notes: row[25] ? row[25].toString().trim() : '',
        parts_str: row[26] ? row[26].toString().trim() : '',
        saved_data: billingsMap[ticketCode] || null 
      });
    }

    return tickets.reverse(); 
  } catch (e) {
    Logger.log("Błąd w getTicketsFromSheet: " + e.toString());
    throw e;
  }
}

function saveAxonTicketToBase(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Axon Connect');
  if (!sheet) throw new Error("Brak zakładki Axon Connect w bazie.");

  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;

  var ticketId = payload.id || payload.ticket_id;

  if (ticketId) {
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][0].toString().trim() === ticketId.toString().trim()) {
        rowIndex = i + 1;
        break;
      }
    }
  }

  // Zapis do Axon Connect
  if (rowIndex !== -1) {
    if (payload.status !== undefined) sheet.getRange(rowIndex, 7).setValue(payload.status);
    if (payload.technician_id !== undefined) sheet.getRange(rowIndex, 13).setValue(payload.technician_id); 
    
    if (payload.ticket_status !== undefined) sheet.getRange(rowIndex, 22).setValue(payload.ticket_status); 
    if (payload.raw_info !== undefined) sheet.getRange(rowIndex, 23).setValue(payload.raw_info);             
    if (payload.req_status !== undefined) sheet.getRange(rowIndex, 24).setValue(payload.req_status);         
    
    if (payload.raw_diagnoza !== undefined) sheet.getRange(rowIndex, 25).setValue(payload.raw_diagnoza);   
    if (payload.notes !== undefined) sheet.getRange(rowIndex, 26).setValue(payload.notes);                 

    if (payload.parts_str !== undefined) {
        sheet.getRange(rowIndex, 27).setValue(payload.parts_str);
    }
  }

  // --- AUTOMATYCZNE ROZLICZENIE PRZY ZAMKNIĘCIU ---
  // Jeśli zmieniono status główny Axon na zamknięty, przełączamy Wstępnie rozliczone -> Rozliczone
  if (payload.status) {
    var statusUpper = String(payload.status).toUpperCase();
    var isClosed = (statusUpper.indexOf('ZAMKNIĘT') > -1 || statusUpper.indexOf('ZAKOŃCZ') > -1 || statusUpper.indexOf('CLOSED') > -1 || statusUpper.indexOf('CANCELLED') > -1 || statusUpper.indexOf('ANULOWAN') > -1);
    
    if (isClosed && ticketId) {
       var bSheet = ss.getSheetByName("sys_billings");
       if (bSheet) {
         var bData = bSheet.getDataRange().getValues();
         for (var b = 1; b < bData.length; b++) {
           if (bData[b][0] && bData[b][0].toString().trim() === ticketId.toString().trim()) {
             var currentBillStatus = bData[b][14] ? bData[b][14].toString().toLowerCase() : "";
             if (currentBillStatus.indexOf('wstępn') > -1) {
               bSheet.getRange(b + 1, 15).setValue('Rozliczone'); // Zmiana na rozliczone
               var rawJson = bData[b][15];
               if (rawJson) {
                 try {
                    var sd = JSON.parse(rawJson);
                    sd.status_rozliczenia = 'Rozliczone';
                    sd.ticket_status = 'Rozliczone';
                    bSheet.getRange(b + 1, 16).setValue(JSON.stringify(sd));
                 } catch(e) {}
               }
               
               // Aktualizujemy też ticket_status w samym Axon Connect, żeby od razu świecił na zielono
               if (rowIndex !== -1) {
                 sheet.getRange(rowIndex, 22).setValue('Rozliczone');
               }
             }
             break;
           }
         }
       }
    }
  }

  // Odejmowanie z magazynu
  try {
    if (payload.parts_array && payload.parts_array.length > 0) {
      var partsSheet = ss.getSheetByName("sys_parts");
      if (partsSheet) {
        var partsData = partsSheet.getDataRange().getValues();
        if (partsData.length > 0) {
            var partsHeaders = partsData[0].map(function(h) { return h ? h.toString().trim().toLowerCase() : ""; });
            var targetColIndex = -1;
            var wType = (payload.warehouse_type || '').toLowerCase();
            
            if (wType === 'warszawa' || wType === 'wa_stock') {
              targetColIndex = partsHeaders.indexOf("wa_stock");
            } else if (wType === 'zielona góra' || wType === 'zielona gora' || wType === 'zg_stock' || wType === 'centralny') {
              targetColIndex = partsHeaders.indexOf("zg_stock");
            } else if (payload.tech) {
              var tName = payload.tech.toString().trim().toLowerCase();
              for (var h = 0; h < partsHeaders.length; h++) {
                if (partsHeaders[h] && (partsHeaders[h] === tName || partsHeaders[h].indexOf(tName) > -1 || tName.indexOf(partsHeaders[h]) > -1)) {
                  targetColIndex = h;
                  break;
                }
              }
            }

            var usedTotalColIndex = partsHeaders.indexOf("used_total");

            payload.parts_array.forEach(function(part) {
              var pName = part.name.toString().trim().toLowerCase();
              var pSku = part.sku ? part.sku.toString().trim().toLowerCase() : '';
              var pQty = parseInt(part.qty) || 0;
              
              if (pQty > 0) {
                for (var r = 1; r < partsData.length; r++) {
                  var sku = partsData[r][0] ? partsData[r][0].toString().trim().toLowerCase() : "";
                  var name = partsData[r][1] ? partsData[r][1].toString().trim().toLowerCase() : "";
                  
                  if ((pSku && sku === pSku) || sku === pName || name === pName || pName.indexOf(sku) > -1 || pName.indexOf(name) > -1) {
                    if (targetColIndex > -1) {
                      var currentStock = parseFloat(partsSheet.getRange(r + 1, targetColIndex + 1).getValue()) || 0;
                      partsSheet.getRange(r + 1, targetColIndex + 1).setValue(currentStock - pQty);
                    }
                    if (usedTotalColIndex > -1) {
                      var currentUsed = parseFloat(partsSheet.getRange(r + 1, usedTotalColIndex + 1).getValue()) || 0;
                      partsSheet.getRange(r + 1, usedTotalColIndex + 1).setValue(currentUsed + pQty);
                    }
                    break; 
                  }
                }
              }
            });
        }
      }
    }
  } catch (err) {}

  try {
      if (payload.from_diagnose || payload.raw_diagnoza !== undefined || payload.notes !== undefined) {
          var diagSheet = ss.getSheetByName("sys_diagnoses");
          if (!diagSheet) {
            diagSheet = ss.insertSheet("sys_diagnoses");
            var dh = ["Numer zlecenia", "Data wpisu", "Serwisant", "Status usterki", "Diagnoza / Notatka", "Magazyn", "Użyte części", "Raw JSON"];
            diagSheet.getRange(1, 1, 1, dh.length).setValues([dh]).setFontWeight("bold").setBackground("#f3f3f3");
          }
          
          var combinedNotes = "";
          if (payload.raw_diagnoza || payload.notes) {
              combinedNotes = "[DIAGNOZY I USTERKI]\n" + (payload.raw_diagnoza || "Brak") + "\n\n[KOMENTARZE SERWISU]\n" + (payload.notes || "Brak");
          } else {
              combinedNotes = "Usunięto diagnozę / Brak wpisów";
          }
          
          diagSheet.insertRowAfter(1);
          diagSheet.getRange(2, 1, 1, 8).setValues([[
            ticketId, 
            Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss"), 
            payload.tech || payload.technician_id || "Nieznany", 
            payload.ticket_status || "Zapis z modala", 
            combinedNotes, 
            payload.warehouse_type || "-", 
            payload.parts_str || "Brak", 
            JSON.stringify(payload)
          ]]);
      }
  } catch (err) {
      Logger.log("Błąd podczas zapisu do sys_diagnoses: " + err.toString());
  }
  
  try {
      if (typeof syncStationsWithTickets === "function") {
        syncStationsWithTickets(); 
      }
  } catch(e) {}
  
  return true; 
}

/**
 * Pobiera zgłoszenia Axon Connect, bazę Techników oraz bazę Części (sys_parts) dla frontendu.
 */
function getAxonDataForFrontend() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var axonTickets = getTicketsFromSheet() || [];
    
    var teRes = JSON.parse(db_readTable('sys_technicians'));
    var techs = teRes.success ? teRes.data : [];

    // NOWE: Prawidłowe pobranie bazy stacji!
    var stRes = JSON.parse(db_readTable('sys_stations'));
    var stations = stRes.success ? stRes.data : [];
    
    // --- POBIERANIE BAZY CZĘŚCI Z SYS_PARTS ---
    var parts = [];
    var partsSheet = ss.getSheetByName("sys_parts");
    if (partsSheet) {
      var pData = partsSheet.getDataRange().getValues();
      var headers = pData[0] || [];
      
      for (var r = 1; r < pData.length; r++) {
        if (!pData[r][0] && !pData[r][1]) continue;
        
        var partObj = {
          sku: pData[r][0] ? pData[r][0].toString().trim() : '',      // Col A (id_sku)
          name: pData[r][1] ? pData[r][1].toString().trim() : '',     // Col B (name)
          category: pData[r][2] ? pData[r][2].toString().trim() : '', // Col C (category)
          used_total: pData[r][6] ? (parseFloat(pData[r][6]) || 0) : 0, // Col G (used_total)
          stocks: {}
        };
        
        // Zczytywanie stanów ze wszystkich magazynów od kolumny E (indeks 4)
        for (var c = 4; c < headers.length; c++) {
          var hName = headers[c] ? headers[c].toString().trim().toLowerCase() : '';
          if (hName) {
            partObj.stocks[hName] = parseFloat(pData[r][c]) || 0;
          }
        }
        parts.push(partObj);
      }
    }

    // Bezpieczny zwrot dla frontendu ze wszystkim kluczami (z przecinkami!)
    return JSON.stringify({
      success: true,
      tickets: axonTickets,
      techs: techs,
      parts: parts,
      stations: stations // <--- POPRAWIONE: poprawnie zmapowane stacje!
    });
  } catch (e) {
    return JSON.stringify({ success: false, error: e.toString() });
  }
}

// =========================================================================
// AUTOMATYCZNE UZUPEŁNIANIE PUSTYCH STATUSÓW WEWNĘTRZNYCH (PING-PONG)
// =========================================================================

function autoFillMissingTicketStatuses() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Axon Connect");
  if (!sheet) return;

  var data = sheet.getDataRange().getValues();
  var changed = false;

  // Pętla omija nagłówki (zaczyna od i = 1)
  for (var i = 1; i < data.length; i++) {
    var axStatRaw = data[i][6] ? data[i][6].toString().trim() : ''; // Kolumna G - Status z Axona
    var intStatRaw = data[i][21] ? data[i][21].toString().trim() : ''; // Kolumna V - Wewnętrzny status zlecenia
    
    var axStat = axStatRaw.toUpperCase();
    var intStat = intStatRaw.toUpperCase();
    var newIntStat = intStatRaw; 

    // --- Odwzorowanie Logiki Ping-Pong z frontendu ---
    if (axStat.includes('FAKTUROWANIE') || axStat.includes('INVOICING')) {
        newIntStat = 'Rozliczone';
    } else if (axStat.includes('RAPORT ZATWIERDZONY') || axStat.includes('REPORT_APPROVED')) {
        if (intStat !== 'ROZLICZONE') newIntStat = 'Wstępnie rozliczone';
    } else if (axStat.includes('RAPORT DO ZATWIERDZENIA') || axStat.includes('REPORT_FOR_APPROVAL')) {
        if (intStat !== 'WSTĘPNIE ROZLICZONE' && intStat !== 'WSTEPNIE ROZLICZONE' && intStat !== 'ROZLICZONE') {
            newIntStat = 'Wykonano';
        }
    } else if (axStat.includes('WYKONANIE') || axStat.includes('ZAPLANOWANA') || axStat.includes('NA RAPORT') || axStat.includes('PLANNED') || axStat.includes('PENDING')) {
        if (intStat !== 'OCZEKUJE NA CZĘŚCI' && intStat !== 'WYKONANO' && !intStat.includes('ROZLICZ')) {
            newIntStat = 'Oczekuje na realizację';
        }
    } else if (axStat.includes('WYSŁANE') || axStat.includes('ZAAKCEPTOWANE') || axStat.includes('REQUEST_SENT') || axStat.includes('REQUEST_ACCEPTED')) {
        if (!intStat || intStat === 'BRAK STATUSU' || intStat === 'NOWE') {
            newIntStat = 'Nowe';
        }
    }

    // --- ZAPISZ TYLKO JEŚLI JEST PUSTE W ARKUSZU ---
    if (newIntStat !== intStatRaw && (intStatRaw === '' || intStat === 'BRAK STATUSU')) {
      data[i][21] = newIntStat; 
      changed = true;
    }
  }

  // Masowy zrzut danych do arkusza
  if (changed) {
    sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
  }
}

// =========================================================================
// MODUŁ: ZGŁOSZENIA I AWARIE (sys_tickets)
// =========================================================================

function createEkoenTicketInBase(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('sys_tickets');
  if (!sheet) throw new Error("Brak zakładki sys_tickets w bazie.");

  var data = sheet.getDataRange().getValues();
  var headers = data[0].map(function(h) { return String(h).trim(); });
  
  // Dynamiczne dodawanie brakujących kolumn, w tym nowych kolumn operacyjnych
  var requiredCols = [
    "manufacturer", "city", "street", "zip", "contact_name", "contact_phone", "contact_email", "attachments_url",
    "ticket_status", "req_status", "raw_info", "raw_diagnoza", "notes"
  ];
  
  var addedCols = false;
  requiredCols.forEach(function(colName) {
      if (headers.indexOf(colName) === -1) {
          headers.push(colName);
          sheet.getRange(1, headers.length).setValue(colName).setFontWeight("bold").setBackground("#f1f5f9");
          addedCols = true;
      }
  });
  if (addedCols) {
     data = sheet.getDataRange().getValues();
     headers = data[0].map(function(h) { return String(h).trim(); });
  }

  var rowIndex = -1;
  var oldData = null;

  if (payload.id) {
    for (var i = 1; i < data.length; i++) {
      if (safeString(data[i][0]) === safeString(payload.id)) {
        rowIndex = i + 1;
        oldData = data[i]; // Zapisujemy stary wiersz do zachowania danych
        break;
      }
    }
  }

  var id = payload.id || Utilities.getUuid();
  var ticketNumber = payload.ticket_number || ("EKOEN_" + Math.floor(Math.random() * 899999 + 100000));
  var now = new Date().toISOString();

  // Obsługa załączników Google Drive
  var attachmentsFolderUrl = "";
  if (oldData && headers.indexOf("attachments_url") > -1) {
      attachmentsFolderUrl = oldData[headers.indexOf("attachments_url")];
  }

  if (payload.attachments && payload.attachments.length > 0) {
     try {
       var rootFolder = DriveApp.getRootFolder();
       var systemFolderIt = rootFolder.getFoldersByName("EKOEN - Ticket System");
       var systemFolder = systemFolderIt.hasNext() ? systemFolderIt.next() : rootFolder.createFolder("EKOEN - Ticket System");
       
       var zleceniaFolderIt = systemFolder.getFoldersByName("Zlecenia");
       var zleceniaFolder = zleceniaFolderIt.hasNext() ? zleceniaFolderIt.next() : systemFolder.createFolder("Zlecenia");
       
       var ticketFolderIt = zleceniaFolder.getFoldersByName(ticketNumber);
       var ticketFolder = ticketFolderIt.hasNext() ? ticketFolderIt.next() : zleceniaFolder.createFolder(ticketNumber);
       
       var attFolderIt = ticketFolder.getFoldersByName("Zalaczniki");
       var attFolder = attFolderIt.hasNext() ? attFolderIt.next() : ticketFolder.createFolder("Zalaczniki");

       attachmentsFolderUrl = attFolder.getUrl(); 

       payload.attachments.forEach(function(file) {
          var blob = Utilities.newBlob(Utilities.base64Decode(file.data), file.mimeType, file.name);
          attFolder.createFile(blob);
       });
     } catch(e) {
       Logger.log("Błąd zapisu załączników: " + e.toString());
       attachmentsFolderUrl = "Błąd zapisu na G-Drive";
     }
  }

  var createdAt = now;
  if (oldData && headers.indexOf("created_at") > -1 && oldData[headers.indexOf("created_at")]) {
      createdAt = oldData[headers.indexOf("created_at")];
  }

  var rowData = new Array(headers.length).fill("");
  var mapObj = {
      "id": id,
      "ticket_number": ticketNumber,
      "station_id": payload.qp_id || payload.station_id || "",
      "technician_id": payload.technician_id !== undefined ? payload.technician_id : (oldData ? oldData[headers.indexOf("technician_id")] : ""),
      "status": payload.status || (oldData ? oldData[headers.indexOf("status")] : "NOWE"),
      "priority": payload.category || payload.priority || "AWARIA", 
      "subject": payload.title || payload.subject || "",
      "description": payload.description !== undefined ? payload.description : (oldData ? oldData[headers.indexOf("description")] : ""),
      "created_at": createdAt,
      "manufacturer": payload.manufacturer || "",
      "city": payload.city || "",
      "street": payload.street || "",
      "zip": payload.zip || "",
      "contact_name": payload.contact_name || "",
      "contact_phone": payload.contact_phone || "",
      "contact_email": payload.contact_email || "",
      "attachments_url": attachmentsFolderUrl,
      
      // Zapis nowo dodanych informacji operacyjnych
      "ticket_status": payload.ticket_status !== undefined ? payload.ticket_status : (oldData && headers.indexOf("ticket_status") > -1 ? oldData[headers.indexOf("ticket_status")] : ""),
      "req_status": payload.req_status !== undefined ? payload.req_status : (oldData && headers.indexOf("req_status") > -1 ? oldData[headers.indexOf("req_status")] : ""),
      "raw_info": payload.raw_info !== undefined ? payload.raw_info : (oldData && headers.indexOf("raw_info") > -1 ? oldData[headers.indexOf("raw_info")] : ""),
      "raw_diagnoza": payload.raw_diagnoza !== undefined ? payload.raw_diagnoza : (oldData && headers.indexOf("raw_diagnoza") > -1 ? oldData[headers.indexOf("raw_diagnoza")] : ""),
      "notes": payload.notes !== undefined ? payload.notes : (oldData && headers.indexOf("notes") > -1 ? oldData[headers.indexOf("notes")] : "")
  };

  for (var k = 0; k < headers.length; k++) {
      if (mapObj[headers[k]] !== undefined) {
          rowData[k] = mapObj[headers[k]];
      }
  }

  if (rowIndex !== -1) {
    var closedAtIdx = headers.indexOf("closed_at");
    if (closedAtIdx > -1) {
        if (payload.status === "ZAKOŃCZONE" && oldData[headers.indexOf("status")] !== "ZAKOŃCZONE") {
            rowData[closedAtIdx] = now;
        } else if (payload.status !== "ZAKOŃCZONE") {
            rowData[closedAtIdx] = ""; 
        } else {
            rowData[closedAtIdx] = oldData[closedAtIdx];
        }
    }
    
    ["start_datetime", "end_datetime", "all_day"].forEach(function(col) {
        var idx = headers.indexOf(col);
        if (idx > -1) rowData[idx] = oldData[idx] || "";
    });

    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  
  if (typeof syncStationsWithTickets === 'function') {
      syncStationsWithTickets();
  }
  removeLargeCache("DB_TABLE_sys_tickets");
  return true;
}

function getTicketsData() {
  try {
    var tkRes = JSON.parse(db_readTable('sys_tickets'));
    var stRes = JSON.parse(db_readTable('sys_stations'));
    var clRes = JSON.parse(db_readTable('sys_clients'));
    var teRes = JSON.parse(db_readTable('sys_technicians'));

    // NOWOŚĆ: Odczyt rozliczeń dla Ekoen
    var billingsMap = {};
    try {
      var bRes = JSON.parse(db_readTable('sys_billings'));
      if(bRes.success) {
         bRes.data.forEach(function(b) {
            var tId = String(b["Numer zlecenia"] || "").trim();
            var rawJson = b["Raw JSON"];
            if(tId && rawJson) {
               try { billingsMap[tId] = JSON.parse(rawJson); } catch(e){}
            }
         });
      }
    } catch(e) {}

    var tkList = tkRes.success ? tkRes.data.reverse() : [];
    tkList.forEach(function(t) {
        t.saved_data = billingsMap[t.id] || billingsMap[t.ticket_number] || null;
    });

    return JSON.stringify({
      success: true,
      tickets: tkList, 
      stations: stRes.success ? stRes.data : [],
      clients: clRes.success ? clRes.data : [],
      techs: teRes.success ? teRes.data : []
    });
  } catch (e) {
    return JSON.stringify({ success: false, error: e.toString() });
  }
}

function updateTicketStatus(ticketId, newStatus) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('sys_tickets');
  var data = sheet.getDataRange().getValues();
  var now = new Date().toISOString();
  
  for (var i = 1; i < data.length; i++) {
    if (safeString(data[i][0]) === safeString(ticketId)) {
      sheet.getRange(i + 1, 5).setValue(newStatus);
      
      if (newStatus === "ZAKOŃCZONE") {
        sheet.getRange(i + 1, 10).setValue(now);
      } else {
        sheet.getRange(i + 1, 10).setValue(""); 
      }
      removeLargeCache("DB_TABLE_sys_tickets");
      return true;
    }
  }
  throw new Error("Nie odnaleziono zgłoszenia.");
}

function deleteEkoenTicketFromBase(id) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('sys_tickets');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (safeString(data[i][0]) === safeString(id)) {
      sheet.deleteRow(i + 1);
      removeLargeCache("DB_TABLE_sys_tickets");
      return true;
    }
  }
  return false;
}

// =========================================================================
// MODUŁ: KALENDARZ (Harmonogram) I STATYSTYKI (BI)
// =========================================================================

function updateTicketSchedule(ticketId, startDate, endDate, allDay) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('sys_tickets');
  if (!sheet) throw new Error("Brak zakładki sys_tickets.");

  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (safeString(data[i][0]) === safeString(ticketId)) {
      sheet.getRange(i + 1, 11).setValue(startDate || "");
      sheet.getRange(i + 1, 12).setValue(endDate || "");
      sheet.getRange(i + 1, 13).setValue(allDay ? "TAK" : "NIE");
      removeLargeCache("DB_TABLE_sys_tickets");
      return true;
    }
  }
  throw new Error("Nie odnaleziono zgłoszenia do aktualizacji harmonogramu.");
}

function getAnalyticsData() {
  try {
    var tkRes = JSON.parse(db_readTable('sys_tickets'));
    var stRes = JSON.parse(db_readTable('sys_stations'));
    var clRes = JSON.parse(db_readTable('sys_clients'));
    var ptRes = JSON.parse(db_readTable('sys_parts'));
    var lgRes = JSON.parse(db_readTable('sys_inventory_logs'));

    return JSON.stringify({
      success: true,
      tickets: tkRes.success ? tkRes.data : [],
      stations: stRes.success ? stRes.data : [],
      clients: clRes.success ? clRes.data : [],
      parts: ptRes.success ? ptRes.data : [],
      logs: lgRes.success ? lgRes.data : []
    });
  } catch (e) {
    return JSON.stringify({ success: false, error: e.toString() });
  }
}

function forceCleanAuth() {
  var a = SpreadsheetApp.getActiveSpreadsheet();
  var b = DriveApp.getRootFolder();
  var d = Session.getActiveUser().getEmail(); 
  Logger.log("Wymuszono bezpieczną autoryzację pomyślnie!");
}

// =========================================================================
// 6. MODUŁ: POBIERANIE ZGŁOSZEŃ I CENNIKÓW DO ROZLICZENIA (BILLINGS)
// =========================================================================

// =========================================================================
// INICJALIZACJA BAZY ROZLICZEŃ (SZTYWNA STRUKTURA)
// =========================================================================
function initSysBillingsSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("sys_billings");
  if (!sheet) {
    sheet = ss.insertSheet("sys_billings");
    var headers = [
      "Numer zlecenia", "Klient", "QP stacji", "Data realizacji", "Serwisant", 
      "Typ realizacji", "Pozycje z cennika", "Kwota (EUR)", "Stacja naprawiona", 
      "Wymagana ponowna wizyta", "Komentarz", "RBH", "Dojazd", 
      "Data rozliczenia w systemie", "Status rozliczenia", "Raw JSON"
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers])
         .setFontWeight("bold")
         .setBackground("#f3f3f3");
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(7, 250); 
    sheet.setColumnWidth(11, 300); 
  }
  return sheet;
}

// =========================================================================
// POBIERANIE ZGŁOSZEŃ (SZYBKIE DEKODOWANIE JSON) Z POPRAWIENIEM GRUPOWANIA I DAT
// =========================================================================
function getBillingsDataForFrontend() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. MAPA STACJI
    var stationCountryMap = {};
    try {
      var stSheet = ss.getSheetByName("sys_stations");
      if(stSheet) {
        var stData = stSheet.getDataRange().getValues();
        for(var i=1; i<stData.length; i++) {
          if(stData[i][1]) stationCountryMap[stData[i][1].toString().trim()] = stData[i][6] ? stData[i][6].toString().trim() : "";
        }
      }
    } catch(e) {}

    // 2. ODCZYT ROZLICZEŃ (Sztywny index 0=ID, 14=Status, 15=JSON)
    var billingsMap = {};
    try {
      var bSheet = ss.getSheetByName("sys_billings");
      if(bSheet) {
        var bData = bSheet.getDataRange().getValues();
        for(var b=1; b<bData.length; b++) {
          var tId = bData[b][0] ? bData[b][0].toString().trim() : "";
          if(tId) {
             var bStateTxt = bData[b][14] ? bData[b][14].toString().trim() : "";
             var rawJson = bData[b][15] ? bData[b][15].toString().trim() : "";
             var sd = null;
             if(rawJson) { try { sd = JSON.parse(rawJson); } catch(e){} }
             
             if(!sd) {
                 sd = {
                    client: bData[b][1], items_str: bData[b][6], rbh: bData[b][11] || 0,
                    notes: bData[b][10], status_fixed: bData[b][8], status_revisit: bData[b][9], travel: bData[b][12]
                 };
             }

             var stateCode = "SETTLED";
             var bStateLower = bStateTxt.toLowerCase();
             if (bStateLower.indexOf("poprawione") > -1) {
               stateCode = "CORRECTED";
             } else if (bStateLower.indexOf("wstępn") > -1 || bStateLower.indexOf("pre_settled") > -1) {
               stateCode = "PRE_SETTLED";
             }
             
             var billingEur = bData[b][7] ? parseFloat(bData[b][7]) : 0;
             if (sd && sd.total_eur) billingEur = parseFloat(sd.total_eur);

             // Tego brakowało w backendzie - podawania items_str bezpośrednio do tabeli
             var iStr = bData[b][6] ? bData[b][6].toString() : "";
             if (sd && sd.items_str) iStr = sd.items_str;

             billingsMap[tId] = {
               state: stateCode,
               total_eur: billingEur.toFixed(2),
               items_str: iStr,
               json: JSON.stringify(sd)
             };
          }
        }
      }
    } catch(e) {}

    // 3. POBIERANIE AXON CONNECT
    var sheet = ss.getSheetByName("Axon Connect");
    if (!sheet) throw new Error("Brak zakładki 'Axon Connect'");
    var data = sheet.getDataRange().getValues();
    var tickets = [];

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var id = row[0] ? row[0].toString().trim() : "";
      var statusAxon = row[6] ? row[6].toString().trim().toUpperCase() : "";
      var ticketStatusCol = row[21] ? row[21].toString().trim() : ""; // Col V
      
      var isClosedByStatus = (statusAxon.indexOf('CLOSED') > -1 || statusAxon.indexOf('CANCELLED') > -1 || statusAxon.indexOf('ZAMKNIĘT') > -1 || statusAxon.indexOf('ANULOWAN') > -1);

      var isPreSettled = (
        ticketStatusCol.toLowerCase().indexOf('wstępn') > -1 || 
        statusAxon.indexOf('WSTĘPN') > -1 || 
        (billingsMap[id] && billingsMap[id].state === "PRE_SETTLED")
      );

      // ZGŁOSZENIE ZAKWALIFIKOWANE DO WIDOKU ROZLICZEŃ
      if (row[18] || row[19] || isClosedByStatus || isPreSettled || billingsMap[id]) {
        var finalDate = row[18] ? row[18] : (row[19] ? row[19] : "");
        var finalStatus = "Zamknięte";
        if (row[19] || statusAxon.indexOf('CANCELLED') > -1 || statusAxon.indexOf('ANULOWAN') > -1) {
          finalStatus = "Anulowane";
        } else if (isPreSettled && !row[18] && !isClosedByStatus) {
          finalStatus = "Wstępnie rozliczone";
        }
        
        var bState = "";
        var savedData = null;
        var tEur = "0.00";
        var tItems = "";

        if(billingsMap[id]) {
           bState = billingsMap[id].state; 
           tEur = billingsMap[id].total_eur;
           tItems = billingsMap[id].items_str; // Ładowanie tekstu z cennikami
           try { savedData = JSON.parse(billingsMap[id].json); } catch(e) {}
           
           if (!finalDate && savedData && savedData.visits_array && savedData.visits_array.length > 0) {
               var lastV = savedData.visits_array[savedData.visits_array.length - 1];
               if (lastV.date) finalDate = new Date(lastV.date);
           }
        } else if (isPreSettled) {
           bState = "PRE_SETTLED";
        }

        if (!finalDate && isPreSettled) {
            finalDate = row[16] ? row[16] : new Date(); // Data z kolumny Q
        }

        tickets.push({
          id: id || 'TCK_' + i, 
          ticket_id: id, 
          qp: row[1] ? row[1].toString().trim() : "",
          client: row[2] ? row[2].toString().trim() : "", 
          technician: row[12] ? row[12].toString().trim() : "",
          country: stationCountryMap[row[1] ? row[1].toString().trim() : ""] || "Polska",
          created_date: row[16] || "", 
          closed_date: finalDate, 
          status: finalStatus,
          ticket_status: ticketStatusCol || finalStatus,
          billing_state: bState, 
          total_eur: tEur, 
          items_str: tItems, // PRZEKAZANIE DO FRONTENDU!
          saved_data: savedData
        });
      }
    }

    var techs = [];
    try {
      var arkuszTech = ss.getSheetByName("sys_technicians");
      if(arkuszTech) {
         var techData = arkuszTech.getDataRange().getValues();
         for(var t = 1; t < techData.length; t++) {
           if(techData[t][1]) techs.push({ name: techData[t][1].toString().trim(), color: techData[t][2] ? techData[t][2].toString().trim() : "#58b347" });
         }
      }
    } catch(e){}

    var pricelists = {};
    var allSheets = ss.getSheets();
    for (var s = 0; s < allSheets.length; s++) {
      var sName = allSheets[s].getName();
      if (sName.toLowerCase().indexOf('cennik') > -1) {
        var pData = allSheets[s].getDataRange().getValues();
        var items = [];
        for (var r = 1; r < pData.length; r++) { 
          var lp = pData[r][0] ? pData[r][0].toString().trim() : ""; 
          if(lp && /^\d/.test(lp)) {
             items.push({ 
                 lp: lp, name: pData[r][1] ? pData[r][1].toString().trim() : "", 
                 time: parseFloat(pData[r][2]) || 0, 
                 prices: [parseFloat(pData[r][4])||0, parseFloat(pData[r][5])||0, parseFloat(pData[r][6])||0, parseFloat(pData[r][7])||0] 
             });
          }
        }
        var cleanName = sName.replace(/cennik/i, '').trim();
        pricelists[cleanName || sName] = items;
      }
    }

    return JSON.stringify({ success: true, tickets: tickets.reverse(), techs: techs, pricelists: pricelists });
  } catch (e) {
    return JSON.stringify({ success: false, error: e.toString() });
  }
}

function saveSettlementToSysBillings(payload) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("sys_billings") || initSysBillingsSheet();
    var data = sheet.getDataRange().getValues();
    
    var rowIndex = -1;
    for(var i=1; i<data.length; i++) {
      if(data[i][0] && data[i][0].toString().trim() === payload.ticket_id) { rowIndex = i + 1; break; }
    }
    
    // --- OBSŁUGA TWARDEGO USUWANIA Z ROZLICZEŃ ---
    if (payload.is_deleted === true) {
        
        // 1. Usuwamy TYLKO kalkulację finansową z zakładki sys_billings
        if (rowIndex > -1) {
            sheet.deleteRow(rowIndex);
        }
        
        // 2. Cofamy status zgłoszenia w głównej bazie, NIE TYKAJĄC diagnozy technika
        var axonSheet = ss.getSheetByName("Axon Connect");
        if (axonSheet) {
            var axonData = axonSheet.getDataRange().getValues();
            for(var a=1; a<axonData.length; a++) {
               if(axonData[a][0] && axonData[a][0].toString().trim() === payload.ticket_id) { 
                   // Kolumna V (indeks 22) - Status Zlecenia. 
                   // Ustawiamy na "Zamknięte", żeby zgłoszenie wróciło do koszyka "Do rozliczenia".
                   axonSheet.getRange(a + 1, 22).setValue('Wykonano'); 
                   break;
               }
            }
        }
        
        // [DODANO] Czyszczenie Cache po usunięciu rozliczenia
        removeLargeCache("DB_TABLE_sys_billings");
        return { success: true, message: "Kalkulacja usunięta. Zgłoszenie wróciło do puli." };
    }

    // === AUTOMATYCZNE PRZEJŚCIE ROZLICZEŃ Z "WSTĘPNE" NA "ROZLICZONE" ===
    function autoUpgradePreSettlements(ticketId, newAxonStatus) {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName("sys_billings");
      if (!sheet) return;
      
      var isClosed = (newAxonStatus.indexOf('ZAMKNIĘT') > -1 || newAxonStatus.indexOf('ZAKOŃCZ') > -1 || newAxonStatus.indexOf('CLOSED') > -1 || newAxonStatus.indexOf('CANCELLED') > -1);
      if (!isClosed) return;
      
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (data[i][0] && data[i][0].toString().trim() === ticketId) {
           var currentBillStatus = data[i][14] ? data[i][14].toString().toLowerCase() : "";
           // Znalazł wstępnie rozliczone na wyłączonym tickecie!
           if (currentBillStatus.indexOf('wstępn') > -1) {
               sheet.getRange(i + 1, 15).setValue('Rozliczone'); // Col O (Status rozliczenia)
               // Odśwież też w JSONie (zabezpieczenie)
               var rawJson = data[i][15];
               if (rawJson) {
                   try {
                      var sd = JSON.parse(rawJson);
                      sd.status_rozliczenia = 'Rozliczone';
                      sd.ticket_status = 'Rozliczone';
                      sheet.getRange(i + 1, 16).setValue(JSON.stringify(sd));
                   } catch(e) {}
               }
               
               // [DODANO] Czyszczenie Cache, bo funkcja w tle zaktualizowała arkusz
               removeLargeCache("DB_TABLE_sys_billings");
           }
           break;
        }
      }
    }
    
    // --- OBSŁUGA NORMALNEGO ZAPISU ---
    var rowData = [
      payload.ticket_id, payload.client, payload.qp, payload.date, payload.tech, 
      payload.type, payload.items_str, payload.total_eur, payload.status_fixed, 
      payload.status_revisit, payload.notes, payload.rbh, payload.travel, 
      new Date(), payload.status_rozliczenia, JSON.stringify(payload)
    ];

    if(rowIndex > -1) sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    else sheet.appendRow(rowData);
    
    // [DODANO] Czyszczenie Cache po dodaniu/edycji rozliczenia
    removeLargeCache("DB_TABLE_sys_billings");
    return { success: true };
  } catch (e) { return { success: false, error: e.toString() }; }
}


// === MODUŁ: AUTORYZACJA I UPRAWNIENIA (NAZWA UŻYTKOWNIKA) ===

function verifySystemLogin(username, password) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('sys_users');
  if (!sheet) return { success: false, message: "Krytyczny błąd bazy: Brak arkusza sys_users." };

  var data = sheet.getDataRange().getValues();
  var now = new Date().toISOString(); 
  var inputUser = username.toString().toLowerCase().trim();

  // Zaczynamy od i=1 (omijamy nagłówki)
  for (var i = 1; i < data.length; i++) {
    var dbUser = data[i][1].toString().toLowerCase().trim();
    
    if (dbUser === inputUser) {
      if (data[i][4].toString().toUpperCase() !== 'ACTIVE') {
        return { success: false, message: "To konto zostało zawieszone." };
      }

      var dbPassword = data[i][2] ? data[i][2].toString().trim() : "";

      // NOWOŚĆ: 1. Wykrycie braku hasła u istniejącego użytkownika
      if (dbPassword === "") {
        return { 
          success: true, 
          requirePasswordSetup: true, 
          username: dbUser 
        };
      }

      // 2. Normalna weryfikacja hasła, gdy jest już ustawione
      if (dbPassword !== password) {
        return { success: false, message: "Nieprawidłowe hasło." };
      }
      
      // 3. Sukces standardowego logowania: Zapisanie "Last Seen" w kolumnie G
      sheet.getRange(i + 1, 7).setValue(now);
      
      var rawPanels = data[i][5] ? data[i][5].toString() : "";
      var cleanPanels = rawPanels.replace(/\s+/g, ''); 
      
      return {
        success: true,
        username: dbUser, 
        role: data[i][3],
        panels: cleanPanels,
        settings: data[i][7] ? data[i][7].toString() : "{}"
      };
    }
  }
  
  return { success: false, message: "Nieprawidłowa nazwa użytkownika lub hasło." }; 
}

/**
 * NOWA FUNKCJA: Zapisuje nowe hasło dla użytkownika i od razu loguje go do systemu
 */
function setNewUserPassword(username, newPassword) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('sys_users');
  if (!sheet) return { success: false, message: "Brak arkusza sys_users." };

  var data = sheet.getDataRange().getValues();
  var inputUser = username.toString().toLowerCase().trim();

  for (var i = 1; i < data.length; i++) {
    var dbUser = data[i][1].toString().toLowerCase().trim();
    
    if (dbUser === inputUser) {
      var dbPassword = data[i][2] ? data[i][2].toString().trim() : "";
      
      // Zabezpieczenie: Hasło można ustawić tylko, jeśli w bazie jest puste!
      if (dbPassword !== "") {
        return { success: false, message: "Twoje hasło zostało już wcześniej ustawione." };
      }

      // Zapisujemy nowe hasło w kolumnie C (indeks arkusza to wiersz+1, kolumna 3)
      sheet.getRange(i + 1, 3).setValue(newPassword);

      // Logujemy go (tworzymy sesję tak jak w normalnym logowaniu)
      var now = new Date().toISOString();
      sheet.getRange(i + 1, 7).setValue(now);
      
      var rawPanels = data[i][5] ? data[i][5].toString() : "";
      var cleanPanels = rawPanels.replace(/\s+/g, ''); 

      return {
        success: true,
        username: dbUser, 
        role: data[i][3],
        panels: cleanPanels,
        settings: data[i][7] ? data[i][7].toString() : "{}"
      };
    }
  }
  
  return { success: false, message: "Użytkownik nie istnieje." };
}

// === SZYBKIE SPRAWDZANIE UPRAWNIEŃ W TLE ===
function checkUserPermissions(username) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('sys_users');
  if (!sheet) return null;

  var data = sheet.getDataRange().getValues();
  var inputUser = username.toString().toLowerCase().trim();

  for (var i = 1; i < data.length; i++) {
    var dbUser = data[i][1].toString().toLowerCase().trim();
    if (dbUser === inputUser) {
      return {
        status: data[i][4].toString().toUpperCase(), // ACTIVE / SUSPENDED
        panels: data[i][5] ? data[i][5].toString().replace(/\s+/g, '') : "" // Z automatu usuwa spacje
      };
    }
  }
  return null; // Zwraca null, jeśli użytkownik został usunięty z Arkusza
}

function saveUserSettings(username, settingsJson) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('sys_users');
  if (!sheet) return false;
  
  var data = sheet.getDataRange().getValues();
  var inputUser = username.toString().toLowerCase().trim();

  for (var i = 1; i < data.length; i++) {
    var dbUser = data[i][1].toString().toLowerCase().trim();
    if (dbUser === inputUser) {
      
      // 1. Pobierz aktualne ustawienia z komórki H (indeks 7)
      var currentSettingsRaw = data[i][7]; 
      var currentSettings = {};
      if (currentSettingsRaw) {
         try { currentSettings = JSON.parse(currentSettingsRaw); } catch(e) {}
      }
      
      // 2. Pobierz nowe ustawienia przysłane z panelu
      var newSettings = {};
      try { newSettings = JSON.parse(settingsJson); } catch(e) {}
      
      // 3. Scal (zmerguj) ustawienia - nowe dane modułu zaktualizują stare, a reszta pozostanie
      for (var key in newSettings) {
         currentSettings[key] = newSettings[key];
      }
      
      // 4. Zapisz złączony obiekt z powrotem do kolumny H
      sheet.getRange(i + 1, 8).setValue(JSON.stringify(currentSettings)); 
      return true;
    }
  }
  return false;
}

// === MODUŁ HARMONOGRAMU (CALENDAR) ===

function getScheduleData() {
  try {
    var eventsRes = JSON.parse(db_readTable('sys_calendar_events'));
    var ekoenTicketsRes = JSON.parse(db_readTable('sys_tickets'));
    var stationsRes = JSON.parse(db_readTable('sys_stations'));
    var techRes = JSON.parse(db_readTable('sys_technicians'));
    var clientsRes = JSON.parse(db_readTable('sys_clients'));

    // POBIERAMY RÓWNIEŻ ZGŁOSZENIA Z AXON CONNECT
    var axonTickets = [];
    if (typeof getTicketsFromSheet === 'function') {
        try { axonTickets = getTicketsFromSheet() || []; } catch(e) {}
    }
    
    // ŁĄCZYMY OBIE BAZY
    var ekoenTickets = ekoenTicketsRes.success ? ekoenTicketsRes.data : [];
    var allTickets = axonTickets.concat(ekoenTickets);

    return JSON.stringify({
      success: true,
      events: eventsRes.success ? eventsRes.data : [],
      tickets: allTickets,
      stations: stationsRes.success ? stationsRes.data : [],
      technicians: techRes.success ? techRes.data : [],
      clients: clientsRes.success ? clientsRes.data : []
    });
  } catch (e) {
    return JSON.stringify({ success: false, error: e.toString() });
  }
}

function saveCalendarEvent(eventObj) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('sys_calendar_events');
    if (!sheet) {
      sheet = ss.insertSheet('sys_calendar_events');
      sheet.appendRow(['id', 'ticket_id', 'technician_id', 'title', 'start_time', 'end_time', 'event_type', 'created_at']);
    }

    var data = sheet.getDataRange().getValues();
    var foundIndex = -1;

    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() === eventObj.id.toString()) {
        foundIndex = i + 1;
        break;
      }
    }

    if (foundIndex !== -1) {
      // Aktualizacja istniejącego zdarzenia
      sheet.getRange(foundIndex, 1, 1, 7).setValues([[
        eventObj.id,
        eventObj.ticket_id || '',
        eventObj.technician_id || '',
        eventObj.title || '',
        eventObj.start_time || '',
        eventObj.end_time || '',
        eventObj.event_type || 'repair'
      ]]);
    } else {
      // Nowe zdarzenie
      var newId = eventObj.id || 'EV_' + new Date().getTime();
      sheet.appendRow([
        newId,
        eventObj.ticket_id || '',
        eventObj.technician_id || '',
        eventObj.title || '',
        eventObj.start_time || '',
        eventObj.end_time || '',
        eventObj.event_type || 'repair',
        new Date().toISOString()
      ]);
    }
    removeLargeCache("DB_TABLE_sys_calendar_events");
    return JSON.stringify({ success: true });
  } catch (e) {
    return JSON.stringify({ success: false, error: e.toString() });
  }
}

function deleteCalendarEvent(eventId) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('sys_calendar_events');
    if (!sheet) return JSON.stringify({ success: false, message: 'Brak arkusza sys_calendar_events' });

    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() === eventId.toString()) {
        sheet.deleteRow(i + 1);
        removeLargeCache("DB_TABLE_sys_calendar_events");
        return JSON.stringify({ success: true });
      }
    }
    return JSON.stringify({ success: false, message: 'Nie znaleziono zdarzenia' });
  } catch (e) {
    return JSON.stringify({ success: false, error: e.toString() });
  }
}

// =========================================================================
// MODUŁ: ZARZĄDZANIE PLIKAMI (GOOGLE DRIVE)
// =========================================================================

/**
 * Funkcja pomocnicza: pobiera folder po nazwie wewnątrz rodzica, 
 * lub tworzy go, jeśli nie istnieje.
 */
function getOrCreateFolder(parentFolder, folderName) {
  var folders = parentFolder.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parentFolder.createFolder(folderName);
}

/**
 * Zwraca (lub tworzy) fizyczny folder dla załączników danego zlecenia.
 * Ścieżka: EKOEN - Ticket System -> Zlecenia -> [ticketId] -> Zalaczniki
 */
function getTicketAttachmentsFolder(ticketId) {
  // 1. Główny folder systemu (Tworzy w głównym katalogu Dysku, jeśli go nie ma)
  var rootFolders = DriveApp.getFoldersByName("EKOEN - Ticket System");
  var rootFolder = rootFolders.hasNext() ? rootFolders.next() : DriveApp.createFolder("EKOEN - Ticket System");

  // 2. Podfolder "Zlecenia"
  var zleceniaFolder = getOrCreateFolder(rootFolder, "Zlecenia");

  // 3. Podfolder zlecenia (używamy ID zlecenia np. TKT-12345)
  var ticketFolder = getOrCreateFolder(zleceniaFolder, ticketId);

  // 4. Podfolder "Zalaczniki"
  var zalacznikiFolder = getOrCreateFolder(ticketFolder, "Zalaczniki");

  return zalacznikiFolder;
}

/**
 * Główna funkcja wywoływana z frontendu do zapisu pojedynczego pliku
 * fileBase64 musi być czystym stringiem b64 (bez prefiksów 'data:image/png;base64,')
 */
function uploadTicketAttachment(ticketId, fileBase64, fileName, mimeType) {
  try {
    if (!ticketId || !fileBase64 || !fileName) {
      throw new Error("Brak wymaganych danych do zapisu pliku.");
    }

    var folder = getTicketAttachmentsFolder(ticketId);
    
    // Dekodowanie z Base64 i utworzenie pliku (Bloba)
    var blob = Utilities.newBlob(Utilities.base64Decode(fileBase64), mimeType, fileName);
    var file = folder.createFile(blob);
    
    return JSON.stringify({
      success: true,
      fileUrl: file.getUrl(),
      fileId: file.getId(),
      fileName: fileName
    });

  } catch(e) {
    Logger.log("Błąd zapisu pliku: " + e.toString());
    return JSON.stringify({ success: false, error: e.toString() });
  }
}

// =========================================================================
// POBIERANIE ZAWARTOŚCI FOLDERU DO PODGLĄDU ZGŁOSZENIA
// =========================================================================
function getTicketFilesList(folderUrl) {
  try {
    var match = folderUrl.match(/folders\/([a-zA-Z0-9-_]+)/);
    if (!match || !match[1]) return JSON.stringify({ success: false, error: "Nieprawidłowy link do folderu." });
    
    var folderId = match[1];
    var folder = DriveApp.getFolderById(folderId);
    var files = folder.getFiles();
    var fileList = [];
    
    while (files.hasNext()) {
      var f = files.next();
      fileList.push({
        id: f.getId(),
        name: f.getName(),
        mimeType: f.getMimeType(),
        url: f.getUrl()
      });
    }
    return JSON.stringify({ success: true, files: fileList });
  } catch(e) {
    return JSON.stringify({ success: false, error: e.toString() });
  }
}

// =========================================================================
// ZAPISYWANIE USŁUG SPOZA CENNIKA DO GŁÓWNEJ BAZY
// =========================================================================
function saveCustomServiceToPricelist(payload) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = "Cennik Dodatkowe";
    var sheet = ss.getSheetByName(sheetName);
    
    // Jeśli zakładka jeszcze nie istnieje, tworzymy ją z odpowiednimi nagłówkami
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      var headers = ["L.p.", "Nazwa usługi", "Czas (h)", "Uwagi", "Region 1 (€)", "Region 2 (€)", "Region 3 (€)", "Region 4 (€)"];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold").setBackground("#f3f3f3");
      sheet.setFrozenRows(1);
    }
    
    var data = sheet.getDataRange().getValues();
    var exists = false;
    var cleanName = payload.name.toString().trim().toLowerCase();
    
    // Zabezpieczenie przed dublowaniem: Sprawdzamy czy ta usługa już jest w tym cenniku
    for (var i = 1; i < data.length; i++) {
      if (data[i][1] && data[i][1].toString().trim().toLowerCase() === cleanName) {
        exists = true;
        break;
      }
    }
    
    if (!exists) {
      var lp = "D-" + Math.floor(Math.random() * 89999 + 10000); // Generowanie unikalnego L.p.
      var rowData = [
        lp, 
        payload.name.toString().trim(), 
        0, // Czas roboczogodzin (domyślnie 0)
        "Dodane ręcznie z panelu rozliczeń", // Uwagi
        payload.price, // Cena 1
        payload.price, // Cena 2
        payload.price, // Cena 3
        payload.price  // Cena 4
      ];
      sheet.appendRow(rowData);
    }
    return true;
  } catch (e) {
    Logger.log("Błąd zapisu nowej usługi: " + e.toString());
    return false;
  }
}

// =========================================================================
// NARZĘDZIE DEBUGOWANIA: Zrzut wszystkich danych o stacji do Logów
// =========================================================================

function debugStationData() {
  var targetQP = "QP-7831"; // <--- Tutaj wpisujesz numer stacji, który chcesz prześwietlić
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  Logger.log("Rozpoczynam skanowanie bazy dla stacji: " + targetQP);
  
  // 1. SKANOWANIE BAZY STACJI (sys_stations)
  var stationSheet = ss.getSheetByName('sys_stations');
  var stationData = [];
  if (stationSheet) {
    var data = stationSheet.getDataRange().getValues();
    var headers = data[0];
    for (var i = 1; i < data.length; i++) {
      // Szukamy w kolumnie B (public_id) lub A (id)
      if (String(data[i][1]).indexOf(targetQP) > -1 || String(data[i][0]).indexOf(targetQP) > -1) {
        var stObj = {};
        for(var j=0; j<headers.length; j++) {
          stObj[headers[j] || "col_"+j] = data[i][j];
        }
        stationData.push(stObj);
      }
    }
  }

  // 2. SKANOWANIE ZGŁOSZEŃ (Axon Connect)
  var axonSheet = ss.getSheetByName('Axon Connect');
  var axonTickets = [];
  if (axonSheet) {
    var aData = axonSheet.getDataRange().getValues();
    var aHeaders = aData[0]; 
    for (var i = 1; i < aData.length; i++) {
      if (String(aData[i][1]).indexOf(targetQP) > -1) { // Kolumna B to QP
        var tObj = {};
        for(var j=0; j<aHeaders.length; j++) {
          tObj[aHeaders[j] || "col_"+j] = aData[i][j];
        }
        axonTickets.push(tObj);
      }
    }
  }

  // 3. SKANOWANIE ZGŁOSZEŃ WEWNĘTRZNYCH (sys_tickets)
  var ekoenSheet = ss.getSheetByName('sys_tickets');
  var ekoenTickets = [];
  if (ekoenSheet) {
    var eData = ekoenSheet.getDataRange().getValues();
    var eHeaders = eData[0];
    for (var i = 1; i < eData.length; i++) {
      if (String(eData[i][2]).indexOf(targetQP) > -1) { // Kolumna C to station_id
        var eObj = {};
        for(var j=0; j<eHeaders.length; j++) {
          eObj[eHeaders[j] || "col_"+j] = eData[i][j];
        }
        ekoenTickets.push(eObj);
      }
    }
  }

  // WYNIKI W DZIENNIKU
  Logger.log("=================================================");
  Logger.log("🏢 DANE STACJI (sys_stations):");
  Logger.log(JSON.stringify(stationData, null, 2));
  
  Logger.log("\n=================================================");
  Logger.log("🚨 ZGŁOSZENIA ZEWNĘTRZNE (Axon Connect):");
  Logger.log(JSON.stringify(axonTickets, null, 2));
  
  Logger.log("\n=================================================");
  Logger.log("🛠️ ZGŁOSZENIA WEWNĘTRZNE (sys_tickets):");
  Logger.log(JSON.stringify(ekoenTickets, null, 2));
  Logger.log("=================================================");
}

// =========================================================================
// SILNIK SYNCHRONIZUJĄCY STACJE ZE ZGŁOSZENIAMI
// =========================================================================

/**
 * Twardy zapis wyliczonych statusów i ostatnich zgłoszeń fizycznie do Arkusza Google.
 * WERSJA BEZPIECZNA: Omija "Wystąpił nieznany błąd", nadpisując tylko i wyłącznie konkretne, wyliczone komórki (nie cały zakres danych).
 */
function syncStationsWithTickets() {
  FORCE_SYNC_ALL_STATIONS();
}

/**
 * Główny silnik synchronizujący, zoptymalizowany, by był odporny na uszkodzone daty i dane.
 * Uruchom tę funkcję ręcznie z poziomu edytora, aby zaktualizować stare wpisy!
 */
function FORCE_SYNC_ALL_STATIONS() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('sys_stations');
  if(!sheet) {
    Logger.log("Błąd: Nie znaleziono zakładki sys_stations");
    return;
  }

  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return;
  var headers = data[0].map(function(h) { return String(h).trim(); });

  var idCol = headers.indexOf('id');
  var pubIdCol = headers.indexOf('public_id');
  var countryCol = headers.indexOf('country');
  var regionCol = headers.indexOf('region');
  var statusCol = headers.indexOf('status');
  var lastTicketCol = headers.indexOf('last_ticket');
  if(lastTicketCol === -1) lastTicketCol = headers.indexOf('last_ticket_date'); 

  if (idCol === -1 || statusCol === -1 || lastTicketCol === -1) {
    Logger.log("Błąd: W arkuszu 'sys_stations' brakuje przynajmniej jednej kolumny kluczowej (id, status, last_ticket).");
    return;
  }

  var axonTickets = [];
  try { axonTickets = getTicketsFromSheet() || []; } catch(e) {}

  var ekoenTickets = [];
  try { 
     var ekRes = JSON.parse(db_readTable('sys_tickets')); 
     if(ekRes && ekRes.success) ekoenTickets = ekRes.data;
  } catch(e) {}

  var allTickets = axonTickets.concat(ekoenTickets);

  function isClosed(st) {
    if (!st) return false;
    var lower = String(st).toLowerCase();
    // NAPRAWIONA ZMIANA: Wyłapuje tylko prawdziwe zamknięcia
    return lower === 'zamknięte' || 
           lower === 'anulowane' || 
           lower === 'closed' || 
           lower === 'cancelled';
  }

  for (var i = 1; i < data.length; i++) {
    var rowNum = i + 1; 
    var sUuid = String(data[i][idCol] || "").trim().toLowerCase();
    var sPub = String(data[i][pubIdCol] || "").trim().toLowerCase();

    var currentCountry = countryCol > -1 ? String(data[i][countryCol] || "") : "";
    var currentRegion = regionCol > -1 ? String(data[i][regionCol] || "") : "";
    var currentStatus = String(data[i][statusCol] || "");
    var currentLastTicket = String(data[i][lastTicketCol] || "");

    var newCountry = currentCountry;
    if (!newCountry && currentRegion) {
      newCountry = currentRegion;
    }

    var stationTickets = allTickets.filter(function(t) {
      var tId = String(t.qp_id || t.station_id || '').trim().toLowerCase();
      return tId !== '' && (tId === sUuid || tId === sPub);
    });

    var newStatus = "Działa";
    var newLastTicket = "Brak zgłoszeń";

    if (stationTickets.length > 0) {
      stationTickets.sort(function(a, b) {
        var d1 = a.created_at ? new Date(a.created_at).getTime() : 0;
        var d2 = b.created_at ? new Date(b.created_at).getTime() : 0;
        return d2 - d1;
      });
      
      var latest = stationTickets[0];
      newLastTicket = latest.ticket_code || latest.ticket_number || latest.id || 'Brak Kodu';

      var activeTickets = stationTickets.filter(function(t) { return !isClosed(t.status); });
      
      if (activeTickets.length > 0) {
        var hasAwaria = false, hasPrzeglad = false, hasRework = false, hasUruchomienie = false;

        activeTickets.forEach(function(at) {
          var txt = (String(at.subject||'') + " " + String(at.description||'') + " " + String(at.status||'') + " " + String(at.ticket_status||'')).toLowerCase();
          
          if (txt.indexOf('przegl') > -1 || txt.indexOf('udt') > -1) hasPrzeglad = true;
          else if (txt.indexOf('uruchomieni') > -1) hasUruchomienie = true;
          else if (txt.indexOf('rework') > -1) hasRework = true;
          else hasAwaria = true; 
        });

        if (hasAwaria) newStatus = "Awaria";
        else if (hasPrzeglad) newStatus = "Przegląd";
        else if (hasRework) newStatus = "Rework";
        else if (hasUruchomienie) newStatus = "Uruchomienie";
        else newStatus = "Awaria"; 
      }
    }

    if (countryCol > -1 && currentCountry !== newCountry) {
      sheet.getRange(rowNum, countryCol + 1).setValue(newCountry);
    }
    if (currentStatus !== newStatus) {
      sheet.getRange(rowNum, statusCol + 1).setValue(newStatus);
    }
    if (currentLastTicket !== newLastTicket) {
      sheet.getRange(rowNum, lastTicketCol + 1).setValue(newLastTicket);
    }
  }
  
  Logger.log("Zakończono synchronizację starych stacji. Zaktualizowano wszystkie wpisy.");
  removeLargeCache("DB_TABLE_sys_stations");
}

/**
 * Dedykowana funkcja pozwalająca na bezpieczne pobieranie danych z poziomu Localhost (Local Dev)
 */
function getScheduleDataForLocalDev() {
  return getScheduleData();
}

function HARD_RESET_CACHE() {
  var tables = [
    "sys_stations", "sys_clients", "sys_technicians", "sys_area", 
    "sys_parts", "sys_tickets", "sys_calendar_events", "sys_billings", "sys_inventory_logs"
  ];
  
  tables.forEach(function(tableName) { 
    removeLargeCache("DB_TABLE_" + tableName); 
  });
  
  Logger.log("🧹 Cała pamięć Cache została wyczyszczona!");
}