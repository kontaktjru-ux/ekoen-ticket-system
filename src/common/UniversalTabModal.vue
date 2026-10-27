<template>
  <div v-if="show" class="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn pointer-events-auto" @click.self="$emit('close')">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
      <div class="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
        <h3 class="text-sm font-black text-slate-800 uppercase tracking-widest">{{ isEditing ? 'EDYCJA ZAKŁADKI (FILTRA)' : 'STWÓRZ NOWĄ ZAKŁADKĘ (FILTR)' }}</h3>
        <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600 text-lg">✕</button>
      </div>
      
      <div class="p-6 space-y-5 bg-white overflow-y-auto schedule-custom-scrollbar flex-1">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div class="md:col-span-2">
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">NAZWA ZAKŁADKI NA PASKU *</label>
            <!-- DODANO ref="nameInput" DO AUTO-FOCUSU -->
            <input ref="nameInput" v-model="form.name" type="text" placeholder="Wpisz nazwę filtru" class="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-[#58b347] shadow-sm" />
          </div>
          <div>
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">KOLOR AKCENTU</label>
            <div class="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm">
              <input type="color" v-model="form.color" class="w-8 h-8 rounded-lg border-none bg-transparent cursor-pointer p-0 shrink-0" />
              <input type="text" v-model="form.color" class="w-full border-none text-xs font-mono font-black text-slate-700 uppercase focus:outline-none" />
            </div>
          </div>
        </div>

        <div class="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
          <div class="flex justify-between items-center">
            <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">WYBIERZ IKONĘ FILTRA</label>
            <span class="p-1.5 bg-white border border-slate-200 rounded-lg text-[#58b347]" v-html="decodeBase64Icon(form.iconPreviewBase64)"></span>
          </div>
          <div class="relative flex items-center bg-white border border-slate-200 rounded-xl shadow-sm">
            <svg class="w-4 h-4 text-slate-400 ml-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input type="text" v-model="iconSearchQuery" @input="debounceIconSearch" placeholder="Wpisz po angielsku (np. tool, alert, user)..." class="w-full pl-2 pr-3 py-2 text-xs font-medium text-slate-700 bg-transparent focus:outline-none" />
          </div>
          <div class="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-36 overflow-y-auto schedule-custom-scrollbar p-1">
            <div v-if="isIconSearching" class="col-span-full text-center text-xs font-bold text-slate-400 py-4 uppercase tracking-widest animate-pulse">Wyszukiwanie...</div>
            <div v-for="icon in iconList" :key="icon.name" @click="selectIcon(icon)" :class="form.selectedIconName === icon.name ? 'border-2 border-[#58b347] bg-[#58b347]/10' : 'border border-slate-200 bg-white hover:border-[#58b347]'" class="group p-2 rounded-xl cursor-pointer flex items-center justify-center transition-all" v-html="icon.svg"></div>
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <label class="block text-[10px] font-black uppercase tracking-widest text-[#58b347]">WARUNKI FILTROWANIA DLA ZAKŁADKI (Opcjonalnie)</label>
          <div class="flex flex-col gap-2 w-full animate-fadeIn">
            <div v-for="(q, idx) in searchQueries" :key="q.id" class="flex items-center gap-3 w-full">
              <div class="relative shrink-0 min-w-[100px]">
                <div @click.stop="toggleLogicDropdown(q.id)" :class="getLogicClass(q.logic, idx)" class="rounded-2xl px-3 text-[11px] font-black uppercase tracking-widest flex items-center justify-center h-[40px] cursor-pointer transition-all select-none border">
                  {{ idx === 0 ? 'ZAWIERA' : (q.logic === 'NOT' ? 'WYKLUCZ' : q.logic === 'OR' ? 'LUB' : 'ORAZ') }}
                </div>
                <div v-show="activeDropdownId === q.id && idx !== 0" class="absolute top-full left-0 mt-1.5 w-full bg-white border border-slate-200 rounded-2xl shadow-xl z-[200] overflow-hidden">
                  <div @click.stop="setLogic(q, 'AND')" class="px-3 py-3 flex items-center justify-center text-[10px] font-black text-[#58b347] hover:bg-[#eaf5e9] cursor-pointer border-b border-slate-100">ORAZ</div>
                  <div @click.stop="setLogic(q, 'OR')" class="px-3 py-3 flex items-center justify-center text-[10px] font-black text-slate-500 hover:bg-slate-50 cursor-pointer border-b border-slate-100">LUB</div>
                  <div @click.stop="setLogic(q, 'NOT')" class="px-3 py-3 flex items-center justify-center text-[10px] font-black text-red-500 hover:bg-red-50 cursor-pointer">WYKLUCZ</div>
                </div>
              </div>
              <div class="relative flex-1 flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden focus-within:border-[#58b347] transition-colors h-[40px]">
                <div class="flex items-center justify-center pl-4 w-9 h-full shrink-0 text-slate-400"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></div>
                <input v-model="q.text" type="text" placeholder="Szukaj danych..." class="w-full pl-3 pr-3 py-2 text-xs font-bold text-slate-700 focus:outline-none bg-transparent h-full border-none" />
              </div>
              <button v-if="idx > 0" @click="searchQueries.splice(idx, 1)" class="p-2 text-slate-300 hover:text-slate-500 transition-colors shrink-0 h-[40px] flex items-center justify-center"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>
            </div>
            <button @click="searchQueries.push({ id: 'd_' + Date.now(), logic: 'AND', text: '' })" class="text-[11px] font-black text-slate-500 hover:text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl py-2.5 px-5 w-max flex items-center justify-center gap-2 transition-all mt-1"><svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14"/><path d="M5 12h14"/></svg> Dodaj warunek wyszukiwania</button>
          </div>
        </div>

      </div>

      <div class="p-5 border-t border-slate-200 bg-slate-50/80 shrink-0 flex gap-3">
        <button @click="$emit('close')" class="flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-3.5 rounded-xl text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors shadow-sm">Anuluj</button>
        <button @click="$emit('save', { form, queries: searchQueries })" class="flex-1 bg-[#58b347] text-white font-black py-3.5 rounded-xl text-xs uppercase tracking-widest hover:bg-[#499b3a] transition-all shadow-md shadow-[#58b347]/20">Zapisz zakładkę</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  show: Boolean,
  isEditing: Boolean,
  form: Object,
  searchQueries: Array
})

