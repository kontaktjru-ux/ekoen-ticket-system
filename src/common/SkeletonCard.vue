<template>
  <div class="w-full bg-white border border-slate-100 rounded-2xl p-4 shadow-sm animate-pulse flex flex-col gap-4">
    <div class="flex items-center gap-5 w-full">
      <!-- Awatar -->
      <div class="w-14 h-14 bg-slate-200 rounded-[14px] shrink-0"></div>
      
      <!-- Teksty (Nazwa i tagi) -->
      <div class="flex-1 flex flex-col gap-2">
        <div class="h-4 bg-slate-200 rounded-md w-1/3"></div>
        <div class="flex gap-2">
          <div class="h-3 bg-slate-100 rounded-md w-24"></div>
          <div class="h-3 bg-slate-100 rounded-md w-32"></div>
        </div>
      </div>
      
      <!-- Prawy element (Sprawność) -->
      <div class="w-[46px] h-[46px] bg-slate-200 rounded-full shrink-0"></div>
    </div>
  </div>
</template>