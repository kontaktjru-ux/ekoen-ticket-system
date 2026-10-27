<template>
  <div class="flex flex-col h-full bg-[#f4f6f8] relative z-10 overflow-hidden text-slate-800" @click="handleGlobalClick" @dragover.prevent @drop="onGlobalDrop">
    
    <UniversalKpi 
      title="Harmonogram Serwisowy"
      subtitle="Zarządzanie widokiem, filtrami oraz przypisywanie zgłoszeń do techników."
      :views="[
        { label: 'Miesiąc', value: 'month' },
        { label: 'Tydzień', value: 'week' },
        { label: 'Dzień', value: 'day' }
      ]"
      :activeView="store.currentView"
      @switch-view="v => { store.currentView = v; focusToday() }"
      :activeTabId="store.activeTabId"
      :tabs="store.kpiTabs"
      :tabCounts="store.kpiTabs.reduce((acc, tab) => { acc[tab.id] = getTabCount(tab); return acc; }, {})"
      @select-tab="id => { store.activeTabId = store.activeTabId === id && id !== 'ALL' ? 'ALL' : id; store.saveTabsConfiguration() }"
      @open-modal="openNewTabModal"
      @edit-tab="editTab"
      @delete-tab="confirmDeleteTab"
      @reorder-tabs="handleReorderTabs"
    />

    <UniversalSearch 
      :queries="store.searchQueriesMain"
      placeholder="Szukaj w backlogu (np. WROCŁAW, Nazwa firmy)..."
      @add-row="store.searchQueriesMain.push({ id: 'm_' + Date.now(), logic: 'AND', text: '' })"
      @remove-row="(id) => store.searchQueriesMain = store.searchQueriesMain.filter(q => q.id !== id)"
    >
      <template #actions>
        <div class="relative w-[240px] shrink-0" @click.self="isTechDropdownOpen = false">
          <button @click.stop="isTechDropdownOpen = !isTechDropdownOpen" class="w-full bg-white border border-slate-200 text-slate-700 font-extrabold px-5 py-2.5 rounded-xl text-[12px] hover:border-[#58b347] transition-all flex items-center justify-between gap-2 h-[42px] shadow-sm">
            <div class="flex items-center gap-2 truncate">
              <span class="w-2 h-2 rounded-full shrink-0" :style="`background-color: ${currentTechColor};`"></span>
              <span class="truncate uppercase tracking-widest text-[11px]">{{ currentTechName }}</span>
            </div>
            <svg class="w-4 h-4 text-slate-400 transition-transform duration-200" :class="isTechDropdownOpen ? 'rotate-180 text-[#58b347]' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          
          <transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 -translate-y-2" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-2">
            <div v-show="isTechDropdownOpen" class="absolute top-full right-0 mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-xl z-[100] overflow-hidden flex flex-col max-h-64 overflow-y-auto schedule-custom-scrollbar">
              <div @click="selectTech('ALL')" class="px-5 py-3 text-[11px] font-black uppercase tracking-widest cursor-pointer hover:bg-slate-50 border-b border-slate-100" :class="store.selectedTechId === 'ALL' ? 'text-[#58b347] bg-[#f2fcf2]' : 'text-slate-600'">CAŁA FLOTA (WSZYSCY)</div>
              <div v-for="tech in store.techList" :key="tech.id" @click="selectTech(tech.id)" class="px-5 py-3 text-[11px] font-black uppercase tracking-widest cursor-pointer hover:bg-slate-50 border-b border-slate-100 flex items-center gap-2" :class="store.selectedTechId === tech.id ? 'text-[#58b347] bg-[#f2fcf2]' : 'text-slate-600'">
                <span class="w-2 h-2 rounded-full shrink-0" :style="`background-color: ${tech.zone_color || tech.color || '#cbd5e1'};`"></span> {{ tech.name }}
              </div>
            </div>
          </transition>
        </div>
      </template>
    </UniversalSearch>

    <!-- ZEWNĘTRZNY KOMPONENT WIDOKU HARMONOGRAMU -->
    <ScheduleList 
      ref="scheduleListRef"
      :filteredTickets="filteredTickets"
      :totalBacklogCount="totalBacklogCount"
      @rotate-view="rotateView"
      @confirm-delete-event="confirmDeleteEvent"
    />

    <!-- MODALE -->
    <UniversalTabModal 
      :show="showTabModal" :isEditing="!!editingTabId" :form="modalForm" :searchQueries="searchQueriesModal"
      @close="showTabModal = false" @save="saveTab"
    />

    <ConfirmModal 
      :show="confirmModal.show" :message="confirmModal.message"
      @cancel="confirmModal.show = false" @confirm="executeConfirm"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useScheduleStore } from '../../stores/useScheduleStore'
