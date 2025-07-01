import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, BarChart3, Target, Hash, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Question, ChecklistResponse } from "@shared/schema";

interface DashboardQuestionCardProps {
  question: Question;
  responses: ChecklistResponse[];
  filters?: any;
}

export default function DashboardQuestionCard({
  question,
  responses,
  filters,
}: DashboardQuestionCardProps) {
  const { t } = useTranslation();

  const relevantResponses = responses.filter((response) => {
    if (!response.responses || typeof response.responses !== "object") return false;
    const responseObj = response.responses as Record<string, any>;
    return responseObj[question.id.toString()] !== undefined;
  });

  const getQuestionValue = (response: ChecklistResponse) => {
    const responses = (response.responses as Record<string, any>) || {};
    return responses[question.id.toString()];
  };

  const renderCard = () => {
    const displayType = question.dashboardDisplayType || "medelvärde";
    if (relevantResponses.length === 0) return null;
    switch (displayType) {
      case "medelvärde":
      case "average":
        return renderAverageCard();
      case "graf":
      case "chart":
        return renderChartCard();
      case "progressbar":
        return renderProgressCard();
      case "antal":
      case "count":
        return renderCountCard();
      default:
        return renderAverageCard();
    }
  };

  const renderAverageCard = () => {
    let values: any[];
    let average = 0;
    let maxValue = 100;
    let roundedAverage = 0;

    if (question.type === "ja_nej" || question.type === "check") {
      const boolValues = relevantResponses.map(getQuestionValue).filter((val) => typeof val === "boolean");
      if (boolValues.length === 0) return null;
      const yesCount = boolValues.filter((val) => val === true).length;
      average = (yesCount / boolValues.length) * 100;
      maxValue = 100;
      values = boolValues;
      roundedAverage = Math.round(average);
    } else {
      values = relevantResponses.map(getQuestionValue).filter((val) => !isNaN(Number(val))).map(Number);
      if (values.length === 0) return null;
      average = values.reduce((sum, val) => sum + val, 0) / values.length;
      maxValue = question.type === "nummer" ? (question.validation as any)?.max || 100 : 5;
      roundedAverage = Math.round(average);
    }

    const display = () => {
      if (question.type === "humör") {
        const emojis = ["😢", "😞", "😐", "😊", "😄"];
        const emoji = emojis[Math.max(0, Math.min(4, roundedAverage - 1))];
        return <div className="text-center"><div className="text-4xl mb-2">{emoji}</div><div className="text-2xl font-bold">{average.toFixed(1)}</div></div>;
      }
      if (question.type === "stjärnor") {
        return (
          <div className="text-center">
            <div className="flex justify-center mb-2 space-x-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`h-5 w-5 ${s <= roundedAverage ? "text-yellow-400" : "text-muted"}`} fill={s <= roundedAverage ? "currentColor" : "none"} />
              ))}
            </div>
            <div className="text-2xl font-bold">{average.toFixed(1)}</div>
          </div>
        );
      }
      if (question.type === "ja_nej" || question.type === "check") {
        return <div className="text-center"><div className="text-4xl mb-2">{roundedAverage >= 50 ? "✓" : "✗"}</div><div className="text-2xl font-bold">{roundedAverage}%</div></div>;
      }
      return <div className="text-center"><div className="text-4xl mb-2">#</div><div className="text-2xl font-bold">{average.toFixed(1)}</div></div>;
    };

    return (
      <Card className="bg-card text-foreground border border-border shadow-sm">
        <CardHeader className="flex justify-between pb-2">
          <CardTitle className="text-sm font-medium">{question.text}</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {display()}
          <p className="text-xs text-muted-foreground mt-3 text-center">
            {question.type === "ja_nej" || question.type === "check"
              ? t("dashboard.positiveAnswers", { positive: values.filter(v => v === true).length, total: values.length })
              : t("dashboard.averageFromAnswers", { count: values.length })}
          </p>
        </CardContent>
      </Card>
    );
  };

  const renderChartCard = () => {
    const dataByDate = relevantResponses.reduce((acc, r) => {
      const date = new Date(r.createdAt).toLocaleDateString("sv-SE");
      const val = Number(getQuestionValue(r));
      if (!acc[date]) acc[date] = { values: [], date };
      acc[date].values.push(val);
      return acc;
    }, {} as Record<string, { values: number[]; date: string }>);

    const chartData = Object.values(dataByDate).map(({ values, date }) => ({
      date,
      värde: values.reduce((a, b) => a + b, 0) / values.length,
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-7);

    if (chartData.length === 0) return null;

    return (
      <Card className="bg-card text-foreground border border-border shadow-sm col-span-2">
        <CardHeader className="flex justify-between pb-2">
          <CardTitle className="text-sm font-medium">{question.text}</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="h-[108px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -45, bottom: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="date" fontSize={10} stroke="#666" tickFormatter={(d) => new Date(d).toLocaleDateString("sv-SE", { month: "short", day: "numeric" })} />
                <YAxis fontSize={10} stroke="#666" />
                <Tooltip labelFormatter={(d) => new Date(d).toLocaleDateString("sv-SE")} formatter={(v) => [Number(v).toFixed(1), "Medelvärde"]} />
                <Line type="monotone" dataKey="värde" stroke="#3b82f6" strokeWidth={3} dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderProgressCard = () => {
    const values = relevantResponses.map(getQuestionValue).map(Number).filter((v) => !isNaN(v));
    if (values.length === 0) return null;

    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const max = question.type === "nummer" ? (question.validation as any)?.max || 100 : 5;
    const percentage = (average / max) * 100;

    return (
      <Card className="bg-card text-foreground border border-border shadow-sm">
        <CardHeader className="flex justify-between pb-2">
          <CardTitle className="text-sm font-medium">{question.text}</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Genomsnitt</span>
            <span>{average.toFixed(1)} / {max}</span>
          </div>
          <Progress value={percentage} className="h-2 bg-muted" />
          <p className="text-xs text-muted-foreground text-center">{percentage.toFixed(1)}% av maxvärdet</p>
        </CardContent>
      </Card>
    );
  };

  const renderCountCard = () => {
    let count = 0;
    let label = "Svar";

    if (question.type === "ja_nej") {
      count = relevantResponses.filter((r) => getQuestionValue(r) === true).length;
      label = "Ja-svar";
    } else {
      count = relevantResponses.length;
    }

    return (
      <Card className="bg-card text-foreground border border-border shadow-sm">
        <CardHeader className="flex justify-between pb-2">
          <CardTitle className="text-sm font-medium">{question.text}</CardTitle>
          <Hash className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="text-center space-y-2">
          <div className="text-4xl font-bold">{count}</div>
          <p className="text-sm text-muted-foreground">{label}</p>
          {question.type === "ja_nej" && <p className="text-xs text-muted-foreground">{relevantResponses.length - count} Nej-svar</p>}
        </CardContent>
      </Card>
    );
  };

  return renderCard();
}
