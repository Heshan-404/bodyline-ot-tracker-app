interface NewReceiptEmailProps {
  title: string;
  description: string;
  receiptLink: string;
}

export const newReceiptTemplate = ({
  title,
  description,
  receiptLink,
}: NewReceiptEmailProps) => {
  return `
    <h1>New Receipt Submitted</h1>
    <p>A new receipt has been submitted for your review.</p>
    <p><strong>Title:</strong> ${title}</p>
    <p><strong>Description:</strong> ${description}</p>
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
    <p>Please log in to the system to approve or reject this receipt.</p>
  `;
};
