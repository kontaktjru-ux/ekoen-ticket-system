<template>
  <div class="px-8 pt-4 pb-8 flex-1 flex flex-col relative shrink-0">
    
    <div v-if="isLoading" class="p-12 text-center text-slate-400 font-bold bg-white rounded-2xl border border-slate-200 shadow-sm w-full animate-pulse">
      Ładowanie bilingów...
    </div>
    
    <div v-else-if="groupedBillings.length === 0" class="p-12 text-center text-slate-400 font-bold bg-white rounded-2xl border border-slate-200 shadow-sm w-full">
      Brak zgłoszeń oczekujących na rozliczenie.
    </div>
    
    <div v-else class="w-full flex flex-col gap-4 relative z-10 pb-32">
      
      <div v-for="group in groupedBillings" :key="group.key" 
           class="group w-full flex flex-col bg-white border rounded-2xl shadow-sm transition-all duration-300"
           :class="getGroupContainerClass(group)">
        
        <!-- Nagłówek Akordeonu -->
        <div @click="handleToggleAccordion(group.key)" 
             class="flex items-center justify-between p-4 cursor-pointer select-none transition-colors rounded-t-2xl acc-header"
             :class="getGroupHeaderClass(group)">
          
          <!-- Lewa Strona -->
          <div class="flex items-center gap-4 flex-1 min-w-0 pr-4 pointer-events-none">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center font-black shadow-sm border shrink-0" :class="getGroupIconClass(group)">
              <svg v-if="group.key === '9999-99'" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <svg v-else-if="group.key === '9999-98'" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22h6a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v10"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10.4 12.6a2 2 0 1 1 3 3L8 21l-4 1 1-4Z"/></svg>
              <svg v-else class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div class="flex flex-col min-w-0">
              <h3 class="text-sm font-black tracking-tight uppercase truncate" :class="getGroupTextClass(group)">{{ group.label }}</h3>
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 whitespace-nowrap">{{ group.items.length }} ZGŁOSZEŃ W GRUPIE</span>
            </div>
          </div>

          <!-- Środek (Średnia) -->
          <div class="hidden md:flex flex-col justify-center shrink-0 w-[240px] xl:w-[280px] px-6 border-l border-slate-200/50 pointer-events-none whitespace-nowrap">
              <span class="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-0.5 truncate w-full">Średnia wartość na zgłoszenie</span>
              <div class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-slate-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                  <span class="text-[13px] font-black text-slate-600 tracking-tight">{{ getGroupAvg(group) }}</span>
              </div>
          </div>

          <!-- Prawa Strona -->
          <div class="flex items-center justify-end gap-4 shrink-0 w-[220px] xl:w-[260px] pointer-events-none border-l border-slate-200/50 pl-6 whitespace-nowrap">
            <div class="flex flex-col items-end">
               <div class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ROZLICZONO: <span class="text-slate-700 font-black">{{ group.settledCount }} / {{ group.items.length }}</span></div>
               <div class="flex items-center gap-2 mt-1 z-10 relative pointer-events-auto">
                   <span class="text-[14px] font-black pointer-events-none tracking-tight" :class="group.key === '9999-99' ? 'text-orange-500' : 'text-[#58b347]'">{{ getGroupTotal(group) }}</span>
                   <button @click.stop="$emit('toggle-currency', group.key)" class="text-[9px] font-black uppercase tracking-widest border rounded-md px-1.5 py-0.5 shadow-sm transition-colors shrink-0" :class="getCurrencyBtnClass(group.key)">
                      {{ getCurrencyCode(group.key) === 'EUR' ? '€ ➔ PLN' : 'PLN ➔ €' }}
                   </button>
               </div>
            </div>
            <div class="flex items-center justify-center w-8 h-8 rounded-full border transition-all duration-300 group-hover:bg-white group-hover:shadow-sm ml-1 shrink-0" :class="getGroupChevronClass(group)">
              <svg class="w-4 h-4 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>
        </div>

        <!-- Tabela Wewnątrz: LAZY-LOADING DOM -->
        <div class="transition-all duration-300 ease-in-out grid" :style="openAccordions.includes(group.key) ? 'grid-template-rows: 1fr;' : 'grid-template-rows: 0fr;'">
          <div class="overflow-hidden bg-[#f8fafc]">
            <!-- Renderujemy strukturę tabeli dopiero, kiedy dany miesiąc zostanie rozwinięty by nie dławić Vue -->
            <div v-if="renderedGroups.has(group.key) || openAccordions.includes(group.key) || groupedBillings.length === 1" class="w-full overflow-x-auto billings-custom-scrollbar border-t border-slate-100/80">
              <table class="w-max min-w-full text-left border-collapse table-fixed select-none">
                <thead class="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th v-for="(col, idx) in visibleColumns" :key="col.id" 
                        :draggable="!col.locked"
                        @dragstart="$emit('drag-start', idx)"
                        @dragover.prevent
                        @drop="$emit('drop-col', idx)"
                        :style="`width: ${col.width}`" 
                        class="py-4 px-4 border-r border-slate-100 last:border-none cursor-pointer hover:bg-slate-100 transition-colors" 
                        @click="col.sortable ? $emit('sort', col.id) : null">
                      
                      <div class="flex items-center justify-between w-full pointer-events-none">
                        <div v-if="col.id === 'selection'" class="flex items-center gap-3 pointer-events-auto">
                          <div @click.stop="$emit('toggle-select-all-in-group', group)" class="w-1.5 h-5 rounded-full cursor-pointer transition-all" :class="isAllSelected(group) ? 'bg-[#58b347] shadow-[0_0_8px_rgba(88,179,71,0.6)] scale-y-110' : 'bg-slate-300 hover:bg-slate-400'"></div>
                        </div>
                        <span v-else>{{ col.label }}</span>
                        
                        <svg v-if="col.sortable && currentSort.col === col.id" class="w-3.5 h-3.5 text-[#58b347] inline ml-1 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                          <path v-if="currentSort.dir === 'asc'" d="m6 9 6 6 6-6"/>
                          <path v-else d="m18 15-6-6-6 6"/>
                        </svg>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody class="text-xs divide-y divide-slate-100 bg-white">
                  <tr v-for="(item, idx) in group.items" :key="item.id" class="hover:bg-slate-50/80 transition-colors group/row" :class="idx % 2 === 0 ? 'bg-white' : 'bg-[#fafbfc]'">
                    <td v-for="col in visibleColumns" :key="col.id" class="py-4 px-4 border-r border-slate-50 align-middle">
                      
                      <!-- Checkbox -->
                      <div v-if="col.id === 'selection'" class="flex items-center justify-center">
                        <div @click.stop="$emit('toggle-select', item.id)" class="w-1.5 h-6 rounded-full cursor-pointer transition-all" :class="selectedIds.includes(item.id) ? 'bg-[#58b347] shadow-[0_0_8px_rgba(88,179,71,0.6)] scale-y-110' : 'bg-slate-200 group-hover/row:bg-slate-300'"></div>
                      </div>

                      <!-- Akcje / Weryfikuj -->
                      <div v-else-if="col.id === 'actions'" class="flex items-center justify-center w-full">
                        <button @click.stop="$emit('open-settlement', item.id)" class="bg-white border font-extrabold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest transition-all shadow-sm w-full flex items-center justify-center gap-1.5" :class="getActionBtnClass(item)">
                          {{ getActionBtnText(item) }}
                          <svg v-if="item.billing_state === 'SETTLED'" class="w-3.5 h-3.5 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>
                          <svg v-else-if="item.billing_state === 'CORRECTED'" class="w-3.5 h-3.5 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22h6a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v10"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10.4 12.6a2 2 0 1 1 3 3L8 21l-4 1 1-4Z"/></svg>
                          <svg v-else class="w-3.5 h-3.5 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="9 18 15 12 9 6"/></svg>
                        </button>
                      </div>

                      <!-- Status -->
                      <div v-else-if="col.id === 'status'">
                        <span v-if="isPrelim(item)" class="bg-blue-50 text-blue-600 border-blue-200 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 border shadow-sm"><span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> WSTĘPNE</span>
                        <span v-else class="px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 border shadow-sm" :class="item.status === 'Anulowane' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-600 border-amber-200'">
                          <span class="w-1.5 h-1.5 rounded-full" :class="item.status === 'Anulowane' ? 'bg-red-500' : 'bg-amber-500 animate-pulse'"></span> {{ item.status || 'Brak' }}
                        </span>
                      </div>

                      <!-- ID Zgłoszenia -->
                      <div v-else-if="col.id === 'ticket_id'" @click.stop="$emit('copy', item.ticket_id)" class="font-black text-slate-800 text-sm cursor-pointer hover:text-[#58b347] block truncate max-w-full" title="Kopiuj ID">{{ item.ticket_id || '-' }}</div>

                      <!-- Stacja i Klient -->
                      <div v-else-if="col.id === 'station'">
                         <div @click.stop="$emit('copy', item.qp)" class="font-black text-slate-800 mb-0.5 cursor-pointer hover:text-[#58b347] block truncate max-w-full" title="Kopiuj Stację">{{ item.qp || '-' }}</div>
                         <div @click.stop="$emit('copy', item.client)" class="text-[10px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:text-blue-600 block truncate max-w-full" title="Kopiuj Klienta">{{ item.client || '-' }}</div>
                      </div>

                      <!-- Daty -->
                      <div v-else-if="col.id === 'closed_date'">
                        <div class="font-bold text-xs" :class="formatDate(item.closed_date) === 'Brak daty' ? 'text-orange-500' : 'text-slate-700'">{{ formatDate(item.closed_date || item.date_closed || item.end_datetime) }}</div>
                        <div class="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Utw: {{ formatDate(item.created_at || item.created_date || item.start_datetime) }}</div>
                      </div>

                      <!-- TECHNIK: Optymalizacja Vue (Brak V-HTML!) -->
                      <div v-else-if="col.id === 'technician'">
                        <span class="inline-block px-2.5 py-1.5 rounded-lg text-[10px] font-black tracking-wider uppercase border truncate w-full shadow-sm text-center pointer-events-none"
                              :style="getTechPillStyle(item.technician)"
                              :title="item.technician">
                          {{ item.technician || 'Brak technika' }}
                        </span>
                      </div>

                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useBillingsStore } from '../../stores/useBillingsStore'

