<template>
  <div v-if="show" class="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn" @click.self="$emit('close')">
    <div class="bg-white rounded-[20px] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 flex flex-col transform scale-100 transition-transform duration-300">
      
      <!-- NAGŁÓWEK -->
      <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
        <h3 class="text-[13px] font-black text-slate-800 uppercase tracking-widest">
          {{ isEditMode ? 'EDYCJA DANYCH PRACOWNIKA' : 'REJESTRACJA NOWEGO PRACOWNIKA' }}
        </h3>
        <button @click="$emit('close')" class="text-slate-400 hover:text-slate-700 transition-colors">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>

      <!-- FORMULARZ -->
      <div class="p-6 bg-white overflow-y-auto custom-scrollbar max-h-[80vh] flex-1">
        <div class="grid grid-cols-2 gap-5">
          
          <!-- IMIĘ I NAZWISKO -->
          <div class="col-span-2">
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">IMIĘ I NAZWISKO *</label>
            <input v-model="form.name" ref="nameInput" type="text" placeholder="np. Jan Kowalski" class="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-[#58b347] focus:ring-1 focus:ring-[#58b347]/30 transition-all shadow-sm placeholder-slate-400" />
          </div>

          <!-- KOLOR OPERACYJNY -->
          <div class="col-span-2 sm:col-span-1">
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">KOLOR OPERACYJNY</label>
            <div class="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm h-[46px]">
              <input type="color" v-model="form.zone_color" class="w-8 h-8 rounded border-none bg-transparent cursor-pointer p-0 shrink-0" />
              <span class="text-xs font-mono font-black text-slate-600 uppercase">{{ form.zone_color.toUpperCase() }}</span>
            </div>
          </div>

          <!-- KLAWISZ SKRÓTU -->
          <div class="col-span-2 sm:col-span-1">
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">KLAWISZ SKRÓTU</label>
            <div class="relative flex items-center bg-white border border-slate-200 rounded-xl shadow-sm focus-within:border-[#58b347] focus-within:ring-1 focus-within:ring-[#58b347]/30 transition-all h-[46px] overflow-hidden">
              <div class="pl-3 pr-2 text-slate-400 pointer-events-none">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" ry="2"/><path d="M6 8h.001"/><path d="M10 8h.001"/><path d="M14 8h.001"/><path d="M18 8h.001"/><path d="M8 12h.001"/><path d="M12 12h.001"/><path d="M16 12h.001"/><path d="M7 16h10"/></svg>
              </div>
              <input type="text" :value="form.shortcut_key" readonly placeholder="KLIKNIJ BY USTAWIĆ." @focus="onShortcutFocus" @blur="onShortcutBlur" @keydown="onShortcutKeydown" class="w-full pr-3 py-3 text-xs font-mono font-black text-slate-600 uppercase bg-transparent border-none focus:outline-none placeholder-slate-400 cursor-pointer" />
              <button v-if="form.shortcut_key" @click="form.shortcut_key = ''" type="button" class="absolute right-3 text-slate-400 hover:text-red-500 font-bold text-lg leading-none">&times;</button>
            </div>
          </div>

          <!-- NUMER TELEFONU -->
          <div class="col-span-2">
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">NUMER TELEFONU</label>
            <input v-model="form.phone" type="tel" placeholder="+48..." class="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono font-bold text-slate-700 focus:outline-none focus:border-[#58b347] focus:ring-1 focus:ring-[#58b347]/30 transition-all shadow-sm placeholder-slate-400 tracking-wider" />
          </div>

          <!-- POJAZDY -->
          <div class="col-span-2">
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">POJAZDY (Z BAZY LOGISTYCZNEJ)</label>
            <input v-model="form.car_plate" type="text" placeholder="WPISZ NR I WCIŚNIJ PRZECINEK LUB PODWÓJNĄ SPACJĘ..." class="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-mono font-bold text-slate-700 focus:outline-none focus:border-[#58b347] focus:ring-1 focus:ring-[#58b347]/30 transition-all shadow-sm placeholder-slate-400 uppercase" />
          </div>

          <!-- WAŻNOŚĆ SEP -->
          <div class="col-span-2 sm:col-span-1">
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">WAŻNOŚĆ SEP</label>
            <input v-model="form.sep_expiry" type="date" class="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-[#58b347] focus:ring-1 focus:ring-[#58b347]/30 transition-all shadow-sm cursor-pointer" />
          </div>

          <!-- KONIEC UMOWY -->
          <div class="col-span-2 sm:col-span-1">
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">KONIEC UMOWY</label>
            <input v-model="form.contract_expiry" type="date" class="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-[#58b347] focus:ring-1 focus:ring-[#58b347]/30 transition-all shadow-sm cursor-pointer" />
          </div>

        </div>
      </div>
      
      <!-- STOPKA / PRZYCISKI AKCJI -->
      <div class="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center gap-3 shrink-0">
        
        <button @click="submit" :disabled="isSaving" type="button" class="flex-1 bg-[#58b347] border border-[#499b3a] text-white font-black uppercase tracking-widest py-3.5 rounded-xl text-xs hover:bg-[#499b3a] transition-all shadow-md shadow-[#58b347]/20 disabled:opacity-50">
          {{ isSaving ? 'ZAPISYWANIE...' : (isEditMode ? 'ZATWIERDŹ MODYFIKACJE' : 'ZAREJESTRUJ PRACOWNIKA') }}
        </button>

        <button v-if="isEditMode" @click="confirmDelete" type="button" class="bg-white text-red-500 border border-red-200 hover:bg-red-50 hover:border-red-300 w-[46px] h-[46px] rounded-xl transition-all shadow-sm flex items-center justify-center shrink-0" title="Usuń pracownika">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps({
  show: Boolean,
  techData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'save', 'delete'])

