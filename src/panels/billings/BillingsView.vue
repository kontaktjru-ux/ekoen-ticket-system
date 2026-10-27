<template>
  <div class="w-full h-full bg-[#f4f6f8] overflow-auto overflow-x-hidden billings-custom-scrollbar" @click="closeAllDropdowns">
    <div class="w-full flex flex-col pb-16 min-h-full">
      
      <!-- 1. UNIWERSALNE KPI -->
      <UniversalKpi 
        title="Rozliczenia i Biling"
        subtitle="Kalkulacje usług, roboczogodzin i weryfikacja cenników."
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

      <!-- 2. UNIWERSALNA WYSZUKIWARKA -->
      <UniversalSearch 
        :queries="store.searchQueriesMain"
        placeholder="Szukaj po numerze zgłoszenia, stacji, kliencie..."
        @add-row="store.searchQueriesMain.push({ id: 'tq_' + Date.now(), logic: 'AND', text: '' })"
        @remove-row="(id) => store.searchQueriesMain = store.searchQueriesMain.filter(q => q.id !== id)"
      >
        <template #actions>
          <div class="bg-slate-50 border border-slate-200/80 rounded-xl px-4 text-[11px] font-black tracking-wider uppercase text-slate-500 shadow-sm flex items-center gap-2 h-[42px] mr-2">
            <svg class="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            DO ROZLICZENIA: <span class="text-[#58b347] font-black text-sm ml-1">{{ filteredBillings.length }} / {{ store.billings.length }}</span>
          </div>

          <!-- Przycisk Masowego Usuwania -->
          <button v-if="selectedIds.length > 0" @click="massDelete" class="bg-red-50 text-red-600 border border-red-100 font-extrabold px-4 py-2.5 rounded-xl text-[13px] hover:bg-red-100 shadow-sm transition-all flex items-center gap-2 h-[42px] mr-2">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            Usuń ({{ selectedIds.length }})
          </button>

          <!-- Przycisk Wyboru Kolumn -->
          <div class="relative">
            <button @click.stop="isColDropdownOpen = !isColDropdownOpen" class="bg-white border border-slate-200 text-slate-600 font-extrabold px-4 py-2.5 rounded-xl text-[13px] hover:bg-slate-50 shadow-sm transition-all flex items-center gap-2 h-[42px]">
              <svg class="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg> Kolumny
            </button>
            <div v-show="isColDropdownOpen" @click.stop class="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-[150] p-4">
              <p class="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 border-b border-slate-100 pb-2 px-2">WIDOCZNE KOLUMNY</p>
              <div class="max-h-[320px] overflow-y-auto billings-custom-scrollbar pr-1">
                <div v-for="(col, idx) in columns" :key="col.id" v-show="!col.locked" 
                     draggable="true" 
                     @dragstart="draggedMenuColIdx = idx" 
                     @dragover.prevent 
                     @drop="onMenuColDrop(idx)"
                     @click.stop="col.visible = !col.visible; saveColumnsConfig()" 
                     class="flex items-center gap-3 w-full cursor-pointer px-3 py-2.5 rounded-lg transition-all mb-1 group" 
                     :class="col.visible ? 'bg-[#f0f7f1] text-[#58b347]' : 'bg-transparent text-slate-500 hover:bg-slate-50'">
                  <div class="w-1.5 h-6 rounded-full shrink-0 transition-all" :class="col.visible ? 'bg-[#58b347]' : 'bg-transparent'"></div>
                  <span class="text-[11px] font-black uppercase tracking-widest flex-1">{{ col.label }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </UniversalSearch>

      <!-- SKELETON LOADER -->
      <div v-if="store.isLoading" class="px-8 pt-6 pb-8 flex-1 flex flex-col gap-3 w-full">
        <SkeletonCard v-for="n in 5" :key="n" />
      </div>

      <!-- 3. ZEWNĘTRZNA LISTA AKORDEONÓW ROZLICZEŃ -->
      <BillingsList v-else
        :groupedBillings="groupedBillings"
        :isLoading="store.isLoading"
        :visibleColumns="visibleColumns"
        :selectedIds="selectedIds"
        :currentSort="currentSort"
        :openAccordions="openAccordions"
        @toggle-accordion="toggleAccordion"
        @toggle-currency="toggleCurrency"
        @toggle-select-all-in-group="toggleSelectAllInGroup"
        @toggle-select="toggleSelectOne"
        @copy="copyValue"
        @open-settlement="openSettlementModal"
        @sort="sortBy"
        @drag-start="idx => draggedHeaderIdx = idx"
        @drop-col="onHeaderDrop"
      />

    </div>

    <!-- TOAST -->
    <div v-show="toast.show" class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] flex justify-center pointer-events-none">
      <div class="bg-[#58b347] text-white px-8 py-3.5 rounded-full shadow-[0_10px_30px_rgba(88,179,71,0.5)] flex items-center justify-center gap-3 border border-[#499b3a] transition-all duration-300">
        <svg class="w-5 h-5 shrink-0 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6L9 17l-5-5" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span class="text-[13px] font-black uppercase tracking-widest whitespace-nowrap">{{ toast.msg }}</span>
      </div>
    </div>

    <!-- MODALE -->
    <UniversalTabModal 
      :show="showTabModal" :isEditing="!!editingTabId" :form="modalForm" :searchQueries="searchQueriesModal"
      @close="showTabModal = false" @save="saveTab"
    />
    <ConfirmModal 
      :show="confirmModal.show" :message="confirmModal.message"
      @cancel="confirmModal.show = false" @confirm="executeConfirm"
    />
    <SettlementModal 
      :show="showSettlementModal" 
      :ticketId="selectedTicketIdForSettlement"
      @close="showSettlementModal = false"
      @save="saveSettlement"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useBillingsStore } from '../../stores/useBillingsStore'
