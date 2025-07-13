import React from 'react';
import { Modal, Button } from 'antd';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  content: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  content,
  onConfirm,
  onCancel,
  confirmLoading = false,
}) => {
  return (
    <Modal
      title={title}
      open={visible}
      onOk={onConfirm}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      okText="Yes"
      cancelText="No"
      okButtonProps={{ danger: true }}
    >
      <p>{content}</p>
    </Modal>
  );
};

export default ConfirmationModal;
