import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, Select, message, Card } from "antd";
import { PlusOutlined, EditOutlined } from "@ant-design/icons";
import { MultitabConfigApi } from "../../../api/multitabConfig.api";

type MenuType = {
  id: number;
  tab_name: string;
};

const MultitabHeading: React.FC = () => {
  const [headings, setHeadings] = useState([]);
  const [menus, setMenus] = useState<MenuType[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();


  const fetchHeadings = async () => {
    setLoading(true);
    try {
      const data = await MultitabConfigApi.getAllHeadings();
      setHeadings(data || []);
    } catch (error) {
      message.error("Failed to fetch headings");
    } finally {
      setLoading(false);
    }
  };

  const fetchMenus = async () => {
    try {
      const data = await MultitabConfigApi.getAllMenus();
      setMenus(data || []);
    } catch (error) {
      message.error("Failed to fetch menus");
    }
  };

  useEffect(() => {
    fetchHeadings();
    fetchMenus();
  }, []);

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: any) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingId) {
        await MultitabConfigApi.updateHeading(editingId, values);
        message.success("Heading updated successfully");
      } else {
        await MultitabConfigApi.createHeading(values);
        message.success("Heading created successfully");
      }
      setIsModalOpen(false);
      fetchHeadings();
    } catch (error) {
      console.error(error);
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id" },
    {
      title: "Menu",
      dataIndex: "multitab_menu_id",
      key: "multitab_menu_id",
      render: (id: any) => {
        const menu = menus.find((m: any) => m.id === id);
        return menu ? menu.tab_name : id;
      }
    },
    { title: "Heading Name", dataIndex: "heading_name", key: "heading_name" },
    { title: "Title Name", dataIndex: "title_name", key: "title_name" },
    {
      title: "Image",
      dataIndex: "image",
      key: "image",
      render: (img: any) => img ? <img src={img} alt="heading" style={{ width: 50 }} /> : "No Image"
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: any) => (
        <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>Edit</Button>
      )
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Card
        title="Multitab Heading"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>Add Heading</Button>}
      >
        <Table columns={columns} dataSource={headings} loading={loading} rowKey="id" />
      </Card>

      <Modal
        title={editingId ? "Edit Multitab Heading" : "Add Multitab Heading"}
        open={isModalOpen}
        onOk={handleModalSubmit}
        onCancel={() => setIsModalOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="multitab_menu_id" label="Select Menu" rules={[{ required: true }]}>
            <Select placeholder="Select Menu">
              {menus.map((m: any) => (
                <Select.Option key={m.id} value={m.id}>{m.tab_name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="heading_name" label="Heading Name" rules={[{ required: true }]}>
            <Input placeholder="Enter Heading Name" />
          </Form.Item>
          <Form.Item name="title_name" label="Title Name" rules={[{ required: true }]}>
            <Input placeholder="Enter Title Name" />
          </Form.Item>
          <Form.Item name="image" label="Image URL">
            <Input placeholder="Enter Image URL (or handle upload separately)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MultitabHeading;
