<template>
  <div class="px-8 pt-6 pb-8 flex-1 flex flex-col relative shrink-0">
    <div class="flex flex-col gap-3 w-full pb-4">
      
      <div v-if="clients.length === 0" class="p-12 text-center text-slate-400 font-bold bg-white rounded-2xl border border-slate-200 shadow-sm w-full">
        Brak klientów spełniających zadane kryteria.
      </div>

      <div v-for="c in paginatedClients" :key="c.id" class="group w-full flex flex-col bg-white border rounded-2xl overflow-hidden transition-all duration-300" :class="expandedIds.includes(c.id) ? 'shadow-md' : 'hover:shadow-md'" :style="getContainerStyle(c)">
        
        <!-- NAGŁÓWEK AKORDEONU -->
        <div @click="$emit('toggle', c.id)" class="flex items-center p-4 cursor-pointer select-none transition-colors border-b-2" :class="expandedIds.includes(c.id) ? 'border-b-slate-100' : 'border-transparent'" :style="{ backgroundColor: getDynBg(c, false) }" @mouseenter="e => e.currentTarget.style.backgroundColor = getDynBg(c, true)" @mouseleave="e => e.currentTarget.style.backgroundColor = getDynBg(c, false)">
          
          <div class="flex items-center gap-5 w-full lg:w-[40%] shrink-0 pr-6 pointer-events-none">
            <div class="w-14 h-14 rounded-[14px] flex items-center justify-center text-white font-black text-xl shrink-0 shadow-sm border-2 border-white ring-1 ring-slate-200/60" :style="{ backgroundColor: c.color_hex || c.color || '#58b347' }">
              {{ getInitials(c.name) }}
            </div>
            <h3 class="text-[16px] leading-snug font-black tracking-tight uppercase line-clamp-2 text-slate-800 group-hover:text-slate-900 transition-colors">{{ c.name }}</h3>
          </div>

          <div class="hidden lg:flex flex-col justify-center gap-1.5 w-[40%] shrink-0 border-l-2 border-slate-200 pl-8 py-0.5" @click.stop>
            <div class="flex items-center gap-2 mb-0.5">
              <div v-if="c.contact_person" @click="copyToClipboard(c.contact_person, 'Osoba')" class="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-600 shadow-sm cursor-pointer hover:text-blue-600 hover:border-blue-300 transition-colors">
                <svg class="w-3 h-3 text-[#58b347] pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> 
                {{ c.contact_person }}
              </div>
              <div v-else class="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-md text-[10px] font-extrabold italic text-slate-400 shadow-sm">
                <svg class="w-3 h-3 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> 
                BRAK OS. DECYZYJNEJ
              </div>
              <div v-if="c.sla_hours || c.sla" class="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-600 shadow-sm pointer-events-none">
                <svg class="w-3 h-3 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> 
                SLA: <span class="text-[#58b347]">{{ c.sla_hours || c.sla }}</span>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <span v-if="c.phone" @click="copyToClipboard(c.phone, 'Telefon')" class="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 truncate max-w-[200px] cursor-pointer hover:text-blue-600 transition-colors">
                <svg class="w-3.5 h-3.5 text-slate-400 shrink-0 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> 
                {{ c.phone }}
              </span>
              <span v-else class="flex items-center gap-1.5 text-[11px] font-medium italic text-slate-400 truncate max-w-[200px]">Brak telefonu</span>

              <span v-if="c.email" @click="copyToClipboard(c.email, 'Email')" class="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 truncate max-w-[200px] cursor-pointer hover:text-blue-600 transition-colors">
                <svg class="w-3.5 h-3.5 text-slate-400 shrink-0 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> 
                {{ c.email }}
              </span>
              <span v-else class="flex items-center gap-1.5 text-[11px] font-medium italic text-slate-400 truncate max-w-[200px]">Brak e-maila</span>
            </div>
          </div>

          <div class="flex items-center justify-end gap-5 w-auto lg:w-[20%] shrink-0 lg:border-l-2 border-slate-100 lg:pl-6 ml-auto pointer-events-none">
            <div class="flex flex-col items-center justify-center text-center">
              <span class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Sprawność Sieci</span>
              <div class="relative w-[46px] h-[46px] flex items-center justify-center rounded-full bg-white shadow-sm border-4 border-slate-100">
                <div class="absolute inset-[-4px] rounded-full border-4 border-transparent transition-all duration-500" :style="{ background: `conic-gradient(${getEffColor(c)} ${getEfficiency(c)}%, transparent 0) border-box`, WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }"></div>
                <span class="text-[11px] font-black z-10 transition-colors duration-500" :style="{ color: getEffColor(c) }">{{ getEfficiency(c) }}%</span>
              </div>
            </div>
            <div class="flex items-center justify-center w-9 h-9 rounded-full border transition-all duration-300 bg-white shadow-sm shrink-0" :style="expandedIds.includes(c.id) ? `transform: rotate(180deg); color: ${getEffColor(c)}; border-color:${getEffColor(c)};` : 'color: #94a3b8; border-color: #e2e8f0;'">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>
        </div>

        <!-- ROZWIJANA TREŚĆ -->
        <div class="grid transition-all duration-300 ease-in-out" :class="expandedIds.includes(c.id) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'">
          <div class="overflow-hidden bg-[#f8fafc]">
            
            <div class="flex items-center justify-between p-4 border-b border-slate-200/60 bg-gradient-to-r from-[#f9fbf8] to-[#ffffff]">
              <div class="flex flex-col gap-1.5 w-72">
                <div class="flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-500 tracking-widest">
                   <svg class="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>
                   Sprawność sieci
                </div>
                <div class="flex items-center gap-3">
                  <div class="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                    <div class="h-full rounded-full transition-all duration-500" :style="{ width: getEfficiency(c) + '%', backgroundColor: getEffColor(c) }"></div>
                  </div>
                  <span class="text-[11px] font-black text-slate-800">{{ getWorkingCount(c) }} / {{ getStations(c).length }} Działa</span>
                </div>
              </div>
              
              <!-- PRZYCISKI AKCJI -->
              <div class="flex items-center gap-2">
                <!-- EDYCJA KLIENTA -->
                <button @click="$emit('edit-client', c)" class="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-500 hover:border-blue-200 shadow-sm transition-all" title="Edytuj">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                
                <!-- USUWANIE KLIENTA -->
                <button @click.stop="$emit('delete-client', c)" class="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-red-500 hover:border-red-200 shadow-sm transition-all" title="Usuń">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </div>
            </div>

            <div class="p-4 bg-gradient-to-r from-slate-50 to-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 border-b border-slate-200/50">
              <svg class="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
              Infrastruktura stacji ładowania
            </div>
            
            <div class="px-2 pb-2">
              <table class="w-full text-left border-collapse table-fixed select-none">
                <thead>
                  <tr>
                    <th class="w-[20%] py-3.5 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200/60">Nazwa Stacji</th>
                    <th class="w-[30%] py-3.5 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200/60">Lokalizacja</th>
                    <th class="w-[30%] py-3.5 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200/60">Technik (Rejon)</th>
                    <th class="w-[20%] py-3.5 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200/60 text-right">Zgłoszenie</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-if="getFilteredStations(c).length === 0">
                    <td colspan="4" class="py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white">Brak przypisanych stacji pasujących do wyszukiwania</td>
                  </tr>
                  <tr v-for="(st, idx) in getFilteredStations(c)" :key="st.id || idx" class="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-none" :class="idx % 2 === 0 ? 'bg-white' : 'bg-[#fafbfc]'">
                    <td class="py-3.5 px-4 text-[13px] font-bold text-slate-700">
                      <span @click="$emit('open-analytics', getShortName(st))" class="truncate block w-full cursor-pointer hover:text-[#58b347] transition-colors">{{ getShortName(st) }}</span>
                    </td>
                    <td class="py-3.5 px-4 text-[13px] font-bold text-slate-600 flex items-center gap-2">
                      <svg class="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> 
                      {{ st.city || st.location || 'Brak lokalizacji' }}
                    </td>
                    <td class="py-3.5 px-4 text-[13px] font-bold text-slate-600">{{ st.technician_id || st.tech || 'Nieprzypisany' }}</td>
                    <td class="py-3.5 px-4 text-right">
                      <span v-if="!st.active_ticket_id" class="inline-flex items-center justify-center px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-md text-[9px] font-black uppercase text-slate-400 tracking-wider">BRAK</span>
                      <div v-else class="flex flex-col items-end gap-1">
                        <span class="inline-flex items-center justify-center px-2.5 py-1 border rounded-md text-[10px] font-black tracking-wider" :class="getBadgeClass(st.ticket_status)">{{ st.active_ticket_id }}</span>
                        <span v-if="st.ticket_status" class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{{ st.ticket_status }}</span>
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

    <div v-if="hasMore" class="p-6 text-center border-t border-slate-100 bg-slate-50/50 rounded-b-2xl mt-4">
      <button @click="$emit('load-more')" class="bg-white border border-slate-200 text-slate-600 font-bold px-6 py-2.5 rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-xs uppercase tracking-widest">Załaduj więcej wyników</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useSearchFilters } from '../../composables/useSearchFilters'

