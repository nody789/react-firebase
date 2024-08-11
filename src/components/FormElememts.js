const FormErrorMsg = ({ errors, name }) => {
    return (
      errors[name] && (
        <div className='invalid-feedback'>{errors?.[name]?.message}</div>
      )
    );
  };

export const Input = ({
    register,
    errors,
    id,
    type,
    labelText,
    rules,
    placeholder = '',
    onChange,
  }) => {
    return (
      <>
        <label htmlFor={id} className='form-label'>
          {labelText}
        </label>
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          className={`form-control mb-3 ${errors[id] ? 'is-invalid' : ''}`}
          {...register(id, rules)}
          onChange={onChange}
        />
        <FormErrorMsg errors={errors} name={id} />
      </>
    );
  };
  
  export const Textarea = ({
    id, labelText, register, type, errors, rules, rows
  }) => {
    return (
      <>
      <label htmlFor={id} className='form-label'>
            {labelText}
          </label>
          <textarea
            id={id}
            type={type}
            rows={rows}
            className={`form-control  ${errors[id] && 'is-invalid'}`}
            {...register(id, rules)}
          />
          {errors[id] && (
            <div className='invalid-feedback'>{errors[id]?.message}</div>
          )}
      </>
    );
  };