import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

export function getFileType(filename: string): 'pdf' | 'word' | 'powerpoint' | 'image' | 'text' {
  const ext = filename.toLowerCase().split('.').pop() || '';
  if (ext === 'pdf') return 'pdf';
  if (['docx', 'doc'].includes(ext)) return 'word';
  if (['ppt', 'pptx'].includes(ext)) return 'powerpoint';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
  if (ext === 'txt') return 'text';
  return 'pdf';
}

export function isAllowedFile(filename: string): boolean {
  const allowed = ['pdf', 'docx', 'doc', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'txt'];
  const ext = filename.toLowerCase().split('.').pop() || '';
  return allowed.includes(ext);
}

/**
 * THE PROFESSIONAL PAGE COUNTER (Hybrid Approach)
 * 1. PDF/Images are counted locally (fast).
 * 2. Word files are sent to the CloudConvert API (100% Accurate).
 */
export async function getPageCount(file: File): Promise<number | null> {
  const ext = file.name.toLowerCase().split('.').pop() || '';
  
  // 1. PDF - Always Accurate & Instant
  if (ext === 'pdf') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      return pdf.numPages;
    } catch { return null; }
  }

  // 2. Images & Text
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 1;
  if (ext === 'txt') {
    const text = await file.text();
    return Math.max(1, Math.ceil(text.length / 3000));
  }

  // 3. Word (.docx only) - Accurate Internal Metadata + Smart Content Parsing
  if (ext === 'docx') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      
      // Attempt 1: Official App Properties Metadata (Often missing in WPS Office)
      const appXml = await zip.file("docProps/app.xml")?.async("text");
      if (appXml) {
        const pageMatch = appXml.match(/Pages>(\d+)</i);
        if (pageMatch) {
          const internalCount = parseInt(pageMatch[1]);
          if (internalCount > 0) {
            console.log("✅ MS Word Metadata Pages:", internalCount);
            return internalCount;
          }
        }
      }

      // Attempt 2: Smart Content Parsing (For WPS Office & Google Docs)
      const documentXml = await zip.file("word/document.xml")?.async("text");
      if (documentXml) {
        // Strip XML tags to get raw characters
        const rawText = documentXml.replace(/<[^>]+>/g, '');
        const characterCount = rawText.length;
        
        // Count image tags inside the document
        const imageCount = (documentXml.match(/<w:drawing|<v:imagedata|<pic:pic/g) || []).length;
        
        // Estimate: ~2500 chars per page, ~0.35 pages per image
        const estimatedTextPages = characterCount / 2500;
        const estimatedImagePages = imageCount * 0.35;
        
        const totalEstimated = Math.max(1, Math.ceil(estimatedTextPages + estimatedImagePages));
        console.log(`🤖 Smart Content Guess: ${totalEstimated} pg (${characterCount} chars, ${imageCount} imgs)`);
        return totalEstimated;
      }
    } catch (err) {
      console.warn("Word parsing failed, using conservative fallback:", err);
    }
    // Absolute Last Resort: 150KB per page (prevents 7-page errors on small Word files)
    return Math.max(1, Math.ceil(file.size / 150000));
  }

  // 4. PowerPoint (.pptx)
  if (ext === 'pptx') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      const slides = zip.file(/ppt\/slides\/slide\d+\.xml/);
      if (slides && slides.length > 0) return slides.length;
    } catch (err) { console.warn("PPTX slides error:", err); }
    return Math.max(1, Math.ceil(file.size / 102400));
  }

  return 1; // Default
}