const props = defineProps({
  clients: {
    type: Array,
    default: () => []
  },
  allStations: {
    type: Array,
    default: () => []
  },
  expandedIds: {
    type: Array,
    default: () => []
  },
  currentPage: {
    type: Number,
    default: 1
  },
  itemsPerPage: {
    type: Number,
    default: 50
  },
  searchQueries: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['toggle', 'load-more', 'open-analytics', 'edit-client', 'delete-client', 'send-alert'])

const { checkClientSearch } = useSearchFilters()

const paginatedClients = computed(() => {
  return props.clients.slice(0, props.currentPage * props.itemsPerPage)
})

const hasMore = computed(() => {
  return props.clients.length > props.currentPage * props.itemsPerPage
})

const stationsMap = computed(() => {
  const map = new Map()
  props.allStations.forEach(s => {
    const rawId = String(s.client_id || s.clientId || '').trim().toLowerCase()
    if (!map.has(rawId)) map.set(rawId, [])
    map.get(rawId).push(s)
  })
  return map
})

const getStations = (c) => {
  const cid = String(c.id || '').trim().toLowerCase()
  const cname = String(c.name || '').trim().toLowerCase()
  
  const fromId = stationsMap.value.get(cid) || []
  const fromName = stationsMap.value.get(cname) || []
  
  return [...new Set([...fromId, ...fromName])]
}

const getFilteredStations = (c) => {
  const allClientStations = getStations(c)
  const validSearch = props.searchQueries.filter(q => q.text.trim() !== '')

  if (validSearch.length === 0) return allClientStations

  return allClientStations.filter(st => {
    let match = checkClientSearch(c, validSearch[0].text, [st])
    if (validSearch[0].logic === 'NOT') match = !match
    
    for (let i = 1; i < validSearch.length; i++) {
      const cMet = checkClientSearch(c, validSearch[i].text, [st])
      if (validSearch[i].logic === 'AND') match = match && cMet
      else if (validSearch[i].logic === 'OR') match = match || cMet
      else if (validSearch[i].logic === 'NOT') match = match && !cMet
    }
    
    return match
  })
}

const getWorkingCount = (c) => {
  const stations = getStations(c)
  return stations.filter(s => {
    if (!s.active_ticket_id || String(s.active_ticket_id).trim() === '') return true
    const tStatus = s.ticket_status ? String(s.ticket_status).trim().toLowerCase() : ''
    return (tStatus.includes('zakończ') || tStatus.includes('zamknięt') || tStatus.includes('closed') || tStatus.includes('anulowan') || tStatus.includes('cancelled') || tStatus.includes('wykonano'))
  }).length
}

const getEfficiency = (c) => {
  const total = getStations(c).length
  if (total === 0) return 0
  return Math.round((getWorkingCount(c) / total) * 100)
}

// Kolor tekstów/kółka na podstawie skali 0 (czerwony) -> 120 (zielony)
const getEffColor = (c) => {
  const total = getStations(c).length
  if (total === 0) return '#94a3b8' // Szary dla braku stacji
  const eff = getEfficiency(c)
  const hue = Math.round(eff * 1.2)
  return `hsl(${hue}, 85%, 42%)`
}

// Dynamiczne Tło akordeonu
const getDynBg = (c, isHover) => {
  const total = getStations(c).length
  // Jeśli brak stacji to utrzymujemy neutralną szarość/biel
  if (total === 0) return props.expandedIds.includes(c.id) ? '#f8fafc' : (isHover ? '#f1f5f9' : '#ffffff')
  
  const eff = getEfficiency(c)
  const hue = Math.round(eff * 1.2)
  const alpha = props.expandedIds.includes(c.id) ? 0.12 : (isHover ? 0.08 : 0.04)
  return `hsla(${hue}, 85%, 45%, ${alpha})`
}

// Dynamiczne Ramki akordeonu
const getContainerStyle = (c) => {
  const total = getStations(c).length
  const isExpanded = props.expandedIds.includes(c.id)
  
  // Neutralne ramki dla braku stacji
  if (total === 0) return `border-color: ${isExpanded ? '#cbd5e1' : '#e2e8f0'}; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);`
  
  const eff = getEfficiency(c)
  const hue = Math.round(eff * 1.2)
  
  if (isExpanded) {
    return `border-color: hsla(${hue}, 85%, 45%, 0.4); box-shadow: 0 0 0 1px hsla(${hue}, 85%, 45%, 0.15), 0 4px 6px -1px rgba(0,0,0,0.1);`
  }
  return `border-color: hsla(${hue}, 85%, 45%, 0.25); box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);`
}

const getInitials = (name) => {
  if (!name) return '??'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const getShortName = (st) => {
  let name = st.public_id || st.name || 'Nieznana stacja'
  if (name.includes('-')) {
    let parts = name.split('-')
    if (parts.length >= 2) return parts.slice(0, 2).join('-')
  }
  return name
}

const getBadgeClass = (status) => {
  const tStatus = status ? String(status).trim().toLowerCase() : ''
  if(tStatus.includes('oczekuje')) return 'bg-orange-50 border-orange-200 text-orange-600'
  if(tStatus.includes('wykonano') || tStatus.includes('zakończ')) return 'bg-green-50 border-green-200 text-green-600'
  if(tStatus.includes('przegląd') || tStatus.includes('udt')) return 'bg-blue-50 border-blue-200 text-blue-600'
  return 'bg-red-50 border-red-200 text-red-600'
}

const copyToClipboard = (val, label) => {
  navigator.clipboard.writeText(val).then(() => {
    alert(`Skopiowano: ${label}`)
  })
}
</script>