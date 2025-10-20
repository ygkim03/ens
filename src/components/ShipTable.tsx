import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { ShipSchedule } from "@/types/ship";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const [filterLine, setFilterLine] = useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // 선박 스케줄에서 날짜 추출
  const scheduleDate = useMemo(() => {
    if (data.length === 0) return format(new Date(), 'yyyy년 MM월 dd일 (EEE)', { locale: ko });
    try {
      const date = new Date(data[0].date);
      return format(date, 'yyyy년 MM월 dd일 (EEE)', { locale: ko });
    } catch {
      return data[0].date;
    }
  }, [data]);

  const toggleLineFilter = (line: string) => {
    const newFilter = new Set(filterLine);
    if (newFilter.has(line)) {
      newFilter.delete(line);
    } else {
      newFilter.add(line);
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

  // 데이터에서 고유한 라인 목록 추출
  const uniqueLines = useMemo(() => {
    const lines = [...new Set(data.map((ship) => ship.line))];
    return lines.sort();
  }, [data]);

  const filteredData = data
    .filter((ship) => {
      const matchesLine = filterLine.size === 0 || filterLine.has(ship.line);
      return matchesLine;
    })
    .sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="space-y-3">
      {/* 날짜 & 새로고침 */}
      <div className="flex items-center justify-between bg-card border rounded-lg p-2">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-primary">{scheduleDate}</span>
        </div>
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
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
        <Button
          variant={filterLine.size === 0 ? "default" : "outline"}
          onClick={() => setFilterLine(new Set())}
          size="sm"
          className="shrink-0 h-7 text-xs"
        >
          전체 라인
        </Button>
        {uniqueLines.map((line) => (
          <Button
            key={line}
            variant={filterLine.has(line) ? "default" : "outline"}
            onClick={() => toggleLineFilter(line)}
            size="sm"
            className="shrink-0 whitespace-nowrap h-7 text-xs"
          >
            {line}
          </Button>
        ))}
      </div>

      {/* 선박 카드 리스트 */}
      <div className="space-y-2">
        {filteredData.map((ship) => {
          const isExpanded = expandedRows.has(ship.id);
          const bgColor = ship.navigation === "입항" 
            ? "bg-[hsl(var(--arrival-card))] dark:bg-[hsl(var(--arrival-card-dark))]"
            : "bg-[hsl(var(--departure-card))] dark:bg-[hsl(var(--departure-card-dark))]";
          
          return (
            <Card
              key={ship.id}
              className={`p-2 hover:shadow-md transition-all duration-200 cursor-pointer ${bgColor}`}
              onClick={() => toggleRow(ship.id)}
            >
              <div className="space-y-2">
                {/* 기본 정보 */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Badge
                        variant={ship.navigation === "입항" ? "default" : "secondary"}
                        className="text-xs h-5"
                      >
                        {ship.navigation}
                      </Badge>
                      {ship.isSpecial && (
                        <Badge variant="outline" className="bg-accent/10 text-xs h-5">
                          특이
                        </Badge>
                      )}
                      {ship.quarantine && (
                        <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900 text-xs h-5">
                          검역
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-bold text-base truncate">{ship.shipName}</h3>
                    <p className="text-xs text-muted-foreground">{ship.agent}</p>
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
