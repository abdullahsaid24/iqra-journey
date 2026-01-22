import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/quran/components/ui/select";
import { JUZ_DATA } from "@/quran/types/juz";
import { Input } from "@/quran/components/ui/input";
import { Search } from "lucide-react";

interface CompactJuzSelectProps {
    selectedJuz: string;
    onJuzChange: (value: string) => void;
}

export const CompactJuzSelect = ({
    selectedJuz,
    onJuzChange,
}: CompactJuzSelectProps) => {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredJuzs = JUZ_DATA.filter(juz =>
        juz.number.toString().includes(searchQuery) ||
        juz.name_arabic?.includes(searchQuery) ||
        `juz ${juz.number}`.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Select value={selectedJuz} onValueChange={onJuzChange}>
            <SelectTrigger className="w-[100px] h-8 text-xs bg-white border-quran-border text-quran-bg">
                <SelectValue placeholder="Select Juz" />
            </SelectTrigger>
            <SelectContent className="bg-white max-h-[300px] z-50">
                <div className="p-2 sticky top-0 z-10 bg-white border-b">
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                        <Input
                            placeholder="Search juz..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-8 h-8 text-sm bg-white"
                        />
                    </div>
                </div>
                <div className="h-[200px] overflow-y-auto">
                    {filteredJuzs.length > 0 ? (
                        filteredJuzs.map(juz => (
                            <SelectItem
                                key={juz.number}
                                value={juz.number.toString()}
                                className="text-gray-900 hover:bg-gray-100 cursor-pointer"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-gray-900 text-xs">Juz {juz.number}</span>
                                    <span className="font-arabic text-sm text-gray-900">
                                        {juz.name_arabic}
                                    </span>
                                </div>
                            </SelectItem>
                        ))
                    ) : (
                        <div className="p-2 text-center text-gray-500 text-xs">No juz found</div>
                    )}
                </div>
            </SelectContent>
        </Select>
    );
};
