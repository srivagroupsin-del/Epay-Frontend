import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, Select, message, Space, Card, Tag } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { MultitabConfigApi } from "../../../api/multitabConfig.api";
import { getSectorTitles } from "../../../api/sectorTitle.api";

const MultitabMenu: React.FC = () => {
  const [menus, setMenus] = useState<any[]>([]);
  const [sectorTitles, setSectorTitles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<any>(null);
  const [form] = Form.useForm();

  const fetchMenus = async () => {
    setLoading(true);
    try {
      const data = await MultitabConfigApi.getAllMenus();
      setMenus(data || []);
    } catch (error) {
      message.error("Failed to fetch menus");
    } finally {
      setLoading(false);
    }
  };

  const fetchSectorTitles = async () => {
    try {
      const data = await getSectorTitles();
      setSectorTitles(data || []);
    } catch (error) {
      message.error("Failed to fetch sector titles");
    }
  };

  useEffect(() => {
    fetchMenus();
    fetchSectorTitles();
  }, []);

  const handleAdd = () => {
    setEditingMenu(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: any) => {
    setEditingMenu(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await MultitabConfigApi.deleteMenu(id);
      message.success("Menu deleted successfully");
      fetchMenus();
    } catch (error) {
      message.error("Failed to delete menu");
    }
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingMenu) {
        await MultitabConfigApi.updateMenu(editingMenu.id, values);
        message.success("Menu updated successfully");
      } else {
        await MultitabConfigApi.createMenu(values);
        message.success("Menu created successfully");
      }
      setIsModalOpen(false);
      fetchMenus();
    } catch (error) {
      console.error(error);
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id" },
    { 
      title: "Sector Title", 
      dataIndex: "menu_title_id", 
      key: "menu_title_id",
      render: (id: any) => {
        const title = sectorTitles.find((s: any) => s.id === id);
        return title ? title.title : id;
      }
    },
    { title: "Tab Name", dataIndex: "tab_name", key: "tab_name" },
    { 
      title: "Status", 
      dataIndex: "status", 
      key: "status",
      render: (status: any) => (
        <Tag color={status === 1 || status === "active" ? "green" : "red"}>
          {status === 1 || status === "active" ? "Active" : "Inactive"}
        </Tag>
      )
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Card 
        title="Multitab Menu (Tabs)" 
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>Add Menu</Button>}
      >
        <Table columns={columns} dataSource={menus} loading={loading} rowKey="id" />
      </Card>

      <Modal
        title={editingMenu ? "Edit Multitab Menu" : "Add Multitab Menu"}
        open={isModalOpen}
        onOk={handleModalSubmit}
        onCancel={() => setIsModalOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="menu_title_id" label="Sector Title" rules={[{ required: true }]}>
            <Select placeholder="Select Sector Title">
              {sectorTitles.map((s: any) => (
                <Select.Option key={s.id} value={s.id}>{s.title}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="tab_name" label="Tab Name" rules={[{ required: true }]}>
            <Input placeholder="Enter Tab Name" />
          </Form.Item>
          <Form.Item name="status" label="Status" initialValue={1}>
            <Select>
              <Select.Option value={1}>Active</Select.Option>
              <Select.Option value={0}>Inactive</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MultitabMenu;
