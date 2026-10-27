import { defineStore } from 'pinia'

// Poprawne, bezpieczne ikony SVG w Base64
const ICON_TICKETS = "PHN2ZyBjbGFzcz0idy02IGgtNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHJlY3QgeD0iMyIgeT0iNCIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIgcnk9IjIiLz48bGluZSB4MT0iMTYiIHkxPSIyIiB4Mj0iMTYiIHkyPSI2Ii8+PGxpbmUgeDE9IjgiIHkxPSIyIiB4Mj0iOCIgeTE9IjYiLz48bGluZSB4MT0iMyIgeTE9IjEwIiB4Mj0iMjEiIHkyPSIxMCIvPjwvc3ZnPg=="
const ICON_DUPLICATES = "PHN2ZyBjbGFzcz0idy02IGgtNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHJlY3QgeD0iOSIgeT0iOSIgd2lkdGg9IjEzIiBoZWlnaHQ9IjEzIiByeD0iMiIgcnk9IjIiLz48cGF0aCBkPSJNNSAxNUg0YTIgMiAwIDAgMS0yLTJWNGEyIDIgMCAwIDEgMi0yaDlhMiAyIDAgMCAxIDIgMnYxIi8+PC9zdmc+"
const ICON_CLOCK = "PHN2ZyBjbGFzcz0idy02IGgtNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiLz48cG9seWxpbmUgcG9pbnRzPSIxMiA2IDEyIDEyIDE2IDE0Ii8+PC9zdmc+"
const ICON_PARTS = "PHN2ZyBjbGFzcz0idy02IGgtNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTIxIDE2VjhhMiAyIDAgMCAwLTEtMS43M2wtNy00YTIgMiAwIDAgMC0yIDBsLTcgNEEyIDIgMCAwIDAgMyA4djhhMiAyIDAgMCAwIDEgMS43M2w3IDRhMiAyIDAgMCAwIDIgMGw3LTRBMiAyIDAgMCAwIDIxIDE2eiIvPjxwb2x5bGluZSBwb2ludHM9IjMuMjcgNi45NiAxMiAxMi4wMSAyMC43MyA2Ljk2Ii8+PGxpbmUgeDE9IjEyIiB5MT0iMjIuMDgiIHgyPSIxMiIgeTI9IjEyIi8+PC9zdmc+"