const props = defineProps({
  groupedBillings: Array,
  isLoading: Boolean,
  visibleColumns: Array,
  selectedIds: Array,
  currentSort: Object,
  openAccordions: Array
})

const emit = defineEmits([
  'toggle-accordion', 'toggle-currency', 'toggle-select-all-in-group',
  'toggle-select', 'copy', 'open-settlement', 'sort', 'drag-start', 'drop-col'
])

const store = useBillingsStore()

// Zestaw pamiętający, które grupy zostały wyrenderowane w drzewie DOM, aby zapobiegać lagom
const renderedGroups = ref(new Set())

const handleToggleAccordion = (key) => {
  renderedGroups.value.add(key)
  emit('toggle-accordion', key)
}

const isAllSelected = (group) => {
  return group.items.length > 0 && group.items.every(i => props.selectedIds.includes(i.id))
}

const isPrelim = (item) => {
  return item.billing_state === 'PRE_SETTLED' || 
         (item.billing_status && String(item.billing_status).toUpperCase().includes('WSTĘPN')) || 
         (item.status && String(item.status).toUpperCase().includes('WSTĘPN')) ||
         (item.ticket_status && String(item.ticket_status).toUpperCase().includes('WSTĘPN'))
}

const formatDate = (dStr) => {
  if (!dStr) return '-'
  try {
    const d = new Date(dStr)
    if (isNaN(d.getTime())) return '-'
    return d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch (e) {
    return '-'
  }
}

// Zoptymalizowana wersja zwracania stylów Vue, zamiast wypluwania HTML'a stringami!
const getTechPillStyle = (techId) => {
  if(!techId || String(techId).trim() === '') {
    return { color: '#64748b', borderColor: '#e2e8f0', backgroundColor: '#ffffff' }
  }
  let techColor = store.techMap[techId] || '#58b347'
  
  let c = techColor.substring(1)
  if(c.length === 3) c = c.split('').map(x => x+x).join('')
  let num = parseInt(c, 16)
  let bg = `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, 0.1)`

  return {
    color: techColor,
    borderColor: techColor + '40',
    backgroundColor: bg
  }
}

const getActionBtnText = (item) => {
  if (item.billing_state === 'CORRECTED') return 'Poprawione'
  if (item.billing_state === 'SETTLED') return 'Rozliczone'
  if (isPrelim(item)) return 'Weryfikuj'
  return 'Rozlicz'
}

const getActionBtnClass = (item) => {
  if (item.billing_state === 'CORRECTED') return 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border-indigo-200'
  if (item.billing_state === 'SETTLED') return 'text-[#499b3a] bg-[#eaf5e9] hover:bg-[#dceddb] border-[#58b347]/30'
  if (isPrelim(item)) return 'text-blue-600 hover:bg-blue-50 border-blue-200 hover:border-blue-300'
  return 'text-slate-600 hover:bg-[#58b347] hover:text-white hover:border-[#58b347]'
}

const getCurrencyCode = (key) => store.groupCurrency[key] || 'EUR'

const getCurrencyBtnClass = (key) => {
  return getCurrencyCode(key) === 'PLN' ? 'border-[#58b347] text-[#58b347] bg-[#eaf5e9]' : 'border-slate-200 text-slate-400 bg-white hover:text-[#58b347] hover:border-[#58b347]'
}

const getGroupTotal = (group) => {
  const curr = getCurrencyCode(group.key)
  return curr === 'EUR' ? `€ ${group.totalEur.toFixed(2)}` : `${(group.totalEur * store.nbpRate).toFixed(2)} PLN`
}

const getGroupAvg = (group) => {
  if (group.settledCount === 0) return '€ 0.00'
  const avg = group.totalEur / group.settledCount
  const curr = getCurrencyCode(group.key)
  return curr === 'EUR' ? `€ ${avg.toFixed(2)}` : `${(avg * store.nbpRate).toFixed(2)} PLN`
}

const getGroupContainerClass = (group) => {
  const isOpen = props.openAccordions.includes(group.key) || props.groupedBillings.length === 1
  if (!isOpen) return 'border-slate-200 hover:border-slate-300'
  if (group.key === '9999-99') return 'border-orange-500 ring-1 ring-orange-500/20 shadow-md'
  if (group.key === '9999-98') return 'border-blue-400 ring-1 ring-blue-400/20 shadow-md'
  return 'border-[#58b347] ring-1 ring-[#58b347]/20 shadow-md'
}

const getGroupHeaderClass = (group) => {
  const isOpen = props.openAccordions.includes(group.key) || props.groupedBillings.length === 1
  if (!isOpen) return 'bg-transparent hover:bg-slate-50'
  if (group.key === '9999-99') return 'bg-orange-500/5'
  if (group.key === '9999-98') return 'bg-blue-50/50'
  return 'bg-[#58b347]/5'
}

const getGroupIconClass = (group) => {
  if (group.key === '9999-99') return 'bg-orange-50 text-orange-500 border-orange-200'
  if (group.key === '9999-98') return 'bg-blue-50 text-blue-500 border-blue-200'
  return 'bg-[#58b347]/10 text-[#58b347] border-[#58b347]/20'
}

const getGroupTextClass = (group) => {
  if (group.key === '9999-99') return 'text-orange-600'
  if (group.key === '9999-98') return 'text-blue-700'
  return 'text-slate-800'
}

const getGroupChevronClass = (group) => {
  const isOpen = props.openAccordions.includes(group.key) || props.groupedBillings.length === 1
  if (!isOpen) return 'text-slate-400 border-slate-200'
  if (group.key === '9999-99') return 'rotate-180 text-orange-500 border-orange-500 bg-white shadow-sm'
  if (group.key === '9999-98') return 'rotate-180 text-blue-500 border-blue-400 bg-white shadow-sm'
  return 'rotate-180 text-[#58b347] border-[#58b347] bg-white shadow-sm'
}
</script>

<style scoped>
.billings-custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.billings-custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.billings-custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.4); border-radius: 10px; }
.billings-custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(88, 179, 71, 0.8); }
</style>