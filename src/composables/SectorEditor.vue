<template>
  <!-- GŁÓWNY WRAPPER -->
  <div v-if="isOpen" class="absolute top-24 left-6 z-30 pointer-events-none flex flex-col items-start justify-start">
    
    <!-- WIDOK 1: AKTYWNE RYSOWANIE -->
    <div v-if="isDrawingActive" class="bg-white/95 backdrop-blur-2xl border border-white/60 p-5 rounded-[20px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] w-[380px] flex flex-col pointer-events-auto">
      <h3 class="font-bold text-slate-800 text-sm mb-4 border-b border-slate-100 pb-2 flex items-center gap-2 shrink-0">
        <svg class="w-4 h-4 text-[#58b347]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/><path d="m14 7 3 3"/></svg>
        Ustawianie terytorium
      </h3>
      
      <div class="flex gap-1 bg-slate-100 p-1 rounded-xl mb-3 shrink-0 border border-slate-200/60 shadow-inner">
        <button @click="setDrawMethod('edit')" :class="drawMethod === 'edit' ? 'text-[#58b347] bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'" class="flex-1 text-[9px] uppercase tracking-widest font-bold py-2 rounded-lg transition-all">Wskaźnik</button>
        <button @click="setDrawMethod('manual')" :class="drawMethod === 'manual' ? 'text-[#58b347] bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'" class="flex-1 text-[9px] uppercase tracking-widest font-bold py-2 rounded-lg transition-all">Rysuj</button>
        <button @click="setDrawMethod('click')" :class="drawMethod === 'click' ? 'text-[#58b347] bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'" class="flex-1 text-[9px] uppercase tracking-widest font-bold py-2 rounded-lg transition-all">Regiony</button>
      </div>

      <div class="mb-4 shrink-0">
        <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1.5 block">Wpływ na Twoją strefę</label>
        <div class="flex gap-1">
          <button @click="setDrawOperation('union')" :class="drawOperation === 'union' ? 'border-[#58b347] bg-[#f0f9ed] text-[#58b347] shadow-[0_0_10px_rgba(88,179,71,0.15)]' : 'border-slate-200 bg-white text-slate-500 hover:text-[#58b347] hover:border-[#58b347]/30 hover:bg-[#f0f9ed]'" class="flex-1 flex flex-col items-center justify-center gap-1 text-[9px] uppercase tracking-widest font-bold py-2 rounded-xl transition-all border">
            Dodaj
          </button>
          <button @click="setDrawOperation('difference')" :class="drawOperation === 'difference' ? 'border-red-500 bg-red-50 text-red-600 shadow-[0_0_10px_rgba(239,68,68,0.15)]' : 'border-slate-200 bg-white text-slate-500 hover:text-red-500 hover:border-red-200 hover:bg-red-50'" class="flex-1 flex flex-col items-center justify-center gap-1 text-[9px] uppercase tracking-widest font-bold py-2 rounded-xl transition-all border">
            Wyklucz
          </button>
          <button @click="setDrawOperation('intersect')" :class="drawOperation === 'intersect' ? 'border-green-500 bg-green-50 text-green-600 shadow-[0_0_10px_rgba(59,130,246,0.15)]' : 'border-slate-200 bg-white text-slate-500 hover:text-green-500 hover:border-green-200 hover:bg-green-50'" class="flex-1 flex flex-col items-center justify-center gap-1 text-[9px] uppercase tracking-widest font-bold py-2 rounded-xl transition-all border">
            Wspólna
          </button>
        </div>
      </div>

      <div class="bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-[10px] text-emerald-800 mb-4 leading-relaxed shadow-sm shrink-0 font-medium">
        <b>Wskazówka:</b> Kliknij granice państw dwukrotnie w trybie <b>Regiony</b>, aby szybko zaznaczyć całość.
        <button v-if="drawMethod === 'click'" @click="selectAllPoland" class="w-full mt-3 bg-white border border-emerald-200 hover:bg-emerald-100 text-[#58b347] font-bold py-1.5 rounded-lg transition-colors text-center shadow-sm">+ Zaznacz całą Polskę</button>
      </div>

      <div class="flex gap-2 mt-auto shrink-0 pt-2 border-t border-slate-100">
        <button @click="cancelDrawing" class="flex-1 bg-white hover:bg-slate-50 text-slate-600 font-bold py-3 rounded-xl text-xs uppercase tracking-widest transition-colors border border-slate-200 shadow-sm">Anuluj</button>
        <button @click="saveDrawing" :disabled="isSaving" class="flex-1 flex items-center justify-center gap-2 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest transition-all shadow-[0_4px_14px_rgba(88,179,71,0.25)] bg-[#58b347] hover:bg-[#499b3a] disabled:bg-slate-400">
          {{ isSaving ? 'Zapis...' : 'Zapisz' }}
        </button>
      </div>
    </div>

    <!-- WIDOK 2: KREATOR NOWEGO OBIEKTU -->
    <div v-else-if="isCreatingNew" class="bg-white/95 backdrop-blur-2xl border border-white/60 p-5 rounded-[20px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] w-[380px] flex flex-col pointer-events-auto">
      <div class="flex justify-between items-center mb-5 border-b border-slate-100 pb-3">
        <h3 class="font-bold text-slate-800 text-sm uppercase tracking-widest">Nowy {{ activeTab === 'technicians' ? 'technik' : 'region' }}</h3>
        <button @click="isCreatingNew = false" class="text-slate-400 hover:text-slate-600"><svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
      </div>
      <div class="space-y-4 mb-5">
        <div>
          <label class="block text-xs font-bold text-slate-500 mb-1">Nazwa</label>
          <input type="text" v-model="newName" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#58b347] shadow-inner" />
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-500 mb-1">Kolor na mapie</label>
          <div class="flex items-center gap-3">
            <input type="color" v-model="newColor" class="w-12 h-12 p-0.5 border border-slate-200 rounded-xl cursor-pointer bg-white" />
            <span class="text-xs text-slate-500 font-mono font-bold uppercase">{{ newColor }}</span>
          </div>
        </div>
      </div>
      <button @click="initStartDrawingNew" class="w-full flex items-center justify-center gap-2 bg-[#58b347] hover:bg-[#499b3a] text-white font-bold py-3 rounded-xl text-xs transition-all shadow-[0_4px_14px_rgba(88,179,71,0.25)] uppercase tracking-widest">
        Utwórz i narysuj strefę
      </button>
    </div>

    <!-- WIDOK 3: SZCZEGÓŁY WYBRANEGO OBIEKTU -->
    <div v-else-if="selectedItemData" class="bg-white/95 backdrop-blur-2xl border border-white/60 p-5 rounded-[20px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] w-[380px] max-h-[85vh] flex flex-col pointer-events-auto">
      <div class="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3">
        <button @click="selectedItem = null" class="text-slate-400 hover:text-slate-600 shrink-0">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div class="flex items-center gap-3 truncate">
          <div class="w-3.5 h-3.5 rounded-full shrink-0 shadow-inner border border-black/10" :style="{ backgroundColor: selectedItemData.color }"></div>
          <h3 class="font-bold text-slate-800 text-sm truncate uppercase tracking-widest">{{ selectedItem }}</h3>
        </div>
      </div>

      <div v-if="selectedItemData.zones.length === 0" class="text-center bg-slate-50 border border-slate-200 p-5 rounded-xl mb-4 shadow-inner">
        <p class="text-xs text-slate-500 font-medium mb-4">Ten obiekt nie ma przypisanego terytorium na mapie.</p>
        <button @click="startEditing(selectedItemData.id, false)" class="w-full bg-[#58b347] text-white hover:bg-[#499b3a] font-bold py-3 rounded-xl text-xs uppercase tracking-widest transition-all shadow-[0_4px_14px_rgba(88,179,71,0.25)] flex items-center justify-center gap-2">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/><path d="m14 7 3 3"/></svg> Narysuj strefę
        </button>
      </div>
      
      <div v-else class="overflow-y-auto space-y-3 pr-1 custom-scrollbar">
        <div v-for="zone in selectedItemData.zones" :key="zone.id" class="bg-white border border-slate-200 p-3 rounded-xl hover:border-[#58b347]/50 transition-colors shadow-sm group">
          <div class="flex justify-between items-center mb-3">
            <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex-1">Obszar zdefiniowany</span>
            <div class="flex gap-1">
              <button @click="startEditing(zone, false)" class="text-[#58b347] hover:bg-green-50 p-2 rounded-lg transition-colors" title="Edytuj granice">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
              </button>
              <button @click="$emit('deleteSector', zone.id, currentTargetType)" class="text-orange-500 hover:bg-orange-50 p-2 rounded-lg transition-colors" title="Wyczyść z mapy">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
          <button @click="startEditing(zone, true)" class="w-full bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 text-[10px] font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 uppercase tracking-widest">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14"/><path d="M12 5v14"/></svg> Doklej kolejny obszar
          </button>
        </div>
      </div>
    </div>

    <!-- WIDOK 4: LISTA GŁÓWNA -->
    <div v-else class="bg-white/95 backdrop-blur-2xl border border-white/60 p-5 rounded-[20px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] w-[380px] max-h-[85vh] flex flex-col pointer-events-auto">
      <div class="flex justify-between items-center mb-5 border-b border-slate-100 pb-3">
        <h3 class="font-bold text-slate-800 text-sm flex items-center gap-2 uppercase tracking-widest">
          <svg class="w-4 h-4 text-[#58b347]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/></svg> 
          Edytor Terytoriów
        </h3>
        <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>

      <div class="flex gap-1 bg-slate-100 p-1 rounded-xl mb-5 shadow-inner border border-slate-200/60">
        <button @click="activeTab = 'technicians'" :class="activeTab === 'technicians' ? 'bg-white shadow-sm text-[#58b347]' : 'text-slate-500 hover:text-slate-700'" class="flex-1 text-[10px] uppercase tracking-widest font-bold py-2.5 rounded-lg transition-all">Technicy</button>
        <button @click="activeTab = 'regions'" :class="activeTab === 'regions' ? 'bg-white shadow-sm text-[#58b347]' : 'text-slate-500 hover:text-slate-700'" class="flex-1 text-[10px] uppercase tracking-widest font-bold py-2.5 rounded-lg transition-all">Regiony</button>
      </div>

      <button @click="isCreatingNew = true" class="w-full flex items-center justify-center gap-2 bg-[#58b347] hover:bg-[#499b3a] text-white font-bold py-3 rounded-xl text-xs transition-all mb-5 shadow-[0_4px_14px_rgba(88,179,71,0.25)] uppercase tracking-widest">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14"/><path d="M12 5v14"/></svg> 
        Utwórz nowy
      </button>

      <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Baza systemu ({{ Object.keys(groupedItems).length }})</h4>
      
      <div v-if="Object.keys(groupedItems).length === 0" class="text-[11px] text-slate-500 bg-slate-50 p-4 text-center rounded-xl border border-slate-100 font-bold uppercase tracking-widest">
        Brak obiektów w bazie.
      </div>
      <div v-else class="overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        <div v-for="(data, name) in groupedItems" :key="name" class="flex justify-between items-center bg-white border border-slate-200 p-2.5 rounded-xl hover:border-[#58b347]/50 transition-colors group shadow-sm">
          <div class="flex items-center gap-3 flex-1 cursor-pointer overflow-hidden" @click="$emit('toggleVisibility', data.id, currentTargetType)" title="Kliknij, aby pokazać/ukryć strefę">
            <div class="w-3.5 h-3.5 rounded-full shrink-0 shadow-inner border border-black/10 transition-opacity" :class="isItemHidden(data.id) ? 'opacity-30' : 'opacity-100'" :style="{ backgroundColor: data.color }"></div>
            <div class="truncate" :class="isItemHidden(data.id) ? 'opacity-50' : 'opacity-100'">
              <div class="text-xs font-black text-slate-700 truncate uppercase tracking-wider">{{ name }}</div>
              <div class="text-[9px] font-bold mt-0.5 uppercase tracking-widest" :class="data.zones.length > 0 ? 'text-[#58b347]' : 'text-slate-400'">
                {{ getZoneStats(data) }}
              </div>
            </div>
          </div>
          <div class="flex items-center gap-1 shrink-0 ml-2">
            <button @click="selectedItem = name" class="p-2 text-slate-400 hover:text-[#58b347] hover:bg-green-50 rounded-lg transition-colors" title="Edytuj strefę">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
            </button>
            <button @click.stop="$emit('hardDeleteEntity', data.id, currentTargetType)" class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Usuń całkowicie z bazy">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
    
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import * as turf from '@turf/turf'

const props = defineProps({
  isOpen: Boolean,
  initialTab: { type: String, default: 'technicians' },
  sectors: { type: Array, default: () => [] },
  regions: { type: Array, default: () => [] },
  hiddenTechs: { type: [Set, Array], default: () => new Set() },
  hiddenAreas: { type: [Set, Array], default: () => new Set() },
  stations: { type: Array, default: () => [] }, // ODBIERANIE STACJI DO STATYSTYK
  
  // WSTRZYKNIĘTE INSTANCJE Z MAPVIEW
  mapInstance: { type: Object, default: null },
  drawInstance: { type: Object, default: null },
  cachedRegionsFeatures: { type: Array, default: () => [] },
  countryPolygons: { type: Array, default: () => [] }
})

const emit = defineEmits([
  'close', 'deleteSector', 'hardDeleteEntity', 'toggleVisibility', 'createNewArea', 
  'drawingStateChanged', 'refreshData', 'savingStateChanged'
])

const activeTab = ref('technicians')
const selectedItem = ref(null)
const isCreatingNew = ref(false)
const newName = ref('')
const newColor = ref('#58b347')

// PRZENIESIONE STANY RYSOWANIA
const isDrawingActive = ref(false)
const drawMethod = ref('click')
const drawOperation = ref('union')
const activeDrawContext = ref(null) 
const selectedRegionIds = ref(new Set())
const baseEditGeom = ref(null)
const isSaving = ref(false)

const geoLog = (msg, data) => {
  console.log('%c[SECTOR EDITOR] ' + msg, 'background: #3b82f6; color: #fff; font-weight: bold; padding: 2px 5px; border-radius: 3px;', data !== undefined ? data : '');
}

// 🛡️ ZOPTYMALIZOWANY SILNIK TURF.JS Z ADAPTACYJNĄ KOMPRESJĄ 🛡️
const SpatialEngine = {
  toSingleFeature(obj) {
    if (!obj) return null;
    let fc = obj.type === 'FeatureCollection' ? obj : turf.featureCollection([obj.type === 'Feature' ? obj : turf.feature(obj)]);
    if (!fc.features || fc.features.length === 0) return null;
    return turf.combine(fc).features[0];
  },

  ensureMultiPolygon(geometry) {
    if (!geometry) return null;
    if (geometry.type === 'Polygon') return { type: 'MultiPolygon', coordinates: [geometry.coordinates] };
    if (geometry.type === 'Feature') return this.ensureMultiPolygon(geometry.geometry);
    if (geometry.type === 'FeatureCollection') return this.ensureMultiPolygon(turf.combine(geometry).features[0]);
    return geometry;
  },

  applyBooleanOperation(baseGeom, modifierGeom, operation) {
    let op = String(operation).toLowerCase();
    geoLog(`Rozpoczynam applyBooleanOperation. Tryb: ${op}`);
    
    if (!baseGeom && (op.includes('union') || op.includes('add'))) return modifierGeom;
    if (!modifierGeom) return baseGeom;
    if (!baseGeom) return null;

    try {
      let f1 = turf.truncate(turf.buffer(this.toSingleFeature(baseGeom), 0.0001, { units: 'kilometers' }), { precision: 4 });
      let f2 = turf.truncate(turf.buffer(this.toSingleFeature(modifierGeom), 0.0001, { units: 'kilometers' }), { precision: 4 });

      let featureCollectionPair = turf.featureCollection([f1, f2]);
      let result;

      if (op.includes('diff') || op.includes('sub') || op.includes('remov')) {
        try { result = turf.difference(featureCollectionPair); } catch(e) { result = turf.difference(f1, f2); }
      } else if (op.includes('inter')) {
        try { result = turf.intersect(featureCollectionPair); } catch(e) { result = turf.intersect(f1, f2); }
      } else {
        try { result = turf.union(featureCollectionPair); } catch(e) { result = turf.union(f1, f2); }
      }
      
      if (!result && (op.includes('diff') || op.includes('sub') || op.includes('remov'))) {
          return turf.featureCollection([]);
      }
      return result ? turf.buffer(result, 0) : baseGeom;
    } catch (e) {
      geoLog("Błąd Turf.js, zwracam stary kształt:", e);
      return baseGeom;
    }
  },

  // Kompresja z Brutalnym Ogranicznikiem Precyzji
  compress(finalPoly) {
    if (!finalPoly || (!finalPoly.geometry && !finalPoly.features)) return "{}";
    
    let finalCollection = finalPoly.type === 'FeatureCollection' 
      ? finalPoly 
      : turf.featureCollection([finalPoly.type === 'Feature' ? finalPoly : turf.feature(finalPoly)]);

    turf.propEach(finalCollection, (prop) => { for (let key in prop) delete prop[key]; });
    finalCollection = turf.cleanCoords(finalCollection);

    let currentPrecision = 4;
    turf.coordEach(finalCollection, function(coord) {
        coord[0] = Number(coord[0].toFixed(currentPrecision));
        coord[1] = Number(coord[1].toFixed(currentPrecision));
    });

    let jsonStr = JSON.stringify(finalCollection);
    let tolerance = 0.001; 
    let loops = 0;
    let isHighQuality = true;

    // Pętla do 40 razy
    while (jsonStr.length > 45000 && loops < 40) {
      loops++;
      
      if (loops > 10) isHighQuality = false; // Wyłączamy ochronę kształtu
      if (loops > 20) currentPrecision = 3;  // Brutalne cięcie: 3 miejsca po przecinku (dokł. ~100m)
      if (loops > 30) currentPrecision = 2;  // Tryb ostateczny: 2 miejsca po przecinku (dokł. ~1km)

      try {
        finalCollection = turf.simplify(finalCollection, { tolerance: tolerance, highQuality: isHighQuality, mutate: false });
        
        turf.coordEach(finalCollection, function(coord) {
            coord[0] = Number(coord[0].toFixed(currentPrecision));
            coord[1] = Number(coord[1].toFixed(currentPrecision));
        });
        
        jsonStr = JSON.stringify(finalCollection);
      } catch(e) { break; }
      
      tolerance *= 1.4; 
    }

    // Bezpiecznik ostateczny chroniący przed błędem serwera Google
    if (jsonStr.length > 50000) {
        alert("Geometria tego obszaru jest zbyt skomplikowana. System nie jest w stanie jej bezpiecznie zapisać. Spróbuj odznaczyć część mniejszych wysepek lub regionów.");
        throw new Error("Przekroczono 50k znaków mimo kompresji"); // Zatrzymuje działanie zapisu
    }

    geoLog(`Kompresja zakończona (Pętle: ${loops}, Precyzja: ${currentPrecision}): ${jsonStr.length} znaków.`);
    return jsonStr;
  },

  // Zapewnia, że obiekt jest pojedynczym Feature, a nie FeatureCollection
  ensureSingleFeature(poly) {
      if (!poly) return null;
      if (poly.type === 'FeatureCollection') {
          if (poly.features.length === 0) return null;
          if (poly.features.length === 1) return poly.features[0];
          return this.fastCombine(poly.features); 
      }
      return poly;
  },

  // Szybkie łączenie kolekcji w jeden MultiPolygon
  fastCombine(features) {
      if (!features || features.length === 0) return null;
      if (features.length === 1) return features[0];
      try {
          return turf.combine(turf.featureCollection(features)).features[0];
      } catch(e) {
          return features[0];
      }
  },

  // Buforuje geometrię o 0, co często naprawia błędy przecinających się linii
  safeGeom(poly) {
      if (!poly) return null;
      let single = this.ensureSingleFeature(poly);
      if (!single) return null;
      try {
          return turf.buffer(single, 0); 
      } catch(e) {
          return single;
      }
  },

  // Usuwanie mikroskopijnych "dziur" wewnątrz obrysów (poniżej maxHoleAreaSqm)
  removeTinyHoles(feature, maxHoleAreaSqm = 50000000) {
      if (!feature || !feature.geometry) return feature;
      try {
          let clone = JSON.parse(JSON.stringify(feature));
          let geom = clone.geometry;

          const cleanRings = (rings) => {
              if (!rings || rings.length === 0) return [];
              let exterior = rings[0];
              let validHoles = [];
              for (let i = 1; i < rings.length; i++) {
                  try {
                      let ring = rings[i];
                      if (ring.length >= 4) { 
                          let holePoly = turf.polygon([ring]);
                          if (turf.area(holePoly) > maxHoleAreaSqm) {
                              validHoles.push(ring);
                          }
                      }
                  } catch(e) {}
              }
              return [exterior, ...validHoles];
          };

          if (geom.type === 'Polygon') {
              geom.coordinates = cleanRings(geom.coordinates);
          } else if (geom.type === 'MultiPolygon') {
              geom.coordinates = geom.coordinates.map(polyRings => cleanRings(polyRings));
          }
          return clone;
      } catch (e) {
          return feature;
      }
  },

  // Usuwanie "odprysków" i ścinków (domyślnie mniejszych niż 100 000 m2 = 5 km2)
  removeTinyPolygons(geom, minAreaSqm = 5000000) {
      if (!geom) return null;
      try {
          let flattened = turf.flatten(this.ensureSingleFeature(geom));
          let validFeatures = flattened.features.filter(f => turf.area(f) > minAreaSqm);
          
          if (validFeatures.length === 0) return null;
          if (validFeatures.length === 1) return validFeatures[0];
          return this.fastCombine(validFeatures);
      } catch(e) {
          return geom;
      }
  },

  // Idealne łączenie stref BEZ zniekształcania granic (expandKm domyślnie 0)
  solidify(features, expandKm = 0, minHoleSqm = 50000000) {
      if (!features || features.length === 0) return null;
      if (features.length === 1 && expandKm <= 0) return features[0]; 
      try {
          let fc = turf.featureCollection(features.map(f => {
              let clone = JSON.parse(JSON.stringify(f.type === 'Feature' ? f : turf.feature(f)));
              clone.properties = { dissolveId: 1 };
              return clone;
          }));
          
          let dissolved;
          if (expandKm > 0) {
              let buffered = turf.buffer(fc, expandKm, {units: 'kilometers'});
              dissolved = turf.dissolve(buffered, {propertyName: 'dissolveId'});
              let combinedDissolved = this.ensureSingleFeature(dissolved);
              if (!combinedDissolved) return null;
              let solid = turf.buffer(combinedDissolved, -expandKm, {units: 'kilometers'});
              dissolved = solid || combinedDissolved;
          } else {
              // Łączenie idealne (bez rozpychania marginesów)
              dissolved = turf.dissolve(fc, {propertyName: 'dissolveId'});
              dissolved = this.ensureSingleFeature(dissolved);
          }
          
          return minHoleSqm > 0 ? this.removeTinyHoles(dissolved, minHoleSqm) : dissolved;
      } catch(e) {
          let base = this.ensureSingleFeature(turf.featureCollection(features));
          return minHoleSqm > 0 ? this.removeTinyHoles(base, minHoleSqm) : base;
      }
  },

  // Zoptymalizowana kompresja z algorytmem Visvalingam-Whyatt
  compress(finalPoly) {
    if (!finalPoly || (!finalPoly.geometry && !finalPoly.features)) return "{}";
    
    let finalCollection = finalPoly.type === 'FeatureCollection' 
      ? finalPoly 
      : turf.featureCollection([finalPoly.type === 'Feature' ? finalPoly : turf.feature(finalPoly)]);

    turf.propEach(finalCollection, (prop) => { for (let key in prop) delete prop[key]; });

    // KROK 1: Ucinamy współrzędne do 4 miejsc po przecinku (~11 metrów dokładności)
    // To drastycznie zmniejsza wagę JSONa przed jakimkolwiek usuwaniem punktów!
    turf.coordEach(finalCollection, function(coord) {
        coord[0] = Number(coord[0].toFixed(4));
        coord[1] = Number(coord[1].toFixed(4));
    });

    let jsonStr = JSON.stringify(finalCollection);

    let tolerance = 0.0005; 
    let loops = 0;
    let isHighQuality = true; // Domyślnie dbamy o jakość granic

    // KROK 3: Kompresja z trybem awaryjnym (Panic Mode)
    while (jsonStr.length > 45000 && loops < 30) {
      loops++;
      
      // Jeśli po 10 pętlach rozmiar nie spada, wyłączamy ochronę kształtu (Panic Mode)
      if (loops > 10) isHighQuality = false; 

      try {
        finalCollection = turf.simplify(finalCollection, { tolerance: tolerance, highQuality: isHighQuality, mutate: false });
        
        turf.coordEach(finalCollection, function(coord) {
            coord[0] = Number(coord[0].toFixed(4));
            coord[1] = Number(coord[1].toFixed(4));
        });
        
        jsonStr = JSON.stringify(finalCollection);
      } catch(e) { break; }
      
      tolerance *= 1.5; 
    }

    geoLog(`Kompresja (pętle: ${loops}, HQ: ${isHighQuality}, tolerancja: ${tolerance.toFixed(5)}): ${jsonStr.length} znaków.`);
    return jsonStr;
  }
}

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    activeTab.value = props.initialTab;
  } else {
    selectedItem.value = null;
    isCreatingNew.value = false;
  }
})

