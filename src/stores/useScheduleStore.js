import { defineStore } from 'pinia'
import { shallowRef, ref } from 'vue'

const ICONS = {
  list: "PHN2ZyBjbGFzcz0idy02IGgtNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGxpbmUgeDE9IjgiIHkxPSI2IiB4Mj0iMjEiIHkyPSI2Ii8+PGxpbmUgeDE9IjgiIHkxPSIxMiIgeDI9IjIxIiB5Mj0iMTIiLz48bGluZSB4MT0iOCIgeTE9IjE4IiB4Mj0iMjEiIHkyPSIxOCIvPjxsaW5lIHgxPSIzIiB5MT0iNiIgeDI9IjMuMDEiIHkyPSI2Ii8+PGxpbmUgeDE9IjMiIHkxPSIxMiIgeDI9IjMuMDEiIHkyPSIxMiIvPjxsaW5lIHgxPSIzIiB5MT0iMTgiIHgyPSIzLjAxIiB5Mj0iMTgiLz48L3N2Zz4=",
  alert: "PHN2ZyBjbGFzcz0idy02IGgtNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0ibTIxLjczIDE4LTgtMTRhMiAyIDAgMCAwLTMuNDggMGwtOCAxNEEyIDIgMCAwIDAgNCAyMWgxNmEyIDIgMCAwIDAgMS43My0zWiIvPjxsaW5lIHgxPSIxMiIgeTE9IjkiIHgyPSIxMiIgeTI9IjEzIi8+PGxpbmUgeDE9IjEyIiB5MT0iMTciIHgyPSIxMi4wMSIgeTI9IjE3Ii8+PC9zdmc+",
  calendar: "PHN2ZyBjbGFzcz0idy02IGgtNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHJlY3QgeD0iMyIgeT0iNCIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIgcnk9IjIiLz48bGluZSB4MT0iMTYiIHkxPSIyIiB4Mj0iMTYiIHkyPSI2Ii8+PGxpbmUgeDE9IjgiIHkxPSIyIiB4Mj0iOCIgeTI9IjYiLz48bGluZSB4MT0iMyIgeTE9IjEwIiB4Mj0iMjEiIHkyPSIxMCIvPjwvc3ZnPg=="
}

const defaultTabs = [
  { id: "ALL", name: "WSZYSTKIE", filter: "ALL", color: "#58b347", icon: ICONS.list, customQueries: [] },
  { id: "URGENT", name: "PILNE SLA (< 24H)", filter: "URGENT", color: "#ef4444", icon: ICONS.alert, customQueries: [] },
  { id: "TODAY", name: "NA DZIŚ", filter: "TODAY", color: "#3b82f6", icon: ICONS.calendar, customQueries: [] }
]

