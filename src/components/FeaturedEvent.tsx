/**
 * Current event poster, shown on the home page between the hero and the
 * features grid.
 *
 * To change the event, replace public/weekly-lessons.jpg with the new poster
 * and update the alt text below. To take it down entirely, remove
 * <FeaturedEvent /> from src/pages/Index.tsx.
 */
const FeaturedEvent = () => {
  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-primary/5" />

      <div className="container px-4 relative">
        <img
          src="/weekly-lessons.jpg"
          /* The poster carries all of the detail, so it is described here for
             screen readers and search engines. Update alongside the image. */
          alt="Iqra Dugsi weekly lessons on Surah Ash-Shu'ara. Tadabbur based on
               'Umdat al-Tafsir, the abridgment of Tafsir Ibn Kathir, and Fiqh
               from Manhaj al-Salikin by Shaykh Al-Sa'di. Wednesdays for sisters
               and Thursdays for brothers, 6:30 PM, all are welcome. At Iqra
               Dugsi, 3711A 98 Street, Edmonton, AB T6E 6M3. Taught by Mualim
               Abdulsamad Yousuf."
          loading="lazy"
          className="w-full max-w-xl mx-auto rounded-2xl shadow-xl"
        />
      </div>
    </section>
  );
};

export default FeaturedEvent;
