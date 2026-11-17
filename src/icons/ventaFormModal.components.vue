<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="handleCloseModal">
    <div class="modal-dialog modal-dialog-lg">
      <div class="modal-header">
        <h3 class="modal-title">
          {{ isEditing ? 'Editar Venta' : 'Realizar Nueva Venta' }}
        </h3>
        <button class="btn-close" @click="handleCloseModal">✕</button>
      </div>

      <form @submit.prevent="handleSubmitForm" class="modal-body">
        <div v-if="errorMessage || localError" class="alert-error">
          {{ errorMessage || localError }}
        </div>

        <!-- Sección: Selección y adición de productos a la venta -->
        <div class="add-product-box">
          <h4 class="section-subtitle">Agregar Producto</h4>
          <div class="add-product-grid">
            <div class="form-group flex-2">
              <label for="select-producto">Producto *</label>
              <select
                id="select-producto"
                v-model="currentItem.productoId"
                class="form-control"
              >
                <option value="" disabled>Selecciona un producto del catálogo...</option>
                <option
                  v-for="prod in productosList"
                  :key="prod.id"
                  :value="prod.id"
                  :disabled="prod.stock <= 0"
                >
                  {{ prod.nombre }} — ${{ Number(prod.precio).toFixed(2) }} (Stock: {{ prod.stock }})
                </option>
              </select>
            </div>

            <div class="form-group flex-1">
              <label for="item-cantidad">Cantidad *</label>
              <input
                id="item-cantidad"
                v-model.number="currentItem.cantidad"
                type="number"
                min="1"
                :max="selectedProductStock > 0 ? selectedProductStock : undefined"
                class="form-control"
              />
            </div>

            <div class="form-group flex-btn">
              <label>&nbsp;</label>
              <button
                type="button"
                class="btn btn-secondary btn-add"
                @click="handleAddItem"
              >
                + Agregar
              </button>
            </div>
          </div>
        </div>

        <!-- Tabla de Productos en la Venta -->
        <div class="items-section">
          <div class="items-header">
            <h4 class="section-subtitle">Detalle de la Venta</h4>
          </div>

          <div v-if="formData.items.length === 0" class="empty-items">
            <p>No has agregado ningún producto a la venta todavía.</p>
          </div>

          <div v-else class="table-responsive">
            <table class="items-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th class="text-right">Precio Unit.</th>
                  <th class="text-center">Cantidad</th>
                  <th class="text-right">Subtotal</th>
                  <th class="text-center">Quitar</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in formData.items" :key="item.idProducto || item.productoId">
                  <td class="font-medium">{{ item.nombreProducto }}</td>
                  <td class="text-right">${{ Number(item.precioUnitario).toFixed(2) }}</td>
                  <td class="text-center">
                    <input
                      v-model.number="item.cantidad"
                      type="number"
                      min="1"
                      class="qty-input"
                    />
                  </td>
                  <td class="text-right font-bold subtotal-cell">
                    ${{ (Number(item.precioUnitario) * Number(item.cantidad)).toFixed(2) }}
                  </td>
                  <td class="text-center">
                    <button
                      type="button"
                      class="btn-remove"
                      title="Eliminar de la venta"
                      @click="handleRemoveItem(index)"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Resumen Total de la Venta -->
        <div class="total-bar">
          <span class="total-label">Total a Pagar:</span>
          <span class="total-amount">${{ totalVenta.toFixed(2) }}</span>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="handleCloseModal">
            Cancelar
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="isSubmitting || formData.items.length === 0"
          >
            {{ isSubmitting ? 'Procesando...' : (isEditing ? 'Actualizar Venta' : 'Registrar Venta') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  ventaToEdit: {
    type: Object,
    default: null
  },
  productosList: {
    type: Array,
    default: () => []
  },
  errorMessage: {
    type: String,
    default: ''
  },
  isSubmitting: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['closeModal', 'submitVenta', 'submitForm'])

const isEditing = computed(() => !!props.ventaToEdit)
const localError = ref('')

const currentItem = reactive({
  productoId: '',
  cantidad: 1
})

const formData = reactive({
  items: []
})

// Calcula el stock disponible del producto seleccionado actualmente en el selector
const selectedProductStock = computed(() => {
  if (!currentItem.productoId) return 0
  const prod = props.productosList.find((p) => p.id === Number(currentItem.productoId))
  return prod ? prod.stock : 0
})

// Calcula el total general de la venta sumando subtotales
const totalVenta = computed(() => {
  return formData.items.reduce((acc, item) => {
    return acc + Number(item.precioUnitario) * Number(item.cantidad)
  }, 0)
})

function populateForm() {
  localError.value = ''
  currentItem.productoId = ''
  currentItem.cantidad = 1

  if (props.ventaToEdit && Array.isArray(props.ventaToEdit.items)) {
    formData.items = props.ventaToEdit.items.map((item) => {
      const pid = item.idProducto ?? item.productoId
      const prod = props.productosList.find((p) => p.id === pid)
      return {
        idProducto: pid,
        productoId: pid,
        nombreProducto: item.nombreProducto || prod?.nombre || `Producto #${pid}`,
        precioUnitario: item.precioUnitario || prod?.precio || 0,
        cantidad: item.cantidad
      }
    })
  } else {
    formData.items = []
  }
}

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      populateForm()
    }
  }
)

