<template>
  <div v-if="show" @click.self="$emit('close')" class="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-3 sm:p-4 animate-fadeIn">
    <div class="bg-white rounded-[24px] shadow-2xl w-full max-w-[1300px] overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] sm:max-h-[94vh] relative">

      <!-- Nagłówek Modala -->
      <div class="px-6 sm:px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 shrink-0">
        <div>
          <h3 class="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
            <svg class="w-5 h-5 text-[#58b347]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.4a1 1 0 0 0 1.4 0l3.7-3.7a1 1 0 0 0 0-1.4l-1.6-1.4a1 1 0 0 0-1.4 0z"/><path d="M11.6 11.6 14.7 6.3"/><path d="M15.8 4.2 11.6 11.6"/><path d="M11.6 11.6 5 21a2 2 0 0 1-2.8-2.8l9.4-6.6"/></svg>
            NOWE ZGŁOSZENIE 
          </h3>
          <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Kreator zadań operacyjnych i serwisowych</p>
        </div>
        <button @click="$emit('close')" class="text-slate-400 hover:text-red-500 transition-colors bg-white border border-slate-200 p-2 rounded-xl shadow-sm">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <!-- Ciało Modala -->
      <div class="flex-1 overflow-y-auto ticket-custom-scrollbar p-6 bg-[#f4f6f8]">
        <div class="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start h-full">

          <!-- LEWA KOLUMNA: FORMULARZ ZGŁOSZENIA -->
          <div class="xl:col-span-3 space-y-5 flex flex-col">
            
            <!-- Kategoria -->
            <div class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
              <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Kategoria Zgłoszenia *</label>
              <div class="flex flex-wrap gap-2">
                <button v-for="cat in ['AWARIA', 'URUCHOMIENIE', 'PRZEGLAD', 'JAKOSC', 'OFERTA']" :key="cat" @click="form.category = cat" type="button" class="px-4 py-2.5 rounded-xl border text-[11px] flex items-center gap-2 transition-all flex-1 justify-center shadow-sm" :class="form.category === cat ? 'font-black bg-[#f0f7f1] border-[#58b347] text-[#58b347]' : 'font-extrabold bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100'">
                  <span>{{ cat }}</span>
                </button>
              </div>
            </div>

            <!-- Dane Stacji i Adres -->
            <div class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
              <h4 class="text-[10px] font-black uppercase tracking-widest text-[#58b347] border-b border-slate-100 pb-2">Informacje o stacji</h4>
              
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div class="sm:col-span-2 relative">
                  <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Stacja (Numer QP) *</label>
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 mt-5">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                  </div>
                  <input type="text" v-model="form.qpId" @input="handleQpInput" placeholder="Wpisz QP, miasto lub klienta..." class="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold font-mono text-slate-800 focus:outline-none focus:border-[#58b347] transition-all"/>
                  
                  <!-- Dropdown z podpowiedziami QP -->
                  <div v-show="qpSuggestions.length > 0" class="absolute z-50 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto top-full mt-2 ticket-custom-scrollbar">
                    <div v-for="s in qpSuggestions" :key="s.id" @click="selectStation(s)" class="p-3 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors">
                      <div class="text-xs font-black text-[#58b347] flex justify-between">{{ s.public_id || s.id }} <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{{ s.city }}</span></div>
                      <div class="text-[10px] text-slate-600 font-bold mt-0.5 truncate">{{ s.client || s.client_id || 'Brak klienta' }}</div>
                      <div class="text-[9px] text-slate-400 font-medium truncate">{{ s.street }} {{ s.street_number }}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Złącze</label>
                  <select v-model="form.evse" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-extrabold text-slate-700 focus:outline-none focus:border-[#58b347]">
                    <option value="ALL">Cała Stacja</option>
                    <option value="CCS1">Złącze 1 (CCS)</option>
                    <option value="CCS2">Złącze 2 (CCS)</option>
                    <option value="AC">Złącze AC (Type 2)</option>
                    <option value="PANTO">Pantograf</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="sm:col-span-2">
                  <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Producent</label>
                  <input type="text" v-model="form.manufacturer" readonly class="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-500 cursor-not-allowed focus:outline-none transition-all" />
                </div>
                <div class="sm:col-span-2">
                  <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Przypisany Technik / Opiekun</label>
                  <input type="text" v-model="form.technician" readonly placeholder="Wybierany automatycznie..." class="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-500 cursor-not-allowed focus:outline-none transition-all" />
                </div>
                <div class="sm:col-span-2">
                  <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Miasto</label>
                  <input type="text" v-model="form.city" placeholder="np. Warszawa" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#58b347] transition-all" />
                </div>
                <div class="sm:col-span-2">
                  <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Ulica i numer</label>
                  <input type="text" v-model="form.street" placeholder="np. Al. Jerozolimskie 123" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#58b347] transition-all" />
                </div>
              </div>
            </div>

            <!-- Zgłoszenie wewnętrzne Toggle -->
            <div class="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <h4 class="text-[11px] font-black uppercase tracking-widest text-slate-700">Zgłoszenie Wewnętrzne</h4>
                <p class="text-[10px] text-slate-500 font-medium">Brak klienta i danych kontaktowych (zadanie własne)</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="form.isInternal" class="sr-only peer">
                <div class="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#58b347]"></div>
              </label>
            </div>

            <!-- Dane Klienta i Kontaktowe -->
            <div class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4 transition-opacity duration-300" :class="form.isInternal ? 'opacity-30 pointer-events-none grayscale' : ''">
               <h4 class="text-[10px] font-black uppercase tracking-widest text-blue-500 border-b border-slate-100 pb-2">Klient i Osoba kontaktowa</h4>
               <div class="grid grid-cols-1 mb-2">
                 <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Nazwa Klienta / Kontrahenta</label>
                 <input type="text" v-model="form.client" placeholder="Wpisz nazwę klienta..." class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-400 transition-all" />
               </div>
               <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Imię i Nazwisko</label>
                    <input type="text" v-model="form.contact_name" placeholder="Imię i nazwisko..." class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-400 transition-all" />
                  </div>
                  <div>
                    <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Telefon kontaktowy</label>
                    <input type="text" v-model="form.contact_phone" placeholder="Numer telefonu..." class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-400 transition-all" />
                  </div>
                  <div>
                    <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Adres E-mail</label>
                    <input type="email" v-model="form.contact_email" placeholder="Adres e-mail..." class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-400 transition-all" />
                  </div>
               </div>
            </div>

            <!-- Tytuł i Opis -->
            <div class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Tytuł Zgłoszenia *</label>
                <input type="text" v-model="form.title" placeholder="Krótki, precyzyjny opis problemu..." class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-[#58b347] transition-all"/>
              </div>
              <div>
                <label class="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Opis Techniczny / Szczegóły usterki</label>
                <textarea v-model="form.description" placeholder="Podaj objawy, kody błędów, opisz sytuację z terenu..." class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#58b347] transition-colors resize-none ticket-custom-scrollbar min-h-[120px]"></textarea>
              </div>
            </div>

            <!-- ZAŁĄCZNIKI -->
            <div class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
              <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 class="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <svg class="w-4 h-4 text-[#58b347]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                  Dokumentacja / Załączniki
                </h4>
              </div>
              
              <div class="flex flex-col gap-3">
                <label class="flex justify-center w-full h-16 px-4 transition bg-slate-50 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer hover:border-[#58b347] hover:bg-[#f0f7f1] items-center gap-3">
                  <span class="flex items-center space-x-2">
                    <svg class="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <span class="text-xs font-bold text-slate-600">Kliknij, aby dodać zdjęcia, logi lub PDF-y</span>
                  </span>
                  <input type="file" class="hidden" multiple accept="image/*,video/*,.pdf,.csv,.txt" @change="handleFiles">
                </label>
                
                <div v-if="attachments.length > 0" class="flex flex-col gap-2 max-h-32 overflow-y-auto ticket-custom-scrollbar">
                  <div v-for="(att, idx) in attachments" :key="idx" class="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-2 shadow-sm">
                    <div class="flex items-center gap-2 min-w-0 pr-2">
                      <svg class="w-4 h-4 text-[#58b347] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                      <span class="text-[11px] font-bold text-slate-700 truncate">{{ att.name }}</span>
                    </div>
                    <button type="button" @click="removeFile(idx)" class="p-1 text-slate-300 hover:text-red-500 transition-colors shrink-0">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- PRAWA KOLUMNA: HISTORIA STACJI -->
          <div class="xl:col-span-2 flex flex-col h-[700px] xl:h-full bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div class="p-4 border-b border-slate-100 bg-slate-50 shrink-0">
              <h4 class="text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-2">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
                Historia zgłoszeń dla stacji
              </h4>
            </div>
            
            <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-3 ticket-custom-scrollbar">
              <div v-if="stationHistory.length === 0" class="flex flex-col items-center justify-center text-center py-12 opacity-60">
                <svg class="w-12 h-12 text-slate-300 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                <span class="text-[11px] font-black uppercase tracking-widest text-slate-400">Wpisz kod QP stacji obok, <br>aby załadować historię.</span>
              </div>
              <div v-else v-for="ht in stationHistory" :key="ht.id" class="border rounded-2xl overflow-hidden transition-all border-slate-200">
                  <div class="w-full px-4 py-3.5 flex items-start justify-between bg-slate-50 transition-colors text-left">
                      <div class="flex flex-col min-w-0 pr-3">
                          <span class="text-[9px] font-black uppercase tracking-widest mb-1 text-slate-500">{{ ht.ticket_code || ht.ticket_number || ht.id }}</span>
                          <span class="text-[11px] font-bold text-slate-800 truncate leading-tight">{{ ht.title || ht.subject || 'Zgłoszenie operacyjne' }}</span>
                      </div>
                  </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- Stopka Modala -->
      <div class="p-5 border-t border-slate-200 bg-white shrink-0 flex items-center justify-between rounded-b-[24px]">
        <div class="text-[11px] font-bold text-slate-400">* Pola wymagane</div>
        <div class="flex gap-3">
          <button @click="$emit('close')" class="bg-slate-50 border border-slate-200 text-slate-600 font-extrabold py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors shadow-sm">Anuluj</button>
          <button @click="submit" class="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#58b347] hover:bg-[#499b3a] text-white text-xs font-black uppercase tracking-widest shadow-md shadow-[#58b347]/20 transition-all focus:ring-2 focus:ring-offset-2 focus:ring-[#58b347]">
            <span>UTWÓRZ ZGŁOSZENIE</span>
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useTicketsStore } from '../stores/useTicketsStore'

const props = defineProps({
  show: Boolean,
  prefilledQp: String
})

const emit = defineEmits(['close', 'save'])
const store = useTicketsStore()

const defaultForm = () => ({
  category: 'AWARIA',
  qpId: '',
  evse: 'ALL',
  manufacturer: 'EKOENERGETYKA',
  technician: '',
  city: '',
  street: '',
  zip: '',
  isInternal: false,
  client: '',
  contact_name: '',
  contact_phone: '',
  contact_email: '',
  title: '',
  description: ''
})

const form = ref(defaultForm())
const attachments = ref([])
const qpSuggestions = ref([])
const stationHistory = ref([])

watch(() => props.show, (isOpen) => {
  if (isOpen) {
    form.value = defaultForm()
    attachments.value = []
    stationHistory.value = []
    if (props.prefilledQp) {
      form.value.qpId = props.prefilledQp
      handleQpInput()
    }
  }
})

const handleQpInput = () => {
  const val = form.value.qpId.toUpperCase()
  if (val.length < 2) {
    qpSuggestions.value = []
    return
  }
  qpSuggestions.value = store.stations.filter(s => 
    (s.public_id && s.public_id.toUpperCase().includes(val)) ||
    (s.id && s.id.toUpperCase().includes(val)) ||
    (s.client && s.client.toUpperCase().includes(val)) ||
    (s.city && s.city.toUpperCase().includes(val))
  ).slice(0, 10)
}

const selectStation = (s) => {
  form.value.qpId = s.public_id || s.id
  form.value.client = s.client || s.client_id || ''
  form.value.city = s.city || ''
  form.value.street = `${s.street || ''} ${s.street_number || ''}`.trim()
  form.value.zip = s.postcode || s.zip || ''
  form.value.technician = s.technician_id || ''
  
  qpSuggestions.value = []
  
  stationHistory.value = store.tickets.filter(t => {
     let t_qp = (t.qp_id || '').toUpperCase()
     let t_full = (t.qp_id_full || t.station_id || '').toUpperCase()
     return t_qp.includes(form.value.qpId) || t_full.includes(form.value.qpId)
  }).sort((a,b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
}

const handleFiles = (event) => {
  const files = event.target.files
  if (!files || files.length === 0) return
  const MAX_FILE_SIZE = 15 * 1024 * 1024

  Array.from(files).forEach(file => {
    if (file.size > MAX_FILE_SIZE) {
      alert(`Plik ${file.name} jest za duży! (Maksymalnie 15 MB)`)
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64Data = e.target.result.split(',')[1]
      attachments.value.push({
        name: file.name,
        mimeType: file.type,
        data: base64Data
      })
    }
    reader.readAsDataURL(file)
  })
  event.target.value = ''
}

const removeFile = (idx) => {
  attachments.value.splice(idx, 1)
}

const submit = () => {
  if (!form.value.qpId) return alert('Wpisz stację (QP)!')
  if (!form.value.title) return alert('Wpisz tytuł zgłoszenia!')

  const payload = {
    ...form.value,
    status: 'Nowe',
    ticket_status: 'Nowe',
    qp_id: form.value.qpId,
    client: form.value.isInternal ? 'ZGŁOSZENIE WEWNĘTRZNE' : form.value.client,
    attachments: attachments.value
  }
  
  emit('save', payload)
}
</script>

<style scoped>
.ticket-custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.ticket-custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.ticket-custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.4); border-radius: 10px; }
.ticket-custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(88, 179, 71, 0.8); }
</style>