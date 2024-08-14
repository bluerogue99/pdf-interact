import React from 'react';

type PDFViewerProps = {
    pdf_url: string;
};

const PDFViewer: React.FC<PDFViewerProps> = ({ pdf_url }) => {
    return (
        <div className="w-full h-full">
            {pdf_url ? (
                <iframe src={pdf_url} width="100%" height="100%" style={{ border: 'none' }} allow="fullscreen">
                </iframe>
            ) : (
                <p>No PDF available</p>
            )}
        </div>
    );
};

export default PDFViewer;