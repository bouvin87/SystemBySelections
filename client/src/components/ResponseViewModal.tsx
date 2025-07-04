import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, User, MapPin, Clock } from "lucide-react";
import type { ChecklistResponse, Category, Question, WorkTask, WorkStation, Shift } from "@shared/schema";

interface ResponseViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  responseId: number | null;
}

export default function ResponseViewModal({ isOpen, onClose, responseId }: ResponseViewModalProps) {
  const { data: response, isLoading: responseLoading, error: responseError } = useQuery<ChecklistResponse>({
    queryKey: [`/api/responses/${responseId}`],
    enabled: !!responseId,
  });

  // Get categories for this checklist
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: [`/api/categories?checklistId=${response?.checklistId}`],
    enabled: !!response?.checklistId,
  });

  // Get all questions for all categories in this checklist
  const { data: allQuestions = [] } = useQuery<Question[]>({
    queryKey: ["/api/questions", "all-categories", categories.map(c => c.id).join(',')],
    queryFn: async () => {
      if (!categories.length) return [];
      
      const allQuestions: Question[] = [];
      
      // Fetch questions for each category with proper authentication
      for (const category of categories) {
        try {
          const token = localStorage.getItem('authToken');
          const url = `/api/questions?categoryId=${category.id}`;
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };
          
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
          
          const response = await fetch(url, {
            headers,
            credentials: 'include'
          });
          
          if (response.ok) {
            const questions = await response.json();
            allQuestions.push(...questions);

          } else {
            console.warn(`Failed to fetch questions for category ${category.name}: ${response.status} ${response.statusText}`);
          }
        } catch (error) {
          console.error(`Error fetching questions for category ${category.name}:`, error);
        }
      }
      
      return allQuestions;
    },
    enabled: categories.length > 0,
  });

  // Fetch related data using existing queries that have auth handled
  const { data: workTasks = [] } = useQuery<WorkTask[]>({
    queryKey: ["/api/work-tasks"],
  });

  const { data: workStations = [] } = useQuery<WorkStation[]>({
    queryKey: ["/api/work-stations"],
  });

  const { data: shifts = [] } = useQuery<Shift[]>({
    queryKey: ["/api/shifts"],
  });

  // Find the related objects
  const workTask = workTasks.find(wt => wt.id === response?.workTaskId);
  const workStation = workStations.find(ws => ws.id === response?.workStationId);
  const shift = shifts.find(s => s.id === response?.shiftId);

  const renderQuestionValue = (question: Question, value: any) => {
    if (question.hideInView) {
      return <span className="text-muted-foreground italic">Dold i visning</span>;
    }

    if (value === null || value === undefined || value === "") {
      return <span className="text-muted-foreground">Ej besvarat</span>;
    }

    switch (question.type) {
      case "ja_nej":
        return (
          <Badge variant={value ? "default" : "secondary"}>
            {value ? "Ja" : "Nej"}
          </Badge>
        );
      case "check":
        return (
          <Badge variant={value ? "default" : "secondary"}>
            {value ? "Markerad" : "Ej markerad"}
          </Badge>
        );
      case "stjärnor":
        return (
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`text-lg ${
                  star <= value ? "text-yellow-400" : "text-gray-300"
                }`}
              >
                ★
              </span>
            ))}
            <span className="ml-2 text-sm">({value}/5)</span>
          </div>
        );
      case "humör":
        const moodEmojis = ["😞", "😐", "🙂", "😊", "😄"];
        const emoji = moodEmojis[Math.max(0, Math.min(4, value - 1))];
        return (
          <div className="flex items-center gap-2">
            <span className="text-2xl">{emoji}</span>
            <span>({value}/5)</span>
          </div>
        );
      case "datum":
        return new Date(value).toLocaleDateString('sv-SE');
      case "val":
        if (Array.isArray(value)) {
          return value.map((v, i) => (
            <Badge key={i} variant="outline" className="mr-1">
              {v}
            </Badge>
          ));
        }
        return <Badge variant="outline">{value}</Badge>;
      default:
        return <span>{value}</span>;
    }
  };



  if (responseLoading || !response) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Laddar response...</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p>Response ID: {responseId}</p>
            <p>Loading: {responseLoading ? 'Ja' : 'Nej'}</p>
            <p>Error: {responseError ? String(responseError) : 'Inget'}</p>
            <p>Response data: {response ? 'Tillgänglig' : 'Saknas'}</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const responseData = response.responses as Record<string, any> || {};

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Checklista svar</DialogTitle>
        </DialogHeader>

        {/* Response Info */}
        <Card>
          <CardHeader>
            <CardTitle>Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Operatör:</span>
                <span>{response.operatorName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Datum:</span>
                <span>{new Date(response.createdAt).toLocaleDateString('sv-SE')}</span>
              </div>
              {workTask && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Arbetsmoment:</span>
                  <span>{workTask.name}</span>
                </div>
              )}
              {workStation && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Arbetsstation:</span>
                  <span>{workStation.name}</span>
                </div>
              )}
              {shift && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Skift:</span>
                  <span>{shift.name} ({shift.startTime}-{shift.endTime})</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="font-medium">Status:</span>
                <Badge variant={response.isCompleted ? "default" : "secondary"}>
                  {response.isCompleted ? "Slutförd" : "Pågående"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions and Answers with Tabs */}
        {categories.length > 0 && (
          <Tabs defaultValue={categories[0]?.id.toString()} className="w-full">
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${categories.length}, 1fr)` }}>
              {categories
                .sort((a, b) => a.order - b.order)
                .map((category) => (
                  <TabsTrigger key={category.id} value={category.id.toString()}>
                    {category.name}
                  </TabsTrigger>
                ))}
            </TabsList>
          
          {categories
            .sort((a, b) => a.order - b.order)
            .map((category) => {
              const categoryQuestions = allQuestions
                .filter(q => q.categoryId === category.id)
                .sort((a, b) => a.order - b.order);
              


              return (
                <TabsContent key={category.id} value={category.id.toString()}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      {category.description && (
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      {categoryQuestions.length > 0 ? (
                        <div className="space-y-4">
                          {categoryQuestions.map((question, index) => (
                            <div key={question.id}>
                              <div className="flex flex-col space-y-2">
                                <div className="flex items-start justify-between">
                                  <span className="text-sm font-medium">{question.text}</span>
                                  {question.isRequired && (
                                    <Badge variant="outline" className="text-xs">
                                      Obligatorisk
                                    </Badge>
                                  )}
                                </div>
                                <div className="pl-4">
                                  {renderQuestionValue(question, responseData[question.id.toString()])}
                                </div>
                              </div>
                              {index < categoryQuestions.length - 1 && (
                                <Separator className="mt-4" />
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">Inga frågor i denna kategori</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}