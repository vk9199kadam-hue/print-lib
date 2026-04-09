import { describe, it, expect } from 'vitest';
import { calcFilePrice, calcTotal } from './priceCalculator';
import { FileItem, Pricing, ExtraServices } from '../types';

describe('Price Calculator Unit Tests', () => {
  const dummyPricing: Pricing = {
    bw_rate: 1,
    color_rate: 4,
    a3_bw_rate: 10,
    a3_color_rate: 15,
    spiral_binding_fee: 20,
    stapling_fee: 0,
    capstone_page_rate: 4,
    capstone_urgent_fee: 180,
    capstone_non_urgent_fee: 140,
  };

  const dummyFile: FileItem = {
    temp_id: 'tmp_1',
    file_name: 'thesis.pdf',
    file_storage_key: 'key_1',
    file_type: 'pdf',
    file_extension: 'pdf',
    page_count: 50,
    print_type: 'bw',
    color_page_ranges: '',
    copies: 1,
    sides: 'single',
    bw_pages: 50,
    color_pages: 0,
    file_price: 100, // Pre-calculated placeholder
    student_note: '',
    file_size_kb: 1024,
  };

  it('calculates file price correctly for Black and White prints', () => {
    const file = { ...dummyFile, print_type: 'bw' as const, page_count: 50 };
    const result = calcFilePrice(file, dummyPricing);
    
    expect(result.bw_pages).toBe(50);
    expect(result.color_pages).toBe(0);
    expect(result.file_price).toBe(50); // 50 * 1 = 50
  });

  it('calculates file price correctly for Color prints', () => {
    const file = { ...dummyFile, print_type: 'color' as const, page_count: 10 };
    const result = calcFilePrice(file, dummyPricing);
    
    expect(result.bw_pages).toBe(0);
    expect(result.color_pages).toBe(10);
    expect(result.file_price).toBe(40); // 10 * 4 = 40
  });

  it('calculates total cart value with extra services (Spiral & Stapling)', () => {
    const file1: FileItem = { ...dummyFile, print_type: 'bw', page_count: 20 }; // 20
    const file2: FileItem = { ...dummyFile, temp_id: 'tmp_2', print_type: 'color', page_count: 5 }; // 20
    const files = [file1, file2];
    
    // Simulate updating the FileItem references with accurate self-pricing
    const calculatedFiles = files.map(f => ({
      ...f,
      ...calcFilePrice(f, dummyPricing)
    }));
    
    const extras: ExtraServices = { spiral_binding: true, stapling: true };
    
    const total = calcTotal(calculatedFiles, extras, dummyPricing);
    
    expect(total.subtotal).toBe(40); // 20 + 20
    expect(total.service_fee).toBe(20); // 20 + 0
    expect(total.total_amount).toBe(60); // 40 + 20
  });
});
