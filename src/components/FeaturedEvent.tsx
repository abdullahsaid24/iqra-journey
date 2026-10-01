/**
 * Current event poster, shown inside the home page hero (see Hero.tsx).
 *
 * To change the event, replace public/event-poster.jpg with the new poster and
 * update the details below. To take it down entirely, set SHOW_EVENT to false
 * in Hero.tsx.
 */
const poster = {
  src: "/event-poster.jpg",
  // Pixel size of the image file. Only reserves space while it loads, so the
  // page does not jump - a stale value is harmless.
  width: 933,
  height: 1400,
  // The poster carries all of the detail, so it is described here for screen
  // readers and search engines. Update alongside the image.
  alt:
    "Iqra Dugsi weekly lessons on Surat An-Naml. Tadabbur based on " +
    "'Umdat al-Tafsir, the abridgment of Tafsir Ibn Kathir, and Fiqh from " +
    "Manhaj al-Salikin by Shaykh Al-Sa'di. Wednesdays for sisters and " +
    "Thursdays for brothers, 6:30 PM, all are welcome. At Iqra Dugsi, " +
    "3711A 98 Street, Edmonton, AB T6E 6M3. Taught by Mualim Abdulsamad Yousuf.",
};

const FeaturedEvent = () => {
  return (
    /* Beside the hero text the poster is capped to the screen height, so the
       whole of it is visible without scrolling. */
    <img
      src={poster.src}
      alt={poster.alt}
      width={poster.width}
      height={poster.height}
      className="w-full max-w-sm h-auto mx-auto rounded-2xl shadow-2xl lg:w-auto lg:max-w-full lg:max-h-[calc(100vh-9rem)]"
    />
  );
};

export default FeaturedEvent;
