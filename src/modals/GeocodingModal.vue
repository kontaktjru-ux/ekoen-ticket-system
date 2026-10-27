<template>
  <div v-if="show" class="fixed inset-0 z-[400] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
    <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 flex flex-col">
      <div class="bg-[#1e293b] px-6 py-5 text-white flex justify-between items-center">
        <h3 class="font-black text-sm uppercase tracking-widest flex items-center gap-2">
          <svg class="w-5 h-5 text-[#58b347]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="m16.2 7.8-2 6.3-6.4 2.1 2-6.3z"/></svg>
          MODUŁ GEOKODOWANIA
        </h3>
        <button @click="$emit('close')" class="text-slate-400 hover:text-white text-lg transition-colors">✕</button>
      </div>
      <div class="p-6 space-y-6 bg-white">
        <div class="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3">
          <p class="text-xs text-slate-600 font-medium leading-relaxed">System zlokalizuje adres (ulica + miasto) w bazie OpenStreetMap i trwale przypisze nowe współrzędne GPS do poniższych stacji.</p>
          <ul class="text-xs font-bold text-slate-700 space-y-1.5">
            <li>• Wszystkie braki w systemie: <span class="font-black text-slate-900">{{ totalCount }} stacji</span></li>
            <li>• Tylko wybrane w tabeli: <span class="font-black text-slate-900">{{ selectedCount }} stacji</span></li>
          </ul>
        </div>
        <div class="flex flex-col gap-3">
          <div class="grid grid-cols-2 gap-3">
            <button @click="$emit('close')" class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-colors">Zamknij</button>
            <button @click="$emit('scan', 'selected')" :disabled="selectedCount === 0" class="bg-[#a5c2f7] hover:bg-blue-400 text-white font-bold py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">Skanuj zaznaczone</button>
          </div>
          <button @click="$emit('scan', 'all')" :disabled="totalCount === 0" class="w-full bg-[#f97316] hover:bg-orange-600 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-md shadow-orange-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed">Skanuj wszystkie braki</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  show: Boolean,
  selectedCount: Number,
  totalCount: Number
})
defineEmits(['close', 'scan'])
</script>