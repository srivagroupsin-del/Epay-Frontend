import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Radio,
  Switch,
  message,
  Space,
  Card,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { MultitabConfigApi } from "../../../api/multitabConfig.api";

const MultitabFields: React.FC = () => {
  const [fields, setFields] = useState<any[]>([]);
  const [checkboxes, setCheckboxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<any>(null);
  const [fieldScope, setFieldScope] = useState("global");
  const [fieldType, setFieldType] = useState("text");
  const [form] = Form.useForm();

  const fetchFields = async () => {
    setLoading(true);
    try {
      const data = await MultitabConfigApi.getAllFields();
      setFields(data || []);
    } catch {
      message.error("Failed to fetch fields");
    } finally {
      setLoading(false);
    }
  };

  const fetchCheckboxes = async () => {
    try {
      const data = await MultitabConfigApi.getAllCheckboxes();
      setCheckboxes(data || []);
    } catch {
      message.error("Failed to fetch checkboxes");
    }
  };

  useEffect(() => {
    fetchFields();
    fetchCheckboxes();
  }, []);

  const handleAdd = () => {
    setEditingField(null);
    setFieldScope("global");
    setFieldType("text");
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: any) => {
    setEditingField(record);
    setFieldScope(record.field_scope);
    setFieldType(record.field_type);

    form.setFieldsValue({
      ...record,
      options: record.options ? record.options.join(",") : "",
    });

    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await MultitabConfigApi.deleteField(id);
      message.success("Deleted");
      fetchFields();
    } catch {
      message.error("Delete failed");
    }
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();

      // 🔥 convert options string → array
      if (values.field_type === "dropdown" && values.options) {
        values.options = values.options.split(",").map((v: string) => v.trim());
      }

      if (editingField) {
        await MultitabConfigApi.updateField(editingField.id, values);
        message.success("Updated");
      } else {
        await MultitabConfigApi.createField(values);
        message.success("Created");
      }

      setIsModalOpen(false);
      fetchFields();
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    { title: "Field Name", dataIndex: "field_name" },
    { title: "Display Name", dataIndex: "display_name" },
    { title: "Type", dataIndex: "field_type" },
    { title: "Scope", dataIndex: "field_scope" },
    {
      title: "Checkbox",
      dataIndex: "checkbox_id",
      render: (id: any) => {
        const cb = checkboxes.find((c: any) => c.id === id);
        return cb ? cb.label_name : "-";
      },
    },
    {
      title: "Required",
      dataIndex: "is_required",
      render: (v: any) => (v ? "Yes" : "No"),
    },
    {
      title: "Action",
      render: (_: any, record: any) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="Multitab Fields"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Field
          </Button>
        }
      >
        <Table rowKey="id" columns={columns} dataSource={fields} loading={loading} />
      </Card>

      <Modal
        title={editingField ? "Edit Field" : "Add Field"}
        open={isModalOpen}
        onOk={handleModalSubmit}
        onCancel={() => setIsModalOpen(false)}
      >
        <Form
          form={form}
          layout="vertical"
          onValuesChange={(changed) => {
            if (changed.field_scope) setFieldScope(changed.field_scope);
            if (changed.field_type) setFieldType(changed.field_type);
          }}
        >
          <Form.Item name="field_name" label="Field Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="display_name" label="Display Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="field_type" label="Field Type" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="text">Text</Select.Option>
              <Select.Option value="number">Number</Select.Option>
              <Select.Option value="dropdown">Dropdown</Select.Option>
              <Select.Option value="boolean">Boolean</Select.Option>
              <Select.Option value="date">Date</Select.Option>
            </Select>
          </Form.Item>

          {/* 🔥 CORRECT PLACE */}
          {fieldType === "dropdown" && (
            <Form.Item
              name="options"
              label="Options (comma separated)"
              rules={[{ required: true }]}
            >
              <Input placeholder="5,12,18,28" />
            </Form.Item>
          )}

          <Form.Item name="is_required" label="Required" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item name="field_scope" label="Field Scope" initialValue="global">
            <Radio.Group>
              <Radio value="global">Global</Radio>
              <Radio value="checkbox">Checkbox</Radio>
            </Radio.Group>
          </Form.Item>

          {fieldScope === "checkbox" && (
            <Form.Item name="checkbox_id" label="Checkbox" rules={[{ required: true }]}>
              <Select>
                {checkboxes.map((c: any) => (
                  <Select.Option key={c.id} value={c.id}>
                    {c.label_name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default MultitabFields;