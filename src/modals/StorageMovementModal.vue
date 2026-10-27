<template>
  <div v-if="show" class="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn" @click.self="$emit('close')">
    <div class="bg-white rounded-[20px] shadow-2xl w-full max-w-[600px] overflow-hidden border border-slate-200">
      
      <!-- Nagłówek Modala -->
      <div class="px-6 py-5 flex justify-between items-center border-b border-slate-100 bg-slate-50/50">
        <h3 class="text-[13px] font-black uppercase tracking-widest flex items-center gap-2" :class="opType === 'ZUZYCIE' ? 'text-red-600' : 'text-blue-600'">
          <svg v-if="opType === 'ZUZYCIE'" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          <svg v-else class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 3v18"/><path d="m21 7-4-4-4 4"/><path d="M7 21V3"/><path d="m3 17 4 4 4-4"/></svg> 
          {{ titleStr }}
        </h3>
        <button type="button" @click="$emit('close')" class="text-slate-400 hover:text-slate-700 transition-colors bg-white p-2 rounded-xl shadow-sm border border-slate-200">✕</button>
      </div>

      <!-- Treść Modala -->
      <div class="p-8 space-y-6 bg-white">
        
        <!-- Wyszukiwarka i Wybór Części (jeśli odpalono z guzika ogólnego) -->
        <div v-if="!selectedPart" class="space-y-3">
          <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500">WYBIERZ ASORTYMENT *</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
            <input type="text" v-model="searchQuery" @focus="isDropdownOpen = true" placeholder="Wpisz nazwę, SKU, lub ID części..." class="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-400 transition-all shadow-sm" />
            
            <div v-if="isDropdownOpen && searchQuery.length > 0" class="absolute z-[100] w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto ticket-custom-scrollbar divide-y divide-slate-100">
              <div v-if="filteredParts.length === 0" class="p-4 text-center text-xs font-bold text-slate-400">Brak pasujących części</div>
              <div v-for="part in filteredParts" :key="part.id" @click="selectPart(part)" class="p-3 hover:bg-slate-50 cursor-pointer flex flex-col gap-1 transition-colors">
                <span class="text-[12px] font-bold text-slate-800">{{ part.name }}</span>
                <div class="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>{{ part.id_sku || part.sku }}</span>
                  <span class="text-[#58b347]">Stan ZG: {{ parseInt(part.zg_stock) || 0 }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="border rounded-xl p-4 flex flex-col shadow-sm" :class="opType === 'ZUZYCIE' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'">
          <div class="text-[10px] font-black uppercase tracking-widest mb-1" :class="opType === 'ZUZYCIE' ? 'text-red-400' : 'text-blue-400'">{{ selectedPart.id_sku || selectedPart.sku }}</div>
          <div class="text-[13px] font-black leading-snug" :class="opType === 'ZUZYCIE' ? 'text-red-900' : 'text-blue-900'">{{ selectedPart.name }}</div>
          <button v-if="!preselectedPart" @click="clearPart" class="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-3 w-max hover:text-slate-700">ZMIEŃ CZĘŚĆ</button>
        </div>

        <div class="w-full h-px bg-slate-100"></div>

        <!-- Główna siatka selekcji -->
        <div class="grid grid-cols-2 gap-4">
          
          <!-- WYBÓR: TYP OPERACJI -->
          <div class="col-span-full sm:col-span-1 space-y-2">
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500">TYP OPERACJI *</label>
            <div class="relative bg-slate-50 border border-slate-200 rounded-xl shadow-sm focus-within:border-blue-400 transition-colors h-[46px] overflow-hidden">
               <select v-model="opType" @change="handleTypeChange" class="w-full h-full pl-4 pr-10 text-[12px] font-bold text-slate-700 bg-transparent focus:outline-none appearance-none outline-none cursor-pointer">
                 <option value="PRZESUNIECIE">Przesunięcie (np. Wydanie, Zwrot, ZG ⇄ WAW)</option>
                 <option value="DOSTAWA">Dostawa Zewnętrzna (Dodanie stoku)</option>
                 <option value="ZUZYCIE">Zużycie / Montaż w terenie</option>
               </select>
               <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                 <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
               </div>
            </div>
          </div>

          <!-- ILOŚĆ -->
          <div class="col-span-full sm:col-span-1 space-y-2">
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500">ILOŚĆ (SZT.) *</label>
            <div class="flex gap-3 h-[46px]">
              <input type="number" v-model.number="quantity" min="1" class="flex-1 border border-slate-200 bg-slate-50 rounded-xl px-4 text-center text-lg font-black text-slate-800 focus:outline-none focus:border-blue-400 transition-all shadow-sm m-0" />
              <button v-if="opType !== 'DOSTAWA'" type="button" @click="setMax" class="bg-slate-50 border border-slate-200 text-slate-500 font-extrabold px-5 rounded-xl hover:bg-slate-100 transition-colors shadow-sm text-[10px] uppercase tracking-widest" title="Ustaw maksymalną dostępną ilość">MAX</button>
            </div>
          </div>

          <!-- ŹRÓDŁO (Z) -->
          <div v-if="opType === 'PRZESUNIECIE' || opType === 'ZUZYCIE'" class="col-span-full sm:col-span-1 space-y-2">
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Z (ŹRÓDŁO) *</label>
            <div class="relative bg-white border border-slate-200 rounded-xl shadow-sm focus-within:border-blue-400 transition-colors h-[46px] overflow-hidden mb-4">
               <select v-model="sourceId" @change="handleSourceChange" class="w-full h-full pl-4 pr-10 text-[13px] font-bold text-slate-700 bg-transparent focus:outline-none appearance-none outline-none cursor-pointer">
                 <option value="" disabled>-- Wybierz Źródło --</option>
                 <option v-for="loc in availableSources" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
               </select>
               <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                 <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
               </div>
            </div>
            <!-- Podpowiedź Stoku -->
            <p v-if="selectedPart && sourceId" class="text-[10px] font-bold text-slate-400 text-right -mt-2 pr-1">Stan: {{ availableStock }} szt.</p>
          </div>

          <!-- CEL (DO) -->
          <div v-if="opType === 'PRZESUNIECIE' || opType === 'DOSTAWA'" class="col-span-full sm:col-span-1 space-y-2">
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">DO (CEL) *</label>
            <div class="relative bg-white border border-slate-200 rounded-xl shadow-sm focus-within:border-blue-400 transition-colors h-[46px] overflow-hidden mb-4">
               <select v-model="destId" :disabled="availableDestinations.length === 0" class="w-full h-full pl-4 pr-10 text-[13px] font-bold text-slate-700 bg-transparent focus:outline-none appearance-none outline-none cursor-pointer disabled:bg-slate-50 disabled:text-slate-400">
                 <option value="" disabled>-- Wybierz Cel --</option>
                 <option v-for="loc in availableDestinations" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
               </select>
               <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                 <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
               </div>
            </div>
          </div>
          
          <!-- Powiązanie ze zgłoszeniem (Tylko dla zużycia) -->
          <div v-if="opType === 'ZUZYCIE'" class="col-span-full sm:col-span-1 space-y-2">
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">POWIĄŻ ZE ZGŁOSZENIEM</label>
            <input type="text" v-model="ticketCode" placeholder="Np. AX-1234 (Opcjonalnie)" class="w-full h-[46px] border border-slate-200 bg-white rounded-xl px-4 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-400 transition-all shadow-sm m-0" />
          </div>

        </div>

      </div>

      <!-- Stopka -->
      <div class="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-4">
        <button type="button" @click="$emit('close')" class="flex-1 bg-white border border-slate-200 text-slate-700 font-extrabold py-3.5 rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-xs uppercase tracking-widest">ANULUJ</button>
        <button type="button" @click="submit" class="flex-1 text-white font-black py-3.5 rounded-xl transition-all shadow-sm text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed" :class="opType === 'ZUZYCIE' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'">
          ZATWIERDŹ OPERACJĘ
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useStorageStore } from '../stores/useStorageStore'

