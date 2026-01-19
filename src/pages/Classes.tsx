
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Clock, MapPin, Phone, BookOpen, Book } from "lucide-react";

const Classes = () => {
  const schedule = [
    {
      day: "Saturday",
      type: "Quran",
      gender: "Brothers",
      sessions: [
        { time: "1:00 - 3:00 PM", group: "Quran Studies (Junior Group)" },
        { time: "3:00 - 5:00 PM", group: "Quran Studies (Senior Group)" }
      ]
    },
    {
      day: "Sunday",
      type: "Quran",
      gender: "Sisters",
      sessions: [
        { time: "1:00 - 3:00 PM", group: "Quran Studies (Junior Group)" },
        { time: "3:00 - 5:00 PM", group: "Quran Studies (Senior Group)" }
      ]
    },
    {
      day: "Monday",
      type: "Islamic Studies",
      gender: "Brothers",
      sessions: [
        { time: "6:30 - 8:30 PM", group: "Islamic Studies (Junior Group)" }
      ]
    },
    {
      day: "Wednesday",
      type: "Islamic Studies",
      gender: "Sisters",
      sessions: [
        { time: "6:30 - 9:00 PM", group: "Islamic Studies (Senior Group)" }
      ]
    },
    {
      day: "Thursday",
      type: "Islamic Studies",
      gender: "Brothers",
      sessions: [
        { time: "6:30 - 9:00 PM", group: "Islamic Studies (Senior Group)" }
      ]
    },
    {
      day: "Friday",
      type: "Islamic Studies",
      gender: "Sisters",
      sessions: [
        { time: "6:30 - 8:30 PM", group: "Islamic Studies (Junior Group)" }
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 pt-16">
        <section className="relative py-24 bg-primary/5 overflow-hidden">
          <div className="container px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-outfit font-bold mb-6 text-foreground">Class Schedule</h1>
              <div className="h-1 w-24 bg-primary mx-auto rounded-full mb-8"></div>
              <p className="text-xl text-muted-foreground">
                Flexible timings designed to accommodate students of all ages and levels.
              </p>
            </div>
          </div>
        </section>

        <section className="container px-4 py-24">
          <div className="max-w-4xl mx-auto">
            <div className="grid gap-6">
              {schedule.map((day, index) => (
                <div
                  key={index}
                  className="bg-card rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-border/50"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-border/50">
                    <h2 className="text-2xl font-outfit font-bold text-foreground">
                      {day.day}
                    </h2>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm px-4 py-1.5 rounded-full font-medium ${day.gender === "Brothers"
                          ? "bg-blue-50 text-blue-700 border border-blue-100"
                          : "bg-purple-50 text-purple-700 border border-purple-100"
                        }`}>
                        {day.gender}
                      </span>
                      <span className={`flex items-center gap-2 text-sm px-4 py-1.5 rounded-full font-medium ${day.type === "Quran"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : "bg-amber-50 text-amber-700 border border-amber-100"
                        }`}>
                        {day.type === "Quran" ? (
                          <BookOpen className="h-4 w-4" />
                        ) : (
                          <Book className="h-4 w-4" />
                        )}
                        {day.type}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {day.sessions.map((session, sIndex) => (
                      <div key={sIndex} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-muted-foreground bg-muted/30 p-3 rounded-lg">
                        <div className="flex items-center gap-2 min-w-[140px]">
                          <Clock className="h-4 w-4 text-primary shrink-0" />
                          <span className="font-medium text-foreground">{session.time}</span>
                        </div>
                        <span className="hidden sm:block text-muted-foreground/50">|</span>
                        <span className="text-sm sm:text-base">{session.group}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-16 p-8 bg-black/5 rounded-2xl border border-border/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-outfit font-bold text-lg mb-2">Location</h3>
                    <p className="text-muted-foreground">3711A 98 St NW</p>
                    <p className="text-muted-foreground">Edmonton, AB, T6E 5V4</p>
                    <p className="text-muted-foreground">Canada</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-outfit font-bold text-lg mb-2">Contact</h3>
                    <p className="text-muted-foreground font-medium mb-1">(780) 990-7823</p>
                    <p className="text-sm text-muted-foreground">Call or WhatsApp us anytime</p>
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
