export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">
          🚀 ERP - Sistema de Gestão Empresarial
        </h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-2">✅ Frontend Next.js</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Interface moderna com Next.js 15, TailwindCSS e ShadCN/UI
              </p>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-2">⚙️ Backend NestJS</h2>
              <p className="text-gray-600 dark:text-gray-400">
                API robusta com NestJS, Prisma e PostgreSQL
              </p>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-2">🐳 Docker</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Ambiente containerizado pronto para produção
              </p>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-2">🔐 Autenticação JWT</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Sistema de autenticação seguro e escalável
              </p>
            </div>
          </div>
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Ambiente de desenvolvimento configurado e pronto para uso
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
