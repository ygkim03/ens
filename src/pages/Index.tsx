import { ShipTable } from "@/components/ShipTable";
import { Ship, Waves } from "lucide-react";
import { useState, useEffect } from "react";
import { ShipSchedule } from "@/types/ship";

const API_URL = "https://yellow-truth-54a3.rladudrnr03.workers.dev/";

const Index = () => {
  const [shipData, setShipData] = useState<ShipSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchShipData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_URL, {
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // API 데이터를 ShipSchedule 형식으로 변환
      const transformedData: ShipSchedule[] = data.map((item: any, index: number) => ({
        id: `${item.date}-${item.no}`,
        no: parseInt(item.no) || index + 1,
        date: item.date,
        time: item.time,
        shipName: item.name,
        grt: item.grt.split('/')[0].trim(),
        loa: item.grt.split('/')[1]?.trim() || '',
        dt: item.dt,
        from: item.fm,
        to: item.to,
        side: item.side,
        callSign: item.cs.split('(')[0].trim(),
        imo: item.cs.match(/\((\d+)\)/)?.[1] || '',
        tugs: item.tugs,
        quarantine: item.quarantine !== "",
        line: item.line,
        navigation: item.nav === "입항" ? "입항" : "출항",
        agent: item.agent,
        remarks: item.rmkTeam || item.rmkAgent || '',
        isSpecial: (item.rmkTeam && item.rmkTeam.includes('@')) || false
      }));
      
      setShipData(transformedData);
    } catch (error) {
      console.error("Failed to fetch ship data:", error);
      alert("데이터를 불러오는데 실패했습니다. Worker API에 CORS 헤더를 추가해주세요.\n\nWorker 코드에 다음을 추가하세요:\n\nconst headers = {\n  'Access-Control-Allow-Origin': '*',\n  'Access-Control-Allow-Methods': 'GET, OPTIONS',\n  'Access-Control-Allow-Headers': 'Content-Type',\n  'Content-Type': 'application/json'\n};\n\nreturn new Response(JSON.stringify(data), { headers });");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShipData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-lg bg-background/80 border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Ship className="h-8 w-8 text-primary" />
              <Waves className="h-4 w-4 text-accent absolute -bottom-1 -right-1" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                부산신항 도선 모니터링
              </h1>
              <p className="text-sm text-muted-foreground">이엔에스마린 스케줄</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-6xl min-h-[calc(100vh-280px)]">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">데이터를 불러오는 중...</p>
          </div>
        ) : (
          <ShipTable data={shipData} onRefresh={fetchShipData} />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t bg-card/50">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>부산항 신항 선박 입출항 정보</p>
          <p className="text-xs mt-1">실시간 업데이트</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
