const holidayCache = {};

// Fallback Indian Holidays list if network/CORS blocks Nager.Date API
const getCalculatedIndianHolidays = (year) => {
  const fixedHolidays = [
    { id: `fest-${year}-01-01`, title: "🎉 New Year's Day", start_date: `${year}-01-01`, isFestival: true },
    { id: `fest-${year}-01-14`, title: "🪴 Makar Sankranti / Pongal", start_date: `${year}-01-14`, isFestival: true },
    { id: `fest-${year}-01-26`, title: "🇮🇳 Republic Day", start_date: `${year}-01-26`, isFestival: true },
    { id: `fest-${year}-04-14`, title: "🌾 Ambedkar Jayanti / Baisakhi", start_date: `${year}-04-14`, isFestival: true },
    { id: `fest-${year}-05-01`, title: "🛠️ May Day / Maharashtra Day", start_date: `${year}-05-01`, isFestival: true },
    { id: `fest-${year}-08-15`, title: "🇮🇳 Independence Day", start_date: `${year}-08-15`, isFestival: true },
    { id: `fest-${year}-10-02`, title: "👓 Gandhi Jayanti", start_date: `${year}-10-02`, isFestival: true },
    { id: `fest-${year}-12-25`, title: "🎄 Christmas Day", start_date: `${year}-12-25`, isFestival: true },
  ];

  const lunarFestivals = {
    2025: [
      { id: "l-1", title: "🎨 Holi", start_date: "2025-03-14", isFestival: true },
      { id: "l-2", title: "🌙 Eid ul-Fitr", start_date: "2025-03-31", isFestival: true },
      { id: "l-3", title: "🪈 Raksha Bandhan", start_date: "2025-08-09", isFestival: true },
      { id: "l-4", title: "🐘 Ganesh Chaturthi", start_date: "2025-08-27", isFestival: true },
      { id: "l-5", title: "🏹 Dussehra", start_date: "2025-10-02", isFestival: true },
      { id: "l-6", title: "🪔 Diwali", start_date: "2025-10-20", isFestival: true },
    ],
    2026: [
      { id: "l-1", title: "🎨 Holi", start_date: "2026-03-03", isFestival: true },
      { id: "l-2", title: "🌙 Eid ul-Fitr", start_date: "2026-03-20", isFestival: true },
      { id: "l-3", title: "🪈 Raksha Bandhan", start_date: "2026-08-28", isFestival: true },
      { id: "l-4", title: "🐘 Ganesh Chaturthi", start_date: "2026-09-14", isFestival: true },
      { id: "l-5", title: "🏹 Dussehra", start_date: "2026-10-20", isFestival: true },
      { id: "l-6", title: "🪔 Diwali", start_date: "2026-11-08", isFestival: true },
    ],
    2027: [
      { id: "l-1", title: "🎨 Holi", start_date: "2027-03-22", isFestival: true },
      { id: "l-2", title: "🌙 Eid ul-Fitr", start_date: "2027-03-09", isFestival: true },
      { id: "l-3", title: "🐘 Ganesh Chaturthi", start_date: "2027-09-04", isFestival: true },
      { id: "l-4", title: "🏹 Dussehra", start_date: "2027-10-09", isFestival: true },
      { id: "l-5", title: "🪔 Diwali", start_date: "2027-10-29", isFestival: true },
    ],
  };

  const currentLunarEvents = lunarFestivals[year] || lunarFestivals[2026];
  return [...fixedHolidays, ...currentLunarEvents];
};

export const getIndianHolidays = async (year) => {
  if (holidayCache[year]) {
    return holidayCache[year];
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(
      `https://date.nager.at/api/v3/PublicHolidays/${year}/IN`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (response.ok) {
      const text = await response.text();
      // Ensure body is non-empty valid JSON before parsing
      if (text && text.trim().startsWith("[")) {
        const data = JSON.parse(text);
        if (Array.isArray(data) && data.length > 0) {
          const formattedHolidays = data.map((item) => ({
            id: `holiday-${item.date}-${item.name}`,
            title: item.localName || item.name,
            start_date: item.date,
            isFestival: true,
          }));

          holidayCache[year] = formattedHolidays;
          return formattedHolidays;
        }
      }
    }
  } catch (error) {
    // Silently proceed to fallback calculation on network or CORS errors
  }

  // Fallback to guaranteed local holiday dataset
  const calculated = getCalculatedIndianHolidays(year);
  holidayCache[year] = calculated;
  return calculated;
};