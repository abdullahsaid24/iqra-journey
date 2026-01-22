
interface StudentHeaderProps {
  name: string;
}

export const StudentHeader = ({ name }: StudentHeaderProps) => {
  return (
    <header className="mb-4 sm:mb-6 md:mb-8 text-center px-2">
      <h1 className="mb-2 text-2xl sm:text-3xl md:text-4xl font-bold text-quran-primary">
        {name}'s Progress
      </h1>
      <p className="text-base sm:text-lg text-quran-bg">Track and manage lesson progress</p>
    </header>
  );
};
