// components/CancelSubscriptionButton.tsx
import React from 'react';

interface CancelSubscriptionButtonProps {
  subscriptionId: string;
}

const CancelSubscriptionButton: React.FC<CancelSubscriptionButtonProps> = ({ subscriptionId }) => {
  const handleCancel = async () => {
    try {
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscriptionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      alert('Subscription canceled successfully');
    } catch (error) {
      console.error('Error:', error);
      alert('Error canceling subscription');
    }
  };

  return (
    <button id="cancel-subscription" onClick={handleCancel}>
      Cancel Subscription
    </button>
  );
};

export default CancelSubscriptionButton;