function handleAddItem() {
  localError.value = ''
  if (!currentItem.productoId) {
    localError.value = 'Por favor selecciona un producto.'
    return
  }

  const cantidad = Number(currentItem.cantidad)
  if (!cantidad || cantidad < 1) {
    localError.value = 'La cantidad debe ser mayor a 0.'
    return
  }

  const prod = props.productosList.find((p) => p.id === Number(currentItem.productoId))
  if (!prod) {
    localError.value = 'Producto no encontrado en catálogo.'
    return
  }

  // Verificar si ya existe en la lista para acumular cantidad
  const existing = formData.items.find((i) => (i.idProducto ?? i.productoId) === prod.id)
  if (existing) {
    existing.cantidad += cantidad
  } else {
    formData.items.push({
      idProducto: prod.id,
      productoId: prod.id,
      nombreProducto: prod.nombre,
      precioUnitario: Number(prod.precio),
      cantidad: cantidad
    })
  }

  // Resetear selector
  currentItem.productoId = ''
  currentItem.cantidad = 1
}

function handleRemoveItem(index) {
  formData.items.splice(index, 1)
}

function handleCloseModal() {
  emit('closeModal')
}

function handleSubmitForm() {
  localError.value = ''

  if (formData.items.length === 0) {
    localError.value = 'Debes agregar al menos un producto a la venta.'
    return
  }

  // Estructura exacta que espera VentaRequestDTO en Spring Boot:
  // { items: [ { idProducto: Long, cantidad: Integer } ] }
  const payload = {
    items: formData.items.map((item) => {
      const id = Number(item.idProducto ?? item.productoId)
      return {
        idProducto: id,
        productoId: id,
        cantidad: Number(item.cantidad)
      }
    })
  }

  emit('submitVenta', payload)
  emit('submitForm', payload)
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 1rem;
}

.modal-dialog {
  background-color: #ffffff;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  animation: modalFadeIn 0.2s ease-out;
}

.modal-dialog-lg {
  max-width: 680px;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #0f172a;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #64748b;
  cursor: pointer;
  padding: 0.25rem;
  line-height: 1;
}

.btn-close:hover {
  color: #0f172a;
}

.modal-body {
  padding: 1.5rem;
  max-height: 85vh;
  overflow-y: auto;
}

.alert-error {
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.section-subtitle {
  font-size: 1.2rem;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 0.75rem;
}

.add-product-box {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.25rem;
}

.add-product-grid {
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;
}

.flex-2 {
  flex: 2;
}

.flex-1 {
  flex: 1;
}

.flex-btn {
  flex: 0 0 auto;
}

.form-group {
  margin-bottom: 0.25rem;
}

.form-group label {
  display: block;
  font-size: 0.825rem;
  font-weight: 500;
  color: #334155;
  margin-bottom: 0.35rem;
}

.form-control {
  width: 100%;
  padding: 0.65rem 0.85rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.15s ease;
  background-color: #ffffff;
  box-sizing: border-box;
}

.form-control:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.btn-add {
  white-space: nowrap;
  background-color: #e2e8f0;
  color: #0f172a;
  font-weight: 600;
}

.btn-add:hover {
  background-color: #cbd5e1;
}

.items-section {
  margin-bottom: 1.25rem;
}

.empty-items {
  padding: 1.5rem;
  text-align: center;
  color: #94a3b8;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  font-size: 0.9rem;
}

.table-responsive {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.items-table th {
  background-color: #f8fafc;
  padding: 0.65rem 0.85rem;
  font-weight: 600;
  color: #475569;
  border-bottom: 1px solid #e2e8f0;
}

.items-table td {
  padding: 0.65rem 0.85rem;
  border-bottom: 1px solid #f1f5f9;
  color: #1e293b;
}

.items-table tbody tr:last-child td {
  border-bottom: none;
}

.text-right {
  text-align: right;
}

.text-center {
  text-align: center;
}

.font-medium {
  font-weight: 500;
}

.font-bold {
  font-weight: 600;
}

.qty-input {
  width: 60px;
  padding: 0.35rem 0.5rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  text-align: center;
  font-size: 0.9rem;
}

.btn-remove {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.btn-remove:hover {
  background-color: #fee2e2;
}

.total-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1rem;
  padding: 0.85rem 1.25rem;
  background-color: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  margin-top: 1rem;
}

.total-label {
  font-size: 1.15rem;
  font-weight: 600;
  color: #0f172a;
}

.subtotal-cell {
  font-weight: 600;
  color: #0f172a;
}

.total-amount {
  font-size: 1.40rem;
  font-weight: 200;
  color: #010201;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid #e2e8f0;
}

.btn {
  padding: 0.65rem 1.25rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.15s ease;
}

.btn-secondary {
  background-color: #f1f5f9;
  color: #475569;
}

.btn-secondary:hover {
  background-color: #e2e8f0;
}

.btn-primary {
  background-color: #2563eb;
  color: #ffffff;
}

.btn-primary:hover:not(:disabled) {
  background-color: #1d4ed8;
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
