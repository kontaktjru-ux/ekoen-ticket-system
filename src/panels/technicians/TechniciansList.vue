<template>
  <div class="w-full flex flex-col gap-3 relative z-10">
    <div v-if="technicians.length === 0" class="py-20 text-center text-slate-400 font-bold bg-white border border-slate-200 rounded-2xl shadow-sm w-full">Brak pracowników w bazie.</div>
    
    <div v-for="tech in technicians" :key="tech.id" class="group w-full flex flex-col bg-white border rounded-2xl shadow-sm transition-all duration-300" :class="expandedIds.includes(tech.id) ? 'border-[#58b347] ring-1 ring-[#58b347]/20 shadow-md' : 'border-slate-200 hover:border-slate-300'">
      
      <div @click="$emit('toggle', tech.id)" class="flex items-center justify-between p-3 cursor-pointer select-none transition-colors rounded-2xl acc-header" :class="expandedIds.includes(tech.id) ? 'bg-[#58b347]/5' : 'bg-transparent hover:bg-slate-50'">
        
        <div class="flex items-center gap-4 flex-1 min-w-[200px]">
           <div class="flex items-center pl-1" @click.stop>
             <div @click.stop="$emit('toggle-select', tech.id)" class="w-1.5 h-6 rounded-full cursor-pointer transition-all shrink-0" :class="selectedIds.includes(tech.id) ? 'bg-[#58b347] shadow-[0_0_8px_rgba(88,179,71,0.6)] scale-y-110' : 'bg-slate-200 group-hover:bg-slate-300'"></div>
           </div>
           <div class="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm shrink-0" :style="`background-color: ${tech.zone_color || '#ef4444'}`">
             {{ getInitials(tech.name) }}
           </div>
           <div class="flex flex-col overflow-hidden">
             <div class="flex items-center gap-2">
               <h3 class="text-[15px] font-black tracking-tight text-slate-800 uppercase truncate">{{ tech.name }}</h3>
               <kbd v-if="tech.shortcut_key" class="text-[9px] font-mono font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-1 w-max ml-2">
                 <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="20" height="16" x="2" y="4" rx="2" ry="2"/><path d="M6 8h.001"/><path d="M10 8h.001"/><path d="M14 8h.001"/><path d="M18 8h.001"/><path d="M8 12h.001"/><path d="M12 12h.001"/><path d="M16 12h.001"/><path d="M7 16h10"/></svg>
                 {{ tech.shortcut_key }}
               </kbd>
             </div>
           </div>
        </div>

        <div class="flex-col items-start justify-center flex-1 gap-1.5 hidden md:flex">
           <div class="flex items-center gap-2">
             <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border border-blue-200 text-blue-700 bg-blue-50">
               <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"/><path d="M14 9h4l4 4v5h-3"/><circle cx="7.5" cy="18" r="2.5"/><circle cx="17.5" cy="18" r="2.5"/></svg>
               {{ tech.car_plate || 'BRAK POJAZDU' }}
             </span>
             <span class="inline-flex items-center px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border" :class="getExpiryStatus(tech.sep_expiry).badge">
               {{ getExpiryStatus(tech.sep_expiry).text }}
             </span>
           </div>
           <div class="flex items-center gap-1.5 text-xs font-medium text-slate-500">
             <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
             {{ tech.phone || 'Brak numeru' }}
           </div>
        </div>

        <div class="flex items-center gap-4 shrink-0 pl-4">
           <div class="flex flex-col items-center mr-2">
             <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Stacje</span>
             <span class="font-black text-xs text-slate-800 border border-slate-200 bg-white rounded px-2 py-0.5 mt-0.5 shadow-sm">{{ getAssignedStations(tech.name).length }}</span>
           </div>
           <div class="flex items-center justify-center w-8 h-8 rounded-full border transition-all duration-300 group-hover:bg-white group-hover:shadow-sm" :class="expandedIds.includes(tech.id) ? 'rotate-180 border-[#58b347] text-[#58b347] bg-white shadow-sm' : 'text-slate-400 border-slate-200'">
             <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
           </div>
        </div>
      </div> 

      <!-- AKORDEON WIDOK -->
      <div v-show="expandedIds.includes(tech.id)" class="border-t border-slate-100/80 bg-slate-50/30 rounded-b-2xl cursor-default">
         <div class="p-6">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div class="flex items-center gap-8">
                <div class="flex flex-col gap-1">
                  <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Umowa do</span>
                  <span class="text-xs font-semibold text-slate-700">{{ getExpiryStatus(tech.contract_expiry).formatted || 'Czas nieokreślony' }}</span>
                </div>
                <div class="flex flex-col gap-1">
                  <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategoria pojazdu</span>
                  <span class="text-xs font-semibold text-slate-700">{{ tech.car_category || 'Osobowy' }}</span>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button @click="$emit('edit-tech', tech)" class="bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors flex items-center gap-2 shadow-sm">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg> Edytuj
                </button>
                <button @click="$emit('delete-tech', tech)" class="bg-white border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors flex items-center gap-2 shadow-sm">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg> Usuń
                </button>
              </div>
            </div>

            <div class="border-t border-slate-200/60 pt-6">
              <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Przypisana infrastruktura ({{ getAssignedStations(tech.name).length }})</h4>
              
              <table v-if="getAssignedStations(tech.name).length > 0" class="w-full text-left text-xs border-collapse">
                <thead class="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th class="pb-3 w-1/3">ID Stacji</th>
                    <th class="pb-3">Lokalizacja</th>
                    <th class="pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100/50">
                  <tr v-for="s in getAssignedStations(tech.name)" :key="s.id" class="hover:bg-white transition-colors">
                    <td class="py-3 font-bold text-slate-700">{{ s.public_id || s.name || '-' }}</td>
                    <td class="py-3 text-slate-500 font-medium">{{ [s.city, s.street, s.street_number].filter(Boolean).join(', ') }}</td>
                    <td class="py-3 text-right font-bold" :class="s.status === 'Awaria' ? 'text-red-600' : 'text-slate-500'">{{ s.status || 'Brak' }}</td>
                  </tr>
                </tbody>
              </table>
              <p v-else class="text-center text-slate-400 font-semibold text-xs py-4">Technik nie ma aktualnie przypisanych stacji ładowania.</p>
            </div> 
         </div>
      </div> 
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  technicians: Array,
  allStations: Array,
  selectedIds: Array,
  expandedIds: Array
})

