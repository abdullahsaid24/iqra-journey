import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/quran/components/ui/select";
import { Label } from "@/quran/components/ui/label";
import { JUZ_DATA } from "@/quran/types/juz";
import { Input } from "@/quran/components/ui/input";
import { Search } from "lucide-react";

interface JuzSelectProps {
    selectedJuz: string;
    onJuzChange: (juzNumber: string) => void;
}

export const JuzSelect = ({
    selectedJuz,
    onJuzChange,
}: JuzSelectProps) => {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredJuzs = JUZ_DATA.filter(juz => {
        const matchesSearch =
            juz.number.toString().includes(searchQuery) ||
            juz.name_arabic?.includes(searchQuery) ||
            `juz ${juz.number}`.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    return (
        <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="juz" className="text-right font-semibold text-gray-700">
                Juz
            </Label>
            <div className="col-span-3">
                <Select value={selectedJuz} onValueChange={onJuzChange}>
                    <SelectTrigger className="bg-white text-gray-900 border-gray-200">
                        <SelectValue placeholder="Select Juz" />
                    </SelectTrigger>
                    <SelectContent className="bg-white max-h-[300px]">
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
                                            <span className="text-gray-900">Juz {juz.number}</span>
                                            <span className="font-arabic text-lg text-gray-900">
                                                {juz.name_arabic}
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))
                            ) : (
                                <div className="p-2 text-center text-gray-500">No juz found</div>
                            )}
                        </div>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
};
