<template>
  <div v-if="show" class="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn" @click.self="$emit('close')">
    <div class="bg-white rounded-[20px] shadow-2xl w-full max-w-[420px] overflow-hidden border border-slate-200">
      <div class="px-6 py-5 flex justify-between items-center border-b border-slate-100">
        <h3 class="text-[13px] font-black text-slate-800 uppercase tracking-widest">{{ titleStr }}</h3>
        <button type="button" @click="$emit('close')" class="text-slate-400 hover:text-slate-700 transition-colors">✕</button>
      </div>
      <div class="p-6 space-y-6 bg-slate-50/30">
        
        <div class="bg-white border border-slate-200/80 rounded-xl p-4 text-center shadow-sm flex flex-col items-center justify-center">
          <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{{ part?.id_sku || part?.sku }}</div>
          <div class="text-[13px] font-black text-slate-800 leading-snug">{{ part?.name }}</div>
        </div>
        
        <!-- Wybór Magazynu Źródłowego / Docelowego -->
        <div v-if="needsSourceSelection" class="space-y-2">
          <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
            {{ opType === 'DOSTAWA' ? 'DO KTÓREGO MAGAZYNU DODAJESZ?' : (opType === 'NA CENTRALNY' || opType.startsWith('ZWROT') ? 'DO KTÓREGO MAGAZYNU ZWRACASZ?' : 'Z KTÓREGO MAGAZYNU?') }}
          </label>
          <div class="relative bg-white border border-slate-200 rounded-xl shadow-sm focus-within:border-[#58b347] transition-colors h-[42px] overflow-hidden mb-4">
             <select v-model="selectedSource" @change="recalculateMax" class="w-full h-full pl-4 pr-10 text-[13px] font-bold text-slate-700 bg-transparent focus:outline-none appearance-none outline-none cursor-pointer">
               <option value="ZG">Magazyn (Zielona Góra)</option>
               <option value="WAW">WA Magazyn</option>
             </select>
             <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
               <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
             </div>
          </div>
        </div>

        <!-- Wybór Technika -->
        <div v-if="needsTechSelection" class="space-y-2">
          <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
            {{ opType.startsWith('ZWROT') || opType === 'NA CENTRALNY' ? 'KTO ZWRACA ZE SWOJEGO AUTA?' : 'KOMU WYDAJESZ SPRZĘT?' }}
          </label>
          <div class="relative bg-white border border-slate-200 rounded-xl shadow-sm focus-within:border-[#58b347] transition-colors h-[42px] overflow-hidden mb-4">
             <select v-model="selectedTechId" @change="recalculateMax" :disabled="opType.startsWith('ZWROT') || opType === 'NA CENTRALNY'" class="w-full h-full pl-4 pr-10 text-[13px] font-bold text-slate-700 bg-transparent focus:outline-none appearance-none outline-none cursor-pointer disabled:bg-slate-50 disabled:text-slate-400">
               <option value="">-- Wybierz pracownika --</option>
               <option v-for="t in store.techs" :key="t.id" :value="t.id">{{ t.name }}</option>
             </select>
             <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
               <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg>
             </div>
          </div>
        </div>

        <!-- Ilość -->
        <div class="space-y-2">
          <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500">ILOŚĆ (SZT.)</label>
          <div class="flex gap-3 h-[42px]">
            <input type="number" v-model.number="quantity" min="1" class="flex-1 border border-slate-200 bg-white rounded-xl px-4 py-2 text-center text-lg font-black text-slate-800 focus:outline-none focus:border-[#58b347] transition-all shadow-sm outline-none m-0" />
            <button type="button" @click="setMax" class="bg-slate-50 border border-slate-200 text-slate-500 font-extrabold px-6 rounded-xl hover:bg-slate-100 transition-colors shadow-sm text-[11px] uppercase tracking-widest">MAX</button>
          </div>
        </div>

        <div v-if="opType === 'PRZESUNIECIE'" class="text-[10px] font-bold text-slate-400 bg-slate-100 p-3 rounded-xl border border-slate-200 leading-relaxed">
          * SYSTEM AUTOMATYCZNIE PRZENIESIE TOWAR MIĘDZY ODDZIAŁAMI ZG ⇄ WAW.
        </div>
        <div v-else-if="opType === 'NA CENTRALNY' || opType.startsWith('ZWROT')" class="text-[10px] font-bold text-slate-400 bg-slate-100 p-3 rounded-xl border border-slate-200 leading-relaxed">
          * SPRZĘT ZOSTANIE ODJĘTY Z AUTA TECHNIKA.
        </div>
        
        <div class="flex gap-3 pt-4 border-t border-slate-100">
          <button type="button" @click="$emit('close')" class="flex-1 bg-white border border-slate-200 text-slate-700 font-extrabold py-3.5 rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-xs uppercase tracking-widest">ANULUJ</button>
          <button type="button" @click="submit" class="flex-1 bg-[#58b347] text-white font-black py-3.5 rounded-xl hover:bg-[#499b3a] transition-all shadow-sm shadow-[#58b347]/20 text-xs uppercase tracking-widest">ZATWIERDŹ</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useStorageStore } from '../stores/useStorageStore'

