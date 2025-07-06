<script setup lang="ts">
import type { Table, DragMoveEvent } from "~/types/schema";

interface Props {
  table: Table;
  isSelected?: boolean;
}

interface Emits {
  (e: "dragStart", tableId: string): void;
  (e: "dragMove", event: DragMoveEvent): void;
  (e: "dragEnd"): void;
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
});

const emit = defineEmits<Emits>();

const schemaStore = useSchemaStore();
const { canvas } = storeToRefs(schemaStore);

// Computed height based on columns
const calculatedHeight = computed(() => {
  const headerHeight = 40; // Table header height
  const rowHeight = 42; // Each column row height
  return headerHeight + props.table.columns.length * rowHeight;
});

// Dragging state
const isDragging = ref(false);
const dragStartPos = ref({ x: 0, y: 0 });
const initialTablePos = ref({ x: 0, y: 0 });

const startDrag = (event: MouseEvent): void => {
  console.log("Table drag started", props.table.id);
  event.preventDefault();
  event.stopPropagation();

  isDragging.value = true;
  dragStartPos.value = { x: event.clientX, y: event.clientY };
  initialTablePos.value = { x: props.table.x, y: props.table.y };

  emit("dragStart", props.table.id);

  // Add global event listeners
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
};

const onMouseMove = (event: MouseEvent) => {
  if (!isDragging.value) return;

  console.log("Mouse move during drag");
  event.preventDefault();

  // Get current canvas state
  const schemaStore = useSchemaStore();
  const canvas = schemaStore.canvas;

  // Calculate movement delta
  const deltaX = event.clientX - dragStartPos.value.x;
  const deltaY = event.clientY - dragStartPos.value.y;

  // Scale delta by canvas zoom
  const scaledDeltaX = deltaX / canvas.scale;
  const scaledDeltaY = deltaY / canvas.scale;

  // Calculate new position
  const newX = initialTablePos.value.x + scaledDeltaX;
  const newY = initialTablePos.value.y + scaledDeltaY;

  console.log("Emitting dragMove", {
    tableId: props.table.id,
    x: newX,
    y: newY,
  });

  emit("dragMove", {
    tableId: props.table.id,
    x: newX,
    y: newY,
  });
};

const onMouseUp = () => {
  if (!isDragging.value) return;

  console.log("Table drag ended");
  isDragging.value = false;
  emit("dragEnd");

  // Remove global event listeners
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
};
</script>

<template>
  <div
    :style="{
      width: `${table.width}px`,
      height: `${calculatedHeight}px`,
    }"
    class="w-full h-full rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-move select-none"
    :class="{
      'border-primary/60 shadow-primary-100 overflow-hidden': isSelected,
      'bg-white border-2 border-gray-200': !canvas.isGovernmentMode,
      'bg-white border-2 border-black': canvas.isGovernmentMode,
    }"
    @mousedown="startDrag"
  >
    <!-- Table Header -->
    <div
      class="px-4 py-3 rounded-t-md"
      :class="{
        'bg-gradient-to-r from-purple-500 to-indigo-600 text-white': !canvas.isGovernmentMode,
        'bg-white text-black border-b border-black': canvas.isGovernmentMode,
      }"
    >
      <div class="flex items-center gap-2">
        <div 
          class="w-3 h-3 rounded-sm" 
          :class="{
            'bg-white/20': !canvas.isGovernmentMode,
            'bg-black/20': canvas.isGovernmentMode,
          }"
        />
        <h3 class="font-semibold text-sm">{{ table.name }}</h3>
      </div>
    </div>

    <!-- Columns -->
    <div 
      class="divide-y"
      :class="{
        'divide-gray-100': !canvas.isGovernmentMode,
        'divide-black': canvas.isGovernmentMode,
      }"
    >
      <div
        v-for="(column, index) in table.columns"
        :key="index"
        class="px-4 py-2.5 transition-colors"
        :class="{
          'hover:bg-gray-50': !canvas.isGovernmentMode,
          'hover:bg-gray-100': canvas.isGovernmentMode,
        }"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <!-- Key Indicators -->
            <div class="flex gap-1">
              <span
                v-if="column.isPrimary"
                class="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-amber-500 rounded"
              >
                PK
              </span>
              <span
                v-if="column.isForeign"
                class="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-emerald-500 rounded"
              >
                FK
              </span>
            </div>

            <span 
              class="text-sm font-medium"
              :class="{
                'text-gray-900': !canvas.isGovernmentMode,
                'text-black': canvas.isGovernmentMode,
              }"
            >{{
              column.name
            }}</span>
          </div>

          <div 
            class="text-xs"
            :class="{
              'text-gray-500': !canvas.isGovernmentMode,
              'text-gray-600': canvas.isGovernmentMode,
            }"
          >
            {{
              column.length ? `${column.type}(${column.length})` : column.type
            }}
          </div>
        </div>

        <!-- Constraints -->
        <!-- <div v-if="column.isUnique || column.isNotNull" class="flex gap-1 mt-1">
          <span
            v-if="column.isUnique"
            class="inline-flex px-1.5 py-0.5 text-xs font-medium text-blue-800 bg-blue-100 rounded"
          >
            UNIQUE
          </span>
          <span
            v-if="column.isNotNull"
            class="inline-flex px-1.5 py-0.5 text-xs font-medium text-red-800 bg-red-100 rounded"
          >
            NOT NULL
          </span>
        </div> -->
      </div>
    </div>
  </div>
</template>