import { useSearchFilters } from '../../composables/useSearchFilters'

import UniversalKpi from '../../common/UniversalKpi.vue'
import UniversalSearch from '../../common/UniversalSearch.vue'
import SkeletonCard from '../../common/SkeletonCard.vue'
import BillingsList from './BillingsList.vue'

import UniversalTabModal from '../../common/UniversalTabModal.vue'
import ConfirmModal from '../../common/ConfirmModal.vue'
import SettlementModal from '../../modals/SettlementModal.vue'

const store = useBillingsStore()
const { checkBillingSearch } = useSearchFilters()

// Stany UI
const isColDropdownOpen = ref(false)
const selectedIds = ref([])
const currentSort = ref({ col: 'closed_date', dir: 'desc' })
const toast = ref({ show: false, msg: '' })
const openAccordions = ref([])
const draggedMenuColIdx = ref(null)
const draggedHeaderIdx = ref(null)

// Stany Modali
const showTabModal = ref(false)
const editingTabId = ref(null)
const modalForm = ref({ name: "", color: "#58b347", iconPreviewBase64: "", selectedIconName: "" })
const searchQueriesModal = ref([{ id: 'd_' + Date.now(), logic: 'AND', text: '' }])
const confirmModal = ref({ show: false, message: "", onConfirm: null })

const showSettlementModal = ref(false)
const selectedTicketIdForSettlement = ref(null)

const columns = ref([
  { id: 'selection', label: '', visible: true, locked: true, sortable: false, width: '50px' },
  { id: 'status', label: 'STATUS', visible: true, sortable: true, width: '130px' },
  { id: 'ticket_id', label: 'NR ZGŁOSZENIA', visible: true, sortable: true, width: '160px' },
  { id: 'station', label: 'STACJA', visible: true, sortable: true, width: '220px' },
  { id: 'closed_date', label: 'DATA ZAMKNIĘCIA', visible: true, sortable: true, width: '160px' },
  { id: 'technician', label: 'OSTATNI TECHNIK', visible: true, sortable: true, width: '180px' },
  { id: 'actions', label: 'AKCJE', visible: true, locked: true, sortable: false, width: '110px' }
])

const visibleColumns = computed(() => columns.value.filter(c => c.visible))

