import { Icon } from './Icon.jsx'

/** Campo de formulario con etiqueta, ayuda y error accesibles. */
export function FormField({
  label,
  htmlFor,
  error,
  hint,
  required = false,
  className = '',
  children,
}) {
  return (
    <div className={`form-group ${className}`.trim()}>
      {label && (
        <label htmlFor={htmlFor}>
          {label}
          {required && (
            <span className="field-required" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error && (
        <div className="field-error" id={htmlFor ? `${htmlFor}-error` : undefined}>
          <Icon name="alert-circle" size={13} />
          <span>{error}</span>
        </div>
      )}
      {!error && hint && <div className="field-hint">{hint}</div>}
    </div>
  )
}

export default FormField
