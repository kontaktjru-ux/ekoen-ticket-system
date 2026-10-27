<template>
  <div class="absolute top-0 left-0 h-full w-[72px] hover:w-64 bg-white/95 backdrop-blur-xl border-r border-slate-200 z-[100] transition-all duration-300 ease-in-out flex flex-col group shadow-[10px_0_30px_rgba(0,0,0,0.05)] overflow-hidden font-sans">
    
    <!-- LOGO -->
    <div class="h-20 flex items-center pl-4 border-b border-slate-100 min-w-max shrink-0 cursor-pointer hover:bg-slate-50 transition-colors">
      <div class="w-10 h-10 shrink-0 hover:animate-[spin_2s_linear_infinite] rounded-full">
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M100 10C149.706 10 190 50.2944 190 100C190 149.706 149.706 190 100 190C50.2944 190 10 149.706 10 100C10 50.2944 50.2944 10 100 10Z" stroke="#58b347" stroke-width="12" />
          <line x1="100" y1="10" x2="100" y2="35" stroke="white" stroke-width="8" />
          <line x1="100" y1="165" x2="100" y2="190" stroke="white" stroke-width="8" />
          <g>
            <circle cx="100" cy="100" r="70" fill="#58b347" />
            <path d="M85 70H135V85H85V70ZM65 92.5H115V107.5H65V92.5ZM85 115H135V130H85V115Z" fill="white" />
          </g>
        </svg>
      </div>
      <span class="ml-3 font-black text-slate-800 tracking-tighter text-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
        EKO<span class="text-[#58b347]">EN</span>
      </span>
    </div>

    <!-- MENU GŁÓWNE -->
    <div class="flex-1 py-6 flex flex-col gap-1.5 overflow-y-auto overflow-x-hidden custom-scrollbar">
      
      <button @click="$emit('switch-view', 'map')" :class="getBtnClass('map')">
        <div :class="getIndicatorClass('map')"></div>
        <div class="w-8 flex justify-center shrink-0"><svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/></svg></div>
        <span class="ml-3 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">Mapa systemu</span>
      </button>

      <button @click="$emit('switch-view', 'stations')" :class="getBtnClass('stations')">
        <div :class="getIndicatorClass('stations')"></div>
        <div class="w-8 flex justify-center shrink-0"><svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg></div>
        <span class="ml-3 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">Baza stacji</span>
      </button>

      <button @click="$emit('switch-view', 'technicians')" :class="getBtnClass('technicians')">
        <div :class="getIndicatorClass('technicians')"></div>
        <div class="w-8 flex justify-center shrink-0"><svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
        <span class="ml-3 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">Zasoby techniczne</span>
      </button>

      <button @click="$emit('switch-view', 'storage')" :class="getBtnClass('storage')">
        <div :class="getIndicatorClass('storage')"></div>
        <div class="w-8 flex justify-center shrink-0"><svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg></div>
        <span class="ml-3 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">Sprzęt i magazyn</span>
      </button>

      <div class="my-2 border-t border-slate-100 mx-4 w-12 group-hover:w-full transition-all duration-300"></div>

      <button @click="$emit('switch-view', 'tickets')" :class="getBtnClass('tickets')">
        <div :class="getIndicatorClass('tickets')"></div>
        <div class="w-8 flex justify-center shrink-0"><svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 22H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8l8 8v10a2 2 0 0 1-2 2z"/><polyline points="14 2 14 10 22 10"/><line x1="9" x2="15" y1="15" y2="15"/><line x1="9" x2="11" y1="11" y2="11"/></svg></div>
        <span class="ml-3 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">Aktualne zgłoszenia</span>
      </button>

      <button @click="$emit('switch-view', 'clients')" :class="getBtnClass('clients')">
        <div :class="getIndicatorClass('clients')"></div>
        <div class="w-8 flex justify-center shrink-0"><svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8"/><path d="M3 8h18"/><path d="M16 12v-2"/><path d="M8 12v-2"/><path d="M12 16v-6"/></svg></div>
        <span class="ml-3 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">Baza klientów</span>
      </button>

      <button @click="$emit('switch-view', 'schedule')" :class="getBtnClass('schedule')">
        <div :class="getIndicatorClass('schedule')"></div>
        <div class="w-8 flex justify-center shrink-0"><svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
        <span class="ml-3 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">Harmonogram</span>
      </button>

      <button @click="$emit('switch-view', 'analytics')" :class="getBtnClass('analytics')">
        <div :class="getIndicatorClass('analytics')"></div>
        <div class="w-8 flex justify-center shrink-0"><svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></div>
        <span class="ml-3 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">Statystyki (BI)</span>
      </button>

      <button @click="$emit('switch-view', 'billings')" :class="getBtnClass('billings')">
        <div :class="getIndicatorClass('billings')"></div>
        <div class="w-8 flex justify-center shrink-0"><svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg></div>
        <span class="ml-3 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">Rozliczenia</span>
      </button>

    </div>

    <!-- DOLNA SEKCJA -->
    <div class="mt-auto px-3 pb-6 pt-4 border-t border-slate-100 flex flex-col gap-2 shrink-0 w-full">
      
      <button @click="$emit('open-settings')" class="flex items-center justify-start w-full p-2.5 text-slate-400 hover:text-[#58b347] transition-all duration-300 group">
        <svg class="w-6 h-6 shrink-0 transition-all duration-300 group-hover:drop-shadow-[0_0_10px_rgba(88,179,71,0.8)] group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
      </button>

      <button @click="$emit('logout')" class="flex items-center justify-start w-full p-2.5 text-slate-400 hover:text-red-500 transition-all duration-300 group">
        <svg class="w-6 h-6 shrink-0 scale-x-[-1] transition-all duration-300 group-hover:drop-shadow-[0_0_10px_rgba(239,68,68,0.85)] group-hover:scale-x-[-1.15] group-hover:scale-y-[1.15]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
      </button>

    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  currentView: String
})

defineEmits(['switch-view', 'open-settings', 'logout'])

// Zwraca odpowiednie klasy dla przycisku w zależności od tego, czy jest aktywny
const getBtnClass = (viewName) => {
  if (props.currentView === viewName) {
    return "nav-item relative flex items-center pl-5 py-3 mx-2 rounded-xl transition-all duration-200 min-w-max border text-white bg-[#58b347] font-bold border-[#58b347] shadow-[0_4px_14px_rgba(88,179,71,0.35)]"
  }
  return "nav-item relative flex items-center pl-5 py-3 mx-2 rounded-xl transition-all duration-200 min-w-max border text-slate-500 font-medium border-transparent hover:bg-[#58b347]/10 hover:text-[#58b347] hover:border-[#58b347]/30 hover:shadow-[0_0_15px_rgba(88,179,71,0.15)]"
}

// Zwraca odpowiednie klasy dla białego wskaźnika po lewej stronie
const getIndicatorClass = (viewName) => {
  if (props.currentView === viewName) {
    return "active-indicator absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-white rounded-r-md transition-all"
  }
  return "active-indicator hidden absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-white rounded-r-md transition-all"
}
</script>