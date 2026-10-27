import { defineStore } from 'pinia'
import { ref, shallowRef, computed } from 'vue'

const ICON_USERS = "PHN2ZyBjbGFzcz0idy02IGgtNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTE2IDIxdi0yYTQgNCAwIDAgMC00LTRINmE0IDQgMCAwIDAtNCA0djIiLz48Y2lyY2xlIGN4PSI5IiBjeT0iNyIgcj0iNCIvPjxwYXRoIGQ9Ik0yMiAyMXYtMmE0IDQgMCAwIDAtMy0zLjg3Ii8+PHBhdGggZD0iTTE2IDMuMTNhNCA0IDAgMCAxIDAgNy43NSIvPjwvc3ZnPg=="
const ICON_ALERT = "PHN2ZyBjbGFzcz0idy02IGgtNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0ibTIxLjczIDE4LTgtMTRhMiAyIDAgMCAwLTMuNDggMGwtOCAxNEEyIDIgMCAwIDAgNCAyMWgxNmEyIDIgMCAwIDAgMS43My0zWiIvPjxsaW5lIHgxPSIxMiIgeTE9IjkiIHgyPSIxMiIgeTI9IjEzIi8+PGxpbmUgeDE9IjEyIiB5MT0iMTciIHgyPSIxMi4wMSIgeTI9IjE3Ii8+PC9zdmc+"
const ICON_CONTRACT = "PHN2ZyBjbGFzcz0idy02IGgtNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTE0LjUgMkg2YTIgMiAwIDAgMC0yIDJ2MTZhMiAyIDAgMCAwIDIgMmgxMmEyIDIgMCAwIDAgMi0yVjcuNUwxNC41IDJ6Ii8+PHBvbHlsaW5lIHBvaW50cz0iMTQgMiAxNCA4IDIwIDgiLz48L3N2Zz4="