const currentTargetType = computed(() => activeTab.value === 'technicians' ? 'technician' : 'region')
const currentList = computed(() => (activeTab.value === 'technicians' ? props.sectors : props.regions) || [])

const isItemHidden = (id) => {
  const collection = activeTab.value === 'technicians' ? props.hiddenTechs : props.hiddenAreas;
  if (!collection) return false;
  if (typeof collection.has === 'function') return collection.has(id);
  if (Array.isArray(collection)) return collection.includes(id);
  return false;
}

// LOGIKA ZLICZANIA STACJI W LOCIE
const stationPointsCollection = computed(() => {
  const points = props.stations.filter(s => s.gps_lat && s.gps_lng).map(s => {
    return turf.point(
      [parseFloat(s.gps_lng.toString().replace(',','.')), parseFloat(s.gps_lat.toString().replace(',','.'))],
      { hasTicket: (s.active_ticket_id && s.active_ticket_id.trim() !== '') }
    )
  });
  return turf.featureCollection(points);
});

const getZoneStats = (data) => {
  if (data.zones.length === 0) return 'Brak mapowania';
  if (isItemHidden(data.id)) return 'Strefa Ukryta';
  
  try {
    let validPolys = data.zones.map(z => typeof z.zone_geometry === 'string' ? JSON.parse(z.zone_geometry) : z.zone_geometry).filter(Boolean);
    if (validPolys.length === 0) return '✓ Strefa na mapie';

    let merged = SpatialEngine.solidify(validPolys, 0.01, 0); 
    if (!merged) return '✓ Strefa na mapie';

    let ptsWithin = turf.pointsWithinPolygon(stationPointsCollection.value, merged);
    let total = ptsWithin.features.length;
    let tickets = ptsWithin.features.filter(f => f.properties.hasTicket).length;
    
    return `${total} stacji | ${tickets} zgłoszeń`;
  } catch(e) {
    return '✓ Strefa na mapie';
  }
};