import { useSearchFilters } from '../../composables/useSearchFilters'

import UniversalKpi from '../../common/UniversalKpi.vue'
import UniversalSearch from '../../common/UniversalSearch.vue'
import UniversalTabModal from '../../common/UniversalTabModal.vue'
import ConfirmModal from '../../common/ConfirmModal.vue'
import ScheduleList from './ScheduleList.vue' // <-- IMPORTUJEMY KOMPONENT LISTY

const store = useScheduleStore()
const { checkTicketSearch } = useSearchFilters()

const scheduleListRef = ref(null)
const confirmModal = ref({ show: false, message: "", onConfirm: null })

const isTechDropdownOpen = ref(false)
const handleGlobalClick = () => { isTechDropdownOpen.value = false }

// Przekazywanie komend do komponentu-dziecka
const focusToday = () => {
  if (scheduleListRef.value) scheduleListRef.value.focusToday()
}
const onGlobalDrop = () => {
  if (scheduleListRef.value) scheduleListRef.value.onGlobalDragEnd()
}

const rotateView = () => {
  if (store.currentView === 'month') store.currentView = 'week'
  else if (store.currentView === 'week') store.currentView = 'day'
  else store.currentView = 'month'
  focusToday()
}

// LOGIKA MODALU FILTRÓW
const showTabModal = ref(false)
const editingTabId = ref(null)
const modalForm = ref({ name: "", color: "#58b347", iconPreviewBase64: "", selectedIconName: "" })
const searchQueriesModal = ref([{ id: 'd_' + Date.now(), logic: 'AND', text: '' }])

const openNewTabModal = () => {
  editingTabId.value = null
  modalForm.value = { name: "", color: "#58b347", iconPreviewBase64: "PHN2ZyBjbGFzcz0idy02IGgtNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGxpbmUgeDE9IjgiIHkxPSI2IiB4Mj0iMjEiIHkyPSI2Ii8+PGxpbmUgeDE9IjgiIHkxPSIxMiIgeDI9IjIxIiB5Mj0iMTIiLz48bGluZSB4MT0iOCIgeTE9IjE4IiB4Mj0iMjEiIHkyPSIxOCIvPjxsaW5lIHgxPSIzIiB5MT0iNiIgeDI9IjMuMDEiIHkyPSI2Ii8+PGxpbmUgeDE9IjMiIHkxPSIxMiIgeDI9IjMuMDEiIHkyPSIxMiIvPjxsaW5lIHgxPSIzIiB5MT0iMTgiIHgyPSIzLjAxIiB5Mj0iMTgiLz48L3N2Zz4=", selectedIconName: "" }
  searchQueriesModal.value = [{ id: 'd_' + Date.now(), logic: 'AND', text: '' }]
  showTabModal.value = true
}

const editTab = (tab) => {
  if (tab.filter !== 'CUSTOM') return
  editingTabId.value = tab.id
  modalForm.value = { name: tab.name, color: tab.color, iconPreviewBase64: tab.icon, selectedIconName: "" }
  searchQueriesModal.value = tab.customQueries && tab.customQueries.length ? JSON.parse(JSON.stringify(tab.customQueries)) : [{ id: 'd_' + Date.now(), logic: 'AND', text: '' }]
  showTabModal.value = true
}

