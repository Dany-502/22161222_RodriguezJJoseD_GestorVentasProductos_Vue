<template>
  <div class="view-container">
    <!-- Encabezado de la Vista -->
    <header class="view-header">
      <div>
        <h1 class="view-title">Gestión de Ventas</h1>
        <p class="view-subtitle">Historial y registro de ventas realizadas en el sistema</p>
      </div>
      <button class="btn btn-primary" @click="handleOpenCreateModal">
        <span>+</span> Realizar Venta
      </button>
    </header>

    <!-- Notificación Toast / Alerta -->
    <div
      v-if="feedbackMessage"
      :class="['alert-banner', feedbackType === 'success' ? 'alert-success' : 'alert-error']"
    >
      <span>{{ feedbackMessage }}</span>
      <button class="alert-close" @click="feedbackMessage = ''">✕</button>
    </div>

    <!-- Barra de Filtros y Búsqueda -->
    <section class="filters-bar">
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar venta por folio (#ID) o producto..."
          class="search-input"
        />
      </div>

      <button
        class="btn btn-secondary btn-reload"
        @click="loadVentas"
        :disabled="isLoading"
      >
        Refrescar
      </button>
    </section>

    <!-- Tabla Principal de Ventas -->
    <section class="table-container">
      <div v-if="isLoading" class="loading-state">
        <p>Cargando lista de ventas...</p>
      </div>

      <div v-else-if="filteredVentas.length === 0" class="empty-state">
        <p>No se encontraron registros de ventas.</p>
      </div>

      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Folio</th>
            <th>Fecha de Venta</th>
            <th>Productos Comprados</th>
            <th>Total Venta</th>
            <th class="text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="venta in filteredVentas" :key="venta.id">
            <td class="font-bold">#{{ venta.id }}</td>
            <td>
              <div class="date-cell">
                <span>{{ formatDate(venta.fechaVenta) }}</span>
              </div>
            </td>
            <td>
              <span class="badge badge-count">
                {{ venta.items?.length || 0 }} {{ (venta.items?.length === 1) ? 'producto' : 'productos' }}
              </span>
            </td>
            <td class="font-bold font-price">${{ Number(venta.total).toFixed(2) }}</td>
            <td class="text-right actions-cell">
              <button
                class="btn-action btn-view"
                title="Ver Detalle"
                @click="openDetailModal(venta)"
              >
                Ver Detalle
              </button>
              <button
                class="btn-action btn-edit"
                title="Editar Venta"
                @click="handleOpenEditModal(venta)"
              >
                Editar
              </button>
              <button
                class="btn-action btn-delete"
                title="Eliminar Venta"
                @click="handleDeleteVenta(venta.id)"
              >
                Eliminar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Modal para Detalle de Venta / Ticket -->
    <div v-if="isDetailModalOpen" class="modal-backdrop" @click.self="closeDetail">
      <div class="modal-dialog modal-dialog-lg">
        <div class="modal-header">
          <h3 class="modal-title">Detalle de Venta #{{ selectedDetailVenta?.id }}</h3>
          <button class="btn-close" @click="closeDetail">✕</button>
        </div>
        <div class="modal-body">
          <div class="ticket-header">
            <div>
              <p class="ticket-label">Fecha de Venta:</p>
              <p class="ticket-value">{{ formatDate(selectedDetailVenta?.fechaVenta) }}</p>
            </div>
            <div class="text-right">
              <p class="ticket-label">Total Liquidado:</p>
              <p class="ticket-total">${{ Number(selectedDetailVenta?.total).toFixed(2) }}</p>
            </div>
          </div>

          <h4 class="section-subtitle">Desglose de Productos</h4>
          <div class="table-responsive">
            <table class="items-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th class="text-center">Cantidad</th>
                  <th class="text-right">Precio Unitario</th>
                  <th class="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in selectedDetailVenta?.items" :key="item.id || item.idProducto || item.productoId">
                  <td class="font-medium">{{ item.nombreProducto || `Producto #${item.idProducto || item.productoId}` }}</td>
                  <td class="text-center">{{ item.cantidad }}</td>
                  <td class="text-right">${{ Number(item.precioUnitario).toFixed(2) }}</td>
                  <td class="text-right font-bold">${{ Number(item.subtotal).toFixed(2) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeDetail">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para Realizar / Editar Venta -->
    <VentaFormModal
      :is-open="isFormModalOpen"
      :venta-to-edit="selectedVentaToEdit"
      :productos-list="productosDisponibles"
      :error-message="formErrorMessage"
      :is-submitting="isLoading"
      @close-modal="closeModals"
      @submit-venta="handleSaveVenta"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCrud } from '@/composables/useCrudComposables.js'
import apiClient from '@/services/apiClient.js'
import VentaFormModal from '@/icons/ventaFormModal.components.vue'

// Consumo modular a través del composable useCrud
const {
  items: ventasList,
  isLoading,
  showModal: isFormModalOpen,
  isEditing,
  currentId,
  selectedItem: selectedVentaToEdit,
  errorMessage: formErrorMessage,
  feedbackMessage,
  feedbackType,
  loadItems: loadVentas,
  createItem,
  updateItem,
  deleteItem,
  openCreateModal,
  openEditModal,
  closeModal: closeModals
} = useCrud('/ventas')

// Estados locales para el modal de detalle y catálogo de productos
const searchQuery = ref('')
const productosDisponibles = ref([])
const isDetailModalOpen = ref(false)
const selectedDetailVenta = ref(null)

// Filtro en tiempo real por ID de venta o nombre de algún producto comprado
const filteredVentas = computed(() => {
  return ventasList.value.filter((venta) => {
    const q = searchQuery.value.toLowerCase().trim()
    if (!q) return true

    const matchesId = venta.id ? String(venta.id).includes(q) : false
    const matchesProduct = Array.isArray(venta.items)
      ? venta.items.some((item) =>
          item.nombreProducto
            ? item.nombreProducto.toLowerCase().includes(q)
            : false
        )
      : false

    return matchesId || matchesProduct
  })
})

// Cargar catálogo de productos para poblar el combobox del modal de ventas
async function loadProductosCatalogo() {
  try {
    const res = await apiClient.get('/productos')
    productosDisponibles.value = Array.isArray(res.data) ? res.data : (res.data?.data || [])
  } catch (error) {
    console.error('Error al cargar catálogo de productos para ventas:', error)
  }
}

// Abrir modal de creación cargando antes los productos más actualizados
async function handleOpenCreateModal() {
  await loadProductosCatalogo()
  openCreateModal()
}

// Abrir modal de edición
async function handleOpenEditModal(venta) {
  await loadProductosCatalogo()
  openEditModal(venta)
}

// Abrir modal de detalle
function openDetailModal(venta) {
  selectedDetailVenta.value = venta
  isDetailModalOpen.value = true
}

function closeDetail() {
  isDetailModalOpen.value = false
  selectedDetailVenta.value = null
}

// Guardar venta (crear o actualizar)
async function handleSaveVenta(payload) {
  if (isEditing.value) {
    await updateItem(currentId.value, payload)
  } else {
    await createItem(payload)
  }
}

// Eliminar venta
async function handleDeleteVenta(id) {
  await deleteItem(id, `la venta #${id}`)
}

// Formateador de fechas
function formatDate(dateString) {
  if (!dateString) return 'N/D'
  try {
    const date = new Date(dateString)
    return isNaN(date.getTime()) ? String(dateString) : date.toLocaleDateString()
  } catch {
    return String(dateString)
  }
}

onMounted(async () => {
  await loadProductosCatalogo()
})
</script>

<style scoped>
.view-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.view-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #0f172a;
}

.view-subtitle {
  color: #64748b;
  font-size: 0.95rem;
  margin-top: 0.25rem;
}

.alert-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem 1.25rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
  font-weight: 500;
}

