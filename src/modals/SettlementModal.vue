<template>
  <div v-if="show" @click.self="$emit('close')" class="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-fadeIn pt-20">
    <div class="relative w-full max-w-6xl">
      
      <!-- KONTENER NA ZAKŁADKI WIZYT -->
      <div class="absolute bottom-[calc(100%-1px)] left-8 flex items-end gap-1.5 overflow-x-auto overflow-y-hidden z-[30] pointer-events-auto max-w-[calc(100%-4rem)] ticket-custom-scrollbar">
        <div v-for="(v, idx) in visits" :key="v.id" @click="switchVisit(v.id)" 
             class="text-[11px] tracking-widest uppercase flex items-center justify-center relative transition-all"
             :class="v.id === activeVisitId ? 'bg-white text-[#58b347] font-black z-[50] pt-4 pb-[16px] px-8 border-l border-t border-r border-slate-200 border-b-white translate-y-[2px] rounded-t-[16px]' : 'bg-slate-200/90 text-slate-500 font-bold z-[10] hover:bg-slate-300 hover:text-slate-700 cursor-pointer pt-3 pb-3 px-6 border border-slate-300/80 rounded-t-[16px]'">
          
          WIZYTA {{ v.label }}
          
          <div v-if="v.id === activeVisitId && idx > 0" @click.stop="deleteVisit(v.id)" class="absolute top-1.5 right-1.5 w-4 h-4 flex items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 hover:scale-110 transition-all shadow-sm cursor-pointer" title="Usuń wizytę">
            <svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </div>
        </div>

        <button @click="addVisit" class="pt-3 pb-3 px-6 rounded-t-[16px] border border-[#499b3a] text-[10px] font-black text-white bg-[#58b347] hover:bg-[#499b3a] transition-all cursor-pointer flex items-center justify-center gap-1.5 z-[10] ml-1 shrink-0">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          DODAJ WIZYTĘ
        </button>
      </div>

      <!-- GŁÓWNY KONTENER MODALA -->
      <div class="bg-white rounded-[24px] rounded-tl-none w-full overflow-hidden flex flex-col max-h-[90vh] relative z-20 shadow-[0_0_40px_rgba(0,0,0,0.15)] border-t border-t-transparent border-l border-r border-b border-slate-200">

        <!-- Nagłówek Modala -->
        <div class="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white shrink-0 relative z-30">
          <div>
            <h3 class="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
              <svg class="w-5 h-5 text-[#58b347]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              ROZLICZENIE ZGŁOSZENIA (ROZBITE NA WIZYTY)
            </h3>
            <p class="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{{ currentTicketDisplayId }}</p>
          </div>
          <div class="flex items-center gap-4">
            <div class="bg-[#eaf5e9] text-[#499b3a] border border-[#58b347]/30 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h12"/><path d="M4 14h9"/><path d="M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12c0 4.4 3.5 8 7.8 8 2 0 3.8-.8 5.2-2"/></svg>
              1 EUR = <span>{{ (Number(nbpRate) || 4.30).toFixed(4) }}</span> PLN
            </div>
            <button @click="$emit('close')" class="text-slate-400 hover:text-red-500 transition-colors bg-white border border-slate-200 p-2 rounded-xl shadow-sm">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <!-- Ciało Modala (Grid) -->
        <div class="flex-1 overflow-y-auto ticket-custom-scrollbar p-8 bg-[#f4f6f8]">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            <!-- LEWA KOLUMNA: Informacje & Notatki -->
            <div class="lg:col-span-4 flex flex-col gap-5">
              
              <div class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
                <h4 class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-100 pb-2">Dane Stacji i Klienta</h4>
                <div class="space-y-4">
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <span class="block text-[9px] font-bold uppercase tracking-widest text-slate-400">ID / Stacja</span>
                      <span class="block text-[14px] font-black text-slate-800">{{ currentTicket?.qp || currentTicket?.qp_id || currentTicket?.station_id || 'Brak stacji' }}</span>
                    </div>
                    <div>
                      <span class="block text-[9px] font-bold uppercase tracking-widest text-slate-400">Kraj (Lokalizacja)</span>
                      <span class="block text-[12px] font-black text-[#58b347]">{{ currentTicket?.country || currentTicket?.city || 'Brak danych' }}</span>
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <span class="block text-[9px] font-bold uppercase tracking-widest text-slate-400">Produkt</span>
                      <span class="block text-[11px] font-bold text-slate-600">{{ currentTicket?.product || currentTicket?.manufacturer || '-' }}</span>
                    </div>
                    <div>
                      <span class="block text-[9px] font-bold uppercase tracking-widest text-slate-400">Klient</span>
                      <span class="block text-[11px] font-bold text-slate-600 truncate" :title="currentTicket?.client">{{ currentTicket?.client || '-' }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                <h4 class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 border-b border-slate-100 pb-2 flex items-center justify-between">
                  Parametry dla tej wizyty
                  <span class="text-[#58b347]">WIZYTA {{ activeVisit.label }}</span>
                </h4>
                
                <div>
                  <label class="block text-[10px] font-black uppercase tracking-widest text-[#58b347] mb-1.5">Płatnik / Do rozliczenia</label>
                  <input type="text" v-model="activeVisit.client" placeholder="Wpisz na kogo wystawić rozliczenie..." class="w-full bg-[#eaf5e9] border border-[#58b347]/30 rounded-xl px-3 py-2 text-xs font-bold text-[#499b3a] focus:outline-none focus:ring-2 focus:ring-[#58b347]/30 transition-colors" />
                </div>

                <div>
                  <label class="block text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1.5">Region (Wpływa na stawki)</label>
                  <select v-model.number="activeVisit.region" @change="recalculateRegionRates" class="w-full bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-xs font-bold text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-colors cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%208l5%205%205-5%22%20stroke%3D%22%232563eb%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_12px_center] pr-10">
                    <option value="1">Region 1 (m.in. AT, DE, FR, NL)</option>
                    <option value="2">Region 2 (m.in. PL, CZ, SK, RO)</option>
                    <option value="3">Region 3 (m.in. CH, LU)</option>
                    <option value="4">Region 4 (m.in. DK, FI, SE, NO)</option>
                  </select>
                </div>

                <div>
                  <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Przypisany Serwisant</label>
                  <select v-model="activeVisit.tech" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#58b347] focus:bg-white transition-colors cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%208l5%205%205-5%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_12px_center] pr-10">
                    <option value="">-- Wybierz Serwisanta --</option>
                    <option v-for="t in availableTechs" :key="t" :value="t">{{ t }}</option>
                  </select>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Data Wizyty</label>
                    <input type="date" v-model="activeVisit.date" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#58b347] focus:bg-white transition-colors cursor-pointer" />
                  </div>
                  <div>
                    <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Typ Realizacji</label>
                    <select v-model="activeVisit.type" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#58b347] focus:bg-white transition-colors cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%208l5%205%205-5%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_12px_center] pr-8">
                      <option value="Awaryjne">Awaryjne</option>
                      <option value="Planowane">Planowane</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Wynik wizyty</label>
                  <select v-model="activeVisit.status_fixed" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#58b347] focus:bg-white transition-colors cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%208l5%205%205-5%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_12px_center] pr-10">
                    <option value="TAK">Stacja Naprawiona</option>
                    <option value="NIE">Nienaprawiona</option>
                    <option value="PRZEGLĄD">Przegląd / Maintenance</option>
                  </select>

                  <label class="flex items-center gap-2 mt-3 cursor-pointer group select-none">
                    <div class="relative flex items-center justify-center w-4 h-4 shrink-0">
                      <input type="checkbox" v-model="activeVisit.status_revisit" class="peer sr-only" />
                      <div class="w-4 h-4 border-2 border-slate-300 rounded bg-white peer-checked:bg-amber-500 peer-checked:border-amber-500 transition-all flex items-center justify-center shadow-sm">
                         <svg class="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    </div>
                    <span class="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-amber-600 transition-colors mt-0.5">Wymagana ponowna wizyta</span>
                  </label>
                </div>

                <div>
                  <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Komentarz (Widoczny na fakturze)</label>
                  <textarea v-model="activeVisit.notes" rows="4" placeholder="Wpisz czynności, błędy lub powody niedokończenia naprawy..." class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#58b347] focus:bg-white transition-colors resize-none ticket-custom-scrollbar"></textarea>
                </div>
              </div>
            </div>

            <!-- PRAWA KOLUMNA: Kalkulator Kosztów -->
            <div class="lg:col-span-8 flex flex-col gap-5">
              
              <!-- System Usług z Wyszukiwarką i Wielo-Cennikami -->
              <div class="bg-white border border-slate-200/80 rounded-2xl shadow-sm flex flex-col overflow-hidden">
                <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-3">
                  <h4 class="text-[11px] font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
                    <svg class="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
                    Wykonane Usługi (Wybór z Cenników)
                  </h4>
                  
                  <div class="flex gap-3">
                    <select v-model="selectedPricelistId" class="w-1/2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#58b347] transition-colors cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%208l5%205%205-5%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_16px_center] pr-10 shadow-sm shrink-0">
                      <option value="">-- Wybierz Cennik --</option>
                      <option v-for="pl in availablePricelists" :key="pl" :value="pl">{{ pl }}</option>
                    </select>
                    <button @click="addPricelistBlock" class="bg-[#eaf5e9] text-[#499b3a] border border-[#58b347]/30 hover:bg-[#58b347] hover:text-white font-extrabold px-4 py-2.5 rounded-xl text-xs uppercase tracking-widest transition-all shadow-sm shrink-0">
                      + Dodaj Cennik do wizyty
                    </button>
                  </div>
                  
                  <div class="relative flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden focus-within:border-[#58b347] transition-colors shadow-sm">
                    <div class="flex items-center justify-center pl-3 w-8 h-full shrink-0 text-slate-400"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></div>
                    <input type="text" v-model="serviceSearchQuery" placeholder="Wpisz nazwę usługi lub L.p. aby przefiltrować rozwinięty cennik..." class="w-full pl-2 pr-3 py-2 text-xs font-bold text-slate-700 focus:outline-none bg-transparent" />
                  </div>
                  
                  <div class="flex items-center gap-2 mt-2 pt-3 border-t border-slate-100">
                    <input type="text" v-model="customServiceName" @keydown.enter="addCustomService" placeholder="Nazwa usługi spoza cennika..." class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 shadow-sm" />
                    <input type="number" v-model.number="customServicePrice" @keydown.enter="addCustomService" placeholder="Kwota (€)" class="w-24 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-center text-slate-700 focus:outline-none focus:border-blue-500 shadow-sm shrink-0" />
                    <button @click="addCustomService" class="bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 font-black px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-sm shrink-0">Dodaj</button>
                  </div>
                </div>
                
                <div class="p-5 bg-white min-h-[220px] ticket-custom-scrollbar overflow-y-auto max-h-[380px]">
                  <div class="flex flex-col gap-2">
                    <div v-if="activeVisit.pricelists && activeVisit.pricelists.length === 0" class="text-center text-xs font-bold text-slate-400 py-6 uppercase tracking-widest">Wybierz cennik z listy i dodaj go klikając przycisk.</div>
                    
                    <!-- Akordeony Cenników -->
                    <div v-for="plName in activeVisit.pricelists" :key="plName" class="flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all mb-2">
                      <div @click="togglePricelistAccordion(plName)" class="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 border-b border-slate-100 cursor-pointer select-none transition-colors">
                        <h5 class="text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors" :class="expandedPricelist === plName ? 'text-[#58b347]' : 'text-slate-800'">
                          <svg class="w-4 h-4 transition-transform duration-300" :class="[expandedPricelist === plName ? 'text-[#58b347] rotate-180' : 'text-slate-400']" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="6 9 12 15 18 9"/></svg>
                          {{ plName }}
                        </h5>
                        <button @click.stop="removePricelistBlock(plName)" class="text-slate-300 hover:text-red-500 transition-colors flex items-center gap-1 text-[9px] font-black uppercase tracking-widest shrink-0">
                          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg> Usuń Grupę
                        </button>
                      </div>
                      
                      <div v-show="expandedPricelist === plName" class="flex flex-col gap-2 p-3 bg-white">
                        <template v-for="item in getFilteredItems(plName)" :key="item.id">
                          <label class="flex items-center gap-4 p-3 border rounded-xl cursor-pointer hover:border-[#58b347]/50 transition-all group select-none" :class="isServiceSelected(item.id) ? 'border-[#58b347] bg-[#58b347]/5' : 'border-slate-200 bg-white'">
                            <div class="relative flex items-center justify-center w-5 h-5 shrink-0 ml-1">
                              <input type="checkbox" :checked="isServiceSelected(item.id)" @change="toggleService(item, $event)" class="peer sr-only" />
                              <div class="w-5 h-5 border-2 border-slate-300 rounded bg-white peer-checked:bg-[#58b347] peer-checked:border-[#58b347] transition-all flex items-center justify-center shadow-sm">
                                <svg class="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              </div>
                            </div>
                            <div class="flex-1 flex flex-col min-w-0">
                              <span class="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors truncate" :title="item.displayName">{{ item.displayName }}</span>
                            </div>
                            <div v-if="item.time" class="text-[10px] text-slate-500 font-bold bg-slate-50 px-2 py-1 rounded-md border border-slate-200 flex items-center gap-1.5 shrink-0">
                              <svg class="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> {{ item.time }} h
                            </div>
                            <div class="text-[13px] font-black text-[#58b347] w-14 text-right shrink-0">€{{ (Number(item.price) || 0).toFixed(2) }}</div>
                          </label>
                        </template>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Robocizna i Dojazd -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                
                <!-- Robocizna (Niestandardowe RBH) -->
                <div class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
                  <h4 class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-1.5">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Dodatkowe Godziny (RBH)
                  </h4>
                  <div class="flex items-center gap-3">
                    <div class="flex-1">
                      <label class="block text-[9px] font-bold uppercase text-slate-400 mb-1">Ilość Godzin</label>
                      <input type="number" v-model.number="activeVisit.rbg_qty" min="0" step="0.5" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-black text-center text-slate-800 focus:outline-none focus:border-[#58b347] transition-colors" />
                    </div>
                    <div class="text-slate-300 font-black mt-5">x</div>
                    <div class="flex-1">
                      <label class="block text-[9px] font-bold uppercase text-slate-400 mb-1">Stawka (€)</label>
                      <input type="number" v-model.number="activeVisit.rbg_rate" min="0" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-black text-center text-slate-800 focus:outline-none focus:border-[#58b347] transition-colors" />
                    </div>
                  </div>
                </div>

                <!-- Dojazd -->
                <div class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
                  <div class="flex items-center justify-between mb-4">
                    <h4 class="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"/><path d="M14 9h4l4 4v5h-3"/><circle cx="7.5" cy="18" r="2.5"/><circle cx="17.5" cy="18" r="2.5"/></svg> Rozliczenie Dojazdu
                    </h4>
                    <div class="flex bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200/60">
                      <button @click="activeVisit.travel_type = 'ryczalt'" class="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all" :class="activeVisit.travel_type === 'ryczalt' ? 'bg-white text-[#58b347] shadow-sm' : 'text-slate-400 hover:text-slate-600'">Ryczałt</button>
                      <button @click="activeVisit.travel_type = 'km'" class="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all" :class="activeVisit.travel_type === 'km' ? 'bg-white text-[#58b347] shadow-sm' : 'text-slate-400 hover:text-slate-600'">Kilometry</button>
                    </div>
                  </div>
                  
                  <div v-if="activeVisit.travel_type === 'ryczalt'" class="flex items-center gap-3">
                    <div class="w-full">
                      <label class="block text-[9px] font-bold uppercase text-slate-400 mb-1">Kwota Ryczałtu (€)</label>
                      <input type="number" v-model.number="activeVisit.travel_flat" min="0" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-black text-center text-slate-800 focus:outline-none focus:border-[#58b347] transition-colors" />
                    </div>
                  </div>

                  <div v-else class="flex items-center gap-3">
                    <div class="flex-1">
                      <label class="block text-[9px] font-bold uppercase text-slate-400 mb-1">Kilometry</label>
                      <input type="number" v-model.number="activeVisit.travel_km" min="0" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-black text-center text-slate-800 focus:outline-none focus:border-[#58b347] transition-colors" />
                    </div>
                    <div class="text-slate-300 font-black mt-5">x</div>
                    <div class="flex-1">
                      <label class="block text-[9px] font-bold uppercase text-slate-400 mb-1">Stawka/KM (€)</label>
                      <input type="number" v-model.number="activeVisit.travel_rate" min="0" step="0.1" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-black text-center text-slate-800 focus:outline-none focus:border-[#58b347] transition-colors" />
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
        
        <!-- Stopka Podsumowująca -->
        <div class="p-6 border-t border-slate-200 bg-white shrink-0 flex items-center justify-between rounded-b-[24px]">
          <div class="flex items-center gap-8">
            
            <div class="flex flex-col border-r border-slate-200 pr-8">
              <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Suma za tę wizytę</span>
              <div class="flex items-end gap-2">
                <span class="text-xl font-black text-slate-700 tracking-tight">€ {{ (Number(currentVisitTotalEur) || 0).toFixed(2) }}</span>
              </div>
            </div>

            <div class="flex flex-col">
              <span class="text-[10px] font-black text-[#58b347] uppercase tracking-widest">ŁĄCZNIE (Wszystkie wizyty)</span>
              <div class="flex items-end gap-3">
                <span class="text-3xl font-black text-[#58b347] tracking-tight">€ {{ (Number(globalTotalEur) || 0).toFixed(2) }}</span>
                <span class="text-sm font-bold text-slate-400 mb-1.5 tracking-wide">(~ {{ ((Number(globalTotalEur) || 0) * (Number(nbpRate) || 4.3)).toFixed(2) }} PLN)</span>
              </div>
            </div>
            
          </div>
          <div class="flex gap-3">
            <button v-if="canDelete" @click="confirmDeleteSettlement" class="bg-red-50 text-red-600 border border-red-200 font-extrabold py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-colors shadow-sm flex items-center gap-2">
               <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
               USUŃ ROZLICZENIE
            </button>

            <button @click="$emit('close')" class="bg-slate-50 border border-slate-200 text-slate-600 font-extrabold py-3.5 px-8 rounded-xl text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors shadow-sm">Anuluj</button>
            <button @click="saveSettlement" :disabled="isSaving" class="bg-[#58b347] text-white font-black py-3.5 px-8 rounded-xl text-xs uppercase tracking-widest hover:bg-[#499b3a] transition-all shadow-md shadow-[#58b347]/20 flex items-center gap-2 disabled:opacity-50">
              <span>{{ saveBtnText }}</span>
              <svg v-if="!isSaving" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useBillingsStore } from '../stores/useBillingsStore'

const props = defineProps({
  show: Boolean,
  ticketId: [String, Number]
})

const emit = defineEmits(['close', 'save'])
const store = useBillingsStore()

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

// Stany lokalne
const nbpRate = computed(() => Number(store.nbpRate) || 4.30)
const isSaving = ref(false)
const currentTicket = ref(null)

const visits = ref([])
const activeVisitId = ref(null)

const availableTechs = computed(() => {
  return store.techList && store.techList.length > 0 ? store.techList.map(t => t.name || t) : []
})

const availablePricelists = computed(() => Object.keys(store.pricelists || {}))
const selectedPricelistId = ref('')

const expandedPricelist = ref('')
const serviceSearchQuery = ref('')

const customServiceName = ref('')
const customServicePrice = ref(0)

// Inicjalizacja przy otwieraniu modalu
watch(() => props.show, (isOpen) => {
  if (isOpen) {
    initData()
  }
})

// Zamykanie modalu przez ESC
const handleKeydown = (e) => {
  if (props.show && e.key === 'Escape') emit('close')
}

onMounted(() => { window.addEventListener('keydown', handleKeydown) })
onUnmounted(() => { window.removeEventListener('keydown', handleKeydown) })

const initData = () => {
  const reqId = String(props.ticketId || '').toLowerCase().trim()

  // Szukamy w bilingach (Obiekt będzie tam z wstrzyknięcia PRE-SEEDING w TicketsView)
  let t = store.billings.find(x => 
    String(x.id).toLowerCase().trim() === reqId || 
    String(x.ticket_id || '').toLowerCase().trim() === reqId ||
    String(x.ticket_code || '').toLowerCase().trim() === reqId
  )

  if (t) {
    currentTicket.value = {
      ...JSON.parse(JSON.stringify(t)),
      qp: t.qp || t.qp_id || t.station_id || 'Brak stacji',
      client: t.client || t.t_client || 'Brak klienta',
      product: t.product || t.manufacturer || '-',
      country: t.country || t.city || 'Polska',
      technician: t.technician_id || t.technician || ''
    }
  } else {
    currentTicket.value = { id: props.ticketId, ticket_id: props.ticketId, ticket_code: props.ticketId, qp: 'QP-00000', client: 'Nieznany', product: '-' }
  }

  // Odczyt lub generowanie wizyt (Używa surowych danych diagnozy przeniesionych z Centrum Zgłoszeń)
  let sd = currentTicket.value.saved_data
  if (typeof sd === 'string') {
    try { sd = JSON.parse(sd) } catch(e) {}
  }

  if (sd && sd.visits_array && sd.visits_array.length > 0) {
    visits.value = JSON.parse(JSON.stringify(sd.visits_array))
  } else {
    let diagnoza = currentTicket.value.raw_diagnoza || sd?.raw_diagnoza || ''
    let notatki = currentTicket.value.notes || sd?.notes || ''
    visits.value = parseVisitsFromText(diagnoza, notatki)
    visits.value.forEach(v => {
      v.client = currentTicket.value.client || ''
      v.tech = currentTicket.value.technician || currentTicket.value.technician_id || ''
    })
  }

  if (visits.value.length > 0) {
    activeVisitId.value = visits.value[visits.value.length - 1].id
    expandedPricelist.value = visits.value[visits.value.length - 1].pricelists?.[0] || ''
  }

  // Wymuszenie wczytania cenników w tle DOPIERO GDY MAMY ZGŁOSZENIE (Rozwiązuje konflikt kasowania bazy billings)
  if (!store.pricelists || Object.keys(store.pricelists).length === 0) {
    store.fetchBillingsData()
  }
}

const currentTicketDisplayId = computed(() => currentTicket.value?.ticket_code || currentTicket.value?.ticket_number || currentTicket.value?.ticket_id || currentTicket.value?.id || '-')

const activeVisit = computed({
  get: () => visits.value.find(v => v.id === activeVisitId.value) || {},
  set: (val) => {
    const idx = visits.value.findIndex(v => v.id === activeVisitId.value)
    if (idx !== -1) visits.value[idx] = val
  }
})

const switchVisit = (id) => {
  activeVisitId.value = id
  expandedPricelist.value = activeVisit.value.pricelists?.[0] || ''
}

const addVisit = () => {
  let nextIdx = visits.value.length
  let label = ROMAN_NUMERALS[nextIdx] || (nextIdx + 1).toString()
  let v1 = visits.value[0] || {}
  
  let newVisit = { 
    id: Date.now(), label: label, 
    client: v1.client || '', tech: v1.tech || '', date: '', type: 'Planowane',
    status_fixed: 'TAK', status_revisit: false, notes: '',
    region: v1.region || 2, travel_type: 'ryczalt', travel_flat: 120, travel_km: 0, travel_rate: 0.60,
    rbg_qty: 0, rbg_rate: 60, checkboxes: [], pricelists: [], selected_services: []
  }
  visits.value.push(newVisit)
  activeVisitId.value = newVisit.id
}

const deleteVisit = (id) => {
  const idx = visits.value.findIndex(v => v.id === id)
  if (idx === 0) { alert("Wizyta I nie może zostać usunięta."); return }
  if (!confirm("Czy na pewno chcesz usunąć tę wizytę z rozliczenia?")) return

  visits.value.splice(idx, 1)
  visits.value.forEach((v, index) => { v.label = ROMAN_NUMERALS[index] || (index + 1).toString() })
  activeVisitId.value = visits.value[visits.value.length - 1].id
}

const parseVisitsFromText = (diagStr, notesStr) => {
  let vArr = []
  let dStr = diagStr || ''
  let nStr = notesStr || ''

  if (dStr.includes('--- WIZYTA ')) {
    let dBlocks = dStr.split(/--- WIZYTA (.+?) ---\n/)
    let nBlocks = nStr.split(/--- WIZYTA (.+?) ---\n/)
    
    for(let i = 1; i < dBlocks.length; i+=2) {
      let label = dBlocks[i].trim()
      if (!label) continue
      let note = ''
      let nIdx = nBlocks.indexOf(label)
      if(nIdx !== -1) note = nBlocks[nIdx+1] ? nBlocks[nIdx+1].trim() : ''
      
      vArr.push({ 
        id: Date.now() + i, label: label, 
        client: '', tech: '', date: '', type: 'Planowane', status_fixed: 'TAK', status_revisit: false, notes: note,
        region: 2, travel_type: 'ryczalt', travel_flat: 120, travel_km: 0, travel_rate: 0.60,
        rbg_qty: 0, rbg_rate: 60, checkboxes: [], pricelists: [], selected_services: []
      })
    }
  } else {
    if (dStr.trim() !== '' || nStr.trim() !== '') {
      vArr.push({ 
        id: Date.now(), label: 'I', client: '', tech: '', date: '', type: 'Planowane', status_fixed: 'TAK', status_revisit: false, notes: nStr.trim(),
        region: 2, travel_type: 'ryczalt', travel_flat: 120, travel_km: 0, travel_rate: 0.60,
        rbg_qty: 0, rbg_rate: 60, checkboxes: [], pricelists: [], selected_services: [] 
      })
    }
  }
  
  if (vArr.length === 0) {
    vArr.push({ 
      id: Date.now(), label: 'I', client: '', tech: '', date: '', type: 'Planowane', status_fixed: 'TAK', status_revisit: false, notes: '',
      region: 2, travel_type: 'ryczalt', travel_flat: 120, travel_km: 0, travel_rate: 0.60,
      rbg_qty: 0, rbg_rate: 60, checkboxes: [], pricelists: [], selected_services: []
    })
  }
  return vArr
}

// --- LOGIKA CENNIKÓW ---
const addPricelistBlock = () => {
  if (!selectedPricelistId.value) return
  if (!activeVisit.value.pricelists) activeVisit.value.pricelists = []
  if (!activeVisit.value.pricelists.includes(selectedPricelistId.value)) {
    activeVisit.value.pricelists.push(selectedPricelistId.value)
    expandedPricelist.value = selectedPricelistId.value
  }
  selectedPricelistId.value = ''
}

const togglePricelistAccordion = (plName) => {
  expandedPricelist.value = expandedPricelist.value === plName ? '' : plName
  serviceSearchQuery.value = ''
}

const removePricelistBlock = (plName) => {
  activeVisit.value.pricelists = activeVisit.value.pricelists.filter(p => p !== plName)
  activeVisit.value.selected_services = activeVisit.value.selected_services.filter(s => s.plname !== plName)
  activeVisit.value.checkboxes = activeVisit.value.checkboxes.filter(chk => !chk.includes(`mas_chk_${plName.replace(/[^a-zA-Z0-9]/g, '_')}`))
}

const getFilteredItems = (plName) => {
  if (!activeVisit.value.selected_services) activeVisit.value.selected_services = []

  if (plName === 'Dodatkowe') {
    return activeVisit.value.selected_services.filter(s => s.plname === 'Dodatkowe').map(s => ({
      id: s.id, displayName: s.name, price: Number(s.price) || 0, plname: 'Dodatkowe', time: ''
    }))
  }

  let items = store.pricelists[plName] || []
  const regionIdx = Number(activeVisit.value.region) || 2
  
  let mapped = items.map((item, index) => {
    let price = Number(item.prices && item.prices.length >= regionIdx ? item.prices[regionIdx - 1] : (item.price || 0))
    let displayName = item.lp ? `[${item.lp}] ${item.name}` : item.name
    return {
      id: `mas_chk_${plName.replace(/[^a-zA-Z0-9]/g, '_')}_${index}`,
      originalId: index,
      name: item.name,
      lp: item.lp || '',
      displayName: displayName,
      time: item.time || '',
      price: price,
      plname: plName
    }
  }).filter(item => !String(item.lp).includes('L.p') && !String(item.name).toLowerCase().includes('aktywnoś'))

  const term = serviceSearchQuery.value.toLowerCase().trim()
  if (term) {
    mapped = mapped.filter(m => m.displayName.toLowerCase().includes(term))
  }
  return mapped
}

const getItemPrice = (item) => Number(item.price) || 0

const isServiceSelected = (chkId) => {
  return activeVisit.value.checkboxes && activeVisit.value.checkboxes.includes(chkId)
}

const toggleService = (item, event) => {
  const isChecked = event.target.checked
  if (!activeVisit.value.checkboxes) activeVisit.value.checkboxes = []
  if (!activeVisit.value.selected_services) activeVisit.value.selected_services = []

  if (isChecked) {
    activeVisit.value.checkboxes.push(item.id)
    activeVisit.value.selected_services.push({
      id: item.id, plname: item.plname, lp: item.lp, name: item.displayName, price: Number(item.price) || 0
    })
  } else {
    activeVisit.value.checkboxes = activeVisit.value.checkboxes.filter(id => id !== item.id)
    activeVisit.value.selected_services = activeVisit.value.selected_services.filter(s => s.id !== item.id)
  }
}

const addCustomService = () => {
  const name = customServiceName.value.trim()
  const price = Number(customServicePrice.value) || 0
  if (!name) return

  if (!activeVisit.value.pricelists) activeVisit.value.pricelists = []
  if (!activeVisit.value.pricelists.includes('Dodatkowe')) {
    activeVisit.value.pricelists.push('Dodatkowe')
    expandedPricelist.value = 'Dodatkowe'
  }

  const customId = 'mas_chk_CUSTOM_' + Date.now()
  if (!activeVisit.value.checkboxes) activeVisit.value.checkboxes = []
  if (!activeVisit.value.selected_services) activeVisit.value.selected_services = []

  activeVisit.value.checkboxes.push(customId)
  activeVisit.value.selected_services.push({
    id: customId, plname: 'Dodatkowe', lp: '', name: name, price: price
  })

  customServiceName.value = ''
  customServicePrice.value = 0
}

const recalculateRegionRates = () => {
  const regionIdx = Number(activeVisit.value.region) || 2
  if (regionIdx === 1) { activeVisit.value.travel_flat = 170; activeVisit.value.rbg_rate = 90; activeVisit.value.travel_rate = 0.80 }
  if (regionIdx === 2) { activeVisit.value.travel_flat = 120; activeVisit.value.rbg_rate = 60; activeVisit.value.travel_rate = 0.60 }
  if (regionIdx === 3) { activeVisit.value.travel_flat = 245; activeVisit.value.rbg_rate = 125; activeVisit.value.travel_rate = 1.20 }
  if (regionIdx === 4) { activeVisit.value.travel_flat = 190; activeVisit.value.rbg_rate = 100; activeVisit.value.travel_rate = 0.90 }

  visits.value.forEach(v => {
    if (v.selected_services) {
      v.selected_services.forEach(svc => {
        if (svc.plname !== 'Dodatkowe') {
          const items = store.pricelists[svc.plname] || []
          const originalItem = items.find(i => (i.lp ? `[${i.lp}] ${i.name}` : i.name) === svc.name)
          if (originalItem && originalItem.prices && originalItem.prices.length >= regionIdx) {
            svc.price = Number(originalItem.prices[regionIdx - 1]) || 0
          }
        }
      })
    }
  })
}

// --- KALKULACJE ---
const currentVisitTotalEur = computed(() => {
  let eur = 0
  const v = activeVisit.value
  if (!v) return 0
  
  ;(v.selected_services || []).forEach(svc => { eur += (Number(svc.price) || 0) })
  eur += ((Number(v.rbg_qty) || 0) * (Number(v.rbg_rate) || 0))
  
  if (v.travel_type === 'ryczalt') {
    eur += (Number(v.travel_flat) || 0)
  } else {
    eur += ((Number(v.travel_km) || 0) * (Number(v.travel_rate) || 0))
  }
  
  return Number(eur) || 0
})

const globalTotalEur = computed(() => {
  let total = 0
  visits.value.forEach(v => {
    let vEur = 0
    ;(v.selected_services || []).forEach(svc => { vEur += (Number(svc.price) || 0) })
    
    vEur += ((Number(v.rbg_qty) || 0) * (Number(v.rbg_rate) || 0))
    
    if (v.travel_type === 'ryczalt') {
      vEur += (Number(v.travel_flat) || 0)
    } else {
      vEur += ((Number(v.travel_km) || 0) * (Number(v.travel_rate) || 0))
    }
    
    total += vEur
  })
  return Number(total) || 0
})

// --- AKCJE ZAPISU ---
const bState = computed(() => currentTicket.value?.billing_state || 'NEW')
const tStatus = computed(() => currentTicket.value?.ticket_status || '')
const isAlreadySettled = computed(() => bState.value === 'SETTLED' || bState.value === 'CORRECTED' || tStatus.value === 'Rozliczone' || tStatus.value === 'Poprawione')

const saveBtnText = computed(() => {
  if (isSaving.value) return 'ZAPISYWANIE...'
  if (bState.value === 'PRE_SETTLED' || tStatus.value.toLowerCase().includes('wstępn')) return 'WERYFIKUJ I ROZLICZ'
  if (isAlreadySettled.value) return 'ZAPISZ JAKO POPRAWIONE'
  return 'ROZLICZ ZGŁOSZENIE'
})

const canDelete = computed(() => bState.value === 'PRE_SETTLED' || bState.value === 'SETTLED' || bState.value === 'CORRECTED' || tStatus.value.toLowerCase().includes('rozlicz'))

const saveSettlement = () => {
  isSaving.value = true
  
  let combinedItemsParts = []
  let combinedNotesArr = []
  let globalRbh = 0
  let globalTravelEur = 0
  
  let mainClient = visits.value[0].client
  let mainTech = visits.value[0].tech
  let mainDate = visits.value[0].date
  let mainType = visits.value[0].type
  let mainFixed = visits.value[0].status_fixed
  let mainRevisit = visits.value[visits.value.length - 1].status_revisit ? 'TAK' : 'NIE'

  visits.value.forEach(v => {
    let visitEur = 0
    let vItemsStr = ''
    let plGroups = {}
    
    ;(v.selected_services || []).forEach(svc => {
      let pl = svc.plname || 'Inne'
      let lp = svc.lp
      let itemName = svc.name || 'Usługa'
      let price = Number(svc.price) || 0
      
      visitEur += price
      if (!plGroups[pl]) plGroups[pl] = []
      if (lp && lp.trim() !== '') plGroups[pl].push(lp)
      else plGroups[pl].push(itemName)
    })

    let stringParts = []
    for (let pl in plGroups) {
      let shortName = pl.replace('Axon Easy', 'AXE').replace('Axon', 'AX')
      if (plGroups[pl].length > 0) stringParts.push(`${shortName}: ${plGroups[pl].join(', ')}`)
      else stringParts.push(`${shortName}`)
    }
    vItemsStr = stringParts.join('; ')

    let vRbhQty = Number(v.rbg_qty) || 0
    let vRbhRate = Number(v.rbg_rate) || 0
    visitEur += (vRbhQty * vRbhRate)
    globalRbh += vRbhQty
    if (vRbhQty > 0) vItemsStr += (vItemsStr ? ' + ' : '') + vRbhQty + ' rbh'

    if (v.travel_type === 'ryczalt') {
      let f = Number(v.travel_flat) || 0
      visitEur += f; globalTravelEur += f
    } else {
      let d = (Number(v.travel_km)||0) * (Number(v.travel_rate)||0)
      visitEur += d; globalTravelEur += d
    }

    if (vItemsStr && vItemsStr.trim() !== '') combinedItemsParts.push(`--- WIZYTA ${v.label} ---\n${vItemsStr}`)
    else if (visitEur > 0) combinedItemsParts.push(`--- WIZYTA ${v.label} ---\nRozliczenie dojazdu / Praca serwisanta`)

    if (v.notes && v.notes.trim() !== '') combinedNotesArr.push(`--- WIZYTA ${v.label} ---\n${v.notes}`)
  })

  let finalSaveStatus = isAlreadySettled.value ? 'Poprawione' : 'Rozliczone'
  let finalBillingState = isAlreadySettled.value ? 'CORRECTED' : 'SETTLED'
  const finalAmountEuro = Number(globalTotalEur.value).toFixed(2)

  const payload = {
    ticket_id: currentTicketDisplayId.value,
    client: mainClient,
    qp: currentTicket.value?.qp || currentTicket.value?.qp_id || currentTicket.value?.station_id || 'Brak stacji',
    date: mainDate, tech: mainTech, type: mainType,
    items_str: combinedItemsParts.join('\n\n'),
    total_eur: finalAmountEuro,
    status_fixed: mainFixed,
    status_revisit: mainRevisit,
    notes: combinedNotesArr.join('\n\n'),
    rbh: globalRbh, travel: globalTravelEur + ' EUR (Łącznie z wszystkich wizyt)', 
    raw_id: props.ticketId,
    ui_state: null, 
    visits_array: JSON.parse(JSON.stringify(visits.value)), 
    status_rozliczenia: finalSaveStatus,
    ticket_status: finalSaveStatus,
    billing_state: finalBillingState
  }

  emit('save', payload)
  setTimeout(() => { isSaving.value = false }, 1000)
}

const confirmDeleteSettlement = () => {
  if (!confirm("Czy na pewno chcesz CAŁKOWICIE USUNĄĆ to rozliczenie?\n\nWpis zniknie z bazy rozliczeń, a zgłoszenie wróci do statusu 'Nowe'.")) return
  
  isSaving.value = true
  const payload = {
    ticket_id: currentTicketDisplayId.value,
    raw_id: props.ticketId,
    status_rozliczenia: 'Nowe',
    ticket_status: 'Nowe',
    billing_state: 'NEW',
    total_eur: 0, rbh: 0, travel: '0 EUR',
    visits_array: [], items_str: 'Usunięto z rozliczeń.', notes: '',
    client: currentTicket.value?.client, qp: currentTicket.value?.qp,
    tech: '', date: '', type: '', status_fixed: '', status_revisit: '',
    is_deleted: true 
  }
  
  emit('save', payload)
  setTimeout(() => { isSaving.value = false }, 1000)
}
</script>

<style scoped>
.ticket-custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.ticket-custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.ticket-custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.4); border-radius: 10px; }
.ticket-custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(88, 179, 71, 0.8); }
</style>