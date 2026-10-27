<template>
  <div class="flex flex-col h-full bg-[#f4f6f8] relative z-10 overflow-auto ticket-custom-scrollbar" @click="closeAllDropdowns" @scroll="handleScroll">
    
    <!-- 1. UNIWERSALNE KPI -->
    <UniversalKpi 
      title="Centrum Zgłoszeń"
      subtitle="Dyspozytornia zadań operacyjnych i serwisowych."
      :views="[
        { label: 'AxonConnect', value: 'axon' },
        { label: 'Ekoen', value: 'ekoen' },
        { label: 'Historia', value: 'historia' }
      ]"
      :activeView="store.activeModule"
      :activeTabId="store.activeTabId"
      :tabs="store.kpiTabs"
      :tabCounts="tabCounts"
      @switch-view="switchModule"
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
      placeholder="Szukaj po kodzie, statusie, opisie, kliencie..."
      @add-row="store.searchQueriesMain.push({ id: 'tq_' + Date.now(), logic: 'AND', text: '' })"
      @remove-row="(id) => store.searchQueriesMain = store.searchQueriesMain.filter(q => q.id !== id)"
    >
      <template #actions>
        <!-- Licznik Widocznych -->
        <div class="bg-slate-50 border border-slate-200/80 rounded-xl px-4 text-[11px] font-black tracking-wider uppercase text-slate-500 shadow-sm flex items-center gap-2 h-[42px] mr-2">
          <svg class="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          WIDOCZNYCH: <span class="text-[#58b347] font-black text-sm ml-1">{{ filteredTickets.length }} / {{ baseTicketsCount }}</span>
        </div>

        <!-- Przycisk Wyboru Kolumn -->
        <div class="relative">
          <button @click.stop="isColDropdownOpen = !isColDropdownOpen" class="bg-white border border-slate-200 text-slate-600 font-extrabold px-4 py-2.5 rounded-xl text-[13px] hover:bg-slate-50 shadow-sm transition-all flex items-center gap-2 h-[42px]">
            <svg class="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg> Kolumny
          </button>
          <div v-show="isColDropdownOpen" @click.stop class="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-[150] p-4">
            <p class="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 border-b border-slate-100 pb-2 px-2">WIDOCZNE KOLUMNY</p>
            <div class="max-h-[320px] overflow-y-auto ticket-custom-scrollbar pr-1">
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

        <!-- Masowe Usuwanie -->
        <button v-if="selectedIds.length > 0" @click="massDelete" class="bg-red-50 text-red-600 border border-red-100 font-extrabold px-4 py-2.5 rounded-xl text-[13px] hover:bg-red-100 shadow-sm transition-all flex items-center gap-2 h-[42px]">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          Usuń ({{ selectedIds.length }})
        </button>

        <!-- Dodaj Nowe Zgłoszenie (Tylko dla Ekoen) -->
        <button v-if="store.activeModule === 'ekoen'" @click.stop="openAddTicketModal" class="bg-[#58b347] text-white font-extrabold px-5 py-2.5 rounded-xl text-[13px] hover:bg-[#499b3a] shadow-md shadow-[#58b347]/20 transition-all flex items-center gap-2 h-[42px]">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Nowe zgłoszenie
        </button>
      </template>
    </UniversalSearch>

    <!-- 3. ZEWNĘTRZNY KOMPONENT TABELI ZGŁOSZEŃ -->
    <TicketsList 
      :tickets="paginatedTickets"
      :isLoading="store.isLoading"
      :visibleColumns="visibleColumns"
      :selectedIds="selectedIds"
      :currentSort="currentSort"
      :activeDropId="activeInlineDropId"
      @sort="sortBy"
      @toggle-select-all="toggleSelectAll"
      @toggle-select="toggleSelectOne"
      @copy="copyValue"
      @open-attachments="openAttachmentsList"
      @open-diagnose="openDiagnose"
      @open-analytics="qp => { selectedStationQp = qp; showAnalyticsModal = true }"
      @toggle-drop="toggleInlineDrop"
      @change-status="changeStatus"
      @drag-start="idx => draggedHeaderIdx = idx"
      @drop-col="onHeaderDrop"
    />

    <!-- MODAL 1: GALERIA ZAŁĄCZNIKÓW -->
    <div v-if="attachmentsModal.show" class="fixed inset-0 z-[30000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6 animate-fadeIn" @click.self="attachmentsModal.show = false">
      <div class="relative w-full max-w-5xl bg-slate-50 rounded-[32px] overflow-hidden shadow-2xl flex flex-col h-[85vh]">
        <div class="px-8 py-6 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
          <h3 class="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
            <svg class="w-6 h-6 text-[#58b347]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
            DOKUMENTACJA ZGŁOSZENIA
          </h3>
          <button @click="attachmentsModal.show = false" class="text-slate-400 hover:text-red-500 transition-colors bg-white border border-slate-200 p-2.5 rounded-xl shadow-sm hover:bg-red-50">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="flex-1 w-full overflow-y-auto ticket-custom-scrollbar p-8">
          <div v-if="attachmentsModal.loading" class="p-12 text-center flex flex-col items-center justify-center h-full">
            <div class="animate-spin rounded-full h-12 w-12 border-b-4 border-[#58b347] mb-4"></div>
            <p class="text-[11px] font-bold uppercase tracking-widest text-slate-400">Ładowanie miniatur...</p>
          </div>
          <div v-else-if="attachmentsModal.files.length === 0" class="p-16 text-center flex flex-col items-center justify-center h-full">
            <svg class="w-16 h-16 text-slate-300 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
            <p class="text-slate-400 font-black uppercase tracking-widest text-[12px]">Brak plików w dokumentacji.</p>
          </div>
          <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            <div v-for="f in attachmentsModal.files" :key="f.id" @click="openLightbox(f)" class="bg-white border border-slate-200 rounded-[20px] flex flex-col items-center justify-start cursor-pointer hover:border-[#58b347] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden h-56">
              <div class="w-full h-40 bg-slate-100 flex items-center justify-center overflow-hidden relative">
                <img :src="`https://drive.google.com/thumbnail?id=${f.id}&sz=w400`" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div class="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20 backdrop-blur-[2px]">
                  <span class="bg-[#58b347] text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">Otwórz</span>
                </div>
              </div>
              <div class="w-full flex-1 flex items-center px-4 border-t border-slate-100">
                <span class="text-[11px] font-bold text-slate-700 truncate w-full text-center group-hover:text-[#58b347] transition-colors" :title="f.name">{{ f.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL 2: LIGHTBOX NA PEŁNY EKRAN Z ZOOMEM -->
    <div v-if="lightbox.show" class="fixed inset-0 z-[40000] flex items-center justify-center bg-[#1a1c23]/95 backdrop-blur-md animate-fadeIn overflow-hidden" @click.self="lightbox.show = false">
      <button @click="lightbox.show = false" class="absolute top-6 right-6 text-white hover:text-red-400 transition-colors bg-white/10 hover:bg-white/20 p-3 rounded-2xl backdrop-blur-sm shadow-sm z-50">
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div class="w-full h-full flex items-center justify-center p-4 md:p-8 relative" @wheel.prevent="handleZoom">
        <img v-if="lightbox.isImage" :src="`https://drive.google.com/thumbnail?id=${lightbox.fileId}&sz=w3000`" class="max-w-full max-h-full object-contain shadow-2xl transition-transform duration-100 ease-out cursor-zoom-in" :style="`transform: scale(${lightbox.zoom});`" />
        <iframe v-else :src="`https://drive.google.com/file/d/${lightbox.fileId}/preview`" class="w-full h-full max-w-[1400px] border-none rounded-xl shadow-2xl bg-white"></iframe>
      </div>
    </div>

    <!-- Powiadomienie Toast -->
    <div v-show="toast.show" class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] flex justify-center pointer-events-none">
      <div class="bg-[#58b347] text-white px-8 py-3.5 rounded-full shadow-[0_10px_30px_rgba(88,179,71,0.5)] flex items-center justify-center gap-3 border border-[#499b3a] transition-all duration-300">
        <svg class="w-5 h-5 shrink-0 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6L9 17l-5-5" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span class="text-[13px] font-black uppercase tracking-widest whitespace-nowrap">{{ toast.msg }}</span>
      </div>
    </div>

    <!-- MODALE UNIWERSALNE I BIZNESOWE -->
    <UniversalTabModal 
      :show="showTabModal" :isEditing="!!editingTabId" :form="modalForm" :searchQueries="searchQueriesModal"
      @close="showTabModal = false" @save="saveTab"
    />
    <ConfirmModal 
      :show="confirmModal.show" :message="confirmModal.message"
      @cancel="confirmModal.show = false" @confirm="executeConfirm"
    />
    <TicketsFormModal 
      :show="showAddTicketModal" :prefilledQp="prefilledQp"
      @close="showAddTicketModal = false" @save="saveNewTicket"
    />
    <StationAnalyticsModal 
      :show="showAnalyticsModal" 
      :stationQp="selectedStationQp"
      @close="showAnalyticsModal = false"
    />
    
    <DiagnoseModal 
      :show="showDiagnoseModal" 
      :ticketId="selectedTicketIdForDiagnose"
      @close="showDiagnoseModal = false"
      @save="saveDiagnose"
      @open-settlement="openSettlementFromDiagnose" 
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTicketsStore } from '../../stores/useTicketsStore'
import { useBillingsStore } from '../../stores/useBillingsStore'
import { useSearchFilters } from '../../composables/useSearchFilters'

import UniversalKpi from '../../common/UniversalKpi.vue'
import UniversalSearch from '../../common/UniversalSearch.vue'
import TicketsList from './TicketsList.vue'

import UniversalTabModal from '../../common/UniversalTabModal.vue'
import ConfirmModal from '../../common/ConfirmModal.vue'
import TicketsFormModal from '../../modals/TicketsFormModal.vue'
import StationAnalyticsModal from '../../modals/StationAnalyticsModal.vue'
import DiagnoseModal from '../../modals/DiagnoseModal.vue'
import SettlementModal from '../../modals/SettlementModal.vue'

const store = useTicketsStore()
const billingsStore = useBillingsStore()
const { checkTicketSearch } = useSearchFilters()

const currentPage = ref(1)
const itemsPerPage = 50
const isColDropdownOpen = ref(false)
const activeInlineDropId = ref(null)
const selectedIds = ref([])
const currentSort = ref({ col: null, dir: 'asc' })
const toast = ref({ show: false, msg: '' })

const attachmentsModal = ref({ show: false, loading: false, files: [] })
const lightbox = ref({ show: false, fileId: null, isImage: true, zoom: 1 })

const draggedMenuColIdx = ref(null)
const draggedHeaderIdx = ref(null)

const showTabModal = ref(false)
const editingTabId = ref(null)
const modalForm = ref({ name: "", color: "#58b347", iconPreviewBase64: "", selectedIconName: "" })
const searchQueriesModal = ref([{ id: 'd_' + Date.now(), logic: 'AND', text: '' }])
const confirmModal = ref({ show: false, message: "", onConfirm: null })

const showAddTicketModal = ref(false)
const prefilledQp = ref('')
const showAnalyticsModal = ref(false)
const selectedStationQp = ref('')
const showDiagnoseModal = ref(false)
const selectedTicketIdForDiagnose = ref(null)

const showSettlementModal = ref(false)
const selectedTicketIdForSettlement = ref(null)

const columns = ref([
  { id: 'actions', label: '', visible: true, locked: true, sortable: false, width: '60px' },
  { id: 'code', label: 'ZGŁOSZENIE I STATUS', visible: true, sortable: true, width: '160px' },
  { id: 'station', label: 'QP / PRODUKT / ADRES', visible: true, sortable: true, width: '230px' },
  { id: 'client_contact', label: 'KLIENT / KONTAKT', visible: true, sortable: true, width: '250px' },
  { id: 'description', label: 'OPIS ZGŁOSZENIA', visible: true, sortable: true, width: '320px' },
  { id: 'tech_parts', label: 'TECHNIK / STATUS', visible: true, sortable: true, width: '180px' },
  { id: 'used_parts', label: 'UŻYTE CZĘŚCI', visible: true, sortable: true, width: '280px' },
  { id: 'diagnoza', label: 'DIAGNOZA EKOEN', visible: true, sortable: true, width: '250px' }
])

const visibleColumns = computed(() => columns.value.filter(c => c.visible))

const openAttachmentsList = (rawUrlOrArray) => {
  attachmentsModal.value.show = true
  if (Array.isArray(rawUrlOrArray)) {
    attachmentsModal.value.files = rawUrlOrArray
    attachmentsModal.value.loading = false
    return
  }
  attachmentsModal.value.loading = true
  if (typeof google !== 'undefined' && google.script) {
    google.script.run
      .withSuccessHandler((resStr) => {
        let res = JSON.parse(resStr)
        attachmentsModal.value.files = res.success ? res.files : []
        attachmentsModal.value.loading = false
      })
      .withFailureHandler(() => { attachmentsModal.value.loading = false })
      .getTicketFilesList(rawUrlOrArray)
  } else {
    setTimeout(() => { attachmentsModal.value.files = []; attachmentsModal.value.loading = false }, 500)
  }
}

const openLightbox = (file) => {
  lightbox.value = { show: true, fileId: file.id, isImage: file.mimeType ? file.mimeType.includes('image') : true, zoom: 1 }
}

const handleZoom = (e) => {
  if (e.deltaY < 0) lightbox.value.zoom += 0.15
  else lightbox.value.zoom -= 0.15
  if (lightbox.value.zoom < 0.3) lightbox.value.zoom = 0.3
  if (lightbox.value.zoom > 5) lightbox.value.zoom = 5
}

const handleKeydown = (e) => {
  if (e.key === 'Escape') {
    if (lightbox.value.show) lightbox.value.show = false
    else if (attachmentsModal.value.show) attachmentsModal.value.show = false
  }
}

const loadColumnsConfig = () => {
  try {
    const localStore = JSON.parse(localStorage.getItem('EKOEN_TICKETS_UI')) || {}
    if (localStore.cols_axon && localStore.cols_axon.length > 0) columns.value = localStore.cols_axon
  } catch (e) {}
}

const saveColumnsConfig = () => {
  try {
    const localStore = JSON.parse(localStorage.getItem('EKOEN_TICKETS_UI')) || {}
    localStore.cols_axon = columns.value
    localStorage.setItem('EKOEN_TICKETS_UI', JSON.stringify(localStore))
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
  if (draggedColId === 'actions' || targetColId === 'actions') return
  const realDraggedIdx = columns.value.findIndex(c => c.id === draggedColId)
  const realTargetIdx = columns.value.findIndex(c => c.id === targetColId)
  const moved = columns.value.splice(realDraggedIdx, 1)[0]
  columns.value.splice(realTargetIdx, 0, moved)
  draggedHeaderIdx.value = null
  saveColumnsConfig()
}

const closeAllDropdowns = () => {
  isColDropdownOpen.value = false
  activeInlineDropId.value = null
}

const toggleInlineDrop = (id) => {
  activeInlineDropId.value = activeInlineDropId.value === id ? null : id
}

const copyValue = (val) => {
  if (!val || val === '-' || !String(val).trim()) return
  navigator.clipboard.writeText(String(val)).then(() => {
    toast.value = { show: true, msg: 'Skopiowano do schowka!' }
    setTimeout(() => { toast.value.show = false }, 2000)
  })
}

const openDiagnose = (id) => {
  if (!id) return
  selectedTicketIdForDiagnose.value = id
  showDiagnoseModal.value = true
}

const saveDiagnose = (updatedTicket) => {
  store.saveTicketToBase(updatedTicket)
  
  const idx = store.tickets.findIndex(x => String(x.id).toLowerCase() === String(updatedTicket.id).toLowerCase() || String(x.ticket_code).toLowerCase() === String(updatedTicket.ticket_code).toLowerCase())
  if(idx > -1) {
    store.tickets[idx] = updatedTicket
  }
  
  showDiagnoseModal.value = false
  toast.value = { show: true, msg: 'Zapisano diagnozę i części!' }
  setTimeout(() => { toast.value.show = false }, 3000)
}

const openSettlementFromDiagnose = (payload) => {
  showDiagnoseModal.value = false
  
  let ticketId = null
  let t = null
  
  if (typeof payload === 'object' && payload !== null) {
    ticketId = payload.id || payload.ticket_code
    t = payload
  } else {
    ticketId = payload
    const reqId = String(ticketId).toLowerCase().trim()
    t = store.tickets.find(x => String(x.id).toLowerCase().trim() === reqId || String(x.ticket_code).toLowerCase().trim() === reqId)
  }

  if (t) {
    const tIdx = store.tickets.findIndex(x => String(x.id) === String(t.id) || String(x.ticket_code) === String(t.ticket_code))
    if (tIdx > -1) store.tickets[tIdx] = t

    const reqId = String(t.id).toLowerCase().trim()
    const reqCode = String(t.ticket_code || t.id).toLowerCase().trim()
    const existsInBillings = billingsStore.billings.find(b => String(b.id).toLowerCase() === reqId || String(b.ticket_id).toLowerCase() === reqCode)
    
    if (!existsInBillings) {
      billingsStore.billings.unshift({
        ...JSON.parse(JSON.stringify(t)),
        billing_state: 'PRE_SETTLED', 
        ticket_status: 'Wstępnie rozliczone',
        status: 'Wstępnie rozliczone',
        total_eur: 0,
        saved_data: {
          raw_diagnoza: t.raw_diagnoza,
          notes: t.notes,
          parts_str: t.parts_str
        }
      })
    } else {
      existsInBillings.saved_data = existsInBillings.saved_data || {}
      existsInBillings.saved_data.raw_diagnoza = t.raw_diagnoza
      existsInBillings.saved_data.notes = t.notes
    }
  }

  selectedTicketIdForSettlement.value = ticketId
  setTimeout(() => {
    showSettlementModal.value = true
  }, 150)
}

const saveSettlement = (payload) => {
  showSettlementModal.value = false
  const tIdx = store.tickets.findIndex(t => String(t.id) === String(payload.raw_id) || String(t.ticket_code) === String(payload.raw_id))
  if (tIdx > -1) {
    store.tickets[tIdx].ticket_status = payload.ticket_status
    store.tickets[tIdx].status = payload.ticket_status
    store.tickets[tIdx].saved_data = JSON.parse(JSON.stringify(payload))
    toast.value = { show: true, msg: `Przekazano zgłoszenie do księgowości!` }
    setTimeout(() => { toast.value.show = false }, 3000)
  }
}

const switchModule = (mod) => {
  store.activeModule = mod
  store.activeTabId = 'ALL'
  currentPage.value = 1
  store.fetchTicketsData()
}

const sortBy = (colId) => {
  if (currentSort.value.col === colId) currentSort.value.dir = currentSort.value.dir === 'asc' ? 'desc' : 'asc'
  else { currentSort.value.col = colId; currentSort.value.dir = 'asc' }
}

const handleScroll = (e) => {
  const { scrollTop, scrollHeight, clientHeight } = e.target
  if (scrollTop + clientHeight >= scrollHeight - 200) {
    if (filteredTickets.value.length > currentPage.value * itemsPerPage) currentPage.value++
  }
}

const toggleSelectAll = () => {
  if (selectedIds.value.length === filteredTickets.value.length) selectedIds.value = []
  else selectedIds.value = filteredTickets.value.map(t => t.id)
}

const toggleSelectOne = (id) => {
  if (selectedIds.value.includes(id)) selectedIds.value = selectedIds.value.filter(x => x !== id)
  else selectedIds.value.push(id)
}

// =========================================================
// NAPRAWA: ZABEZPIECZENIE PRZED PROXY Z VUE W CZASIE ZAPISU
// =========================================================
const changeStatus = (ticket, newStatus) => {
  activeInlineDropId.value = null
  
  // 1. Zabezpieczenie! Tworzymy w 100% "czysty" obiekt, odcinając go od reaktywności Vue
  const safePlainTicket = JSON.parse(JSON.stringify(ticket))
  safePlainTicket.ticket_status = newStatus
  
  // Dbamy o to by zamknięte zlecenia nie wyświetlały się podwójnie
  if (['Zakończone', 'Rozliczone', 'Wykonano', 'Wstępnie rozliczone'].includes(newStatus)) {
    safePlainTicket.status = newStatus
  }

  // 2. Optymistycznie uaktualniamy oryginalny element w tablicy Store (aby widok zaktualizował się od ręki)
  const idx = store.tickets.findIndex(x => String(x.id) === String(ticket.id) || String(x.ticket_code) === String(ticket.ticket_code))
  if (idx > -1) {
    store.tickets[idx].ticket_status = newStatus
    if (['Zakończone', 'Rozliczone', 'Wykonano', 'Wstępnie rozliczone'].includes(newStatus)) {
      store.tickets[idx].status = newStatus
    }
  }

  // 3. Wysyłamy wyłącznie czysty, zserializowany obiekt do backendu! (ZERO CRASHY)
  store.saveTicketToBase(safePlainTicket)
  
  toast.value = { show: true, msg: newStatus ? `Status: ${newStatus}` : 'Wyczyszczono status' }
  setTimeout(() => { toast.value.show = false }, 2500)
}
// =========================================================

const massDelete = () => {
  confirmModal.value = {
    show: true, message: `Czy na pewno chcesz usunąć ${selectedIds.value.length} zgłoszeń?`,
    onConfirm: () => {
      selectedIds.value.forEach(id => store.deleteTicketFromBase(id))
      selectedIds.value = []
    }
  }
}

const executeConfirm = () => {
  if (confirmModal.value.onConfirm) confirmModal.value.onConfirm()
  confirmModal.value.show = false
}

const openAddTicketModal = () => {
  prefilledQp.value = ''
  showAddTicketModal.value = true
}

const saveNewTicket = (ticketPayload) => {
  store.saveTicketToBase(ticketPayload)
  showAddTicketModal.value = false
  toast.value = { show: true, msg: 'Utworzono zgłoszenie!' }
  setTimeout(() => { toast.value.show = false }, 3000)
}

const isClosedTicket = (t) => {
  const check = (str) => {
    let lower = String(str || '').toLowerCase()
    return lower.includes('zakończ') || lower.includes('close') || lower.includes('done') || 
           lower.includes('zrobione') || lower.includes('zamknięt') || lower.includes('anulowan') || lower.includes('cancel')
  }
  return check(t.status) || check(t.ticket_status)
}

const getBaseTickets = () => store.tickets.filter(t => store.activeModule === 'historia' ? isClosedTicket(t) : !isClosedTicket(t))
const baseTicketsCount = computed(() => getBaseTickets().length)

const evaluateQueries = (item, queries) => {
  const validSearch = queries?.filter(q => q.text.trim() !== '') || []
  if (validSearch.length === 0) return true
  let match = checkTicketSearch(item, validSearch[0].text)
  if (validSearch[0].logic === 'NOT') match = !match
  for (let i = 1; i < validSearch.length; i++) {
    const cMet = checkTicketSearch(item, validSearch[i].text)
    if (validSearch[i].logic === 'AND') match = match && cMet
    else if (validSearch[i].logic === 'OR') match = match || cMet
    else if (validSearch[i].logic === 'NOT') match = match && !cMet
  }
  return match
}

const tabCounts = computed(() => {
  const counts = {}
  if (!store.kpiTabs) return counts
  const baseTix = getBaseTickets()
  store.kpiTabs.forEach(tab => {
    if (tab.filter === 'ALL') counts[tab.id] = baseTix.length
    else if (tab.customQueries) counts[tab.id] = baseTix.filter(item => evaluateQueries(item, tab.customQueries)).length
    else counts[tab.id] = 0
  })
  return counts
})

const filteredTickets = computed(() => {
  let base = getBaseTickets()
  const activeTab = store.kpiTabs.find(t => t.id === store.activeTabId)
  if (activeTab && activeTab.id !== 'ALL' && activeTab.customQueries) {
    base = base.filter(item => evaluateQueries(item, activeTab.customQueries))
  }
  if (store.searchQueriesMain.some(q => q.text.trim() !== '')) {
    base = base.filter(item => evaluateQueries(item, store.searchQueriesMain))
  }
  if (currentSort.value.col) {
    base.sort((a, b) => {
      let valA = '', valB = ''
      const col = currentSort.value.col
      if (col === 'station') { valA = a.qp_id || a.station_id || ''; valB = b.qp_id || b.station_id || ''; }
      else if (col === 'tech_parts') { valA = a.technician_id || ''; valB = b.technician_id || ''; }
      else if (col === 'code') { valA = a.ticket_code || a.ticket_number || a.id || ''; valB = b.ticket_code || b.ticket_number || b.id || ''; }
      else if (col === 'used_parts') { valA = String(a.raw_info || '') + String(a.req_status || ''); valB = String(b.raw_info || '') + String(b.req_status || ''); }
      else if (col === 'diagnoza') { valA = String(a.raw_diagnoza || '') + String(a.notes || ''); valB = String(b.raw_diagnoza || '') + String(b.notes || ''); }
      else if (col === 'client_contact') { valA = a.client || ''; valB = b.client || ''; }
      else { valA = a[col] || ''; valB = b[col] || ''; }

      valA = String(valA).toLowerCase(); valB = String(valB).toLowerCase()
      if (valA < valB) return currentSort.value.dir === 'asc' ? -1 : 1
      if (valA > valB) return currentSort.value.dir === 'asc' ? 1 : -1
      return 0
    })
  }
  return base
})

const paginatedTickets = computed(() => filteredTickets.value.slice(0, currentPage.value * itemsPerPage))

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
  store.fetchTicketsData()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.ticket-custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.ticket-custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.ticket-custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.4); border-radius: 10px; }
.ticket-custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(88, 179, 71, 0.8); }
</style>