const props = defineProps({
  show: Boolean,
  part: Object,
  opType: String,
  techId: String
})

const emit = defineEmits(['close', 'save'])
const store = useStorageStore()

const selectedSource = ref('ZG')
const selectedTechId = ref('')
const quantity = ref(1)

watch(() => props.show, (isOpen) => {
  if (isOpen) {
    selectedSource.value = store.activeModule === 'wa_central' ? 'WAW' : 'ZG'
    selectedTechId.value = props.techId || ''
    quantity.value = 1
    recalculateMax()
  }
})

const titleStr = computed(() => {
  if (props.opType === 'DOSTAWA') return 'NOWA DOSTAWA Z HURTOWNI'
  if (props.opType === 'NA CENTRALNY' || props.opType === 'ZWROT_DO_CENTRALNEGO') return 'ZWROT NA MAGAZYN'
  if (props.opType === 'PRZESUNIECIE') return 'PRZESUNIĘCIE (ZG ⇄ WAW)'
  return 'WYDANIE SPRZĘTU'
})

const needsSourceSelection = computed(() => ['DOSTAWA', 'WYDANIE', 'PRZESUNIECIE', 'NA CENTRALNY', 'ZWROT_DO_CENTRALNEGO'].includes(props.opType))
const needsTechSelection = computed(() => ['WYDANIE', 'ZWROT_DO_CENTRALNEGO', 'NA CENTRALNY'].includes(props.opType))

const setMax = () => {
  if (!props.part) return

  if (props.opType === 'WYDANIE' || props.opType === 'PRZESUNIECIE') {
    quantity.value = selectedSource.value === 'WAW' ? (parseInt(props.part.warsaw_stock) || 0) : (parseInt(props.part.zg_stock) || 0)
  } else if (props.opType.startsWith('ZWROT') || props.opType === 'NA CENTRALNY') {
    const tech = store.techs.find(t => t.id === selectedTechId.value)
    if (tech) {
      const currentQty = parseInt(props.part[tech.name]) || 0
      quantity.value = currentQty > 0 ? currentQty : 1
    }
  }
}

const recalculateMax = () => {
  // Zabezpieczenie przed wpisaniem za dużej wartości
  // Opcjonalnie można uciąć ilość na maksa przy zmianie dropdowna
}

const submit = () => {
  if (needsTechSelection.value && !selectedTechId.value) {
    alert("Wybierz pracownika!")
    return
  }
  if (quantity.value <= 0 || isNaN(quantity.value)) {
    alert("Podaj prawidłową ilość!")
    return
  }

  const payload = {
    part_sku: props.part.id_sku || props.part.sku || props.part.id,
    type: props.opType,
    quantity: quantity.value,
    technician_id: selectedTechId.value,
    source: selectedSource.value
  }

  emit('save', payload)
}
</script>