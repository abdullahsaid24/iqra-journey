import { Button } from "@/quran/components/ui/button";
import { Input } from "@/quran/components/ui/input";
import { Label } from "@/quran/components/ui/label";
import { Card } from "@/quran/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/quran/components/ui/select";
import { useCreateUserForm } from "./user-management/CreateUserFormState";
import { useCreateUser } from "./user-management/useCreateUser";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/quran/lib/supabase";
import { useClasses } from "@/quran/hooks/useClasses";
import { useEffect, useRef, useState } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/quran/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/quran/components/ui/popover";
import { Search } from "lucide-react";
export const CreateUserForm = () => {
  const {
    email,
    setEmail,
    password,
    setPassword,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    role,
    setRole,
    selectedParentId,
    setSelectedParentId,
    selectedClassId,
    setSelectedClassId,
    loading,
    setLoading,
    resetForm,
    isAdultStudent,
    setIsAdultStudent,
    phoneNumber,
    setPhoneNumber,
    secondaryPhoneNumber,
    setSecondaryPhoneNumber
  } = useCreateUserForm();
  const [openEmailDropdown, setOpenEmailDropdown] = useState(false);
  const [openParentDropdown, setOpenParentDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [parentSearchQuery, setParentSearchQuery] = useState("");
  const emailInputRef = useRef<HTMLInputElement>(null);
  const parentInputRef = useRef<HTMLInputElement>(null);
  const {
    createUser
  } = useCreateUser();
  const queryClient = useQueryClient();
  useEffect(() => {
    if ((role === 'student' || isAdultStudent) && firstName && lastName) {
      const formattedFirstName = firstName.toLowerCase().replace(/[^\w]/g, '');
      const formattedLastName = lastName.toLowerCase().replace(/[^\w]/g, '');
      const generatedEmail = `${formattedFirstName}.${formattedLastName}@iqra.com`;
      setEmail(generatedEmail);
    }
  }, [firstName, lastName, role, isAdultStudent, setEmail]);
  useEffect(() => {
    if (role === 'parent' && !phoneNumber) {
      setPhoneNumber('+1 ');
    }
  }, [role, phoneNumber, setPhoneNumber]);
  useEffect(() => {
    if (openEmailDropdown) {
      setTimeout(() => emailInputRef.current?.focus(), 100);
    }
  }, [openEmailDropdown]);
  useEffect(() => {
    if (openParentDropdown) {
      setTimeout(() => parentInputRef.current?.focus(), 100);
    }
  }, [openParentDropdown]);
  const {
    data: parents = []
  } = useQuery({
    queryKey: ['parents'],
    queryFn: async () => {
      const response = await supabase.functions.invoke('get-parent-users');
      if (response.error) throw response.error;
      return response.data;
    },
    enabled: role === 'student' && !isAdultStudent
  });
  const {
    data: classes,
    isLoading: classesLoading
  } = useClasses("admin");
  const filteredParents = parentSearchQuery ? parents.filter((parent: any) => parent.email?.toLowerCase().includes(parentSearchQuery.toLowerCase()) || `${parent.first_name || ''} ${parent.last_name || ''}`.toLowerCase().includes(parentSearchQuery.toLowerCase())) : parents;
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (role === 'student' && !isAdultStudent && !selectedParentId) {
        throw new Error('Please select a parent for the student');
      }
      const cleanedEmail = email.trim().replace(/\s+/g, '');
      let formattedPhone = phoneNumber?.trim();
      if (formattedPhone && (role === 'parent' || isAdultStudent)) {
        if (!formattedPhone.startsWith('+')) {
          formattedPhone = '+' + formattedPhone;
        }
        if (formattedPhone === '+') {
          formattedPhone = '+1 587 409 3011'; // Use the updated Twilio number
        }
      }
      let formattedSecondaryPhone = secondaryPhoneNumber?.trim();
      if (formattedSecondaryPhone && !formattedSecondaryPhone.startsWith('+')) {
        formattedSecondaryPhone = '+' + formattedSecondaryPhone;
      }

      const success = await createUser(
        cleanedEmail,
        password,
        isAdultStudent ? 'adult_student' : role,
        firstName,
        lastName,
        !isAdultStudent && role === 'student' ? selectedParentId : undefined,
        role === 'student' || isAdultStudent ? selectedClassId : undefined,
        role === 'parent' || isAdultStudent ? formattedPhone : undefined,
        role === 'parent' || isAdultStudent ? formattedSecondaryPhone : undefined
      );
      if (success) {
        queryClient.invalidateQueries({
          queryKey: ['users']
        });
        queryClient.invalidateQueries({
          queryKey: ['parents']
        });
        queryClient.invalidateQueries({
          queryKey: ['adult-students']
        });
        resetForm();
        setSearchQuery("");
        setParentSearchQuery("");
      }
    } catch (error: any) {
      console.error('Create user error:', error);
    } finally {
      setLoading(false);
    }
  };
  return <Card className="p-6 bg-white border-slate-200 shadow-sm">
    <h2 className="text-2xl font-bold mb-6 text-slate-900">Create New Parent or Student</h2>
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-slate-700">First Name</Label>
          <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} required className="bg-white border-slate-200 focus:ring-quran-primary" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-slate-700">Last Name</Label>
          <Input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} required className="bg-white border-slate-200 focus:ring-quran-primary" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="role" className="text-slate-700">Role</Label>
        <Select value={role} onValueChange={(value: "parent" | "student") => {
          setRole(value);
          setIsAdultStudent(false);
          if (value !== 'student') {
            setSelectedParentId('');
            setSelectedClassId('');
          }
        }}>
          <SelectTrigger className="bg-white border-slate-200 focus:ring-quran-primary text-slate-900">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200">
            <SelectItem value="parent" className="hover:bg-slate-100 text-slate-900">Parent</SelectItem>
            <SelectItem value="student" className="hover:bg-slate-100 text-slate-900">Student</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(role === 'parent' || role === 'student' && isAdultStudent) && <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phoneNumber" className="text-slate-700">Primary Phone Number (Required for notifications)</Label>
          <Input id="phoneNumber" type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="+1 587 409 3011" required={isAdultStudent} className="bg-white border-slate-200 focus:ring-quran-primary" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="secondaryPhoneNumber" className="text-slate-700">Secondary Phone Number (Optional)</Label>
          <Input id="secondaryPhoneNumber" type="tel" value={secondaryPhoneNumber} onChange={e => setSecondaryPhoneNumber(e.target.value)} placeholder="+1 234 567 8900" className="bg-white border-slate-200 focus:ring-quran-primary" />
        </div>
        <p className="text-xs text-slate-500">Include country code (e.g., +1 for US). Both numbers will receive SMS notifications.</p>
      </div>}

      <div className="space-y-2">
        <Label htmlFor="email" className="text-slate-700">Email</Label>
        <Popover open={openEmailDropdown} onOpenChange={setOpenEmailDropdown}>
          <PopoverTrigger asChild>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
              <Input id="email" type="email" value={email} onChange={e => {
                setEmail(e.target.value);
                setSearchQuery(e.target.value);
                setOpenEmailDropdown(true);
              }} className="pl-10 bg-white border-slate-200 focus:ring-quran-primary" required />
            </div>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-full max-w-[400px] bg-white border-slate-200" align="start">
            <Command className="bg-white border-none">
              <CommandInput ref={emailInputRef} placeholder="Search email..." value={searchQuery} onValueChange={value => {
                setSearchQuery(value);
                setEmail(value);
              }} className="text-slate-900 placeholder:text-slate-400 border-none focus:ring-0" autoFocus />
              <CommandList className="bg-white">
                <CommandEmpty className="text-slate-500 p-2">No matching emails</CommandEmpty>
                <CommandGroup heading="Suggestions" className="text-slate-900">
                  {["example@iqra.com", "parent@iqra.com", "student@iqra.com", "teacher@iqra.com"].filter(item => item.includes(searchQuery.toLowerCase())).map(item => <CommandItem key={item} value={item} onSelect={value => {
                    setEmail(value);
                    setOpenEmailDropdown(false);
                  }} className="text-slate-900 hover:bg-slate-100 cursor-pointer">
                    {item}
                  </CommandItem>)}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {(role === 'student' || isAdultStudent) && <p className="text-xs text-slate-500">Email is auto-generated but you can modify it if needed</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-slate-700">Password</Label>
        <Input id="password" type="text" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="bg-white border-slate-200 focus:ring-quran-primary" />
        <p className="text-xs text-slate-500">Default password is pre-filled</p>
      </div>

      {role === 'student' && <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <input type="checkbox" id="isAdultStudent" checked={isAdultStudent} onChange={e => {
            setIsAdultStudent(e.target.checked);
            if (e.target.checked) {
              setSelectedParentId('');
            }
          }} className="h-4 w-4 rounded border-slate-300 text-quran-primary focus:ring-quran-primary" />
          <Label htmlFor="isAdultStudent" className="text-sm font-medium text-slate-700">
            This is an adult student (no parent needed)
          </Label>
        </div>
      </div>}

      {role === 'student' && !isAdultStudent && <div className="space-y-2">
        <Label htmlFor="parent" className="text-slate-700">Select Parent</Label>
        <Popover open={openParentDropdown} onOpenChange={setOpenParentDropdown}>
          <PopoverTrigger asChild>
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
              <Input id="parentSearch" placeholder="Search parent..." value={parentSearchQuery} onChange={e => {
                setParentSearchQuery(e.target.value);
                setOpenParentDropdown(true);
              }} className="pl-10 w-full bg-white border-slate-200 focus:ring-quran-primary" />
            </div>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-full max-w-[400px] bg-white border-slate-200" align="start">
            <Command className="bg-white border-none">
              <CommandInput ref={parentInputRef} placeholder="Search parent..." value={parentSearchQuery} onValueChange={setParentSearchQuery} className="text-slate-900 placeholder:text-slate-400 border-none focus:ring-0" autoFocus />
              <CommandList className="bg-white">
                <CommandEmpty className="text-slate-500 p-2">No parents found</CommandEmpty>
                <CommandGroup heading="Parents" className="text-slate-900">
                  {filteredParents.map((parent: any) => <CommandItem key={parent.id} value={parent.email} onSelect={() => {
                    setSelectedParentId(parent.id);
                    setParentSearchQuery(parent.email);
                    setOpenParentDropdown(false);
                  }} className="text-slate-900 hover:bg-slate-100 cursor-pointer">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900">{parent.first_name} {parent.last_name}</span>
                      <span className="text-sm opacity-80 text-slate-600">{parent.email}</span>
                    </div>
                  </CommandItem>)}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {selectedParentId && <p className="text-xs text-green-600">Parent selected</p>}
      </div>}

      {(role === 'student' || isAdultStudent) && <div className="space-y-2">
        <Label htmlFor="class" className="text-slate-700">Select Class</Label>
        <Select value={selectedClassId} onValueChange={setSelectedClassId}>
          <SelectTrigger className="bg-white border-slate-200 focus:ring-quran-primary text-slate-900">
            <SelectValue placeholder="Select class" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200">
            {!classesLoading && classes?.map((classItem: any) => <SelectItem key={classItem.id} value={classItem.id} className="hover:bg-slate-100 text-slate-900">
              {classItem.name}
            </SelectItem>)}
          </SelectContent>
        </Select>
      </div>}

      <Button type="submit" className="w-full bg-quran-primary hover:bg-quran-primary/90 text-white" disabled={loading}>
        {loading ? "Creating..." : "Create User"}
      </Button>
    </form>
  </Card>;
};
