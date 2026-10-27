<template>
  <!-- ZMIANA: z-30 na z-50 -->
  <div class="px-8 pb-6 shrink-0 border-b border-slate-200/50 w-full bg-[#f4f6f8] relative z-50">
    <div class="w-full bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 relative">
      
      <!-- Lewa sekcja: Wyszukiwarka z dynamicznym warunkiem -->
      <div class="flex-1 w-full max-w-3xl flex flex-col gap-2">
        <div v-for="(q, idx) in queries" :key="q.id" class="flex items-center gap-3 w-full animate-fadeIn">
          <div class="relative shrink-0 min-w-[100px]">
            <div @click.stop="toggleLogic(q.id)" :class="getLogicClass(q.logic, idx)" class="rounded-2xl px-3 text-[11px] font-black uppercase tracking-widest flex items-center justify-center h-[40px] cursor-pointer transition-all select-none border">
              {{ idx === 0 ? 'ZAWIERA' : (q.logic === 'NOT' ? 'WYKLUCZ' : q.logic === 'OR' ? 'LUB' : 'ORAZ') }}
            </div>
            <div v-show="activeDropdownId === q.id && idx !== 0" class="absolute top-full left-0 mt-1.5 w-full bg-white border border-slate-200 rounded-2xl shadow-xl z-[200] overflow-hidden">
              <div @click.stop="setLogic(q, 'AND')" class="px-3 py-3 flex items-center justify-center text-[10px] font-black text-[#58b347] hover:bg-[#eaf5e9] cursor-pointer border-b border-slate-100">ORAZ</div>
              <div @click.stop="setLogic(q, 'OR')" class="px-3 py-3 flex items-center justify-center text-[10px] font-black text-slate-500 hover:bg-slate-50 cursor-pointer border-b border-slate-100">LUB</div>
              <div @click.stop="setLogic(q, 'NOT')" class="px-3 py-3 flex items-center justify-center text-[10px] font-black text-red-500 hover:bg-red-50 cursor-pointer">WYKLUCZ</div>
            </div>
          </div>
          <div class="relative flex-1 flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden focus-within:border-[#58b347] transition-colors h-[40px]">
            <div class="flex items-center justify-center pl-4 w-9 h-full shrink-0 text-slate-400"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></div>
            <input :value="q.text" @input="updateText(q, $event.target.value)" type="text" :placeholder="placeholder" class="w-full pl-3 pr-3 py-2 text-xs font-bold text-slate-700 focus:outline-none bg-transparent h-full border-none placeholder:text-slate-400 placeholder:font-semibold" />
          </div>
          <button v-if="idx > 0" @click="$emit('remove-row', q.id)" class="p-2 text-slate-300 hover:text-slate-500 transition-colors shrink-0 h-[40px] flex items-center justify-center"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>
        </div>
        <button @click="$emit('add-row')" class="text-[11px] font-black text-slate-500 hover:text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl py-2.5 px-5 w-max flex items-center justify-center gap-2 transition-all mt-1"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14"/><path d="M5 12h14"/></svg> Dodaj warunek wyszukiwania</button>
      </div>

      <!-- Prawa sekcja: Dynamiczne wstrzykiwanie przez rodzica -->
      <div class="flex flex-wrap gap-2 lg:gap-3 items-center shrink-0 w-full lg:w-auto relative ml-auto">
        <slot name="actions"></slot>
      </div>
      
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  queries: { type: Array, required: true },
  placeholder: { type: String, default: "Szukaj danych..." }
})

const emit = defineEmits(['add-row', 'remove-row'])

const activeDropdownId = ref(null)

const toggleLogic = (id) => activeDropdownId.value = activeDropdownId.value === id ? null : id
const setLogic = (q, logic) => { q.logic = logic; activeDropdownId.value = null }
const getLogicClass = (logic, idx) => {
  if (idx === 0) return 'bg-[#eaf5e9] text-[#388e3c] border-[#58b347]/30 pointer-events-none'
  if (logic === 'NOT') return 'bg-[#fef2f2] text-red-500 hover:bg-red-100 border-red-200'
  if (logic === 'OR') return 'bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-200'
  return 'bg-[#eaf5e9] text-[#58b347] hover:bg-[#dceddb] border-[#58b347]/30'
}

let searchTimeout = null
const updateText = (q, value) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => { q.text = value }, 300)
}
</script>