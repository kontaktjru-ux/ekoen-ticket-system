import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'

const ICON_STATIONS = "PHN2ZyBjbGFzcz0idy02IGgtNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGxpbmUgeDE9IjgiIHkxPSI2IiB4Mj0iMjEiIHkyPSI2Ii8+PGxpbmUgeDE9IjgiIHkxPSIxMiIgeDI9IjIxIiB5Mj0iMTIiLz48bGluZSB4MT0iOCIgeTE9IjE4IiB4Mj0iMjEiIHkyPSIxOCIvPjxsaW5lIHgxPSIzIiB5MT0iNiIgeDI9IjMuMDEiIHkyPSI2Ii8+PGxpbmUgeDE9IjMiIHkxPSIxMiIgeDI9IjMuMDEiIHkyPSIxMiIvPjxsaW5lIHgxPSIzIiB5MT0iMTgiIHgyPSIzLjAxIiB5Mj0iMTgiLz48L3N2Zz4="
const ICON_ALERT = "PHN2ZyBjbGFzcz0idy02IGgtNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0ibTIxLjczIDE4LTgtMTRhMiAyIDAgMCAwLTMuNDggMGwtOCAxNEEyIDIgMCAwIDAgNCAyMWgxNmEyIDIgMCAwIDAgMS43My0zWiIvPjxsaW5lIHgxPSIxMiIgeTE9IjkiIHgyPSIxMiIgeTI9IjEzIi8+PGxpbmUgeDE9IjEyIiB5MT0iMTciIHgyPSIxMi4wMSIgeTI9IjE3Ii8+PC9zdmc+"
const ICON_GPS = "PHN2ZyBjbGFzcz0idy02IGgtNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiLz48cGF0aCBkPSJtMTYuMiA3LjgtMiA2LjMtNi40IDIuMSAyLTYuM3oiLz48L3N2Zz4="
const ICON_MUTE = "PHN2ZyBjbGFzcz0idy02IGgtNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTExIDVMNiA5SDJ2Nmg0bDUgNFY1eiIvPjxsaW5lIHgxPSIyMyIgeTE9IjkiIHgyPSIxNyIgeTI9IjE1Ii8+PGxpbmUgeDE9IjE3IiB5MT0iOSIgeDI9IjIzIiB5Mj0iMTUiLz48L3N2Zz4="