export const useTechniciansStore = defineStore('technicians', () => {
  const technicians = shallowRef([])
  const stations = shallowRef([])
  const isLoading = ref(false)

  const activeTabId = ref('ALL')
  const kpiTabs = ref([])
  const searchQueriesMain = ref([{ id: 'tq_m_' + Date.now(), logic: 'AND', text: '' }])
  const expandedIds = ref([])

  const getDefaultTabs = () => {
    return [
      { id: 'ALL', name: 'WSZYSCY', filter: 'ALL', color: '#58b347', icon: ICON_USERS, customQueries: [] },
      { id: 'SEP_ALERT', name: 'WYGASŁE SEP', filter: 'SYSTEM', color: '#ef4444', icon: ICON_ALERT, customQueries: [] },
      { id: 'CONTRACT_ALERT', name: 'WYGASAJĄCE UMOWY', filter: 'SYSTEM', color: '#f97316', icon: ICON_CONTRACT, customQueries: [] }
    ]
  }

  const loadTabsConfiguration = () => {
    try {
      const localStore = JSON.parse(localStorage.getItem('EKOEN_TECHNICIANS_UI')) || {}
      const savedTabs = localStore.tabs || []
      
      if (savedTabs.length > 0) {
        const defaults = getDefaultTabs()
        const updatedTabs = savedTabs.map(tab => {
          const defaultEquivalent = defaults.find(d => d.id === tab.id)
          if (defaultEquivalent && (defaultEquivalent.filter === 'ALL' || defaultEquivalent.filter === 'SYSTEM')) {
            tab.filter = defaultEquivalent.filter
          }
          return tab
        })
        
        defaults.forEach(dTab => {
          if (!updatedTabs.find(sTab => sTab.id === dTab.id)) updatedTabs.push(dTab)
        })
        kpiTabs.value = updatedTabs
      } else {
        kpiTabs.value = getDefaultTabs()
      }
    } catch (e) {
      kpiTabs.value = getDefaultTabs()
    }
  }

  const saveTabsConfiguration = () => {
    try {
      const localStore = JSON.parse(localStorage.getItem('EKOEN_TECHNICIANS_UI')) || {}
      localStore.tabs = kpiTabs.value
      localStorage.setItem('EKOEN_TECHNICIANS_UI', JSON.stringify(localStore))
    } catch (e) {}
  }

  const fetchTechniciansData = () => {
    isLoading.value = true
    loadTabsConfiguration()

    if (typeof google === 'undefined') {
      setTimeout(() => { isLoading.value = false }, 500)
      return
    }

    google.script.run
      .withSuccessHandler((response) => {
        try {
          const res = typeof response === 'string' ? JSON.parse(response) : response
          technicians.value = Array.isArray(res) ? res : (res && res.data ? res.data : [])
        } catch (e) {
          console.error("Błąd parsowania danych kadr:", e)
        }
        
        google.script.run
          .withSuccessHandler((mapRes) => {
            try {
              const parsedMap = typeof mapRes === 'string' ? JSON.parse(mapRes) : mapRes
              stations.value = parsedMap.stations || []
            } catch(e) {}
            isLoading.value = false
          })
          .getMapData()
      })
      .withFailureHandler(() => {
        alert("Błąd pobierania danych kadr!")
        isLoading.value = false
      })
      .getTechniciansFromBase()
  }

  // NOWA FUNKCJA ZAPISU (OPTYMISTYCZNE UI)
  const saveTechnician = (payload, onSuccess) => {
    const isEdit = !!payload.id
    const tempId = payload.id || ('tech_' + Date.now())
    const techRecord = { ...payload, id: tempId }

    if (isEdit) {
      const idx = technicians.value.findIndex(t => String(t.id) === String(payload.id))
      if (idx !== -1) {
        const updated = [...technicians.value]
        updated[idx] = { ...updated[idx], ...techRecord }
        technicians.value = updated
      }
    } else {
      technicians.value = [techRecord, ...technicians.value]
    }

    const plainPayload = JSON.parse(JSON.stringify(payload))
    if (typeof google !== 'undefined' && google.script) {
      google.script.run
        .withSuccessHandler((res) => {
          if (!isEdit && res && res.id) {
            const idx = technicians.value.findIndex(t => t.id === tempId)
            if (idx !== -1) {
              const updated = [...technicians.value]
              updated[idx].id = res.id
              technicians.value = updated
            }
          }
          if(onSuccess) onSuccess()
        })
        .withFailureHandler((err) => {
          alert("Błąd zapisu pracownika w Google Sheets: " + err.message)
        })
        .saveTechnicianToBase(plainPayload)
    } else {
      console.log("[MOCK] Zapisano pracownika:", techRecord)
      if(onSuccess) onSuccess()
    }
  }

  const deleteTechnician = (id) => {
    const backup = [...technicians.value]
    technicians.value = technicians.value.filter(t => t.id !== id)

    if (typeof google !== 'undefined' && google.script) {
      google.script.run
        .withFailureHandler((err) => {
          technicians.value = backup
          alert("Błąd usuwania w Google Sheets: " + err.message)
        })
        .deleteTechnicianFromBase(id)
    }
  }

  const massDeleteTechnicians = (idsArray) => {
    const backup = [...technicians.value]
    technicians.value = technicians.value.filter(t => !idsArray.includes(t.id))

    if (typeof google !== 'undefined' && google.script) {
      google.script.run
        .withFailureHandler((err) => {
          technicians.value = backup
          alert("Błąd usuwania masowego w Google Sheets: " + err.message)
        })
        .deleteTechniciansBulk(idsArray)
    }
  }

  return {
    technicians, stations, isLoading,
    activeTabId, kpiTabs, searchQueriesMain, expandedIds,
    loadTabsConfiguration, saveTabsConfiguration, fetchTechniciansData, 
    saveTechnician, deleteTechnician, massDeleteTechnicians
  }
})