import { useState, useMemo } from "react";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Timeframe, VolumeDelta } from "@/hooks/useVolumeHistory";

interface VolumeTableProps {
    deltas: VolumeDelta[];
    timeframe: Timeframe;
    onTimeframeChange: (tf: Timeframe) => void;
}

export function VolumeTable({ deltas, timeframe, onTimeframeChange }: VolumeTableProps) {
    const sortedDeltas = useMemo(() => {
        return [...deltas].sort((a, b) => b.totalVolume - a.totalVolume);
    }, [deltas]);

    if (deltas.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground text-sm">
                Waiting for volume data... (Data populates as market updates)
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between px-3 py-1 bg-secondary/30 border-b border-border/50">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Sort by Highest Volume Delta
                </span>
                <Select value={timeframe} onValueChange={(v) => onTimeframeChange(v as Timeframe)}>
                    <SelectTrigger className="w-[80px] h-6 text-[10px] bg-background border-border">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                        <SelectItem value="5s" className="text-[10px]">5 Sec</SelectItem>
                        <SelectItem value="10s" className="text-[10px]">10 Sec</SelectItem>
                        <SelectItem value="30s" className="text-[10px]">30 Sec</SelectItem>
                        <SelectItem value="1m" className="text-[10px]">1 Min</SelectItem>
                        <SelectItem value="5m" className="text-[10px]">5 Min</SelectItem>
                        <SelectItem value="15m" className="text-[10px]">15 Min</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="overflow-auto max-h-[400px]">
                <Table>
                    <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                            <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground w-8">#</TableHead>
                            <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">Symbol</TableHead>
                            <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground text-right font-bold text-success">Buy Vol</TableHead>
                            <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground text-right font-bold text-danger">Sell Vol</TableHead>
                            <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground text-right font-bold">Total Vol</TableHead>
                            <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground text-right">LTP</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedDeltas.map((d, i) => (
                            <TableRow key={d.symbol} className="border-border/50 hover:bg-secondary/30 h-8">
                                <TableCell className="text-[10px] text-muted-foreground tabular-nums py-1">{i + 1}</TableCell>
                                <TableCell className="py-1">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] font-medium">{d.symbol}</span>
                                        <Badge
                                            variant="outline"
                                            className={`text-[8px] px-1 py-0 h-3.5 ${d.type === "CE" ? "border-success/40 text-success" : "border-danger/40 text-danger"
                                                }`}
                                        >
                                            {d.type}
                                        </Badge>
                                    </div>
                                </TableCell>
                                <TableCell className="text-[11px] text-right tabular-nums text-success font-medium py-1">
                                    {d.buyVolume > 0 ? d.buyVolume.toLocaleString() : "-"}
                                </TableCell>
                                <TableCell className="text-[11px] text-right tabular-nums text-danger font-medium py-1">
                                    {d.sellVolume > 0 ? d.sellVolume.toLocaleString() : "-"}
                                </TableCell>
                                <TableCell className="text-[11px] text-right tabular-nums font-bold py-1">
                                    {d.totalVolume > 0 ? d.totalVolume.toLocaleString() : "-"}
                                </TableCell>
                                <TableCell className="text-[11px] text-right tabular-nums text-muted-foreground py-1">
                                    ₹{d.lastLTP.toFixed(2)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