const groupedItems = computed(() => {
  if (!currentList.value || !Array.isArray(currentList.value)) return {}
  return currentList.value.reduce((acc, item) => {
    if (!item || (!item.name && !item.id)) return acc
    const displayName = item.name || 'Nieznany Obiekt'
    
    if (!acc[displayName]) {
       acc[displayName] = { id: item.id, color: item.color || item.zone_color || '#58b347', zones: [] }
    }
    
    if (item.geometry || (item.zone_geometry && item.zone_geometry !== 'null' && item.zone_geometry !== '')) {
      acc[displayName].zones.push(item)
    }
    return acc
  }, {})
})

const selectedItemData = computed(() => selectedItem.value ? groupedItems.value[selectedItem.value] : null)

const handleKeydown = (e) => {
  if (e.key === 'Escape' && props.isOpen) {
    if (isDrawingActive.value) cancelDrawing()
    else if (isCreatingNew.value) isCreatingNew.value = false
    else if (selectedItem.value) selectedItem.value = null
    else emit('close')
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeydown))

// ==========================================
// LOGIKA RYSOWANIA WEWNĄTRZ KOMPONENTU
// ==========================================

function initStartDrawingNew() {
  if (!newName.value.trim()) return alert('Wprowadź nazwę.')
  selectedItem.value = newName.value
  isCreatingNew.value = false
  startDrawingNew(newName.value, newColor.value, 'insert', currentTargetType.value)
}

