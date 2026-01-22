
import { useState, useEffect } from "react";
import { findAdultStudentPhoneByEmail } from "@/lib/studentUtils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const TestMustafaLookup = () => {
  const [mustafaPhone, setMustafaPhone] = useState<string | null>(null);
  const [examplePhone, setExamplePhone] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookupPhoneNumbers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("Looking up phone numbers...");
      const mustafaPhoneResult = await findAdultStudentPhoneByEmail("testmustafa.test@iqra.com");
      const examplePhoneResult = await findAdultStudentPhoneByEmail("email@example.com");
      
      console.log("Results from lookup:");
      console.log("TestMustafa Phone:", mustafaPhoneResult);
      console.log("Example Email Phone:", examplePhoneResult);
      
      setMustafaPhone(mustafaPhoneResult);
      setExamplePhone(examplePhoneResult);

      if (!mustafaPhoneResult && !examplePhoneResult) {
        setError("No phone numbers found for these emails");
      }
    } catch (err) {
      setError("Error looking up phone numbers");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Run lookup on page load
  useEffect(() => {
    lookupPhoneNumbers();
  }, []);

  const isPhoneFormatValid = (phone: string | null) => {
    // Check if phone is a valid international format starting with +
    return phone ? /^\+[1-9]\d{1,14}$/.test(phone) : false;
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="p-6 max-w-md mx-auto">
        <h2 className="text-xl font-bold mb-4">Email Phone Number Lookup</h2>

        {error && (
          <div className="p-2 bg-red-100 border border-red-300 text-red-800 rounded mb-4">
            {error}
          </div>
        )}

        <div className="mb-4">
          <Button 
            onClick={lookupPhoneNumbers}
            disabled={isLoading}
            className="w-full mb-4"
          >
            {isLoading ? "Loading..." : "Refresh Phone Numbers"}
          </Button>
        </div>

        <div className="p-3 bg-green-100 border border-green-300 text-green-800 rounded mb-4">
          <p className="font-bold">TestMustafa Phone Number:</p>
          <p className="text-lg">{mustafaPhone || "Not found"}</p>
          {mustafaPhone && (
            <p className="text-sm">
              Format Valid: {isPhoneFormatValid(mustafaPhone) ? 'Yes' : 'No'}
            </p>
          )}
        </div>

        <div className="p-3 bg-blue-100 border border-blue-300 text-blue-800 rounded">
          <p className="font-bold">Example Email Phone Number:</p>
          <p className="text-lg">{examplePhone || "Not found"}</p>
          {examplePhone && (
            <p className="text-sm">
              Format Valid: {isPhoneFormatValid(examplePhone) ? 'Yes' : 'No'}
            </p>
          )}
        </div>

        <div className="mt-4 p-3 bg-gray-100 rounded">
          <p className="text-sm text-gray-600">
            <strong>Debug Info:</strong> The system will try to find phone numbers in both the adult_students 
            table and the parent_student_links table.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default TestMustafaLookup;
