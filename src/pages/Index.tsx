import { Button } from "@/components/ui/button";
import { Calendar, BookOpen, Grid, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-primary/10 p-6">
              <Calendar className="h-16 w-16 text-primary" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Sistema de Agendamento de Laboratórios
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Gerencie reservas de laboratórios de forma eficiente com nossa plataforma completa
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")}>
              Acessar Sistema
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
              Criar Conta
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-card rounded-xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="rounded-lg bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
              <Grid className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Grade Horária</h3>
            <p className="text-muted-foreground">
              Visualize e gerencie disponibilidade de laboratórios em uma grade semanal intuitiva
            </p>
          </div>

          <div className="bg-card rounded-xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="rounded-lg bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Disciplinas</h3>
            <p className="text-muted-foreground">
              Busque e selecione disciplinas facilmente para criar reservas recorrentes
            </p>
          </div>

          <div className="bg-card rounded-xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="rounded-lg bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Controle de Acesso</h3>
            <p className="text-muted-foreground">
              Sistema com controle de permissões para administradores e usuários
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="bg-card rounded-xl p-8 border border-border max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Pronto para começar?</h2>
            <p className="text-muted-foreground mb-6">
              Acesse o sistema agora e comece a gerenciar seus laboratórios de forma eficiente
            </p>
            <Button size="lg" onClick={() => navigate("/auth")}>
              Fazer Login
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