const props = defineProps({
  show: Boolean,
  preselectedPart: Object,
  preselectedOpType: String,
  preselectedSource: String,
  preselectedDest: String
})

const emit = defineEmits(['close', 'save'])
const store = useStorageStore()

const searchQuery = ref('')
const isDropdownOpen = ref(false)
const selectedPart = ref(null)

const opType = ref('PRZESUNIECIE') // 'PRZESUNIECIE', 'DOSTAWA', 'ZUZYCIE'
const sourceId = ref('')
const destId = ref('')
const quantity = ref(1)
const ticketCode = ref('') // Optional

const allLocations = computed(() => {
  return [
    { id: 'ZG', name: 'Magazyn (Zielona Góra)' },
    { id: 'WAW', name: 'Magazyn (Warszawa)' },
    ...store.techs.map(t => ({ id: t.id, name: `Auto: ${t.name}` }))
  ]
})

// Ograniczamy listę celów na podstawie wybranego źródła (żeby nikt nie przesunął na samego siebie)
const availableSources = computed(() => allLocations.value)

const availableDestinations = computed(() => {
  if (opType.value === 'DOSTAWA') {
    // Dostawę można zrobić tylko do głównego magazynu lub warszawy
    return allLocations.value.filter(loc => loc.id === 'ZG' || loc.id === 'WAW')
  }
  if (!sourceId.value) return allLocations.value
  return allLocations.value.filter(loc => loc.id !== sourceId.value)
})

