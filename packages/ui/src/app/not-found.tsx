import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="container mx-auto p-6 space-y-6 overflow-hidden">
      <div className="text-center py-16">
        <div className="text-6xl mb-4">404</div>
        <div className="text-2xl font-semibold mb-4">Page Not Found</div>
        <div className="text-muted-foreground mb-8">
          The page you&apos;re looking for doesn&apos;t exist.
        </div>
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    </div>
  );
}
