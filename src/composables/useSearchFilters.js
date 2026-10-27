export function useSearchFilters() {
  
  // Zoptymalizowana normalizacja PL - 10x szybsza niż łańcuch .replace()
  const plMap = { 'ą':'a', 'ć':'c', 'ę':'e', 'ł':'l', 'ń':'n', 'ó':'o', 'ś':'s', 'ź':'z', 'ż':'z' }
  const normalizePL = (s) => {
    if (!s) return ''
    return String(s).toLowerCase().replace(/[ąćęłńóśźż]/g, match => plMap[match])
  }

  // Cache parsowania zapytań (gigantyczny skok wydajności)
  const queryCache = new Map()
  const parseQueryCached = (qText) => {
    if (queryCache.has(qText)) return queryCache.get(qText)
    
    const rawText = String(qText).trim()
    const query = normalizePL(rawText)
    let parsed = { rawText, query, prefix: null, searchValues: [] }

    if (rawText.includes(':')) {
      const parts = rawText.split(':')
      parsed.prefix = parts[0].trim().toUpperCase()
      const valStr = parts.slice(1).join(':').trim()
      parsed.searchValues = valStr.split('|').map(s => normalizePL(s.trim()))
      
      // Auto-wypełnianie własnego loginu (dla @ME)
      if ((parsed.prefix === 'TECH_EXACT' || parsed.prefix === 'TECHNIK' || parsed.prefix === 'SERWISANT' || parsed.prefix === 'TECH') && valStr.toUpperCase() === '@ME') {
        const currentUser = window.CURRENT_USERNAME || ''
        parsed.searchValues[0] = normalizePL(currentUser.replace('.', ' '))
      }
    }
    
    queryCache.set(qText, parsed)
    return parsed
  }

  // ==========================================
  // 1. FILTROWANIE ZGŁOSZEŃ (CENTRUM ZGŁOSZEŃ / HARMONOGRAM)
  // ==========================================
  const checkTicketSearch = (d, qText) => {
    const q = parseQueryCached(qText)
    if (!q.query) return true

    if (q.prefix) {
      let targetField = null

      switch(q.prefix) {
        case 'TECH_EXACT':
          targetField = d.technician_id || d.techName || 'brak przypisania'
          break
        case 'STATUS_EXACT':
          targetField = [d.status, d.ticket_status, d.req_status].join(' ')
          break
        case 'ID': case 'NUMER': case 'ZGLOSZENIE':
          targetField = [d.ticket_code, d.ticket_number, d.id, d.t_code].join(' ')
          break
        case 'QP': case 'STACJA': 
          targetField = [d.qp_id, d.qp_id_full, d.station_id, d.t_qp].join(' ')
          break
        case 'KLIENT': case 'FIRMA': 
          targetField = d.client || d.t_client
          break
        case 'TYTUL': case 'TEMAT':
          targetField = [d.title, d.subject, d.t_title].join(' ')
          break
        case 'PRIORYTET': 
          targetField = d.priority
          break
        case 'KATEGORIA': case 'TYP': case 'KAT': 
          targetField = d.category || d.t_category
          break
        case 'STATUS': case 'STATUS_AXON': case 'STATUS_WEW':
          targetField = [d.status, d.ticket_status, d.t_status].join(' ')
          break
        case 'PRODUKT': case 'MODEL':
          targetField = [d.product, d.manufacturer].join(' ')
          break
        case 'OPIS': 
          targetField = d.description || d.t_desc
          break
        case 'OSOBA': case 'KONTAKT': 
          targetField = [d.contact_person, d.contact_name].join(' ')
          break
        case 'TEL': case 'TELEFON': 
          targetField = d.contact_phone
          break
        case 'MAIL': case 'EMAIL': 
          targetField = d.contact_email
          break
        case 'TECHNIK': case 'TECH':
          targetField = d.technician_id || d.techName
          break
        case 'ADRES': case 'ULICA': 
          targetField = [d.address, d.street, d.t_address].join(' ')
          break
        case 'KOD': case 'ZIP': 
          targetField = [d.postcode, d.zip].join(' ')
          break
        case 'MIASTO': 
          targetField = d.city
          break
        case 'DATA': case 'UTWORZONO': 
          targetField = d.created_at
          break
        case 'ZAPOTRZEBOWANIE': case 'UZUPELNIENIA': 
          targetField = d.raw_info
          break
        case 'STATUS_ZAPOTRZEBOWANIA': case 'STATUS_CZESCI': 
          targetField = d.req_status
          break
        case 'DIAGNOZA': 
          targetField = d.raw_diagnoza
          break
        case 'NOTATKA': case 'UWAGI': 
          targetField = d.notes
          break
        case 'CZESCI': case 'UZYTE_CZESCI': 
          targetField = d.parts_str
          break
      }

      if (targetField !== null) {
        const normTarget = normalizePL(targetField)
        return q.searchValues.some(sv => normTarget.includes(sv))
      }
    }

    // Globalne wyszukiwanie jeśli brak prefiksu lub prefix nieznany
    const searchStr = [
      d.t_code, d.ticket_code, d.ticket_number, d.id, d.t_qp, d.qp_id, d.qp_id_full, d.station_id, 
      d.t_title, d.title, d.subject, d.t_address, d.address, d.street, d.postcode, d.zip, d.city, 
      d.t_client, d.client, d.t_status, d.status, d.ticket_status, d.t_desc, d.description, 
      d.t_category, d.category, d.priority, d.product, d.manufacturer,
      d.contact_person, d.contact_name, d.contact_phone, d.contact_email,
      (d.techName || d.technician_id || 'brak przypisania'), d.raw_info, d.req_status, d.raw_diagnoza, d.notes, d.parts_str
    ].filter(Boolean).join(' ')
    
    return normalizePL(searchStr).includes(q.query)
  }

  // ==========================================
  // 2. FILTROWANIE BAZY KLIENTÓW
  // ==========================================
  const checkClientSearch = (c, qText, allStations = []) => {
    const q = parseQueryCached(qText)
    if (!q.query) return true

    const clientStations = allStations.filter(s => {
      let sid = String(s.client_id || s.clientId || '').trim()
      return sid === String(c.id).trim() || sid.toLowerCase() === String(c.name).trim().toLowerCase()
    })

    const stationsText = clientStations.map(s => `${s.public_id || s.name || ''} ${s.city || s.location || ''} ${s.technician_id || s.tech || ''} ${s.active_ticket_id || ''}`).join(' ')

    if (q.prefix) {
      let targetField = null

      switch (q.prefix) {
        case 'FIRMA': case 'KLIENT': case 'NAZWA': 
          targetField = c.name; break;
        case 'NIP': 
          targetField = c.nip; break;
        case 'MIASTO': case 'ADRES': case 'LOKALIZACJA': 
          targetField = [c.address, stationsText].join(' '); break;
        case 'OSOBA': case 'KONTAKT': 
          targetField = c.contact_person || c.contactPerson; break;
        case 'TEL': case 'TELEFON': 
          targetField = c.phone; break;
        case 'MAIL': case 'EMAIL': 
          targetField = c.email; break;
        case 'SLA': 
          targetField = c.sla_hours; break;
        case 'MRR': 
          targetField = c.mrr; break;
        case 'STACJA': case 'QP': case 'TECHNIK': case 'REJON': case 'ZGLOSZENIE': case 'TICKET': 
          targetField = stationsText; break;
      }

      if (targetField !== null) {
        const normTarget = normalizePL(targetField)
        return q.searchValues.some(sv => normTarget.includes(sv))
      }
    }

    const searchStr = [
      c.name, c.contact_person, c.contactPerson, c.phone, c.email, c.nip, c.address, c.sla_hours, c.mrr, stationsText
    ].join(' ')
    
    return normalizePL(searchStr).includes(q.query)
  }

  // ==========================================
  // 3. FILTROWANIE ROZLICZEŃ I BILINGÓW
  // ==========================================
  const checkBillingSearch = (item, qText) => {
    const q = parseQueryCached(qText)
    if (!q.query) return true

    if (q.prefix) {
      let targetField = null

      switch(q.prefix) {
        case 'NUMER': case 'ID': case 'ZGLOSZENIE': 
          targetField = item.ticket_id || item.id 
          break
        case 'KLIENT': case 'FIRMA': 
          targetField = item.client 
          break
        case 'QP': case 'STACJA': 
          targetField = item.qp || item.station_id 
          break
        case 'DATA': case 'REALIZACJA': 
          targetField = item.closed_date || item.created_date 
          break
        case 'TECHNIK': case 'SERWISANT': case 'TECH_EXACT': 
          targetField = item.technician || ''
          break
        case 'TYP': 
          targetField = item.category || item.type 
          break
        case 'POZYCJE': case 'CENNIK': 
          targetField = item.raw_info 
          break
        case 'KWOTA': case 'EUR': 
          targetField = item.saved_data ? item.saved_data.total_eur : ''
          break
        case 'STATUS': case 'STATUS_EXACT':
          targetField = [item.status, item.billing_status, item.billing_state].join(' ')
          break
        case 'KOMENTARZ': case 'UWAGI': 
          targetField = item.notes 
          break
        case 'RBH': case 'ROBOCZOGODZINY': 
          targetField = item.saved_data ? item.saved_data.rbh : ''
          break
        case 'DOJAZD': 
          targetField = item.saved_data ? item.saved_data.travel : ''
          break
      }

      if (targetField !== null) {
        const normTarget = normalizePL(targetField)
        return q.searchValues.some(sv => normTarget.includes(sv))
      }
    }

    const superString = [
      item.ticket_id, item.client, item.qp, item.technician, 
      item.closed_date, item.status, item.billing_status, item.billing_state, item.notes, item.category
    ].filter(Boolean).join(' ')

    return normalizePL(superString).includes(q.query)
  }

  return { 
    checkTicketSearch, 
    checkClientSearch,
    checkBillingSearch
  }
}