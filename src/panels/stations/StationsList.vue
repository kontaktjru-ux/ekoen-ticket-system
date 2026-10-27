<template>
  <div class="bg-white border border-slate-200/80 rounded-2xl shadow-sm relative z-10 w-max min-w-full pb-8">
    <table class="w-max min-w-full text-left border-collapse table-fixed select-none relative z-10">
      <thead class="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-[100] shadow-sm hover:z-[110]">
        <tr>
          <th v-for="(col, idx) in visibleColumns" :key="col.id" 
              :draggable="!col.locked"
              @dragstart="$emit('drag-start', idx)"
              @dragover.prevent
              @drop="$emit('drop-col', idx)"
              :style="`width: ${col.width}; min-width: ${col.width}; max-width: ${col.width};`" 
              class="py-4 px-4 border-r border-slate-100 last:border-none cursor-pointer hover:bg-slate-100 transition-colors" 
              @click="col.sortable ? $emit('sort', col.id) : null">
            
            <div v-if="col.id === 'actions'" class="flex items-center w-full">
               <div class="stations-m-tooltip-wrapper inline-flex mr-3 pointer-events-auto">
                 <div @click.stop="$emit('toggle-select-all')" class="w-1.5 h-5 rounded-full cursor-pointer transition-all" :class="isAllSelected ? 'bg-[#58b347] shadow-[0_0_8px_rgba(88,179,71,0.6)] scale-y-110' : 'bg-slate-300 hover:bg-slate-400'"></div>
                 <div class="stations-m-tooltip stations-m-tooltip-bottom stations-m-tooltip-left">Zaznacz widoczne</div>
               </div>
               <span class="pointer-events-none">{{ col.label }}</span>
               <div class="stations-m-tooltip-wrapper inline-flex ml-2 pointer-events-auto">
                 <button @click.stop="$emit('toggle-mute-all')" class="transition-colors" :class="selectedIds.length > 0 ? 'text-amber-500 hover:text-amber-600' : 'text-slate-300 hover:text-amber-500'">
                   <svg class="w-4 h-4 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                 </button>
                 <div class="stations-m-tooltip stations-m-tooltip-bottom stations-m-tooltip-left">Wycisz / Odwycisz zaznaczone</div>
               </div>
            </div>
            <div v-else class="flex items-center gap-1.5 justify-between w-full pointer-events-none">
              <span>{{ col.label }}</span>
              <svg v-if="col.sortable && currentSort.col === col.id" class="w-3.5 h-3.5 text-[#58b347] inline ml-1 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <path v-if="currentSort.dir === 'asc'" d="m6 9 6 6 6-6"/>
                <path v-else d="m18 15-6-6-6 6"/>
              </svg>
              <svg v-else-if="col.sortable" class="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 inline ml-1 shrink-0 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/></svg>
            </div>
          </th>
        </tr>
      </thead>
      
      <tbody class="text-xs divide-y divide-slate-100 bg-white">
        <tr v-if="stations.length === 0">
          <td :colspan="visibleColumns.length" class="p-12 text-center text-slate-400 font-bold bg-white">Brak stacji w bazie spełniających zadane kryteria.</td>
        </tr>
        
        <tr v-for="s in stations" :key="s.id" class="hover:bg-slate-50/80 transition-colors group" :class="mutedIds.has(s.id) ? 'opacity-40' : ''">
          <td v-for="col in visibleColumns" :key="col.id" :style="`width: ${col.width}; min-width: ${col.width}; max-width: ${col.width};`" class="py-3.5 px-4 border-r border-slate-50 relative align-top">
            
            <!-- AKCJE -->
            <div v-if="col.id === 'actions'" class="flex items-center gap-4 align-middle">
              <div @click.stop="$emit('toggle-select', s.id)" class="w-1.5 h-6 rounded-full cursor-pointer transition-all shrink-0" :class="selectedIds.includes(s.id) ? 'bg-[#58b347] shadow-[0_0_8px_rgba(88,179,71,0.6)] scale-y-110' : 'bg-slate-200 group-hover:bg-slate-300'"></div>
              <div class="flex items-center gap-2 text-slate-300">
                <div class="stations-m-tooltip-wrapper inline-flex min-w-0">
                  <button @click.stop="jumpToMap(s)" class="hover:text-blue-500 transition-colors"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></button>
                  <div class="stations-m-tooltip stations-m-tooltip-bottom">Skok do mapy</div>
                </div>
                <div class="stations-m-tooltip-wrapper inline-flex min-w-0">
                  <button @click.stop="$emit('open-edit', s.id)" class="hover:text-[#58b347] transition-colors"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg></button>
                  <div class="stations-m-tooltip stations-m-tooltip-bottom">Edytuj Stację</div>
                </div>
                <div class="stations-m-tooltip-wrapper inline-flex min-w-0">
                  <button @click.stop="$emit('toggle-mute', s.id)" class="transition-colors" :class="mutedIds.has(s.id) ? '' : 'hover:text-amber-500'">
                    <svg v-if="mutedIds.has(s.id)" class="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                    <svg v-else class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  </button>
                  <div class="stations-m-tooltip stations-m-tooltip-bottom">{{ mutedIds.has(s.id) ? 'Odwycisz' : 'Wycisz awarię' }}</div>
                </div>
              </div>
            </div>

            <!-- PUBLIC ID -->
            <div v-else-if="col.id === 'public_id'" class="font-black text-slate-800 text-xs align-middle">
              <div class="stations-m-tooltip-wrapper w-full flex items-center min-w-0">
                 <span @click.stop="$emit('open-analytics', getShortId(s.public_id))" class="truncate block w-full cursor-pointer hover:text-[#58b347] transition-colors">{{ getShortId(s.public_id) }}</span>
                 <div class="stations-m-tooltip stations-m-tooltip-left">Otwórz analitykę (Pełne ID: {{ s.public_id || '-' }})</div>
              </div>
            </div>

            <!-- CLIENT -->
            <div v-else-if="col.id === 'client'" class="font-extrabold text-slate-700 text-xs align-middle">
              <div class="stations-m-tooltip-wrapper w-full flex items-center min-w-0">
                 <span class="truncate block w-full">{{ getClientName(s.client_id) }}</span>
                 <div class="stations-m-tooltip">{{ getClientName(s.client_id) }}</div>
              </div>
            </div>

            <!-- LOCATION -->
            <div v-else-if="col.id === 'location'" class="font-medium text-slate-600 text-xs align-middle">
              <div class="flex items-center w-full min-w-0">
                <div class="stations-m-tooltip-wrapper flex-1 flex items-center min-w-0">
                  <span class="truncate w-full">{{ getLocationString(s) }}</span>
                  <div class="stations-m-tooltip stations-m-tooltip-right">{{ getLocationString(s) }}</div>
                </div>
                <div v-if="!s.gps_lat || !s.gps_lng || String(s.gps_lat).trim() === ''" class="stations-m-tooltip-wrapper inline-flex min-w-0">
                  <svg class="w-3.5 h-3.5 text-amber-500 shrink-0 ml-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="m16.2 7.8-2 6.3-6.4 2.1 2-6.3z"/></svg>
                  <div class="stations-m-tooltip">Brak koordynatów GPS</div>
                </div>
              </div>
            </div>

            <!-- REGION -->
            <div v-else-if="col.id === 'region'" class="align-middle">
              <div v-html="getRegionPill(s.region || s.country)"></div>
            </div>

            <!-- MODEL -->
            <div v-else-if="col.id === 'model'" class="font-bold text-slate-600 text-xs align-middle">
              <div class="stations-m-tooltip-wrapper w-full flex items-center min-w-0">
                 <span class="truncate block w-full">{{ s.model || '-' }}</span>
                 <div class="stations-m-tooltip">{{ s.model || '-' }}</div>
              </div>
            </div>

            <!-- UDT -->
            <div v-else-if="col.id === 'udt'" class="font-medium text-slate-400 text-xs align-middle">
              <div>{{ formatUdtDate(s.inspection_date) }}</div>
            </div>

            <!-- ACTIVE TICKETS -->
            <div v-else-if="col.id === 'ticket'" class="text-xs text-left">
               <div v-if="getActiveTickets(s).length === 0" class="text-slate-300 font-bold block">Brak</div>
               <div v-else class="flex flex-col w-full mt-0.5">
                  <div v-for="t in getActiveTickets(s)" :key="t.id || t.ticket_code" class="stations-m-tooltip-wrapper w-full flex flex-col items-start text-left min-w-0 mb-3 last:mb-0.5">
                     <div class="font-black text-[#58b347] text-[13px] mb-[2px] truncate w-full text-left">{{ t.ticket_code || t.ticket_id || t.id || 'Brak ID' }}</div>
                     <div class="text-[10px] font-bold text-slate-500 truncate w-full text-left">
                        <span class="text-slate-400 font-medium">Tech:</span> <span class="text-slate-700">{{ t.technician_id || t.technician || 'Nieprzypisany' }}</span>
                     </div>
                     <div class="stations-m-tooltip stations-m-tooltip-bottom text-left min-w-[150px]">
                        <div class="mb-1 text-[10px] text-slate-400">ID ZGŁOSZENIA</div>
                        <div class="font-bold text-white mb-2">{{ t.ticket_code || t.ticket_id || t.id || 'Brak ID' }}</div>
                        <div class="mb-1 text-[10px] text-slate-400">PRZYPISANY TECHNIK</div>
                        <div class="font-bold text-white">{{ t.technician_id || t.technician || 'Nieprzypisany' }}</div>
                     </div>
                  </div>
               </div>
            </div>

            <!-- TECH -->
            <div v-else-if="col.id === 'tech'" class="align-middle">
              <div v-html="getTechPill(s)"></div>
            </div>

            <!-- STATUS -->
            <div v-else-if="col.id === 'status'" class="text-left">
               <div v-if="getActiveTickets(s).length === 0" class="flex flex-col items-start text-left w-full mt-0.5">
                 <span class="bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-2xs inline-flex items-center gap-1.5">
                   <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> DZIAŁA
                 </span>
               </div>
               <div v-else class="flex flex-col items-start text-left w-full mt-0.5">
                 <div v-if="mutedIds.has(s.id)" class="stations-m-tooltip-wrapper mb-3 last:mb-0.5">
                    <span class="bg-slate-100 text-slate-500 border border-slate-300 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5">
                      <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span> WYCISZONA
                    </span>
                    <div class="stations-m-tooltip stations-m-tooltip-right">Awaria została wyciszona</div>
                 </div>
                 <template v-else>
                   <div v-for="t in getActiveTickets(s)" :key="t.id || t.ticket_code" class="flex flex-col w-full gap-1 mb-3 last:mb-0.5">
                     <span class="w-max px-2 py-0.5 bg-slate-50 text-slate-500 border border-slate-200 rounded text-[9px] font-bold uppercase tracking-wider truncate max-w-full" title="Kategoria zgłoszenia">{{ t.category || t.ticket_category || 'Brak' }}</span>
                     <span class="w-max px-2 py-0.5 bg-indigo-50 text-indigo-500 border border-indigo-200 rounded text-[9px] font-bold uppercase tracking-wider truncate max-w-full" title="Status zgłoszenia">{{ t.status || t.ticket_status || t.status_zlecenia || 'Brak' }}</span>
                   </div>
                 </template>
               </div>
            </div>

          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStationsStore } from '../../stores/useStationsStore'

