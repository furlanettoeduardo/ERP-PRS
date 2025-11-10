import { PageContainer } from '@/components/ui/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProductsPage() {
  return (
    <PageContainer
      title="Produtos"
      description="Catálogo e gestão de produtos"
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
