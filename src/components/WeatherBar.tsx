import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Thermometer, Wind, Droplets, Cloud } from "lucide-react";

const WEATHER_API_URL = "https://round-thunder-8301.rladudrnr03.workers.dev/";
const MARQUEE_SPEED = 50; // px per second — both rows share this

interface CurrentWeather {
  temp: string;
  chill: string;
  minmax: string;
  humidity: string;
  wind: string;
  rain: string;
  pm25: { val: string; level: string };
  pm10: { val: string; level: string };
  o3: { val: string; level: string };
  updated: string;
  diff: string;
}

interface DailyForecast {
  label: string;
  dayLabel: string;
  amWeather: string;
  pmWeather: string;
  min: string;
  max: string;
  amPop: string;
  pmPop: string;
}

const parseCurrent = (html: string): CurrentWeather | null => {
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const tmp = doc.querySelector(".cmp-cur-weather .tmp");
    const tempText = tmp?.childNodes[0]?.textContent?.trim() || "";
    const minmax = doc.querySelector(".cmp-cur-weather .minmax")?.textContent?.replace(/\s+/g, "") || "";
    const chill = doc.querySelector(".cmp-cur-weather .chill")?.textContent?.trim() || "";
    const wrap2 = doc.querySelectorAll(".cmp-cur-weather .wrap-2 li");
    const humidity = wrap2[0]?.querySelector(".val")?.textContent?.trim().replace(/\s+/g, " ") || "";
    const wind = wrap2[1]?.querySelector(".val")?.textContent?.trim().replace(/\s+/g, " ") || "";
    const rain = wrap2[2]?.querySelector(".val")?.textContent?.trim().replace(/\s+/g, " ") || "";
    const updated = doc.querySelector(".odam-updated .updated-at")?.textContent?.replace(/\s+/g, " ").trim() || "";
    const diff = doc.querySelector(".cmp-cur-weather .w-txt")?.textContent?.replace(/\s+/g, " ").trim() || "";

    const airItems = doc.querySelectorAll(".cmp-cur-weather-air .air-wrap li");
    const parseAir = (li: Element | undefined) => ({
      val: li?.querySelector(".air-lvv")?.textContent?.trim() || "-",
      level: li?.querySelector(".air-lvt")?.childNodes[0]?.textContent?.trim() || "",
    });
    return {
      temp: tempText, chill, minmax, humidity, wind, rain, updated, diff,
      pm25: parseAir(airItems[0]),
      pm10: parseAir(airItems[1]),
      o3: parseAir(airItems[2]),
    };
  } catch (e) {
    console.error("parseCurrent failed", e);
    return null;
  }
};

const parseForecast = (html: string): DailyForecast[] => {
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const slides = doc.querySelectorAll(".dfs-daily-slide");
    const out: DailyForecast[] = [];
    slides.forEach((s) => {
      const h4 = s.querySelector("h4.todaytomorrow");
      const spans = h4?.querySelectorAll("span");
      const em = h4?.querySelector("em")?.textContent?.trim() || "";
      const dayLabel = `${spans?.[0]?.textContent?.trim() || ""}${spans?.[1]?.textContent?.trim() || ""}`;
      const amWeather = s.querySelector(".daily-weather-am span.wic")?.textContent?.trim() || "";
      const pmWeather = s.querySelector(".daily-weather-pm span.wic")?.textContent?.trim() || "";
      const minmaxDivs = s.querySelectorAll(".daily-minmax span");
      const min = minmaxDivs[0]?.textContent?.trim() || "";
      const max = minmaxDivs[1]?.textContent?.trim() || "";
      const amPop = s.querySelector(".daily-pop-am span")?.textContent?.trim() || "-";
      const pmPop = s.querySelector(".daily-pop-pm span")?.textContent?.trim() || "-";
      if (em === "오늘" || em === "내일") {
        out.push({ label: em, dayLabel, amWeather, pmWeather, min, max, amPop, pmPop });
      }
    });
    return out;
  } catch (e) {
    console.error("parseForecast failed", e);
    return [];
  }
};

const airColor = (level: string) => {
  if (level.includes("좋음")) return "text-blue-600";
  if (level.includes("보통")) return "text-green-600";
  if (level.includes("나쁨") && !level.includes("매우")) return "text-orange-600";
  if (level.includes("매우")) return "text-red-600";
  return "text-muted-foreground";
};

const interleave = (items: React.ReactNode[]): React.ReactNode[] => {
  const out: React.ReactNode[] = [];
  items.forEach((it, i) => {
    out.push(it);
    if (i < items.length - 1) {
      out.push(<span key={`sep-${i}`} className="text-blue-300 px-1">|</span>);
    }
  });
  return out;
};

