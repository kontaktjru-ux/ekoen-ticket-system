import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'

export const useMapStore = defineStore('map', () => {
  const stations = shallowRef([])
  const techs = shallowRef([])
  const areas = shallowRef([])
  const countryPolygons = shallowRef([])
  
  const isLoading = ref(false)
  const isSilentLoading = ref(false)

  const hiddenTechs = ref(new Set())
  const hiddenAreas = ref(new Set())

  const loadMapSettings = () => {
    try {
      const localStore = JSON.parse(localStorage.getItem('EKOEN_MAP_UI')) || {}
      if (localStore.hiddenTechs) hiddenTechs.value = new Set(localStore.hiddenTechs)
      if (localStore.hiddenAreas) hiddenAreas.value = new Set(localStore.hiddenAreas)
    } catch (e) {
      hiddenTechs.value = new Set()
      hiddenAreas.value = new Set()
    }
  }

  const saveMapSettings = () => {
    try {
      const localStore = JSON.parse(localStorage.getItem('EKOEN_MAP_UI')) || {}
      localStore.hiddenTechs = Array.from(hiddenTechs.value)
      localStore.hiddenAreas = Array.from(hiddenAreas.value)
      localStorage.setItem('EKOEN_MAP_UI', JSON.stringify(localStore))
    } catch (e) {}
  }

  const toggleTechVisibility = (id) => {
    if (hiddenTechs.value.has(id)) hiddenTechs.value.delete(id)
    else hiddenTechs.value.add(id)
    saveMapSettings()
  }

  const toggleAreaVisibility = (id) => {
    if (hiddenAreas.value.has(id)) hiddenAreas.value.delete(id)
    else hiddenAreas.value.add(id)
    saveMapSettings()
  }

  const fetchMapData = (isSilent = false) => {
    if (isSilent) isSilentLoading.value = true
    else isLoading.value = true
    
    loadMapSettings()

    if (typeof google === 'undefined') {
      setTimeout(() => { isLoading.value = false; isSilentLoading.value = false }, 500)
      return
    }

    google.script.run
      .withSuccessHandler((resStr) => {
        try {
          const res = typeof resStr === 'string' ? JSON.parse(resStr) : resStr
          if (res) {
            stations.value = res.stations || []
            techs.value = res.techs || []
            areas.value = res.areas || []
          }
        } catch (e) {
          console.error("Błąd parsowania mapy:", e)
        }
        isLoading.value = false
        isSilentLoading.value = false
      })
      .withFailureHandler(() => {
        isLoading.value = false
        isSilentLoading.value = false
      })
      .getMapData()
  }

  const loadCountryPolygons = () => {
    if (countryPolygons.value.length > 0) return
    const countrySources = [
      { code: 'PL', url: 'https://drive.google.com/uc?export=download&id=1SmsYh3Z3QB7HGQes3SNg5HsjPwf90352' },
      { code: 'SK', url: 'https://drive.google.com/uc?export=download&id=13vAhZFnkhnnPcwnzYeLRGJc2lEpjB31Q' }
    ]

    countrySources.forEach(src => {
      if (typeof google !== 'undefined' && google.script) {
        google.script.run.withSuccessHandler(data => {
          const geojson = typeof data === 'string' ? JSON.parse(data) : data
          countryPolygons.value.push({ code: src.code, data: geojson })
        }).fetchGeoJSONFromDrive(src.url)
      }
    })
  }

  const saveGeometryToCloud = (id, targetType, geoJsonStr, onSuccess, onFailure) => {
    if (typeof google !== 'undefined' && google.script) {
      if (targetType === 'tech') {
        google.script.run
          .withSuccessHandler(() => { fetchMapData(true); if(onSuccess) onSuccess() })
          .withFailureHandler(err => { if(onFailure) onFailure(err) })
          .updateTechnicianGeometry(id, geoJsonStr)
      } else {
        google.script.run
          .withSuccessHandler(() => { fetchMapData(true); if(onSuccess) onSuccess() })
          .withFailureHandler(err => { if(onFailure) onFailure(err) })
          .updateAreaGeometry(id, geoJsonStr)
      }
    }
  }

  const deleteAreaFromCloud = (id, onSuccess, onFailure) => {
    if (typeof google !== 'undefined' && google.script) {
      google.script.run
        .withSuccessHandler(() => { fetchMapData(true); if(onSuccess) onSuccess() })
        .withFailureHandler(err => { if(onFailure) onFailure(err) })
        .deleteAreaFromBase(id)
    }
  }

  return {
    stations, techs, areas, countryPolygons, isLoading, isSilentLoading,
    hiddenTechs, hiddenAreas,
    loadMapSettings, saveMapSettings, toggleTechVisibility, toggleAreaVisibility,
    fetchMapData, loadCountryPolygons, saveGeometryToCloud, deleteAreaFromCloud
  }
})