const startEditing = (zoneOrId, isAppend) => {
  if (typeof zoneOrId === 'string') {
    startDrawingNew(selectedItem.value, selectedItemData.value.color, 'update', currentTargetType.value, zoneOrId)
  } else {
    editExisting(zoneOrId, currentTargetType.value, isAppend)
  }
}

function startDrawingNew(name, color, mode, targetType, sectorId) {
  activeDrawContext.value = { mode, techName: name, color, targetType, sectorId }
  isDrawingActive.value = true
  selectedRegionIds.value.clear()
  drawOperation.value = 'union'
  
  if (props.mapInstance && props.mapInstance.getSource('regions-data')) {
    props.cachedRegionsFeatures.forEach(f => {
      props.mapInstance.setFeatureState({ source: 'regions-data', id: f.properties.customId }, { selected: false })
    })
  }
  
  if (props.drawInstance) props.drawInstance.deleteAll()

  let baseGeom = null
  if (mode === 'update' && sectorId) {
    const targetObj = targetType === 'technician' ? props.sectors.find(t => t.id === sectorId) : props.regions.find(a => a.id === sectorId)
    if (targetObj && targetObj.zone_geometry) {
      try { baseGeom = typeof targetObj.zone_geometry === 'string' ? JSON.parse(targetObj.zone_geometry) : targetObj.zone_geometry } catch(e) {}
    }
  }

  baseEditGeom.value = baseGeom;
  if (props.mapInstance && props.mapInstance.getSource('active-base-zone')) {
      props.mapInstance.getSource('active-base-zone').setData(baseGeom || { type: 'FeatureCollection', features: [] })
  }

  if (props.mapInstance && props.mapInstance.getLayer('saved-sectors-layer') && sectorId) {
      props.mapInstance.setFilter('saved-sectors-layer', ['!=', ['get', 'id'], sectorId])
      props.mapInstance.setFilter('saved-sectors-outline', ['!=', ['get', 'id'], sectorId])
  }

  setDrawMethod('click')
  emit('drawingStateChanged', true)
}

