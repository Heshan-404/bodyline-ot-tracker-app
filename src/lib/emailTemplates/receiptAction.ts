interface ReceiptActionEmailProps {
  title: string;
  action: 'approved' | 'rejected';
  role: string;
  actionBy: string;
  rejectionReason?: string;
  receiptLink: string;
}

export const receiptActionTemplate = ({
  title,
  action,
  role,
  actionBy,
  rejectionReason,
  receiptLink,
}: ReceiptActionEmailProps) => {
  const actionText = action === 'approved' ? 'approved' : 'rejected';
  const subjectText = action === 'approved' ? 'Approved' : 'Rejected';

  return `
    <h1>Receipt ${subjectText}</h1>
    <p>Your receipt titled "${title}" has been ${actionText} by ${actionBy} (${role}).</p>
    ${rejectionReason ? `<p><strong>Reason for Rejection:</strong> ${rejectionReason}</p>` : ''}
    <p>
      <a href="${receiptLink}" style="
        display: inline-block;
        padding: 10px 20px;
        background-color: #007bff;
        color: #ffffff;
        text-decoration: none;
        border-radius: 5px;
      ">
        View Receipt Details
      </a>
    </p>
  `;
};