const isSaving = ref(false)
const nameInput = ref(null)

const getDefaultForm = () => ({
  id: '',
  name: '',
  zone_color: '#58b347',
  shortcut_key: '',
  phone: '',
  car_plate: '',
  car_category: 'Osobowy',
  sep_expiry: '',
  contract_expiry: ''
})

const form = ref(getDefaultForm())

const isEditMode = computed(() => !!form.value.id)

// Helper do formatowania dat na YYYY-MM-DD (obsługiwane przez input="date")
const formatDateForInput = (dStr) => {
  if (!dStr) return ''
  try {
    const d = new Date(dStr)
    if (isNaN(d.getTime())) return ''
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${d.getFullYear()}-${mm}-${dd}`
  } catch (e) {
    return ''
  }
}

watch(() => props.show, (isOpen) => {
  if (isOpen) {
    isSaving.value = false
    if (props.techData) {
      form.value = {
        id: props.techData.id || '',
        name: props.techData.name || '',
        zone_color: props.techData.zone_color || props.techData.color || '#58b347',
        shortcut_key: props.techData.shortcut_key || '',
        phone: props.techData.phone || '',
        car_plate: props.techData.car_plate || '',
        car_category: props.techData.car_category || 'Osobowy',
        sep_expiry: formatDateForInput(props.techData.sep_expiry),
        contract_expiry: formatDateForInput(props.techData.contract_expiry)
      }
    } else {
      form.value = getDefaultForm()
    }

    nextTick(() => {
      if (nameInput.value) nameInput.value.focus()
    })
  }
})

// === LOGIKA KLAWISZA SKRÓTU ===
const onShortcutFocus = (e) => {
  if (!form.value.shortcut_key) {
    e.target.value = 'WCIŚNIJ KOMBINACJĘ...'
  }
}

const onShortcutBlur = (e) => {
  if (e.target.value === 'WCIŚNIJ KOMBINACJĘ...') {
    e.target.value = ''
  }
}

const onShortcutKeydown = (e) => {
  e.preventDefault()
  e.stopPropagation()

  const { key, ctrlKey, altKey, shiftKey, metaKey } = e
  if (['Control', 'Shift', 'Alt', 'Meta', 'Dead', 'CapsLock', 'Tab'].includes(key)) return

  if (key === 'Escape') {
    e.target.blur()
    return
  }

  if (key === 'Backspace' || key === 'Delete') {
    form.value.shortcut_key = ''
    e.target.blur()
    return
  }

  const keys = []
  if (ctrlKey || metaKey) keys.push('Ctrl')
  if (altKey) keys.push('Alt')
  if (shiftKey) keys.push('Shift')

  let displayKey = key.length === 1 ? key.toUpperCase() : key
  if (displayKey === ' ') displayKey = 'Space'

  keys.push(displayKey)
  form.value.shortcut_key = keys.join('+').toUpperCase()
  e.target.blur()
}

// === AKCJE ===
const submit = () => {
  if (!form.value.name.trim()) {
    alert("Podaj imię i nazwisko pracownika.")
    return
  }
  isSaving.value = true
  emit('save', { ...form.value })
  
  // Bezpieczne odbezpieczenie przycisku po 1 sekundzie by nie było widać migotania modala przy cichym zamykaniu
  setTimeout(() => {
    isSaving.value = false
  }, 1000)
}

const confirmDelete = () => {
  emit('delete', form.value.id)
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.4); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(88, 179, 71, 0.8); }
</style>