function editExisting(sector, targetType, isAppend) {
  if (!props.drawInstance || !sector.zone_geometry) return;
  activeDrawContext.value = { mode: isAppend ? 'append' : 'update', techName: sector.name, color: sector.color, sectorId: sector.id, targetType }
  isDrawingActive.value = true
  selectedRegionIds.value.clear()
  
  let parsedGeom = typeof sector.zone_geometry === 'string' ? JSON.parse(sector.zone_geometry) : sector.zone_geometry;
  baseEditGeom.value = parsedGeom;

  props.drawInstance.deleteAll()
  
  if (props.mapInstance && props.mapInstance.getSource('active-base-zone')) {
      props.mapInstance.getSource('active-base-zone').setData(parsedGeom || { type: 'FeatureCollection', features: [] })
  }

  if (props.mapInstance && props.mapInstance.getLayer('saved-sectors-layer')) {
      props.mapInstance.setFilter('saved-sectors-layer', ['!=', ['get', 'id'], sector.id])
      props.mapInstance.setFilter('saved-sectors-outline', ['!=', ['get', 'id'], sector.id])
  }

  if (isAppend) {
    setDrawMethod('click')
  } else {
    try {
        const featureIds = props.drawInstance.add(parsedGeom);
        if (featureIds && featureIds.length > 0) {
            setDrawMethod('edit', 'direct_select', { featureId: featureIds[0] });
        } else {
            setDrawMethod('edit');
        }
    } catch(e) {
        setDrawMethod('edit');
    }
  }
  emit('drawingStateChanged', true)
}

