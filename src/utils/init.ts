import { librarian, Pricing } from '../types';

export function initializeApp(): void {
  if (!localStorage.getItem('Library Print_librarian')) {
    const librarian: librarian = {
      id: 'shop_001',
      name: 'Shop Owner',
      email: 'shop@Library Print.com',
      password: 'shop123',
      library_name: 'College Print Center',
      is_active: true
    };
    localStorage.setItem('Library Print_librarian', JSON.stringify(librarian));
  }
  if (!localStorage.getItem('Library Print_pricing')) {
    const pricing: Pricing = {
      bw_rate: 1,
      color_rate: 4,
      a3_bw_rate: 10,
      a3_color_rate: 15,
      spiral_binding_fee: 20,
      stapling_fee: 0,
      capstone_page_rate: 4,
      capstone_urgent_fee: 180,
      capstone_non_urgent_fee: 140
    };
    localStorage.setItem('Library Print_pricing', JSON.stringify(pricing));
  }
  if (!localStorage.getItem('Library Print_orders')) {
    localStorage.setItem('Library Print_orders', '[]');
  }
  if (!localStorage.getItem('Library Print_users')) {
    localStorage.setItem('Library Print_users', '[]');
  }
  if (!localStorage.getItem('library_print_files')) {
    localStorage.setItem('library_print_files', '{}');
  }
}
