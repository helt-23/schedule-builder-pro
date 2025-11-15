import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Grid, Calendar } from "lucide-react";
import { format, addDays, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

const ScheduleGrid = () => {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));
  const timeSlots = Array.from({ length: 8 }, (_, i) => `${8 + i}:00`);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Grid className="h-5 w-5 text-primary" />
          Grade Horária
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header with days */}
            <div className="grid grid-cols-6 gap-2 mb-2">
              <div className="font-semibold text-sm text-muted-foreground p-2">
                Horário
              </div>
              {weekDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className="text-center font-semibold text-sm p-2 bg-primary/5 rounded-lg"
                >
                  <div>{format(day, "EEE", { locale: ptBR })}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(day, "dd/MM", { locale: ptBR })}
                  </div>
                </div>
              ))}
            </div>

            {/* Grid cells */}
            <div className="space-y-1">
              {timeSlots.map((time) => (
                <div key={time} className="grid grid-cols-6 gap-2">
                  <div className="text-sm text-muted-foreground font-medium p-2 flex items-center">
                    {time}
                  </div>
                  {weekDays.map((day) => (
                    <button
                      key={`${day.toISOString()}-${time}`}
                      className="min-h-[60px] p-2 border-2 border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all duration-200 text-left group"
                    >
                      <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        Disponível
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-border"></div>
            <span className="text-sm text-muted-foreground">Disponível</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-schedule-occupied"></div>
            <span className="text-sm text-muted-foreground">Ocupado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-schedule-selected"></div>
            <span className="text-sm text-muted-foreground">Selecionado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-schedule-pattern"></div>
            <span className="text-sm text-muted-foreground">Padrão</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-schedule-conflict"></div>
            <span className="text-sm text-muted-foreground">Conflito</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScheduleGrid;
