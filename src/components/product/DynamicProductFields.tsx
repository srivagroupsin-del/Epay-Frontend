import React, { useState, useEffect } from "react";
import { Input, InputNumber, Select, Switch, DatePicker, Row, Col } from "antd";
import { MultitabConfigApi } from "../../api/multitabConfig.api";

interface DynamicField {
  id: number;
  field_name: string;
  display_name: string;
  field_type: string;
  field_scope: "global" | "checkbox";
  checkbox_id: number | null;
  is_required: boolean;
  options?: any[];
}

interface Props {
  mapping_id: number;
  fields: DynamicField[]; // Already filtered: global + category-specific
  dynamicFields: any[]; // [ { mapping_id, field_id, value } ]
  setDynamicFields: (fields: any[]) => void;
}

const DynamicProductFields: React.FC<Props> = ({ mapping_id, fields, dynamicFields, setDynamicFields }) => {
  const [selectedCheckboxes, setSelectedCheckboxes] = useState<Set<number>>(new Set());
  const [allCheckboxes, setAllCheckboxes] = useState<any[]>([]);

  useEffect(() => {
    // Fetch all checkboxes once to handle labels and toggles
    const init = async () => {
      const cbs = await MultitabConfigApi.getAllCheckboxes();
      setAllCheckboxes(cbs);
    };
    init();
  }, []);

  useEffect(() => {
    // Auto-enable checkboxes if values exist for this specific mapping
    const newSelected = new Set<number>();
    fields.forEach(f => {
      if (f.field_scope === "checkbox" && f.checkbox_id) {
        const val = dynamicFields.find(df => df.mapping_id === mapping_id && df.field_id === f.id);
        if (val !== undefined && val.value !== undefined && val.value !== "" && val.value !== null) {
          newSelected.add(f.checkbox_id);
        }
      }
    });
    if (newSelected.size > 0) {
      setSelectedCheckboxes(prev => new Set([...Array.from(prev), ...Array.from(newSelected)]));
    }
  }, [fields, mapping_id]);

  const getValue = (fieldId: number) => {
    return dynamicFields.find(v => v.mapping_id === mapping_id && v.field_id === fieldId)?.value;
  };

  const handleFieldChange = (fieldId: number, value: any) => {
    const existingIndex = dynamicFields.findIndex(
      f => f.field_id === fieldId && f.mapping_id === mapping_id
    );

    let updated = [...dynamicFields];

    if (existingIndex > -1) {
      updated[existingIndex] = { ...updated[existingIndex], value };
    } else {
      updated.push({
        field_id: fieldId,
        mapping_id: mapping_id, // 🔥 Passed from parent loop
        value
      });
    }

    setDynamicFields(updated);
  };

  const renderFieldInput = (field: DynamicField) => {
    const val = getValue(field.id);
    const commonProps = {
      placeholder: field.display_name,
      style: { width: "100%" },
      required: field.is_required,
      value: (val === null || val === undefined) ? "" : val,
      onChange: (e: any) => {
        const newVal = (field.field_type === "text" || field.field_type === "number") ? e.target.value : e;
        handleFieldChange(field.id, newVal);
      },
      autoFocus: field.field_name === "barcode",
      "data-mapping-id": mapping_id,
      "data-field-id": field.id,
      className: field.field_name === "barcode" ? "barcode-input" : ""
    };

    switch (field.field_type) {
      case "text": return <Input {...commonProps} />;
      case "number": return <InputNumber {...commonProps} />;
      case "dropdown":
        const formattedOptions = Array.isArray(field.options)
          ? field.options.map((opt: any) =>
            typeof opt === "object" && opt !== null ? opt : { label: String(opt), value: String(opt) }
          )
          : [];
        return <Select {...commonProps} options={formattedOptions} />;
      case "boolean":
        return <Switch {...commonProps} checked={!!val} onChange={(checked: boolean) => handleFieldChange(field.id, checked)} />;
      case "date":
        return <DatePicker {...commonProps} onChange={(date: any) => handleFieldChange(field.id, date ? (date as any).toISOString() : null)} />;
      default:
        return <Input {...commonProps} />;
    }
  };

  const visibleFields = fields.filter(f => {
    if (f.field_scope === "global") return true;
    if (f.field_scope === "checkbox" && f.checkbox_id && selectedCheckboxes.has(f.checkbox_id)) return true;
    return false;
  });

  // Derive checkboxes that are relevant to the fields of this mapping
  const relevantCheckboxIds = Array.from(new Set(
    fields
      .filter(f => f.field_scope === "checkbox" && f.checkbox_id)
      .map(f => f.checkbox_id as number)
  ));
  const currentCheckboxes = allCheckboxes.filter(cb => relevantCheckboxIds.includes(cb.id));

  if (fields.length === 0) return null;

  return (
    <div style={{ marginTop: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
      <div style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
        Extra Specification:
      </div>
      {currentCheckboxes.length > 0 && (
        <div style={{ marginBottom: '12px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          {currentCheckboxes.map(cb => (
            <div key={cb.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Switch
                size="small"
                checked={selectedCheckboxes.has(cb.id)}
                onChange={(checked) => {
                  const newSet = new Set(selectedCheckboxes);
                  if (checked) newSet.add(cb.id); else newSet.delete(cb.id);
                  setSelectedCheckboxes(newSet);
                }}
              />
              <span style={{ fontSize: '12px', fontWeight: '500' }}>{cb.label_name}</span>
            </div>
          ))}
        </div>
      )}
      <Row gutter={[16, 12]}>
        {visibleFields.map(field => (
          <Col xs={24} sm={12} md={8} key={field.id}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500', color: '#475569' }}>
              {field.display_name} {field.is_required && <span style={{ color: '#ef4444' }}>*</span>}
            </label>
            {renderFieldInput(field)}
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default DynamicProductFields;
