// frontend/src/components/forms/Form.jsx
import {
  useEffect,
  useState,
  forwardRef,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Save, RotateCcw } from "lucide-react";
import { debounce } from "lodash";
import { useForm } from "./hooks/useForm";
import { FormError } from "./FormError";
import { FormActions } from "./FormActions";
import useFormAutosave from "./hooks/useFormAutosave";

export const Form = forwardRef(
  (
    {
      // Basic form props
      children,
      className = "",

      // Form configuration
      initialValues = {},
      validation,
      transformOnSubmit,

      // Data loading (optional)
      loadData,
      dependencies = [],

      // Submit handling
      onSubmit,
      submitLabel = "Submit",
      navigateOnSuccess,

      // Cancel handling
      onCancel,
      cancelLabel = "Cancel",
      showCancel = true,

      // UI options
      showActions = true,
      showError = true,
      actionsProps = {},

      // Loading state
      loadingText = "Loading...",
      showLoadingState = true,

      // AUTOSAVE OPTIONS
      autosave = false,
      autosaveKey = null,
      autosaveMode = "create",
      autosaveEntityId = null,
      autosaveExcludeFields = [],
      showAutosaveIndicator = true,
      autosaveDebounceMs = 1000,

      ...formProps
    },
    ref
  ) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [additionalData, setAdditionalData] = useState(null);
    const [showRestorePrompt, setShowRestorePrompt] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const lastSaveTimeout = useRef(null);
    const hasRestoredRef = useRef(false);
    const previousValues = useRef(null);
    const isInitialMount = useRef(true);

    // Determine if autosave should be enabled
    const autosaveEnabled = autosave && autosaveMode === "create";

    // Initialize autosave hook
    const {
      saveFormData,
      restoreFormData,
      clearAutosave,
      hasAutosaveData,
      getAutosaveInfo,
    } = useFormAutosave(
      autosaveKey || "form",
      autosaveEntityId,
      initialValues,
      {
        enabled: autosaveEnabled,
        excludeFields: autosaveExcludeFields,
      }
    );

    // Initialize form
    const form = useForm(initialValues, {
      validate: validation,
      transformOnSubmit,
      onSubmit: async (values) => {
        const result = await onSubmit(values, form, additionalData);

        // Clear autosave on successful submit
        if (autosaveEnabled && result !== false) {
          console.log("[Autosave] Clearing after successful submit");
          clearAutosave();
          hasRestoredRef.current = false;
          previousValues.current = null;
        }

        // Handle navigation
        if (result?.navigateTo) {
          navigate(result.navigateTo);
        } else if (navigateOnSuccess) {
          const path =
            typeof navigateOnSuccess === "function"
              ? navigateOnSuccess(result, values)
              : navigateOnSuccess;
          navigate(path);
        }

        return result;
      },
    });

    // Create debounced save function
    const debouncedSave = useMemo(
      () =>
        debounce((values) => {
          console.log(
            "[Autosave] Debounced save triggered with values:",
            values
          );

          // Don't save empty forms
          const hasContent = Object.keys(values).some((key) => {
            const value = values[key];
            return (
              value !== "" &&
              value !== null &&
              value !== undefined &&
              !(Array.isArray(value) && value.length === 0)
            );
          });

          if (!hasContent) {
            console.log("[Autosave] Skipping save - form is empty");
            return;
          }

          // Save to localStorage
          saveFormData(values);
          previousValues.current = { ...values };

          // Show save indicator
          setLastSaved(Date.now());

          // Clear previous timeout
          if (lastSaveTimeout.current) {
            clearTimeout(lastSaveTimeout.current);
          }

          // Hide indicator after 2 seconds
          lastSaveTimeout.current = setTimeout(() => {
            setLastSaved(null);
          }, 2000);
        }, autosaveDebounceMs),
      [saveFormData, autosaveDebounceMs]
    );

    // Check for autosaved data on mount
    useEffect(() => {
      if (!autosaveEnabled) return;

      const timer = setTimeout(() => {
        const hasSavedData = hasAutosaveData();
        console.log(
          "[Autosave] Checking for saved data on mount:",
          hasSavedData
        );

        if (hasSavedData && !hasRestoredRef.current && !loading) {
          setShowRestorePrompt(true);
        }
      }, 200);

      return () => clearTimeout(timer);
    }, []); // Only run once on mount

    // Watch for form value changes
    useEffect(() => {
      // Skip initial mount
      if (isInitialMount.current) {
        isInitialMount.current = false;
        previousValues.current = { ...form.values };
        return;
      }

      // Don't autosave if disabled or loading
      if (!autosaveEnabled || loading) {
        return;
      }

      // Check if values actually changed
      const valuesChanged =
        JSON.stringify(previousValues.current) !== JSON.stringify(form.values);

      if (valuesChanged) {
        console.log("[Autosave] Form values changed:", {
          previous: previousValues.current,
          current: form.values,
        });

        // Trigger debounced save
        debouncedSave(form.values);
      }

      // Cleanup
      return () => {
        debouncedSave.cancel();
      };
    }, [form.values, autosaveEnabled, loading, debouncedSave]);

    // Handle data loading
    useEffect(() => {
      if (!loadData) return;

      let cancelled = false;

      (async () => {
        try {
          setLoading(true);
          const result = await loadData();

          if (cancelled) return;

          // If result has formData property, use it for form values
          if (result?.formData) {
            console.log(
              "[Form] Setting values from loadData:",
              result.formData
            );
            form.setFieldValues(result.formData);
            setAdditionalData(result);
            // Update previous values to prevent autosave on data load
            previousValues.current = { ...result.formData };
          }
          // If result is just form values
          else if (result && typeof result === "object") {
            // Check if it looks like form data or additional data
            if (result.courses || result.instructors || result.data) {
              // It's additional data
              setAdditionalData(result);
            } else {
              // It's form data
              console.log("[Form] Setting values:", result);
              form.setFieldValues(result);
              previousValues.current = { ...result };
            }
          }
        } catch (error) {
          console.error("[Form] Failed to load data:", error);
          if (showError && !cancelled) {
            form.setSubmitError(error?.message || "Failed to load data");
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      })();

      return () => {
        cancelled = true;
      };
    }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps

    // Handle restore
    const handleRestore = useCallback(() => {
      const restoredData = restoreFormData();
      console.log("[Autosave] Restoring data:", restoredData);

      if (restoredData) {
        form.setFieldValues(restoredData);
        previousValues.current = { ...restoredData };
        hasRestoredRef.current = true;
        setShowRestorePrompt(false);
      }
    }, [restoreFormData, form]);

    // Handle discard
    const handleDiscard = useCallback(() => {
      console.log("[Autosave] Discarding saved data");
      clearAutosave();
      hasRestoredRef.current = false;
      previousValues.current = { ...form.values };
      setShowRestorePrompt(false);
    }, [clearAutosave, form.values]);

    // Handle cancel
    const handleCancel = useCallback(() => {
      if (autosaveEnabled) {
        clearAutosave();
      }

      if (onCancel) {
        onCancel();
      } else {
        navigate(-1);
      }
    }, [autosaveEnabled, clearAutosave, onCancel, navigate]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (lastSaveTimeout.current) {
          clearTimeout(lastSaveTimeout.current);
        }
        debouncedSave.cancel();
      };
    }, [debouncedSave]);

    // Show loading state
    if (showLoadingState && loading) {
      return (
        <div className="flex items-center gap-2 text-text/70">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>{loadingText}</span>
        </div>
      );
    }

    // Simple form element (no built-in features)
    if (!onSubmit) {
      return (
        <form
          ref={ref}
          onSubmit={form.handleSubmit}
          className={`space-y-4 ${className}`}
          noValidate
          {...formProps}
        >
          {children}
        </form>
      );
    }

    // Full featured form
    return (
      <>
        {/* Restore prompt */}
        {showRestorePrompt && autosaveEnabled && (
          <div className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <RotateCcw className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-heading">
                    Restore previous work?
                  </p>
                  <p className="text-sm text-text/70 mt-1">
                    You have unsaved changes from{" "}
                    {getAutosaveInfo()?.relativeTime}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleRestore}
                  className="px-3 py-1.5 bg-primary text-white rounded-md text-sm hover:bg-primary/90"
                >
                  Restore
                </button>
                <button
                  type="button"
                  onClick={handleDiscard}
                  className="px-3 py-1.5 border border-border-primary rounded-md text-sm hover:bg-bg2"
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        )}

        <form
          ref={ref}
          onSubmit={form.handleSubmit}
          className={`space-y-4 ${className}`}
          noValidate
          {...formProps}
        >
          {showError && <FormError error={form.submitError} />}

          {/* Render children with form instance and additional data */}
          {typeof children === "function"
            ? children(form, additionalData)
            : children}

          {showActions && (
            <FormActions
              submitLabel={submitLabel}
              cancelLabel={cancelLabel}
              onCancel={showCancel ? handleCancel : undefined}
              isSubmitting={form.isSubmitting}
              canSubmit={form.isValid && !form.isSubmitting}
              {...actionsProps}
            />
          )}
        </form>

        {/* Autosave indicator */}
        {showAutosaveIndicator && autosaveEnabled && lastSaved && (
          <div className="fixed bottom-4 right-4 flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg shadow-lg text-sm animate-fade-in">
            <Save className="w-4 h-4" />
            Autosaved
          </div>
        )}
      </>
    );
  }
);

Form.displayName = "Form";
