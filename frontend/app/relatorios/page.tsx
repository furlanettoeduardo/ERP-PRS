import { PageContainer } from '@/components/ui/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function RelatoriosPage() {
  return (
    <PageContainer
      title="Relatórios"
      description="Relatórios e análises do sistema"
    >
      <Card>
        <CardHeader>
          <CardTitle>Em breve</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Esta funcionalidade será implementada nas próximas etapas do projeto.
          </p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
