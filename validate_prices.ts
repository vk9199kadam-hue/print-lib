import { calcFilePrice, calcTotal } from './src/utils/priceCalculator.ts';
import { FileItem, Pricing, ExtraServices } from './src/types/index.ts';

const shopPricing: Pricing = {
  bw_rate: 1,
  color_rate: 4,
  a3_bw_rate: 10,
  a3_color_rate: 15,
  spiral_binding_fee: 20,
  stapling_fee: 5,
  capstone_page_rate: 4,
  capstone_urgent_fee: 180,
  capstone_non_urgent_fee: 140,
};

function testStandardPrint() {
  console.log("--- Testing Standard Print ---");
  const file: FileItem = {
    temp_id: '1', file_name: 'test.pdf', file_storage_key: 'k', file_type: 'pdf', 
    file_extension: 'pdf', page_count: 50, print_type: 'bw', color_page_ranges: '', 
    copies: 1, sides: 'single', bw_pages: 0, color_pages: 0, file_price: 0, 
    student_note: '', file_size_kb: 100
  };
  const extras: ExtraServices = { spiral_binding: true, stapling: true };
  
  const fileResult = calcFilePrice(file, shopPricing, false);
  const totalResult = calcTotal([file], extras, shopPricing, false);

  console.log(`Page Price (50pg @ ₹1): ₹${fileResult.file_price}`);
  console.log(`Subtotal: ₹${totalResult.subtotal}`);
  console.log(`Service Fee (Spiral ₹20 + Stapling ₹5): ₹${totalResult.service_fee}`);
  console.log(`Grand Total (50 + 25): ₹${totalResult.total_amount}`);
  console.log(totalResult.total_amount === 75 ? "✅ Standard Print PASSED" : "❌ Standard Print FAILED");
}

function testCapstonePrint() {
  console.log("\n--- Testing Capstone Project Print ---");
  const projectFile: FileItem = {
    temp_id: 'cap_1', file_name: 'project.pdf', file_storage_key: 'k2', file_type: 'pdf', 
    file_extension: 'pdf', page_count: 100, print_type: 'bw', color_page_ranges: '', 
    copies: 1, sides: 'single', bw_pages: 0, color_pages: 0, file_price: 0, 
    student_note: '', file_size_kb: 500
  };

  // Case 1: Black Embossing (₹140) + 5 Bond Pages (₹4 each)
  const extrasBlack: ExtraServices = { 
    spiral_binding: false, 
    stapling: false, 
    capstone_embossing: 'black', 
    bond_paper_count: 5 
  };
  
  const fileResult = calcFilePrice(projectFile, shopPricing, true);
  const totalResult = calcTotal([projectFile], extrasBlack, shopPricing, true);

  console.log(`Page Price (100pg @ ₹4): ₹${fileResult.file_price}`);
  console.log(`Embossing Fee (Black): ₹140`);
  console.log(`Bond Paper Fee (5pg @ ₹4): ₹20`);
  console.log(`Total Service Fee: ₹${totalResult.service_fee}`);
  console.log(`Grand Total (400 + 160): ₹${totalResult.total_amount}`);
  console.log(totalResult.total_amount === 560 ? "✅ Capstone Black PASSED" : "❌ Capstone Black FAILED");

  // Case 2: Brown Embossing (₹160) + No Bond Pages
  const extrasBrown: ExtraServices = { 
    spiral_binding: false, 
    stapling: false, 
    capstone_embossing: 'brown', 
    bond_paper_count: 0 
  };
  const totalResultBrown = calcTotal([projectFile], extrasBrown, shopPricing, true);
  console.log(`\nGrand Total Brown (400 + 160): ₹${totalResultBrown.total_amount}`);
  console.log(totalResultBrown.total_amount === 560 ? "✅ Capstone Brown PASSED" : "❌ Capstone Brown FAILED");
}

testStandardPrint();
testCapstonePrint();