export const useScheduleStore = defineStore('schedule', () => {
  const tickets = shallowRef([])
  const events = shallowRef([])
  const techList = shallowRef([])
  
  const isLoading = ref(false)
  const error = ref(null)

  const activeTabId = ref("ALL")
  const kpiTabs = ref([...defaultTabs])
  const searchQueriesMain = ref([{ id: "m_" + Date.now(), logic: "AND", text: "" }])
  const selectedTechId = ref("ALL")
  const currentView = ref("week")

  const saveTabsConfiguration = () => {
    const configToSave = JSON.parse(JSON.stringify(kpiTabs.value))
    localStorage.setItem('ekoen_schedule_tabs', JSON.stringify(configToSave))
    if (typeof google !== 'undefined' && google.script) {
      google.script.run.saveUserSettings('CURRENT_USER', { scheduleTabs: configToSave })
    }
  }

  const loadTabsConfiguration = () => {
    const saved = localStorage.getItem('ekoen_schedule_tabs')
    if (saved) {
      try { kpiTabs.value = JSON.parse(saved) } catch (e) {}
    }
  }
  loadTabsConfiguration()

  // --- FUNKCJA TRANSFORMUJĄCA DANE ---
  const extractTicketData = (t) => {
    if (!t) return null
    try {
      let t_id='', t_code='', t_qp_full='', t_title='', t_desc='', t_type='', t_status='', t_created='', t_techRaw='', t_category='', t_client=''
      let t_city = '', t_street = '', t_post = ''
      let status_g = '', status_v = ''
      
      if (Array.isArray(t)) {
        t_id = String(t[0] || '').trim(); if(!t_id || t_id.toLowerCase() === 'id') return null; 
        t_code = String(t[0] || '').trim(); t_qp_full = String(t[1] || '').trim(); t_title = String(t[2] || 'Brak tytułu'); t_type = String(t[4] || 'Zgłoszenie'); t_category = String(t[5] || ''); status_g = String(t[6] || '').trim(); 
        t_street = String(t[13] || '').trim(); t_post = String(t[14] || '').trim(); t_city = String(t[15] || '').trim(); 
        status_v = String(t[21] || '').trim(); 
        t_desc = String(t[8] || ''); t_techRaw = String(t[12] || '').trim(); t_created = String(t[16] || new Date().toISOString()); 
      } else {
        t_id = String(t.id || t.ID || t.ticket_id || '').trim(); if(!t_id || t_id.toLowerCase() === 'id') return null;
        t_code = String(t.ticket_number || t.ticket_code || t.id || '')
        t_qp_full = String(t.station_id || t['Numer QP'] || t.qp_id || t.QP || '').trim()
        t_title = String(t.subject || t['Tytuł'] || t.title || 'Brak tytułu')
        t_desc = String(t.description || t['Opis'] || '')
        t_category = String(t.priority || t['Kategoria'] || t.category || '')
        status_g = String(t.status || t.Status || t['Status'] || '').trim()
        status_v = String(t.ticket_status || t['Status Zlecenia'] || t.status_zlecenia || '').trim()
        t_street = String(t.street || t['Adres'] || t.address || t.Ulica || '').trim()
        t_post = String(t.zip || t['Kod pocztowy'] || t.postcode || t.Kod || '').trim()
        t_city = String(t.city || t['Miasto'] || '').trim()
        t_type = String(t.ticket_type || t['Typ serwisu'] || 'Zgłoszenie')
        t_created = String(t.created_at || t['Utworzono'] || new Date().toISOString())
        t_techRaw = String(t.technician_id || t['Przypisany technik'] || t.Technician || t.technician || '').trim()
        t_client = (t.client || t['Klient'] || '')
      }
      
      if(!t_code) t_code = t_id
      const st_check = (status_g + ' ' + status_v).toLowerCase()
      let t_is_closed = false
      if (st_check.includes('ticket_closed') || st_check.includes('cancelled') || st_check.includes('zakończ') || st_check.includes('anulow') || st_check.includes('closed') || st_check.includes('zamknięt') || st_check.includes('wykonano') || st_check.includes('rozliczone')) {
        t_is_closed = true
      }
      let final_status = status_v
      if (!final_status || final_status.toLowerCase() === 'undefined' || final_status.toLowerCase() === 'null') final_status = status_g
      if (!final_status || final_status.toLowerCase() === 'undefined' || final_status.toLowerCase() === 'null') final_status = ''
      t_status = final_status ? final_status : 'BRAK STATUSU ZLECENIA'

      const dashIdx = t_qp_full.indexOf('-', t_qp_full.indexOf('-') + 1)
      const t_qp = dashIdx !== -1 ? t_qp_full.substring(0, dashIdx) : t_qp_full
      if (t_city.toLowerCase() === 'undefined' || t_city.toLowerCase() === 'null') t_city = ''
      if (t_street.toLowerCase() === 'undefined' || t_street.toLowerCase() === 'null') t_street = ''
      if (t_post.toLowerCase() === 'undefined' || t_post.toLowerCase() === 'null') t_post = ''
      
      let addrParts = []
      if (t_city) addrParts.push(t_city); if (t_street) addrParts.push(t_street); if (t_post) addrParts.push(t_post)
      let finalAddressString = addrParts.length > 0 ? addrParts.join(', ') : 'Brak lokalizacji'
      
      const tech = techList.value.find(techObj => techObj.id === t_techRaw || techObj.name === t_techRaw)
      const actualTechId = tech ? tech.id : ''
      const techColor = tech ? (tech.zone_color || tech.color) : '#cbd5e1'
      const techName = tech ? tech.name : (t_techRaw || 'BRAK PRZYPISANIA')

      let parsedDate = new Date(t_created)
      if(isNaN(parsedDate.getTime())) parsedDate = new Date() 
      const slaLeft = Math.round(((parsedDate.getTime() + (48 * 3600000)) - Date.now()) / 3600000)
      const searchStr = [t_code, t_qp, t_title, t_desc, t_type, t_status, finalAddressString, t_client].join(' ').toLowerCase()

      return { t_id, t_code, t_qp, t_title, t_desc, t_address: finalAddressString, t_client, t_category, t_type, t_status, t_created, actualTechId, techColor, techName, slaLeft, searchStr, t_is_closed }
    } catch (err) { return null }
  }

  const fetchScheduleData = () => {
    if (isLoading.value) return
    isLoading.value = true
    error.value = null

    if (typeof google !== 'undefined' && google.script) {
      google.script.run
        .withSuccessHandler((response) => {
          try {
            const res = typeof response === 'string' ? JSON.parse(response) : response
            if (res && res.success !== false) {
              events.value = Array.isArray(res.events) ? res.events.map(ev => {
                // Mapowanie zdarzeń (obsługa formatu tablicowego z GAS)
                if (Array.isArray(ev)) {
                   if(String(ev[0]||'').toLowerCase() === 'id') return null
                   return { id: String(ev[0]||''), ticket_id: String(ev[1]||''), technician_id: String(ev[2]||''), title: String(ev[3]||''), start_time: String(ev[4]||''), end_time: String(ev[5]||''), event_type: String(ev[6]||''), created_at: String(ev[7]||'') }
                } else {
                   if(String(ev.id||'').toLowerCase() === 'id') return null
                   return { id: String(ev.id||ev.ID||''), ticket_id: String(ev.ticket_id||''), technician_id: String(ev.technician_id||''), title: String(ev.title||''), start_time: String(ev.start_time||''), end_time: String(ev.end_time||''), event_type: String(ev.event_type||''), created_at: String(ev.created_at||'') }
                }
              }).filter(Boolean) : []

              techList.value = Array.isArray(res.technicians) ? res.technicians : []
              
              // Tutaj używamy przywróconej funkcji!
              const rawTickets = Array.isArray(res.tickets) ? res.tickets : []
              tickets.value = rawTickets.map(extractTicketData).filter(Boolean)
            }
          } catch(e) {
            error.value = "Błąd parsowania danych kalendarza."
          } finally {
            isLoading.value = false
          }
        })
        .withFailureHandler((err) => {
          error.value = err.message
          isLoading.value = false
        })
        .getScheduleData()
    } else {
      console.warn("Brak środowiska Google. Ładowanie pustego harmonogramu.")
      isLoading.value = false
    }
  }

  const saveEventToCloud = (eventPayload) => {
    const isEdit = events.value.some(e => String(e.id) === String(eventPayload.id))
    if (isEdit) {
      events.value = events.value.map(e => String(e.id) === String(eventPayload.id) ? { ...e, ...eventPayload } : e)
    } else {
      events.value = [...events.value, eventPayload]
    }
    if (typeof google !== 'undefined' && google.script) {
      google.script.run.saveCalendarEvent(eventPayload)
    }
  }

  const deleteEventFromCloud = (eventId) => {
    events.value = events.value.filter(e => String(e.id) !== String(eventId))
    if (typeof google !== 'undefined' && google.script) {
      google.script.run.deleteCalendarEvent(eventId)
    }
  }

  return {
    tickets, events, techList, isLoading, error,
    activeTabId, kpiTabs, searchQueriesMain, selectedTechId, currentView,
    fetchScheduleData, saveTabsConfiguration, saveEventToCloud, deleteEventFromCloud
  }
})