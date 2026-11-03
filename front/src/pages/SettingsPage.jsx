import { useCallback, useEffect, useState } from 'react'
import { settingService, userService } from '../services/settings.js'
import { Alert } from '../components/Alert.jsx'
import { Modal } from '../components/Modal.jsx'
import { ConfirmDialog } from '../components/ConfirmDialog.jsx'
import { DataTable } from '../components/DataTable.jsx'
import { PageHeader } from '../components/PageHeader.jsx'
import { FormField } from '../components/FormField.jsx'
import { RoleBadge, AccountBadge } from '../components/Badge.jsx'
import { Icon } from '../components/Icon.jsx'
import { useToast } from '../context/ToastContext.jsx'
import AdminLayout from '../layouts/AdminLayout.jsx'

const EMPTY_USER = { name: '', username: '', password: '', role: 'vigilante' }

export default function SettingsPage() {
  const toast = useToast()
  const [capacity, setCapacity] = useState('')
  const [isDemo, setIsDemo] = useState(false)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [capacityError, setCapacityError] = useState('')
  const [savingCapacity, setSavingCapacity] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [newUser, setNewUser] = useState(EMPTY_USER)
  const [errors, setErrors] = useState({})
  const [creating, setCreating] = useState(false)
  const [userToDeactivate, setUserToDeactivate] = useState(null)
  const [toggling, setToggling] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [settings, list] = await Promise.all([settingService.get(), userService.list()])
      setCapacity(settings.data.capacity)
      setIsDemo(settings.data.capacity_is_demo)
      setUsers(list.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const saveCapacity = async (event) => {
    event.preventDefault()
    const value = Number(capacity)
    if (!Number.isInteger(value) || value < 1) {
      setCapacityError('Ingresa un número entero mayor o igual a 1.')
      return
    }
    setCapacityError('')
    setSavingCapacity(true)
    try {
      const res = await settingService.update(value)
      setCapacity(res.data.capacity)
      setIsDemo(res.data.capacity_is_demo)
      toast.success('Capacidad actualizada', res.message || 'La capacidad del parqueadero se guardó.')
    } catch (err) {
      toast.error('No fue posible guardar la capacidad', err.message)
    } finally {
      setSavingCapacity(false)
    }
  }

  const openCreateUser = () => {
    setNewUser(EMPTY_USER)
    setErrors({})
    setModalOpen(true)
  }

  const createUser = async (event) => {
    event.preventDefault()
    const validation = {}
    if (newUser.name.trim().length < 3) validation.name = 'El nombre debe tener al menos 3 caracteres.'
    if (newUser.username.trim().length < 4) {
      validation.username = 'El usuario debe tener al menos 4 caracteres.'
    }
    if (newUser.password.length < 8) {
      validation.password = 'La contraseña debe tener al menos 8 caracteres.'
    }
    setErrors(validation)
    if (Object.keys(validation).length > 0) return

    setCreating(true)
    try {
      await userService.create({ ...newUser, name: newUser.name.trim(), username: newUser.username.trim() })
      toast.success('Cuenta creada', 'La cuenta quedó activa y lista para iniciar sesión.')
      setModalOpen(false)
      setNewUser(EMPTY_USER)
      load()
    } catch (err) {
      setErrors(err.errors || {})
      toast.error('No fue posible crear la cuenta', err.message)
    } finally {
      setCreating(false)
    }
  }

  const activateUser = async (user) => {
    try {
      await userService.setStatus(user.id, true)
      toast.success('Cuenta activada', `La cuenta de ${user.name} puede volver a iniciar sesión.`)
      load()
    } catch (err) {
      toast.error('No fue posible activar la cuenta', err.message)
    }
  }

  const deactivateUser = async () => {
    if (!userToDeactivate) return
    setToggling(true)
    try {
      await userService.setStatus(userToDeactivate.id, false)
      toast.success('Cuenta desactivada', `La cuenta de ${userToDeactivate.name} ya no puede iniciar sesión.`)
      setUserToDeactivate(null)
      load()
    } catch (err) {
      toast.error('No fue posible desactivar la cuenta', err.message)
    } finally {
      setToggling(false)
    }
  }

  const userColumns = [
    {
      key: 'name',
      header: 'Cuenta',
      render: (user) => (
        <div className="cell-identity">
          <span className="avatar sm" aria-hidden="true">
            {user.name.slice(0, 2).toUpperCase()}
          </span>
          <span>
            <div className="cell-main">{user.name}</div>
            <div className="cell-sub">@{user.username}</div>
          </span>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Rol',
      render: (user) => <RoleBadge role={user.role} />,
    },
    {
      key: 'is_active',
      header: 'Estado',
      render: (user) => <AccountBadge active={user.is_active} />,
    },
    {
      key: 'actions',
      header: 'Acciones',
      align: 'right',
      sortable: false,
      render: (user) => (
        <div className="row-actions">
          {user.is_active ? (
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              style={{ color: 'var(--red-600)' }}
              onClick={() => setUserToDeactivate(user)}
            >
              <Icon name="user-x" size={14} />
              Desactivar
            </button>
          ) : (
            <button type="button" className="btn btn-sm btn-secondary" onClick={() => activateUser(user)}>
              <Icon name="user-check" size={14} />
              Activar
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <AdminLayout title="Configuración">
      <PageHeader
        eyebrow="Sistema"
        title="Configuración"
        description="Capacidad del parqueadero y cuentas con acceso al sistema."
        actions={
          <button type="button" className="btn btn-secondary" onClick={load} disabled={loading}>
            <Icon name="refresh" size={16} />
            {loading ? 'Actualizando…' : 'Actualizar'}
          </button>
        }
      />

      {error && (
        <Alert type="error" title="No se pudo cargar la configuración">
          {error}
        </Alert>
      )}

      <section className="card" aria-labelledby="capacity-title">
        <div className="card-header">
          <div className="card-heading">
            <h2 className="card-title" id="capacity-title">
              <Icon name="parking" size={18} />
              Capacidad del parqueadero
            </h2>
            <p className="card-subtitle">
              Número máximo de vehículos que pueden permanecer dentro al mismo tiempo.
            </p>
          </div>
        </div>

        {isDemo && (
          <Alert type="warning" title="Valor de demostración">
            La capacidad actual es un valor de demostración. Ajusta la capacidad real cuando la
            universidad la confirme.
          </Alert>
        )}

        <form onSubmit={saveCapacity} noValidate>
          <div className="toolbar">
            <div className="toolbar-field">
              <FormField
                label="Capacidad total (vehículos)"
                htmlFor="capacity"
                required
                error={capacityError}
                hint="Debe ser un número entero positivo."
              >
                <input
                  id="capacity"
                  type="number"
                  min="1"
                  step="1"
                  className={`form-control${capacityError ? ' is-invalid' : ''}`}
                  value={capacity}
                  onChange={(event) => {
                    setCapacity(event.target.value)
                    if (capacityError) setCapacityError('')
                  }}
                  aria-invalid={Boolean(capacityError)}
                />
              </FormField>
            </div>
            <div className="toolbar-actions">
              <button type="submit" className="btn btn-primary" disabled={savingCapacity || loading}>
                {savingCapacity && <span className="spinner" />}
                {savingCapacity ? 'Guardando…' : 'Guardar capacidad'}
              </button>
            </div>
          </div>
        </form>
      </section>

      <section className="table-card" aria-labelledby="users-title">
        <div className="card-header">
          <div className="card-heading">
            <h2 className="card-title" id="users-title">
              <Icon name="users" size={18} />
              Cuentas del sistema
            </h2>
            <p className="card-subtitle">
              {users.length} {users.length === 1 ? 'cuenta registrada' : 'cuentas registradas'}.
              Las cuentas inactivas no pueden iniciar sesión.
            </p>
          </div>
          <button type="button" className="btn btn-primary btn-sm" onClick={openCreateUser}>
            <Icon name="plus" size={15} />
            Nueva cuenta
          </button>
        </div>

        <DataTable
          columns={userColumns}
          rows={users}
          loading={loading}
          emptyIcon="users"
          emptyTitle="Sin cuentas"
          emptyText="No hay cuentas registradas en el sistema."
          caption="Cuentas con acceso al sistema"
        />
      </section>

      {modalOpen && (
        <Modal
          title="Nueva cuenta"
          subtitle="La cuenta podrá iniciar sesión inmediatamente después de crearse."
          icon="user-check"
          onClose={() => setModalOpen(false)}
          busy={creating}
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setModalOpen(false)}
                disabled={creating}
              >
                Cancelar
              </button>
              <button type="submit" form="user-form" className="btn btn-primary" disabled={creating}>
                {creating && <span className="spinner" />}
                {creating ? 'Creando…' : 'Crear cuenta'}
              </button>
            </>
          }
        >
          <form id="user-form" onSubmit={createUser} noValidate>
            <div className="form-grid">
              <FormField label="Nombre completo" htmlFor="user-name" required error={errors.name}>
                <input
                  id="user-name"
                  className={`form-control${errors.name ? ' is-invalid' : ''}`}
                  value={newUser.name}
                  onChange={(event) => {
                    setNewUser({ ...newUser, name: event.target.value })
                    if (errors.name) setErrors({ ...errors, name: '' })
                  }}
                  autoComplete="off"
                  maxLength={120}
                />
              </FormField>

              <FormField label="Usuario" htmlFor="user-username" required error={errors.username}>
                <input
                  id="user-username"
                  className={`form-control${errors.username ? ' is-invalid' : ''}`}
                  value={newUser.username}
                  onChange={(event) => {
                    setNewUser({ ...newUser, username: event.target.value })
                    if (errors.username) setErrors({ ...errors, username: '' })
                  }}
                  autoComplete="off"
                  maxLength={40}
                />
              </FormField>
            </div>

            <FormField
              label="Contraseña"
              htmlFor="user-password"
              required
              error={errors.password}
              hint="Mínimo 8 caracteres. Se almacena de forma segura."
            >
              <input
                id="user-password"
                type="password"
                className={`form-control${errors.password ? ' is-invalid' : ''}`}
                value={newUser.password}
                onChange={(event) => {
                  setNewUser({ ...newUser, password: event.target.value })
                  if (errors.password) setErrors({ ...errors, password: '' })
                }}
                autoComplete="new-password"
                maxLength={120}
              />
            </FormField>

            <FormField label="Rol" htmlFor="user-role" required error={errors.role}>
              <select
                id="user-role"
                className="form-control"
                value={newUser.role}
                onChange={(event) => setNewUser({ ...newUser, role: event.target.value })}
              >
                <option value="vigilante">Vigilante</option>
                <option value="administrador">Administrador</option>
              </select>
            </FormField>
          </form>
        </Modal>
      )}

      {userToDeactivate && (
        <ConfirmDialog
          title="Desactivar cuenta"
          description={
            <>
              ¿Confirmas desactivar la cuenta de <strong>{userToDeactivate.name}</strong>? No podrá
              iniciar sesión hasta que se reactive.
            </>
          }
          confirmLabel="Desactivar cuenta"
          loading={toggling}
          onCancel={() => setUserToDeactivate(null)}
          onConfirm={deactivateUser}
        />
      )}
    </AdminLayout>
  )
}
