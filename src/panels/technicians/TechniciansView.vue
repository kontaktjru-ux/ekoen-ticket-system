<template>
  <div class="flex flex-col h-full bg-[#f4f6f8] relative z-10 overflow-auto custom-scrollbar" @click="closeAllDropdowns">
    
    <UniversalKpi 
      title="Zarządzanie Kadrami"
      subtitle="Lista pracowników, uprawnienia, pojazdy i przypisane strefy."
      :views="[]"
      activeView=""
      :activeTabId="store.activeTabId"
      :tabs="store.kpiTabs"
      :tabCounts="tabCounts"
      @select-tab="setActiveTab"
      @edit-tab="editTab"
      @delete-tab="confirmDeleteTab"
      @open-modal="openNewTabModal"
      @reorder-tabs="handleReorderTabs"
      @save-settings="saveUserConfig"
    />

    <UniversalSearch 
      :queries="store.searchQueriesMain"
      placeholder="Szukaj imię, telefon, rejestrację, skrót..."
      @add-row="store.searchQueriesMain.push({ id: 'sq_' + Date.now(), logic: 'AND', text: '' })"
      @remove-row="(id) => store.searchQueriesMain = store.searchQueriesMain.filter(q => q.id !== id)"
    >
      <template #actions>
        <div class="bg-slate-50 border border-slate-200/80 rounded-xl px-4 text-[11px] font-black tracking-wider uppercase text-slate-500 shadow-sm flex items-center gap-2 h-[42px] mr-2">
          <svg class="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          WIDOCZNYCH: <span class="text-[#58b347] font-black text-sm ml-1">{{ filteredTechs.length }} / {{ store.technicians.length }}</span>
        </div>

        <button v-if="selectedIds.length > 0" @click="massDelete" class="bg-red-50 text-red-600 border border-red-100 font-extrabold px-4 py-2.5 rounded-xl text-[13px] hover:bg-red-100 shadow-sm transition-all flex items-center gap-2 h-[42px] mr-2">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          Usuń ({{ selectedIds.length }})
        </button>

        <button @click.stop="openAddTechModal(null)" class="bg-[#58b347] text-white font-extrabold px-5 py-2.5 rounded-xl text-[13px] hover:bg-[#499b3a] shadow-md shadow-[#58b347]/20 transition-all flex items-center gap-2 h-[42px]">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
          Nowy pracownik
        </button>
      </template>
    </UniversalSearch>

    <div class="px-8 pt-6 pb-8 flex-1 flex flex-col relative shrink-0 min-h-0">
      <div v-if="store.isLoading" class="flex-1 flex flex-col gap-3 w-full">
        <div class="w-full bg-white border border-slate-100 rounded-2xl p-4 shadow-sm animate-pulse flex flex-col gap-4" v-for="n in 5" :key="n">
           <div class="h-10 bg-slate-200 rounded-xl w-full"></div>
        </div>
      </div>

      <TechniciansList 
        v-else
        :technicians="paginatedTechs" 
        :allStations="store.stations"
        :selectedIds="selectedIds"
        :expandedIds="store.expandedIds"
        @toggle="toggleExpanded"
        @toggle-select="toggleSelectOne"
        @edit-tech="openAddTechModal"
        @delete-tech="confirmDeleteTech"
      />
      
      <div v-if="filteredTechs.length > currentPage * 50" class="p-6 text-center border-t border-slate-100 bg-slate-50/50 rounded-b-2xl mt-4 shrink-0">
        <button @click="currentPage++" class="bg-white border border-slate-200 text-slate-600 font-bold px-6 py-2.5 rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-xs uppercase tracking-widest">Załaduj więcej wyników</button>
      </div>
    </div>

    <!-- TOAST -->
    <div v-show="toast.show" class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-[#58b347] text-white px-8 py-3.5 rounded-full shadow-[0_10px_30px_rgba(88,179,71,0.5)] flex items-center justify-center gap-3 border border-[#499b3a] transition-all duration-300">
      <svg class="w-5 h-5 shrink-0 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6L9 17l-5-5" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span class="text-[13px] font-black uppercase tracking-widest whitespace-nowrap">{{ toast.msg }}</span>
    </div>

    <!-- MODALE UNIWERSALNE -->
    <UniversalTabModal 
      :show="showTabModal" :isEditing="!!editingTabId" :form="modalForm" :searchQueries="searchQueriesModal"
      @close="showTabModal = false" @save="saveTab"
    />
    <ConfirmModal 
      :show="confirmModal.show" :message="confirmModal.message"
      @cancel="confirmModal.show = false" @confirm="executeConfirm"
    />
    
    <!-- MODAL PRACOWNIKA -->
    <TechnicianFormModal
      :show="showAddTechModal"
      :techData="operationTech"
      @close="showAddTechModal = false"
      @save="saveTech"
      @delete="confirmDeleteTechFromModal"
    />

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTechniciansStore } from '../../stores/useTechniciansStore'

import UniversalKpi from '../../common/UniversalKpi.vue'
import UniversalSearch from '../../common/UniversalSearch.vue'
import UniversalTabModal from '../../common/UniversalTabModal.vue'
import ConfirmModal from '../../common/ConfirmModal.vue'
import TechniciansList from './TechniciansList.vue'
import TechnicianFormModal from '../../modals/TechnicianFormModal.vue'

const store = useTechniciansStore()

const getExpiryStatus = (dateString) => {
  if (!dateString) return { isExpired: false, isExpiring: false }
  try {
    const d = new Date(dateString)
    if(isNaN(d.getTime())) return { isExpired: false, isExpiring: false }
    const diffTime = d.getTime() - new Date().getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return { isExpired: true, isExpiring: false }
    if (diffDays <= 30) return { isExpired: false, isExpiring: true }
    return { isExpired: false, isExpiring: false }
  } catch(e) {
    return { isExpired: false, isExpiring: false }
  }
}

const checkTechSearch = (tech, queryObj) => {
  const q = queryObj.text.toLowerCase().trim()
  if (!q) return true
  return (tech.name && String(tech.name).toLowerCase().includes(q)) || 
         (tech.phone && String(tech.phone).toLowerCase().includes(q)) || 
         (tech.car_plate && String(tech.car_plate).toLowerCase().includes(q)) || 
         (tech.shortcut_key && String(tech.shortcut_key).toLowerCase().includes(q))
}

const evaluateQueries = (tech, queries) => {
  const validSearch = queries?.filter(q => q.text.trim() !== '') || []
  if (validSearch.length === 0) return true
  let match = checkTechSearch(tech, validSearch[0])
  if (validSearch[0].logic === 'NOT') match = !match
  for (let i = 1; i < validSearch.length; i++) {
    const cMet = checkTechSearch(tech, validSearch[i])
    if (validSearch[i].logic === 'AND') match = match && cMet
    else if (validSearch[i].logic === 'OR') match = match || cMet
    else if (validSearch[i].logic === 'NOT') match = match && !cMet
  }
  return match
}

const currentPage = ref(1)
const selectedIds = ref([])
const toast = ref({ show: false, msg: '' })
const showTabModal = ref(false)
const editingTabId = ref(null)
const modalForm = ref({ name: "", color: "#58b347", iconPreviewBase64: "", selectedIconName: "" })
const searchQueriesModal = ref([{ id: 'd_' + Date.now(), logic: 'AND', text: '' }])
const confirmModal = ref({ show: false, message: "", onConfirm: null })

const showAddTechModal = ref(false)
const operationTech = ref(null)

const tabCounts = computed(() => {
  const counts = {}
  if (!store.kpiTabs) return counts
  store.kpiTabs.forEach(tab => {
    if (tab.id === 'ALL') {
      counts[tab.id] = store.technicians.length
    } else if (tab.id === 'SEP_ALERT') {
      counts[tab.id] = store.technicians.filter(t => getExpiryStatus(t.sep_expiry).isExpired).length
    } else if (tab.id === 'CONTRACT_ALERT') {
      counts[tab.id] = store.technicians.filter(t => {
        const status = getExpiryStatus(t.contract_expiry)
        return status.isExpired || status.isExpiring
      }).length
    } else if (tab.customQueries) {
      counts[tab.id] = store.technicians.filter(t => evaluateQueries(t, tab.customQueries)).length
    } else {
      counts[tab.id] = 0
    }
  })
  return counts
})

const filteredTechs = computed(() => {
  let base = store.technicians
  const activeTab = store.kpiTabs.find(t => t.id === store.activeTabId)
  
  if (activeTab) {
    if (activeTab.id === 'SEP_ALERT') {
      base = base.filter(t => getExpiryStatus(t.sep_expiry).isExpired)
    } else if (activeTab.id === 'CONTRACT_ALERT') {
      base = base.filter(t => {
        const status = getExpiryStatus(t.contract_expiry)
        return status.isExpired || status.isExpiring
      })
    } else if (activeTab.id !== 'ALL' && activeTab.customQueries) {
      base = base.filter(t => evaluateQueries(t, activeTab.customQueries))
    }
  }

  if (store.searchQueriesMain.some(q => q.text.trim() !== '')) {
    base = base.filter(t => evaluateQueries(t, store.searchQueriesMain))
  }
  return base
})

const paginatedTechs = computed(() => filteredTechs.value.slice(0, currentPage.value * 50))

const toggleExpanded = (id) => {
  if (store.expandedIds.includes(id)) {
    store.expandedIds.splice(store.expandedIds.indexOf(id), 1)
  } else {
    store.expandedIds.push(id)
  }
}

const toggleSelectOne = (id) => {
  if (selectedIds.value.includes(id)) selectedIds.value = selectedIds.value.filter(x => x !== id)
  else selectedIds.value.push(id)
}

const openAddTechModal = (tech = null) => {
  operationTech.value = tech
  showAddTechModal.value = true
}

const saveTech = (payload) => {
  store.saveTechnician(payload, () => {
    showAddTechModal.value = false
    toast.value = { show: true, msg: 'Pracownik zapisany pomyślnie!' }
    setTimeout(() => { toast.value.show = false }, 3000)
  })
}

const confirmDeleteTechFromModal = (id) => {
  showAddTechModal.value = false
  confirmDeleteTech({ id })
}

const confirmDeleteTech = (tech) => {
  confirmModal.value = {
    show: true, message: "Czy na pewno chcesz bezpowrotnie usunąć tego pracownika?",
    onConfirm: () => {
      store.deleteTechnician(tech.id)
      selectedIds.value = selectedIds.value.filter(id => id !== tech.id)
      toast.value = { show: true, msg: 'Pracownik usunięty!' }
      setTimeout(() => { toast.value.show = false }, 3000)
    }
  }
}

const massDelete = () => {
  confirmModal.value = {
    show: true, message: `Czy na pewno chcesz usunąć ${selectedIds.value.length} zaznaczonych pracowników?`,
    onConfirm: () => {
      store.massDeleteTechnicians(selectedIds.value)
      selectedIds.value = []
      toast.value = { show: true, msg: 'Pracownicy usunięci!' }
      setTimeout(() => { toast.value.show = false }, 3000)
    }
  }
}

const closeAllDropdowns = () => {}

const setActiveTab = (id) => {
  store.activeTabId = store.activeTabId === id && id !== 'ALL' && id !== 'SEP_ALERT' && id !== 'CONTRACT_ALERT' ? 'ALL' : id
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
  if (tab.filter === 'ALL' || tab.filter === 'SYSTEM') return
  editingTabId.value = tab.id
  modalForm.value = { name: tab.name, color: tab.color, iconPreviewBase64: tab.icon, selectedIconName: "" }
  searchQueriesModal.value = tab.customQueries ? JSON.parse(JSON.stringify(tab.customQueries)) : [{ id: 'd_' + Date.now(), logic: 'AND', text: '' }]
  showTabModal.value = true
}

const confirmDeleteTab = (id) => {
  confirmModal.value = {
    show: true, message: "Usunąć ten filtr (zakładkę)?",
    onConfirm: () => {
      store.kpiTabs = store.kpiTabs.filter(t => t.id !== id)
      if (store.activeTabId === id) store.activeTabId = 'ALL'
      saveUserConfig()
    }
  }
}

const saveTab = ({ form, queries }) => {
  const validQ = queries.filter(q => q.text.trim() !== '')
  if (editingTabId.value) {
    const tab = store.kpiTabs.find(t => t.id === editingTabId.value)
    if (tab) { tab.name = form.name; tab.color = form.color; tab.icon = form.iconPreviewBase64; tab.customQueries = JSON.parse(JSON.stringify(validQ)) }
  } else {
    store.kpiTabs.push({ id: "TAB_" + Date.now(), name: form.name, filter: "CUSTOM", color: form.color, icon: form.iconPreviewBase64, customQueries: JSON.parse(JSON.stringify(validQ)) })
    store.activeTabId = store.kpiTabs[store.kpiTabs.length - 1].id
  }
  saveUserConfig()
  showTabModal.value = false
}

const handleReorderTabs = ({ sourceId, targetId }) => {
  const tabs = [...store.kpiTabs]
  const srcIdx = tabs.findIndex(t => t.id === sourceId)
  const tgtIdx = tabs.findIndex(t => t.id === targetId)
  if (srcIdx !== -1 && tgtIdx !== -1) {
    const [movedTab] = tabs.splice(srcIdx, 1)
    tabs.splice(tgtIdx, 0, movedTab)
    store.kpiTabs = tabs
    saveUserConfig()
  }
}

const executeConfirm = () => {
  if (confirmModal.value.onConfirm) confirmModal.value.onConfirm()
  confirmModal.value.show = false
}

const saveUserConfig = () => store.saveTabsConfiguration()

onMounted(() => {
  store.fetchTechniciansData()
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
.custom-scrollbar::-webkit-scrollbar-track { background: rgba(241, 245, 249, 0.4); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.3); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(88, 179, 71, 0.8); }
</style>