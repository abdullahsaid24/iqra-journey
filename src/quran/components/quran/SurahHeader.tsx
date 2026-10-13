import type { SurahInfo } from "@/quran/types/mushaf";

interface SurahHeaderProps {
  surah: SurahInfo;
  /** Sized to one printed line so the page keeps its 15-line geometry. */
  height: number;
  fontSize: number;
}

/**
 * The ornamented band the print puts above a surah's first line.
 *
 * It occupies exactly one line slot. The surah name is ordinary Arabic text in
 * a naskh face, not a QCF glyph - the page fonts carry verse words only, and
 * the separate header font is not published on the CDN.
 */
export const SurahHeader = ({ surah, height, fontSize }: SurahHeaderProps) => {
  return (
    <div className="flex items-center justify-center" style={{ height }}>
      <div
        className="flex items-center justify-center w-full"
        style={{
          height: height * 0.82,
          border: "1.5px solid #b08f52",
          borderRadius: 3,
          background: "linear-gradient(#f7edd6, #efe0c0 60%, #e8d5ad)",
          boxShadow: "inset 0 0 0 3px #fbf5e6, inset 0 0 0 4px #cfae70",
          fontFamily: "'Noto Naskh Arabic', serif",
          fontWeight: 600,
          fontSize,
          color: "#6b4f2a",
          letterSpacing: ".02em",
          whiteSpace: "nowrap",
          overflow: "hidden",
        }}
      >
        سورة {surah.name_arabic}
      </div>
    </div>
  );
};
