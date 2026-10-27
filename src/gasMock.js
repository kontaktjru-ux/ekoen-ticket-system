// Adres URL z dodanym parametrem action=getScheduleData
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbyuikCp8l8PIMgWgHuME9iqX7yKPyooFUrE_AwmgR6JNG8QlxTvHY6oT90r95ZMStOH/exec";

export const initGasMock = () => {
  if (typeof window.google === 'undefined') {
    window.google = {
      script: {
        run: {
          withSuccessHandler: function(callback) {
            this._successCallback = callback;
            return this;
          },
          withFailureHandler: function(callback) {
            this._failureCallback = callback;
            return this;
          },

          getScheduleData: function() {
            if (window.SERVER_PAYLOAD && window.SERVER_PAYLOAD.schedule) {
              console.log("[PAYLOAD] Błyskawiczne ładowanie Harmonogramu (0ms)!");
              const payload = window.SERVER_PAYLOAD.schedule;
              if (this._successCallback) this._successCallback(payload);
              window.SERVER_PAYLOAD.schedule = null;
              return;
            }

            console.log("[MOCK] Pobieranie Harmonogramu z Google (Fetch)...");
            fetch(GAS_API_URL + "?action=getScheduleData")
              .then(res => res.json())
              .then(data => {
                const payload = typeof data === 'string' ? data : JSON.stringify(data);
                if (this._successCallback) this._successCallback(payload);
              })
              .catch(err => { if (this._failureCallback) this._failureCallback(err); });
          },

          getClientsData: function() {
            if (window.SERVER_PAYLOAD && window.SERVER_PAYLOAD.clients) {
              console.log("[PAYLOAD] Błyskawiczne ładowanie Bazy Klientów (0ms)!");
              const payload = window.SERVER_PAYLOAD.clients;
              if (this._successCallback) this._successCallback(payload);
              window.SERVER_PAYLOAD.clients = null;
              return;
            }

            console.log("[MOCK] Pobieranie Bazy Klientów z Google (Fetch)...");
            fetch(GAS_API_URL + "?action=getClientsData")
              .then(res => res.json())
              .then(data => {
                const payload = typeof data === 'string' ? data : JSON.stringify(data);
                if (this._successCallback) this._successCallback(payload);
              })
              .catch(err => { if (this._failureCallback) this._failureCallback(err); });
          },

          getBillingsDataForFrontend: function() {
            if (window.SERVER_PAYLOAD && window.SERVER_PAYLOAD.billings) {
              console.log("[PAYLOAD] Błyskawiczne ładowanie Rozliczeń (0ms)!");
              const payload = window.SERVER_PAYLOAD.billings;
              if (this._successCallback) this._successCallback(payload);
              window.SERVER_PAYLOAD.billings = null;
              return;
            }

            console.log("[MOCK] Pobieranie Bilingów z Google (Fetch)...");
            fetch(GAS_API_URL + "?action=getBillingsDataForFrontend")
              .then(res => res.json())
              .then(data => {
                const payload = typeof data === 'string' ? data : JSON.stringify(data);
                if (this._successCallback) this._successCallback(payload);
              })
              .catch(err => { if (this._failureCallback) this._failureCallback(err); });
          },

          getAxonDataForFrontend: function() {
            if (window.SERVER_PAYLOAD && window.SERVER_PAYLOAD.axon) {
              console.log("[PAYLOAD] Błyskawiczne ładowanie AxonConnect (0ms)!");
              if (this._successCallback) this._successCallback(window.SERVER_PAYLOAD.axon);
              window.SERVER_PAYLOAD.axon = null;
              return;
            }
            console.log("[MOCK] Pobieranie zgłoszeń AxonConnect z Google (Fetch)...");
            fetch(GAS_API_URL + "?action=getAxonDataForFrontend")
              .then(res => res.json())
              .then(data => {
                const payload = typeof data === 'string' ? data : JSON.stringify(data);
                if (this._successCallback) this._successCallback(payload);
              }).catch(err => { if (this._failureCallback) this._failureCallback(err); });
          },

          getTicketsData: function() {
            if (window.SERVER_PAYLOAD && window.SERVER_PAYLOAD.ekoen) {
              console.log("[PAYLOAD] Błyskawiczne ładowanie zgłoszeń Ekoen (0ms)!");
              if (this._successCallback) this._successCallback(window.SERVER_PAYLOAD.ekoen);
              window.SERVER_PAYLOAD.ekoen = null;
              return;
            }
            console.log("[MOCK] Pobieranie zgłoszeń Ekoen z Google (Fetch)...");
            fetch(GAS_API_URL + "?action=getTicketsData")
              .then(res => res.json())
              .then(data => {
                const payload = typeof data === 'string' ? data : JSON.stringify(data);
                if (this._successCallback) this._successCallback(payload);
              }).catch(err => { if (this._failureCallback) this._failureCallback(err); });
          },

          getTicketsFromSheet: function() {
            console.log("[MOCK] Pobieranie Historii Zgłoszeń z Google (Fetch)...");
            fetch(GAS_API_URL + "?action=getTicketsFromSheet")
              .then(res => res.json())
              .then(data => {
                const payload = typeof data === 'string' ? data : JSON.stringify(data);
                if (this._successCallback) this._successCallback(payload);
              }).catch(err => { if (this._failureCallback) this._failureCallback(err); });
          },

          getMapData: function() {
            if (window.SERVER_PAYLOAD && window.SERVER_PAYLOAD.mapData) {
              console.log("[PAYLOAD] Błyskawiczne ładowanie Mapy (0ms)!");
              if (this._successCallback) this._successCallback(window.SERVER_PAYLOAD.mapData);
              window.SERVER_PAYLOAD.mapData = null;
              return;
            }
            console.log("[MOCK] Pobieranie Danych Mapy (Stacje, Regiony) z Google...");
            fetch(GAS_API_URL + "?action=getMapData")
              .then(res => res.json())
              .then(data => {
                const payload = typeof data === 'string' ? data : JSON.stringify(data);
                if (this._successCallback) this._successCallback(payload);
              }).catch(err => { if (this._failureCallback) this._failureCallback(err); });
          },

          fetchGeoJSONFromDrive: function(url) {
            console.log(`[MOCK] Pobieranie GeoJSON z Google Drive (URL: ${url})...`);
            fetch(GAS_API_URL + "?action=fetchGeoJSONFromDrive&url=" + encodeURIComponent(url))
              .then(res => res.json())
              .then(data => {
                const payload = typeof data === 'string' ? data : JSON.stringify(data);
                if (this._successCallback) this._successCallback(payload);
              }).catch(err => { if (this._failureCallback) this._failureCallback(err); });
          },

          getTechniciansFromBase: function() {
            if (window.SERVER_PAYLOAD && window.SERVER_PAYLOAD.technicians) {
              console.log("[PAYLOAD] Błyskawiczne ładowanie Kadr (0ms)!");
              if (this._successCallback) this._successCallback(window.SERVER_PAYLOAD.technicians);
              window.SERVER_PAYLOAD.technicians = null;
              return;
            }
            console.log("[MOCK] Pobieranie Danych Pracowników z Google...");
            fetch(GAS_API_URL + "?action=getTechniciansFromBase")
              .then(res => res.json())
              .then(data => {
                const payload = typeof data === 'string' ? data : JSON.stringify(data);
                if (this._successCallback) this._successCallback(payload);
              }).catch(err => { if (this._failureCallback) this._failureCallback(err); });
          },

          getStorageData: function() {
            if (window.SERVER_PAYLOAD && window.SERVER_PAYLOAD.storage) {
              console.log("[PAYLOAD] Błyskawiczne ładowanie Magazynu (0ms)!");
              if (this._successCallback) this._successCallback(window.SERVER_PAYLOAD.storage);
              window.SERVER_PAYLOAD.storage = null;
              return;
            }
            console.log("[MOCK] Pobieranie Magazynu z Google...");
            fetch(GAS_API_URL + "?action=getStorageData")
              .then(res => res.json())
              .then(data => {
                const payload = typeof data === 'string' ? data : JSON.stringify(data);
                if (this._successCallback) this._successCallback(payload);
              }).catch(err => { if (this._failureCallback) this._failureCallback(err); });
          },

          getStationsData: function() {
            console.log("[MOCK] Pobieranie Stacji z Google...");
            fetch(GAS_API_URL + "?action=getStationsData")
              .then(res => res.json())
              .then(data => {
                const payload = typeof data === 'string' ? data : JSON.stringify(data);
                if (this._successCallback) this._successCallback(payload);
              }).catch(err => { if (this._failureCallback) this._failureCallback(err); });
          },

          verifySystemLogin: function(username, pass) {
            console.log(`[MOCK] Weryfikacja logowania dla: ${username}`);
            setTimeout(() => {
              if (username === 'admin' && pass === 'admin') {
                if (this._successCallback) this._successCallback({ success: true, username: 'Admin', panels: '*' });
              } else if (username === 'newuser') {
                if (this._successCallback) this._successCallback({ success: true, requirePasswordSetup: true, username: 'newuser' });
              } else {
                if (this._successCallback) this._successCallback({ success: false, message: 'Nieprawidłowe dane (Spróbuj: admin/admin)' });
              }
            }, 600);
          },

          setNewUserPassword: function(username, pass) {
            console.log(`[MOCK] Zapisywanie nowego hasła dla: ${username}`);
            setTimeout(() => {
              if (this._successCallback) this._successCallback({ success: true, username: username, panels: '*' });
            }, 600);
          },

          saveClientToBase: function(payload) { 
            console.log("[MOCK] Zapis Klienta:", payload); 
            if(this._successCallback) {
              this._successCallback({ success: true, id: payload.id || 'mock_id_' + Date.now() }); 
            }
          },
          deleteClientFromBase: function(id) {
            console.log("[MOCK] Usunięcie Klienta:", id);
            if(this._successCallback) this._successCallback({ success: true });
          },
          saveCalendarEvent: function(payload) { console.log("[MOCK] Zapis zdarzenia Harmonogramu:", payload); },
          deleteCalendarEvent: function(id) { console.log("[MOCK] Usunięcie zdarzenia:", id); },
          saveUserSettings: function(user, settings) { console.log("[MOCK] Zapis ustawień:", user, settings); },
          saveAxonTicketToBase: function(payload) { console.log("[MOCK] Zapis Axon Ticket:", payload); if(this._successCallback) this._successCallback({success: true}); },
          createEkoenTicketInBase: function(payload) { console.log("[MOCK] Zapis Ekoen Ticket:", payload); if(this._successCallback) this._successCallback({success: true}); },
          saveSettlementToSysBillings: function(payload) { console.log("[MOCK] Zapis Rozliczenia:", payload); if(this._successCallback) this._successCallback({success: true}); },
          saveStationToBase: function(payload) { console.log("[MOCK] Zapis Stacji:", payload); if(this._successCallback) this._successCallback({success: true}); },
          deleteStationsBulk: function(ids) { console.log("[MOCK] Usuwanie Stacji (Bulk):", ids); if(this._successCallback) this._successCallback({success: true}); },
          updateStationsBulk: function(updates) { console.log("[MOCK] Aktualizacja Stacji (bulk):", updates); if(this._successCallback) this._successCallback({success: true}); },
          saveTechnicianToBase: function(payload) { console.log("[MOCK] Zapis Technika:", payload); if(this._successCallback) this._successCallback({success: true}); },
          deleteTechnicianFromBase: function(id) { console.log("[MOCK] Usunięcie Technika:", id); if(this._successCallback) this._successCallback({success: true}); },
          deleteTechniciansBulk: function(ids) { console.log("[MOCK] Usunięcie Techników (Bulk):", ids); if(this._successCallback) this._successCallback({success: true}); },
          saveStorageOperation: function(payload) { console.log("[MOCK] Operacja Magazynowa:", payload); if(this._successCallback) this._successCallback({success: true}); },
          savePartToBase: function(payload) { console.log("[MOCK] Nowa Część:", payload); if(this._successCallback) this._successCallback({success: true}); },
          saveCustomServiceToPricelist: function(payload) { console.log("[MOCK] Nowa Usługa Cennika:", payload); if(this._successCallback) this._successCallback({success: true}); },
          updateGeneratedIdInBase: function(pubId, newId) { console.log(`[MOCK] Przypisanie nowego UUID ${newId} do stacji ${pubId}`); }
        }
      }
    };
  }
};

initGasMock();