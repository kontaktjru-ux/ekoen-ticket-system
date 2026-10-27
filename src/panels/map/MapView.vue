<template>
  <div class="absolute inset-0 bg-slate-50 z-10 flex flex-col font-sans overflow-hidden">
    
    <!-- EKRAN ŁADOWANIA INICJALNEGO -->
    <div v-if="store.isLoading || isSavingZone" class="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center transition-all duration-500">
      <div v-if="isSavingZone" class="relative flex items-center justify-center mb-4">
        <div class="absolute inset-0 bg-[#58b347] rounded-full blur-md opacity-40 animate-pulse"></div>
        <div class="bg-white border-[3px] border-[#58b347] rounded-full w-20 h-20 shadow-xl relative flex items-center justify-center">
          <div class="bg-[#58b347] rounded-full w-14 h-14 flex items-center justify-center">
             <svg class="w-8 h-8 text-white animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
               <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
               <circle cx="12" cy="12" r="10" stroke-dasharray="20 10" class="animate-spin-stable"/>
             </svg>
          </div>
        </div>
      </div>
      <svg v-else viewBox="0 0 200 200" class="w-32 h-32 mb-6" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M100 10C149.706 10 190 50.2944 190 100C190 149.706 149.706 190 100 190C50.2944 190 10 149.706 10 100C10 50.2944 50.2944 10 100 10Z" stroke="#58b347" stroke-width="12" />
        <g class="animate-spin-stable">
          <circle cx="100" cy="100" r="70" fill="#58b347" />
          <path d="M85 70H135V85H85V70ZM65 92.5H115V107.5H65V92.5ZM85 115H135V130H85V115Z" fill="white" />
        </g>
      </svg>
      <h2 class="text-xl font-bold text-slate-800 animate-pulse tracking-widest uppercase">
        {{ isSavingZone ? 'ZAPISYWANIE ZMIAN W CHMURZE...' : 'EKOEN SYSTEM' }}
      </h2>
      <p class="text-slate-400 text-sm mt-2">
        {{ isSavingZone ? 'Przetwarzanie kształtów stref...' : 'Inicjalizacja modułów przestrzennych...' }}
      </p>
    </div>

    <!-- KONTENER MAPY -->
    <div ref="mapContainer" class="absolute inset-0 w-full h-full"></div>

    <!-- NAKŁADKI UI: TOP LEFT -->
    <div v-if="!store.isLoading" class="absolute top-6 left-6 z-20 flex flex-row items-center gap-2 flex-nowrap w-max" :class="isSidebarExpanded ? 'translate-x-[184px]' : 'translate-x-0'" style="transition: transform 0.3s ease-out;">
      
      <button @click="openAddStation" class="shrink-0 box-border bg-white/90 backdrop-blur-xl border border-white/50 shadow-lg px-4 rounded-xl text-slate-700 font-bold hover:bg-white hover:text-[#58b347] transition-all flex items-center gap-2 text-[13px] h-[42px] whitespace-nowrap">
        <svg class="w-4 h-4 text-[#58b347]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14"/><path d="M12 5v14"/></svg> Dodaj stację
      </button>

      <button @click="openSectorEditorFromUI" class="shrink-0 box-border bg-white/90 backdrop-blur-xl border border-white/50 shadow-lg px-4 rounded-xl text-slate-700 font-bold hover:bg-white hover:text-blue-500 transition-all flex items-center gap-2 text-[13px] h-[42px] whitespace-nowrap" :class="isSectorEditorOpen ? '!border-blue-500 text-blue-500 bg-blue-50' : ''">
        <svg class="w-4 h-4" :class="isSectorEditorOpen ? 'text-blue-500' : 'text-slate-400'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/></svg>
        Edytor Terytoriów
      </button>

      <button @click="toggleSectors" class="shrink-0 box-border bg-white/90 backdrop-blur-xl border border-white/50 shadow-lg px-4 rounded-xl text-slate-700 font-bold hover:bg-white transition-all flex items-center gap-2 text-[13px] h-[42px] whitespace-nowrap">
        <svg class="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 17 22 12"/></svg>
        {{ showSectors ? 'Ukryj strefy' : 'Pokaż strefy' }}
      </button>

      <!-- FILTRY MAPY VUE -->
      <div class="relative flex items-center shrink-0 box-border h-[42px]">
        <button @click="toggleMenu('filter')" class="bg-white/90 backdrop-blur-xl border shadow-lg px-4 rounded-xl font-bold transition-all flex items-center gap-2 text-[13px] h-[42px] whitespace-nowrap cursor-pointer shrink-0 box-border" :class="filterStatus !== '' || filterTech !== '' ? 'border-red-200 text-red-600 bg-red-50' : 'border-slate-200/80 text-slate-700 hover:bg-slate-50'">
          <svg class="w-4 h-4" :class="filterStatus !== '' || filterTech !== '' ? 'text-red-500' : 'text-slate-400'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg> 
          {{ filterStatus !== '' ? 'Zgłoszenia / Status' : filterTech !== '' ? 'Wybrany Technik' : 'Filtry mapy' }}
        </button>
        
        <div v-show="activeMenu === 'filter'" class="absolute top-[48px] left-0 w-80 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-[0_15px_40px_-10px_rgba(0,0,0,0.1)] border border-slate-200 p-5 z-[100] flex flex-col gap-4 animate-fadeIn">
          <div class="border-b border-slate-100/60 pb-2 flex justify-between items-center">
            <h3 class="font-bold text-slate-800 text-sm">Filtruj stacje i zgłoszenia</h3>
            <button v-if="filterStatus !== '' || filterTech !== ''" @click="setFilterStatus(''); setFilterTech('')" class="text-xs text-red-500 hover:text-red-700 font-bold uppercase tracking-widest">Wyczyść</button>
          </div>
          <div class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-500 mb-1.5">Typ / Status / Kategoria</label>
              <div class="relative">
                  <div @click="toggleDropdown('status')" :class="activeDropdown === 'status' ? 'border-[#58b347] ring-2 ring-[#58b347]/20' : 'border-slate-200'" class="bg-slate-50 border rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 flex justify-between items-center cursor-pointer hover:border-[#58b347]/50 transition-colors shadow-inner">
                    <span :class="filterStatus === '' ? 'text-slate-400' : 'text-slate-800'">{{ getStatusLabel(filterStatus) }}</span>
                    <svg class="w-4 h-4 text-slate-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                  <ul v-show="activeDropdown === 'status'" class="absolute left-0 right-0 top-full mt-1 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 custom-scrollbar max-h-56 overflow-y-auto">
                    <li @click="setFilterStatus('')" class="px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors">Wszystkie stacje</li>
                    <li @click="setFilterStatus('HAS_TICKET')" class="px-3 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-colors">Aktywne zgłoszenia</li>
                    <div class="px-3 py-1.5 mt-1 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Status stacji w bazie</div>
                    <li @click="setFilterStatus('CAT_REPAIR')" class="px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors">Naprawa</li>
                    <li @click="setFilterStatus('CAT_INSPECTION')" class="px-3 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors">Przegląd</li>
                    <li @click="setFilterStatus('CAT_COMMISSIONING')" class="px-3 py-2 text-sm font-bold text-yellow-600 hover:bg-yellow-50 rounded-lg cursor-pointer transition-colors">Uruchomienie</li>
                    <div class="px-3 py-1.5 mt-1 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Zgłoszenia operacyjne</div>
                    <li @click="setFilterStatus('TICK_OCZEKUJE_CZESCI')" class="px-3 py-2 text-sm font-bold text-orange-500 hover:bg-orange-50 rounded-lg cursor-pointer transition-colors">Oczekuje na Części</li>
                    <li @click="setFilterStatus('TICK_OCZEKUJE_REALIZACJA')" class="px-3 py-2 text-sm font-bold text-indigo-500 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors">Oczekuje na Realizację</li>
                    <li @click="setFilterStatus('TICK_WYKONANO')" class="px-3 py-2 text-sm font-bold text-emerald-500 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors">Wykonano</li>
                  </ul>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-500 mb-1.5">Przypisany Technik (Grep)</label>
               <div class="relative">
                  <div @click="toggleDropdown('tech')" :class="activeDropdown === 'tech' ? 'border-[#58b347] ring-2 ring-[#58b347]/20' : 'border-slate-200'" class="bg-slate-50 border rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 flex justify-between items-center cursor-pointer hover:border-[#58b347]/50 transition-colors shadow-inner">
                    <span :class="filterTech === '' ? 'text-slate-400' : 'text-slate-800'">{{ filterTech === '' ? 'Wszyscy technicy' : getTechLabel(filterTech) }}</span>
                    <svg class="w-4 h-4 text-slate-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                  <ul v-show="activeDropdown === 'tech'" class="absolute left-0 right-0 top-full mt-1 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 custom-scrollbar max-h-48 overflow-y-auto">
                    <li @click="setFilterTech('')" class="px-3 py-2 text-sm font-bold text-slate-700 hover:bg-[#58b347]/10 hover:text-[#58b347] rounded-lg cursor-pointer transition-colors">Wszyscy technicy</li>
                    <li v-for="t in uniqueTechNames" :key="t" @click="setFilterTech(t)" class="px-3 py-2 text-sm font-bold text-slate-700 hover:bg-[#58b347]/10 hover:text-[#58b347] rounded-lg cursor-pointer transition-colors">{{ t }}</li>
                  </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TRASY LOGISTYCZNE VUE -->
      <div class="relative flex items-center shrink-0 box-border h-[42px]">
        <button @click="toggleMenu('route')" class="bg-white/90 backdrop-blur-xl border shadow-lg px-4 rounded-xl font-bold transition-all flex items-center gap-2 text-[13px] h-[42px] whitespace-nowrap shrink-0 box-border" :class="isRoutingActive ? 'border-blue-300 bg-blue-50 text-blue-600' : 'border-slate-200/80 text-slate-700 hover:bg-slate-50'">
          <svg class="w-4 h-4" :class="isRoutingActive ? 'text-blue-500' : 'text-slate-400'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></svg> Trasy logistyczne
        </button>
        <div v-show="activeMenu === 'route'" class="absolute top-[48px] left-0 w-80 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-[0_15px_40px_-10px_rgba(0,0,0,0.1)] border border-slate-200 p-5 z-[100] flex flex-col gap-4 animate-fadeIn">
          <div class="border-b border-slate-100/60 pb-2">
            <h3 class="font-bold text-slate-800 text-sm">Wyznacz optymalną trasę</h3>
            <p class="text-xs text-slate-500 mt-1">Połącz otwarte awarie z rejonu technika.</p>
          </div>
          <div class="space-y-3">
             <div class="relative">
                <div @click="toggleDropdown('routeTech')" :class="activeDropdown === 'routeTech' ? 'border-[#58b347] ring-2 ring-[#58b347]/20' : 'border-slate-200'" class="bg-slate-50 border rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 flex justify-between items-center cursor-pointer hover:border-[#58b347]/50 transition-colors shadow-inner">
                  <span :class="routeTech === '' ? 'text-slate-400 font-medium' : 'text-slate-800 font-medium'">{{ routeTech === '' ? 'Wybierz...' : getRouteTechLabel(routeTech) }}</span>
                  <svg class="w-4 h-4 text-slate-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                <ul v-show="activeDropdown === 'routeTech'" class="absolute left-0 right-0 top-full mt-1 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 custom-scrollbar max-h-48 overflow-y-auto">
                  <li v-for="t in store.techs" :key="t.id" @click="setRouteTech(t.id)" class="px-3 py-2 text-sm font-bold text-slate-700 hover:bg-[#58b347]/10 hover:text-[#58b347] rounded-lg cursor-pointer transition-colors">{{ t.name }}</li>
                </ul>
            </div>
            <button @click="calculateRoute" :disabled="isRoutingInProgress" class="w-full bg-[#58b347] text-white font-bold py-2.5 rounded-xl text-sm hover:bg-[#499b3a] transition-all shadow-[0_4px_14px_rgba(88,179,71,0.2)] disabled:bg-slate-300 disabled:shadow-none">
              {{ isRoutingInProgress ? 'Wyznaczanie...' : 'Oblicz optymalną trasę' }}
            </button>
            <button @click="clearRoute" class="w-full text-xs text-slate-400 hover:text-red-500 font-bold py-1.5 transition-colors">Wyczyść linię z mapy</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ZEWNĘTRZNY EDYTOR STREF ZINTEGROWANY JAKO PLUGIN -->
    <SectorEditor 
      ref="sectorEditorRef"
      v-if="!store.isLoading"
      :class="isSidebarExpanded ? 'translate-x-[184px]' : 'translate-x-0'"
      class="transition-transform duration-300 ease-out"
      :isOpen="isSectorEditorOpen"
      :initialTab="sectorEditorTab"
      :sectors="store.techs"
      :regions="store.areas"
      :stations="store.stations"
      :hiddenTechs="store.hiddenTechs"
      :hiddenAreas="store.hiddenAreas"
      :mapInstance="map" 
      :drawInstance="draw"
      :cachedRegionsFeatures="cachedRegionsFeatures"
      :countryPolygons="countryPolygons"
      @close="closeSectorEditor"
      @deleteSector="clearSectorGeom"
      @hardDeleteEntity="deleteEntityCompletely"
      @toggleVisibility="handleToggleVisibility"
      @createNewArea="createNewAreaVue"
      @refreshData="refreshMapVue"
      @savingStateChanged="(val) => isSavingZone = val"
    />

    <!-- MENU KONTEKSTOWE NA MAPIE (Prawy Przycisk Myszy) -->
    <div v-show="contextMenu.show" :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }" class="absolute z-[999999] bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl shadow-2xl p-2 w-64 animate-fadeIn">
       <div class="px-3 py-2 border-b border-slate-100 mb-1 flex items-center gap-2">
           <svg class="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
           <span class="text-[10px] font-black uppercase tracking-widest text-slate-500">Opcje Mapy</span>
       </div>
       <div @click="handleContextMenuAction('add_station')" class="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-[#58b347]/10 hover:text-[#58b347] rounded-lg cursor-pointer transition-colors">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Dodaj stację w tym miejscu
       </div>
       <div @click="handleContextMenuAction('edit_techs')" class="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg cursor-pointer transition-colors">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon><line x1="9" x2="9" y1="3" y2="18"></line><line x1="15" x2="15" y1="6" y2="21"></line></svg>
          Zarządzaj strefami techników
       </div>
       <div @click="handleContextMenuAction('edit_areas')" class="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-green-50 hover:text-green-600 rounded-lg cursor-pointer transition-colors">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
          Zarządzaj obszarami analitycznymi
       </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, shallowRef, onMounted, onBeforeUnmount, watch } from 'vue'