function setDrawMethod(method, forceMode, forceOptions) {
  drawMethod.value = method
  setTimeout(() => {
      if (!props.drawInstance || !props.mapInstance) return;
      if (forceMode) props.drawInstance.changeMode(forceMode, forceOptions)
      else if (method === 'edit') {
          props.drawInstance.changeMode('simple_select')
          props.mapInstance.getCanvas().style.cursor = ''
      } else if (method === 'manual') {
          props.drawInstance.changeMode('draw_polygon')
          props.mapInstance.getCanvas().style.cursor = 'crosshair'
      } else if (method === 'click') {
          try { props.drawInstance.changeMode('static') } catch(e) { props.drawInstance.changeMode('simple_select') }
          props.mapInstance.getCanvas().style.cursor = ''
      }
  }, 10)
}

function setDrawOperation(op) {
  let val = String(op).toLowerCase().trim();
  drawOperation.value = val;
  geoLog("Zmiana operacji rysowania na:", val);

  if (val.includes('diff') || val.includes('sub') || val.includes('inter') || val.includes('remov')) {
     if (activeDrawContext.value && activeDrawContext.value.mode === 'update') {
         geoLog("Przełączam mode='update' na mode='append' z powodu wybranej operacji wycinania. Czyszczę płótno z bazy.");
         activeDrawContext.value.mode = 'append';
         if (props.drawInstance) props.drawInstance.deleteAll();
     }
  }

  if (drawMethod.value) {
      setDrawMethod(drawMethod.value);
  }
}

