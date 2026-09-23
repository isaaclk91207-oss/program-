import { useState } from "react";
import { Card, Button, StarRating, th, Icon, DataTable, TableRow, TableCell } from "../ui";
import { exportExcel, exportCSV, downloadBlob } from "../../services/api";
import type { Feedback } from "../../types";
import { formatRequestId } from "../../types";

export default function FeedbackList({
  feedbacks,
}: {
  feedbacks: Feedback[];
}) {
  const [exporting, setExporting] = useState(false);

  async function handleExport(format: "excel" | "csv") {
    setExporting(true);
    try {
      const blob = format === "excel" ? await exportExcel("feedback") : await exportCSV("feedback");
      const filename = `feedback_${new Date().toISOString().split("T")[0]}.${format === "excel" ? "xlsx" : "csv"}`;
      downloadBlob(blob, filename);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold">Feedback</h2>
        <div className="flex items-center gap-1">
          <Button variant="secondary" size="sm" onClick={() => handleExport("excel")} disabled={exporting}>
            <Icon name="table_chart" size={16} className="mr-1" />
            {exporting ? "Exporting..." : "Excel"}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleExport("csv")} disabled={exporting}>
            <Icon name="description" size={16} className="mr-1" />
            {exporting ? "Exporting..." : "CSV"}
          </Button>
        </div>
      </div>
      <DataTable headers={["Passenger", "Driver", "Vehicle", "Request ID", "Rating", "Comment", "Tags", "Date"]}>
        {feedbacks.map((f) => (
          <TableRow key={f.id}>
            <TableCell>{f.passengerName}</TableCell>
            <TableCell>{f.driverName}</TableCell>
            <TableCell className="font-mono">{f.vehiclePlate}</TableCell>
            <TableCell className="font-mono">{formatRequestId(f.requestId)}</TableCell>
            <TableCell className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Icon name="star" size={14} className="text-emerald-400 fill-emerald-400" />
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{f.rating}</span>
              </div>
            </TableCell>
            <TableCell>{f.comment}</TableCell>
            <TableCell>
              <div className="flex gap-1 flex-wrap">
                {f.tags.map((t) => (
                  <span key={t} className={`text-xs ${th.bgInput} px-2 py-0.5 rounded ${th.textSecondary}`}>{t}</span>
                ))}
              </div>
            </TableCell>
            <TableCell>{f.date}</TableCell>
          </TableRow>
        ))}
      </DataTable>
    </div>
  );
}