import { useMapStore } from '../../stores/useMapStore'
import SectorEditor from '../../composables/SectorEditor.vue'

import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import * as turf from '@turf/turf'

const props = defineProps({ isSidebarExpanded: Boolean })
const store = useMapStore()

const mapContainer = ref(null)
const map = shallowRef(null)
const draw = shallowRef(null)
const sectorEditorRef = ref(null) 

const isSavingZone = ref(false)
const showSectors = ref(true)
const isSectorEditorOpen = ref(false)
const sectorEditorTab = ref('technicians')

// Dodany stan do sterowania menu i listami
const activeMenu = ref(null)
const activeDropdown = ref(null)

const cachedRegionsFeatures = ref([])
const countryPolygons = ref([])
const hoveredBoundaryIds = ref([])
const hoveredStateId = ref(null)

const filterStatus = ref('')
const filterTech = ref('')
const routeTech = ref('')
const isRoutingInProgress = ref(false)
const isRoutingActive = ref(false)

const contextMenu = ref({ show: false, x: 0, y: 0, lat: null, lng: null })

let autoRefreshInterval = null;

function startAutoRefresh() {
  if (autoRefreshInterval) clearInterval(autoRefreshInterval);
  // Odświeżaj co 60 sekund
  autoRefreshInterval = setInterval(() => {
    const isDrawing = sectorEditorRef.value && sectorEditorRef.value.isDrawing();
    // Odświeżaj tylko jeśli nie rysujesz i aktualnie nie zapisujesz
    if (!isDrawing && !isSavingZone.value) {
      store.fetchMapData(true); // Ciche pobranie w tle
    }
  }, 60000);
}

