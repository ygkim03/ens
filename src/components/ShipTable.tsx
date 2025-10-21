import { useState, useMemo } from "react";
import { ShipSchedule } from "@/types/ship";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Ship,
  Anchor,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
  Building2,
  RefreshCw,
} from "lucide-react";

interface ShipTableProps {
  data: ShipSchedule[];
  onRefresh: () => void;
}

export const ShipTable = ({ data, onRefresh }: ShipTableProps) => {
  // 초기 필터를 이엔에스마린으로 설정 (없으면 전체)
  const [filterLine, setFilterLine] = useState<Set<string>>(() => {
    const ensMarineExists = data.some(ship => ship.agent === "이엔에스마린");
    return ensMarineExists ? new Set(["이엔에스마린"]) : new Set();
  });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleAgentFilter = (agent: string) => {
    const newFilter = new Set(filterLine);
    if (newFilter.has(agent)) {
      newFilter.delete(agent);
    } else {
      newFilter.add(agent);
    }
    setFilterLine(newFilter);
  };

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // 데이터에서 고유한 업체 목록 추출
  const uniqueAgents = useMemo(() => {
    const agents = [...new Set(data.map((ship) => ship.agent))];
    return agents.sort();
  }, [data]);

  const filteredData = data
    .filter((ship) => {
      const matchesAgent = filterLine.size === 0 || filterLine.has(ship.agent);
      return matchesAgent;
    })
    .sort((a, b) => {
      // 날짜와 시간을 결합하여 Date 객체 생성
      const dateTimeA = new Date(`${a.date}T${a.time}`);
      const dateTimeB = new Date(`${b.date}T${b.time}`);
      const now = new Date();
      
      // 현재 시간과의 절대 차이 계산
      const diffA = Math.abs(dateTimeA.getTime() - now.getTime());
      const diffB = Math.abs(dateTimeB.getTime() - now.getTime());
      
      return diffA - diffB;
    });

  return (
    <div className="space-y-3">
      {/* 새로고침 */}
      <div className="flex items-center justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="gap-2 h-8"
        >
          <RefreshCw className="h-3 w-3" />
          새로고침
        </Button>
      </div>

      {/* 라인별 필터 */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
          <Button
            variant={filterLine.size === 0 ? "default" : "outline"}
            onClick={() => setFilterLine(new Set())}
            size="sm"
            className="shrink-0 h-7 text-xs"
          >
            전체 라인
          </Button>
        </div>
        {uniqueAgents.map((agent) => (
          <Button
            key={agent}
            variant={filterLine.has(agent) ? "default" : "outline"}
            onClick={() => toggleAgentFilter(agent)}
            size="sm"
            className="shrink-0 whitespace-nowrap h-7 text-xs"
          >
            {agent}
          </Button>
        ))}
      </div>

      {/* 선박 카드 리스트 */}
      <div className="space-y-2">
        {filteredData.map((ship, index) => {
          const isExpanded = expandedRows.has(ship.id);
          const bgColor = ship.navigation === "입항" 
            ? "bg-[hsl(var(--arrival-card))] dark:bg-[hsl(var(--arrival-card-dark))]"
            : "bg-[hsl(var(--departure-card))] dark:bg-[hsl(var(--departure-card-dark))]";
          
          // 날짜 구분선 표시 여부 확인
          const showDateSeparator = index === 0 || filteredData[index - 1].date !== ship.date;
          
          return (
            <div key={ship.id}>
              {showDateSeparator && (
                <div className="mb-3 mt-4">
                  <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 dark:from-primary/30 dark:via-primary/20 dark:to-primary/30 rounded-md px-4 py-1.5 border-l-4 border-primary">
                    <span className="text-sm font-bold text-primary">
                      {ship.date}
                    </span>
                  </div>
                </div>
              )}
              <Card
                className={`p-2 hover:shadow-md transition-all duration-200 cursor-pointer ${bgColor}`}
                onClick={() => toggleRow(ship.id)}
              >
              <div className="space-y-2">
                {/* 기본 정보 */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Badge
                        variant="outline"
                        className="text-xs h-5"
                      >
                        {ship.navigation}
                      </Badge>
                      {ship.quarantine && (
                        <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900 text-xs h-5">
                          검역
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-bold text-base truncate">{ship.shipName}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{ship.agent}</span>
                      <span className="text-muted-foreground">•</span>
                      <span>{ship.date}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 shrink-0">
                    <div className="flex items-center gap-1 text-primary font-semibold text-sm">
                      <Clock className="h-3 w-3" />
                      {ship.time}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* 주요 정보 */}
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="truncate">
                      {ship.from} → {ship.to}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Anchor className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="truncate">{ship.side}</span>
                  </div>
                </div>

                {/* 상세 정보 (확장) */}
                {isExpanded && (
                  <div className="pt-2 border-t space-y-1.5 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      <div>
                        <span className="text-muted-foreground">GRT/LOA:</span>{" "}
                        <span className="font-medium">
                          {ship.grt} / {ship.loa}m
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Draft:</span>{" "}
                        <span className="font-medium">{ship.dt}m</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Call Sign:</span>{" "}
                        <span className="font-medium">{ship.callSign}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">IMO:</span>{" "}
                        <span className="font-medium">{ship.imo}</span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-muted-foreground">예선:</span>{" "}
                        <span className="font-medium">{ship.tugs}</span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-muted-foreground">라인:</span>{" "}
                        <span className="font-medium">{ship.line}</span>
                      </div>
                      {ship.remarks && (
                        <div className="sm:col-span-2">
                          <span className="text-muted-foreground">비고:</span>{" "}
                          <span className="font-medium">{ship.remarks}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              </Card>
            </div>
          );
        })}
      </div>

      {filteredData.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Ship className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>검색 결과가 없습니다.</p>
        </div>
      )}
    </div>
  );
};
