import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { LogOut, User, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import FiltersPanel from "@/components/assignments/FiltersPanel";
import WeekNavigator from "@/components/assignments/WeekNavigator";
import ScheduleGrid from "@/components/assignments/ScheduleGrid";
import DisciplineSearch from "@/components/assignments/DisciplineSearch";
import ReservationForm from "@/components/assignments/ReservationForm";
import { User as UserType } from "@supabase/supabase-js";

const Assignments = () => {
  const [user, setUser] = useState<UserType | null>(null);
  const [userProfile, setUserProfile] = useState<{ full_name: string; role: string } | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          loadUserProfile(session.user.id);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("users")
      .select("full_name, role")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error loading user profile:", error);
      return;
    }

    setUserProfile(data);
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao sair",
        description: error.message,
      });
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Atribuir Aulas</h1>
                <p className="text-sm text-muted-foreground">Sistema de Agendamento de Laboratórios</p>
              </div>
            </div>
            {user && (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{userProfile?.full_name || user.email}</span>
                  </div>
                  {userProfile?.role === "admin" && (
                    <span className="text-xs text-primary font-medium">Administrador</span>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Filters */}
        <FiltersPanel />

        {/* Week Navigator */}
        <WeekNavigator />

        {/* Discipline Search */}
        <DisciplineSearch />

        {/* Schedule Grid */}
        <ScheduleGrid />

        {/* Reservation Form */}
        <ReservationForm />
      </main>
    </div>
  );
};

export default Assignments;