// ==========================================
// FUNKCJE UI I MENU
// ==========================================
function toggleMenu(menu) { 
  activeMenu.value = activeMenu.value === menu ? null : menu;
  activeDropdown.value = null; // Zamknij listy po kliknięciu w inne menu
}

function toggleDropdown(name) {
  activeDropdown.value = activeDropdown.value === name ? null : name;
}

function toggleSectors() {
  showSectors.value = !showSectors.value
  if (map.value && map.value.getLayer('saved-sectors-layer')) {
    const visibility = showSectors.value ? 'visible' : 'none'
    map.value.setLayoutProperty('saved-sectors-layer', 'visibility', visibility)
    map.value.setLayoutProperty('saved-sectors-outline', 'visibility', visibility)
    if (map.value.getLayer('saved-regions-layer')) {
        map.value.setLayoutProperty('saved-regions-layer', 'visibility', visibility)
        map.value.setLayoutProperty('saved-regions-outline', 'visibility', visibility)
    }
  }
}

function openSectorEditorFromUI() {
  sectorEditorTab.value = 'technicians'
  isSectorEditorOpen.value = true
  if (!showSectors.value) toggleSectors()
}

function closeSectorEditor() {
  isSectorEditorOpen.value = false
  if (sectorEditorRef.value && sectorEditorRef.value.isDrawing()) {
      sectorEditorRef.value.cancelDrawing();
  }
}