// --- OBLICZENIA I FILTROWANIE (Zoptymalizowane DRY) ---

// Zunifikowana funkcja oceniająca filtry AND/OR/NOT
const evaluateQueries = (item, queries) => {
  const validSearch = queries?.filter(q => q.text.trim() !== '') || []
  if (validSearch.length === 0) return true

  let match = checkBillingSearch(item, validSearch[0].text)
  if (validSearch[0].logic === 'NOT') match = !match
  
  for (let i = 1; i < validSearch.length; i++) {
    const cMet = checkBillingSearch(item, validSearch[i].text)
    if (validSearch[i].logic === 'AND') match = match && cMet
    else if (validSearch[i].logic === 'OR') match = match || cMet
    else if (validSearch[i].logic === 'NOT') match = match && !cMet
  }
  return match
}

const tabCounts = computed(() => {
  const counts = {}
  if (!store.kpiTabs) return counts

  store.kpiTabs.forEach(tab => {
    if (tab.filter === 'ALL') {
      counts[tab.id] = store.billings.length
    } else if (tab.customQueries) {
      counts[tab.id] = store.billings.filter(item => evaluateQueries(item, tab.customQueries)).length
    } else {
      counts[tab.id] = 0
    }
  })
  return counts
})

const filteredBillings = computed(() => {
  let base = store.billings
  const activeTab = store.kpiTabs.find(t => t.id === store.activeTabId)
  
  // Aplikuj filtry z aktywnej zakładki
  if (activeTab && activeTab.id !== 'ALL' && activeTab.customQueries) {
    base = base.filter(item => evaluateQueries(item, activeTab.customQueries))
  }

  // Aplikuj filtry z głównej wyszukiwarki
  base = base.filter(item => evaluateQueries(item, store.searchQueriesMain))

  // Sortowanie
  if (currentSort.value.col) {
    const col = currentSort.value.col
    const dir = currentSort.value.dir

    base.sort((a, b) => {
      let valA = a[col] || ''; let valB = b[col] || ''
      if (col === 'station') { valA = a.qp || ''; valB = b.qp || '' }

      if (col === 'closed_date') {
        let isEmptyA = (!valA || valA === '-' || valA === 'Brak daty')
        let isEmptyB = (!valB || valB === '-' || valB === 'Brak daty')
        if (isEmptyA && !isEmptyB) return -1
        if (!isEmptyA && isEmptyB) return 1
        if (isEmptyA && isEmptyB) return 0
        
        let dateA = new Date(valA).getTime()
        let dateB = new Date(valB).getTime()
        if (!isNaN(dateA) && !isNaN(dateB)) return dir === 'asc' ? dateA - dateB : dateB - dateA
      }

      valA = String(valA).toLowerCase()
      valB = String(valB).toLowerCase()
      if (valA < valB) return dir === 'asc' ? -1 : 1
      if (valA > valB) return dir === 'asc' ? 1 : -1
      return 0
    })
  }

  return base
})

