<template>
  <div v-if="show" @click.self="$emit('close')" class="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-fadeIn pt-20">
    <div class="relative w-full max-w-[1400px]">
      
      <!-- KONTENER NA ZAKŁADKI WIZYT (WIZYTA I, II, III...) -->
      <div class="absolute bottom-[calc(100%-1px)] left-8 flex items-end gap-1.5 overflow-x-auto overflow-y-hidden z-[30] pointer-events-auto max-w-[calc(100%-4rem)] ticket-custom-scrollbar">
        <div 
          v-for="(v, idx) in visits" 
          :key="v.id" 
          @click="switchVisit(v.id)" 
          class="text-[11px] tracking-widest uppercase flex items-center justify-center relative transition-all"
          :class="v.id === activeVisitId ? 'bg-white text-[#58b347] font-black z-[50] pt-4 pb-[16px] px-8 border-l border-t border-r border-slate-200 border-b-white translate-y-[2px] rounded-t-[16px]' : 'bg-slate-200/90 text-slate-500 font-bold z-[10] hover:bg-slate-300 hover:text-slate-700 cursor-pointer pt-3 pb-3 px-6 border border-slate-300/80 rounded-t-[16px]'"
        >
          WIZYTA {{ v.label }}
          
          <!-- Przycisk usuwania wizyty -->
          <div 
            v-if="v.id === activeVisitId && idx > 0" 
            @click.stop="deleteVisit(v.id)" 
            class="absolute top-1.5 right-1.5 w-4 h-4 flex items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 hover:scale-110 transition-all shadow-sm cursor-pointer" 
            title="Usuń wizytę"
          >
            <svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </div>
        </div>

        <button @click="addVisit" class="pt-3 pb-3 px-6 rounded-t-[16px] border border-[#499b3a] text-[10px] font-black text-white bg-[#58b347] hover:bg-[#499b3a] transition-all cursor-pointer flex items-center justify-center gap-1.5 z-[10] ml-1 shrink-0">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          DODAJ WIZYTĘ
        </button>
      </div>

      <!-- GŁÓWNY KONTENER MODALA -->
      <div class="bg-white rounded-[24px] w-full overflow-hidden flex flex-col max-h-[90vh] relative z-20 shadow-[0_0_40px_rgba(0,0,0,0.15)] border-t border-t-transparent border-l border-r border-b border-slate-200">

        <!-- Nagłówek Modala -->
        <div class="px-8 py-5 flex justify-between items-start bg-white shrink-0 relative z-30">
          <div>
            <h3 class="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
              <svg class="w-5 h-5 text-[#58b347]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              DIAGNOZA I CZĘŚCI
            </h3>
            <p class="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{{ currentTicketCode }}</p>
          </div>
          <button @click="$emit('close')" class="text-slate-400 hover:text-red-500 transition-colors bg-white border border-slate-200 p-2 rounded-xl shadow-sm">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="w-full h-px bg-slate-100 shrink-0"></div>

        <!-- Ciało Modala (Grid 3-kolumnowy) -->
        <div class="flex-1 overflow-y-auto ticket-custom-scrollbar p-6 bg-[#f4f6f8]">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start h-full">

            <!-- KOLUMNA 1: Diagnoza i Notatki -->
            <div class="flex flex-col gap-4">
              <div class="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                <button @click="accState.diag = !accState.diag" class="w-full px-5 py-4 bg-slate-50/80 hover:bg-slate-100/80 flex items-center justify-between border-b border-slate-100 transition-colors text-left">
                  <span class="text-xs font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
                    <svg class="w-4 h-4 text-[#58b347]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                    Diagnoza Usterki *
                  </span>
                  <svg class="w-4 h-4 text-slate-400 transition-transform duration-200" :class="accState.diag ? 'rotate-180' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                <div v-show="accState.diag" class="p-4">
                  <textarea v-model="activeVisit.diag" placeholder="Opisz dokładnie rozpoznaną usterkę..." class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#58b347] transition-colors resize-none ticket-custom-scrollbar min-h-[140px]"></textarea>
                </div>
              </div>

              <div class="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
                <button @click="accState.notes = !accState.notes" class="w-full px-5 py-4 bg-slate-50/80 hover:bg-slate-100/80 flex items-center justify-between border-b border-slate-100 transition-colors text-left">
                  <span class="text-xs font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
                    <svg class="w-4 h-4 text-[#58b347]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Komentarz Dodatkowy
                  </span>
                  <svg class="w-4 h-4 text-slate-400 transition-transform duration-200" :class="accState.notes ? 'rotate-180' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                <div v-show="accState.notes" class="p-4">
                  <textarea v-model="activeVisit.notes" placeholder="Wprowadź dodatkowe uwagi..." class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#58b347] transition-colors resize-none ticket-custom-scrollbar min-h-[120px]"></textarea>
                </div>
              </div>
            </div>

            <!-- KOLUMNA 2: Lista Wybranych Części i Wyszukiwarka -->
            <div class="flex flex-col gap-4 h-full">
              <div class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm h-full flex flex-col">
                
                <div class="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                  <h4 class="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    Pobranie z Magazynu
                  </h4>
                  <div class="flex bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200/60 gap-1">
                    <button @click="warehouseType = 'terenowy'" class="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all" :class="warehouseType === 'terenowy' ? 'bg-white text-[#58b347] shadow-sm' : 'text-slate-400 hover:text-slate-600'">Terenowy</button>
                    <button @click="warehouseType = 'zg_stock'" class="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all" :class="warehouseType === 'zg_stock' ? 'bg-white text-[#58b347] shadow-sm' : 'text-slate-400 hover:text-slate-600'">Zielona Góra</button>
                    <button @click="warehouseType = 'wa_stock'" class="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all" :class="warehouseType === 'wa_stock' ? 'bg-white text-[#58b347] shadow-sm' : 'text-slate-400 hover:text-slate-600'">Warszawa</button>
                  </div>
                </div>

                <div class="relative mb-4">
                  <div class="relative">
                     <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                     </div>
                     <input type="text" v-model="partSearchQuery" @keydown.enter.prevent="addCustomPart(partSearchQuery)" placeholder="Awaryjne szukanie (Nazwa / SKU)..." class="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#58b347]" />
                  </div>
                  
                  <!-- Dropdown Wyszukiwarki Części -->
                  <div v-if="partSearchResults.length > 0 || partSearchQuery.trim()" class="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto ticket-custom-scrollbar divide-y divide-slate-100">
                    <div v-for="m in partSearchResults" :key="m.sku" @click="selectPart(m.name, m.sku)" class="p-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors group">
                      <div class="flex flex-col min-w-0 pr-3">
                        <span class="text-xs font-bold text-slate-700 truncate group-hover:text-green-600 transition-colors">{{ m.name }}</span>
                        <span class="text-[9px] font-mono text-slate-400 font-bold">{{ m.sku || 'Brak indeksu' }}</span>
                      </div>
                      <div class="text-[10px] font-black uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 shrink-0" :class="getStock(m) > 0 ? 'text-[#58b347] bg-[#f0f7f1] border-[#58b347]/30' : 'text-red-500 bg-red-50 border-red-200'">
                        Stan: {{ getStock(m) }}
                      </div>
                    </div>
                    <div @click="addCustomPart(partSearchQuery)" class="p-3 bg-green-50 hover:bg-green-100 cursor-pointer flex items-center justify-center transition-colors border-t border-green-200 sticky bottom-0 z-10">
                      <span class="text-[10px] font-black text-green-700 uppercase tracking-widest flex items-center gap-2">
                        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        DODAJ SPOZA LISTY: "{{ partSearchQuery }}"
                      </span>
                    </div>
                  </div>
                </div>

                <div class="flex-1 border border-slate-200 rounded-xl overflow-hidden flex flex-col bg-slate-50/50">
                   <div class="bg-slate-100/80 border-b border-slate-200 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-slate-500 flex justify-between">
                     <span>Części do pobrania (DLA TEJ WIZYTY)</span>
                     <span>{{ activeVisit.parts ? activeVisit.parts.reduce((a,b) => a + b.qty, 0) : 0 }} szt.</span>
                   </div>
                   <div class="flex-1 overflow-y-auto p-2 space-y-2 ticket-custom-scrollbar min-h-[200px]">
                     <div v-if="!activeVisit.parts || activeVisit.parts.length === 0" class="text-center text-xs font-bold text-slate-400 py-8 uppercase tracking-widest">Brak części na liście.</div>
                     <div v-else v-for="(p, idx) in activeVisit.parts" :key="idx" class="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-2.5 shadow-sm">
                       <div class="flex flex-col min-w-0 pr-2">
                         <span class="text-xs font-bold text-slate-800 truncate" :title="p.name">{{ p.name }}</span>
                         <span v-if="p.sku" class="text-[9px] font-mono text-slate-400">{{ p.sku }}</span>
                       </div>
                       <div class="flex items-center gap-2 shrink-0">
                         <div class="flex items-center bg-slate-100 rounded-lg border border-slate-200">
                           <button @click="updatePartQty(idx, -1)" class="px-2 py-0.5 text-xs font-black text-slate-500 hover:text-red-500">-</button>
                           <span class="px-2 text-xs font-black text-[#58b347]">{{ p.qty }}</span>
                           <button @click="updatePartQty(idx, 1)" class="px-2 py-0.5 text-xs font-black text-slate-500 hover:text-[#58b347]">+</button>
                         </div>
                         <button @click="removePart(idx)" class="text-slate-300 hover:text-red-500 transition-colors p-1">
                           <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                         </button>
                       </div>
                     </div>
                   </div>
                </div>

              </div>
            </div>

            <!-- KOLUMNA 3: Kafelki/Akordeony Magazynowe -->
            <div class="flex flex-col h-full bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex-1">
                <div class="p-4 border-b border-slate-100 bg-[#f0f7f1] shrink-0">
                    <h4 class="text-[10px] font-black uppercase tracking-widest text-[#499b3a] flex items-center gap-2">
                        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                        Wybierz z katalogu stacji
                    </h4>
                </div>
                
                <div class="flex-1 overflow-y-auto p-3 flex flex-col gap-2 ticket-custom-scrollbar">
                  <div v-for="(parts, cat) in groupedCatalog" :key="cat" class="border border-[#58b347]/30 rounded-xl overflow-hidden bg-white shadow-sm">
                    <button @click="toggleCat(cat)" class="w-full px-3 py-2.5 bg-[#eaf5e9] hover:bg-[#dceddb] flex items-center justify-between transition-colors text-left border-b border-[#58b347]/20">
                      <span class="text-[10px] font-black uppercase tracking-widest text-[#388e3c]">{{ cat }}</span>
                      <svg class="w-4 h-4 text-[#58b347] transition-transform duration-200" :class="expandedCats[cat] ? 'rotate-180' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                    <div v-show="expandedCats[cat]" class="flex flex-col bg-white divide-y divide-slate-100">
                      <div v-for="m in parts" :key="m.sku || m.name" @click="addPartToList(m.name, 1, m.sku)" class="p-2 border-b border-slate-100 hover:bg-[#f0f7f1] cursor-pointer flex items-center justify-between transition-colors group">
                        <div class="flex flex-col min-w-0 pr-2">
                          <span class="text-[10px] font-bold text-slate-700 truncate group-hover:text-[#58b347] transition-colors">{{ m.name }}</span>
                          <span class="text-[9px] font-mono text-slate-400">{{ m.sku || '-' }}</span>
                        </div>
                        <span class="text-[9px] font-black px-1.5 py-0.5 rounded border shrink-0" :class="getStock(m) > 0 ? 'text-[#58b347] bg-[#f0f7f1] border-[#58b347]/30' : 'text-red-500 bg-red-50 border-red-200'">{{ getStock(m) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
            </div>

          </div>
        </div>

        <!-- Stopka Modala -->
        <div class="p-6 border-t border-slate-200 bg-white shrink-0 flex items-center justify-between rounded-b-[24px] relative z-20">
          <button @click="proceedToSettlement" class="bg-amber-50 text-amber-600 border border-amber-200 font-black py-3 px-6 rounded-xl text-xs uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all shadow-sm flex items-center gap-2 group">
            <svg class="w-4 h-4 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M2 12h4l2-9 5 18 3-10 4 3"/><path d="M22 12h-2"/></svg>
            WSTĘPNE ROZLICZENIE
          </button>

          <div class="flex gap-3">
            <button @click="$emit('close')" class="bg-slate-50 border border-slate-200 text-slate-600 font-extrabold py-3.5 px-8 rounded-xl text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors shadow-sm">Anuluj</button>
            <button @click="save" class="bg-[#58b347] text-white font-black py-3.5 px-8 rounded-xl text-xs uppercase tracking-widest hover:bg-[#499b3a] transition-all shadow-md shadow-[#58b347]/20 flex items-center gap-2">
              ZAPISZ DIAGNOZĘ
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useTicketsStore } from '../stores/useTicketsStore'
import { useBillingsStore } from '../stores/useBillingsStore'

const props = defineProps({
  show: Boolean,
  ticketId: [String, Number]
})

const emit = defineEmits(['close', 'save', 'open-settlement'])
const store = useTicketsStore()
const billingsStore = useBillingsStore()

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

const visits = ref([])
const activeVisitId = ref(null)
const warehouseType = ref('terenowy')
const partSearchQuery = ref('')
const expandedCats = ref({})

const accState = ref({ diag: true, notes: false })

const handleKeydown = (e) => {
  if (props.show && e.key === 'Escape') emit('close')
}

onMounted(() => { window.addEventListener('keydown', handleKeydown) })
onUnmounted(() => { window.removeEventListener('keydown', handleKeydown) })

const currentTicket = computed(() => {
  if (!props.ticketId) return null
  const reqId = String(props.ticketId).toLowerCase().trim()
  
  let t = store.tickets.find(x => 
    String(x.id).toLowerCase().trim() === reqId ||
    String(x.ticket_code || '').toLowerCase().trim() === reqId ||
    String(x.ticket_number || '').toLowerCase().trim() === reqId
  )

  if (!t && billingsStore.billings) {
    t = billingsStore.billings.find(x => 
      String(x.id).toLowerCase().trim() === reqId || 
      String(x.ticket_id || '').toLowerCase().trim() === reqId
    )
  }
  return t
})

const currentTicketCode = computed(() => {
  if (!currentTicket.value) return 'AX-0000'
  return currentTicket.value.ticket_code || currentTicket.value.ticket_number || currentTicket.value.id
})

const activeVisit = computed(() => {
  return visits.value.find(v => v.id === activeVisitId.value) || { diag: '', notes: '', parts: [] }
})

const parseVisitsText = (diagStr, notesStr, partsStr) => {
  let vList = []
  let dStr = diagStr || ''
  let nStr = notesStr || ''
  let pStr = partsStr || ''

  let labels = new Set()
  ;[dStr, nStr, pStr].forEach(str => {
    let matches = str.match(/--- WIZYTA (.+?) ---/g)
    if (matches) {
      matches.forEach(m => labels.add(m.replace(/--- WIZYTA /g, '').replace(/ ---/g, '').trim()))
    }
  })

  if (labels.size === 0) {
    let parts = []
    if (pStr) {
      pStr.split(',').forEach(partItem => {
        let match = partItem.match(/(.+?) x(\d+)/)
        if (match) parts.push({ name: match[1].trim(), qty: parseInt(match[2], 10), sku: '' })
      })
    }
    vList.push({ id: Date.now(), label: 'I', diag: dStr.trim(), notes: nStr.trim(), parts: parts })
    return vList
  }

  const extractBlock = (fullStr, label) => {
    let regex = new RegExp(`--- WIZYTA ${label} ---\\n([\\s\\S]*?)(?=--- WIZYTA |$)`)
    let match = fullStr.match(regex)
    return match ? match[1].trim() : ''
  }

  let i = 0
  labels.forEach(label => {
    let diag = extractBlock(dStr, label)
    let note = extractBlock(nStr, label)
    let pContent = extractBlock(pStr, label)
    let parts = []
    if (pContent) {
      pContent.split(',').forEach(partItem => {
        let match = partItem.match(/(.+?) x(\d+)/)
        if (match) parts.push({ name: match[1].trim(), qty: parseInt(match[2], 10), sku: '' })
      })
    }
    vList.push({ id: Date.now() + i, label: label, diag: diag, notes: note, parts: parts })
    i++
  })

  return vList
}

watch(() => props.show, (isOpen) => {
  if (isOpen && currentTicket.value) {
    visits.value = parseVisitsText(currentTicket.value.raw_diagnoza, currentTicket.value.notes, currentTicket.value.parts_str)
    activeVisitId.value = visits.value[0].id
    accState.value.notes = !!activeVisit.value.notes
  }
})

const switchVisit = (id) => { activeVisitId.value = id }

const addVisit = () => {
  let nextIdx = visits.value.length
  let label = ROMAN_NUMERALS[nextIdx] || (nextIdx + 1).toString()
  let newV = { id: Date.now(), label: label, diag: '', notes: '', parts: [] }
  visits.value.push(newV)
  activeVisitId.value = newV.id
}

const deleteVisit = (id) => {
  const idx = visits.value.findIndex(v => v.id === id)
  if (idx <= 0) return
  if (!confirm('Czy na pewno chcesz usunąć tę wizytę?')) return

  visits.value.splice(idx, 1)
  visits.value.forEach((v, index) => {
    v.label = ROMAN_NUMERALS[index] || (index + 1).toString()
  })
  activeVisitId.value = visits.value[visits.value.length - 1].id
}

const groupedCatalog = computed(() => {
  let groups = {}
  store.partsCatalog.forEach(p => {
    let cat = p.category ? p.category.replace(/\s*\([^)]*\)/g, '').trim() : 'INNE'
    if (!cat) cat = 'INNE'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(p)
  })
  return groups
})

