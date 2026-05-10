// app/admin/components/ProductSpecForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { SpecField, SpecGroup } from '@/types';

interface ProductSpecFormProps {
  groups: SpecGroup[];
  specs: SpecField[];
  onChange: (specs: SpecField[]) => void;
  readOnly?: boolean;
}

type SpecValue = string | number | boolean | string[] | undefined;

export function ProductSpecForm({
  groups,
  specs,
  onChange,
  readOnly = false
}: ProductSpecFormProps) {

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(groups.map(g => g.groupName))
  );

  useEffect(() => {
    setExpandedGroups(new Set(groups.map(g => g.groupName)));
  }, [groups]);

  // ---------------------------
  // TOGGLE GROUP
  // ---------------------------
  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.has(groupName) ? next.delete(groupName) : next.add(groupName);
      return next;
    });
  };

  // ---------------------------
  // GET VALUE
  // ---------------------------
  const getSpecValue = (key: string): SpecValue => {
    return specs.find(s => s.key === key)?.value;
  };

  // ---------------------------
  // UPDATE VALUE
  // ---------------------------
  const updateSpecValue = (key: string, value: SpecValue) => {
    const updated = [...specs];
    const index = updated.findIndex(s => s.key === key);

    if (index !== -1) {
      updated[index] = { ...updated[index], value };
    } else {
      updated.push({
        key,
        label: key,
        value,
        group: '',
        type: 'text'
      });
    }

    onChange(updated);
  };

  // ---------------------------
  // SAFE VALUE NORMALIZER
  // ---------------------------
  const safeStringValue = (val: SpecValue): string => {
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    return '';
  };

  const safeNumberValue = (val: SpecValue): number | '' => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string' && val !== '') return Number(val);
    return '';
  };

  const safeBooleanValue = (val: SpecValue): boolean => {
    return val === true;
  };

  const safeArrayValue = (val: SpecValue): string[] => {
    return Array.isArray(val) ? val : [];
  };

  // ---------------------------
  // RENDER INPUT
  // ---------------------------
  const renderSpecInput = (field: SpecField) => {
    const raw = getSpecValue(field.key);
    const type = field.type || 'text';

    switch (type) {

      // ---------------- BOOLEAN ----------------
      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={safeBooleanValue(raw)}
            onChange={(e) =>
              updateSpecValue(field.key, e.target.checked)
            }
            disabled={readOnly}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        );

      // ---------------- NUMBER ----------------
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

      // ---------------- SELECT ----------------
      case 'select':
        return (
          <select
            value={safeStringValue(raw)}
            onChange={(e) =>
              updateSpecValue(field.key, e.target.value)
            }
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

      // ---------------- MULTISELECT ----------------
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

      // ---------------- TEXTAREA ----------------
      case 'textarea':
        return (
          <textarea
            placeholder={`Enter ${field.label.toLowerCase()}`}
            value={safeStringValue(raw)}
            onChange={(e) =>
              updateSpecValue(field.key, e.target.value)
            }
            disabled={readOnly}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900"
          />
        );

      // ---------------- TEXT DEFAULT ----------------
      default:
        return (
          <input
            type="text"
            placeholder={`Enter ${field.label.toLowerCase()}`}
            value={safeStringValue(raw)}
            onChange={(e) =>
              updateSpecValue(field.key, e.target.value)
            }
            disabled={readOnly}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900"
          />
        );
    }
  };

  // ---------------------------
  // UI
  // ---------------------------
  return (
    <div className="space-y-4">
      {groups.map((group, groupIndex) => {
        const key = `${group.groupName}-${groupIndex}`;

        return (
          <div key={key} className="border rounded-lg overflow-hidden">

            <button
              type="button"
              onClick={() => toggleGroup(group.groupName)}
              className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex justify-between items-center"
            >
              <h3 className="text-md font-medium text-gray-900">
                {group.groupName}
              </h3>
              <span>
                {expandedGroups.has(group.groupName) ? '▼' : '▶'}
              </span>
            </button>

            {expandedGroups.has(group.groupName) && (
              <div className="p-4 space-y-4">
                {group.fields.map((field, i) => {
                  const fk = `${field.key}-${groupIndex}-${i}`;

                  return (
                    <div
                      key={fk}
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