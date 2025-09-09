import React from 'react';
import { RiCheckLine, RiCloseLine } from 'react-icons/ri';

const FormValidation = ({ errors, touched, fieldName }) => {
  const hasError = errors[fieldName] && touched[fieldName];
  const isValid = !errors[fieldName] && touched[fieldName];

  if (!touched[fieldName]) return null;

  return (
    <div className={`form-validation ${hasError ? 'error' : 'success'}`}>
      {hasError ? (
        <>
          <RiCloseLine className="validation-icon" />
          {errors[fieldName]}
        </>
      ) : isValid ? (
        <>
          <RiCheckLine className="validation-icon" />
          Valid
        </>
      ) : null}
    </div>
  );
};

export default FormValidation; 