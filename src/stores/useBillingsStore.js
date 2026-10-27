import { defineStore } from 'pinia'

export const useBillingsStore = defineStore('billings', {
  state: () => ({
    billings: [],
    techList: [],
    techMap: {},
    pricelists: {},
    isLoading: false,
    
    // Zmienne bilingowe
    nbpRate: 4.30, 
    groupCurrency: {}, // Pamięta wybór waluty (EUR/PLN) dla każdego akordeonu
    
    // UI i Filtry
    activeTabId: 'ALL',
    kpiTabs: [],
    searchQueriesMain: [{ id: 'bq_m_' + Date.now(), logic: 'AND', text: '' }]
  }),

  actions: {
    getDefaultTabs() {
        // Poprawny ciąg Base64 dla ikony zlecenia/pojedynczej zakładki
        const ICON_TICKETS = "PHN2ZyBjbGFzcz0idy02IGgtNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHJlY3QgeD0iMyIgeT0iNCIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIgcnk9IjIiLz48bGluZSB4MT0iMTYiIHkxPSIyIiB4Mj0iMTYiIHkyPSI2Ii8+PGxpbmUgeDE9IjgiIHkxPSIyIiB4Mj0iOCIgeTE9IjYiLz48bGluZSB4MT0iMyIgeTE9IjEwIiB4Mj0iMjEiIHkyPSIxMCIvPjwvc3ZnPg=="

        // Poprawny ciąg Base64 dla ikony Grupy Techników
        const ICON_GROUP = "PHN2ZyBjbGFzcz0idy02IGgtNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTE2IDIxdi0yYTQgNCAwIDAgMC00LTRINmE0IDQgMCAwIDAtNCA0djIiLz48Y2lyY2xlIGN4PSI5IiBjeT0iNyIgcj0iNCIvPjxwYXRoIGQ9Ik0yMiAyMXYtMmE0IDQgMCAwIDAtMy0zLjg3Ii8+PHBhdGggZD0iTTE2IDMuMTNhNCA0IDAgMCAxIDAgNy43NSIvPjwvc3ZnPg=="

         // Poprawny ciąg Base64 dla ikony Pojedynczego Technika (Ludzika)
        const ICON_USER = "PHN2ZyBjbGFzcz0idy02IGgtNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTE5IDIxdi0yYTQgNCAwIDAgMC00LTRIOWE0IDQgMCAwIDAtNCA0djIiLz48Y2lyY2xlIGN4PSIxMiIgY3k9IjciIHI9IjQiLz48L3N2Zz4="
        const ICON_PARTS = "PHN2ZyBjbGFzcz0idy02IGgtNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTIxIDE2VjhhMiAyIDAgMCAwLTEtMS43M2wtNy00YTIgMiAwIDAgMC0yIDBsLTcgNEEyIDIgMCAwIDAgMyA4djhhMiAyIDAgMCAwIDEgMS43M2w3IDRhMiAyIDAgMCAwIDIgMGw3LTRBMiAyIDAgMCAwIDIxIDE2eiIvPjxwb2x5bGluZSBwb2ludHM9IjMuMjcgNi45NiAxMiAxMi4wMSAyMC43MyA2Ljk2Ii8+PGxpbmUgeDE9IjEyIiB5MT0iMjIuMDgiIHgyPSIxMiIgeTI9IjEyIi8+PC9zdmc+"

            
      return [
        { id: 'ALL', name: 'DO ROZLICZENIA', filter: 'ALL', color: '#58b347', icon: ICON_TICKETS, customQueries: [] },
        { 
          id: 'SETTLED_ONLY', 
          name: 'ROZLICZONE', 
          filter: 'SYSTEM', 
          color: '#3b82f6', 
          icon: ICON_TICKETS, 
          customQueries: [
            { id: 'tq_set_1', logic: 'AND', text: 'STATUS: SETTLED|CORRECTED|Rozliczone|Poprawione' },
            { id: 'tq_set_2', logic: 'NOT', text: 'STATUS: PRE_SETTLED|Wstępn' }
          ]
        }
      ]
    },

    loadTabsConfiguration() {
      try {
        const localStore = JSON.parse(localStorage.getItem('EKOEN_BILLINGS_UI')) || {}
        let savedTabs = localStore.billings_tabs || []
        
        if (savedTabs.length > 0) {
          const defaults = this.getDefaultTabs()
          
          // Ochrona filtrów systemowych
          savedTabs = savedTabs.map(tab => {
            const defaultEquivalent = defaults.find(d => d.id === tab.id)
            if (defaultEquivalent && (defaultEquivalent.filter === 'SYSTEM' || defaultEquivalent.filter === 'ALL')) {
              tab.filter = defaultEquivalent.filter
              tab.customQueries = defaultEquivalent.customQueries
            }
            return tab
          })
          
          // Zapewnienie obecności domyślnych
          defaults.forEach(dTab => {
            if (!savedTabs.find(sTab => sTab.id === dTab.id)) {
              savedTabs.push(dTab)
            }
          })
          
          this.kpiTabs = savedTabs
        } else {
          this.kpiTabs = this.getDefaultTabs()
        }
      } catch (e) {
        this.kpiTabs = this.getDefaultTabs()
      }
    },

    saveTabsConfiguration() {
      try {
        const localStore = JSON.parse(localStorage.getItem('EKOEN_BILLINGS_UI')) || {}
        localStore.billings_tabs = this.kpiTabs
        localStorage.setItem('EKOEN_BILLINGS_UI', JSON.stringify(localStore))
      } catch (e) {
        console.error("Nie udało się zapisać konfiguracji zakładek bilingów.", e)
      }
    },

    setupTechTabs() {
      if (!this.techList || this.techList.length === 0) return
      let validTechIds = this.techList.map(tech => 'TECH_' + tech.toUpperCase().replace(/[^A-Z0-9]/g, '_'))
      
      // Czyszczenie usuniętych techników
      this.kpiTabs = this.kpiTabs.filter(t => !t.id.startsWith('TECH_') || validTechIds.includes(t.id))
      
      // Zapewnienie istnienia grupy TECHNICY (Ikona wielu użytkowników)
      if (!this.kpiTabs.find(t => t.id === 'GROUP_TECHS')) {
        const ICON_GROUP = "PHN2ZyBjbGFzcz0idy02IGgtNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTE2IDIxdi0yYTQgNCAwIDAgMC00LTRINmE0IDQgMCAwIDAtNCA0djIiLz48Y2lyY2xlIGN4PSI5IiBjeT0iNyIgcj0iNCIvPjxwYXRoIGQ9Ik0yMiAyMXYtMmE0IDQgMCAwIDAtMy0zLjg3Ii8+PHBhdGggZD0iTTE2IDMuMTNhNCA0IDAgMCAxIDAgNy43NSIvPjwvc3ZnPg=="
        this.kpiTabs.splice(1, 0, { id: 'GROUP_TECHS', name: 'TECHNICY', filter: 'GROUP', color: '#0ea5e9', icon: ICON_GROUP, customQueries: [] })
      }

      // Ikona pojedynczego ludzika (zakodowana w Base64)
      const ICON_USER = "PHN2ZyBjbGFzcz0idy02IGgtNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTE5IDIxdi0yYTQgNCAwIDAgMC00LTRIOWE0IDQgMCAwIDAtNCA0djIiLz48Y2lyY2xlIGN4PSIxMiIgY3k9IjciIHI9IjQiLz48L3N2Zz4="

      this.techList.forEach(tech => {
        if (!tech) return
        let safeId = 'TECH_' + tech.toUpperCase().replace(/[^A-Z0-9]/g, '_')
        let techColor = this.techMap[tech] || '#0ea5e9'
        
        let exists = this.kpiTabs.find(t => t.id === safeId)
        if (!exists) {
          this.kpiTabs.push({
            id: safeId, 
            name: tech.toUpperCase(), 
            filter: 'SYSTEM', 
            color: techColor, 
            icon: ICON_USER, // <--- Tutaj przypisujemy ikonę ludzika!
            customQueries: [{ id: 'tq_tech_' + Date.now(), logic: 'AND', text: 'TECHNIK:' + tech }],
            isHidden: true 
          })
        } else {
          exists.color = techColor
          exists.icon = ICON_USER // Aktualizujemy ikonę dla starych wpisów w LocalStorage
        }
      })
      this.saveTabsConfiguration()
    },

    async fetchBillingsData() {
      this.isLoading = true
      this.billings = []
      this.loadTabsConfiguration()

      // 1. Asynchroniczne pobranie kursu NBP (działa w tle)
      try {
        const nbpRes = await fetch('https://api.nbp.pl/api/exchangerates/rates/a/eur/?format=json')
        const nbpData = await nbpRes.json()
        if (nbpData && nbpData.rates && nbpData.rates.length > 0) {
          this.nbpRate = nbpData.rates[0].mid
        }
      } catch (e) {
        console.warn('Nie udało się pobrać aktualnego kursu NBP. Używam domyślnego 4.30 PLN.', e)
      }

      // 2. Pobranie danych bilingów z Google Apps Script
      if (typeof google === 'undefined') {
        setTimeout(() => { this.isLoading = false }, 500)
        return
      }

      google.script.run
        .withSuccessHandler((resStr) => {
          try {
            let res = typeof resStr === 'string' ? JSON.parse(resStr) : resStr
            if (res && res.success) {
              this.billings = res.tickets || []
              if (res.pricelists) this.pricelists = res.pricelists
              
              if (res.techs && res.techs.length > 0) {
                this.techList = res.techs.map(t => typeof t === 'string' ? t : t.name)
                this.techMap = {}
                res.techs.forEach(t => { 
                  if (typeof t === 'object') this.techMap[t.name] = t.color || t.zone_color || '#0ea5e9' 
                })
              }
              
              this.setupTechTabs()
            }
          } catch (e) {
            console.error("Błąd parsowania bilingów:", e)
          }
          this.isLoading = false
        })
        .withFailureHandler((err) => {
          alert("Błąd pobierania danych bilingowych!")
          this.isLoading = false
        })
        .getBillingsDataForFrontend()
    },

    deleteBilling(id) {
      // Usuwa biling (ukrywa go na widoku / cofa status)
      this.billings = this.billings.filter(b => b.id !== id)
      
      // Jeśli posiadasz funkcję w GAS do usuwania z bilingów, możesz ją tu wezwać:
      // if (typeof google !== 'undefined') google.script.run.deleteBilling(id)
    }
  }
})