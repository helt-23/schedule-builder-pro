import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/use-debounce";

interface Discipline {
  id: string;
  code: string;
  name: string;
  credits: number | null;
}

const DisciplineSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState<Discipline | null>(null);
  const [loading, setLoading] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 250);

  useEffect(() => {
    if (debouncedSearch) {
      searchDisciplines(debouncedSearch);
    } else {
      setDisciplines([]);
    }
  }, [debouncedSearch]);

  const searchDisciplines = async (term: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("disciplines")
      .select("*")
      .eq("active", true)
      .or(`name.ilike.%${term}%,code.ilike.%${term}%`)
      .limit(10);

    if (error) {
      console.error("Error searching disciplines:", error);
    } else {
      setDisciplines(data || []);
    }
    setLoading(false);
  };

  const handleSelectDiscipline = (discipline: Discipline) => {
    setSelectedDiscipline(discipline);
    setSearchTerm("");
    setDisciplines([]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Buscar Disciplina
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="discipline-search">Código ou Nome da Disciplina</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="discipline-search"
              type="text"
              placeholder="Digite para buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {loading && <p className="text-sm text-muted-foreground">Buscando...</p>}
          
          {disciplines.length > 0 && (
            <div className="border border-border rounded-lg max-h-48 overflow-y-auto">
              {disciplines.map((discipline) => (
                <button
                  key={discipline.id}
                  onClick={() => handleSelectDiscipline(discipline)}
                  className="w-full text-left px-4 py-3 hover:bg-accent transition-colors border-b border-border last:border-b-0"
                >
                  <div className="font-medium">{discipline.code}</div>
                  <div className="text-sm text-muted-foreground">{discipline.name}</div>
                  {discipline.credits && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {discipline.credits} créditos
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedDiscipline && (
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <Badge variant="default" className="mb-2">{selectedDiscipline.code}</Badge>
                <h4 className="font-semibold">{selectedDiscipline.name}</h4>
                {selectedDiscipline.credits && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedDiscipline.credits} créditos
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedDiscipline(null)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                Limpar
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DisciplineSearch;
