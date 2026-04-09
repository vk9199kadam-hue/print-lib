import QRCode from 'qrcode';

export async function generateQR(order_id: string): Promise<string> {
  try {
    return await QRCode.toDataURL('Library Print:' + order_id, {
      width: 200,
      margin: 2,
      color: { dark: '#0A1628', light: '#ffffff' }
    });
  } catch {
    return '';
  }
}