function handleContextMenuAction(action) {
  contextMenu.value.show = false;
  if (action === 'add_station') openAddStation(contextMenu.value.lat, contextMenu.value.lng)
  else if (action === 'edit_techs') { sectorEditorTab.value = 'technicians'; isSectorEditorOpen.value = true; if(!showSectors.value) toggleSectors(); }
  else if (action === 'edit_areas') { sectorEditorTab.value = 'regions'; isSectorEditorOpen.value = true; if(!showSectors.value) toggleSectors(); }
}

function openAddStation(lat = null, lng = null) {
  if (typeof window.m_openQuickAddStation === 'function') {
    let finalLat = typeof lat === 'number' ? lat : (contextMenu.value.lat || null);
    let finalLng = typeof lng === 'number' ? lng : (contextMenu.value.lng || null);
    window.m_openQuickAddStation(false, finalLat, finalLng);
  } else alert('Moduł dodawania stacji niedostępny w tym widoku.');
}

function refreshMapVue() {
  store.fetchMapData(true);
}

// ==========================================
// ZARZĄDZANIE WIDOCZNOŚCIĄ I DANYMI (GEOFENCING)
// ==========================================
function isEntityHidden(collection, id) {
  if (!collection) return false;
  if (typeof collection.has === 'function') return collection.has(id);
  if (Array.isArray(collection)) return collection.includes(id);
  return false;
}

function handleToggleVisibility(id, type) {
  if (type === 'technician') {
    store.toggleTechVisibility(id);
    // Zapisujemy po chwili, by store zdążył się zaktualizować
    setTimeout(() => localStorage.setItem('ekoen_hidden_techs', JSON.stringify(Array.from(store.hiddenTechs))), 50);
  } else {
    store.toggleAreaVisibility(id);
    setTimeout(() => localStorage.setItem('ekoen_hidden_areas', JSON.stringify(Array.from(store.hiddenAreas))), 50);
  }
}

function clearSectorGeom(id, type) {
  if(!confirm(`Czy na pewno chcesz całkowicie wyczyścić obrys z mapy? To nie usunie rekordu z bazy.`)) return;
  if (typeof google !== 'undefined' && google.script) {
      google.script.run
          .withSuccessHandler(() => store.fetchMapData(true))
          [type === 'technician' ? 'updateTechnicianGeometry' : 'updateAreaGeometry'](id, "");
  }
}

function deleteEntityCompletely(id, type) {
  if(!confirm(`UWAGA! Czy trwale i bezpowrotnie USUNĄĆ ten element z bazy danych?`)) return;
  if (type === 'area') {
      store.deleteAreaFromCloud(id, () => alert("Obszar usunięty."));
  }
}

function createNewAreaVue(name) {
  let newId = 'area_' + Date.now();
  if (typeof google !== 'undefined' && google.script) {
      store.isLoading = true;
      google.script.run
        .withSuccessHandler((res) => {
           store.fetchMapData(true);
           store.isLoading = false;
        })
        .withFailureHandler((err) => { store.isLoading = false; alert("Błąd: " + err.message); })
        .createNewAreaRecord(newId, name, '#3b82f6');
  }
}

// ==========================================
// FILTRY I ROUTING VUE (OSRM)
// ==========================================
const uniqueTechNames = computed(() => {
  const names = new Set();
  store.techs.forEach(t => { if (t.name) names.add(t.name.trim()) });
  store.stations.forEach(s => {
    const techVal = s.ticket_technician || s.technician_name || s.technician || '';
    if (techVal) techVal.split(',').forEach(x => { if(x.trim()) names.add(x.trim()) });
  });
  return Array.from(names).sort();
});

function getStatusLabel(val) {
  if (val === 'HAS_TICKET') return 'Aktywne zgłoszenia';
  if (val === 'CAT_REPAIR') return 'Naprawa';
  if (val === 'CAT_INSPECTION') return 'Przegląd';
  if (val === 'CAT_COMMISSIONING') return 'Uruchomienie';
  if (val === 'TICK_OCZEKUJE_CZESCI') return 'Oczekuje na Części';
  if (val === 'TICK_OCZEKUJE_REALIZACJA') return 'Do Realizacji';
  if (val === 'TICK_WYKONANO') return 'Wykonano';
  return 'Wszystkie stacje';
}
function getTechLabel(val) { return val ? (uniqueTechNames.value.find(t => t.toLowerCase() === val.toLowerCase()) || val) : 'Wszyscy technicy'; }
function getRouteTechLabel(id) { const t = store.techs.find(x => x.id === id); return t ? t.name : 'Wybierz...'; }

function setFilterStatus(val) { filterStatus.value = val; activeDropdown.value = null; applyFilters(); }
function setFilterTech(val) { filterTech.value = val.toLowerCase(); activeDropdown.value = null; applyFilters(); }
function setRouteTech(id) { routeTech.value = id; activeDropdown.value = null; }

