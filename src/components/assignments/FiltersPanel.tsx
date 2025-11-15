import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter } from "lucide-react";

interface Block {
  id: string;
  name: string;
  code: string | null;
}

interface Laboratory {
  id: string;
  name: string;
  capacity: number | null;
}

interface Shift {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
}

const FiltersPanel = () => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<string>("");
  const [selectedLab, setSelectedLab] = useState<string>("");
  const [selectedShift, setSelectedShift] = useState<string>("");

  useEffect(() => {
    loadBlocks();
    loadShifts();
  }, []);

  useEffect(() => {
    if (selectedBlock) {
      loadLaboratories(selectedBlock);
    } else {
      setLaboratories([]);
      setSelectedLab("");
    }
  }, [selectedBlock]);

  const loadBlocks = async () => {
    const { data, error } = await supabase
      .from("blocks")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error loading blocks:", error);
      return;
    }

    setBlocks(data || []);
  };

  const loadLaboratories = async (blockId: string) => {
    const { data, error } = await supabase
      .from("laboratories")
      .select("*")
      .eq("block_id", blockId)
      .order("name");

    if (error) {
      console.error("Error loading laboratories:", error);
      return;
    }

    setLaboratories(data || []);
  };

  const loadShifts = async () => {
    const { data, error } = await supabase
      .from("shifts")
      .select("*")
      .order("start_time");

    if (error) {
      console.error("Error loading shifts:", error);
      return;
    }

    setShifts(data || []);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="block">Bloco</Label>
            <Select value={selectedBlock} onValueChange={setSelectedBlock}>
              <SelectTrigger id="block">
                <SelectValue placeholder="Selecione um bloco" />
              </SelectTrigger>
              <SelectContent>
                {blocks.map((block) => (
                  <SelectItem key={block.id} value={block.id}>
                    {block.code ? `${block.code} - ${block.name}` : block.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="laboratory">Laboratório</Label>
            <Select
              value={selectedLab}
              onValueChange={setSelectedLab}
              disabled={!selectedBlock}
            >
              <SelectTrigger id="laboratory">
                <SelectValue placeholder="Selecione um laboratório" />
              </SelectTrigger>
              <SelectContent>
                {laboratories.map((lab) => (
                  <SelectItem key={lab.id} value={lab.id}>
                    {lab.name} {lab.capacity ? `(${lab.capacity} lugares)` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shift">Turno</Label>
            <Select value={selectedShift} onValueChange={setSelectedShift}>
              <SelectTrigger id="shift">
                <SelectValue placeholder="Selecione um turno" />
              </SelectTrigger>
              <SelectContent>
                {shifts.map((shift) => (
                  <SelectItem key={shift.id} value={shift.id}>
                    {shift.name} ({shift.start_time.substring(0, 5)} - {shift.end_time.substring(0, 5)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FiltersPanel;
