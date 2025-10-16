import { useState } from "react";
import { ShipSchedule } from "@/types/ship";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search,
  ArrowUpDown,
  Ship,
  Anchor,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ShipTableProps {
  data: ShipSchedule[];
}

export const ShipTable = ({ data }: ShipTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterNav, setFilterNav] = useState<"all" | "입항" | "출항">("all");
  const [sortBy, setSortBy] = useState<"time" | "ship">("time");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const filteredData = data
    .filter((ship) => {
      const matchesSearch =
        ship.shipName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ship.agent.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesNav = filterNav === "all" || ship.navigation === filterNav;
      return matchesSearch && matchesNav;
    })
    .sort((a, b) => {
      if (sortBy === "time") {
        const comparison = a.time.localeCompare(b.time);
        return sortOrder === "asc" ? comparison : -comparison;
      } else {
        const comparison = a.shipName.localeCompare(b.shipName);
        return sortOrder === "asc" ? comparison : -comparison;
      }
    });

  const toggleSort = (field: "time" | "ship") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  return (
    <div className="space-y-4">
      {/* 검색 & 필터 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="선박명 또는 대리점 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterNav === "all" ? "default" : "outline"}
            onClick={() => setFilterNav("all")}
            size="sm"
          >
            전체
          </Button>
          <Button
            variant={filterNav === "입항" ? "default" : "outline"}
            onClick={() => setFilterNav("입항")}
            size="sm"
          >
            입항
          </Button>
          <Button
            variant={filterNav === "출항" ? "default" : "outline"}
            onClick={() => setFilterNav("출항")}
            size="sm"
          >
            출항
          </Button>
        </div>
      </div>

      {/* 정렬 버튼 */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => toggleSort("time")}
          className="gap-2"
        >
          <Clock className="h-4 w-4" />
          시간순
          <ArrowUpDown className="h-3 w-3" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toggleSort("ship")}
          className="gap-2"
        >
          <Ship className="h-4 w-4" />
          선박명순
          <ArrowUpDown className="h-3 w-3" />
        </Button>
      </div>

      {/* 선박 카드 리스트 */}
      <div className="space-y-3">
        {filteredData.map((ship) => {
          const isExpanded = expandedRows.has(ship.id);
          return (
            <Card
              key={ship.id}
              className="p-4 hover:shadow-lg transition-all duration-200 cursor-pointer"
              onClick={() => toggleRow(ship.id)}
            >
              <div className="space-y-3">
                {/* 기본 정보 */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={ship.navigation === "입항" ? "default" : "secondary"}
                      >
                        {ship.navigation}
                      </Badge>
                      {ship.isSpecial && (
                        <Badge variant="outline" className="bg-accent/10">
                          특이
                        </Badge>
                      )}
                      {ship.quarantine && (
                        <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900">
                          검역
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-bold text-lg truncate">{ship.shipName}</h3>
                    <p className="text-sm text-muted-foreground">{ship.agent}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="flex items-center gap-1 text-primary font-semibold">
                      <Clock className="h-4 w-4" />
                      {ship.time}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* 주요 정보 */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">
                      {ship.from} → {ship.to}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Anchor className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{ship.side}</span>
                  </div>
                </div>

                {/* 상세 정보 (확장) */}
                {isExpanded && (
                  <div className="pt-3 border-t space-y-2 text-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