const props = defineProps({
  stations: Array,
  isLoading: Boolean,
  visibleColumns: Array,
  selectedIds: Array,
  mutedIds: Object,
  currentSort: Object
})

const emit = defineEmits([
  'sort', 'toggle-select-all', 'toggle-select', 'toggle-mute-all', 'toggle-mute', 
  'drag-start', 'drop-col', 'open-analytics', 'open-edit'
])

const store = useStationsStore()

const isAllSelected = computed(() => props.stations.length > 0 && props.selectedIds.length === props.stations.length)

const getShortId = (fullId) => {
  if (!fullId || fullId === '-') return '-'
  return fullId.split('-').slice(0, 2).join('-')
}

const getClientName = (clientId) => {
  if (!clientId) return '-'
  const found = store.clients.find(c => c.id === clientId || c.name === clientId)
  return found ? found.name : clientId
}

const getLocationString = (s) => {
  let parts = []
  if(s.city && s.city.trim() !== '') parts.push(s.city.trim())
  if(s.street && s.street.trim() !== '') parts.push(s.street.trim())
  if(s.street_number && s.street_number.trim() !== '') parts.push(s.street_number.trim())
  return parts.length > 0 ? parts.join(', ') : '-'
}

const formatUdtDate = (isoString) => {
  if (!isoString || String(isoString).trim() === '') return '-'
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return isoString
    return d.toLocaleDateString('pl-PL', { year: 'numeric', month: '2-digit', day: '2-digit' })
  } catch(e) {
    return isoString
  }
}

