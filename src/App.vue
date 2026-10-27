<template>
  <div id="app-root" class="bg-[#f4f6f8] text-slate-800 font-sans h-screen w-screen overflow-hidden flex flex-row relative">
    
    <!-- Animowany pasek trzymający przestrzeń (efekt kinowy) -->
    <div 
      class="h-full shrink-0 border-r border-slate-200 bg-white z-30 transition-all duration-300 ease-in-out"
      :class="isSidebarHovered ? 'w-[260px]' : 'w-[72px]'"
    ></div>
    
    <!-- MENU BOCZNE -->
    <div 
      class="absolute top-0 left-0 h-full z-40"
      @mouseenter="isSidebarHovered = true" 
      @mouseleave="isSidebarHovered = false"
    >
      <Sidebar 
        :currentView="currentActiveView" 
        @switch-view="changeView"
        @logout="() => {}"
      />
    </div>
    
    <!-- GŁÓWNA PRZESTRZEŃ -->
    <main class="flex-1 relative h-full overflow-hidden z-10" id="main-content-area">
      <!-- Dynamiczne przełączanie widoków -->
      <TicketsView v-if="currentActiveView === 'tickets'" />
      <ClientsView v-else-if="currentActiveView === 'clients'" />
      <ScheduleView v-else-if="currentActiveView === 'schedule'" />
      <BillingsView v-else-if="currentActiveView === 'billings'" />
      <StorageView v-else-if="currentActiveView === 'storage'" />
      <TechniciansView v-else-if="currentActiveView == 'technicians'" />
      <StationsView v-else-if="currentActiveView == 'stations'" />
      <MapView v-else-if="currentActiveView == 'map'" />
      
      <!-- Zaślepka dla pozostałych, jeszcze niezbudowanych zakładek -->
      <div v-else class="flex flex-col items-center justify-center h-full text-slate-400">
        <svg class="w-16 h-16 mb-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        <h2 class="text-xl font-black uppercase tracking-widest text-slate-300">Moduł w budowie</h2>
      </div>
    </main>

  </div>
</template>

<script setup>
import { ref } from 'vue'

// Importy komponentów bazowych i paneli
import Sidebar from './components/sidebar/Sidebar.vue'
import StorageView from './panels/storage/StorageView.vue'
import TechniciansView from './panels/technicians/TechniciansView.vue'
import ClientsView from './panels/clients/ClientsView.vue'
import ScheduleView from './panels/schedule/ScheduleView.vue' 
import TicketsView from './panels/tickets/TicketsView.vue'
import BillingsView from './panels/billings/BillingsView.vue'
import StationsView from './panels/stations/StationsView.vue'
import MapView from './panels/map/MapView.vue'

// Stan aplikacji
const isSidebarHovered = ref(false)
const currentActiveView = ref('map') // Domyślnie ładujemy Baze Klientów

// Zmiana 2: Funkcja odbierająca kliknięcie z menu bocznego
const changeView = (viewName) => {
  currentActiveView.value = viewName
}
</script>