function cancelDrawing() {
  activeDrawContext.value = null
  isDrawingActive.value = false
  baseEditGeom.value = null
  
  if (props.mapInstance && props.mapInstance.getSource('active-base-zone')) {
    props.mapInstance.getSource('active-base-zone').setData({ type: 'FeatureCollection', features: [] })
  }

  if (props.drawInstance) {
    props.drawInstance.deleteAll()
    props.drawInstance.changeMode('simple_select')
  }

  if (props.mapInstance && props.mapInstance.getSource('regions-data')) {
    props.cachedRegionsFeatures.forEach(f => {
      props.mapInstance.setFeatureState({ source: 'regions-data', id: f.properties.customId }, { selected: false })
    })
  }
  selectedRegionIds.value.clear()

  if (props.mapInstance && props.mapInstance.getLayer('saved-sectors-layer')) {
     props.mapInstance.setFilter('saved-sectors-layer', null)
     props.mapInstance.setFilter('saved-sectors-outline', null)
  }
  emit('drawingStateChanged', false)
}

function selectAllPoland() {
  if (!props.mapInstance || !props.cachedRegionsFeatures.length) return;
  setDrawMethod('click');
  props.cachedRegionsFeatures.forEach((f) => {
    if (f.properties.countryCode === 'PL') {
      const fId = f.properties.customId;
      selectedRegionIds.value.add(fId);
      props.mapInstance.setFeatureState({ source: 'regions-data', id: fId }, { selected: true });
    }
  });
}

