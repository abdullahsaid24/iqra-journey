interface MushafBorderProps {
  children: React.ReactNode;
}

export const MushafBorder = ({ children }: MushafBorderProps) => {
  return (
    <div className="mushaf-border">
      <div className="mushaf-corner mushaf-corner-tl" />
      <div className="mushaf-corner mushaf-corner-tr" />
      <div className="mushaf-corner mushaf-corner-bl" />
      <div className="mushaf-corner mushaf-corner-br" />
      
      <div className="mushaf-border-content">
        {children}
      </div>
    </div>
  );
};
