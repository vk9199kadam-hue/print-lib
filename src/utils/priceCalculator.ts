import { FileItem, ExtraServices, Pricing, PriceResult } from '../types';

function parseColorPageRanges(rangeStr: string, totalPages: number): number {
  if (!rangeStr || !rangeStr.trim()) return 0;
  const pages = new Set<number>();
  rangeStr.split(',').forEach(part => {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map(Number);
      const validEnd = Math.min(end, totalPages);
      for (let i = start; i <= validEnd; i++) {
        if (i >= 1) pages.add(i);
      }
    } else {
      const page = Number(trimmed);
      if (page >= 1 && page <= totalPages) pages.add(page);
    }
  });
  return pages.size;
}

export function calcFilePrice(file: FileItem, pricing: Pricing, isCapstone: boolean = false): { bw_pages: number; color_pages: number; file_price: number } {
  let pages = file.page_count || 1;
  // Apply slides per page reduction for all files
  if (file.slidesPerPage && file.slidesPerPage > 1) {
    pages = Math.ceil(pages / file.slidesPerPage);
  }
  const copies = file.copies || 1;
  let bw_pages = 0;
  let color_pages = 0;

  switch (file.print_type) {
    case 'bw':
      bw_pages = pages * copies;
      break;
    case 'color':
      color_pages = pages * copies;
      break;
    case 'mixed': {
      const colorCount = parseColorPageRanges(file.color_page_ranges, pages);
      color_pages = colorCount * copies;
      bw_pages = (pages - colorCount) * copies;
      break;
    }
  }

  if (file.sides === 'double') {
    bw_pages = Math.ceil(bw_pages / 2);
    color_pages = Math.ceil(color_pages / 2);
  }

  let final_bw_rate = pricing.bw_rate || 1;
  let final_color_rate = pricing.color_rate || 4;

  if (isCapstone) {
    final_bw_rate = pricing.capstone_page_rate || 4;
    final_color_rate = pricing.capstone_page_rate || 4;
  } else if (file.paper_size === 'A3') {
    final_bw_rate = pricing.a3_bw_rate || 10;
    final_color_rate = pricing.a3_color_rate || 15;
  }

  const file_price = bw_pages * final_bw_rate + color_pages * final_color_rate;
  return { bw_pages, color_pages, file_price };
}

export function calcTotal(files: FileItem[], extras: ExtraServices, pricing: Pricing, isCapstone: boolean = false): PriceResult {
  const itemized = files.map(file => {
    const calc = calcFilePrice(file, pricing, isCapstone);
    return {
      file_name: file.file_name,
      bw_pages: calc.bw_pages,
      color_pages: calc.color_pages,
      copies: file.copies,
      file_price: calc.file_price
    };
  });
  const subtotal = itemized.reduce((sum, item) => sum + item.file_price, 0);
  let service_fee = 0;
  if (isCapstone) {
    if (extras.capstone_embossing === 'urgent') {
      service_fee += (pricing.capstone_urgent_fee || 180);
    } else if (extras.capstone_embossing === 'non-urgent') {
      service_fee += (pricing.capstone_non_urgent_fee || 140);
    } else if (extras.capstone_embossing === 'black') {
      service_fee += 140;
    } else if (extras.capstone_embossing === 'brown') {
      service_fee += 160;
    }
    
    if (extras.bond_paper_count) {
      service_fee += (extras.bond_paper_count * 4);
    }
    
    if (extras.spiral_binding) service_fee += (pricing.spiral_binding_fee || 20);
    if (extras.stapling) service_fee += (pricing.stapling_fee || 0);
  } else {
    if (extras.spiral_binding) service_fee += (pricing.spiral_binding_fee || 20);
    if (extras.stapling) service_fee += (pricing.stapling_fee || 0);
  }
  return { itemized, subtotal, service_fee, total_amount: subtotal + service_fee };
}
