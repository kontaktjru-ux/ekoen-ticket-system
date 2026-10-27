<template>
  <div class="flex flex-col h-full bg-[#f4f6f8] relative z-10 overflow-auto custom-scrollbar" @click="closeAllDropdowns">
    
    <UniversalKpi 
      title="Magazyn i Flota"
      subtitle="Logistyka zasobów centralnych, mobilnych i zużyć."
      :views="[
        { label: 'Magazyn Centralny', value: 'zg_central' },
        { label: 'W Terenie', value: 'mobile' },
        { label: 'Historia Operacji', value: 'logs' }
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
    >
      <template #custom-tab-content="{ tab }">
        <div v-if="tab.id === 'LOW_STOCK'" class="overflow-hidden pr-2 flex-1 flex flex-col justify-center pointer-events-auto">
          <div class="flex items-center gap-1 mb-1 w-full overflow-hidden">
            <p class="text-[10px] font-black uppercase tracking-widest pointer-events-none truncate shrink-0" :class="tabCounts[tab.id] > 0 ? 'text-red-400' : 'text-slate-400'">Niski Stan (≤</p>
            <input type="number" min="0" max="99" v-model.number="store.lowStockThreshold" @click.stop @change="saveUserConfig" class="w-6 text-center font-black text-xs text-red-600 bg-transparent border-b border-red-200 hover:border-red-400 py-0 focus:outline-none shadow-none shrink-0 appearance-none m-0 transition-colors" title="Zmień limit" />
            <p class="text-[10px] font-black uppercase tracking-widest pointer-events-none shrink-0" :class="tabCounts[tab.id] > 0 ? 'text-red-400' : 'text-slate-400'">)</p>
          </div>
          <p class="text-3xl font-black pointer-events-none" :class="tabCounts[tab.id] > 0 ? 'text-red-600 animate-pulse' : 'text-slate-800'">{{ tabCounts[tab.id] }}</p>
        </div>
      </template>
    </UniversalKpi>

    <UniversalSearch 
      :queries="store.searchQueriesMain"
      placeholder="Szukaj części po nazwie, kodzie lub kategorii..."
      @add-row="store.searchQueriesMain.push({ id: 'sq_' + Date.now(), logic: 'AND', text: '' })"
      @remove-row="(id) => store.searchQueriesMain = store.searchQueriesMain.filter(q => q.id !== id)"
    >
      <template #actions>
        <div class="bg-slate-50 border border-slate-200/80 rounded-xl px-4 text-[11px] font-black tracking-wider uppercase text-slate-500 shadow-sm flex items-center gap-2 h-[42px] mr-2">
          <svg class="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          WIDOCZNYCH: <span class="text-[#58b347] font-black text-sm ml-1">{{ visibleCount }} / {{ store.activeModule === 'logs' ? store.logs.length : store.parts.length }}</span>
        </div>

        <button v-if="store.activeModule !== 'logs'" @click.stop="openAddPartModal" class="bg-[#58b347] text-white font-extrabold px-5 py-2.5 rounded-xl text-[13px] hover:bg-[#499b3a] shadow-md shadow-[#58b347]/20 transition-all flex items-center gap-2 h-[42px]">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Nowa Część
        </button>
      </template>
    </UniversalSearch>

    <div class="px-8 pt-6 pb-8 flex-1 flex items-start gap-6 relative shrink-0 min-h-0">
      
      <div v-if="store.isLoading" class="flex-1 flex flex-col gap-3 w-full">
        <div class="w-full bg-white border border-slate-100 rounded-2xl p-4 shadow-sm animate-pulse flex flex-col gap-4" v-for="n in 5" :key="n">
           <div class="h-10 bg-slate-200 rounded-xl w-full"></div>
        </div>
      </div>

      <StorageList 
        v-else
        :groupedParts="groupedParts" 
        :filteredLogs="filteredLogs"
        @toggle-category="toggleCategory"
        @lock-part="lockPart"
        @hover-part="hoverPart"
        @open-movement="openMovementModal"
      />

      <div v-show="store.activeModule !== 'logs'" class="w-[360px] xl:w-[420px] bg-white border border-slate-200/80 rounded-2xl flex flex-col shrink-0 shadow-sm overflow-hidden sticky top-0 transition-all h-[calc(100vh-140px)]">
        <template v-if="!activePartDetails">
          <div class="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400 bg-slate-50/50">
            <div class="w-16 h-16 bg-white border border-[#58b347]/20 rounded-2xl shadow-sm flex items-center justify-center text-[#58b347] mb-4">
              <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            </div>
            <p class="text-sm font-bold text-slate-600">Szczegóły elementu</p>
            <p class="mt-2 text-xs font-medium max-w-[200px] leading-relaxed">Najedź kursorem na część na liście, aby zobaczyć stany na oddziałach i w autach. Kliknij wiersz, aby go zablokować.</p>
          </div>
        </template>
        <template v-else>
          <div class="flex flex-col h-full bg-white relative">
            <div class="p-8 border-b border-slate-100 bg-slate-50/50 shrink-0 flex flex-col justify-center items-center text-center">
              <div class="absolute top-4 right-4 flex items-center gap-2">
                <button @click="openAddPartModal(activePartDetails)" class="text-slate-400 hover:text-[#58b347] bg-white border border-slate-200 p-2 rounded-xl shadow-sm transition-colors" title="Edytuj Część">
                   <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                </button>
              </div>
              <div class="w-12 h-12 bg-white rounded-xl border border-[#58b347]/20 shadow-sm flex items-center justify-center text-[#58b347] mb-4">
                <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
              </div>
              <div class="text-[9px] font-extrabold text-[#58b347] uppercase tracking-widest mb-2">{{ activePartDetails.category || 'Inne' }}</div>
              <h2 class="text-[15px] font-black text-slate-900 leading-snug px-4">{{ activePartDetails.name }}</h2>
              <div class="text-[10px] font-bold font-mono text-slate-500 bg-white border border-slate-200 px-4 py-1.5 rounded-full uppercase tracking-wider mt-4 shadow-sm">{{ activePartDetails.id_sku || activePartDetails.sku }}</div>
            </div>

            <div class="p-6 border-b border-slate-100 shrink-0 bg-white grid grid-cols-2 gap-2 text-center">
              <div class="border border-slate-200 rounded-xl p-2 bg-slate-50">
                <p class="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Magazyn Centralny</p>
                <p class="text-lg font-black text-slate-800">{{ parseInt(activePartDetails.zg_stock) || 0 }}</p>
              </div>
              <div class="border border-red-200 rounded-xl p-2 bg-red-50">
                <p class="text-[9px] font-extrabold text-red-400 uppercase tracking-widest mb-1">Zużyte łącznie</p>
                <p class="text-lg font-black text-red-600">{{ parseInt(activePartDetails.used_stock) > 0 ? parseInt(activePartDetails.used_stock) : '-' }}</p>
              </div>
            </div>

            <div class="flex-1 overflow-y-auto bg-slate-50/50 custom-scrollbar">
              <div class="px-6 py-4 bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase border-b border-slate-100 tracking-widest sticky top-0 z-10 shadow-sm">Zapas w autach ({{ totalMobileStock }} szt.):</div>
              <div class="flex flex-col">
                <div v-if="mobileBreakdown.length === 0" class="p-8 text-center text-xs font-bold text-slate-400">Brak wyposażenia u techników.</div>
                <div v-else v-for="mob in mobileBreakdown" :key="mob.techId" class="flex items-start justify-between px-6 py-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-none">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-[12px] text-white font-black text-sm flex items-center justify-center shadow-sm shrink-0" :style="`background-color: ${mob.color}`">{{ getInitials(mob.techName) }}</div>
                    <div class="flex flex-col text-[11px] font-black text-slate-800 uppercase tracking-widest leading-tight">
                      <span>{{ mob.firstName }}</span>
                      <span>{{ mob.lastName }}</span>
                    </div>
                  </div>
                  <div class="flex flex-col items-end gap-2">
                    <div class="text-[12px] font-black text-slate-700 bg-white border border-slate-200 px-3 py-1 rounded-xl shadow-sm">
                      {{ mob.qty }} <span class="text-[9px] uppercase text-slate-400 font-bold">{{ activePartDetails.unit || 'szt.' }}</span>
                    </div>
                    <div class="flex gap-1.5">
                       <button @click="openMovementModal(activePartDetails, 'PRZESUNIECIE', mob.techId, 'ZG')" class="text-[8px] font-extrabold text-slate-500 bg-white border border-slate-200 px-2 py-1.5 rounded-lg uppercase tracking-widest hover:text-blue-600 hover:border-blue-300 transition-colors shadow-sm">NA MAGAZYN</button>
                       <button @click="openMovementModal(activePartDetails, 'ZUZYCIE', mob.techId, null)" class="text-[8px] font-extrabold text-slate-500 bg-white border border-slate-200 px-2 py-1.5 rounded-lg uppercase tracking-widest hover:text-red-600 hover:border-red-300 transition-colors shadow-sm">ZUŻYCIE</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

    </div>

    <!-- POWIADOMIENIE TOAST -->
    <div v-show="toast.show" class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-[#58b347] text-white px-8 py-3.5 rounded-full shadow-[0_10px_30px_rgba(88,179,71,0.5)] flex items-center justify-center gap-3 border border-[#499b3a] transition-all duration-300">
      <svg class="w-5 h-5 shrink-0 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6L9 17l-5-5" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span class="text-[13px] font-black uppercase tracking-widest whitespace-nowrap">{{ toast.msg }}</span>
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
    
    <!-- Uniwersalny Modal Ruchu -->
    <StorageMovementModal
      :show="showMovementModal"
      :preselectedPart="operationPart"
      :preselectedOpType="operationOpType"
      :preselectedSource="operationSource"
      :preselectedDest="operationDest"
      @close="showMovementModal = false"
      @save="confirmMovement"
    />

    <!-- Modal Zaślepka dla Tworzenia Nowej Części -->
    <div v-if="showAddPartModal" class="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn">
      <div class="bg-white rounded-[20px] shadow-2xl w-full max-w-[500px] overflow-hidden border border-slate-200">
        <div class="px-6 py-5 flex justify-between items-center border-b border-slate-100 bg-slate-50/50">
          <h3 class="text-[13px] font-black text-[#58b347] uppercase tracking-widest flex items-center gap-2">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> KREATOR NOWEJ CZĘŚCI
          </h3>
          <button @click="showAddPartModal = false" class="text-slate-400 hover:text-slate-700 transition-colors bg-white p-2 border border-slate-200 rounded-xl shadow-sm">✕</button>
        </div>
        <div class="p-8 text-center bg-white">
          <h4 class="text-lg font-black text-slate-800 mb-2">Formularz dodawania części</h4>
          <p class="text-xs text-slate-500 font-medium leading-relaxed">Tu wyrenderuje się zewnętrzny modal Modal_AddParts.</p>
        </div>
        <div class="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
          <button @click="showAddPartModal = false" class="w-full bg-white border border-slate-200 text-slate-600 font-extrabold py-3.5 rounded-xl text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors shadow-sm">ZAMKNIJ</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStorageStore } from '../../stores/useStorageStore'
import { useSearchFilters } from '../../composables/useSearchFilters'

import UniversalKpi from '../../common/UniversalKpi.vue'
import UniversalSearch from '../../common/UniversalSearch.vue'
import StorageList from './StorageList.vue'
import UniversalTabModal from '../../common/UniversalTabModal.vue'
import ConfirmModal from '../../common/ConfirmModal.vue'
import StorageMovementModal from '../../modals/StorageMovementModal.vue'

const store = useStorageStore()

const checkStorageSearch = (item, queryText) => {
  const q = String(queryText).toLowerCase().trim()
  if (!q) return true
  const superString = [
      item.name, item.id_sku, item.sku, item.category, item.serial_number, item.operation_type, item.source, item.technician_id, item.destination
  ].filter(Boolean).join(' | ').toLowerCase()
  return superString.includes(q)
}

const toast = ref({ show: false, msg: '' })
const showTabModal = ref(false)
const editingTabId = ref(null)
const modalForm = ref({ name: "", color: "#58b347", iconPreviewBase64: "", selectedIconName: "" })
const searchQueriesModal = ref([{ id: 'd_' + Date.now(), logic: 'AND', text: '' }])
const confirmModal = ref({ show: false, message: "", onConfirm: null })

const showMovementModal = ref(false)
const showAddPartModal = ref(false)

// Payload do modalu
const operationPart = ref(null)
const operationOpType = ref('PRZESUNIECIE')
const operationSource = ref(null)
const operationDest = ref(null)

const evaluateQueries = (item, queries) => {
  const validSearch = queries?.filter(q => q.text.trim() !== '') || []
  if (validSearch.length === 0) return true

  let match = checkStorageSearch(item, validSearch[0].text)
  if (validSearch[0].logic === 'NOT') match = !match
  
  for (let i = 1; i < validSearch.length; i++) {
    const cMet = checkStorageSearch(item, validSearch[i].text)
    if (validSearch[i].logic === 'AND') match = match && cMet
    else if (validSearch[i].logic === 'OR') match = match || cMet
    else if (validSearch[i].logic === 'NOT') match = match && !cMet
  }
  return match
}

const tabCounts = computed(() => {
  const counts = {}
  if (!store.kpiTabs) return counts
  
  const baseData = store.activeModule === 'logs' ? store.logs : store.parts
  
  store.kpiTabs.forEach(tab => {
    if (tab.filter === 'ALL') {
      if (store.activeModule === 'mobile') {
        let techNames = store.techs.map(t => t.name)
        counts[tab.id] = baseData.reduce((sum, p) => sum + techNames.reduce((tSum, tn) => tSum + (parseInt(p[tn]) || 0), 0), 0)
      } else {
        counts[tab.id] = baseData.length
      }
    } else if (tab.filter === 'LOW_STOCK') {
       counts[tab.id] = baseData.filter(p => (parseInt(p.zg_stock) || 0) <= store.lowStockThreshold).length
    } else if (tab.customQueries) {
      const filtered = baseData.filter(item => evaluateQueries(item, tab.customQueries))
      if (store.activeModule === 'mobile') {
        let techNames = store.techs.map(t => t.name)
        counts[tab.id] = filtered.reduce((sum, p) => sum + techNames.reduce((tSum, tn) => tSum + (parseInt(p[tn]) || 0), 0), 0)
      } else {
        counts[tab.id] = filtered.length
      }
    } else {
      counts[tab.id] = 0
    }
  })
  return counts
})

const filteredParts = computed(() => {
  if (store.activeModule === 'logs') return []
  
  let base = store.parts
  const activeTab = store.kpiTabs.find(t => t.id === store.activeTabId)
  
  if (activeTab) {
    if (activeTab.filter === 'LOW_STOCK') {
      base = base.filter(p => (parseInt(p.zg_stock) || 0) <= store.lowStockThreshold)
    } else if (activeTab.id !== 'ALL' && activeTab.customQueries) {
      base = base.filter(item => evaluateQueries(item, activeTab.customQueries))
    }
  }

  if (store.searchQueriesMain.some(q => q.text.trim() !== '')) {
    base = base.filter(item => evaluateQueries(item, store.searchQueriesMain))
  }

  return base
})

const filteredLogs = computed(() => {
  if (store.activeModule !== 'logs') return []
  let base = store.logs
  const activeTab = store.kpiTabs.find(t => t.id === store.activeTabId)
  if (activeTab && activeTab.id !== 'ALL' && activeTab.customQueries) {
    base = base.filter(item => evaluateQueries(item, activeTab.customQueries))
  }
  if (store.searchQueriesMain.some(q => q.text.trim() !== '')) {
    base = base.filter(item => evaluateQueries(item, store.searchQueriesMain))
  }
  return base
})

const visibleCount = computed(() => {
  if (store.activeModule === 'logs') return filteredLogs.value.length
  if (store.activeModule === 'mobile') {
     let techNames = store.techs.map(t => t.name)
     return filteredParts.value.reduce((sum, p) => sum + techNames.reduce((tSum, tn) => tSum + (parseInt(p[tn]) || 0), 0), 0)
  }
  return filteredParts.value.length
})

const groupedParts = computed(() => {
  if (store.activeModule === 'logs') return []
  const isCatalog = store.activeModule === 'zg_central'

  let groups = []

  if (isCatalog) {
    groups.push({ id: 'WIDOK OGÓLNY (WSZYSTKIE CZĘŚCI)', name: 'WIDOK OGÓLNY (WSZYSTKIE CZĘŚCI)', items: filteredParts.value, color: null })
    const categoriesRaw = [...new Set(filteredParts.value.map(p => p.category || 'Inne'))].sort()
    categoriesRaw.forEach(cat => {
      groups.push({ id: cat, name: cat, items: filteredParts.value.filter(p => (p.category || 'Inne') === cat), color: null })
    })
  } else {
    let allMobileItemsMap = new Map()
    store.techs.forEach(tech => {
      let techItems = filteredParts.value.filter(p => (parseInt(p[tech.name]) || 0) > 0)
      techItems.forEach(p => {
        if (!allMobileItemsMap.has(p.id)) {
          allMobileItemsMap.set(p.id, { ...p, stockOverride: parseInt(p[tech.name]) || 0 })
        } else {
          let existing = allMobileItemsMap.get(p.id)
          existing.stockOverride += parseInt(p[tech.name]) || 0
        }
      })
    })
    
    let allMobileItems = Array.from(allMobileItemsMap.values())
    groups.push({ id: 'WIDOK OGÓLNY (WSZYSTKIE CZĘŚCI)', name: 'Wszystkie Części W Terenie', items: allMobileItems, color: null })

    store.techs.forEach(tech => {
      let items = filteredParts.value.filter(p => (parseInt(p[tech.name]) || 0) > 0).map(p => ({ ...p, stockOverride: parseInt(p[tech.name]) || 0 }))
      groups.push({ id: tech.id, name: tech.name, color: tech.zone_color || tech.color || '#94a3b8', items: items })
    })
  }

  return groups.filter(g => g.items.length > 0 || g.id === 'WIDOK OGÓLNY (WSZYSTKIE CZĘŚCI)')
})

const getInitials = (name) => {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const toggleCategory = (id) => {
  let targetArr = store.activeModule === 'zg_central' ? store.expandedCategoriesZG : store.expandedCategoriesMobile
  if (targetArr) {
    if (targetArr.includes(id)) {
      targetArr.splice(targetArr.indexOf(id), 1)
    } else {
      targetArr.push(id)
    }
  }
}

const hoverPart = (id) => {
  if (!store.lockedPartId) store.hoveredPartId = id
}
const lockPart = (id) => {
  if (store.lockedPartId === id) store.lockedPartId = null
  else store.lockedPartId = id
}

const activePartDetails = computed(() => {
  const targetId = store.lockedPartId || store.hoveredPartId
  if (!targetId) return null
  return store.parts.find(x => String(x.id_sku) === String(targetId) || String(x.id) === String(targetId) || String(x.sku) === String(targetId))
})

const mobileBreakdown = computed(() => {
  if (!activePartDetails.value) return []
  let breakdown = []
  store.techs.forEach(tech => {
    const qty = parseInt(activePartDetails.value[tech.name]) || 0
    if (qty > 0) {
      const nameParts = tech.name.trim().split(/\s+/)
      breakdown.push({
        techId: tech.id,
        techName: tech.name,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        color: tech.zone_color || tech.color || '#58b347',
        qty: qty
      })
    }
  })
  return breakdown
})

const totalMobileStock = computed(() => mobileBreakdown.value.reduce((sum, item) => sum + item.qty, 0))

const openMovementModal = (part, opType, source, dest) => {
  operationPart.value = part
  operationOpType.value = opType
  operationSource.value = source
  operationDest.value = dest
  showMovementModal.value = true
}

const confirmMovement = (payload) => {
  store.saveOperationToCloud(payload, () => {
    showMovementModal.value = false
    toast.value = { show: true, msg: 'Operacja zapisana pomyślnie!' }
    setTimeout(() => { toast.value.show = false }, 3000)
  })
}

const openAddPartModal = (partToEdit = null) => {
  if (typeof window.Modal_AddParts === 'function') {
    window.Modal_AddParts(partToEdit ? encodeURIComponent(partToEdit.id_sku || partToEdit.sku) : '', partToEdit !== null)
  } else {
    showAddPartModal.value = true
  }
}

const switchModule = (mod) => {
  store.activeModule = mod
  store.activeTabId = 'ALL'
  store.hoveredPartId = null
  store.lockedPartId = null
  store.fetchStorageData()
}

const closeAllDropdowns = () => {}

const setActiveTab = (id) => {
  store.activeTabId = store.activeTabId === id && id !== 'ALL' && id !== 'LOW_STOCK' ? 'ALL' : id
  saveUserConfig()
}

const openNewTabModal = () => {
  editingTabId.value = null
  modalForm.value = { name: "", color: "#58b347", iconPreviewBase64: "", selectedIconName: "" }
  searchQueriesModal.value = [{ id: 'd_' + Date.now(), logic: 'AND', text: '' }]
  showTabModal.value = true
}

const editTab = (tab) => {
  if (tab.filter === 'ALL' || tab.filter === 'LOW_STOCK') return
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
  store.fetchStorageData()
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.4); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(88, 179, 71, 0.8); }
</style>