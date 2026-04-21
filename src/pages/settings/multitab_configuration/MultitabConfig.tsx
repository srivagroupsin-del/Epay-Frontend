import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Select, message, Card } from "antd";
import { Popconfirm } from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { MultitabConfigApi } from "../../../api/multitabConfig.api";
import { getSectorTitles } from "../../../api/sectorTitle.api";
import { getSectors } from "../../../api/sectors.api";
import { getSubSubSectors } from "../../../pages/subsector/models/subSectors.api";
import { getCategories } from "../../../api/category.api";

const MultitabConfig: React.FC = () => {
  const [configs, setConfigs] = useState<any[]>([]);
  const [sectorTitles, setSectorTitles] = useState<any[]>([]);
  const [sectors, setSectors] = useState<any[]>([]);
  const [filteredSectors, setFilteredSectors] = useState<any[]>([]);
  const [subSectors, setSubSectors] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [headings, setHeadings] = useState<any[]>([]);
  const [checkboxes, setCheckboxes] = useState<any[]>([]);

  const [allSubSectors, setAllSubSectors] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);

  const [, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [c, st, s, cb, h, ss, cat] = await Promise.all([
        MultitabConfigApi.getAllConfigs(),
        getSectorTitles(),
        getSectors(),
        MultitabConfigApi.getAllCheckboxes(),
        MultitabConfigApi.getAllHeadings(),
        getSubSubSectors(),
        getCategories(),
      ]);

      setConfigs(c || []);
      setSectorTitles(st || []);
      setSectors(s || []);
      setFilteredSectors(s || []); // ✅ IMPORTANT
      setCheckboxes(cb || []);
      setHeadings(h || []);
      setAllSubSectors(ss || []);
      setAllCategories(cat || []);
    } catch (error) {
      message.error("Failed to fetch configuration data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* 🔥 FILTER SECTOR */
  const handleSectorTitleChange = (sectorTitleId: any) => {
    const filtered = sectors.filter(
      (s: any) => s.sector_title_id === sectorTitleId
    );

    setFilteredSectors(filtered);

    form.setFieldsValue({
      sector_id: undefined,
      sub_sector_id: undefined,
      category_id: undefined,
    });

    setSubSectors([]);
    setCategories([]);
  };

  const handleSectorChange = (sectorId: any) => {
    const filtered = allSubSectors.filter(
      (ss) => ss.sector_id === sectorId
    );
    setSubSectors(filtered);
    form.setFieldsValue({ sub_sector_id: undefined, category_id: undefined });
  };

  const handleSubSectorChange = (subSectorId: any) => {
    const filtered = allCategories.filter(
      (c) => c.sub_sector_id === subSectorId
    );
    setCategories(filtered);
    form.setFieldsValue({ category_id: undefined });
  };

  /* ➕ ADD */
  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  /* ✏️ EDIT */
  const handleEdit = async (record: any) => {
    try {
      const raw = await MultitabConfigApi.getConfigById(record.id);
      const data = Array.isArray(raw) ? raw[0] : raw;

      setEditingId(record.id);

      // prepare dropdowns
      setFilteredSectors(
        sectors.filter((s) => Number(s.sector_title_id) === Number(data.sector_title_id))
      );

      setSubSectors(
        allSubSectors.filter((ss) => Number(ss.sector_id) === Number(data.sector_id))
      );

      setCategories(
        allCategories.filter((c) => Number(c.sub_sector_id) === Number(data.sub_sector_id))
      );

      // set values (after state)
      setTimeout(() => {
        form.setFieldsValue({
          sector_title_id: Number(data.sector_title_id),
          sector_id: Number(data.sector_id),
          sub_sector_id: Number(data.sub_sector_id),
          category_id: Number(data.category_id),
          heading_id: Number(data.heading_id),
          checkbox_id: Number(data.checkbox_id),
        });
      }, 0);

      setIsModalOpen(true);
    } catch (err) {
      console.error(err);
      message.error("Failed to load config");
    }
  };

  /* ❌ DELETE */
  const handleDelete = async (id: number) => {
    await MultitabConfigApi.deleteConfig(id);
    message.success("Deleted");
    fetchData();
  };

  /* 💾 SAVE */
  const handleModalSubmit = async () => {
    const values = await form.validateFields();

    if (editingId) {
      await MultitabConfigApi.updateConfig(editingId, values);
      message.success("Updated successfully");
    } else {
      await MultitabConfigApi.createConfig(values);
      message.success("Created successfully");
    }

    setIsModalOpen(false);
    fetchData();
  };

  const columns = [
    { title: "ID", dataIndex: "id" },
    { title: "Sector", dataIndex: "sector" },
    { title: "Category", dataIndex: "category" },
    { title: "Heading", dataIndex: "heading" },
    { title: "Checkbox", dataIndex: "checkbox" },
    {
      title: "Action",
      render: (_: any, record: any) => (
        <>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            style={{ marginRight: 8 }}
          />
          <Popconfirm
            title="Are you sure to delete this config?"
            okText="Yes"
            cancelText="No"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title="Multitab Config"
        extra={
          <Button icon={<PlusOutlined />} onClick={handleAdd} type="primary">
            Add Config
          </Button>
        }
      >
        <Table rowKey="id" columns={columns} dataSource={configs} />
      </Card>

      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleModalSubmit}
        title={editingId ? "Edit Config" : "Add Config"}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="sector_title_id" label="Sector Title" rules={[{ required: true }]}>
            <Select onChange={handleSectorTitleChange}>
              {sectorTitles.map((t: any) => (
                <Select.Option key={t.id} value={t.id}>
                  {t.title}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="sector_id" label="Sector" rules={[{ required: true }]}>
            <Select onChange={handleSectorChange}>
              {filteredSectors.map((s: any) => (
                <Select.Option key={s.id} value={s.id}>
                  {s.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="sub_sector_id" label="SubSector" rules={[{ required: true }]}>
            <Select onChange={handleSubSectorChange}>
              {subSectors.map((s: any) => (
                <Select.Option key={s.id} value={s.id}>
                  {s.sub_sector_name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="category_id" label="Category" rules={[{ required: true }]}>
            <Select>
              {categories.map((c: any) => (
                <Select.Option key={c.id} value={c.id}>
                  {c.category_name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="heading_id" label="Heading" rules={[{ required: true }]}>
            <Select>
              {headings.map((h: any) => (
                <Select.Option key={h.id} value={h.id}>
                  {h.heading_name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="checkbox_id" label="Checkbox" rules={[{ required: true }]}>
            <Select>
              {checkboxes.map((c: any) => (
                <Select.Option key={c.id} value={c.id}>
                  {c.label_name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MultitabConfig;