function applyFilters() {
  if (!map.value || !map.value.getSource('stations-data')) return;
  const fStatus = filterStatus.value;
  const fTech = filterTech.value;

  const filterColors = {
    '': '#58b347', 'HAS_TICKET': '#ef4444', 'CAT_REPAIR': '#dc2626', 'CAT_INSPECTION': '#3b82f6', 
    'CAT_COMMISSIONING': '#f59e0b', 'TICK_OCZEKUJE_CZESCI': '#f97316', 'TICK_OCZEKUJE_REALIZACJA': '#6366f1', 'TICK_WYKONANO': '#10b981'
  };

  let activeColor = fStatus !== '' ? (filterColors[fStatus] || '#94a3b8') : (fTech !== '' ? '#58b347' : '#94a3b8');
  if (map.value.getLayer('clusters')) map.value.setPaintProperty('clusters', 'circle-color', activeColor);
  if (map.value.getLayer('unclustered-point')) map.value.setPaintProperty('unclustered-point', 'circle-color', activeColor);
  
  const filtered = store.stations.filter(s => {
    let tId = s.active_ticket_id || '', tStatus = s.ticket_status || '', tCat = s.ticket_category || '';
    let mStatus = true;
    if (fStatus === 'HAS_TICKET') mStatus = (tId.trim() !== '');
    else if (fStatus === 'CAT_REPAIR') mStatus = (tCat === 'REPAIR');
    else if (fStatus === 'CAT_INSPECTION') mStatus = (tCat === 'INSPECTION');
    else if (fStatus === 'CAT_COMMISSIONING') mStatus = (tCat === 'COMMISSIONING');
    else if (fStatus === 'TICK_OCZEKUJE_CZESCI') mStatus = (tStatus === 'Oczekuje na Części');
    else if (fStatus === 'TICK_OCZEKUJE_REALIZACJA') mStatus = (tStatus === 'Oczekuje na Realizację');
    else if (fStatus === 'TICK_WYKONANO') mStatus = (tStatus === 'Wykonano');

    let mTech = true;
    if (fTech !== '') mTech = JSON.stringify(s).toLowerCase().includes(fTech);
    return mStatus && mTech;
  });
  
  // Zaktualizowane properties dla statystyk
  const features = filtered.filter(s => s.gps_lat && s.gps_lng).map(s => ({
    type: 'Feature', geometry: { type: 'Point', coordinates: [parseFloat(s.gps_lng.toString().replace(',','.')), parseFloat(s.gps_lat.toString().replace(',','.'))] },
    properties: { id: s.id, name: s.public_id, status: s.status, has_ticket_count: (s.active_ticket_id && s.active_ticket_id.trim() !== '') ? 1 : 0 }
  }));
  map.value.getSource('stations-data').setData({ type: 'FeatureCollection', features });
}

async function calculateRoute() {
  if (!routeTech.value) { alert("Najpierw wybierz technika z listy!"); return; }
  isRoutingInProgress.value = true;
  try {
    const stationsToVisit = store.stations.filter(s => s.technician_id === routeTech.value && s.status === 'Awaria' && s.gps_lat && s.gps_lng);
    if (stationsToVisit.length < 2) { alert("Wybrany technik ma mniej niż 2 otwarte awarie. Trasa nie jest wymagana."); clearRoute(); return; }

    const coordsStr = stationsToVisit.map(s => `${parseFloat(s.gps_lng.toString().replace(',','.'))},${parseFloat(s.gps_lat.toString().replace(',','.'))}`).join(';');
    const res = await fetch(`https://router.project-osrm.org/trip/v1/driving/${coordsStr}?source=first&roundtrip=false&geometries=geojson`);
    if (!res.ok) throw new Error("Błąd OSRM");
    const data = await res.json();
    if (data.code !== 'Ok' || !data.trips || data.trips.length === 0) { alert("Punkty nieosiągalne drogą publiczną."); return; }

    map.value.getSource('optimized-route').setData(data.trips[0].geometry);
    const bounds = data.trips[0].geometry.coordinates.reduce((b, c) => b.extend(c), new maplibregl.LngLatBounds(data.trips[0].geometry.coordinates[0], data.trips[0].geometry.coordinates[0]));
    map.value.fitBounds(bounds, { padding: 80, duration: 1500 });
    isRoutingActive.value = true;
    activeMenu.value = null;
  } catch (e) { alert("Błąd wyznaczania trasy: " + e.message); } finally { isRoutingInProgress.value = false; }
}

function clearRoute() {
  map.value.getSource('optimized-route').setData({ type: 'FeatureCollection', features: [] });
  isRoutingActive.value = false;
  activeMenu.value = null;
}

// ==========================================
// AKTUALIZACJA WARSTW MAPY
// ==========================================
function updateSectorMap() {
  if(!map.value || !map.value.getSource('saved-sectors')) return
  
  let featuresToRenderTechs = []
  let featuresToRenderAreas = []
  
  const processGeomForRender = (geomData, id, color, array) => {
    let geom = null
    if (typeof geomData === 'string' && geomData !== '') {
      try { geom = JSON.parse(geomData) } catch(e) {}
    } else if (typeof geomData === 'object') geom = geomData
    
    if (geom) {
       if (geom.type === 'FeatureCollection') {
         geom.features.forEach(f => array.push({ type: 'Feature', geometry: f.geometry, properties: { id: id, color: color } }))
       } else {
         array.push({ type: 'Feature', geometry: geom.geometry || geom, properties: { id: id, color: color } })
       }
    }
  }

  store.techs.forEach(t => {
     if (isEntityHidden(store.hiddenTechs, t.id)) return;
     processGeomForRender(t.zone_geometry, t.id, t.zone_color || t.color || '#58b347', featuresToRenderTechs)
  })

  store.areas.forEach(a => {
     if (isEntityHidden(store.hiddenAreas, a.id)) return; 
     processGeomForRender(a.zone_geometry, a.id, a.color || '#3b82f6', featuresToRenderAreas)
  })
  
  map.value.getSource('saved-sectors').setData({ type: 'FeatureCollection', features: featuresToRenderTechs })
  if (map.value.getSource('saved-regions')) {
      map.value.getSource('saved-regions').setData({ type: 'FeatureCollection', features: featuresToRenderAreas })
  }
}