function saveDrawing() {
  const drawData = props.drawInstance ? props.drawInstance.getAll() : { features: [] };
  
  if (drawData.features.length === 0 && selectedRegionIds.value.size === 0 && activeDrawContext.value?.mode !== 'update') {
    alert("Narysuj nowy obszar lub wybierz regiony z mapy.");
    return;
  }

  isSaving.value = true;
  emit('savingStateChanged', true);
  
  setTimeout(() => {
    try {
      const ctx = activeDrawContext.value;
      let newDrawnFeatures = drawData.features;
      let selectedRegions = Array.from(selectedRegionIds.value).map(id => props.cachedRegionsFeatures.find(x => x.properties.customId === id)).filter(Boolean);
      
      // 1. Zabezpieczenie rysowanych stref 
      let newDrawPoly = null;
      if(newDrawnFeatures.length > 0) {
          newDrawPoly = SpatialEngine.solidify(newDrawnFeatures, 0.01, 0);
          
          if (newDrawPoly && props.countryPolygons.length > 0) {
              let allCountriesPoly = SpatialEngine.solidify(props.countryPolygons, 0.05, 0); 
              let isInside = true;
              
              try {
                  let f1 = turf.truncate(SpatialEngine.safeGeom(newDrawPoly), { precision: 4 });
                  let f2 = turf.truncate(SpatialEngine.safeGeom(allCountriesPoly), { precision: 4 });
                  let intersection = turf.intersect(turf.featureCollection([f1, f2]));
                  
                  if (intersection) {
                      newDrawPoly = intersection;
                  } else {
                      let center = turf.center(newDrawPoly);
                      let flattenedCountries = turf.flatten(allCountriesPoly);
                      let centerInside = false;
                      for(let f of flattenedCountries.features) {
                          if(turf.booleanPointInPolygon(center, f)) {
                              centerInside = true;
                              break;
                          }
                      }
                      if (!centerInside) isInside = false; 
                  }
              } catch(e) {}
              
              if(!isInside) {
                  alert("Twój rysunek znajduje się całkowicie poza zadeklarowanymi państwami.");
                  isSaving.value = false;
                  emit('savingStateChanged', false);
                  return;
              }
          }
      }

      // 2. Obsługa wyklikiwanych województw 
      let regionPoly = null;
      if(selectedRegions.length > 0) {
          regionPoly = SpatialEngine.solidify(selectedRegions, 0.0001, 5000000);
      }

      // 3. Połączenie narysowanego + wyklikanego
      let modifierPoly = null;
      if (newDrawPoly && regionPoly) {
          modifierPoly = SpatialEngine.solidify([newDrawPoly, regionPoly], 0.0001, 0); 
      } else {
          modifierPoly = newDrawPoly || regionPoly;
      }

      // 4. KULOODPORNA OBSŁUGA BOOLEAN Z ZAPOŻYCZENIAMI Z MAP_2.TXT
      let finalPoly = null;
      let op = drawOperation.value.toLowerCase();
      let basePoly = baseEditGeom.value;

      if (!modifierPoly) {
          finalPoly = basePoly;
      } else if (!basePoly) {
          finalPoly = modifierPoly;
      } else {
          try {
              if (op.includes('union') || op.includes('add')) {
                  // Rozwiązanie z map_2.txt chroniące przed wywalaniem union
                  let fc = turf.featureCollection([SpatialEngine.safeGeom(basePoly), SpatialEngine.safeGeom(modifierPoly)]);
                  fc.features.forEach(f => f.properties = { did: 1 });
                  let b = turf.buffer(fc, 0.001, {units: 'kilometers'}); 
                  let d = turf.dissolve(b, {propertyName: 'did'});
                  finalPoly = turf.buffer(d.features[0], -0.001, {units: 'kilometers'}) || d.features[0];
              } 
              else if (op.includes('difference') || op.includes('sub')) {
                  // Lekkie poszerzenie "nożyczek" chroni przed powstawaniem mikroszczelin (odprysków)
                  let expandedModifier = turf.buffer(modifierPoly, 0.001, {units: 'kilometers'}) || modifierPoly; 
                  finalPoly = turf.difference(turf.featureCollection([SpatialEngine.safeGeom(basePoly), expandedModifier]));
              } 
              else if (op.includes('intersect') || op.includes('inter')) {
                  finalPoly = turf.intersect(turf.featureCollection([SpatialEngine.safeGeom(basePoly), SpatialEngine.safeGeom(modifierPoly)]));
              }
          } catch(e) {
              console.warn("Boolean op error:", e);
              finalPoly = basePoly; // W razie błędu awaryjnie zachowaj pierwotny kształt zamiast gubić dane
          }
      }

      // 5. Oczyszczanie przed kompresją
      if (finalPoly) {
          // Usuwamy ścinki z granic, które powodują zacięcia bazy
          let validParts = [];
          try {
              turf.flatten(finalPoly).features.forEach(f => {
                  if(turf.area(f) > 3000000) validParts.push(f); 
              });
          } catch(e) { validParts = [finalPoly]; }
          
          finalPoly = SpatialEngine.fastCombine(validParts); 
          finalPoly = SpatialEngine.removeTinyHoles(finalPoly, 50000000); 
      }

      if (!finalPoly) finalPoly = turf.featureCollection([]);

      if (finalPoly && finalPoly.geometry) {
        finalPoly.geometry = SpatialEngine.ensureMultiPolygon(finalPoly.geometry);
      }

      // Kompresja z Brutalnym Ogranicznikiem Precyzji
      let jsonStr = finalPoly ? SpatialEngine.compress(finalPoly) : "{}";

      const finishSave = (success) => {
        if (props.mapInstance && props.mapInstance.getLayer('saved-sectors-layer')) { 
            props.mapInstance.setFilter('saved-sectors-layer', null);
            props.mapInstance.setFilter('saved-sectors-outline', null);
        }
        cancelDrawing();
        isSaving.value = false;
        emit('savingStateChanged', false);
        
        if(success) {
            emit('refreshData');
        }
      };

      // Blok zapisu do GAS
      if (typeof google !== 'undefined' && google.script) {
          if (ctx.mode === 'insert' && ctx.targetType === 'area') {
              let newId = 'area_' + Date.now();
              google.script.run
                .withSuccessHandler(() => {
                     google.script.run
                         .withSuccessHandler(() => { finishSave(true); })
                         .withFailureHandler((err) => { alert("Błąd zapisu na serwerze: " + err.message); finishSave(false); })
                         .updateAreaGeometry(newId, jsonStr);
                })
                .withFailureHandler((err) => { alert("Błąd utworzenia w bazie: " + err.message); finishSave(false); })
                .createNewAreaRecord(newId, ctx.techName, ctx.color);
          } else {
              const gasMethodName = ctx.targetType === 'technician' ? 'updateTechnicianGeometry' : 'updateAreaGeometry';
              google.script.run
                  .withSuccessHandler(() => { finishSave(true); })
                  .withFailureHandler((err) => {
                      console.error("GAS ERROR:", err);
                      alert("Błąd zapisu na serwerze: " + err.message);
                      finishSave(false);
                  })
                  [gasMethodName](ctx.sectorId, jsonStr);
          }
      } else {
          setTimeout(() => { finishSave(true); }, 1000);
      }
    } catch (e) {
      console.error(e);
      isSaving.value = false;
      emit('savingStateChanged', false);
    }
  }, 100);
}

// 🛡️ WYSTAWIANIE FUNKCJI NA ZEWNĄTRZ DLA MAPVIEW
defineExpose({
  toggleRegionSelection: (id) => {
      if (selectedRegionIds.value.has(id)) { 
          selectedRegionIds.value.delete(id); 
          props.mapInstance.setFeatureState({ source: 'regions-data', id: id }, { selected: false }); 
      } else { 
          selectedRegionIds.value.add(id); 
          props.mapInstance.setFeatureState({ source: 'regions-data', id: id }, { selected: true }); 
      }
  },
  getDrawMethod: () => drawMethod.value,
  isDrawing: () => isDrawingActive.value
});

</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: rgba(241, 245, 249, 0.2); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(88, 179, 71, 0.4); border-radius: 10px; }
</style>