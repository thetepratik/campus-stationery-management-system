const Input = ({ label, error, hint, id, type = 'text', register, ...rest }) => {
  return (
    <div className="form-group">
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
        </label>
      )}
      <input id={id} type={type} className="form-input" {...(register || {})} {...rest} />
      {error && <span className="form-error">{error}</span>}
      {!error && hint && <span className="form-hint">{hint}</span>}
    </div>
  );
};

export default Input;
