import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function KanbanDetails() {
  const [location, navigate] = useLocation();
  const boardId = location.split('/')[2];

  console.log("Simple KanbanDetails - boardId:", boardId);
  console.log("Simple KanbanDetails - location:", location);

  // Fetch board details
  const { data: board, isLoading: boardLoading, error: boardError } = useQuery({
    queryKey: [`/api/kanban/boards/${boardId}`],
    enabled: !!boardId,
  });

  // Fetch columns 
  const { data: columns = [], isLoading: columnsLoading, error: columnsError } = useQuery({
    queryKey: [`/api/kanban/boards/${boardId}/columns`],
    enabled: !!boardId,
  });

  // Fetch cards
  const { data: cards = [], isLoading: cardsLoading, error: cardsError } = useQuery({
    queryKey: [`/api/kanban/boards/${boardId}/cards`],
    enabled: !!boardId,
  });

  console.log("Simple KanbanDetails - board:", board);
  console.log("Simple KanbanDetails - columns:", columns);
  console.log("Simple KanbanDetails - cards:", cards);
  console.log("Simple KanbanDetails - errors:", { boardError, columnsError, cardsError });

  if (!boardId) {
    navigate("/kanban");
    return null;
  }

  if (boardLoading || columnsLoading || cardsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate("/kanban")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka
          </Button>
        </div>
        <div className="text-center">Laddar...</div>
      </div>
    );
  }

  if (boardError || columnsError || cardsError) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate("/kanban")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka
          </Button>
        </div>
        <div className="text-center text-red-500">
          Fel vid laddning: {boardError?.message || columnsError?.message || cardsError?.message}
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate("/kanban")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka
          </Button>
        </div>
        <div className="text-center">Tavla inte hittad</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/kanban")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{board.name}</h1>
            {board.description && (
              <p className="text-muted-foreground">{board.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Debug Information */}
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h3 className="font-bold">Debug Info:</h3>
        <p>Board ID: {boardId}</p>
        <p>Board Name: {board?.name}</p>
        <p>Columns Count: {columns?.length}</p>
        <p>Cards Count: {cards?.length}</p>
      </div>

      {/* Simple Column Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {columns.map((column: any) => (
          <div key={column.id} className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold mb-2">{column.title}</h3>
            <div className="space-y-2">
              {cards
                .filter((card: any) => card.columnId === column.id)
                .map((card: any) => (
                  <div key={card.id} className="bg-gray-50 p-2 rounded">
                    <p className="font-medium">{card.title}</p>
                    {card.description && (
                      <p className="text-sm text-gray-600">{card.description}</p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}