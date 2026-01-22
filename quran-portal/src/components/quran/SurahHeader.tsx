import type { SurahInfo } from "@/types/mushaf";
import { toArabicNumerals } from "@/lib/mushaf-formatter";

interface SurahHeaderProps {
  surah: SurahInfo;
}

export const SurahHeader = ({ surah }: SurahHeaderProps) => {
  const revelationText = surah.revelation_place === "makkah" ? "مَكِّيَّة" : "مَدَنِيَّة";
  const versesCount = toArabicNumerals(surah.verses_count);
  
  return (
    <div className="surah-header-container">
      <div className="surah-header-banner">
        {/* Left ornament */}
        <div className="surah-header-ornament surah-header-ornament-left">
          <svg viewBox="0 0 50 30" className="w-12 h-8">
            <path d="M45 15 C40 5, 30 5, 25 15 C20 5, 10 5, 5 15 C10 25, 20 25, 25 15 C30 25, 40 25, 45 15" 
                  fill="none" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        </div>
        
        {/* Surah info */}
        <div className="surah-header-content">
          <div className="surah-header-name">
            سُورَةُ {surah.name_arabic}
          </div>
          <div className="surah-header-info">
            <span>{revelationText}</span>
            <span className="surah-header-separator">۞</span>
            <span>آياتها {versesCount}</span>
          </div>
        </div>
        
        {/* Right ornament */}
        <div className="surah-header-ornament surah-header-ornament-right">
          <svg viewBox="0 0 50 30" className="w-12 h-8">
            <path d="M5 15 C10 5, 20 5, 25 15 C30 5, 40 5, 45 15 C40 25, 30 25, 25 15 C20 25, 10 25, 5 15" 
                  fill="none" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

