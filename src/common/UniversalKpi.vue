<template>
  <div class="w-full">
    <!-- NAGŁÓWEK: Tytuł, Subtitle i Przełącznik Widoków -->
    <div class="px-8 pt-6 pb-4 flex flex-col md:flex-row justify-between items-start shrink-0 gap-4">
      <div class="flex-1 min-w-0">
        <h1 class="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3 truncate">{{ title }}</h1>
        <p class="text-xs text-slate-500 font-semibold mt-1 truncate">{{ subtitle }}</p>
      </div>
      
      <div v-if="views && views.length > 0" class="flex flex-wrap items-center gap-4 justify-end shrink-0">
        <div class="flex bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200/60 gap-1">
          <button v-for="v in views" :key="v.value" @click="$emit('switch-view', v.value)" 
                  class="px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all"
                  :class="activeView === v.value ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'">
            {{ v.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- PASEK KAFELKÓW (ZAKŁADEK) -->
    <div class="px-8 shrink-0 w-full relative">
      <div class="pt-2 pb-4 overflow-x-auto ticket-custom-scrollbar w-full" @wheel.prevent="onScroll" ref="scrollContainer">
        <div class="flex gap-4 items-stretch select-none w-max pr-2">
          
          <template v-for="t in visibleTabs" :key="t.id">
            
            <!-- SPECJALNY KAFELEK: GRUPA TECHNIKÓW -->
            <div v-if="t.id === 'GROUP_TECHS'" 
                 @mouseenter="openTechPanel" @mouseleave="closeTechPanel"
                 class="relative rounded-2xl p-5 transition-all flex flex-col justify-center w-[240px] shrink-0 snap-start group border cursor-pointer"
                 :class="activeTabId.startsWith('TECH_') ? 'bg-[#f0f9ff] border-[#0ea5e9] border-2 shadow-[0_0_20px_rgba(14,165,233,0.25)] -translate-y-0.5' : 'bg-white border-slate-200 border shadow-sm'">
              
              <div class="flex justify-between items-center w-full mb-1 pointer-events-none">
                <p class="text-[10px] font-black uppercase tracking-widest" :style="{ color: activeTabId.startsWith('TECH_') ? '#0ea5e9' : '#94a3b8' }">TECHNICY ({{ visibleTechTabs.length }}/{{ techTabs.length }})</p>
                <svg class="w-4 h-4" :class="activeTabId.startsWith('TECH_') ? 'text-[#0ea5e9]' : 'text-slate-300'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              
              <div class="flex items-center -space-x-2.5 mt-2 pointer-events-none">
                <template v-if="visibleTechTabs.length === 0">
                   <span class="text-[11px] font-bold text-slate-400">Wybierz techników</span>
                </template>
                <template v-else>
                   <div v-for="(tech, i) in visibleTechTabs.slice(0, 4)" :key="tech.id"
                        class="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-white border-2 border-white shadow-sm"
                        :style="{ backgroundColor: tech.color, zIndex: 10 - i }">
                     {{ getInitials(tech.name) }}
                   </div>
                   <div v-if="visibleTechTabs.length > 4" class="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-slate-500 bg-slate-100 border-2 border-white shadow-sm z-0">
                     +{{ visibleTechTabs.length - 4 }}
                   </div>
                </template>
              </div>
            </div>

            <!-- STANDARDOWY KAFELEK KPI -->
            <div v-else 
                 draggable="true" @dragstart="dragStart($event, t.id)" @dragover.prevent @drop="drop($event, t.id)"
                 @click="$emit('select-tab', t.id)" @contextmenu.prevent="$emit('edit-tab', t.id)"
                 class="relative rounded-2xl p-5 border transition-all cursor-pointer flex items-center justify-between hover:shadow-md w-[240px] shrink-0 snap-start group"
                 :style="getCardStyle(t)">
              
              <!-- Przycisk usunięcia (Tylko dla niestandardowych zakładek) -->
              <div v-if="t.filter === 'CUSTOM'" @click.stop="$emit('delete-tab', t.id)" class="absolute top-[-1px] right-[-1px] w-9 h-9 bg-red-500 hover:bg-red-600 transition-colors cursor-pointer z-10 flex items-start justify-end opacity-0 group-hover:opacity-100" style="border-top-right-radius: 15px; clip-path: polygon(0 0, 100% 0, 100% 100%);">
                 <svg class="w-3.5 h-3.5 text-white mr-1.5 mt-1.5 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </div>

              <div class="overflow-hidden pr-2 min-w-0 flex-1 pointer-events-none">
                <p class="text-[10px] font-black uppercase tracking-widest mb-1 truncate w-full" :style="{ color: activeTabId === t.id ? (t.color || '#58b347') : '#94a3b8' }">{{ t.name }}</p>
                <p class="text-3xl font-black text-slate-800">{{ tabCounts[t.id] || 0 }}</p>
              </div>
              <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all pointer-events-none" :style="getIconStyle(t)">
                <!-- ZMIANA: Dodano obsługę dekodowania SVG -->
                <span v-html="decodeIcon(t.icon)"></span>
              </div>
            </div>

          </template>

          <!-- DODAJ NOWY FILTR -->
          <div @click="$emit('open-modal')" class="border-2 border-dashed border-slate-300 rounded-2xl p-5 flex flex-col items-center justify-center text-slate-400 hover:border-[#58b347] hover:text-[#58b347] hover:bg-white/50 cursor-pointer transition-all gap-1 w-[240px] shrink-0 snap-start">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
            <span class="text-[10px] font-black uppercase tracking-widest">NOWY FILTR</span>
          </div>
          
        </div>
      </div>
    </div>

    <!-- HOVER PANEL DLA KAFELKA TECHNIKÓW -->
    <Teleport to="body">
      <div v-if="isTechPanelOpen" class="fixed z-[99999] w-80 pt-2 transition-all duration-300 pointer-events-auto flex flex-col animate-fadeIn"
           :style="techPanelStyle" @mouseenter="keepTechPanelOpen" @mouseleave="closeTechPanel">
        <div class="bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-[0_30px_80px_-15px_rgba(0,0,0,0.2)] p-5">
          <div class="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h4 class="text-[11px] font-black text-slate-800 uppercase tracking-widest">Wybierz widocznych</h4>
            <span class="text-[9px] font-bold px-2 py-1 rounded-md bg-blue-50 text-blue-600 uppercase tracking-wider">{{ visibleTechTabs.length }} z {{ techTabs.length }}</span>
          </div>
          <div class="grid grid-cols-2 gap-2 max-h-[350px] overflow-y-auto ticket-custom-scrollbar pr-1 pb-1">
            <button v-for="t in techTabs" :key="t.id" @click="toggleTech(t.id)"
                    class="px-2 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 border border-solid hover:-translate-y-0.5 truncate"
                    :style="!t.isHidden ? `background-color: ${t.color}; color: white; border-color: ${t.color}; box-shadow: 0 4px 15px ${hexToRgba(t.color, 0.25)};` : 'background-color: transparent; color: #64748b; border-color: #cbd5e1;'"
                    :title="t.name">
              {{ t.name }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  title: String,
  subtitle: String,
  views: Array,
  activeView: String,
  activeTabId: String,
  tabs: Array,
  tabCounts: Object
})

const emit = defineEmits([
  'switch-view', 'select-tab', 'edit-tab', 'delete-tab', 
  'open-modal', 'reorder-tabs', 'save-settings'
])

const decodeIcon = (iconStr) => {
  if (!iconStr) return ''
  try {
    let svg = iconStr.trim()
    // Jeśli to ciąg Base64, zdekoduj go
    if (!svg.startsWith('<svg')) {
      svg = decodeURIComponent(escape(atob(iconStr)))
    }
    // Zabezpieczenie przed literówkami w atrybutach ścieżek path
    if (svg.includes('2-2h9py') || !svg.includes('</svg>')) {
      return `<svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
    }
    return svg
  } catch (e) {
    // Domyślna ikona w przypadku jakiegokolwiek błędu dekodowania
    return `<svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`
  }
}

// --- OBLICZENIA I FILTROWANIE DLA TECHNIKÓW ---
const visibleTabs = computed(() => props.tabs.filter(t => !t.isHidden))
const techTabs = computed(() => props.tabs.filter(t => t.id.startsWith('TECH_')))
const visibleTechTabs = computed(() => techTabs.value.filter(t => !t.isHidden))

const getInitials = (name) => {
  if (!name) return ''
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// --- LOGIKA HOVER PANELU DLA TECHNIKÓW ---
const isTechPanelOpen = ref(false)
const techPanelStyle = ref({ top: '0px', left: '0px' })
let hideTimeout = null

const openTechPanel = (e) => {
  clearTimeout(hideTimeout)
  const rect = e.currentTarget.getBoundingClientRect()
  
  let left = rect.left + (rect.width / 2) - 160
  if (left < 10) left = 10
  if (left + 320 > window.innerWidth) left = window.innerWidth - 330
  
  techPanelStyle.value = {
    top: `${rect.bottom}px`,
    left: `${left}px`
  }
  isTechPanelOpen.value = true
}

const closeTechPanel = () => {
  hideTimeout = setTimeout(() => {
    isTechPanelOpen.value = false
  }, 250)
}

const keepTechPanelOpen = () => {
  clearTimeout(hideTimeout)
}

const toggleTech = (techId) => {
  const tab = props.tabs.find(t => t.id === techId)
  if (tab) {
    tab.isHidden = !tab.isHidden
    if (tab.isHidden && props.activeTabId === techId) {
      emit('select-tab', 'ALL')
    }
    emit('save-settings')
  }
}

// --- FUNKCJE POMOCNICZE UI (KOLORY, DRAG&DROP) ---
const scrollContainer = ref(null)
const onScroll = (e) => {
  if (e.deltaY !== 0 && scrollContainer.value) {
    scrollContainer.value.scrollLeft += e.deltaY > 0 ? 50 : -50
  }
}

const hexToRgba = (hex, alpha) => {
  if (!hex || !hex.startsWith('#')) return `rgba(88, 179, 71, ${alpha})`
  let c = hex.substring(1)
  if (c.length === 3) c = c.split('').map(x => x+x).join('')
  let num = parseInt(c, 16)
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`
}

const getCardStyle = (t) => {
  const isActive = props.activeTabId === t.id
  const color = t.color || '#58b347'
  
  if (isActive) {
    return {
      backgroundColor: hexToRgba(color, 0.08),
      borderColor: color,
      boxShadow: `0 0 20px ${hexToRgba(color, 0.25)}`,
      borderWidth: '2px',
      transform: 'translateY(-2px)'
    }
  }
  return {
    backgroundColor: '#ffffff',
    borderColor: 'rgba(226, 232, 240, 0.8)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
    borderWidth: '1px'
  }
}

const getIconStyle = (t) => {
  const isActive = props.activeTabId === t.id
  const color = t.color || '#58b347'
  
  if (isActive) return { backgroundColor: color, color: '#ffffff' }
  return { backgroundColor: hexToRgba(color, 0.12), color: color }
}

const draggedId = ref(null)
const dragStart = (e, id) => {
  draggedId.value = id
  e.dataTransfer.effectAllowed = 'move'
}

const drop = (e, targetId) => {
  if (draggedId.value && draggedId.value !== targetId) {
    emit('reorder-tabs', { sourceId: draggedId.value, targetId })
  }
  draggedId.value = null
}
</script>

<style scoped>
.ticket-custom-scrollbar::-webkit-scrollbar { height: 6px; }
.ticket-custom-scrollbar::-webkit-scrollbar-track { background: rgba(88, 179, 71, 0.1); border-radius: 10px; }
.ticket-custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(88, 179, 71, 0.4); border-radius: 10px; }
.ticket-custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(88, 179, 71, 0.8); }
</style>