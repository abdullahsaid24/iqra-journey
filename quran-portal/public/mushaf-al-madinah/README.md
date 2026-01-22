# Madani Mushaf PDF

Place your Madani Mushaf PDF file here.

## Instructions

1. Copy your PDF file: `01 Mushaf Al Madinah [Green] High Quality - www.Quranpdf.blogspot.com.pdf`
2. Rename it to: `mushaf-al-madinah.pdf`
3. Place it in this directory: `public/mushaf-al-madinah/mushaf-al-madinah.pdf`

The file should be accessible at: `/mushaf-al-madinah/mushaf-al-madinah.pdf`

## PDF Page Mapping

The component maps Quran pages (1-604) to PDF pages. If your PDF has cover pages:
- If PDF page 1 is the cover, Quran page 1 = PDF page 2 (offset = 1)
- If PDF pages 1-2 are covers, Quran page 1 = PDF page 3 (offset = 2)

You can adjust the `PDF_PAGE_OFFSET` in `src/components/quran/MushafPdfViewer.tsx` if needed.

