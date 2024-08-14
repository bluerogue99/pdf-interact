'use client';
import React from 'react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

// Define the type for props with children
type Props = {
    children: React.ReactNode;
};

// Create a new QueryClient instance
const queryClient = new QueryClient();

// Use React.FC for functional component with type checking
const Providers: React.FC<Props> = ({ children }) => {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
};

export default Providers;