export const useTicketsStore = defineStore('tickets', {
  state: () => ({
    tickets: [],
    stations: [],
    techList: [],
    partsCatalog: [],
    isLoading: false,

    activeModule: 'axon',
    activeTabId: 'ALL',
    kpiTabs: [],
    searchQueriesMain: [{ id: 'tq_m_' + Date.now(), logic: 'AND', text: '' }]
  }),

  actions: {
    getDefaultTabs() {
      const hasFullAccess = window.USER_ROLES ? (window.USER_ROLES.includes('admin') || window.USER_ROLES.includes('dispatcher') || window.USER_ROLES.includes('*')) : true 

      if (hasFullAccess) {
        return [
          { id: 'ALL', name: 'WSZYSTKIE', filter: 'ALL', color: '#58b347', icon: ICON_TICKETS, customQueries: [] },
          { id: 'DUPLICATES', name: 'ZDUBLOWANE', filter: 'SYSTEM', color: '#f59e0b', icon: ICON_DUPLICATES, customQueries: [{ id: 'q_dup', logic: 'AND', text: 'status:dubel' }] },
          { id: 'NEW', name: 'NOWE ZGŁOSZENIA', filter: 'SYSTEM', color: '#ec4899', icon: ICON_TICKETS, customQueries: [{ id: 'q_new', logic: 'AND', text: 'STATUS_EXACT:Nowe' }] },
          { id: 'WAIT_EXEC', name: 'DO REALIZACJI', filter: 'SYSTEM', color: '#3b82f6', icon: ICON_CLOCK, customQueries: [{ id: 'q_we', logic: 'AND', text: 'STATUS_EXACT:Oczekuje na realizację' }] },
          { id: 'WAIT_PARTS', name: 'OCZEKUJE NA CZĘŚCI', filter: 'SYSTEM', color: '#8b5cf6', icon: ICON_PARTS, customQueries: [{ id: 'q_wp', logic: 'AND', text: 'STATUS_EXACT:Oczekuje na części' }] },
          { id: 'DONE', name: 'WYKONANE', filter: 'SYSTEM', color: '#10b981', icon: ICON_TICKETS, customQueries: [{ id: 'q_done', logic: 'AND', text: 'STATUS_EXACT:Wykonano|raport for approval' }] }
        ]
      } else {
        return [
          { id: 'ALL', name: 'WSZYSTKIE', filter: 'ALL', color: '#58b347', icon: ICON_TICKETS, customQueries: [] },
          { id: 'MY_TICKETS', name: 'MOJE ZGŁOSZENIA', filter: 'SYSTEM', color: '#3b82f6', icon: ICON_TICKETS, customQueries: [{ id: 'q_me', logic: 'AND', text: 'TECH_EXACT:@ME' }] },
          { id: 'MY_NEW', name: 'MOJE - NOWE', filter: 'SYSTEM', color: '#ec4899', icon: ICON_TICKETS, customQueries: [{ id: 'tq_mynew_1', logic: 'AND', text: 'TECH_EXACT:@ME' }, { id: 'tq_mynew_2', logic: 'AND', text: 'STATUS_EXACT:Nowe' }] },
          { id: 'MY_WAIT_EXEC', name: 'MOJE - DO REALIZACJI', filter: 'SYSTEM', color: '#f59e0b', icon: ICON_CLOCK, customQueries: [{ id: 'q_me1', logic: 'AND', text: 'TECH_EXACT:@ME' }, { id: 'q_me2', logic: 'AND', text: 'STATUS_EXACT:Oczekuje na realizację' }] },
          { id: 'MY_WAIT_PARTS', name: 'MOJE - BRAK CZĘŚCI', filter: 'SYSTEM', color: '#8b5cf6', icon: ICON_PARTS, customQueries: [{ id: 'q_mwp1', logic: 'AND', text: 'TECH_EXACT:@ME' }, { id: 'q_mwp2', logic: 'AND', text: 'STATUS_EXACT:Oczekuje na części' }] },
          { id: 'MY_DONE', name: 'MOJE - WYKONANE', filter: 'SYSTEM', color: '#10b981', icon: ICON_TICKETS, customQueries: [{ id: 'q_md1', logic: 'AND', text: 'TECH_EXACT:@ME' }, { id: 'q_md2', logic: 'AND', text: 'STATUS_EXACT:Wykonano|raport for approval' }] }
        ]
      }
    },

    loadTabsConfiguration() {
      try {
        const localStore = JSON.parse(localStorage.getItem('EKOEN_TICKETS_UI')) || {}
        let savedTabs = localStore[`tabs_${this.activeModule}`] || []
        
        if (savedTabs.length > 0) {
          const defaults = this.getDefaultTabs()
          savedTabs = savedTabs.map(tab => {
            const defaultEquivalent = defaults.find(d => d.id === tab.id)
            if (defaultEquivalent && (defaultEquivalent.filter === 'SYSTEM' || defaultEquivalent.filter === 'ALL')) {
              tab.filter = defaultEquivalent.filter
              tab.customQueries = defaultEquivalent.customQueries
            }
            return tab
          })
          defaults.forEach(dTab => {
            if (!savedTabs.find(sTab => sTab.id === dTab.id)) savedTabs.push(dTab)
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
        const localStore = JSON.parse(localStorage.getItem('EKOEN_TICKETS_UI')) || {}
        localStore[`tabs_${this.activeModule}`] = this.kpiTabs
        localStorage.setItem('EKOEN_TICKETS_UI', JSON.stringify(localStore))
      } catch (e) {
        console.error("Nie udało się zapisać konfiguracji zakładek.", e)
      }
    },

    processPingPongStatuses(ticketsList) {
      if (this.activeModule !== 'axon') return ticketsList

      ticketsList.forEach(t => {
        let axStat = String(t.status || '').toUpperCase()
        let intStat = String(t.ticket_status || '').toUpperCase()

        if (axStat.includes('ZAMKNIĘT') || axStat.includes('CLOSED') || axStat.includes('ANULOWAN') || axStat.includes('CANCEL')) {
            t.status = 'Zakończone' 
        } else if (axStat.includes('FAKTUROWANIE') || axStat.includes('INVOICING')) {
            t.ticket_status = 'Rozliczone'
        } else if (axStat.includes('RAPORT ZATWIERDZONY') || axStat.includes('REPORT_APPROVED')) {
            if (intStat !== 'ROZLICZONE') t.ticket_status = 'Wstępnie rozliczone'
        } else if (axStat.includes('RAPORT DO ZATWIERDZENIA') || axStat.includes('REPORT_FOR_APPROVAL')) {
            if (intStat !== 'WSTĘPNIE ROZLICZONE' && intStat !== 'WSTEPNIE ROZLICZONE' && intStat !== 'ROZLICZONE') {
                t.ticket_status = 'Wykonano'
            }
        } else if (axStat.includes('WYKONANIE') || axStat.includes('ZAPLANOWANA') || axStat.includes('NA RAPORT') || axStat.includes('PLANNED') || axStat.includes('PENDING')) {
            if (intStat !== 'OCZEKUJE NA CZĘŚCI' && intStat !== 'WYKONANO' && !intStat.includes('ROZLICZ')) {
                t.ticket_status = 'Oczekuje na realizację'
            }
        } else if (axStat.includes('WYSŁANE') || axStat.includes('ZAAKCEPTOWANE') || axStat.includes('REQUEST_')) {
            if (!intStat || intStat === 'BRAK STATUSU' || intStat === 'NOWE') {
                t.ticket_status = 'Nowe'
            }
        }
      })
      return ticketsList
    },

    async fetchTicketsData() {
      this.isLoading = true
      // UWAGA: USUNIĘTO this.tickets = [] ABY ZAPOBIEC "MIGANIU" LISTY!
      this.loadTabsConfiguration()
      
      const requestedModule = this.activeModule

      if (typeof google === 'undefined') {
        setTimeout(() => { this.isLoading = false }, 500)
        return
      }

      const processResponse = (resStr) => {
        if (this.activeModule !== requestedModule) return

        let res = typeof resStr === 'string' ? JSON.parse(resStr) : resStr
        let parsedTickets = []

        if (Array.isArray(res)) {
          parsedTickets = res
        } else if (res && res.success && Array.isArray(res.tickets)) {
          if (res.stations) this.stations = res.stations
          if (res.techs) this.techList = res.techs
          if (res.parts) this.partsCatalog = res.parts
          parsedTickets = res.tickets
        } else if (res && Array.isArray(res.tickets)) {
          parsedTickets = res.tickets
        }

        // Dopiero teraz bezpiecznie podmieniamy całą bazę!
        this.tickets = this.processPingPongStatuses(parsedTickets.filter(Boolean))
        this.isLoading = false
      }

      const failHandler = () => {
        if (this.activeModule !== requestedModule) return
        alert(`Błąd pobierania danych dla modułu: ${this.activeModule}`)
        this.isLoading = false
      }

      if (this.activeModule === 'axon') {
        google.script.run.withSuccessHandler(processResponse).withFailureHandler(failHandler).getAxonDataForFrontend()
      } else if (this.activeModule === 'ekoen') {
        google.script.run.withSuccessHandler(processResponse).withFailureHandler(failHandler).getTicketsData()
      } else if (this.activeModule === 'historia') {
        google.script.run.withSuccessHandler((axonData) => {
          if (this.activeModule !== requestedModule) return
          let axonList = typeof axonData === 'string' ? JSON.parse(axonData) : (axonData || [])
          google.script.run.withSuccessHandler((resString) => {
             if (this.activeModule !== requestedModule) return
             let res = typeof resString === 'string' ? JSON.parse(resString) : resString
             let ekoenList = (res && res.success) ? (res.tickets || []) : (Array.isArray(res) ? res : [])
             this.tickets = [...axonList, ...ekoenList].filter(Boolean)
             this.isLoading = false
          }).withFailureHandler(failHandler).getTicketsData()
        }).withFailureHandler(failHandler).getTicketsFromSheet()
      }
    },

    saveTicketToBase(ticket) {
      if (typeof google === 'undefined') return
      if (this.activeModule === 'axon') {
        google.script.run.withFailureHandler(() => alert("Błąd zapisu do Axon")).saveAxonTicketToBase(ticket)
      } else {
        google.script.run.withFailureHandler(() => alert("Błąd zapisu do Ekoen")).createEkoenTicketInBase(ticket)
      }
    },

    deleteTicketFromBase(id) {
       this.tickets = this.tickets.filter(t => String(t.id) !== String(id))
    }
  }
})