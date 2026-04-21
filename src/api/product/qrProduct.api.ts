import { http } from "../../base_api/base_api";

/**
 * Product interface - adjust based on your API response structure
 */
export interface Product {
    id: string;
    name: string;
    sku: string;
    price: number;
    description?: string;
    category?: string;
    stock?: number;
    imageUrl?: string;
    qrCode?: string;
}

/**
 * Fetch product by QR code value
 * Adjust the endpoint according to your backend API
 */
export const fetchProductByQRCode = async (qrValue: string): Promise<Product> => {
    try {
        const response = await http(`/products/qr/${qrValue}`, {
            method: "GET",
        });
        
        // Adjust based on your API response structure
        return response.data || response;
    } catch (error: any) {
        console.error('Error fetching product by QR code:', error);
        throw new Error(error.message || 'Product not found');
    }
};

/**
 * Alternative: Search products by QR code
 */
export const searchProductByQRCode = async (qrValue: string): Promise<Product[]> => {
    try {
        const response = await http("/products/search", {
            method: "POST",
            body: JSON.stringify({ qrCode: qrValue }),
        });
        
        return response.data || response;
    } catch (error: any) {
        console.error('Error searching product by QR code:', error);
        throw new Error(error.message || 'Search failed');
    }
};

export default { fetchProductByQRCode, searchProductByQRCode };
