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
import { TrendingUp, BarChart3, Target, Hash, Star, Frown, Meh, Smile } from "lucide-react";
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
      question.type !== "humör" &&
      question.type !== "ja_nej"
    ) {
      return null;
    }

    let values: any[];
    let average: number;
    let maxValue: number;
    let roundedAverage: number;

    if (question.type === "ja_nej") {
      const boolValues = relevantResponses
        .map(getQuestionValue)
        .filter((val) => typeof val === "boolean");
      
      if (boolValues.length === 0) return null;
      
      const yesCount = boolValues.filter(val => val === true).length;
      average = (yesCount / boolValues.length) * 100; // Percentage of yes answers
      maxValue = 100;
      values = boolValues;
      roundedAverage = Math.round(average);
    } else {
      values = relevantResponses
        .map(getQuestionValue)
        .filter((val) => typeof val === "number" || !isNaN(Number(val)))
        .map((val) => Number(val));

      if (values.length === 0) return null;

      average = values.reduce((sum, val) => sum + val, 0) / values.length;
      maxValue = question.type === "nummer" ? (question.validation as any)?.max || 100 : 5;
      roundedAverage = Math.round(average);
    }

    const renderAverageDisplay = () => {
      if (question.type === "humör") {
        const moodIcons = [
          { icon: Frown, color: "text-red-500" },
          { icon: Frown, color: "text-orange-500" },
          { icon: Meh, color: "text-yellow-500" },
          { icon: Smile, color: "text-green-500" },
          { icon: Smile, color: "text-green-600" }
        ];
        const iconData = moodIcons[Math.max(0, Math.min(4, roundedAverage - 1))];
        const IconComponent = iconData.icon;
        return (
          <div className="text-center">
            <div className="mb-2">
              <IconComponent className={`h-12 w-12 mx-auto ${iconData.color}`} />
            </div>
            <div className="text-2xl font-bold">{average.toFixed(1)}</div>
          </div>
        );
      } else if (question.type === "stjärnor") {
        return (
          <div className="text-center">
            <div className="flex justify-center mb-2 space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-8 w-8 ${
                    star <= roundedAverage ? "text-yellow-400" : "text-gray-300"
                  }`}
                  fill={star <= roundedAverage ? "currentColor" : "none"}
                />
              ))}
            </div>
            <div className="text-2xl font-bold">{average.toFixed(1)}</div>
          </div>
        );
      } else if (question.type === "ja_nej") {
        return (
          <div className="text-center">
            <div className="text-4xl mb-2">{average >= 50 ? "✓" : "✗"}</div>
            <div className="text-2xl font-bold">{average.toFixed(1)}%</div>
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
          <div className="h-[108px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -45, bottom: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  dataKey="date"
                  fontSize={10}
                  stroke="#666"
                  tickFormatter={(date) =>
                    new Date(date).toLocaleDateString("sv-SE", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <YAxis fontSize={10} stroke="#666" />
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
                  stroke="#3b82f6"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: "#3b82f6", stroke: "#ffffff", strokeWidth: 2 }}
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
      question.type !== "humör" &&
      question.type !== "ja_nej"
    ) {
      return null;
    }

    let values: number[];
    let average: number;
    let maxValue: number;
    let percentage: number;

    if (question.type === "ja_nej") {
      const boolValues = relevantResponses
        .map(getQuestionValue)
        .filter((val) => typeof val === "boolean");
      
      if (boolValues.length === 0) return null;
      
      const yesCount = boolValues.filter(val => val === true).length;
      average = yesCount;
      maxValue = boolValues.length;
      percentage = (yesCount / boolValues.length) * 100;
      values = boolValues.map(val => val ? 1 : 0);
    } else {
      values = relevantResponses
        .map(getQuestionValue)
        .filter((val) => typeof val === "number" || !isNaN(Number(val)))
        .map((val) => Number(val));

      if (values.length === 0) return null;

      average = values.reduce((sum, val) => sum + val, 0) / values.length;
      maxValue = question.type === "nummer" ? (question.validation as any)?.max || 100 : 5;
      percentage = (average / maxValue) * 100;
    }

    const roundedAverage = Math.round(average);

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
      } else if (question.type === "nummer") {
        return <span className="text-lg font-bold">{roundedAverage}</span>;
      } else if (question.type === "ja_nej") {
        return <span className="text-lg">{percentage >= 50 ? "✓" : "✗"}</span>;
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
                {question.type === "ja_nej" ? `${average.toFixed(1)}%` : `${average.toFixed(1)} / ${maxValue}`}
              </span>
            </div>
            <Progress value={percentage} className="h-3" />
            <p className="text-xs text-muted-foreground text-center">
              {question.type === "ja_nej" ? `${percentage.toFixed(1)}% Ja-svar` : `${percentage.toFixed(1)}% av maxvärdet`}
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
          <div className="text-center space-y-2">
            <div className="text-4xl font-bold">{count}</div>
            <p className="text-sm text-muted-foreground">{label} totalt</p>
            {question.type === "ja_nej" && (
              <div className="text-sm text-muted-foreground">
                {relevantResponses.length - count} Nej-svar
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return renderCard();
}
