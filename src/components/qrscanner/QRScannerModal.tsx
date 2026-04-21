import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import './QRScannerModal.css';

// Product interface - adjust based on your API response
interface Product {
    id: string;
    name: string;
    sku: string;
    price: number;
    description?: string;
    category?: string;
    stock?: number;
    imageUrl?: string;
}

interface QRScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onProductFound?: (product: Product) => void;
    onScanSuccess?: (value: string) => void;
    fetchProductByQRCode?: (qrValue: string) => Promise<Product>;
}

const QRScannerModal: React.FC<QRScannerModalProps> = ({
    isOpen,
    onClose,
    onProductFound,
    onScanSuccess,
    fetchProductByQRCode
}) => {
    const [scanning, setScanning] = useState(false);
    const [scanned, setScanned] = useState(false);
    const [qrValue, setQrValue] = useState('');
    const [product, setProduct] = useState<Product | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
    const [selectedCamera, setSelectedCamera] = useState<string>('');

    const scannerId = 'qr-reader-modal';
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

    // Get available cameras
    const getCameras = useCallback(async () => {
        try {
            const devices = await Html5Qrcode.getCameras();
            const cameraList = devices.map((device: any) => ({
                id: device.id,
                label: device.label || `Camera ${device.id}`
            }));
            setCameras(cameraList);
            if (cameraList.length > 0 && !selectedCamera) {
                setSelectedCamera(cameraList[0].id);
            }
        } catch (err) {
            console.error('Error getting cameras:', err);
            setError('Unable to access cameras. Please ensure camera permissions are granted.');
        }
    }, [selectedCamera]);

    // Start scanning
    const startScanning = useCallback(async () => {
        if (!selectedCamera) {
            setError('No camera selected');
            return;
        }

        setError(null);
        setScanning(true);
        setScanned(false);

        try {
            const html5QrCode = new Html5Qrcode(scannerId);
            html5QrCodeRef.current = html5QrCode;

            await html5QrCode.start(
                selectedCamera,
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1
                },
                (decodedText: string) => {
                    // QR Code detected
                    console.log('QR Code detected:', decodedText);
                    handleQRCodeDetected(decodedText);
                },
                () => {
                    // QR Code not detected in this frame - this is normal
                }
            );
        } catch (err: any) {
            console.error('Error starting scanner:', err);
            setError(err.message || 'Failed to start camera');
            setScanning(false);
        }
    }, [selectedCamera]);

    // Stop scanning
    const stopScanning = useCallback(async () => {
        if (html5QrCodeRef.current) {
            try {
                await html5QrCodeRef.current.stop();
                html5QrCodeRef.current = null;
            } catch (err) {
                console.error('Error stopping scanner:', err);
            }
        }
        setScanning(false);
    }, []);

    // Handle QR code detection
    const handleQRCodeDetected = async (value: string) => {
        // Stop scanning after successful detection
        await stopScanning();
        setQrValue(value);
        setScanned(true);

        if (onScanSuccess) {
            onScanSuccess(value);
        }

        // Fetch product details if API function provided
        if (fetchProductByQRCode) {
            setLoading(true);
            setError(null);
            try {
                const productData = await fetchProductByQRCode(value);
                setProduct(productData);
                if (onProductFound) {
                    onProductFound(productData);
                }
            } catch (err: any) {
                console.error('Error fetching product:', err);
                setError(err.message || 'Product not found for this QR code');
                setProduct(null);
            } finally {
                setLoading(false);
            }
        }
    };

    // Manual QR code entry
    const handleManualEntry = () => {
        if (qrValue.trim()) {
            handleQRCodeDetected(qrValue.trim());
        }
    };

    // Reset scanner for new scan
    const handleNewScan = () => {
        setScanned(false);
        setQrValue('');
        setProduct(null);
        setError(null);
        startScanning();
    };

    // Get cameras on mount
    useEffect(() => {
        if (isOpen) {
            getCameras();
        }
    }, [isOpen, getCameras]);

    // Start scanning when modal opens and camera selected
    useEffect(() => {
        if (isOpen && selectedCamera && !scanned) {
            startScanning();
        }
    }, [isOpen, selectedCamera, scanned, startScanning]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (html5QrCodeRef.current) {
                html5QrCodeRef.current.stop().catch(() => { });
            }
        };
    }, []);

    // Stop scanning when modal closes
    useEffect(() => {
        if (!isOpen) {
            stopScanning();
        }
    }, [isOpen, stopScanning]);

    if (!isOpen) return null;

    return (
        <div className="qr-modal-overlay" onClick={onClose}>
            <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="qr-modal-header">
                    <h3>📷 QR Code Scanner</h3>
                    <button className="qr-close-btn" onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className="qr-modal-body">
                    {!scanned ? (
                        <>
                            {/* Camera Selection */}
                            {cameras.length > 1 && (
                                <div className="qr-camera-select">
                                    <label htmlFor="camera-select">Select Camera:</label>
                                    <select
                                        id="camera-select"
                                        value={selectedCamera}
                                        onChange={(e) => setSelectedCamera(e.target.value)}
                                        disabled={scanning}
                                    >
                                        {cameras.map(camera => (
                                            <option key={camera.id} value={camera.id}>
                                                {camera.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* QR Scanner Area */}
                            <div className="qr-scanner-container">
                                <div
                                    id={scannerId}
                                    className="qr-reader"
                                    style={{ width: '100%' }}
                                />
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="qr-error">
                                    ⚠️ {error}
                                </div>
                            )}

                            {/* Manual Entry */}
                            <div className="qr-manual-entry">
                                <p>Or enter QR code manually:</p>
                                <div className="qr-manual-input">
                                    <input
                                        type="text"
                                        placeholder="Enter QR code value..."
                                        value={qrValue}
                                        onChange={(e) => setQrValue(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleManualEntry()}
                                    />
                                    <button onClick={handleManualEntry} disabled={!qrValue.trim()}>
                                        Search
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Scan Result */}
                            <div className="qr-result">
                                <div className="qr-result-header">
                                    <span className="qr-success-icon">✅</span>
                                    <h4>QR Code Scanned!</h4>
                                </div>

                                <div className="qr-scanned-value">
                                    <strong>Scanned Value:</strong> {qrValue}
                                </div>

                                {loading && (
                                    <div className="qr-loading">
                                        <div className="spinner"></div>
                                        <p>Fetching product details...</p>
                                    </div>
                                )}

                                {error && (
                                    <div className="qr-error">
                                        ⚠️ {error}
                                    </div>
                                )}

                                {/* Product Details */}
                                {product && (
                                    <div className="product-details">
                                        <h4>📦 Product Details</h4>
                                        <div className="product-info">
                                            <p><strong>ID:</strong> {product.id}</p>
                                            <p><strong>Name:</strong> {product.name}</p>
                                            <p><strong>SKU:</strong> {product.sku}</p>
                                            <p><strong>Price:</strong> ₹{product.price}</p>
                                            {product.category && (
                                                <p><strong>Category:</strong> {product.category}</p>
                                            )}
                                            {product.stock !== undefined && (
                                                <p><strong>Stock:</strong> {product.stock}</p>
                                            )}
                                            {product.description && (
                                                <p><strong>Description:</strong> {product.description}</p>
                                            )}
                                            {product.imageUrl && (
                                                <div className="product-image">
                                                    <img src={product.imageUrl} alt={product.name} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="qr-actions">
                                    <button className="qr-btn qr-btn-secondary" onClick={handleNewScan}>
                                        📷 Scan Another
                                    </button>
                                    <button className="qr-btn qr-btn-primary" onClick={onClose}>
                                        Close
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QRScannerModal;
