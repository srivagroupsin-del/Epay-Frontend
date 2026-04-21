import React, { useState } from 'react';
import QRScannerModal from './QRScannerModal';
import { type Product } from '../../api/product/qrProduct.api';
import './QRScannerModal.css';

/**
 * Example Component: How to integrate QR Scanner in your page
 */
const QRScannerExample: React.FC = () => {
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [lastScannedProduct, setLastScannedProduct] = useState<Product | null>(null);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Handle product found from QR scan
    const handleProductFound = (product: Product) => {
        setLastScannedProduct(product);
        setNotification({
            type: 'success',
            message: `Product "${product.name}" scanned successfully!`
        });

        // Clear notification after 3 seconds
        setTimeout(() => {
            setNotification(null);
        }, 3000);
    };

    // Custom API function (alternative to using the default)
    const customFetchProductByQRCode = async (qrValue: string): Promise<Product> => {
        // This example shows how to customize the API call
        // You can add authentication, headers, etc. here
        console.log('Fetching product for QR:', qrValue);

        // Simulated API call - replace with actual API
        // return await fetchProductByQRCode(qrValue);

        // For demo purposes, return mock data
        return {
            id: qrValue,
            name: `Product from QR: ${qrValue}`,
            sku: `SKU-${qrValue}`,
            price: 999,
            description: 'This is a sample product fetched from QR code',
            category: 'Electronics',
            stock: 50,
            imageUrl: 'https://via.placeholder.com/150'
        };
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>QR Scanner Integration Example</h1>

            {/* Notification */}
            {notification && (
                <div style={{
                    padding: '15px',
                    marginBottom: '20px',
                    borderRadius: '8px',
                    backgroundColor: notification.type === 'success' ? '#d4edda' : '#f8d7da',
                    color: notification.type === 'success' ? '#155724' : '#721c24',
                    border: `1px solid ${notification.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
                }}>
                    {notification.message}
                </div>
            )}

            {/* Open Scanner Button */}
            <button
                onClick={() => setIsQRModalOpen(true)}
                style={{
                    padding: '12px 24px',
                    fontSize: '16px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    marginBottom: '20px'
                }}
            >
                📷 Open QR Scanner
            </button>

            {/* Last Scanned Product */}
            {lastScannedProduct && (
                <div style={{
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '20px',
                    marginTop: '20px'
                }}>
                    <h3>Last Scanned Product</h3>
                    <p><strong>ID:</strong> {lastScannedProduct.id}</p>
                    <p><strong>Name:</strong> {lastScannedProduct.name}</p>
                    <p><strong>SKU:</strong> {lastScannedProduct.sku}</p>
                    <p><strong>Price:</strong> ₹{lastScannedProduct.price}</p>
                    {lastScannedProduct.description && (
                        <p><strong>Description:</strong> {lastScannedProduct.description}</p>
                    )}
                </div>
            )}

            {/* QR Scanner Modal */}
            <QRScannerModal
                isOpen={isQRModalOpen}
                onClose={() => setIsQRModalOpen(false)}
                onProductFound={handleProductFound}
                fetchProductByQRCode={customFetchProductByQRCode}
            />

            {/* Usage Instructions */}
            <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <h3>📋 Usage Instructions</h3>
                <ol style={{ lineHeight: '1.8' }}>
                    <li>Import the QRScannerModal component</li>
                    <li>Add state for modal visibility: <code>const [isQRModalOpen, setIsQRModalOpen] = useState(false);</code></li>
                    <li>Create a button to open the modal</li>
                    <li>Pass the required props to QRScannerModal</li>
                    <li>Optionally provide a custom <code>fetchProductByQRCode</code> function</li>
                </ol>

                <h4>Code Example:</h4>
                <pre style={{
                    backgroundColor: '#2d2d2d',
                    color: '#f8f8f2',
                    padding: '15px',
                    borderRadius: '8px',
                    overflow: 'auto'
                }}>
                    {`import QRScannerModal from '../../components/qrscanner/QRScannerModal';

const MyComponent = () => {
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);

    const fetchProductByQRCode = async (qrValue: string) => {
        // Your API call here
        const response = await fetch(\`/api/products/qr/\${qrValue}\`);
        return response.json();
    };

    return (
        <>
            <button onClick={() => setIsQRModalOpen(true)}>
                📷 Open QR Scanner
            </button>

            <QRScannerModal
                isOpen={isQRModalOpen}
                onClose={() => setIsQRModalOpen(false)}
                fetchProductByQRCode={fetchProductByQRCode}
            />
        </>
    );
};`}
                </pre>
            </div>
        </div>
    );
};

export default QRScannerExample;