const getRegionPill = (region) => {
  const regionText = region ? region.toUpperCase() : "POLSKA"
  if (regionText === "POLSKA" || regionText === "PL") {
    return `<span class="bg-slate-100/80 text-slate-700 border border-slate-200/60 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase inline-flex items-center gap-1.5 truncate max-w-full"><span class="text-sm leading-none">🇵🇱</span> POLSKA</span>`
  } else if (regionText === "SŁOWACJA" || regionText === "SK" || regionText === "SVK") {
    return `<span class="bg-slate-100/80 text-slate-700 border border-slate-200/60 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase inline-flex items-center gap-1.5 truncate max-w-full"><span class="text-sm leading-none">🇸🇰</span> SŁOWACJA</span>`
  } else if (regionText === "POZA REGIONEM") {
    return `<span class="bg-red-50 text-red-600 border border-red-100 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase inline-flex items-center gap-1.5 truncate max-w-full"><span class="w-1.5 h-1.5 rounded-full bg-red-500"></span> POZA REGIONEM</span>`
  } else {
    return `<span class="bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase truncate max-w-full block">${regionText}</span>`
  }
}

const getTechPill = (s) => {
  const techName = s.technician_id && s.technician_id !== 'Auto (Geo)' ? s.technician_id : s.auto_tech
  let techDisplay = "BRAK OPIEKUNA"
  let tooltipContent = ""
  
  let techPillStyle = "color: #dc2626; background-color: #fef2f2; border-color: #fee2e2;"
  let techPillClass = "border px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider uppercase truncate max-w-full block w-fit shadow-sm"

  if (techName) {
    let arr = techName.split(',').map(x => x.trim()).filter(Boolean)
    if (arr.length > 1) {
      techDisplay = 'KILKU TECHNIKÓW'
      techPillStyle = "color: #4f46e5; background-color: #eef2ff; border-color: #e0e7ff;"
      tooltipContent = arr.map(t => `<span class="block py-1 border-b border-white/10 last:border-0">${t}</span>`).join('')
    } else {
      techDisplay = arr[0]
      let foundTech = store.techs.find(t => t.name === techDisplay)
      let tColor = (foundTech && foundTech.zone_color) ? foundTech.zone_color : "#58b347"
      
      const hexToRgba = (hex, alpha) => {
        if(!hex || !hex.startsWith('#')) return `rgba(88, 179, 71, ${alpha})`;
        const c = hex.substring(1);
        const num = parseInt(c.length === 3 ? c.split('').map(x => x+x).join('') : c, 16);
        return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
      }
      
      let bgRgba = hexToRgba(tColor, 0.08)
      let borderRgba = hexToRgba(tColor, 0.25)
      techPillStyle = `color: ${tColor}; background-color: ${bgRgba}; border-color: ${borderRgba};`
    }
  }

  let techPill = `<span class="${techPillClass}" style="${techPillStyle}">${techDisplay}</span>`
  if (tooltipContent) {
    techPill = `<div class="stations-m-tooltip-wrapper inline-flex min-w-0">${techPill}<div class="stations-m-tooltip flex flex-col text-left text-[11px] font-medium">${tooltipContent}</div></div>`
  }
  return techPill
}

