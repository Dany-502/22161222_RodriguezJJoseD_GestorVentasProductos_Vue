<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="handleCloseModal">
    <div class="modal-dialog">
      <div class="modal-header">
        <h3 class="modal-title">
          {{ isEditing ? 'Editar Producto' : 'Nuevo Producto' }}
        </h3>
        <button class="btn-close" @click="handleCloseModal">✕</button>
      </div>

      <form @submit.prevent="handleSubmitForm" class="modal-body">
        <div v-if="errorMessage" class="alert-error">
          {{ errorMessage }}
        </div>

        <div class="form-group">
          <label for="nombre">Nombre del Producto *</label>
          <input
            id="nombre"
            v-model.trim="formData.nombre"
            type="text"
            minlength="5"
            maxlength="100"
            placeholder="ej. Teclado Mecánico RGB"
            required
            class="form-control"
          />
          <span class="text-hint">Entre 5 y 100 caracteres</span>
        </div>

        <div class="form-row">
          <div class="form-group col-half">
            <label for="precio">Precio Unitario ($) *</label>
            <input
              id="precio"
              v-model.number="formData.precio"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="ej. 1250.50"
              required
              class="form-control"
            />
          </div>

          <div class="form-group col-half">
            <label for="stock">Stock Disponible *</label>
            <input
              id="stock"
              v-model.number="formData.stock"
              type="number"
              min="0"
              step="1"
              placeholder="ej. 15"
              required
              class="form-control"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="descripcion">
            Descripción
            <span class="text-hint">(opcional, máx 500 caracteres)</span>
          </label>
          <textarea
            id="descripcion"
            v-model.trim="formData.descripcion"
            maxlength="500"
            rows="3"
            placeholder="Descripción detallada del producto..."
            class="form-control textarea"
          ></textarea>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="handleCloseModal">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
            {{ isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear Producto') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch, computed } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  productoToEdit: {
    type: Object,
    default: null
  },
  itemToEdit: {
    type: Object,
    default: null
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

const emit = defineEmits(['closeModal', 'submitProducto', 'submitForm'])

const activeEdit = computed(() => props.productoToEdit || props.itemToEdit || null)
const isEditing = computed(() => !!activeEdit.value)

const formData = reactive({
  nombre: '',
  precio: '',
  stock: '',
  descripcion: ''
})

function populateForm() {
  const current = activeEdit.value
  if (current) {
    formData.nombre = current.nombre || ''
    formData.precio = current.precio ?? ''
    formData.stock = current.stock ?? ''
    formData.descripcion = current.descripcion || ''
  } else {
    resetForm()
  }
}

function resetForm() {
  formData.nombre = ''
  formData.precio = ''
  formData.stock = ''
  formData.descripcion = ''
}

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      populateForm()
    }
  }
)

function handleCloseModal() {
  emit('closeModal')
}

function handleSubmitForm() {
  const payload = {
    nombre: formData.nombre,
    precio: Number(formData.precio),
    stock: Number(formData.stock),
    descripcion: formData.descripcion || ''
  }

  emit('submitProducto', payload)
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
  max-width: 520px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  animation: modalFadeIn 0.2s ease-out;
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

.alert-error {
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.col-half {
  flex: 1;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #334155;
  margin-bottom: 0.35rem;
}

.text-hint {
  display: block;
  font-weight: normal;
  color: #94a3b8;
  font-size: 0.8rem;
  margin-top: 0.25rem;
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

.textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
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
