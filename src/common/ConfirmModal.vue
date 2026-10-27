<template>
  <div v-if="show" class="fixed inset-0 z-[20000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn transition-opacity duration-300 pointer-events-auto">
    <div class="bg-white rounded-[20px] shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 flex flex-col">
      <div class="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
        <svg class="w-6 h-6 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="none"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 9v4" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="17.5" r="1.5" fill="currentColor"/></svg>
        <h3 class="text-[13px] font-black text-slate-800 uppercase tracking-widest">Wymagane potwierdzenie</h3>
      </div>
      <div class="p-6 text-sm text-slate-600 font-medium leading-relaxed bg-slate-50/50">
        <p>{{ message }}</p>
      </div>
      <div class="p-5 border-t border-slate-100 bg-white flex justify-center gap-3">
        <button @click="$emit('cancel')" class="bg-white border border-slate-200 text-slate-600 font-extrabold py-3 px-6 rounded-xl text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors">Anuluj</button>
        <button @click="$emit('confirm')" class="bg-[#ef4444] text-white font-black py-3 px-6 rounded-xl text-xs uppercase tracking-widest hover:bg-red-600 transition-colors shadow-sm">Zatwierdź</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({ show: Boolean, message: String })
defineEmits(['cancel', 'confirm'])
</script>