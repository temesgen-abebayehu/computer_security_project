import React from 'react';

export const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => {
    return (
        <div className={`bg-white shadow-md rounded-lg p-6 ${className || ''}`}>
            {children}
        </div>
    );
};
