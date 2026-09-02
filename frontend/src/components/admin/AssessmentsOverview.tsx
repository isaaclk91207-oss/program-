import { useState, useEffect } from "react";
import { Card, Badge, CertBadge, SearchInput, th, ProgressBar } from "../ui";
import { getAssessments } from "../../services/api";
import { TrendingUp, Award, Users, BarChart3 } from "lucide-react";

interface AssessmentRecord {
  id: string;
  driverId: string;
  driverName: string;
  driverEmail: string;
  written: number;
  practical: Record<string, number>;
  operational: Record<string, number>;
  feedbackAvg: number;
  overallScore: number;
  certLevel: string;
  createdAt: string;
}

export default function AssessmentsOverview() {
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAssessments(); }, []);

  async function loadAssessments() {
    setLoading(true);
    try {
      const data = await getAssessments();
      setAssessments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = assessments.filter(
    (a) => search === "" || a.driverName.toLowerCase().includes(search.toLowerCase()) || a.driverId.toLowerCase().includes(search.toLowerCase())
  );

  const byLevel = ["CD", "CC", "CPC", "CEC", "CMC"].map((level) => ({
    level,
    count: assessments.filter((a) => a.certLevel === level).length,
  }));

  const avgScore = assessments.length > 0
    ? Math.round(assessments.reduce((sum, a) => sum + a.overallScore, 0) / assessments.length * 10) / 10
    : 0;

  const topPerformers = [...assessments]
    .sort((a, b) => b.overallScore - a.overallScore)
    .slice(0, 5);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Assessments</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 text-center">
          <BarChart3 className="w-6 h-6 text-amber-500 dark:text-amber-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-amber-500 dark:text-amber-400">{assessments.length}</p>
          <p className={`text-xs ${th.textSecondary}`}>Total Assessments</p>
        </Card>
        <Card className="p-4 text-center">
          <TrendingUp className="w-6 h-6 text-blue-500 dark:text-blue-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-blue-500 dark:text-blue-400">{avgScore}</p>
          <p className={`text-xs ${th.textSecondary}`}>Average Score</p>
        </Card>
        <Card className="p-4 text-center">
          <Award className="w-6 h-6 text-emerald-500 dark:text-emerald-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-emerald-500 dark:text-emerald-400">{topPerformers[0]?.overallScore || 0}</p>
          <p className={`text-xs ${th.textSecondary}`}>Top Score</p>
        </Card>
        <Card className="p-4">
          <p className={`text-xs ${th.textSecondary} mb-2`}>By Level</p>
          <div className="flex gap-2">
            {byLevel.map((l) => (
              <div key={l.level} className="text-center">
                <CertBadge level={l.level} />
                <p className={`text-xs font-bold mt-1 ${th.text}`}>{l.count}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Assessment History</h3>
        <SearchInput value={search} onChange={setSearch} placeholder="Search..." className="w-64" />
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-500">Loading...</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => (
            <Card key={a.id} className="p-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className={`text-sm font-medium ${th.text}`}>{a.driverName} <span className={`${th.textMuted} font-mono`}>{a.driverId}</span></p>
                  <p className={`text-xs ${th.textMuted}`}>Written: {a.written} · Overall: {a.overallScore} · {new Date(a.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <CertBadge level={a.certLevel} />
                  <span className={`text-lg font-bold ${a.overallScore >= 80 ? "text-emerald-500" : a.overallScore >= 75 ? "text-amber-500" : "text-rose-500"}`}>
                    {a.overallScore}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
