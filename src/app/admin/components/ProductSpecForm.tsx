// app/admin/components/ProductSpecForm.tsx
'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { SpecField, SpecGroup } from '@/types';

interface ProductSpecFormProps {
  groups: SpecGroup[];
  specs: SpecField[];
  onChange: (specs: SpecField[]) => void;
  readOnly?: boolean;
  onValidationChange?: (isValid: boolean, missingRequired: string[]) => void;
}

type SpecValue = string | number | boolean | string[] | undefined;

// Helper function to normalize keys for matching
function normalizeKey(key: string): string {
  return key.toLowerCase().trim().replace(/\s+/g, ' ');
}

export function ProductSpecForm({
  groups,
  specs,
  onChange,
  readOnly = false,
  onValidationChange
}: ProductSpecFormProps) {

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(groups.map(g => g.groupName))
  );

  // Use ref to track previous validation state to prevent infinite loops
  const prevValidationRef = useRef<string>('');

  // Create a map of existing specs for quick lookup using useMemo to prevent recreation on every render
  const specsMap = useMemo(() => {
    const map = new Map();
    specs.forEach(spec => {
      if (spec.key) {
        map.set(normalizeKey(spec.key), spec);
      }
    });
    return map;
  }, [specs]);

  // Validation effect - use useCallback to memoize the validation logic
  const validateSpecs = useCallback(() => {
    if (onValidationChange) {
      const requiredFields = groups.flatMap(g => 
        g.fields.filter(f => f.required).map(f => f.key)
      );
      
      const missingRequired = requiredFields.filter(key => {
        const normalizedKey = normalizeKey(key);
        const spec = specsMap.get(normalizedKey);
        const value = spec?.value;
        return !value || (typeof value === 'string' && value.trim() === '') || 
               (Array.isArray(value) && value.length === 0);
      });
      
      const isValid = missingRequired.length === 0;
      const validationKey = `${isValid}-${missingRequired.join(',')}`;
      
      // Only call onValidationChange if validation state actually changed
      if (validationKey !== prevValidationRef.current) {
        prevValidationRef.current = validationKey;
        onValidationChange(isValid, missingRequired);
      }
    }
  }, [groups, specsMap, onValidationChange]);

  // Run validation when dependencies change
  useEffect(() => {
    validateSpecs();
  }, [validateSpecs]);

  // Update expanded groups when groups change
  useEffect(() => {
    setExpandedGroups(new Set(groups.map(g => g.groupName)));
  }, [groups]);

  // Toggle group
  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.has(groupName) ? next.delete(groupName) : next.add(groupName);
      return next;
    });
  };

  // Get value - case insensitive lookup
  const getSpecValue = useCallback((fieldKey: string): SpecValue => {
    const normalizedKey = normalizeKey(fieldKey);
    const spec = specsMap.get(normalizedKey);
    return spec?.value;
  }, [specsMap]);

  // Update value
  const updateSpecValue = useCallback((fieldKey: string, value: SpecValue) => {
    const normalizedKey = normalizeKey(fieldKey);
    const updated = [...specs];
    const index = updated.findIndex(s => normalizeKey(s.key || '') === normalizedKey);

    if (index !== -1) {
      updated[index] = { ...updated[index], value };
    } else {
      // Find the template field to get proper metadata
      let templateField = null;
      for (const group of groups) {
        const found = group.fields.find(f => normalizeKey(f.key) === normalizedKey);
        if (found) {
          templateField = found;
          break;
        }
      }
      
      updated.push({
        key: templateField?.key || fieldKey,
        label: templateField?.label || fieldKey,
        value,
        group: templateField?.group || '',
        type: templateField?.type || 'text',
        unit: templateField?.unit,
        filterable: templateField?.filterable || false
      });
    }

    onChange(updated);
  }, [specs, groups, onChange]);

  // Safe value normalizers
  const safeStringValue = useCallback((val: SpecValue): string => {
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    return '';
  }, []);

  const safeNumberValue = useCallback((val: SpecValue): number | '' => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string' && val !== '') return Number(val);
    return '';
  }, []);

  const safeBooleanValue = useCallback((val: SpecValue): boolean => {
    return val === true;
  }, []);

  const safeArrayValue = useCallback((val: SpecValue): string[] => {
    return Array.isArray(val) ? val : [];
  }, []);

  // Render input based on type
  const renderSpecInput = useCallback((field: SpecField) => {
    const raw = getSpecValue(field.key);
    const type = field.type || 'text';

    switch (type) {
      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={safeBooleanValue(raw)}
            onChange={(e) => updateSpecValue(field.key, e.target.checked)}
            disabled={readOnly}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            step="any"
            placeholder={`Enter ${field.label.toLowerCase()}`}
            value={safeNumberValue(raw)}
            onChange={(e) =>
              updateSpecValue(
                field.key,
                e.target.value === '' ? '' : Number(e.target.value)
              )
            }
            disabled={readOnly}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900"
          />
        );

      case 'select':
        return (
          <select
            value={safeStringValue(raw)}
            onChange={(e) => updateSpecValue(field.key, e.target.value)}
            disabled={readOnly}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900"
          >
            <option value="">
              Select {field.label.toLowerCase()}...
            </option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case 'multiselect': {
        const values = safeArrayValue(raw);
        return (
          <div className="mt-1 space-y-2">
            <select
              multiple
              value={values}
              onChange={(e) => {
                const selected = Array.from(
                  e.target.selectedOptions,
                  (o) => o.value
                );
                updateSpecValue(field.key, selected);
              }}
              disabled={readOnly}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900"
              size={Math.min(field.options?.length || 3, 5)}
            >
              {field.options?.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {values.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {values.map((v) => (
                  <span
                    key={v}
                    className="inline-flex items-center rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800"
                  >
                    {v}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      }

      case 'textarea':
        return (
          <div className="mt-1">
            <textarea
              placeholder={`Enter ${field.label.toLowerCase()}`}
              value={safeStringValue(raw)}
              onChange={(e) => updateSpecValue(field.key, e.target.value)}
              disabled={readOnly}
              rows={4}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 resize-y"
            />
            {field.unit && (
              <p className="mt-1 text-xs text-gray-500">Unit: {field.unit}</p>
            )}
          </div>
        );

      default:
        return (
          <input
            type="text"
            placeholder={`Enter ${field.label.toLowerCase()}`}
            value={safeStringValue(raw)}
            onChange={(e) => updateSpecValue(field.key, e.target.value)}
            disabled={readOnly}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900"
          />
        );
    }
  }, [getSpecValue, safeBooleanValue, safeNumberValue, safeStringValue, safeArrayValue, updateSpecValue, readOnly]);

  return (
    <div className="space-y-4">
      {groups.map((group, groupIndex) => {
        const key = `${group.groupName}-${groupIndex}`;
        const hasRequiredFields = group.fields.some(f => f.required);
        
        return (
          <div key={key} className="border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => toggleGroup(group.groupName)}
              className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex justify-between items-center"
            >
              <div className="flex items-center gap-2">
                <h3 className="text-md font-medium text-gray-900">
                  {group.groupName}
                </h3>
                {hasRequiredFields && !expandedGroups.has(group.groupName) && (
                  <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded">
                    Has required fields
                  </span>
                )}
              </div>
              <span>
                {expandedGroups.has(group.groupName) ? '▼' : '▶'}
              </span>
            </button>

            {expandedGroups.has(group.groupName) && (
              <div className="p-4 space-y-4">
                {group.fields.map((field, i) => {
                  const fk = `${field.key}-${groupIndex}-${i}`;
                  const currentValue = getSpecValue(field.key);
                  const isMissingRequired = field.required && (
                    !currentValue || 
                    (typeof currentValue === 'string' && currentValue.trim() === '') ||
                    (Array.isArray(currentValue) && currentValue.length === 0)
                  );

                  return (
                    <div
                      key={fk}
                      id={`spec-field-${field.key}`}
                      className={
                        field.required
                          ? 'border-l-4 border-red-400 pl-3'
                          : ''
                      }
                    >
                      <label className="block text-sm font-medium text-gray-700">
                        {field.label}
                        {field.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                        {field.unit && (
                          <span className="text-gray-500 text-xs ml-1">
                            ({field.unit})
                          </span>
                        )}
                      </label>

                      {renderSpecInput(field)}

                      {isMissingRequired && (
                        <p className="mt-1 text-xs text-red-500">
                          This field is required
                        </p>
                      )}

                      {field.isVariantAttribute && (
                        <p className="mt-1 text-xs text-blue-600">
                          This is a variant attribute
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}