// Marquee row: measures one content set's width and sets duration = width/SPEED
// so both rows scroll at the same px/sec regardless of content length.
const MarqueeRow = ({ children }: { children: React.ReactNode }) => {
  const setRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(20);

  useLayoutEffect(() => {
    const measure = () => {
      const w = setRef.current?.offsetWidth ?? 0;
      if (w > 0) setDuration(Math.max(w / MARQUEE_SPEED, 8));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (setRef.current) ro.observe(setRef.current);
    return () => ro.disconnect();
  }, [children]);

  return (
    <div className="flex-1 overflow-hidden">
      <div
        className="flex w-max items-center text-[11px]"
        style={{ animation: `weather-marquee ${duration}s linear infinite` }}
      >
        <div ref={setRef} className="flex items-center gap-2 px-2 flex-shrink-0">
          {children}
          <span className="text-blue-300 px-1">|</span>
        </div>
        <div className="flex items-center gap-2 px-2 flex-shrink-0" aria-hidden="true">
          {children}
          <span className="text-blue-300 px-1">|</span>
        </div>
      </div>
    </div>
  );
};

export const WeatherBar = () => {
  const [current, setCurrent] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<DailyForecast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(WEATHER_API_URL);
        const json = await res.json();
        setCurrent(parseCurrent(json.current));
        setForecast(parseForecast(json.forecast));
      } catch (e) {
        console.error("weather fetch failed", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="mb-2 h-12 rounded-md bg-blue-50 border border-blue-100 px-2 flex items-center text-[11px] text-muted-foreground">
        기상정보 불러오는 중...
      </div>
    );
  }

  if (!current) {
    return (
      <div className="mb-2 h-7 rounded-md bg-red-50 border border-red-100 px-2 flex items-center text-[11px] text-red-600">
        기상정보를 불러올 수 없습니다
      </div>
    );
  }

  const today = forecast.find((f) => f.label === "오늘");
  const tomorrow = forecast.find((f) => f.label === "내일");

  const renderDay = (f: DailyForecast) => (
    <span className="inline-flex items-center gap-1">
      <span>오전 {f.amWeather}({f.amPop})</span>
      <span className="text-blue-300">·</span>
      <span>오후 {f.pmWeather}({f.pmPop})</span>
      <span className="text-muted-foreground ml-1">{f.min}/{f.max}</span>
    </span>
  );

  // 윗줄: 오늘 + 공기질
  const topItems: React.ReactNode[] = [];
  if (today) {
    topItems.push(
      <span key="today" className="inline-flex items-center gap-1">
        <strong className="text-blue-700">오늘</strong>
        {renderDay(today)}
      </span>
    );
  }
  topItems.push(
    <span key="pm25" className="inline-flex items-center gap-1">
      <Cloud className="h-3 w-3 text-slate-500" />초미세
      <span className={airColor(current.pm25.level) + " font-semibold"}>{current.pm25.level || "-"}</span>
    </span>
  );
  topItems.push(
    <span key="pm10" className="inline-flex items-center gap-1">
      <Cloud className="h-3 w-3 text-slate-500" />미세
      <span className={airColor(current.pm10.level) + " font-semibold"}>{current.pm10.level || "-"}</span>
    </span>
  );

  // 아랫줄: 내일 + 습도/바람
  const bottomItems: React.ReactNode[] = [];
  if (tomorrow) {
    bottomItems.push(
      <span key="tom" className="inline-flex items-center gap-1">
        <strong className="text-indigo-700">내일</strong>
        {renderDay(tomorrow)}
      </span>
    );
  }
  const humShort = current.humidity?.replace(/\s+/g, "") || "";
  if (humShort) {
    bottomItems.push(
      <span key="hum" className="inline-flex items-center gap-1">
        <Droplets className="h-3 w-3 text-blue-500" />{humShort}
      </span>
    );
  }
  const windShort = current.wind?.replace(/\s+/g, "") || "";
  if (windShort) {
    bottomItems.push(
      <span key="wind" className="inline-flex items-center gap-1">
        <Wind className="h-3 w-3 text-sky-500" />{windShort}
      </span>
    );
  }
  if (bottomItems.length === 0 && today) {
    bottomItems.push(<span key="fb" className="text-muted-foreground">{today.min}/{today.max}</span>);
  }

  const chillText = current.chill ? current.chill.replace(/체감\(|\)|℃/g, "") : "";

  return (
    <div className="mb-2 rounded-md bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-100 overflow-hidden">
      <style>{`
        @keyframes weather-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      <div className="flex">
        {/* 왼쪽 고정 컬럼: 기온 / 체감 */}
        <div className="flex-shrink-0 flex flex-col justify-center px-2 border-r border-blue-200 bg-blue-100/40 text-[11px] leading-tight">
          <div className="flex items-center gap-1 whitespace-nowrap">
            <Thermometer className="h-3 w-3 text-red-500 flex-shrink-0" />
            <strong className="text-foreground">{current.temp}℃</strong>
          </div>
          <div className="text-muted-foreground whitespace-nowrap pl-4">
            체감 {chillText || "-"}℃
          </div>
        </div>
        {/* 오른쪽 두 줄 마퀴 */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="h-6 flex items-center border-b border-blue-100/60">
            <MarqueeRow>{interleave(topItems)}</MarqueeRow>
          </div>
          <div className="h-6 flex items-center">
            <MarqueeRow>{interleave(bottomItems)}</MarqueeRow>
          </div>
        </div>
      </div>
    </div>
  );
};
