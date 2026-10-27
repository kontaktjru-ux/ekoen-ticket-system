import { defineStore } from 'pinia'
import { shallowRef, ref } from 'vue'

const ICONS = {
  users: '<svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
  vip: '<svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>',
  noContact: '<svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="18" y1="8" x2="23" y2="13"></line><line x1="23" y1="8" x2="18" y2="13"></line></svg>',
  hasStation: '<svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>',
  noStation: '<svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64A9 9 0 0 1 20.77 15"/><path d="M6.16 6.16a9 9 0 1 0 12.68 12.68"/><path d="M12 2v4"/><path d="M2 2l20 20"/></svg>',
  activeTickets: '<svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
}

const defaultTabs = [
  { id: 'ALL', name: 'WSZYSCY', filter: 'ALL', color: '#58b347', icon: ICONS.users, customQueries: [] },
  { id: 'ACTIVE_TICKETS', name: 'AKTYWNE ZGŁOSZENIA', filter: 'ACTIVE_TICKETS', color: '#ef4444', icon: ICONS.activeTickets, customQueries: [] },
  { id: 'VIP', name: 'KLIENCI VIP (SLA < 48H)', filter: 'VIP', color: '#8b5cf6', icon: ICONS.vip, customQueries: [] },
  { id: 'MISSING_CONTACT', name: 'BRAK KONTAKTU', filter: 'MISSING_CONTACT', color: '#f59e0b', icon: ICONS.noContact, customQueries: [] },
  { id: 'HAS_STATIONS', name: 'POSIADAJĄ STACJE', filter: 'HAS_STATIONS', color: '#3b82f6', icon: ICONS.hasStation, customQueries: [] },
  { id: 'NO_STATIONS', name: 'BRAK STACJI', filter: 'NO_STATIONS', color: '#64748b', icon: ICONS.noStation, customQueries: [] }
]

export const useClientsStore = defineStore('clients', () => {
  const clients = shallowRef([])
  const stations = shallowRef([])
  const isLoading = ref(false)
  const error = ref(null)

  const activeTabId = ref('ALL')
  const kpiTabs = ref([...defaultTabs])
  const expandedIds = ref([])
  const searchQueriesMain = ref([{ id: 'm_' + Date.now(), logic: 'AND', text: '' }])

  // --- NOWE FUNKCJE DO ZAPISU I ODCZYTU ZAKŁADEK ---
  const saveTabsConfiguration = () => {
    // 1. Zapis lokalny (natychmiastowe odtworzenie po odświeżeniu F5)
    const configToSave = JSON.parse(JSON.stringify(kpiTabs.value))
    localStorage.setItem('ekoen_clients_tabs', JSON.stringify(configToSave))

    // 2. Wysłanie do bazy (aby ustawienia wędrowały za użytkownikiem na inne urządzenia)
    if (typeof google !== 'undefined' && google.script) {
      google.script.run
        .withFailureHandler((err) => console.error("Błąd zapisu zakładek w chmurze:", err))
        .saveUserSettings('CURRENT_USER', { clientsTabs: configToSave })
    }
  }

  const loadTabsConfiguration = () => {
    // Pobierz z pamięci podręcznej przeglądarki
    const saved = localStorage.getItem('ekoen_clients_tabs')
    if (saved) {
      try {
        kpiTabs.value = JSON.parse(saved)
      } catch (e) {
        console.error("Błąd wczytywania zakładek", e)
      }
    }
  }

  // Od razu przy uruchomieniu aplikacji ładujemy układ użytkownika!
  loadTabsConfiguration()
  // ------------------------------------------------

  const fetchClientsData = () => {
    if (isLoading.value) return
    isLoading.value = true
    error.value = null

    // Niezależnie od tego czy jesteśmy na produkcji, czy lokalnie (dzięki gasMock.js) 
    // to wywołanie zadziała tak samo!
    if (typeof google !== 'undefined' && google.script) {
      google.script.run
        .withSuccessHandler((response) => {
          try {
            const res = typeof response === 'string' ? JSON.parse(response) : response
            if (res && res.success) {
              clients.value = res.data?.clients || res.clients || []
              stations.value = res.data?.stations || res.stations || []
            } else {
              error.value = "Odpowiedź serwera nie zawiera danych."
            }
          } catch(e) {
            error.value = "Błąd parsowania danych."
            console.error(e)
          } finally {
            isLoading.value = false
          }
        })
        .withFailureHandler((err) => {
          error.value = err.message || "Błąd sieci."
          isLoading.value = false
        })
        .getClientsData()
    }
  }

  const saveClientToBase = (payload) => {
    const isEdit = !!payload.id
    const tempId = payload.id || ('client_' + Date.now())
    const clientRecord = { ...payload, id: tempId }

    // 1. OPTIMISTIC UPDATE: Aktualizacja UI w 0 ms
    if (isEdit) {
      const idx = clients.value.findIndex(c => String(c.id) === String(payload.id))
      if (idx !== -1) {
        const updated = [...clients.value]
        updated[idx] = { ...updated[idx], ...clientRecord }
        clients.value = updated
      }
    } else {
      clients.value = [clientRecord, ...clients.value]
    }

    // 2. SYNCHRONIZACJA Z GOOGLE SHEETS W TLE
    if (typeof google !== 'undefined' && google.script) {
      google.script.run
        .withSuccessHandler((response) => {
          // Jeśli backend zwrócił przypisany ID nowego wiersza, zaktualizuj ID klienta
          if (!isEdit && response && response.id) {
            const idx = clients.value.findIndex(c => c.id === tempId)
            if (idx !== -1) {
              const updated = [...clients.value]
              updated[idx].id = response.id
              clients.value = updated
            }
          }
        })
        .withFailureHandler((err) => {
          console.error("Błąd zapisu klienta w arkuszu:", err)
          alert("Błąd zapisu w Google Sheets: " + err.message)
        })
        .saveClientToBase(payload)
    } else {
      console.log("[MOCK] Zapisano klienta w pamięci lokalnej:", clientRecord)
    }
  }

  const deleteClientFromBase = (id) => {
    // 1. OPTIMISTIC UI: Od razu usuwamy z widoku lokalnego
    clients.value = clients.value.filter(c => String(c.id) !== String(id))

    // 2. Wysłanie komendy usunięcia w tle do Google Sheets
    if (typeof google !== 'undefined' && google.script) {
      google.script.run
        .withFailureHandler((err) => {
          console.error("Błąd usuwania klienta:", err)
          alert("Błąd usuwania w Google Sheets: " + err.message)
        })
        .deleteClientFromBase(id)
    } else {
      console.log("[MOCK] Klient usunięty lokalnie. ID:", id)
    }
  }

  return {
    clients, stations, isLoading, error,
    activeTabId, kpiTabs, expandedIds, searchQueriesMain,
    fetchClientsData, saveClientToBase, deleteClientFromBase,
    saveTabsConfiguration
  }
})