export const useStationsStore = defineStore('stations', () => {
  const stations = shallowRef([])
  const clients = shallowRef([])
  const techs = shallowRef([])
  const tickets = shallowRef([])
  const countryPolygons = shallowRef([])
  
  const isLoading = ref(false)

  const activeTabId = ref('ALL')
  const kpiTabs = ref([])
  const searchQueriesMain = ref([{ id: 'sq_' + Date.now(), logic: 'AND', text: '' }])
  const mutedIds = ref(new Set())

  const getDefaultTabs = () => [
    { id: 'ALL', name: 'STACJE W BAZIE', filter: 'ALL', color: '#58b347', icon: ICON_STATIONS, customQueries: [] },
    { id: 'AWARIE', name: 'ZGŁOSZONE AWARIE', filter: 'AWARIE', color: '#ef4444', icon: ICON_ALERT, customQueries: [] },
    { id: 'NO_GPS', name: 'BRAKI GPS', filter: 'NO_GPS', color: '#f59e0b', icon: ICON_GPS, customQueries: [] },
    { id: 'MUTED', name: 'WYCISZONE', filter: 'MUTED', color: '#94a3b8', icon: ICON_MUTE, customQueries: [] }
  ]

  const loadTabsConfiguration = () => {
    try {
      const localStore = JSON.parse(localStorage.getItem('EKOEN_STATIONS_UI')) || {}
      const savedTabs = localStore.tabs || []
      
      if (savedTabs.length > 0) {
        const defaults = getDefaultTabs()
        const updatedTabs = savedTabs.map(tab => {
          const defaultEquivalent = defaults.find(d => d.id === tab.id)
          if (defaultEquivalent && (defaultEquivalent.filter === 'AWARIE' || defaultEquivalent.filter === 'NO_GPS' || defaultEquivalent.filter === 'MUTED' || defaultEquivalent.filter === 'ALL')) {
            tab.filter = defaultEquivalent.filter
          }
          return tab
        })
        
        defaults.forEach(dTab => {
          if (!updatedTabs.find(sTab => sTab.id === dTab.id)) updatedTabs.push(dTab)
        })
        kpiTabs.value = updatedTabs
      } else {
        kpiTabs.value = getDefaultTabs()
      }
    } catch (e) {
      kpiTabs.value = getDefaultTabs()
    }
  }

  const saveTabsConfiguration = () => {
    try {
      const localStore = JSON.parse(localStorage.getItem('EKOEN_STATIONS_UI')) || {}
      localStore.tabs = kpiTabs.value
      localStorage.setItem('EKOEN_STATIONS_UI', JSON.stringify(localStore))
    } catch (e) {}
  }

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      let r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  const fetchStationsData = () => {
    isLoading.value = true
    loadTabsConfiguration()

    if (typeof google === 'undefined') {
      setTimeout(() => { isLoading.value = false }, 500)
      return
    }

    google.script.run.withSuccessHandler((resStr) => {
      try {
        const res = JSON.parse(resStr)
        if (res && res.tickets) tickets.value = res.tickets
      } catch(e) {}
    }).getScheduleData()

    google.script.run
      .withSuccessHandler((resStr) => {
        try {
          const res = typeof resStr === 'string' ? JSON.parse(resStr) : resStr
          if (res && res.success) {
            let tempMuted = new Set()
            
            stations.value = (res.stations || []).map(s => {
              if (!s.id || String(s.id).trim() === '') {
                s.id = generateUUID()
                if (typeof google !== 'undefined' && google.script && google.script.run.updateGeneratedIdInBase) {
                  google.script.run.updateGeneratedIdInBase(s.public_id, s.id)
                }
              }
              if (s.is_muted === "TAK") tempMuted.add(s.id)
              return s
            })
            
            mutedIds.value = tempMuted
            clients.value = res.clients || []
            techs.value = res.techs || []
            
            runGeofencingLogic()

            // 🟢 TICHY AUTO-GEOKODER URUCHAMIANY PO 5 SEKUNDACH
            setTimeout(() => { runGeocoding([], null, null) }, 5000)
          }
        } catch (e) {
          console.error("Błąd parsowania bazy stacji:", e)
        }
        isLoading.value = false
      })
      .withFailureHandler(() => {
        alert("Błąd pobierania stacji z bazy!")
        isLoading.value = false
      })
      .getStationsData()

      const countrySources = [
        { code: 'POLSKA', url: 'https://drive.google.com/uc?export=download&id=1SmsYh3Z3QB7HGQes3SNg5HsjPwf90352' },
        { code: 'SŁOWACJA', url: 'https://drive.google.com/uc?export=download&id=13vAhZFnkhnnPcwnzYeLRGJc2lEpjB31Q' }
      ]
      countrySources.forEach(src => {
        google.script.run.withSuccessHandler(data => {
          const geojson = typeof data === 'string' ? JSON.parse(data) : data
          countryPolygons.value.push({ code: src.code, data: geojson })
          runGeofencingLogic()
        }).fetchGeoJSONFromDrive(src.url)
      })
  }

  const runGeofencingLogic = () => {
    if (typeof turf === 'undefined' || stations.value.length === 0) return
    let updatesToSync = []
    
    const newStationsList = [...stations.value]

    newStationsList.forEach(s => {
      let regionName = "POLSKA"
      if (s.country && s.country.toUpperCase() !== "POLSKA" && s.country.toUpperCase() !== "PL") {
          regionName = s.country.toUpperCase()
      }

      if (!s.gps_lat || !s.gps_lng) return
      const lat = parseFloat(String(s.gps_lat).replace(',','.'))
      const lng = parseFloat(String(s.gps_lng).replace(',','.'))
      if (isNaN(lat) || isNaN(lng)) return

      try {
        const pt = turf.point([lng, lat])
        let matchedTechs = []
        
        if (techs.value.length > 0) {
          for (let t of techs.value) {
            if (t.zone_geometry && t.zone_geometry !== '' && t.zone_geometry !== 'null') {
              try {
                let geom = typeof t.zone_geometry === 'string' ? JSON.parse(t.zone_geometry) : t.zone_geometry
                let feats = geom.type === 'FeatureCollection' ? geom.features : [geom]
                for (let f of feats) { 
                  if (turf.booleanPointInPolygon(pt, f)) { matchedTechs.push(t.name); break; } 
                }
              } catch(e) {}
            }
          }
        }

        let foundCountry = null
        for (let cp of countryPolygons.value) {
          if (cp.data && cp.data.features) {
            for (let f of cp.data.features) {
              if (turf.booleanPointInPolygon(pt, f)) { foundCountry = cp.code; break; }
            }
          }
          if (foundCountry) break
        }
        
        let newRegion = foundCountry || (s.country ? s.country.toUpperCase() : "POLSKA")
        let newTech = matchedTechs.length > 0 ? matchedTechs.join(', ') : null
        
        let changed = false
        let updatePayload = { id: s.id }

        if (s.region !== newRegion) {
           s.region = newRegion
           updatePayload.region = newRegion
           changed = true
        }

        if (newTech && s.technician_id !== newTech) {
           s.technician_id = newTech
           updatePayload.technician_id = newTech
           changed = true
        }
        
        if(changed) updatesToSync.push(updatePayload)
      } catch (err) {}
    })

    stations.value = newStationsList

    if(updatesToSync.length > 0 && typeof google !== 'undefined' && google.script) {
       google.script.run.updateStationsBulk(updatesToSync)
    }
  }

  const runGeocoding = async (selectedIdsArray, onSuccess, onProgress) => {
    let targetStations = stations.value.filter(s => !s.gps_lat || !s.gps_lng || String(s.gps_lat).trim() === '')
    
    if (selectedIdsArray && selectedIdsArray.length > 0) {
      targetStations = targetStations.filter(s => selectedIdsArray.includes(s.id))
    }

    if(targetStations.length === 0) return 0
    let successCount = 0

    for (let s of targetStations) {
      let qParts = [s.street, s.street_number, s.city, (s.country || 'Polska')].filter(Boolean)
      if(qParts.length < 2) continue 
      
      let query = qParts.join(', ')
      try {
        let res = await fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(query))
        let data = await res.json()
        if (data && data.length > 0) {
          s.gps_lat = data[0].lat
          s.gps_lng = data[0].lon
          successCount++
          
          if(typeof google !== 'undefined' && google.script) {
             const cleanPayload = JSON.parse(JSON.stringify({
                id: s.id, public_id: s.public_id, client_id: s.client_id,
                model: s.model, inspection_date: s.inspection_date,
                country: s.country, city: s.city, street: s.street, street_number: s.street_number,
                additional_info: s.additional_info, status: s.status,
                technician_id: s.technician_id, region: s.region, 
                gps_lat: s.gps_lat, gps_lng: s.gps_lng
             }))
             google.script.run.saveStationToBase(cleanPayload)
          }
        }
      } catch(e) {}
      await new Promise(resolve => setTimeout(resolve, 1100))
    }

    runGeofencingLogic()
    if (onSuccess) onSuccess(successCount)
    return successCount
  }

  const deleteStationsBulk = (ids) => {
    stations.value = stations.value.filter(s => !ids.includes(s.id))
    if (typeof google !== 'undefined' && google.script) {
       google.script.run.deleteStationsBulk(Array.from(ids))
    }
  }

  const toggleMuteBulk = (ids) => {
    let anyUnmuted = false
    ids.forEach(id => { if(!mutedIds.value.has(id)) anyUnmuted = true })
    
    let updates = []
    const updatedStations = [...stations.value]
    
    ids.forEach(id => {
      const s = updatedStations.find(x => x.id === id)
      if (anyUnmuted) {
         mutedIds.value.add(id)
         if(s) s.is_muted = "TAK"
         updates.push({ id: id, is_muted: true })
      } else {
         mutedIds.value.delete(id)
         if(s) s.is_muted = "NIE"
         updates.push({ id: id, is_muted: false })
      }
    })

    stations.value = updatedStations
    if (typeof google !== 'undefined' && google.script) {
       google.script.run.updateStationsBulk(updates)
    }
  }

  return {
    stations, clients, techs, tickets, countryPolygons, isLoading,
    activeTabId, kpiTabs, searchQueriesMain, mutedIds,
    loadTabsConfiguration, saveTabsConfiguration, fetchStationsData,
    runGeocoding, deleteStationsBulk, toggleMuteBulk
  }
})