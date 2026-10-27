<template>
  <div class="flex-1 min-w-0 flex flex-col gap-3 h-full">
    <template v-if="store.activeModule !== 'logs'">
      <div v-if="groupedParts.length === 0" class="p-12 text-center text-slate-400 font-bold bg-white rounded-2xl border border-slate-200 w-full shadow-sm">Brak asortymentu spełniającego kryteria wyszukiwania.</div>
      
      <div v-for="group in groupedParts" :key="group.id" class="group w-full flex flex-col bg-white border rounded-2xl shadow-sm transition-colors duration-300 overflow-hidden" :class="isExpanded(group.id) ? 'border-[#58b347] ring-1 ring-[#58b347]/20' : 'border-slate-200 hover:border-slate-300'">
        
        <!-- Nagłówek Akordeonu -->
        <div @click="$emit('toggle-category', group.id)" class="flex items-center justify-between p-3 cursor-pointer select-none transition-colors rounded-t-2xl" :class="isExpanded(group.id) ? 'bg-[#58b347]/5' : 'bg-transparent hover:bg-slate-50'">
          <div class="flex items-center gap-4 flex-1">
            <div class="w-10 h-10 rounded-[12px] flex items-center justify-center shadow-sm border shrink-0 text-white font-bold text-sm" :class="isExpanded(group.id) ? (isGeneral(group.id) ? 'bg-[#58b347] border-[#499b3a]' : '') : 'bg-white text-slate-500 border-slate-200'" :style="!isGeneral(group.id) && store.activeModule === 'mobile' ? `background-color: ${group.color}` : ''">
              <template v-if="isGeneral(group.id) || store.activeModule !== 'mobile'">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
              </template>
              <template v-else>
                {{ getInitials(group.name) }}
              </template>
            </div>
            <div class="flex flex-col">
              <h3 class="text-[13px] font-black tracking-tight uppercase truncate" :class="isGeneral(group.id) ? 'text-slate-800' : 'text-[#58b347]'">{{ group.name }}</h3>
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{{ group.items.length }} pozycji</span>
            </div>
          </div>
          <div class="flex items-center justify-center w-8 h-8 rounded-full border transition-transform duration-300 group-hover:bg-white group-hover:shadow-sm" :class="isExpanded(group.id) ? 'rotate-180 border-[#58b347] text-[#58b347] bg-white shadow-sm' : 'text-slate-400 border-slate-200'">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>
        
        <!-- Wnętrze Akordeonu (Zastąpiono v-show bez animacji gridu) -->
        <div v-show="isExpanded(group.id)" class="border-t border-slate-100/80 bg-white">
          <div class="w-full overflow-x-auto custom-scrollbar pb-1">
            <table class="w-full text-left border-collapse table-fixed select-none min-w-[800px]">
              <thead class="bg-slate-50 border-b border-slate-200 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th class="py-3 px-6 w-32">SKU / Indeks</th>
                  <th class="py-3 px-4 w-auto min-w-[200px]">Nazwa Części</th>
                  <th v-if="isGeneral(group.id) && store.activeModule !== 'mobile'" class="py-3 px-4 w-32">Kategoria</th>
                  <th class="py-3 px-2 w-24 text-center">{{ store.activeModule === 'mobile' ? 'W AUCIE' : 'MAGAZYN' }}</th>
                  <th v-if="store.activeModule !== 'mobile'" class="py-3 px-2 w-20 text-center">WAW</th>
                  <th class="py-3 px-2 w-20 text-center text-red-400">Zużyte</th>
                  <th class="py-3 px-6 w-[260px] text-right">Akcje</th>
                </tr>
              </thead>
              <tbody class="text-xs divide-y divide-slate-100">
                <tr v-if="group.items.length === 0" class="bg-white hover:bg-slate-50 transition-colors">
                    <td :colspan="isGeneral(group.id) && store.activeModule !== 'mobile' ? 7 : 6" class="py-8 px-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Brak przypisanego sprzętu.</td>
                </tr>
                <tr v-else v-for="p in group.items" :key="p.id_sku || p.sku || p.id" 
                    class="transition-colors cursor-pointer hover-row-trigger border-l-2" 
                    :class="store.lockedPartId === (p.id_sku || p.sku || p.id) ? 'bg-blue-50/50 border-l-blue-400' : 'bg-white hover:bg-slate-50 border-l-transparent'"
                    @click="$emit('lock-part', p.id_sku || p.sku || p.id)"
                    @mouseenter="$emit('hover-part', p.id_sku || p.sku || p.id)">
                  
                  <td class="py-4 px-6 text-[11px] text-slate-500 font-mono font-bold align-middle">{{ p.id_sku || p.sku || '-' }}</td>
                  <td class="py-4 px-4 align-middle"><span class="font-bold text-slate-800 text-[13px] leading-relaxed break-words block w-full pr-2">{{ p.name }}</span></td>
                  <td v-if="isGeneral(group.id) && store.activeModule !== 'mobile'" class="py-4 px-4 align-middle"><span class="text-[11px] font-bold text-slate-600 truncate block w-full max-w-[120px] uppercase tracking-wider">{{ p.category || 'Inne' }}</span></td>
                  
                  <td class="py-4 px-2 align-middle text-center font-black text-sm" :class="(store.activeModule === 'zg_central' ? parseInt(p.zg_stock) : p.stockOverride) <= store.lowStockThreshold ? 'text-red-500' : 'text-slate-800'">
                    {{ store.activeModule === 'zg_central' ? (parseInt(p.zg_stock) || 0) : p.stockOverride }}
                  </td>
                  
                  <td v-if="store.activeModule !== 'mobile'" class="py-4 px-2 align-middle text-center font-black text-sm" :class="(parseInt(p.warsaw_stock) || 0) <= store.lowStockThreshold ? 'text-red-500' : 'text-slate-800'">
                    {{ parseInt(p.warsaw_stock) || 0 }}
                  </td>
                  
                  <td class="py-4 px-2 align-middle text-center font-bold text-sm" :class="(parseInt(p.used_stock) || 0) > 0 ? 'text-red-600 font-black' : 'text-slate-400'">
                    {{ (parseInt(p.used_stock) || 0) > 0 ? parseInt(p.used_stock) : '-' }}
                  </td>
                  
                  <td class="py-4 px-6 align-middle">
                    <div v-if="store.activeModule !== 'mobile'" class="flex justify-end gap-1.5 w-full row-actions-group whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                      <!-- Magazyn: Przesunięcie ZG -> WAW -->
                      <button @click.stop="$emit('open-movement', p, 'PRZESUNIECIE', 'ZG', 'WAW')" class="text-[9px] font-extrabold border border-blue-200 text-blue-600 px-2 py-1.5 rounded-lg hover:bg-blue-50 shadow-sm uppercase tracking-widest transition-colors flex items-center gap-1 bg-white" title="Przesuń ZG ⇄ WAW">
                         <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M17 3v18"/><path d="m21 7-4-4-4 4"/><path d="M7 21V3"/><path d="m3 17 4 4 4-4"/></svg> PRZESUŃ
                      </button>
                      <!-- Magazyn: Nowa Dostawa -->
                      <button @click.stop="$emit('open-movement', p, 'DOSTAWA', null, 'ZG')" class="text-[9px] font-extrabold border border-green-200 text-green-600 px-2.5 py-1.5 rounded-lg hover:bg-green-50 shadow-sm uppercase tracking-widest transition-colors flex items-center gap-1 bg-white" title="Zarejestruj nową dostawę">
                         <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> DOSTAWA
                      </button>
                      <!-- Magazyn: Wydanie w Teren -->
                      <button @click.stop="$emit('open-movement', p, 'PRZESUNIECIE', 'ZG', null)" class="text-[9px] font-extrabold border border-[#58b347] bg-[#58b347] text-white px-3 py-1.5 rounded-lg hover:bg-[#499b3a] shadow-sm uppercase tracking-widest flex items-center gap-1 transition-all">
                         WYDAJ <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="9 18 15 12 9 6"/></svg>
                      </button>
                    </div>
                    <div v-else class="flex justify-end gap-2 w-full row-actions-group whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                      <!-- Teren: Zwrot z auta na magazyn -->
                      <button @click.stop="$emit('open-movement', p, 'PRZESUNIECIE', group.id, 'ZG')" class="text-[9px] font-extrabold border border-blue-200 bg-white text-blue-600 px-3 py-1.5 rounded-full hover:bg-blue-50 shadow-sm uppercase tracking-widest flex items-center gap-1 transition-colors">
                         <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M17 3v18"/><path d="m21 7-4-4-4 4"/><path d="M7 21V3"/><path d="m3 17 4 4 4-4"/></svg> PRZESUŃ
                      </button>
                      <!-- Teren: Zużycie -->
                      <button @click.stop="$emit('open-movement', p, 'ZUZYCIE', group.id, null)" class="text-[9px] font-extrabold border border-red-200 bg-white text-red-500 px-3 py-1.5 rounded-full hover:bg-red-50 shadow-sm uppercase tracking-widest flex items-center gap-1 transition-colors">
                         <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> ZUŻYCIE
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
    
    <!-- HISTORIA (LOGI) Z POLEPSZONĄ WIZUALIZACJĄ -->
    <div v-else class="w-full bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden min-h-max">
      <div class="w-full overflow-x-auto custom-scrollbar">
        <table class="w-full text-left border-collapse table-fixed select-none min-w-[900px]">
          <thead class="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <tr>
              <th class="py-4 px-8 w-40">DATA OPERACJI</th>
              <th class="py-4 px-6 w-36">TYP RUCHU</th>
              <th class="py-4 px-6 w-auto min-w-[200px]">ASORTYMENT</th>
              <th class="py-4 px-6 w-24 text-center">ILOŚĆ</th>
              <th class="py-4 px-8 w-64">POWIĄZANIA / CEL</th>
            </tr>
          </thead>
          <tbody class="text-xs divide-y divide-slate-100 bg-white">
            <tr v-if="filteredLogs.length === 0">
              <td colspan="5" class="p-12 text-center text-slate-400 font-bold bg-white">Brak historii operacji.</td>
            </tr>
            <tr v-else v-for="(log, idx) in filteredLogs" :key="idx" class="bg-white hover:bg-slate-50 transition-colors border-b border-slate-100">
              <td class="py-4 px-8 text-[11px] font-bold text-slate-500 font-mono tracking-wide leading-relaxed" v-html="formatDate(log.created_at || log.timestamp || log.date)"></td>
              
              <td class="py-4 px-6">
                <!-- NOWE WIZUALNE PILLSY DLA TYPÓW OPERACJI -->
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border"
                      :class="log.operation_type === 'ZUZYCIE' ? 'bg-red-50 text-red-600 border-red-200' : log.operation_type === 'PRZESUNIECIE' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-green-50 text-green-600 border-green-200'">
                  <span class="w-1.5 h-1.5 rounded-full" :class="log.operation_type === 'ZUZYCIE' ? 'bg-red-500' : log.operation_type === 'PRZESUNIECIE' ? 'bg-blue-500' : 'bg-green-500'"></span>
                  {{ log.operation_type === 'ZUZYCIE' ? 'ZUŻYCIE' : log.operation_type === 'PRZESUNIECIE' ? 'PRZESUNIĘCIE' : 'DOSTAWA' }}
                </span>
              </td>

              <td class="py-4 px-6">
                <div class="flex flex-col">
                  <span class="font-bold text-slate-800 text-[12px] leading-tight break-words w-full">{{ getPartDetails(log).name }}</span>
                  <span class="text-[10px] font-mono text-slate-500 mt-0.5">{{ getPartDetails(log).sku }}</span>
                </div>
              </td>

              <td class="py-4 px-6 text-center">
                <span class="inline-block px-3 py-1 bg-slate-100 rounded-lg border border-slate-200 font-black text-[13px]" :class="log.operation_type === 'ZUZYCIE' ? 'text-red-600' : log.operation_type === 'PRZESUNIECIE' ? 'text-blue-600' : 'text-[#58b347]'">
                  {{ log.operation_type === 'ZUZYCIE' ? '-' : '+' }}{{ log.quantity }} 
                  <span class="text-[9px] text-slate-400 uppercase font-bold">{{ getPartDetails(log).unit }}</span>
                </span>
              </td>
              
              <td class="py-4 px-8 text-[11px] font-bold text-slate-700 flex flex-col gap-0.5">
                <span class="flex items-center gap-1.5">
                  <span class="text-slate-400">{{ getLogLocationName(log.source) }}</span>
                  <svg v-if="log.destination" class="w-3 h-3 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="9 18 15 12 9 6"/></svg>
                  <span v-if="log.destination">{{ getLogLocationName(log.destination) }}</span>
                </span>
                <span v-if="log.ticket_id || log.ticket_code" class="text-[9px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded w-max border border-slate-200 mt-1 truncate max-w-[200px]" :title="log.ticket_id || log.ticket_code">
                  ZGŁ.: {{ log.ticket_id || log.ticket_code }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useStorageStore } from '../../stores/useStorageStore'

