<template>
  <div class="w-full h-full bg-[#f4f6f8] overflow-auto overflow-x-hidden client-custom-scrollbar" @scroll="handleScroll">
    <div class="w-full flex flex-col pb-16 min-h-full">
      
      <!-- 1. UNIWERSALNE KAFELKI KPI -->
      <UniversalKpi 
        title="Baza Klientów"
        subtitle="Zarządzanie kartoteką klientów i filtrami systemowymi."
        :views="[
          { label: 'Firmy', value: 'companies' },
          { label: 'Osoby Prywatne', value: 'private' }
        ]"
        :activeView="activeModule"
        :activeTabId="store.activeTabId"
        :tabs="store.kpiTabs"
        :tabCounts="tabCounts"
        @switch-view="activeModule = $event"
        @select-tab="setActiveTab"
        @edit-tab="editTab"
        @delete-tab="deleteTab"
        @open-modal="openNewTabModal"
        @reorder-tabs="handleReorderTabs"
        @save-settings="saveUserConfig"
      />

      <!-- 2. UNIWERSALNA WYSZUKIWARKA -->
      <UniversalSearch 
        :queries="store.searchQueriesMain"
        placeholder="Szukaj danych (np. Orlen, MIASTO: Wrocław)..."
        @add-row="store.searchQueriesMain.push({ id: 'm_' + Date.now(), logic: 'AND', text: '' })"
        @remove-row="(id) => store.searchQueriesMain = store.searchQueriesMain.filter(q => q.id !== id)"
      >
        <template #actions>
          <div class="bg-slate-50 border border-slate-200/80 rounded-xl px-4 text-[11px] font-black tracking-wider uppercase text-slate-500 shadow-sm flex items-center gap-2 h-[42px] mr-2">
            <svg class="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            WIDOCZNYCH: <span class="text-[#58b347] font-black text-sm ml-1">{{ filteredClients.length }} / {{ store.clients.length }}</span>
          </div>

          <button @click="openAddClientModal" class="bg-[#58b347] text-white font-extrabold px-5 py-2.5 rounded-xl text-[13px] hover:bg-[#499b3a] shadow-md shadow-[#58b347]/20 transition-all flex items-center gap-2 h-[42px]">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Nowy Klient
          </button>
        </template>
      </UniversalSearch>

      <!-- Skeleton Loader -->
      <div v-if="store.isLoading" class="px-8 pt-6 pb-8 flex-1 flex flex-col gap-3 w-full">
        <SkeletonCard v-for="n in 5" :key="n" />
      </div>

      <!-- Lista klientów -->
      <ClientsList 
        v-else
        :clients="filteredClients"
        :allStations="store.stations"
        :expandedIds="store.expandedIds"
        :currentPage="currentPage"
        :itemsPerPage="itemsPerPage"
        :searchQueries="store.searchQueriesMain"
        @toggle="toggleAccordion"
        @load-more="currentPage++"
        @open-analytics="openAnalytics"
        @edit-client="openEditClientModal"
        @delete-client="confirmDeleteClient" 
      />

    </div>

    <!-- Modale -->
    <UniversalTabModal 
      :show="showTabModal"
      :isEditing="!!editingTabId"
      :form="modalForm"
      :searchQueries="searchQueriesModal"
      @close="showTabModal = false"
      @save="saveTab"
    />

    <ClientFormModal 
      :show="showClientModal"
      :clientData="selectedClientForEdit"
      @close="showClientModal = false"
      @save="handleSaveClient"
    />

    <ConfirmModal 
      :show="confirmModal.show"
      :message="confirmModal.message"
      @cancel="confirmModal.show = false"
      @confirm="executeConfirm"
    />

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// 1. IMPORTY LOKALNYCH KOMPONENTÓW UI
import ClientsList from './ClientsList.vue'

// 2. IMPORTY UNIWERSALNYCH KOMPONENTÓW UI
import UniversalKpi from '../../common/UniversalKpi.vue'
import UniversalSearch from '../../common/UniversalSearch.vue'
import UniversalTabModal from '../../common/UniversalTabModal.vue'
import ConfirmModal from '../../common/ConfirmModal.vue'
import SkeletonCard from '../../common/SkeletonCard.vue'
import ClientFormModal from '../../modals/ClientFormModal.vue'

// 3. IMPORTY LOGIKI BIZNESOWEJ
import { useClientsStore } from '../../stores/useClientsStore'
import { useSearchFilters } from '../../composables/useSearchFilters'

// Inicjalizacja stanu i logiki
const store = useClientsStore()
const { checkClientSearch } = useSearchFilters()

// Stany widoku (UI States)
const activeModule = ref('companies')
const currentPage = ref(1)
const itemsPerPage = 50

// Stan modalu filtrów/zakładek
const showTabModal = ref(false)
const editingTabId = ref(null)
const modalForm = ref({ name: "", color: "#58b347", iconPreviewBase64: "", selectedIconName: "" })
const searchQueriesModal = ref([{ id: 'd_' + Date.now(), logic: 'AND', text: '' }])

// Stan modalu dodawania / edycji klienta
const showClientModal = ref(false)
const selectedClientForEdit = ref(null)

const confirmModal = ref({ show: false, message: "", onConfirm: null })

// ==========================================
// POMOCNIK DO WYSZUKIWANIA STACJI KLIENTA
// ==========================================
const getClientStations = (c, allStations) => {
  const cid = String(c.id || '').trim().toLowerCase()
  const cname = String(c.name || '').trim().toLowerCase()
  return allStations.filter(s => {
    const sid = String(s.client_id || s.clientId || '').trim().toLowerCase()
    return sid === cid || sid === cname
  })
}

// ==========================================
// OBLICZENIA I FILTROWANIE DANYCH
// ==========================================

const tabCounts = computed(() => {
  const counts = {}
  const clientsList = store.clients
  const stationsList = store.stations

  if (!store.kpiTabs || !Array.isArray(store.kpiTabs)) return counts

  store.kpiTabs.forEach(tab => {
    if (!tab || !tab.id) return 

    if (tab.filter === 'ALL') {
      counts[tab.id] = clientsList.length
    } else if (tab.filter === 'VIP') {
      counts[tab.id] = clientsList.filter(c => { let sla = parseInt(c.sla_hours || c.sla) || 48; return sla > 0 && sla < 48 }).length
    } else if (tab.filter === 'MISSING_CONTACT') {
      counts[tab.id] = clientsList.filter(c => !c.contact_person || !c.phone || !c.email).length
    } else if (tab.filter === 'NO_STATIONS') {
      counts[tab.id] = clientsList.filter(c => getClientStations(c, stationsList).length === 0).length
    } else if (tab.filter === 'HAS_STATIONS') {
      counts[tab.id] = clientsList.filter(c => getClientStations(c, stationsList).length > 0).length
    } else if (tab.filter === 'ACTIVE_TICKETS') {
      counts[tab.id] = clientsList.filter(c => {
        return getClientStations(c, stationsList).some(s => {
          const tStat = s.ticket_status ? String(s.ticket_status).trim().toLowerCase() : ''
          return s.active_ticket_id && !tStat.includes('zakończ') && !tStat.includes('zamknięt') && !tStat.includes('wykonano')
        })
      }).length
    } else if (tab.filter === 'CUSTOM' && tab.customQueries) {
      const validSearch = tab.customQueries.filter(q => q.text.trim() !== '')
      if (validSearch.length === 0) {
        counts[tab.id] = clientsList.length
      } else {
        counts[tab.id] = clientsList.filter(c => {
          let match = checkClientSearch(c, validSearch[0].text, stationsList)
          if (validSearch[0].logic === 'NOT') match = !match
          for (let i = 1; i < validSearch.length; i++) {
            const cMet = checkClientSearch(c, validSearch[i].text, stationsList)
            if (validSearch[i].logic === 'AND') match = match && cMet
            else if (validSearch[i].logic === 'OR') match = match || cMet
            else if (validSearch[i].logic === 'NOT') match = match && !cMet
          }
          return match
        }).length
      }
    } else {
      counts[tab.id] = 0
    }
  })
  return counts
})

const filteredClients = computed(() => {
  let base = store.clients
  const activeTab = store.kpiTabs.find(t => t.id === store.activeTabId)
  
  if (activeTab) {
    if (activeTab.filter === 'VIP') base = base.filter(c => { let sla = parseInt(c.sla_hours || c.sla) || 48; return sla > 0 && sla < 48 })
    else if (activeTab.filter === 'MISSING_CONTACT') base = base.filter(c => !c.contact_person || !c.phone || !c.email)
    else if (activeTab.filter === 'NO_STATIONS') base = base.filter(c => getClientStations(c, store.stations).length === 0)
    else if (activeTab.filter === 'HAS_STATIONS') base = base.filter(c => getClientStations(c, store.stations).length > 0)
    else if (activeTab.filter === 'ACTIVE_TICKETS') {
      base = base.filter(c => {
        return getClientStations(c, store.stations).some(s => {
          const tStat = s.ticket_status ? String(s.ticket_status).trim().toLowerCase() : ''
          return s.active_ticket_id && !tStat.includes('zakończ') && !tStat.includes('zamknięt') && !tStat.includes('wykonano')
        })
      })
    }
  }

  const validSearch = store.searchQueriesMain.filter(q => q.text.trim() !== '')
  if (validSearch.length > 0) {
    base = base.filter(c => {
      let match = checkClientSearch(c, validSearch[0].text, store.stations)
      if (validSearch[0].logic === 'NOT') match = !match
      for (let i = 1; i < validSearch.length; i++) {
        const cMet = checkClientSearch(c, validSearch[i].text, store.stations)
        if (validSearch[i].logic === 'AND') match = match && cMet
        else if (validSearch[i].logic === 'OR') match = match || cMet
        else if (validSearch[i].logic === 'NOT') match = match && !cMet
      }
      return match
    })
  }

  return [...base]
})

// ==========================================
// OBSŁUGA AKCJI UI
// ==========================================

const openAddClientModal = () => {
  selectedClientForEdit.value = null
  showClientModal.value = true
}

const openEditClientModal = (client) => {
  selectedClientForEdit.value = client
  showClientModal.value = true
}

const handleSaveClient = (clientPayload) => {
  store.saveClientToBase(clientPayload)
  showClientModal.value = false
}

const confirmDeleteClient = (client) => {
  confirmModal.value = {
    show: true,
    message: `Czy na pewno chcesz usunąć klienta ${client.name}? Tej operacji nie można cofnąć.`,
    onConfirm: () => {
      store.deleteClientFromBase(client.id)
    }
  }
}

const handleScroll = (e) => {
  const { scrollTop, scrollHeight, clientHeight } = e.target
  if (scrollTop + clientHeight >= scrollHeight - 60) {
    if (filteredClients.value.length > currentPage.value * itemsPerPage) currentPage.value++
  }
}

const toggleAccordion = (id) => {
  if (store.expandedIds.includes(id)) {
    store.expandedIds = store.expandedIds.filter(x => x !== id)
  } else {
    store.expandedIds.push(id)
  }
}

const setActiveTab = (id) => {
  store.activeTabId = store.activeTabId === id && id !== 'ALL' ? 'ALL' : id
  currentPage.value = 1
  saveUserConfig()
}

const openNewTabModal = () => {
  editingTabId.value = null
  modalForm.value = { name: "", color: "#58b347", iconPreviewBase64: "", selectedIconName: "" }
  searchQueriesModal.value = [{ id: 'd_' + Date.now(), logic: 'AND', text: '' }]
  showTabModal.value = true
}

const editTab = (tab) => {
  if (tab.filter !== 'CUSTOM') return
  editingTabId.value = tab.id
  modalForm.value = { name: tab.name, color: tab.color, iconPreviewBase64: tab.icon, selectedIconName: "" }
  searchQueriesModal.value = tab.customQueries ? JSON.parse(JSON.stringify(tab.customQueries)) : [{ id: 'd_' + Date.now(), logic: 'AND', text: '' }]
  showTabModal.value = true
}

const saveUserConfig = () => {
  store.saveTabsConfiguration()
}

const deleteTab = (id) => {
  confirmModal.value = {
    show: true,
    message: "Usunąć ten filtr (zakładkę)?",
    onConfirm: () => {
      store.kpiTabs = store.kpiTabs.filter(t => t.id !== id)
      if (store.activeTabId === id) setActiveTab('ALL')
      saveUserConfig() 
    }
  }
}

const executeConfirm = () => {
  if (confirmModal.value.onConfirm) confirmModal.value.onConfirm()
  confirmModal.value.show = false
}

const saveTab = ({ form, queries }) => {
  const isEdit = !!editingTabId.value
  
  const tabData = {
    id: isEdit ? editingTabId.value : 'CUSTOM_' + Date.now(),
    name: form.name.toUpperCase(),
    filter: 'CUSTOM',
    color: form.color || '#58b347',
    icon: form.iconPreviewBase64,
    customQueries: JSON.parse(JSON.stringify(queries))
  }

  if (isEdit) {
    const idx = store.kpiTabs.findIndex(t => t.id === editingTabId.value)
    if (idx !== -1) store.kpiTabs[idx] = tabData
  } else {
    store.kpiTabs.push(tabData)
  }

  showTabModal.value = false
  saveUserConfig()
}

const handleReorderTabs = ({ sourceId, targetId }) => {
  if (sourceId === targetId) return
  
  const tabs = [...store.kpiTabs]
  const srcIdx = tabs.findIndex(t => t.id === sourceId)
  const tgtIdx = tabs.findIndex(t => t.id === targetId)
  
  if (srcIdx === -1 || tgtIdx === -1) return
  
  const [movedTab] = tabs.splice(srcIdx, 1)
  tabs.splice(tgtIdx, 0, movedTab)
  
  store.kpiTabs = tabs
  saveUserConfig()
}

const openAnalytics = (qp) => alert('Analityka dla: ' + qp)

onMounted(() => {
  store.fetchClientsData()
})
</script>