const confirmDeleteTab = (id) => {
  confirmModal.value = {
    show: true, message: "Usunąć ten filtr (zakładkę)?",
    onConfirm: () => {
      store.kpiTabs = store.kpiTabs.filter(t => t.id !== id)
      if (store.activeTabId === id) store.activeTabId = 'ALL'
      store.saveTabsConfiguration()
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
  store.saveTabsConfiguration()
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
    store.saveTabsConfiguration()
  }
}

// LOGIKA WYBORU TECHNIKA
const currentTechName = computed(() => {
  if (store.selectedTechId === 'ALL') return 'CAŁA FLOTA (WSZYSCY)'
  const tech = store.techList.find(t => t.id === store.selectedTechId)
  return tech ? tech.name : 'CAŁA FLOTA (WSZYSCY)'
})

const currentTechColor = computed(() => {
  if (store.selectedTechId === 'ALL') return '#cbd5e1'
  const tech = store.techList.find(t => t.id === store.selectedTechId)
  return tech ? (tech.zone_color || tech.color) : '#cbd5e1'
})

const selectTech = (id) => {
  store.selectedTechId = id
  isTechDropdownOpen.value = false
}

// OBLICZENIA I FILTROWANIE DANYCH
const excludedStatuses = ['ZAMKNIĘTE', 'ANULOWANE', 'OCZEKUJE NA RAPORT', 'WYKONANE', 'ROZLICZONE']

const isValidBacklogTicket = (d, assignedIds) => {
  if (assignedIds.includes(d.t_id) || assignedIds.includes(d.t_code)) return false
  if (d.t_is_closed) return false
  const status = String(d.t_status || '').toUpperCase()
  if (excludedStatuses.includes(status)) return false
  return true
}

const totalBacklogCount = computed(() => {
  let assignedIds = store.events.map(ev => ev.ticket_id)
  return store.tickets.filter(d => isValidBacklogTicket(d, assignedIds)).length
})

const getTabCount = (tab) => {
  let assignedIds = store.events.map(ev => ev.ticket_id)
  let unassignedTickets = store.tickets.filter(d => isValidBacklogTicket(d, assignedIds))
  
  if (tab.filter === "ALL") return unassignedTickets.length
  if (tab.filter === "URGENT") return unassignedTickets.filter(d => d.slaLeft < 24).length
  if (tab.filter === "TODAY") {
    const todayStr = new Date().toISOString().split('T')[0]
    return store.events.filter(x => x.start_time && x.start_time.startsWith(todayStr)).length
  }
  if (tab.filter === "CUSTOM") {
    return unassignedTickets.filter(d => {
      const validQ = tab.customQueries ? tab.customQueries.filter(q => q.text.trim() !== '') : []
      if (validQ.length !== 0) {
        let match = checkTicketSearch(d, validQ[0].text)
        if (validQ[0].logic === 'NOT') match = !match
        for (let i = 1; i < validQ.length; i++) {
          const cMet = checkTicketSearch(d, validQ[i].text)
          if (validQ[i].logic === 'AND') match = match && cMet
          else if (validQ[i].logic === 'OR') match = match || cMet
          else if (validQ[i].logic === 'NOT') match = match && !cMet
        }
        return match
      }
      return true
    }).length
  }
  return 0
}

const filteredTickets = computed(() => {
  let assignedIds = store.events.map(ev => ev.ticket_id)
  let base = store.tickets.filter(d => isValidBacklogTicket(d, assignedIds))
  
  const activeTab = store.kpiTabs.find(t => t.id === store.activeTabId)
  if (activeTab) {
    if (activeTab.filter === "URGENT") base = base.filter(d => d.slaLeft < 24)
    else if (activeTab.filter === "TODAY") base = []
    else if (activeTab.filter === "CUSTOM") {
      base = base.filter(d => {
        const validQ = activeTab.customQueries ? activeTab.customQueries.filter(q => q.text.trim() !== '') : []
        if (validQ.length !== 0) {
          let match = checkTicketSearch(d, validQ[0].text)
          if (validQ[0].logic === 'NOT') match = !match
          for (let i = 1; i < validQ.length; i++) {
            const cMet = checkTicketSearch(d, validQ[i].text)
            if (validQ[i].logic === 'AND') match = match && cMet
            else if (validQ[i].logic === 'OR') match = match || cMet
            else if (validQ[i].logic === 'NOT') match = match && !cMet
          }
          return match
        }
        return true
      })
    }
  }

  const validSearch = store.searchQueriesMain.filter(q => q.text.trim() !== '')
  if (validSearch.length !== 0) {
    base = base.filter(d => {
      let match = checkTicketSearch(d, validSearch[0].text)
      if (validSearch[0].logic === 'NOT') match = !match
      for (let i = 1; i < validSearch.length; i++) {
        const cMet = checkTicketSearch(d, validSearch[i].text)
        if (validSearch[i].logic === 'AND') match = match && cMet
        else if (validSearch[i].logic === 'OR') match = match || cMet
        else if (validSearch[i].logic === 'NOT') match = match && !cMet
      }
      return match
    })
  }
  return base.sort((a,b) => a.slaLeft - b.slaLeft)
})

const confirmDeleteEvent = (id) => {
  confirmModal.value = {
    show: true, message: "Czy na pewno chcesz usunąć tę wizytę z kalendarza? Zgłoszenie wróci do Backlogu.",
    onConfirm: () => { store.deleteEventFromCloud(id) }
  }
}

const executeConfirm = () => {
  if (confirmModal.value.onConfirm) confirmModal.value.onConfirm()
  confirmModal.value.show = false
}

onMounted(() => {
  store.fetchScheduleData()
  setTimeout(focusToday, 300)
})
</script>

<style scoped>
.schedule-custom-scrollbar::-webkit-scrollbar { width: 6px; }
.schedule-custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.schedule-custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.4); border-radius: 10px; }
.schedule-custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(88, 179, 71, 0.8); }
</style>