const getActiveTickets = (s) => {
  let activeTickets = []
  if (store.tickets.length > 0) {
    store.tickets.forEach(t => {
      const tStatus = String(t.status || t.ticket_status || t.status_zlecenia || '').toLowerCase().trim()
      const qpMatch = String(t.qp_id || t.station_id || t.qp || '').toLowerCase().trim()
      const sid = String(s.id).toLowerCase().trim()
      const spub = String(s.public_id).toLowerCase().trim()
      
      const isMatch = qpMatch !== '' && (qpMatch === sid || qpMatch === spub || qpMatch.startsWith(spub + '_') || qpMatch.startsWith(spub + '-'))
      if (isMatch && !tStatus.includes('zakończ') && !tStatus.includes('zamknięt') && !tStatus.includes('closed') && !tStatus.includes('anulowan') && !tStatus.includes('cancelled') && !tStatus.includes('wykonano')) {
          if (!activeTickets.some(x => (x.id || x.ticket_code) === (t.id || t.ticket_code))) {
              activeTickets.push(t)
          }
      }
    })
  } else {
    if (s.active_ticket_id && String(s.active_ticket_id).trim() !== '') {
      const tStatus = s.ticket_status ? String(s.ticket_status).trim().toLowerCase() : ''
      if (!tStatus.includes('zakończ') && !tStatus.includes('zamknięt') && !tStatus.includes('closed') && !tStatus.includes('anulowan') && !tStatus.includes('cancelled') && !tStatus.includes('wykonano')) {
          activeTickets.push({
             ticket_code: s.active_ticket_id,
             ticket_status: s.ticket_status,
             category: s.ticket_category,
             technician_id: s.ticket_technician
          })
      }
    }
  }
  return activeTickets
}