const groupedBillings = computed(() => {
  const groups = {}
  const monthNames = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień']

  filteredBillings.value.forEach(item => {
    if (item.billing_state === 'NEW' || item.status === 'Nowe' || item.ticket_status === 'Nowe') return

    let sortKey = '9999-99'
    let label = 'ZAMKNIĘTE BEZ DATY (Błąd Systemu / Do wyjaśnienia)'
    
    // Zastąpiono duplikat metody isPrelim z pliku BillingsList
    const isWstepne = item.billing_state === 'PRE_SETTLED' || 
                      String(item.billing_status || '').toUpperCase().includes('WSTĘPN') || 
                      String(item.status || '').toUpperCase().includes('WSTĘPN') ||
                      String(item.ticket_status || '').toUpperCase().includes('WSTĘPN')
    
    if (isWstepne) {
       sortKey = '9999-98'
       label = 'WSTĘPNIE ROZLICZONE (Do weryfikacji)'
    } else {
       let rawDate = item.closed_date || item.date_closed || item.end_datetime || item.updated_at || item.created_at || item.start_datetime
       if (rawDate && rawDate !== '-' && rawDate !== 'Brak daty') {
           let d = new Date(rawDate)
           if (isNaN(d.getTime()) && typeof rawDate === 'string') {
               let parts = rawDate.split(/[-. /T:]/)
               if (parts.length >= 3) {
                   let day = parseInt(parts[0], 10), month = parseInt(parts[1], 10) - 1, year = parseInt(parts[2], 10)
                   if (year < 100) { year = parseInt(parts[0], 10); day = parseInt(parts[2], 10) }
                   d = new Date(year, month, day)
               }
           }
           if (!isNaN(d.getTime())) {
             const y = d.getFullYear()
             const m = String(d.getMonth() + 1).padStart(2, '0')
             sortKey = `${y}-${m}`
             label = `${monthNames[d.getMonth()]} ${y}`
           }
       }
    }

    if (!groups[sortKey]) groups[sortKey] = { key: sortKey, label: label, items: [], settledCount: 0, totalEur: 0 }
    
    groups[sortKey].items.push(item)
    if (item.billing_state === 'SETTLED' || item.billing_state === 'CORRECTED') {
       groups[sortKey].settledCount++
       if (item.saved_data && item.saved_data.total_eur) {
         groups[sortKey].totalEur += parseFloat(item.saved_data.total_eur)
       }
    }
  })

  return Object.values(groups).sort((a, b) => b.key.localeCompare(a.key))
})

// --- AKCJE INTERFEJSU WIDOKU ---
const closeAllDropdowns = () => { isColDropdownOpen.value = false }
const sortBy = (colId) => {
  if (currentSort.value.col === colId) currentSort.value.dir = currentSort.value.dir === 'asc' ? 'desc' : 'asc'
  else { currentSort.value.col = colId; currentSort.value.dir = 'asc' }
}

const toggleAccordion = (key) => {
  if (openAccordions.value.includes(key)) openAccordions.value = openAccordions.value.filter(k => k !== key)
  else openAccordions.value.push(key)
}

const toggleCurrency = (key) => {
  const current = store.groupCurrency[key] || 'EUR'
  store.groupCurrency[key] = current === 'EUR' ? 'PLN' : 'EUR'
}

const toggleSelectAllInGroup = (group) => {
  const allMatch = group.items.length > 0 && group.items.every(i => selectedIds.value.includes(i.id))
  if (allMatch) group.items.forEach(i => { selectedIds.value = selectedIds.value.filter(id => id !== i.id) })
  else group.items.forEach(i => { if (!selectedIds.value.includes(i.id)) selectedIds.value.push(i.id) })
}

const toggleSelectOne = (id) => {
  if (selectedIds.value.includes(id)) selectedIds.value = selectedIds.value.filter(x => x !== id)
  else selectedIds.value.push(id)
}

const copyValue = (val) => {
  if (!val || val === '-' || !String(val).trim()) return
  navigator.clipboard.writeText(String(val)).then(() => {
    toast.value = { show: true, msg: 'Skopiowano do schowka!' }
    setTimeout(() => { toast.value.show = false }, 2000)
  })
}

const massDelete = () => {
  confirmModal.value = {
    show: true, 
    message: `Usunąć zaznaczone zgłoszenia (${selectedIds.value.length}) z rozliczeń?`,
    onConfirm: () => {
      selectedIds.value.forEach(id => store.deleteBilling(id))
      selectedIds.value = []
      toast.value = { show: true, msg: 'Zgłoszenia usunięte z bilingu.' }
      setTimeout(() => { toast.value.show = false }, 3000)
    }
  }
}

// ===============================================
// OBSŁUGA MODALA ROZLICZEŃ I BAZY
// ===============================================
const openSettlementModal = (id) => {
  selectedTicketIdForSettlement.value = id
  showSettlementModal.value = true
}

