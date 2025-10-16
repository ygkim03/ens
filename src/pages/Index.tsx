import { ShipTable } from "@/components/ShipTable";
import { mockShipData } from "@/data/mockShipData";
import { Ship, Waves } from "lucide-react";

const Index = () => {
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
                부산항 신항
              </h1>
              <p className="text-sm text-muted-foreground">선박 입출항 스케줄</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <ShipTable data={mockShipData} />
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
