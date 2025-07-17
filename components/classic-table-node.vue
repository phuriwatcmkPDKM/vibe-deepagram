<script setup lang="ts">
import { HEADER_HEIGHT, ROW_HEIGHT } from "~/constants";
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

// Use same dimensions as modern table node
const calculatedHeight = computed(() => {
  const headerHeight = HEADER_HEIGHT; // Table header height
  const rowHeight = ROW_HEIGHT; // Each column row height
  return headerHeight + props.table.columns.length * rowHeight;
});

// Dragging state
const isDragging = ref(false);
const dragStartPos = ref({ x: 0, y: 0 });
const initialTablePos = ref({ x: 0, y: 0 });

const startDrag = (event: MouseEvent): void => {
  event.preventDefault();
  event.stopPropagation();

  isDragging.value = true;
  dragStartPos.value = { x: event.clientX, y: event.clientY };
  initialTablePos.value = { x: props.table.x, y: props.table.y };

  emit("dragStart", props.table.id);

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
};

const onMouseMove = (event: MouseEvent) => {
  if (!isDragging.value) return;

  event.preventDefault();

  const schemaStore = useSchemaStore();
  const canvas = schemaStore.canvas;

  const deltaX = event.clientX - dragStartPos.value.x;
  const deltaY = event.clientY - dragStartPos.value.y;

  const scaledDeltaX = deltaX / canvas.scale;
  const scaledDeltaY = deltaY / canvas.scale;

  const newX = initialTablePos.value.x + scaledDeltaX;
  const newY = initialTablePos.value.y + scaledDeltaY;

  emit("dragMove", {
    tableId: props.table.id,
    x: newX,
    y: newY,
  });
};

const onMouseUp = () => {
  if (!isDragging.value) return;

  isDragging.value = false;
  emit("dragEnd");

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
    class="w-full h-full rounded-sm shadow-lg hover:shadow-xl transition-shadow cursor-move select-none bg-white border-2 border-black-200 overflow-hidden"
    :class="{
      'border-ci-primary border-2': isSelected,
    }"
    @mousedown="startDrag"
  >
    <!-- Table Header -->
    <div
      class="px-2 py-1 border-b-2 border-black bg-gray-200 flex items-center justify-center"
      :style="{ height: `${HEADER_HEIGHT}px` }"
    >
      <h3 class="font-bold text-base text-black text-center">
        {{ table.name }}
      </h3>
    </div>

    <!-- Columns -->
    <div>
      <div
        v-for="(column, index) in table.columns"
        :key="index"
        class="bg-white hover:bg-gray-50 flex text-xs"
        :style="{ height: `${ROW_HEIGHT}px` }"
      >
        <!-- PK/FK Column -->
        <div
          class="w-8 px-1 py-1 border-r border-black flex items-center justify-center text-[10px] font-bold"
        >
          <span v-if="column.isPrimary" class="text-black">PK</span>
          <span v-else-if="column.isForeign" class="text-black">FK</span>
        </div>

        <!-- Field Column -->
        <div class="flex-1 px-2 py-1 flex items-center justify-between">
          <span class="text-black font-mono">{{ column.name }}</span>
          <span class="text-[10px] text-gray-600 font-mono">
            {{
              column.length ? `${column.type}(${column.length})` : column.type
            }}</span
          >
        </div>
      </div>
    </div>
  </div>
</template>
