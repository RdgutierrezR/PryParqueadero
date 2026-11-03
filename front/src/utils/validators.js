/** Validaciones básicas en el cliente (el backend valida de nuevo siempre). */

/** Normaliza una placa igual que el backend: mayúsculas, sin espacios ni guiones. */
export function normalizePlate(value) {
  return (value || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function validatePlate(value) {
  const plate = normalizePlate(value)
  if (plate.length < 3 || plate.length > 10) {
    return 'La placa debe tener entre 3 y 10 letras o números.'
  }
  return null
}

export function validatePersonForm(form) {
  const errors = {}
  if (!form.full_name || form.full_name.trim().length < 3) {
    errors.full_name = 'El nombre completo debe tener al menos 3 caracteres.'
  }
  if (!form.person_type) {
    errors.person_type = 'Selecciona el tipo de persona.'
  }
  return errors
}

export function validateVehicleForm(form) {
  const errors = {}
  const plateError = validatePlate(form.plate)
  if (plateError) errors.plate = plateError
  if (!form.vehicle_type) errors.vehicle_type = 'Selecciona el tipo de vehículo.'
  if (!form.person_id) errors.person_id = 'Selecciona la persona responsable.'
  return errors
}