// ==========================================
// INICJALIZACJA MAPY MAPBOX / MAPLIBRE
// ==========================================
function initMap() {
  if (!mapContainer.value) return

  map.value = new maplibregl.Map({
    container: mapContainer.value,
    style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    center: [19.14, 51.91],
    zoom: 5.5,
    pitch: 0, dragRotate: false, doubleClickZoom: false
  })

  if (typeof MapboxDraw !== 'undefined') {
    let customTheme = MapboxDraw.lib.theme.map(s => {
      let style = JSON.parse(JSON.stringify(s))
      if (style.paint && style.paint['line-dasharray']) style.paint['line-dasharray'] = [2, 2]
      return style
    })

    draw.value = new MapboxDraw({
      displayControlsDefault: false,
      controls: { polygon: false, trash: false },
      defaultMode: 'simple_select',
      styles: customTheme
    })
    map.value.addControl(draw.value)
  }

  map.value.on('load', async () => {
    map.value.addSource('optimized-route', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    map.value.addSource('saved-sectors', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
    map.value.addSource('saved-regions', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
    map.value.addSource('active-base-zone', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
    
    // Zaktualizowane źródło danych klastrów
    map.value.addSource('stations-data', { 
        type: 'geojson', data: { type: 'FeatureCollection', features: [] }, cluster: true, clusterRadius: 50,
        clusterProperties: { 
            'awaria_count': ['+', ['case', ['==', ['get', 'status'], 'Awaria'], 1, 0]], 
            'rework_count': ['+', ['case', ['==', ['get', 'status'], 'Rework'], 1, 0]],
            'uruchomienie_count': ['+', ['case', ['==', ['get', 'status'], 'Uruchomienie'], 1, 0]],
            'przeglad_count': ['+', ['case', ['==', ['get', 'status'], 'Przegląd'], 1, 0]]
        }
    });

    map.value.addLayer({ id: 'active-base-zone-fill', type: 'fill', source: 'active-base-zone', paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.3 } })
    map.value.addLayer({ id: 'active-base-zone-line', type: 'line', source: 'active-base-zone', paint: { 'line-color': '#1d4ed8', 'line-width': 2, 'line-dasharray': [4, 4] } })

    map.value.addLayer({ id: 'saved-sectors-layer', type: 'fill', source: 'saved-sectors', paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.25 } })
    map.value.addLayer({ id: 'saved-sectors-outline', type: 'line', source: 'saved-sectors', paint: { 'line-color': ['get', 'color'], 'line-width': 2 } })
    
    map.value.addLayer({ id: 'saved-regions-layer', type: 'fill', source: 'saved-regions', paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.15 } })
    map.value.addLayer({ id: 'saved-regions-outline', type: 'line', source: 'saved-regions', paint: { 'line-color': ['get', 'color'], 'line-width': 2, 'line-dasharray': [2, 2] } })

    map.value.addLayer({ id: 'optimized-route-line-glow', type: 'line', source: 'optimized-route', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#3b82f6', 'line-width': 10, 'line-opacity': 0.3 } })
    map.value.addLayer({ id: 'optimized-route-line', type: 'line', source: 'optimized-route', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#2563eb', 'line-width': 4, 'line-dasharray': [2, 2] } })

    // Zaktualizowane wyświetlanie klastrów
    map.value.addLayer({ 
        id: 'clusters', type: 'circle', source: 'stations-data', filter: ['has', 'point_count'], 
        paint: { 
            'circle-color': [
                'case',
                ['==', ['get', 'awaria_count'], ['get', 'point_count']], '#ef4444',
                ['==', ['get', 'rework_count'], ['get', 'point_count']], '#8b5cf6',
                ['==', ['get', 'uruchomienie_count'], ['get', 'point_count']], '#f59e0b',
                ['==', ['get', 'przeglad_count'], ['get', 'point_count']], '#3b82f6',
                ['==', ['+', ['get', 'awaria_count'], ['get', 'rework_count'], ['get', 'uruchomienie_count'], ['get', 'przeglad_count']], 0], '#58b347', 
                '#ffffff'
            ],
            'circle-opacity': 0.95, 
            'circle-radius': ['step', ['get', 'point_count'], 18, 10, 22, 50, 28], 
            'circle-stroke-width': 3, 
            'circle-stroke-color': [
                'case',
                ['==', ['get', 'awaria_count'], ['get', 'point_count']], 'rgba(255, 255, 255, 0.8)',
                ['==', ['get', 'rework_count'], ['get', 'point_count']], 'rgba(255, 255, 255, 0.8)',
                ['==', ['get', 'uruchomienie_count'], ['get', 'point_count']], 'rgba(255, 255, 255, 0.8)',
                ['==', ['get', 'przeglad_count'], ['get', 'point_count']], 'rgba(255, 255, 255, 0.8)',
                ['==', ['+', ['get', 'awaria_count'], ['get', 'rework_count'], ['get', 'uruchomienie_count'], ['get', 'przeglad_count']], 0], 'rgba(255, 255, 255, 0.8)',
                '#0f172a'
            ] 
        } 
    });

    map.value.addLayer({ 
        id: 'clusters-bg', type: 'circle', source: 'stations-data', filter: ['has', 'point_count'], 
        paint: { 
            'circle-color': '#94a3b8', 'circle-opacity': 0.0, 
            'circle-radius': ['step', ['get', 'point_count'], 18, 10, 22, 50, 28], 
            'circle-stroke-width': 3, 'circle-stroke-color': 'rgba(255, 255, 255, 0.8)'
        } 
    });

    map.value.addLayer({ id: 'cluster-count', type: 'symbol', source: 'stations-data', filter: ['has', 'point_count'], layout: { 'text-field': '{point_count_abbreviated}', 'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'], 'text-size': 14 }, paint: { 'text-color': '#ffffff' } });
    map.value.addLayer({ id: 'unclustered-point', type: 'circle', source: 'stations-data', filter: ['!', ['has', 'point_count']], paint: { 'circle-radius': 7, 'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff', 'circle-color': '#94a3b8' } });

    map.value.on('click', 'clusters', (e) => {
        const clusterId = map.value.queryRenderedFeatures(e.point, { layers: ['clusters'] })[0].properties.cluster_id;
        map.value.getSource('stations-data').getClusterExpansionZoom(clusterId).then(zoom => map.value.easeTo({ center: e.lngLat, zoom: zoom }));
    });
    map.value.on('mouseenter', 'clusters', () => map.value.getCanvas().style.cursor = 'pointer');
    map.value.on('mouseleave', 'clusters', () => map.value.getCanvas().style.cursor = '');
    
    map.value.on('click', 'unclustered-point', (e) => {
        if(typeof window.m_openStationPanel === 'function') window.m_openStationPanel(e.features[0].properties.id);
        else alert(`Kliknięto stację: ${e.features[0].properties.name}`);
    });

    map.value.on('contextmenu', (e) => {
        if(e.originalEvent) e.originalEvent.preventDefault();
        contextMenu.value = { show: true, x: e.originalEvent.clientX, y: e.originalEvent.clientY, lat: e.lngLat.lat, lng: e.lngLat.lng };
    });
    map.value.on('click', () => { contextMenu.value.show = false; });

    loadGeoJsonBoundaries();
    updateSectorMap();
    applyFilters();
  })
}

// ==========================================
// ŁADOWANIE GRANIC GEOJSON
// ==========================================
async function loadGeoJsonBoundaries() {
    const fetchGeoJSONHybrid = (src) => {
        return new Promise((resolve, reject) => {
            if (typeof google !== 'undefined' && google.script) {
                google.script.run
                    .withSuccessHandler((data) => resolve({ code: src.code, data: typeof data === 'string' ? JSON.parse(data) : data }))
                    .withFailureHandler(reject)
                    .fetchGeoJSONFromDrive(src.url)
            } else {
                fetch(`/geojson/${src.code}.geojson`)
                    .then(res => res.json())
                    .then(data => resolve({ code: src.code, data }))
                    .catch(reject)
            }
        })
    };

    const COUNTRY_SOURCES = [
      { code: 'PL', url: 'https://drive.google.com/uc?export=download&id=1SmsYh3Z3QB7HGQes3SNg5HsjPwf90352' },
      { code: 'SK', url: 'https://drive.google.com/uc?export=download&id=13vAhZFnkhnnPcwnzYeLRGJc2lEpjB31Q' }
    ]

    try {
      const responses = await Promise.all(COUNTRY_SOURCES.map(fetchGeoJSONHybrid));
      let combinedFeatures = [], boundaryFeatures = [], globalId = 1, boundaryId = 9000;

      responses.forEach(({ code, data }) => {
        if (data && data.features) {
          data.features.forEach(f => { combinedFeatures.push({ ...f, id: globalId, properties: { ...f.properties, customId: globalId, countryCode: code } }); globalId++; })
          
          let countryPoly = null;
          try {
              let fc = turf.featureCollection(data.features.map(f => { let c = JSON.parse(JSON.stringify(f)); c.properties = { did: code }; return c; }));
              let buffered = turf.buffer(fc, 0.8, {units: 'kilometers'});
              let dissolved = turf.dissolve(buffered, {propertyName: 'did'});
              countryPoly = turf.buffer(dissolved.features[0], -0.8, {units: 'kilometers'}) || dissolved.features[0];
          } catch(e) { 
              let base = data.features[0];
              for(let i=1; i<data.features.length; i++) { try { base = turf.union(base, data.features[i]) || base; } catch(err){} }
              countryPoly = base;
          }

          if(countryPoly) {
              countryPolygons.value.push(countryPoly); 
              let outerRings = [];
              if (countryPoly.geometry.type === 'Polygon') outerRings.push(countryPoly.geometry.coordinates[0]);
              else if (countryPoly.geometry.type === 'MultiPolygon') countryPoly.geometry.coordinates.forEach(c => { if(c && c.length > 0) outerRings.push(c[0]); });
              
              let outerLine = outerRings.length === 1 ? turf.lineString(outerRings[0]) : (outerRings.length > 1 ? turf.multiLineString(outerRings) : turf.polygonToLine(countryPoly));
              if(outerLine) { outerLine.id = boundaryId; outerLine.properties = { customId: boundaryId, countryCode: code, isBoundary: true }; boundaryFeatures.push(outerLine); boundaryId++; }
          }
        }
      })
      
      cachedRegionsFeatures.value = combinedFeatures;
      if (!map.value) return;

      map.value.addSource('regions-data', { type: 'geojson', data: { type: 'FeatureCollection', features: combinedFeatures }, promoteId: 'customId' })
      map.value.addSource('boundaries-data', { type: 'geojson', data: { type: 'FeatureCollection', features: boundaryFeatures }, promoteId: 'customId' })

      map.value.addLayer({ id: 'regions-fill', type: 'fill', source: 'regions-data', paint: { 'fill-color': '#58b347', 'fill-opacity': ['case', ['boolean', ['feature-state', 'selected'], false], 0.6, ['boolean', ['feature-state', 'hover'], false], 0.3, 0.0] } })
      map.value.addLayer({ id: 'boundaries-hitbox', type: 'line', source: 'boundaries-data', paint: { 'line-width': 60, 'line-color': 'transparent' }});
      map.value.addLayer({ id: 'boundaries-glow', type: 'line', source: 'boundaries-data', paint: { 'line-width': 4, 'line-color': '#58b347', 'line-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 1, 0.0] }});

      map.value.on('mousemove', 'regions-fill', (e) => {
        if (!sectorEditorRef.value || !sectorEditorRef.value.isDrawing() || sectorEditorRef.value.getDrawMethod() !== 'click' || e.features.length === 0) return
        map.value.getCanvas().style.cursor = 'pointer'
        if (hoveredBoundaryIds.value.length > 0) { hoveredBoundaryIds.value.forEach(id => map.value.setFeatureState({ source: 'boundaries-data', id: id }, { hover: false })); hoveredBoundaryIds.value = []; }
        
        const fId = e.features[0].properties.customId
        if (hoveredStateId.value !== null && hoveredStateId.value !== fId) map.value.setFeatureState({ source: 'regions-data', id: hoveredStateId.value }, { hover: false })
        hoveredStateId.value = fId
        map.value.setFeatureState({ source: 'regions-data', id: fId }, { hover: true })
      })

      map.value.on('mouseleave', 'regions-fill', () => {
        if (hoveredStateId.value !== null) { map.value.setFeatureState({ source: 'regions-data', id: hoveredStateId.value }, { hover: false }); hoveredStateId.value = null }
        if(sectorEditorRef.value && sectorEditorRef.value.getDrawMethod() === 'click') map.value.getCanvas().style.cursor = ''
      })

      map.value.on('click', 'regions-fill', (e) => {
        if (!sectorEditorRef.value || !sectorEditorRef.value.isDrawing() || sectorEditorRef.value.getDrawMethod() !== 'click') return
        if (e.features && e.features.length > 0) {
          const id = e.features[0].properties.customId
          sectorEditorRef.value.toggleRegionSelection(id);
        }
      })

      map.value.on('mousemove', 'boundaries-hitbox', (e) => {
          if (!sectorEditorRef.value || !sectorEditorRef.value.isDrawing() || sectorEditorRef.value.getDrawMethod() !== 'click' || e.features.length === 0) return;
          map.value.getCanvas().style.cursor = 'pointer';
          const currentIds = Array.from(new Set(e.features.map(f => f.properties.customId)));
          hoveredBoundaryIds.value.forEach(id => { if (!currentIds.includes(id)) map.value.setFeatureState({ source: 'boundaries-data', id: id }, { hover: false }); });
          currentIds.forEach(id => { map.value.setFeatureState({ source: 'boundaries-data', id: id }, { hover: true }); });
          hoveredBoundaryIds.value = currentIds;
      });

      map.value.on('mouseleave', 'boundaries-hitbox', () => { 
          hoveredBoundaryIds.value.forEach(id => { map.value.setFeatureState({ source: 'boundaries-data', id: id }, { hover: false }); });
          hoveredBoundaryIds.value = [];
          if(sectorEditorRef.value && sectorEditorRef.value.getDrawMethod() === 'click') map.value.getCanvas().style.cursor = '';
      });

      map.value.on('dblclick', 'boundaries-hitbox', (e) => {
          if (!sectorEditorRef.value || !sectorEditorRef.value.isDrawing() || sectorEditorRef.value.getDrawMethod() !== 'click') return;
          e.preventDefault(); 
          if (e.features && e.features.length > 0) {
            const clickedCountryCodes = new Set(e.features.map(f => f.properties.countryCode));
            cachedRegionsFeatures.value.forEach((f) => {
              if (clickedCountryCodes.has(f.properties.countryCode)) {
                if (sectorEditorRef.value && typeof sectorEditorRef.value.toggleRegionSelection === 'function') {
                    sectorEditorRef.value.toggleRegionSelection(f.properties.customId, true); // true wymusza dodanie
                }
              }
            });
          }
      });
    } catch (err) {}
}

onMounted(() => { 
  // Wczytywanie ukrytych stref z LocalStorage przy wejściu
  try {
    const savedTechs = JSON.parse(localStorage.getItem('ekoen_hidden_techs') || '[]');
    const savedAreas = JSON.parse(localStorage.getItem('ekoen_hidden_areas') || '[]');
    
    // Nakładamy odczytany stan na store
    savedTechs.forEach(id => {
      if (!store.hiddenTechs.has(id)) store.toggleTechVisibility(id);
    });
    savedAreas.forEach(id => {
      if (!store.hiddenAreas.has(id)) store.toggleAreaVisibility(id);
    });
  } catch(e) {}

  store.fetchMapData(); 
  setTimeout(() => { initMap() }, 300);
  startAutoRefresh(); // Uruchomienie pętli odświeżania
})

onBeforeUnmount(() => { 
  if (map.value) map.value.remove(); 
  if (autoRefreshInterval) clearInterval(autoRefreshInterval); // Sprzątanie po timerze
})
watch(() => [store.techs, store.areas, store.hiddenTechs, store.hiddenAreas, store.stations], () => { updateSectorMap(); applyFilters(); }, { deep: true })

</script>

<style scoped>
@keyframes spin-stable { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.animate-spin-stable { animation: spin-stable 2s linear infinite; transform-origin: 100px 100px; }
.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: rgba(241, 245, 249, 0.2); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(88, 179, 71, 0.4); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(88, 179, 71, 0.8); }
</style>