const toggleCat = (cat) => { expandedCats.value[cat] = !expandedCats.value[cat] }

const getStock = (part) => {
  if (!part.stocks) return 0
  const w = warehouseType.value
  if (w === 'zg_stock') return part.stocks.zg_stock || part.stocks.main_stock || 0
  if (w === 'wa_stock') return part.stocks.warsaw_stock || part.stocks.wa_stock || 0
  
  const techName = (currentTicket.value?.technician_id || '').toLowerCase().trim()
  if (techName) {
    let foundKey = Object.keys(part.stocks).find(k => k.toLowerCase().includes(techName))
    return foundKey ? (part.stocks[foundKey] || 0) : 0
  }
  return 0
}

const partSearchResults = computed(() => {
  const q = partSearchQuery.value.toLowerCase().trim()
  if (!q) return []
  return store.partsCatalog.filter(p => 
    p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q))
  ).slice(0, 20)
})

const selectPart = (name, sku) => {
  addPartToList(name, 1, sku)
  partSearchQuery.value = ''
}

const addCustomPart = (name) => {
  if (!name.trim()) return
  selectPart(name.trim(), 'NEW-' + Date.now().toString().slice(-6))
}

const addPartToList = (name, qty, sku = '') => {
  const v = activeVisit.value
  if (!v.parts) v.parts = []
  const existing = v.parts.find(p => p.name === name)
  if (existing) existing.qty += qty
  else v.parts.push({ name, qty, sku })
}

