import { Settings } from 'lucide-react';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Settings
        </h1>
        <p className="text-muted-foreground">
          Configure your Viteval instance
        </p>
      </div>
      <Card>
        <CardHeader className="items-center text-center py-16">
          <CardTitle className="text-xl">Coming Soon</CardTitle>
          <CardDescription>
            Settings and configuration options will be available here in a
            future release.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
