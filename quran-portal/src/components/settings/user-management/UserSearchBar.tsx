import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
interface UserSearchBarProps {
  searchQuery: string;
  onSearch: (query: string) => void;
  filteredUsers: any[];
  teacherUsers: any[];
  regularStudentUsers: any[];
  adultStudentUsers: any[];
  parentUsers: any[];
}
export const UserSearchBar = ({
  searchQuery,
  onSearch,
  teacherUsers,
  regularStudentUsers,
  adultStudentUsers,
  parentUsers
}: UserSearchBarProps) => {
  const [displayDropdown, setDisplayDropdown] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setDisplayDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);
  useEffect(() => {
    setDisplayDropdown(searchQuery.length > 0);
  }, [searchQuery]);
  return <div className="mb-6 relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
        <Input ref={searchInputRef} placeholder="Search users by name or email..." value={searchQuery} onChange={e => onSearch(e.target.value)} className="pl-10 w-full border-quran-border focus:border-quran-primary" autoComplete="off" onFocus={() => {
        if (searchQuery) setDisplayDropdown(true);
      }} />
      </div>
      
      {displayDropdown && <div ref={dropdownRef} className="absolute z-50 mt-1 w-full max-w-md bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto">
          {teacherUsers.length > 0 && <>
              <div className="px-2 py-1.5 text-xs font-semibold bg-gray-100">Teachers</div>
              {teacherUsers.slice(0, 5).map(user => <div key={user.id} className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => {
          onSearch(user.email || '');
          setDisplayDropdown(false);
        }}>
                  <div className="font-medium">{user.first_name} {user.last_name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>)}
            </>}
          
          {regularStudentUsers.length > 0 && <>
              <div className="px-2 py-1.5 text-xs font-semibold bg-gray-100">Regular Students</div>
              {regularStudentUsers.slice(0, 5).map(user => <div key={user.id} className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => {
          onSearch(user.email || '');
          setDisplayDropdown(false);
        }}>
                  <div className="font-medium bg-zinc-950">{user.first_name} {user.last_name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>)}
            </>}
          
          {adultStudentUsers.length > 0 && <>
              <div className="px-2 py-1.5 text-xs font-semibold bg-gray-100">Adult Students</div>
              {adultStudentUsers.slice(0, 5).map(user => <div key={user.id} className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => {
          onSearch(user.email || '');
          setDisplayDropdown(false);
        }}>
                  <div className="font-medium bg-zinc-950">{user.first_name} {user.last_name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                  <div className="text-xs text-blue-500">Adult Student</div>
                </div>)}
            </>}
          
          {parentUsers.length > 0 && <>
              <div className="px-2 py-1.5 text-xs font-semibold bg-gray-100">Parents</div>
              {parentUsers.slice(0, 5).map(user => <div key={user.id} className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => {
          onSearch(user.email || '');
          setDisplayDropdown(false);
        }}>
                  <div className="font-medium bg-zinc-600">{user.first_name} {user.last_name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>)}
            </>}
        </div>}
    </div>;
};