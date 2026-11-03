import { useCallback, useEffect, useState } from 'react'
import { personService } from '../services/persons.js'
import { Modal } from '../components/Modal.jsx'
import { ConfirmDialog } from '../components/ConfirmDialog.jsx'
import { DataTable } from '../components/DataTable.jsx'
import { PageHeader } from '../components/PageHeader.jsx'
import { FormField } from '../components/FormField.jsx'
import { Badge } from '../components/Badge.jsx'
import { Icon } from '../components/Icon.jsx'
import { useToast } from '../context/ToastContext.jsx'
import AdminLayout from '../layouts/AdminLayout.jsx'
import { PERSON_TYPE_LABELS } from '../utils/format.js'
import { validatePersonForm } from '../utils/validators.js'

const EMPTY = { full_name: '', person_type: '', institutional_code: '', contact: '' }

const PERSON_TONES = {
  estudiante: 'info',
  docente: 'violet',
  administrativo: 'success',
  visitante: 'warning',
}

export default function PersonsPage() {
  const toast = useToast()
  const [persons, setPersons] = useState([])
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [personToDelete, setPersonToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Búsqueda con retardo para no consultar en cada pulsación.
  useEffect(() => {
    const id = window.setTimeout(() => setSearch(query.trim()), 300)
    return () => window.clearTimeout(id)
  }, [query])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await personService.list(search)
      setPersons(res.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY)
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = (person) => {
    setEditing(person)
    setForm({
      full_name: person.full_name,
      person_type: person.person_type,
      institutional_code: person.institutional_code || '',
      contact: person.contact || '',
    })
    setErrors({})
    setModalOpen(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validation = validatePersonForm(form)
    setErrors(validation)
    if (Object.keys(validation).length > 0) return

    setSaving(true)
    try {
      if (editing) {
        await personService.update(editing.id, form)
        toast.success('Persona actualizada', 'Los datos se guardaron correctamente.')
      } else {
        await personService.create(form)
        toast.success('Persona registrada', 'La persona quedó disponible para asociar vehículos.')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      setErrors(err.errors || {})
      toast.error('No fue posible guardar la persona', err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!personToDelete) return
    setDeleting(true)
    try {
      await personService.remove(personToDelete.id)
      toast.success('Persona eliminada', 'El registro se eliminó correctamente.')
      setPersonToDelete(null)
      load()
    } catch (err) {
      toast.error('No fue posible eliminar la persona', err.message)
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    {
      key: 'full_name',
      header: 'Persona',
      render: (person) => (
        <div className="cell-identity">
          <span className="avatar sm" aria-hidden="true">
            {person.full_name.slice(0, 2).toUpperCase()}
          </span>
          <span>
            <div className="cell-main">{person.full_name}</div>
            <div className="cell-sub">
              {person.institutional_code ? `Código ${person.institutional_code}` : 'Sin código institucional'}
            </div>
          </span>
        </div>
      ),
    },
    {
      key: 'person_type',
      header: 'Tipo',
      sortAccessor: (person) => PERSON_TYPE_LABELS[person.person_type] || person.person_type,
      render: (person) => (
        <Badge tone={PERSON_TONES[person.person_type] || 'neutral'} dot>
          {PERSON_TYPE_LABELS[person.person_type] || person.person_type}
        </Badge>
      ),
    },
    {
      key: 'contact',
      header: 'Contacto',
      render: (person) => person.contact || <span className="text-subtle">Sin contacto</span>,
    },
    {
      key: 'vehicle_count',
      header: 'Vehículos',
      align: 'center',
      render: (person) => (
        <Badge tone={person.vehicle_count > 0 ? 'info' : 'neutral'}>{person.vehicle_count}</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      align: 'right',
      sortable: false,
      render: (person) => (
        <div className="row-actions">
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={() => openEdit(person)}
            aria-label={`Editar a ${person.full_name}`}
          >
            <Icon name="edit" size={14} />
            Editar
          </button>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => setPersonToDelete(person)}
            aria-label={`Eliminar a ${person.full_name}`}
            style={{ color: 'var(--red-600)' }}
          >
            <Icon name="trash" size={14} />
            Eliminar
          </button>
        </div>
      ),
    },
  ]

  return (
    <AdminLayout title="Personas">
      <PageHeader
        eyebrow="Gestión"
        title="Personas"
        description="Responsables de los vehículos registrados en el sistema."
        actions={
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <Icon name="plus" size={16} />
            Registrar persona
          </button>
        }
      />

      <section className="table-card" aria-labelledby="persons-title">
        <div className="card-header">
          <div className="card-heading">
            <h2 className="card-title" id="persons-title">
              <Icon name="users" size={18} />
              Personas registradas
            </h2>
            <p className="card-subtitle">
              {loading
                ? 'Consultando personas…'
                : `${persons.length} ${persons.length === 1 ? 'persona encontrada' : 'personas encontradas'}.`}
            </p>
          </div>

          <div className="search-field" style={{ width: 'min(280px, 100%)' }}>
            <span className="search-icon" aria-hidden="true">
              <Icon name="search" size={16} />
            </span>
            <input
              className="form-control"
              placeholder="Buscar por nombre…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Buscar personas por nombre"
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          rows={persons}
          loading={loading}
          error={error}
          onRetry={load}
          emptyIcon="users"
          emptyTitle="Sin personas"
          emptyText={
            search
              ? 'No hay personas que coincidan con la búsqueda.'
              : 'Registra la primera persona para poder asociar vehículos.'
          }
          caption="Personas registradas como responsables de vehículos"
        />
      </section>

      {modalOpen && (
        <Modal
          title={editing ? 'Editar persona' : 'Registrar persona'}
          subtitle={
            editing
              ? 'Actualiza los datos de contacto o el tipo de persona.'
              : 'La persona podrá asociarse a uno o varios vehículos.'
          }
          icon={editing ? 'edit' : 'users'}
          onClose={() => setModalOpen(false)}
          busy={saving}
          footer={
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setModalOpen(false)}
                disabled={saving}
              >
                Cancelar
              </button>
              <button type="submit" form="person-form" className="btn btn-primary" disabled={saving}>
                {saving && <span className="spinner" />}
                {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Registrar persona'}
              </button>
            </>
          }
        >
          <form id="person-form" onSubmit={handleSubmit} noValidate>
            <FormField
              label="Nombre completo"
              htmlFor="person-name"
              required
              error={errors.full_name}
              hint="Como aparece en la documentación institucional."
            >
              <input
                id="person-name"
                className={`form-control${errors.full_name ? ' is-invalid' : ''}`}
                value={form.full_name}
                onChange={(event) => {
                  setForm({ ...form, full_name: event.target.value })
                  if (errors.full_name) setErrors({ ...errors, full_name: '' })
                }}
                placeholder="Ej: Ana María Rodríguez"
                maxLength={150}
                aria-invalid={Boolean(errors.full_name)}
              />
            </FormField>

            <FormField
              label="Tipo de persona"
              htmlFor="person-type"
              required
              error={errors.person_type}
            >
              <select
                id="person-type"
                className={`form-control${errors.person_type ? ' is-invalid' : ''}`}
                value={form.person_type}
                onChange={(event) => {
                  setForm({ ...form, person_type: event.target.value })
                  if (errors.person_type) setErrors({ ...errors, person_type: '' })
                }}
                aria-invalid={Boolean(errors.person_type)}
              >
                <option value="">Selecciona una opción…</option>
                {Object.entries(PERSON_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </FormField>

            <div className="form-grid">
              <FormField
                label="Código institucional"
                htmlFor="person-code"
                error={errors.institutional_code}
                hint="Opcional. Solo si aplica."
              >
                <input
                  id="person-code"
                  className={`form-control${errors.institutional_code ? ' is-invalid' : ''}`}
                  value={form.institutional_code}
                  onChange={(event) => setForm({ ...form, institutional_code: event.target.value })}
                  maxLength={40}
                />
              </FormField>

              <FormField
                label="Contacto"
                htmlFor="person-contact"
                error={errors.contact}
                hint="Correo o teléfono de contacto."
              >
                <input
                  id="person-contact"
                  className={`form-control${errors.contact ? ' is-invalid' : ''}`}
                  value={form.contact}
                  onChange={(event) => setForm({ ...form, contact: event.target.value })}
                  maxLength={120}
                />
              </FormField>
            </div>
          </form>
        </Modal>
      )}

      {personToDelete && (
        <ConfirmDialog
          title="Eliminar persona"
          description={
            <>
              ¿Confirmas la eliminación de <strong>{personToDelete.full_name}</strong>? Esta acción no
              se puede deshacer.
            </>
          }
          confirmLabel="Eliminar persona"
          loading={deleting}
          onCancel={() => setPersonToDelete(null)}
          onConfirm={handleDelete}
        >
          {personToDelete.vehicle_count > 0 && (
            <p className="mt-1" style={{ fontSize: '0.82rem' }}>
              La persona tiene {personToDelete.vehicle_count}{' '}
              {personToDelete.vehicle_count === 1 ? 'vehículo asociado' : 'vehículos asociados'}. El
              sistema impedirá la eliminación si existen vehículos vinculados.
            </p>
          )}
        </ConfirmDialog>
      )}
    </AdminLayout>
  )
}
