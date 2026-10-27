<template>
  <div v-if="show" @click.self="$emit('close')" class="fixed inset-0 z-[600] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-fadeIn font-sans">
    <div class="bg-[#f8fafc] rounded-3xl shadow-2xl w-full max-w-[1100px] overflow-hidden border border-slate-200 flex flex-col max-h-[95vh] relative">

      <!-- Nagłówek Modala -->
      <div class="px-8 py-6 bg-white border-b border-slate-200 flex justify-between items-center shrink-0">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-full flex items-center justify-center shrink-0" :class="hasActiveTicket ? 'bg-rose-50 border border-rose-100 text-rose-500' : 'bg-emerald-50 border border-emerald-100 text-emerald-500'">
            <svg v-if="hasActiveTicket" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            <svg v-else class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div class="flex flex-col">
            <div class="flex items-center gap-3">
              <h2 class="text-2xl font-black text-slate-800 uppercase tracking-tight">{{ stationQp || 'QP-0000' }}</h2>
              <span class="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-white shadow-sm" :class="hasActiveTicket ? 'bg-rose-500' : 'bg-emerald-500'">
                {{ hasActiveTicket ? 'AWARIA / W SERWISIE' : 'DZIAŁA' }}
              </span>
            </div>
            <div class="flex items-center gap-2 text-xs font-semibold text-slate-500 mt-1">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span>{{ stationAddress }}</span>
            </div>
          </div>
        </div>
        
        <div class="flex items-center gap-4">
          <!-- Zakładki -->
          <div class="flex bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200/60 gap-1 mr-4">
            <button @click="activeTab = 'overview'" class="px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all" :class="activeTab === 'overview' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'">Przegląd</button>
            <button @click="activeTab = 'history'" class="px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all" :class="activeTab === 'history' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'">Historia</button>
            <button @click="activeTab = 'parts'" class="px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all" :class="activeTab === 'parts' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'">Części</button>
          </div>
          
          <button @click="$emit('close')" class="text-slate-400 hover:text-red-500 transition-colors p-2 bg-slate-50 hover:bg-slate-100 rounded-xl">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>

      <!-- ZAKŁADKA 1: PRZEGLĄD -->
      <div v-show="activeTab === 'overview'" class="flex-1 overflow-y-auto p-8 ticket-custom-scrollbar">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- Lewa Kolumna (KPI) -->
          <div class="space-y-6 flex flex-col">
            <!-- Ostatnia Usterka -->
            <div class="bg-white rounded-[20px] p-6 shadow-sm border border-slate-200 border-l-4 border-l-blue-500 relative overflow-hidden">
              <h4 class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Ostatnia usterka</h4>
              <div class="text-3xl font-black tracking-tight" :class="hasActiveTicket ? 'text-rose-500' : 'text-slate-800'">
                {{ lastTicketDisplay }}
              </div>
              <p class="text-[11px] font-bold mt-1 uppercase tracking-wider" :class="hasActiveTicket ? 'text-rose-500' : 'text-blue-500'">
                {{ hasActiveTicket ? 'Zgłoszenie jest aktywne' : 'Czas bezawaryjnej pracy' }}
              </p>
            </div>

            <!-- Szacowane SLA -->
            <div class="bg-white rounded-[20px] p-6 shadow-sm border border-slate-200 border-l-4 border-l-[#58b347] relative overflow-hidden">
              <h4 class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Szacowane SLA</h4>
              <div class="text-4xl font-black tracking-tight" :class="estimatedSla < 95 ? 'text-amber-500' : 'text-[#58b347]'">
                {{ estimatedSla }}%
              </div>
              <p class="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-wider">Zgodnie z umową serwisową</p>
            </div>

            <!-- Informacje Sprzętowe -->
            <div class="bg-white rounded-[20px] p-6 shadow-sm border border-slate-200 flex-1">
              <h4 class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Informacje Sprzętowe</h4>
              <div class="space-y-4">
                <div class="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Model</span>
                  <span class="text-xs font-black text-slate-800 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">{{ stationObj?.product || stationObj?.model || 'Brak danych' }}</span>
                </div>
                <div class="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Ostatni Przegląd</span>
                  <span class="text-xs font-black text-slate-800 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">{{ stationObj?.inspection_date || 'Brak danych' }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500">Opiekun Rejonu</span>
                  <span class="text-xs font-black text-[#58b347] bg-[#f0f7f1] px-2.5 py-1 rounded-md border border-[#58b347]/30">{{ stationObj?.technician_id || stationObj?.technician || 'Nie przypisano' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Prawa Kolumna (Wykresy i Dziennik) -->
          <div class="lg:col-span-2 space-y-6 flex flex-col">
            <!-- Wykres: Awaryjność w czasie -->
            <div class="bg-white rounded-[20px] p-6 shadow-sm border border-slate-200 h-64 flex flex-col">
              <div class="mb-4">
                <h3 class="text-sm font-black text-slate-800 uppercase tracking-widest">Awaryjność stacji</h3>
                <p class="text-[11px] font-semibold text-slate-400 mt-0.5">Liczba zgłoszeń w ostatnich 12 miesiącach</p>
              </div>
              
              <div class="flex-1 flex items-end justify-between gap-1.5 sm:gap-3 mt-2">
                <div v-for="(item, i) in monthlyChartData" :key="i" class="flex flex-col items-center justify-end h-full w-full group relative">
                  <div class="absolute -top-8 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">{{ item.count }} zgł.</div>
                  <div class="w-full rounded-t-sm transition-all duration-500 ease-out" :class="item.count > 0 ? 'bg-[#58b347] group-hover:bg-[#499b3a]' : 'bg-slate-100'" :style="`height: ${item.heightPct}%;`"></div>
                  <div class="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest truncate w-full text-center">{{ item.monthName }}</div>
                </div>
              </div>
            </div>

            <!-- Dziennik Zdarzeń -->
            <div class="bg-white rounded-[20px] p-6 shadow-sm border border-slate-200 flex-1 flex flex-col">
              <div class="flex justify-between items-center mb-5">
                <div>
                  <h3 class="text-sm font-black text-slate-800 uppercase tracking-widest">Dziennik Zdarzeń</h3>
                  <p class="text-[11px] font-semibold text-slate-400 mt-0.5">Ostatnie aktywności systemowe</p>
                </div>
                <button @click="activeTab = 'history'" class="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[#58b347] bg-[#f0f7f1] hover:bg-[#eaf5e9] px-3 py-1.5 rounded-lg border border-[#58b347]/30 transition-colors">
                  Pełna Historia <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </button>
              </div>

              <div class="flex-1 flex flex-col gap-4 overflow-y-auto ticket-custom-scrollbar pr-2">
                <div v-if="stationTickets.length === 0" class="text-[11px] font-bold text-slate-400 mt-4 text-center">Brak zdarzeń w systemie.</div>
                <div v-else v-for="(t, i) in stationTickets.slice(0, 4)" :key="t.id || i" class="flex items-start gap-4">
                  <div class="w-8 h-8 rounded-full border flex items-center justify-center shrink-0 mt-1" :class="isClosed(t) ? 'bg-slate-100 border-slate-200' : 'bg-rose-50 border-rose-200'">
                    <span class="w-2.5 h-2.5 rounded-full" :class="isClosed(t) ? 'bg-slate-300' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'"></span>
                  </div>
                  <div class="flex flex-col pb-4 border-b border-slate-100/50 w-full" :class="i === Math.min(stationTickets.length, 4) - 1 ? 'border-0 pb-0' : ''">
                    <h5 class="text-xs font-black text-slate-800 uppercase tracking-widest">{{ t.title || t.subject || t.category || 'Zgłoszenie systemowe' }}</h5>
                    <p class="text-[10px] text-slate-500 font-medium mt-1">Kod: <span class="font-bold text-slate-700">{{ t.ticket_code || t.ticket_number || t.id }}</span> • Utworzono: {{ formatDate(t.created_at || t.date_created) }}</p>
                    <p class="text-[10px] text-slate-500 font-medium mt-0.5">Technik: <span class="font-bold text-slate-700">{{ t.technician_id || t.technician || '-' }}</span></p>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      <!-- ZAKŁADKA 2: HISTORIA -->
      <div v-show="activeTab === 'history'" class="flex-1 overflow-y-auto p-8 ticket-custom-scrollbar">
        <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table class="w-full text-left border-collapse">
            <thead class="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th class="py-4 px-5">Data Zgłoszenia</th>
                <th class="py-4 px-5">Numer</th>
                <th class="py-4 px-5">Kategoria / Opis</th>
                <th class="py-4 px-5">Technik</th>
                <th class="py-4 px-5">Status</th>
              </tr>
            </thead>
            <tbody class="text-xs divide-y divide-slate-100 bg-white">
              <tr v-if="stationTickets.length === 0">
                <td colspan="5" class="py-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">Brak zgłoszeń w historii</td>
              </tr>
              <tr v-else v-for="t in stationTickets" :key="t.id" class="hover:bg-slate-50 transition-colors">
                <td class="py-4 px-5 text-[10px] font-bold text-slate-500 whitespace-nowrap">{{ formatDate(t.created_at || t.date_created) }}</td>
                <td class="py-4 px-5 font-mono text-[10px] font-black text-slate-700">{{ t.ticket_code || t.ticket_number || t.id }}</td>
                <td class="py-4 px-5 text-[11px] font-bold text-slate-800">{{ t.title || t.subject || t.category || '-' }}</td>
                <td class="py-4 px-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{{ t.technician_id || t.technician || '-' }}</td>
                <td class="py-4 px-5">
                  <span v-if="isClosed(t)" class="bg-slate-100 text-slate-500 border border-slate-200 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest">Zakończone</span>
                  <span v-else class="bg-rose-50 text-rose-600 border border-rose-200 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest">{{ t.ticket_status || t.status || 'NOWE' }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ZAKŁADKA 3: CZĘŚCI -->
      <div v-show="activeTab === 'parts'" class="flex-1 overflow-y-auto p-8 ticket-custom-scrollbar">
        <div class="bg-white border border-slate-200 rounded-2xl p-12 shadow-sm text-center">
          <svg class="w-16 h-16 text-slate-300 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          <h3 class="text-sm font-black text-slate-800 uppercase tracking-widest">Historia Wymiany Części</h3>
          <p class="text-xs text-slate-500 mt-2 max-w-md mx-auto">Moduł integracji z sys_inventory_logs w przygotowaniu. Będziesz mógł tu śledzić koszty i części użyte do naprawy tej stacji.</p>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useTicketsStore } from '../stores/useTicketsStore'

const props = defineProps({
  show: Boolean,
  stationQp: String
})

defineEmits(['close'])

const store = useTicketsStore()
const activeTab = ref('overview')

watch(() => props.show, (isOpen) => {
  if (isOpen) {
    activeTab.value = 'overview'
  }
})

// Obiekt stacji ze słownika
const stationObj = computed(() => {
  if (!props.stationQp || !store.stations) return null
  const qp = props.stationQp.toUpperCase().trim()
  return store.stations.find(s => {
    let sId = (s.public_id || s.id || '').toUpperCase()
    return sId.includes(qp) || qp.includes(sId)
  })
})

const stationAddress = computed(() => {
  if (!stationObj.value) return 'Brak danych adresowych'
  return [stationObj.value.city, stationObj.value.street, stationObj.value.street_number].filter(Boolean).join(', ') || 'Brak danych adresowych'
})

// Odfiltrowane zgłoszenia dla tej stacji
const stationTickets = computed(() => {
  if (!props.stationQp || !store.tickets) return []
  const qp = props.stationQp.toUpperCase().trim()

  return store.tickets.filter(t => {
    let tQp = String(t.qp_id || t.qp_id_full || t.station_id || '').toUpperCase()
    return tQp && (tQp.includes(qp) || qp.includes(tQp))
  }).sort((a, b) => new Date(b.created_at || b.date_created || 0) - new Date(a.created_at || a.date_created || 0))
})

const isClosed = (t) => {
  const check = (str) => {
    let lower = String(str || '').toLowerCase()
    return lower.includes('zakończ') || lower.includes('close') || lower.includes('done') || 
           lower.includes('zrobione') || lower.includes('zamknięt') || lower.includes('anulowan') || 
           lower.includes('cancel')
  }
  return check(t?.status) || check(t?.ticket_status)
}

const hasActiveTicket = computed(() => {
  return stationTickets.value.some(t => !isClosed(t))
})

const lastTicketDisplay = computed(() => {
  if (stationTickets.value.length === 0) return 'Brak zgłoszeń'
  if (hasActiveTicket.value) return 'W toku'
  
  const lastDate = new Date(stationTickets.value[0].created_at || stationTickets.value[0].date_created)
  if (isNaN(lastDate)) return 'Brak danych'
  
  const daysAgo = Math.floor((new Date() - lastDate) / (1000 * 60 * 60 * 24))
  return daysAgo === 0 ? 'Dzisiaj' : `${daysAgo} dni temu`
})

const estimatedSla = computed(() => {
  if (stationTickets.value.length === 0) return '100.0'
  let slaCalc = 100 - (stationTickets.value.length * 0.15)
  if (slaCalc < 80) slaCalc = 80
  return slaCalc.toFixed(1)
})

// Obliczanie wartości dla wykresu awaryjności (ostatnie 12 miesięcy)
const monthlyChartData = computed(() => {
  const monthCounts = new Array(12).fill(0)
  const now = new Date()

  stationTickets.value.forEach(t => {
    let d = new Date(t.created_at || t.date_created)
    if (!isNaN(d)) {
      let diffMonths = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth())
      if (diffMonths >= 0 && diffMonths < 12) {
        monthCounts[11 - diffMonths]++
      }
    }
  })

  let maxTickets = Math.max(...monthCounts)
  if (maxTickets < 5) maxTickets = 5

  return monthCounts.map((count, i) => {
    let heightPct = (count / maxTickets) * 100
    if (heightPct < 5) heightPct = 5
    let dDate = new Date()
    dDate.setMonth(now.getMonth() - (11 - i))
    return {
      count,
      heightPct,
      monthName: dDate.toLocaleString('pl-PL', { month: 'short' })
    }
  })
})

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
</script>

<style scoped>
.ticket-custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.ticket-custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.ticket-custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.4); border-radius: 10px; }
.ticket-custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(88, 179, 71, 0.8); }
</style>