const updatePartQty = (idx, delta) => {
  const v = activeVisit.value
  if (!v.parts) return
  v.parts[idx].qty += delta
  if (v.parts[idx].qty <= 0) v.parts.splice(idx, 1)
}

const removePart = (idx) => { activeVisit.value.parts.splice(idx, 1) }

const buildUpdatedTicket = () => {
  let combinedDiag = ''
  let combinedNotes = ''
  let combinedPartsArr = []
  let combinedPartsStrParts = []

  visits.value.forEach(v => {
    if (v.diag && v.diag.trim()) combinedDiag += `--- WIZYTA ${v.label} ---\n${v.diag.trim()}\n\n`
    if (v.notes && v.notes.trim()) combinedNotes += `--- WIZYTA ${v.label} ---\n${v.notes.trim()}\n\n`
    if (v.parts && v.parts.length > 0) {
      let pStr = v.parts.map(p => `${p.name} x${p.qty}`).join(', ')
      combinedPartsStrParts.push(`--- WIZYTA ${v.label} ---\n${pStr}`)
      v.parts.forEach(p => combinedPartsArr.push(p))
    }
  })

  return {
    ...currentTicket.value,
    raw_diagnoza: combinedDiag.trim(),
    notes: combinedNotes.trim(),
    parts_str: combinedPartsStrParts.join('\n\n'),
    parts_array: combinedPartsArr
  }
}

const save = () => {
  const updatedTicket = buildUpdatedTicket()
  emit('save', updatedTicket)
  emit('close')
}

const proceedToSettlement = () => {
  const updatedTicket = buildUpdatedTicket()
  
  // Zapisz diagnozę po cichu w tle
  emit('save', updatedTicket)
  
  // Zamknij widok i wyemituj do rodzica gotowy, zmontowany obiekt!
  emit('close')
  setTimeout(() => {
    emit('open-settlement', updatedTicket)
  }, 100)
}
</script>

<style scoped>
.ticket-custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.ticket-custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.ticket-custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.4); border-radius: 10px; }
.ticket-custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(88, 179, 71, 0.8); }
</style>