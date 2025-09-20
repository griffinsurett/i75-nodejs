// frontend/src/components/form/withAutosave.jsx
import { useEffect, useState, useRef } from 'react';
import useFormAutosave from '../../hooks/useFormAutosave';
import AutosaveNotification from './AutosaveNotification';

/**
 * Higher-order component that adds autosave functionality to forms
 */
export default function withAutosave(FormComponent, autosaveConfig = {}) {
  const { formKey, excludeFields = [] } = autosaveConfig;

  return function AutosaveForm(props) {
    const { mode = 'create', entityId, initialData, onSubmitSuccess, ...restProps } = props;
    const isEdit = mode === 'edit';
    const [lastSaved, setLastSaved] = useState(null);
    const formDataRef = useRef({});

    const {
      saveFormData,
      restoreFormData,
      clearAutosave,
      hasAutosaveData,
      getAutosaveInfo,
    } = useFormAutosave(
      formKey,
      isEdit ? entityId : null,
      initialData || {},
      {
        excludeFields,
        enabled: !isEdit, // Only autosave for new forms by default
      }
    );

    // Track form changes
    const handleFormChange = (data) => {
      formDataRef.current = data;
      saveFormData(data);
      setLastSaved(Date.now());
    };

    // Handle successful submission
    const handleSubmitSuccess = (...args) => {
      clearAutosave();
      if (onSubmitSuccess) {
        onSubmitSuccess(...args);
      }
    };

    // Handle restore
    const handleRestore = () => {
      const restoredData = restoreFormData();
      if (restoredData && props.onRestore) {
        props.onRestore(restoredData);
      }
    };

    return (
      <>
        <AutosaveNotification
          autosaveInfo={hasAutosaveData() ? getAutosaveInfo() : null}
          onRestore={handleRestore}
          onDiscard={clearAutosave}
          lastSaved={lastSaved}
        />
        <FormComponent
          {...restProps}
          mode={mode}
          entityId={entityId}
          initialData={initialData}
          onFormChange={handleFormChange}
          onSubmitSuccess={handleSubmitSuccess}
        />
      </>
    );
  };
}