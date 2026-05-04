// app/admin/components/ProductSpecForm.tsx
'use client';

import { useState,useEffect } from 'react';
import { X, Plus } from 'lucide-react';

interface SpecField {
  key: string;
  label: string;
  value?: string | number | boolean | string[];
  group: string;
  unit?: string;
  filterable?: boolean;
  type?: string;
  options?: string[];
  required?: boolean;
  isVariantAttribute?: boolean;
}

interface SpecGroup {
  groupName: string;
  fields: SpecField[];
}

interface ProductSpecFormProps {
  groups: SpecGroup[];
  specs: SpecField[];
  onChange: (specs: SpecField[]) => void;
  readOnly?: boolean;
}

export function ProductSpecForm({ groups, specs, onChange, readOnly = false }: ProductSpecFormProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(groups.map(g => g.groupName)));


useEffect(() => {
  setExpandedGroups(new Set(groups.map(g => g.groupName)));
}, [groups]);


  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

 const updateSpecValue = (key: string, value: any) => {
  let found = false;

  const updatedSpecs = specs.map(spec => {
    if (spec.key === key) {
      found = true;
      return { ...spec, value };
    }
    return spec;
  });

  if (!found) {
    updatedSpecs.push({
      key,
      label: key,
      value,
      group: ''
    });
  }

  onChange(updatedSpecs);
};

  const getSpecValue = (key: string) => {
  const spec = specs.find(s => s.key === key);
  return spec ? spec.value : '';
};

  const renderSpecInput = (field: any) => {
    const value = getSpecValue(field.key);
    
    switch (field.type) {
      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={value === true || value === 'true'}
            onChange={(e) => updateSpecValue(field.key, e.target.checked)}
            disabled={readOnly}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            placeholder={`Enter ${field.label.toLowerCase()}`}
            value={value || ''}
            onChange={(e) => updateSpecValue(field.key, e.target.value ? parseFloat(e.target.value) : '')}
            disabled={readOnly}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        );
      
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => updateSpecValue(field.key, e.target.value)}
            disabled={readOnly}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">Select {field.label.toLowerCase()}...</option>
            {field.options?.map((opt: string) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      
      case 'multiselect':
        const currentValues = Array.isArray(value) ? value : [];
        return (
          <div className="mt-1 space-y-2">
            <select
              multiple
              value={currentValues}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                updateSpecValue(field.key, selected);
              }}
              disabled={readOnly}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              size={Math.min(field.options?.length || 3, 5)}
            >
              {field.options?.map((opt: string) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {currentValues.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {currentValues.map(v => (
                  <span key={v} className="inline-flex items-center rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                    {v}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      
      default: // text
        return (
          <input
            type="text"
            placeholder={`Enter ${field.label.toLowerCase()}`}
            value={value || ''}
            onChange={(e) => updateSpecValue(field.key, e.target.value)}
            disabled={readOnly}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        );
    }
  };

  return (
    <div className="space-y-4">
      {groups.map((group, groupIndex) => {
        // Create a unique key using groupName and index
        const uniqueKey = `${group.groupName}-${groupIndex}`;
        
        return (
          <div key={uniqueKey} className="border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => toggleGroup(group.groupName)}
              className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex justify-between items-center"
            >
              <h3 className="text-md font-medium text-gray-900">{group.groupName}</h3>
              <span>{expandedGroups.has(group.groupName) ? '▼' : '▶'}</span>
            </button>
            
            {expandedGroups.has(group.groupName) && (
              <div className="p-4 space-y-4">
                {group.fields.map((field, fieldIndex) => {
                  // Create a unique key for each field
                  const fieldKey = `${field.key}-${groupIndex}-${fieldIndex}`;
                  
                  return (
                    <div key={fieldKey} className={field.required ? 'border-l-4 border-red-400 pl-3' : ''}>
                      <label className="block text-sm font-medium text-gray-700">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                        {field.unit && <span className="text-gray-500 text-xs ml-1">({field.unit})</span>}
                      </label>
                      {renderSpecInput(field)}
                      {field.isVariantAttribute && (
                        <p className="mt-1 text-xs text-blue-600">This is a variant attribute</p>
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