<template>
  <aside class="dashboard-sidebar">
    <div class="sidebar-brand">
      <div class="brand-text">
        <h2>Gestor de productos y ventas</h2>
      </div>
    </div>

    <nav class="sidebar-nav">
      <RouterLink to="/productos" class="nav-item" active-class="active">
        <span class="nav-label">Productos</span>
      </RouterLink>

      <RouterLink to="/ventas" class="nav-item" active-class="active">
        <span class="nav-label">Ventas</span>
      </RouterLink>
    </nav>

  </aside>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>

<style scoped>
.dashboard-sidebar {
  width: 250px;
  background-color: #111111;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 1.5rem 1rem;
  border-right: 1px solid #222222;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #222222;
  margin-bottom: 1.5rem;
}

.brand-text h2 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #ffffff;
  line-height: 1.2;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  color: #999999;
  text-decoration: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 500;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.nav-item:hover {
  background-color: #222222;
  color: #ffffff;
}

.nav-item.active {
  background-color: #333333;
  color: #ffffff;
  font-weight: 600;
}

.sidebar-footer {
  padding-top: 1rem;
  border-top: 1px solid #222222;
  text-align: center;
}

.footer-note {
  font-size: 0.75rem;
  color: #666666;
}
</style>