const props = defineProps({
  groupedParts: Array,
  filteredLogs: Array
})

const emit = defineEmits(['toggle-category', 'lock-part', 'hover-part', 'open-movement'])
const store = useStorageStore()

const isExpanded = (id) => {
  if (store.activeModule === 'zg_central') return store.expandedCategoriesZG.includes(id)
  if (store.activeModule === 'mobile') return store.expandedCategoriesMobile.includes(id)
  return false
}

const isGeneral = (id) => id === 'WIDOK OGÓLNY (WSZYSTKIE CZĘŚCI)'

const getInitials = (name) => {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const formatDate = (raw) => {
  if (!raw) return 'Brak daty'
  try {
    const d = new Date(raw)
    if (isNaN(d.getTime())) return String(raw).replace('T', ' ').substring(0, 16)
    const formatter = new Intl.DateTimeFormat('pl-PL', {
      timeZone: 'Europe/Warsaw', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    })
    const parts = formatter.formatToParts(d)
    const vals = {}
    parts.forEach(p => vals[p.type] = p.value)
    return `${vals.year}-${vals.month}-${vals.day}<br><span class="text-[10px] text-slate-400 font-medium">${vals.hour}:${vals.minute}</span>`
  } catch(e) {
    return String(raw).replace('T', ' ').substring(0, 16)
  }
}

const getPartDetails = (log) => {
  const logIdStr = String(log.part_id || log.part_sku || log.sku || '').trim().toLowerCase()
  const p = store.parts.find(x => {
    if (!logIdStr) return false
    return (String(x.id_sku).trim().toLowerCase() === logIdStr) || 
           (String(x.id).trim().toLowerCase() === logIdStr) || 
           (String(x.sku).trim().toLowerCase() === logIdStr)
  })
  return {
    name: p ? p.name : 'Nieznany element',
    sku: p ? (p.id_sku || p.sku) : log.part_id,
    unit: p ? (p.unit || 'szt.') : 'SZT.'
  }
}

// Zamienia surowe ID ze źródła / celu na ładne nazwy
const getLogLocationName = (locId) => {
  if (!locId) return '-'
  if (locId === 'ZG') return 'Magazyn (Zielona Góra)'
  if (locId === 'WAW') return 'Magazyn (Warszawa)'
  
  const tech = store.techs.find(t => t.id === locId)
  return tech ? tech.name : locId
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.4); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(88, 179, 71, 0.8); }

.hover-row-trigger:hover .row-actions-group { opacity: 1; }
</style>