import './gasMock.js'
import { createApp } from 'vue'
import { createPinia } from 'pinia' // 1. Importujemy kreator Pinii
import App from './App.vue'

// Importy stylów (np. Tailwind)
import './assets/main.css' 

const app = createApp(App)
const pinia = createPinia() // 2. Tworzymy instancję Pinii

app.use(pinia) // 3. Rejestrujemy Pinię w Vue
app.mount('#app-root')