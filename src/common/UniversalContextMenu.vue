<template>
  <Teleport to="body">
    <!-- Niewidzialna warstwa przechwytująca kliknięcia by zamknąć menu -->
    <div v-if="show" class="fixed inset-0 z-[999999]" @click.prevent="$emit('close')" @contextmenu.prevent="$emit('close')">
      
      <!-- Właściwe okienko Menu Kontekstowego -->
      <div 
        ref="menuRef"
        class="absolute bg-white/95 backdrop-blur-xl rounded-[16px] shadow-[0_15px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-200/80 min-w-[260px] overflow-hidden animate-fadeIn py-2"
        :style="{ top: `${adjustedY}px`, left: `${adjustedX}px` }"
        @click.stop
      >
        <div v-if="title" class="px-5 py-3 border-b border-slate-100/80 mb-1">
          <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">{{ title }}</span>
        </div>
        <ul>
          <li v-for="(item, index) in items" :key="index">
            <button @click="handleAction(item)" class="w-full text-left px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50 transition-colors text-slate-700 group">
              <span class="text-slate-400 group-hover:text-slate-600 transition-colors" v-html="item.icon"></span>
              <span class="text-[13px] font-bold group-hover:text-slate-900 transition-colors">{{ item.label }}</span>
            </button>
          </li>
        </ul>
      </div>
      
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  show: Boolean,
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  title: String,
  items: { type: Array, default: () => [] }
})

const emit = defineEmits(['close', 'action'])

const menuRef = ref(null)
const adjustedX = ref(props.x)
const adjustedY = ref(props.y)

// Zabezpieczenie przed wyjściem menu poza ekran
watch(() => props.show, async (isShowing) => {
  if (isShowing) {
    adjustedX.value = props.x
    adjustedY.value = props.y
    
    await nextTick()
    
    if (menuRef.value) {
      const rect = menuRef.value.getBoundingClientRect()
      const padding = 10
      
      if (rect.right > window.innerWidth) {
        adjustedX.value = window.innerWidth - rect.width - padding
      }
      if (rect.bottom > window.innerHeight) {
        adjustedY.value = window.innerHeight - rect.height - padding
      }
    }
  }
})

const handleAction = (item) => {
  emit('action', item.action)
  emit('close')
}
</script>