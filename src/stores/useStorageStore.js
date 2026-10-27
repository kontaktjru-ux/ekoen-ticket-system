import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'

const ICON_BOX = "PHN2ZyBjbGFzcz0idy02IGgtNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTIxIDhhMiAyIDAgMCAwLTEtMS43M2wtNy00YTIgMiAwIDAgMC0yIDBsLTcgNEEyIDIgMCAwIDAgMyA4djhhMiAyIDAgMCAwIDEgMS43M2w3IDRhMiAyIDAgMCAwIDIgMGw3LTRBMiAyIDAgMCAwIDIxIDE2WiIvPjxwYXRoIGQ9Im0zLjMgNyA4LjcgNSA4LjctNSIvPjxwYXRoIGQ9Ik0xMiAyMlYxMiIvPjwvc3ZnPg=="
const ICON_ALERT = "PHN2ZyBjbGFzcz0idy02IGgtNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0ibTIxLjczIDE4LTgtMTRhMiAyIDAgMCAwLTMuNDggMGwtOCAxNEEyIDIgMCAwIDAgNCAyMWgxNmEyIDIgMCAwIDAgMS43My0zWiIvPjxsaW5lIHgxPSIxMiIgeTE9IjkiIHgyPSIxMiIgeTI9IjEzIi8+PGxpbmUgeDE9IjEyIiB5MT0iMTciIHgyPSIxMi4wMSIgeTI9IjE3Ii8+PC9zdmc+"
const ICON_TRUCK = "PHN2ZyBjbGFzcz0idy02IGgtNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTUgMThIM2MtLjYgMC0xLS40LTEtMVY3YzAtLjYuNC0xIDEtMWgxMGMuNiAwIDEgLjQgMSAxdjExIi8+PHBhdGggZD0iTTE0IDloNGw0IDR2NWgtMyIvPjxjaXJjbGUgY3g9IjcuNSIgY3k9IjE4IiByPSIyLjUiLz48Y2lyY2xlIGN4PSIxNy41IiBjeT0iMTgiIHI9IjIuNSIvPjwvc3ZnPg=="
const ICON_LOGS = "PHN2ZyBjbGFzcz0idy02IGgtNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTMgMTJhOSA5IDAgMSAwIDktOSA5Ljc1IDkuNzUgMCAwIDAtNi43NCAyLjc0TDMgOCIvPjxwYXRoIGQ9Ik0zIDN2NWg1Ii8+PHBhdGggZD0iTTEyIDd2NWw0IDIiLz48L3N2Zz4="

export const useStorageStore = defineStore('storage', () => {
  const parts = shallowRef([])
  const techs = shallowRef([])
  const logs = shallowRef([])
  const isLoading = ref(false)

  const activeModule = ref('zg_central') // 'zg_central', 'mobile', 'logs'
  const activeTabId = ref('ALL')
  const kpiTabs = ref([])
  const searchQueriesMain = ref([{ id: 'q_m_' + Date.now(), logic: 'AND', text: '' }])
  const lowStockThreshold = ref(3)

  const expandedCategoriesZG = ref([])
  const expandedCategoriesMobile = ref([])
  
  const hoveredPartId = ref(null)
  const lockedPartId = ref(null)

  const getDefaultTabs = (mode) => {
    let baseIcon = mode === 'mobile' ? ICON_TRUCK : mode === 'logs' ? ICON_LOGS : ICON_BOX
    let baseTitle = mode === 'zg_central' ? 'Katalog Magazynu' : mode === 'mobile' ? 'Sprzęt w terenie' : 'Wszystkie operacje'
    
    if (mode === 'logs') {
      return [{ id: 'ALL', name: baseTitle, filter: 'ALL', color: '#58b347', icon: baseIcon, customQueries: [] }]
    }

    return [
      { id: 'ALL', name: baseTitle, filter: 'ALL', color: '#58b347', icon: baseIcon, customQueries: [] },
      { id: 'LOW_STOCK', name: 'Niski Stan', filter: 'LOW_STOCK', color: '#ef4444', icon: ICON_ALERT, customQueries: [] }
    ]
  }

  const loadTabsConfiguration = () => {
    try {
      const localStore = JSON.parse(localStorage.getItem('EKOEN_STORAGE_UI')) || {}
      const savedTabs = localStore[`tabs_${activeModule.value}`] || []
      
      if (savedTabs.length > 0) {
        const defaults = getDefaultTabs(activeModule.value)
        const updatedTabs = savedTabs.map(tab => {
          const defaultEquivalent = defaults.find(d => d.id === tab.id)
          if (defaultEquivalent && (defaultEquivalent.filter === 'ALL' || defaultEquivalent.filter === 'LOW_STOCK')) {
            tab.filter = defaultEquivalent.filter
          }
          return tab
        })
        
        defaults.forEach(dTab => {
          if (!updatedTabs.find(sTab => sTab.id === dTab.id)) updatedTabs.push(dTab)
        })
        kpiTabs.value = updatedTabs
      } else {
        kpiTabs.value = getDefaultTabs(activeModule.value)
      }

      if (localStore.lowStockThreshold) {
        lowStockThreshold.value = parseInt(localStore.lowStockThreshold) || 3
      }
    } catch (e) {
      kpiTabs.value = getDefaultTabs(activeModule.value)
    }
  }

  const saveTabsConfiguration = () => {
    try {
      const localStore = JSON.parse(localStorage.getItem('EKOEN_STORAGE_UI')) || {}
      localStore[`tabs_${activeModule.value}`] = kpiTabs.value
      localStore.lowStockThreshold = lowStockThreshold.value
      localStorage.setItem('EKOEN_STORAGE_UI', JSON.stringify(localStore))
    } catch (e) {}
  }

  const fetchStorageData = () => {
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
          if (res && res.success) {
            const data = res.data || res
            parts.value = data.parts || []
            techs.value = data.techs || []
            logs.value = data.logs || []
            
            if (expandedCategoriesZG.value.length === 0) expandedCategoriesZG.value = [...new Set(parts.value.map(p => p.category))].slice(0, 4)
            if (expandedCategoriesMobile.value.length === 0) expandedCategoriesMobile.value = ['WIDOK OGÓLNY (WSZYSTKIE CZĘŚCI)'].concat(techs.value.map(t => t.id))
          }
        } catch (e) {
          console.error("Błąd parsowania magazynu:", e)
        }
        isLoading.value = false
      })
      .withFailureHandler(() => {
        alert("Błąd pobierania danych magazynu!")
        isLoading.value = false
      })
      .getStorageData()
  }

  const saveOperationToCloud = (payload, onSuccess, onFailure) => {
    const plainPayload = JSON.parse(JSON.stringify(payload))
    
    if (typeof google !== 'undefined' && google.script) {
      google.script.run
        .withSuccessHandler(() => {
          fetchStorageData()
          if (onSuccess) onSuccess()
        })
        .withFailureHandler((err) => {
          if (onFailure) onFailure(err)
        })
        .saveStorageOperation(plainPayload)
    } else {
      console.log("[MOCK] Zlecono operację magazynową:", plainPayload)
      if (onSuccess) onSuccess()
    }
  }

  return {
    parts, techs, logs, isLoading,
    activeModule, activeTabId, kpiTabs, searchQueriesMain, lowStockThreshold,
    expandedCategoriesZG, expandedCategoriesMobile,
    hoveredPartId, lockedPartId,
    loadTabsConfiguration, saveTabsConfiguration, fetchStorageData, saveOperationToCloud
  }
})