const availableStock = computed(() => {
  if (!selectedPart.value || !sourceId.value || opType.value === 'DOSTAWA') return 0
  if (sourceId.value === 'ZG') return parseInt(selectedPart.value.zg_stock) || 0
  if (sourceId.value === 'WAW') return parseInt(selectedPart.value.warsaw_stock) || 0
  
  const tech = store.techs.find(t => t.id === sourceId.value)
  if (tech) return parseInt(selectedPart.value[tech.name]) || 0
  return 0
})

watch(() => props.show, (isOpen) => {
  if (isOpen) {
    searchQuery.value = ''
    selectedPart.value = props.preselectedPart || null
    opType.value = props.preselectedOpType || 'PRZESUNIECIE'
    sourceId.value = props.preselectedSource || ''
    destId.value = props.preselectedDest || ''
    quantity.value = 1
    ticketCode.value = ''
    isDropdownOpen.value = false
    
    // Jeśli nie wybrano źródła w przesunięciu, na sztywno załaduj ZG jeśli puste
    if (!sourceId.value && opType.value !== 'DOSTAWA') sourceId.value = 'ZG'
    if (!destId.value && opType.value === 'DOSTAWA') destId.value = 'ZG'
  }
})

const titleStr = computed(() => {
  if (opType.value === 'DOSTAWA') return 'NOWA DOSTAWA Z HURTOWNI'
  if (opType.value === 'ZUZYCIE') return 'ZUŻYCIE / MONTAŻ SPRZĘTU'
  return 'RUCH MAGAZYNOWY (PRZESUNIĘCIE)'
})

const filteredParts = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return store.parts.slice(0, 10)
  return store.parts.filter(p => p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q))).slice(0, 15)
})

const selectPart = (part) => {
  selectedPart.value = part
  searchQuery.value = ''
  isDropdownOpen.value = false
}

const clearPart = () => {
  selectedPart.value = null
  searchQuery.value = ''
}

const handleTypeChange = () => {
  if (opType.value === 'DOSTAWA') sourceId.value = ''
  if (opType.value === 'ZUZYCIE') destId.value = ''
  if (opType.value === 'PRZESUNIECIE') {
    if (!sourceId.value) sourceId.value = 'ZG'
  }
  handleSourceChange()
}

const handleSourceChange = () => {
  // Resetuje cel jeśli klikneliśmy to samo co cel
  if (sourceId.value === destId.value) destId.value = ''
}

const setMax = () => {
  if (opType.value !== 'DOSTAWA' && availableStock.value > 0) {
    quantity.value = availableStock.value
  }
}

const submit = () => {
  if (!selectedPart.value) return alert("Wybierz asortyment!")
  if (opType.value !== 'DOSTAWA' && !sourceId.value) return alert("Wybierz źródło (Skąd zdejmujesz sprzęt)!")
  if (opType.value !== 'ZUZYCIE' && !destId.value) return alert("Wybierz cel (Dokąd przesuwasz sprzęt)!")
  if (quantity.value <= 0 || isNaN(quantity.value)) return alert("Podaj prawidłową ilość większą od 0!")
  
  if (opType.value !== 'DOSTAWA' && quantity.value > availableStock.value) {
    return alert(`Nie masz wystarczającej ilości towaru na tym stanie. Maksymalnie: ${availableStock.value} szt.`)
  }

  const payload = {
    part_sku: selectedPart.value.id_sku || selectedPart.value.sku || selectedPart.value.id,
    type: opType.value, // ZUZYCIE | DOSTAWA | PRZESUNIECIE
    quantity: quantity.value,
    source: sourceId.value || null,
    destination: destId.value || null,
    ticket_id: ticketCode.value.trim() || null
  }

  emit('save', payload)
}
</script>

<style scoped>
.ticket-custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.ticket-custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.ticket-custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.4); border-radius: 10px; }
.ticket-custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(88, 179, 71, 0.8); }
</style>