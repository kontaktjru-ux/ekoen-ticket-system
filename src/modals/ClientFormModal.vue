<template>
  <div 
    v-if="show" 
    class="fixed inset-0 z-[3000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn"
    @click.self="$emit('close')"
  >
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
      
      <!-- Nagłówek -->
      <div class="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
        <h3 class="text-sm font-black text-slate-800 uppercase tracking-widest">
          {{ form.id ? 'EDYTUJ KLIENTA' : 'DODAJ NOWEGO KLIENTA' }}
        </h3>
        <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600 text-lg transition-colors">✕</button>
      </div>

      <!-- Formularz -->
      <div class="p-6 space-y-5 bg-white overflow-y-auto client-custom-scrollbar flex-1">
        <div>
          <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">NAZWA FIRMY / KLIENTA *</label>
          <input 
            v-model="form.name" 
            ref="nameInput"
            type="text" 
            class="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-[#58b347] shadow-sm" 
            placeholder="Np. ORLEN S.A." 
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">OSOBA KONTAKTOWA</label>
            <input 
              v-model="form.contact_person" 
              type="text" 
              class="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-[#58b347] shadow-sm" 
              placeholder="Jan Kowalski" 
            />
          </div>
          <div>
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">TELEFON</label>
            <input 
              v-model="form.phone" 
              type="text" 
              class="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-[#58b347] shadow-sm" 
              placeholder="+48 ..." 
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">E-MAIL</label>
            <input 
              v-model="form.email" 
              type="email" 
              class="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-[#58b347] shadow-sm" 
              placeholder="kontakt@firma.pl" 
            />
          </div>
          <div>
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">SLA (GODZINY REAKCJI)</label>
            <input 
              v-model="form.sla_hours" 
              type="text" 
              class="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-[#58b347] shadow-sm" 
              placeholder="Np. 24H" 
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">ABONAMENT (MRR PLN)</label>
            <input 
              v-model="form.mrr" 
              type="number" 
              class="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-[#58b347] shadow-sm" 
              placeholder="0" 
            />
          </div>
          <div>
            <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">KOLOR ZNACZNIKA</label>
            <div class="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm h-[46px]">
              <input 
                v-model="form.color_hex" 
                type="color" 
                class="w-8 h-8 rounded-lg border-none bg-transparent cursor-pointer p-0 shrink-0" 
              />
              <span class="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-2">
                {{ form.color_hex }}
              </span>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">NOTATKI / UWAGI</label>
          <textarea 
            v-model="form.notes" 
            rows="3" 
            class="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-[#58b347] shadow-sm client-custom-scrollbar" 
            placeholder="Dodatkowe informacje o kliencie..."
          ></textarea>
        </div>
      </div>

      <!-- Stopka / Akcje -->
      <div class="p-5 border-t border-slate-200 bg-slate-50/80 shrink-0 flex gap-3">
        <button 
          @click="$emit('close')" 
          type="button"
          class="flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-3.5 rounded-xl text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors shadow-sm"
        >
          Anuluj
        </button>
        <button 
          @click="submit" 
          type="button"
          class="flex-1 bg-[#58b347] text-white font-black py-3.5 rounded-xl text-xs uppercase tracking-widest hover:bg-[#499b3a] transition-all shadow-md shadow-[#58b347]/20"
        >
          Zapisz Klienta
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  show: Boolean,
  clientData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'save'])
const nameInput = ref(null)

const defaultForm = () => ({
  id: '',
  name: '',
  contact_person: '',
  phone: '',
  email: '',
  sla_hours: '48H',
  mrr: 0,
  color_hex: '#58b347',
  notes: ''
})

const form = ref(defaultForm())

watch(() => props.show, (isOpen) => {
  if (isOpen) {
    if (props.clientData) {
      form.value = {
        id: props.clientData.id || '',
        name: props.clientData.name || '',
        contact_person: props.clientData.contact_person || props.clientData.contactPerson || '',
        phone: props.clientData.phone || '',
        email: props.clientData.email || '',
        sla_hours: props.clientData.sla_hours || props.clientData.sla || '48H',
        mrr: props.clientData.mrr || 0,
        color_hex: props.clientData.color_hex || props.clientData.color || '#58b347',
        notes: props.clientData.notes || ''
      }
    } else {
      form.value = defaultForm()
    }

    nextTick(() => {
      nameInput.value?.focus()
    })
  }
})

const submit = () => {
  if (!form.value.name.trim()) {
    alert('Podaj nazwę klienta!')
    return
  }
  emit('save', { ...form.value })
}
</script>