import { BookOpen, Clock, MapPin, Scroll, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Weekly halaqah currently running at the centre.
 *
 * Rendered as text rather than the poster image so it stays legible on a phone
 * and the address, times and teacher are selectable and searchable. When the
 * series changes, edit the values below.
 */
const FeaturedEvent = () => {
  const sessions = [
    {
      day: "Wednesdays",
      audience: "Sisters",
      time: "6:30 PM",
      accent: "bg-primary",
      ring: "ring-primary/20",
    },
    {
      day: "Thursdays",
      audience: "Brothers",
      time: "6:30 PM",
      accent: "bg-[#1B3A6B]",
      ring: "ring-[#1B3A6B]/20",
    },
  ];

  const curriculum = [
    {
      icon: <BookOpen className="h-5 w-5" />,
      subject: "Qur'an — Surah Ash-Shu'ara",
      detail:
        "Tadabbur using 'Umdat al-Tafsir, the abridgment of Tafsir Ibn Kathir (tahqiq by Shaykh Ahmad Shakir)",
    },
    {
      icon: <Scroll className="h-5 w-5" />,
      subject: "Fiqh — Manhaj al-Salikin",
      detail: "by Shaykh Abd al-Rahman al-Sa'di",
    },
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-primary/5" />

      <div className="container px-4 relative">
        <div className="text-center mb-14 space-y-4">
          <span className="inline-block text-sm font-outfit font-semibold uppercase tracking-[0.2em] text-primary">
            Weekly Lessons
          </span>

          <p className="text-4xl md:text-6xl font-arabic text-foreground leading-tight" dir="rtl">
            سورة الشعراء
          </p>

          <h2 className="text-3xl md:text-5xl font-outfit font-bold text-foreground">
            Surah Ash-Shu'ara
          </h2>

          <div className="h-1 w-24 bg-primary mx-auto rounded-full" />

          <p className="text-muted-foreground text-lg font-outfit uppercase tracking-widest">
            Tadabbur &middot; Reflection &middot; Guidance
          </p>
        </div>

        <div className="max-w-5xl mx-auto space-y-8">
          {/* What is studied */}
          <Card className="border-none shadow-lg bg-white">
            <CardContent className="p-8 grid gap-8 md:grid-cols-2">
              {curriculum.map((item) => (
                <div key={item.subject} className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-outfit font-bold text-foreground">
                      {item.subject}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.detail}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* When, and who for */}
          <div className="grid gap-6 md:grid-cols-2">
            {sessions.map((session) => (
              <Card
                key={session.day}
                className={`border-none shadow-lg bg-white overflow-hidden ring-1 ${session.ring}`}
              >
                <div className={`${session.accent} py-3 text-center`}>
                  <span className="font-outfit font-bold uppercase tracking-widest text-white">
                    {session.day}
                  </span>
                </div>

                <CardContent className="p-8 text-center space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-widest">
                      Only for
                    </p>
                    <p className="text-3xl font-outfit font-bold text-foreground">
                      {session.audience}
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-foreground">
                    <Clock className="h-5 w-5 text-primary" />
                    <span className="text-2xl font-outfit font-semibold">{session.time}</span>
                  </div>

                  <p className="text-sm text-muted-foreground">All are welcome</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Where, and who teaches */}
          <Card className="border-none shadow-lg bg-white">
            <CardContent className="p-8 grid gap-6 sm:grid-cols-2 text-center sm:text-left">
              <div className="flex items-start gap-4 justify-center sm:justify-start">
                <MapPin className="h-5 w-5 text-primary shrink-0 mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-widest">Venue</p>
                  <p className="font-outfit font-bold text-foreground">Iqra Dugsi</p>
                  <p className="text-sm text-muted-foreground">
                    3711A 98 Street, Edmonton, AB T6E 6M3
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 justify-center sm:justify-start">
                <User className="h-5 w-5 text-primary shrink-0 mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-widest">
                    Taught by
                  </p>
                  <p className="font-outfit font-bold text-foreground">
                    Mualim Abdulsamad Yousuf
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default FeaturedEvent;
