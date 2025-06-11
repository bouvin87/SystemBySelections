import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { TrendingUp, BarChart3, Target, Hash } from "lucide-react";
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
  // Filter responses that have answers for this question
  const relevantResponses = responses.filter((response) => {
    if (!response.responses || typeof response.responses !== "object")
      return false;
    const responseObj = response.responses as Record<string, any>;
    return responseObj[question.id.toString()] !== undefined;
  });

  const getQuestionValue = (response: ChecklistResponse) => {
    const responses = (response.responses as Record<string, any>) || {};
    return responses[question.id.toString()];
  };

  const renderCard = () => {
    if (!question.dashboardDisplayType || relevantResponses.length === 0) {
      return null;
    }

    switch (question.dashboardDisplayType) {
      case "medelvärde":
        return renderAverageCard();
      case "graf":
        return renderChartCard();
      case "progressbar":
        return renderProgressCard();
      case "antal":
        return renderCountCard();
      default:
        return null;
    }
  };

  const renderAverageCard = () => {
    if (
      question.type !== "nummer" &&
      question.type !== "stjärnor" &&
      question.type !== "humör"
    ) {
      return null;
    }

    const values = relevantResponses
      .map(getQuestionValue)
      .filter((val) => typeof val === "number" || !isNaN(Number(val)))
      .map((val) => Number(val));

    if (values.length === 0) return null;

    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const roundedAverage = Math.round(average);
    const maxValue =
      question.type === "nummer" ? (question.validation as any)?.max || 100 : 5;

    const renderAverageDisplay = () => {
      if (question.type === "humör") {
        const moodEmojis = ["😞", "😐", "🙂", "😊", "😄"];
        const emoji = moodEmojis[Math.max(0, Math.min(4, roundedAverage - 1))];
        return (
          <div className="text-center">
            <div className="text-4xl mb-2">{emoji}</div>
            <div className="text-2xl font-bold">{average.toFixed(1)}</div>
          </div>
        );
      } else if (question.type === "stjärnor") {
        return (
          <div className="text-center">
            <div className="flex justify-center mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-4xl ${
                    star <= roundedAverage ? "text-yellow-400" : "text-gray-300"
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
            <div className="text-2xl font-bold">{average.toFixed(1)}</div>
          </div>
        );
      } else {
        return (
          <div className="text-center">
            <div className="text-4xl mb-2">#️</div>
            <div className="text-2xl font-bold">{average.toFixed(1)}</div>
          </div>
        );
      }
    };

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{question.text}</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {renderAverageDisplay()}

          <p className="text-xs text-muted-foreground mt-3 text-center">
            Medelvärde av {values.length} svar
          </p>
        </CardContent>

      </Card>
    );
  };

  const renderChartCard = () => {
    if (
      question.type !== "nummer" &&
      question.type !== "stjärnor" &&
      question.type !== "humör"
    ) {
      return null;
    }

    // Group by date and calculate averages
    const dataByDate = relevantResponses.reduce(
      (acc, response) => {
        const date = new Date(response.createdAt).toLocaleDateString("sv-SE");
        const value = Number(getQuestionValue(response));

        if (!acc[date]) {
          acc[date] = { values: [], date };
        }
        acc[date].values.push(value);
        return acc;
      },
      {} as Record<string, { values: number[]; date: string }>,
    );

    const chartData = Object.values(dataByDate)
      .map(({ values, date }) => ({
        date,
        värde: values.reduce((sum, val) => sum + val, 0) / values.length,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7); // Last 7 days

    if (chartData.length === 0) return null;

    return (
      <Card className="col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{question.text}</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  fontSize={12}
                  tickFormatter={(date) =>
                    new Date(date).toLocaleDateString("sv-SE", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <YAxis fontSize={12} />
                <Tooltip
                  labelFormatter={(date) =>
                    new Date(date).toLocaleDateString("sv-SE")
                  }
                  formatter={(value) => [
                    Number(value).toFixed(1),
                    "Medelvärde",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="värde"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderProgressCard = () => {
    if (
      question.type !== "nummer" &&
      question.type !== "stjärnor" &&
      question.type !== "humör"
    ) {
      return null;
    }

    const values = relevantResponses
      .map(getQuestionValue)
      .filter((val) => typeof val === "number" || !isNaN(Number(val)))
      .map((val) => Number(val));

    if (values.length === 0) return null;

    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const roundedAverage = Math.round(average);
    const maxValue =
      question.type === "nummer" ? (question.validation as any)?.max || 100 : 5;
    const percentage = (average / maxValue) * 100;

    const renderVisualIndicator = () => {
      if (question.type === "humör") {
        const moodEmojis = ["😞", "😐", "🙂", "😊", "😄"];
        const emoji = moodEmojis[Math.max(0, Math.min(4, roundedAverage - 1))];
        return <span className="text-lg">{emoji}</span>;
      } else if (question.type === "stjärnor") {
        return (
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`text-sm ${
                  star <= roundedAverage ? "text-yellow-400" : "text-gray-300"
                }`}
              >
                ★
              </span>
            ))}
          </div>
        );
      }
      return null;
    };

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{question.text}</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Genomsnitt
                </span>
                {renderVisualIndicator()}
              </div>
              <span className="text-sm font-medium">
                {average.toFixed(1)} / {maxValue}
              </span>
            </div>
            <Progress value={percentage} className="h-3" />
            <p className="text-xs text-muted-foreground text-center">
              {percentage.toFixed(1)}% av maxvärdet
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderCountCard = () => {
    let count = 0;
    let label = "Svar";

    switch (question.type) {
      case "ja_nej":
        const yesCount = relevantResponses.filter(
          (r) => getQuestionValue(r) === true,
        ).length;
        count = yesCount;
        label = "Ja-svar";
        break;
      case "nummer":
      case "stjärnor":
      case "humör":
        count = relevantResponses.length;
        label = "Svar";
        break;
      default:
        count = relevantResponses.length;
        label = "Svar";
    }

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{question.text}</CardTitle>
          <Hash className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{count}</div>
          <p className="text-xs text-muted-foreground">{label} totalt</p>
          {question.type === "ja_nej" && (
            <div className="mt-2 text-xs text-muted-foreground">
              {relevantResponses.length - count} Nej-svar
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return renderCard();
}
