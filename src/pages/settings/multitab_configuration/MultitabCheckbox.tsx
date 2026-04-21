import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, message, Card } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { MultitabConfigApi } from "../../../api/multitabConfig.api";

const MultitabCheckbox: React.FC = () => {
  const [checkboxes, setCheckboxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchCheckboxes = async () => {
    setLoading(true);
    try {
      const data = await MultitabConfigApi.getAllCheckboxes();
      setCheckboxes(data || []);
    } catch (error) {
      message.error("Failed to fetch checkboxes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckboxes();
  }, []);

  const handleAdd = () => {
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      await MultitabConfigApi.createCheckbox(values);
      message.success("Checkbox added successfully");
      setIsModalOpen(false);
      fetchCheckboxes();
    } catch (error) {
      console.error(error);
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "Checkbox Name", dataIndex: "label_name", key: "label_name" },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Card 
        title="Multitab Checkbox" 
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>Add Checkbox</Button>}
      >
        <Table columns={columns} dataSource={checkboxes} loading={loading} rowKey="id" />
      </Card>

      <Modal
        title="Add Multitab Checkbox"
        open={isModalOpen}
        onOk={handleModalSubmit}
        onCancel={() => setIsModalOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="label_name" label="Checkbox Name" rules={[{ required: true }]}>
            <Input placeholder="Example: GST, VAT, Offers" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MultitabCheckbox;
