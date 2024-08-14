'use client';
import axios from 'axios';
import React from 'react';
import { Button } from './ui/button';

type Props = {
    isPro: boolean;
    subscriptionId?: string; // Optional prop to handle cancellation
};

const SubscriptionButton: React.FC<Props> = (props) => {
    const [loading, setLoading] = React.useState(false);

    const handleSubscription = async () => {
        setLoading(true);

        try {
            if (props.isPro && props.subscriptionId) {
                // Handle subscription cancellation
                await axios.post('/api/cancel-subscription', {
                    subscriptionId: props.subscriptionId
                });
                alert('Subscription canceled successfully');
            } else {
                // Handle subscription purchase
                const response = await axios.get('/api/stripe');
                window.location.href = response.data.url;
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button onClick={handleSubscription} disabled={loading}>
            {props.isPro ? "Manage subscription" : "Get Pro"}
        </Button>
    );
};

export default SubscriptionButton;
