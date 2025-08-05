'use client';

import { useState, useEffect } from 'react';
import { Form, Input, Button, Upload, Card, Typography, Image, Select } from 'antd';
import { useNotification } from '@/src/components/notification/NotificationProvider';
import { UploadOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

const { Title } = Typography;
const { Option } = Select;

export default function CreateReceiptPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const router = useRouter();
  const { data: session, status } = useSession();
  const [sections, setSections] = useState<{ id: string; name: string }[]>([]);
  const notification = useNotification();

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const res = await fetch('/api/sections');
        if (!res.ok) {
          throw new Error('Failed to fetch sections');
        }
        const data = await res.json();
        setSections(data);
      } catch (error: any) {
        notification.error({
          message: 'Error fetching sections',
          description: error.message,
        });
      }
    };
    fetchSections();
  }, []);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'HR') {
    router.push('/login');
    return null;
  }

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('sectionId', values.sectionId);
      formData.append('description', values.description || '');
      if (fileList.length > 0) {
        formData.append('image', fileList[0].originFileObj as File);
      }

      const res = await fetch('/api/receipts', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create receipt');
      }

      notification.success({
        message: 'Receipt created successfully!',
        description: 'Your receipt has been submitted.',
      });
      form.resetFields();
      setFileList([]);
      router.push('/dashboard/hr');
    } catch (error: any) {
      notification.error({
        message: 'Error creating receipt',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = ({ fileList: newFileList }: any) => {
    setFileList(newFileList);
    if (newFileList.length > 0 && newFileList[0].originFileObj) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(newFileList[0].originFileObj);
    } else {
      setPreviewImage(null);
    }
  };

  return (
    <div className="create-receipt-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <Card className="create-receipt-card" style={{ width: 800 }}>
        <Title level={2} style={{ textAlign: 'center' }}>Create New Receipt</Title>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="Title"
            name="title"
            rules={[{ required: true, message: 'Please input the title!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Section"
            name="sectionId"
            rules={[{ required: true, message: 'Please select a section!' }]}
          >
            <Select placeholder="Select a section">
              {sections.map((section) => (
                <Option key={section.id} value={section.id}>
                  {section.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          

          <Form.Item
            label="Description"
            name="description"
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item
            label="Receipt Image"
            name="image"
            valuePropName="fileList"
            getValueFromEvent={(e) => e && e.fileList}
            rules={[{ required: true, message: 'Please upload a receipt image!' }]}
          >
            <Upload
              listType="picture"
              maxCount={1}
              beforeUpload={() => false} // Prevent Ant Design from uploading automatically
              fileList={fileList}
              onChange={handleFileChange}
            >
              <Button icon={<UploadOutlined />}>Upload Image</Button>
            </Upload>
          </Form.Item>

          {previewImage && (
            <Form.Item>
              <Image src={previewImage} alt="Receipt Preview" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} />
            </Form.Item>
          )}

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Submit Receipt
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