defineEmits(['close', 'save'])

const nameInput = ref(null)
const activeDropdownId = ref(null)
const iconSearchQuery = ref('')
const isIconSearching = ref(false)
const iconList = ref([])
let searchTimeout = null

// Domyślna ikona (lista zadań/menu), jeśli użytkownik nic nie wybierze
const DEFAULT_ICON = "PHN2ZyBjbGFzcz0idy02IGgtNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGxpbmUgeDE9IjgiIHkxPSI2IiB4Mj0iMjEiIHkyPSI2Ii8+PGxpbmUgeDE9IjgiIHkxPSIxMiIgeDI9IjIxIiB5Mj0iMTIiLz48bGluZSB4MT0iOCIgeTE9IjE4IiB4Mj0iMjEiIHkyPSIxOCIvPjxsaW5lIHgxPSIzIiB5MT0iNiIgeDI9IjMuMDEiIHkyPSI2Ii8+PGxpbmUgeDE9IjMiIHkxPSIxMiIgeDI9IjMuMDEiIHkyPSIxMiIvPjxsaW5lIHgxPSIzIiB5MT0iMTgiIHgyPSIzLjAxIiB5Mj0iMTgiLz48L3N2Zz4="

watch(() => props.show, (isOpen) => {
  if (isOpen) {
    // 1. Zabezpieczenie: jeśli ikona jest pusta (nowy filtr), wstaw domyślną
    if (!props.form.iconPreviewBase64) {
      props.form.iconPreviewBase64 = DEFAULT_ICON
    }

    // 2. Automatyczny focus na pole tekstowe
    nextTick(() => {
      nameInput.value?.focus()
    })
  }
})

const toggleLogicDropdown = (id) => activeDropdownId.value = activeDropdownId.value === id ? null : id
const setLogic = (q, logic) => { q.logic = logic; activeDropdownId.value = null }
const getLogicClass = (logic, idx) => {
  if (idx === 0) return 'bg-[#eaf5e9] text-[#388e3c] border border-[#58b347]/30 pointer-events-none'
  if (logic === 'NOT') return 'bg-[#fef2f2] text-red-500 hover:bg-red-100 border border-red-200'
  if (logic === 'OR') return 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'
  return 'bg-[#eaf5e9] text-[#388e3c] hover:bg-[#dceddb] border border-[#58b347]/30'
}

const decodeBase64Icon = (b64) => {
  if (!b64 || !b64.startsWith('P')) return b64 
  try { return decodeURIComponent(escape(window.atob(b64))).replace('w-6 h-6', 'w-5 h-5') } catch (e) { return "" }
}

const debounceIconSearch = () => {
  const q = iconSearchQuery.value.toLowerCase().trim()
  if (!q) { iconList.value = []; isIconSearching.value = false; return }
  isIconSearching.value = true; clearTimeout(searchTimeout)
  searchTimeout = setTimeout(async () => {
    try {
      const res = await fetch("https://api.iconify.design/search?query=" + q + "&limit=24")
      const data = await res.json()
      if (data.icons && data.icons.length > 0) {
        const promises = data.icons.map(async (iconName) => {
          const parts = iconName.split(":"); const prefix = parts[0]; const name = parts[1]
          const svgRes = await fetch("https://api.iconify.design/" + prefix + "/" + name + ".svg")
          let rawSvg = await svgRes.text()
          let doc = new DOMParser().parseFromString(rawSvg, "image/svg+xml")
          let svgEl = doc.querySelector("svg")
          if (svgEl) {
            svgEl.removeAttribute("width"); svgEl.removeAttribute("height")
            svgEl.setAttribute("class", "w-5 h-5 text-slate-400 group-hover:text-[#58b347] transition-colors")
            svgEl.setAttribute("fill", "currentColor")
            return { name: iconName, svg: svgEl.outerHTML, prefix, rawName: name }
          }
          return null
        })
        const resolved = await Promise.all(promises)
        iconList.value = resolved.filter(Boolean)
      } else { iconList.value = [] }
    } catch (e) { iconList.value = [] } finally { isIconSearching.value = false }
  }, 500)
}

const selectIcon = async (iconObj) => {
  props.form.selectedIconName = iconObj.name
  try {
    const res = await fetch("https://api.iconify.design/" + iconObj.prefix + "/" + iconObj.rawName + ".svg")
    let raw = await res.text()
    let doc = new DOMParser().parseFromString(raw, "image/svg+xml")
    let svgEl = doc.querySelector("svg")
    if (svgEl) {
      svgEl.removeAttribute("width"); svgEl.removeAttribute("height")
      svgEl.setAttribute("class", "w-6 h-6"); svgEl.setAttribute("fill", "currentColor")
      props.form.iconPreviewBase64 = window.btoa(unescape(encodeURIComponent(svgEl.outerHTML)))
    }
  } catch (e) {}
}
</script>