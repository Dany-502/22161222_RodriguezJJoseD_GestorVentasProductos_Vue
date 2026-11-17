import { ref, onMounted } from 'vue'
import apiClient from '@/services/apiClient.js'

export function useCrud(endpoint) {
  // Normaliza el endpoint para evitar duplicar '/api' con el baseURL de apiClient
  const cleanEndpoint = endpoint.startsWith('/api') ? endpoint.replace(/^\/api/, '') : endpoint

  const items = ref([])
  const isLoading = ref(false)
  const showModal = ref(false)
  const showDetailModal = ref(false)
  const isEditing = ref(false)
  const currentId = ref(null)
  const selectedItem = ref(null)
  const errorMessage = ref('')
  const feedbackMessage = ref('')
  const feedbackType = ref('success') // 'success' | 'error'

  // Funcion auxiliar que funciona como un timer de 4 segundos para limpiar los mensajes de feedback
  function showFeedback(message, type = 'success') {
    feedbackMessage.value = message
    feedbackType.value = type
    setTimeout(() => {
      if (feedbackMessage.value === message) {
        feedbackMessage.value = ''
      }
    }, 4000)
  }

  // Funcion auxiliar para extraer el mensaje de error de Spring Boot (mensaje, detalles, error) o Axios (message)
  function getErrorMessage(error, defaultMsg) {
    const data = error.response?.data
    if (!data) return error.message || defaultMsg
    if (data.mensaje) return data.mensaje
    if (data.detalles && typeof data.detalles === 'object') {
      return Object.values(data.detalles).join(', ')
    }
    return data.error || data.message || defaultMsg
  }

  // Metodo para obtener todos los elementos (GET /endpoint)
  async function loadItems() {
    // Actualiza el valor de isLoading a true, indica que se está cargando
    isLoading.value = true
    // Limpia el mensaje de error
    errorMessage.value = ''
    try {
      // Hace la peticion al microservicio para obtener todos los elementos
      const response = await apiClient.get(cleanEndpoint)
      // Verifica que la respuesta sea un objeto con una propiedad data que es un array
      if (response.data && Array.isArray(response.data.data)) {
        items.value = response.data.data
        // Verifica que la respuesta sea un array
      } else if (Array.isArray(response.data)) {
        items.value = response.data
        // Si la respuesta no es un objeto con data ni un array, se asigna un array vacío
      } else {
        items.value = []
      }
    } catch (error) {
      const msg = getErrorMessage(error, 'Error al cargar los datos del microservicio')
      errorMessage.value = msg
      showFeedback(msg, 'error')
      console.error(`Error en loadItems (${cleanEndpoint}):`, error)
    } finally {
      isLoading.value = false
    }
  }

  // Metodo para obtener un elemento por su ID (GET /endpoint/:id)
  async function viewItem(id) {
    isLoading.value = true
    errorMessage.value = ''
    try {
      // Hace la peticion al microservicio para obtener un elemento por su ID
      const response = await apiClient.get(`${cleanEndpoint}/${id}`)
      // Almacena el elemento obtenido en la variable selectedItem
      selectedItem.value = response.data?.data || response.data
      // Muestra el modal de detalle
      showDetailModal.value = true
      return selectedItem.value
    } catch (error) {
      const msg = getErrorMessage(error, `No se pudo obtener el detalle del registro #${id}`)
      errorMessage.value = msg
      showFeedback(msg, 'error')
      console.error(`Error en viewItem (${cleanEndpoint}/${id}):`, error)
      return null
    } finally {
      isLoading.value = false
    }
  }

  // Metodo para crear un nuevo elemento (POST /endpoint)
  async function createItem(payload) {
    // Actualiza el valor de isLoading a true, indica que se está cargando
    isLoading.value = true
    // Limpia el mensaje de error
    errorMessage.value = ''
    try {
      // Hace la peticion al microservicio para crear el registro
      const response = await apiClient.post(cleanEndpoint, payload)
      // Muestra un mensaje de feedback indicando que el registro se creó exitosamente
      showFeedback('Registro creado exitosamente')
      // Cierra el modal
      closeModal()
      // Recarga la lista de elementos
      await loadItems()
      return { success: true, data: response.data }
    } catch (error) {
      // En caso de error, muestra un mensaje de feedback indicando que el registro no se creó exitosamente
      const msg = getErrorMessage(error, 'Error al crear el registro')
      errorMessage.value = msg
      showFeedback(msg, 'error')
      console.error(`Error en createItem (${cleanEndpoint}):`, error)
      return { success: false, error: msg }
    } finally {
      // Finaliza la operacion de carga
      isLoading.value = false
    }
  }

  // Metodo para actualizar un elemento existente (PUT /endpoint/:id)
  async function updateItem(id, payload) {
    // Actualiza el valor de isLoading a true, indica que se está cargando
    isLoading.value = true
    // Limpia el mensaje de error
    errorMessage.value = ''
    try {
      // Hace la peticion al microservicio para actualizar el registro
      const response = await apiClient.put(`${cleanEndpoint}/${id}`, payload)
      // Muestra un mensaje de feedback indicando que el registro se actualizó exitosamente
      showFeedback('Registro actualizado exitosamente')
      // Cierra el modal
      closeModal()
      // Recarga la lista de elementos
      await loadItems()
      // Envia los datos actualizados
      return { success: true, data: response.data }
    } catch (error) {
      const msg = getErrorMessage(error, 'Error al actualizar el registro')
      errorMessage.value = msg
      showFeedback(msg, 'error')
      console.error(`Error en updateItem (${cleanEndpoint}/${id}):`, error)
      return { success: false, error: msg }
    } finally {
      isLoading.value = false
    }
  }

  // Metodo para eliminar un elemento (DELETE /endpoint/:id)
  async function deleteItem(id, confirmLabel = 'este registro') {
    const confirmed = window.confirm(`¿Estás seguro de que deseas eliminar permanentemente ${confirmLabel}?`)
    if (!confirmed) return false

    isLoading.value = true
    errorMessage.value = ''
    try {
      // Llama al microservicio para eliminar el registro mediante su ID
      await apiClient.delete(`${cleanEndpoint}/${id}`)
      showFeedback('Registro eliminado exitosamente')
      await loadItems()
      return true
    } catch (error) {
      const msg = getErrorMessage(error, 'Error al eliminar el registro')
      errorMessage.value = msg
      showFeedback(msg, 'error')
      console.error(`Error en deleteItem (${cleanEndpoint}/${id}):`, error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Manejo de estado de modales
  function openCreateModal() {
    isEditing.value = false
    currentId.value = null
    selectedItem.value = null
    errorMessage.value = ''
    showModal.value = true
  }

  function openEditModal(item) {
    isEditing.value = true
    currentId.value = item.id
    selectedItem.value = JSON.parse(JSON.stringify(item))
    errorMessage.value = ''
    showModal.value = true
  }

  function closeModal() {
    showModal.value = false
    selectedItem.value = null
    currentId.value = null
    errorMessage.value = ''
  }

  function closeDetailModal() {
    showDetailModal.value = false
    selectedItem.value = null
  }

  onMounted(() => {
    loadItems()
  })

  return {
    items,
    isLoading,
    showModal,
    showDetailModal,
    isEditing,
    currentId,
    selectedItem,
    errorMessage,
    feedbackMessage,
    feedbackType,
    loadItems,
    viewItem,
    createItem,
    updateItem,
    deleteItem,
    openCreateModal,
    openEditModal,
    closeModal,
    closeDetailModal,
    showFeedback
  }
}