const jumpToMap = (s) => {
  if (typeof window.switchView === 'function') {
    window.switchView('map')
    if (typeof window.m_map !== 'undefined' && window.m_map && s.gps_lat && s.gps_lng && s.gps_lat !== 'undefined' && s.gps_lng !== 'undefined') {
      setTimeout(() => {
        window.m_map.flyTo({ center: [parseFloat(s.gps_lng), parseFloat(s.gps_lat)], zoom: 14, speed: 1.5 })
      }, 400)
    }
  }
}
</script>

<style scoped>
.stations-m-tooltip-wrapper { position: relative; display: inline-flex; align-items: center; justify-content: flex-start; cursor: help; min-width: 0; }
.stations-m-tooltip { 
  visibility: hidden; opacity: 0; transition: all 0.2s ease; 
  pointer-events: none; position: absolute; 
  bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%) translateY(4px); 
  z-index: 99999; white-space: nowrap; background: #1e293b; color: #fff; 
  padding: 6px 12px; border-radius: 8px; font-size: 11px; 
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.2); font-weight: 600; 
}
.stations-m-tooltip::after {
  content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
  border-width: 5px; border-style: solid; border-color: #1e293b transparent transparent transparent;
}
.stations-m-tooltip-right { left: auto; right: 0; transform: translateX(0) translateY(4px); }
.stations-m-tooltip-right::after { left: auto; right: 15px; transform: translateX(0); }
.stations-m-tooltip-wrapper:hover > .stations-m-tooltip { visibility: visible; opacity: 1; transform: translateX(-50%) translateY(0); }
.stations-m-tooltip-wrapper:hover > .stations-m-tooltip.stations-m-tooltip-right { transform: translateX(0) translateY(0); }

.stations-m-tooltip.stations-m-tooltip-bottom {
  top: calc(100% + 6px); bottom: auto; transform: translateX(-50%) translateY(-4px);
}
.stations-m-tooltip-bottom::after {
  bottom: 100%; top: auto; border-color: transparent transparent #1e293b transparent;
}
.stations-m-tooltip-wrapper:hover > .stations-m-tooltip.stations-m-tooltip-bottom { transform: translateX(-50%) translateY(0); }

.stations-m-tooltip-left { left: 0; right: auto; transform: translateX(0) translateY(4px); }
.stations-m-tooltip-left::after { left: 15px; transform: translateX(0); }
.stations-m-tooltip-wrapper:hover > .stations-m-tooltip.stations-m-tooltip-left { transform: translateX(0) translateY(0); }
.stations-m-tooltip-wrapper:hover > .stations-m-tooltip.stations-m-tooltip-bottom.stations-m-tooltip-left { transform: translateX(0) translateY(0); }
</style>