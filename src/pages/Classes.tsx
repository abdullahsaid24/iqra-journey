
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Clock, MapPin, Phone } from "lucide-react";

const Classes = () => {
  const schedule = [
    {
      day: "Saturday",
      sessions: [
        { time: "1:00 - 3:00 PM", group: "Quran Studies (Junior Group)" },
        { time: "3:00 - 5:00 PM", group: "Quran Studies (Senior Group)" }
      ]
    },
    {
      day: "Sunday",
      sessions: [
        { time: "1:00 - 3:00 PM", group: "Quran Studies (Junior Group)" },
        { time: "3:00 - 5:00 PM", group: "Quran Studies (Senior Group)" }
      ]
    },
    {
      day: "Monday",
      sessions: [
        { time: "6:30 - 8:30 PM", group: "Islamic Studies (Junior Group)" }
      ]
    },
    {
      day: "Wednesday",
      sessions: [
        { time: "6:30 - 9:00 PM", group: "Islamic Studies (Senior Group)" }
      ]
    },
    {
      day: "Thursday",
      sessions: [
        { time: "6:30 - 9:00 PM", group: "Islamic Studies (Senior Group)" }
      ]
    },
    {
      day: "Friday",
      sessions: [
        { time: "6:30 - 8:30 PM", group: "Islamic Studies (Junior Group)" }
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 pt-16">
        <section className="container px-4 py-24">
          <div className="max-w-4xl mx-auto">
            <h1 className="section-title text-center mb-12">Class Schedule</h1>
            
            <div className="grid gap-6">
              {schedule.map((day, index) => (
                <div key={index} className="card">
                  <h2 className="text-xl font-outfit font-medium mb-4">
                    {day.day}
                  </h2>
                  <div className="space-y-3">
                    {day.sessions.map((session, sIndex) => (
                      <div key={sIndex} className="flex items-center gap-4 text-muted-foreground">
                        <Clock className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-medium">{session.time}</span>
                        <span>→</span>
                        <span>{session.group}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 p-6 bg-muted rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium mb-1">Location</h3>
                    <p className="text-muted-foreground">3711A 98 St NW</p>
                    <p className="text-muted-foreground">Edmonton, AB, T6E 5V4</p>
                    <p className="text-muted-foreground">Canada</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium mb-1">Contact</h3>
                    <p className="text-muted-foreground">(780) 990-7823</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Classes;