.alert-success {
  background-color: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.alert-error {
  background-color: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.alert-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  color: inherit;
}

.filters-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 260px;
  display: flex;
  align-items: center;
  background-color: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0 0.75rem;
}

.search-input {
  width: 100%;
  border: none;
  outline: none;
  padding: 0.65rem 0;
  font-size: 0.95rem;
}

.btn-reload {
  margin-left: auto;
}

.table-container {
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.data-table th {
  background-color: #f8fafc;
  padding: 0.85rem 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #64748b;
  border-bottom: 1px solid #e2e8f0;
}

.data-table td {
  padding: 0.9rem 1rem;
  font-size: 0.9rem;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.data-table tr:hover {
  background-color: #f8fafc;
}

.date-cell {
  font-weight: 500;
  color: #334155;
}

.font-price {
  color: #16a34a;
  font-size: 0.95rem;
}

.badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
  text-transform: capitalize;
}

.badge-count {
  background-color: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

.actions-cell {
  display: flex;
  gap: 0.4rem;
  justify-content: flex-end;
}

.btn-action {
  background-color: #f1f5f9;
  border: 1px solid #cbd5e1;
  padding: 0.35rem 0.65rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.15s ease;
}

.btn-action:hover {
  background-color: #e2e8f0;
}

.btn-view:hover {
  background-color: #eff6ff;
  border-color: #bfdbfe;
  color: #1d4ed8;
}

.btn-delete:hover {
  background-color: #fee2e2;
  border-color: #fca5a5;
  color: #dc2626;
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

.btn-primary {
  background-color: #2563eb;
  color: #ffffff;
}

.btn-primary:hover {
  background-color: #1d4ed8;
}

.btn-secondary {
  background-color: #ffffff;
  border: 1px solid #cbd5e1;
  color: #334155;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #f8fafc;
}

.loading-state,
.empty-state {
  padding: 3rem;
  text-align: center;
  color: #64748b;
}

.text-right {
  text-align: right;
}

.text-center {
  text-align: center;
}

.font-bold {
  font-weight: 600;
}

.font-medium {
  font-weight: 500;
}

/* Estilos para el Modal de Detalle */
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
  max-width: 650px;
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
}

.ticket-header {
  display: flex;
  justify-content: space-between;
  background-color: #f8fafc;
  padding: 1rem 1.25rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  margin-bottom: 1.25rem;
}

.ticket-label {
  font-size: 0.8rem;
  color: #64748b;
  margin-bottom: 0.2rem;
}

.ticket-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: #0f172a;
}

.ticket-total {
  font-size: 1.35rem;
  font-weight: 700;
  color: #16a34a;
}

.section-subtitle {
  font-size: 1.2rem;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 0.75rem;
}

.table-responsive {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 1rem;
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

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid #e2e8f0;
}
</style>