const emit = defineEmits(['toggle', 'toggle-select', 'edit-tech', 'delete-tech'])

const getInitials = (name) => {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  if (parts[0].length > 1) return parts[0].substring(0, 2).toUpperCase()
  return '?'
}

const getExpiryStatus = (dateString) => {
  if (!dateString) return { text: 'BRAK DANYCH', badge: 'bg-slate-50 text-slate-400 border-slate-200', isExpired: false, isExpiring: false, formatted: '' }
  try {
    const d = new Date(dateString)
    if(isNaN(d.getTime())) throw new Error()
    const diffTime = d.getTime() - new Date().getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    const formatted = String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + d.getFullYear()

    if (diffDays < 0) return { text: `WYGASŁO (${Math.abs(diffDays)}D)`, badge: 'bg-red-50 text-red-600 border-red-200 animate-pulse', isExpired: true, isExpiring: false, formatted }
    if (diffDays <= 30) return { text: `WKRÓTCE (${diffDays}D)`, badge: 'bg-orange-50 text-orange-600 border-orange-200', isExpired: false, isExpiring: true, formatted }
    
    return { text: formatted, badge: 'bg-white text-slate-500 border-slate-200', isExpired: false, isExpiring: false, formatted }
  } catch(e) {
    return { text: 'BRAK DANYCH', badge: 'bg-slate-50 text-slate-400 border-slate-200', isExpired: false, isExpiring: false, formatted: '' }
  }
}

const getAssignedStations = (techName) => {
  if (!props.allStations || !techName) return []
  return props.allStations.filter(s => {
    if (!s.technician_id && !s.technician) return false
    const techString = String(s.technician_id || s.technician).toLowerCase()
    return techString.includes(techName.toLowerCase().trim())
  })
}
</script>

<style scoped>
.acc-no-toggle { pointer-events: auto; }
</style>