const saveSettlement = (payload) => {
  showSettlementModal.value = false
  if (typeof google !== 'undefined' && google.script) {
    google.script.run
      .withSuccessHandler(() => {
        updateStoreWithPayload(payload)
        toast.value = { show: true, msg: `Zapisano (${payload.ticket_status})!` }
        setTimeout(() => { toast.value.show = false }, 3000)
      })
      .withFailureHandler(() => {
        toast.value = { show: true, msg: 'Błąd połączenia. Zapisano tylko lokalnie!' }
        setTimeout(() => { toast.value.show = false }, 3000)
        updateStoreWithPayload(payload)
      })
      .saveSettlementToSysBillings(payload)
  } else {
    updateStoreWithPayload(payload)
    toast.value = { show: true, msg: `Zapisano lokalnie (${payload.ticket_status})!` }
    setTimeout(() => { toast.value.show = false }, 3000)
  }
}

const updateStoreWithPayload = (payload) => {
  const bIdx = store.billings.findIndex(t => String(t.id) === String(payload.raw_id) || String(t.ticket_id) === String(payload.raw_id))
  if (payload.is_deleted) {
    if (bIdx > -1) store.billings.splice(bIdx, 1)
  } else {
    const updatedBilling = {
      id: payload.raw_id, ticket_id: payload.ticket_id, client: payload.client,
      qp: payload.qp, technician: payload.tech, billing_state: payload.billing_state,
      ticket_status: payload.ticket_status, total_eur: payload.total_eur, saved_data: JSON.parse(JSON.stringify(payload))
    }
    if (bIdx > -1) store.billings[bIdx] = { ...store.billings[bIdx], ...updatedBilling }
    else store.billings.push(updatedBilling)
  }
}

const executeConfirm = () => {
  if (confirmModal.value.onConfirm) confirmModal.value.onConfirm()
  confirmModal.value.show = false
}

// LOGIKA ZAKŁADEK I KOLUMN
const loadColumnsConfig = () => {
  try {
    const localStore = JSON.parse(localStorage.getItem('EKOEN_BILLINGS_UI')) || {}
    if (localStore.cols_billings && localStore.cols_billings.length > 0) columns.value = localStore.cols_billings
  } catch (e) {}
}

const saveColumnsConfig = () => {
  try {
    const localStore = JSON.parse(localStorage.getItem('EKOEN_BILLINGS_UI')) || {}
    localStore.cols_billings = columns.value
    localStorage.setItem('EKOEN_BILLINGS_UI', JSON.stringify(localStore))
  } catch (e) {}
}

const onMenuColDrop = (targetIdx) => {
  if (draggedMenuColIdx.value === null || draggedMenuColIdx.value === targetIdx) return
  const moved = columns.value.splice(draggedMenuColIdx.value, 1)[0]
  columns.value.splice(targetIdx, 0, moved)
  draggedMenuColIdx.value = null
  saveColumnsConfig()
}

const onHeaderDrop = (targetIdx) => {
  if (draggedHeaderIdx.value === null || draggedHeaderIdx.value === targetIdx) return
  const draggedColId = visibleColumns.value[draggedHeaderIdx.value].id
  const targetColId = visibleColumns.value[targetIdx].id
  if (draggedColId === 'selection' || targetColId === 'selection' || draggedColId === 'actions' || targetColId === 'actions') return
  
  const realDraggedIdx = columns.value.findIndex(c => c.id === draggedColId)
  const realTargetIdx = columns.value.findIndex(c => c.id === targetColId)
  
  const moved = columns.value.splice(realDraggedIdx, 1)[0]
  columns.value.splice(realTargetIdx, 0, moved)
  draggedHeaderIdx.value = null
  saveColumnsConfig()
}

const setActiveTab = (id) => {
  store.activeTabId = store.activeTabId === id && id !== 'ALL' ? 'ALL' : id
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

const saveUserConfig = () => store.saveTabsConfiguration()

onMounted(() => {
  loadColumnsConfig()
  store.fetchBillingsData()
})
</script>

<style scoped>
.billings-custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.billings-custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.billings-custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.4); border-radius: 10px; }
.billings-custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(88, 179, 71, 0.8); }
</style>