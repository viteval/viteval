import { createFileRoute, Link } from '@tanstack/react-router'
import { Database, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-2">ViteVal</h1>
        <p className="text-muted-foreground">
          Choose what you'd like to view
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <FileText className="h-5 w-5" />
              Results
            </CardTitle>
            <CardDescription>
              View and analyze your evaluation results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/results">View Results</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Database className="h-5 w-5" />
              Datasets
            </CardTitle>
            <CardDescription>
              Manage and explore your datasets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/datasets">View Datasets</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}