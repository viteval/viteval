import { Icon } from '@iconify/react'
import { Link } from '@tanstack/react-router'
import { Badge } from './ui/badge'

export default function Header() {
  return (
    <header className="p-4 flex gap-2 bg-card text-card-foreground justify-between border-b border-border">
      <div className="flex items-center gap-3">
        <img src="/logo192.png" alt="Viteval" className="w-8 h-8" />
        <h1 className="text-xl text-white">
          <span className="font-bold">Viteval</span>
        </h1>
        <Badge>
          alpha
        </Badge>
      </div>
      <nav className="flex flex-row items-center gap-4">
        <Link to="/">
          Results
        </Link>
        <Link to="/datasets">
          Datasets
        </Link>
      </nav>
      <nav className="flex flex-row items-center gap-4">
        <div className="flex items-center gap-4">
          <a
            href="https://viteval.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 hover:text-primary transition-colors font-medium"
          >
            <Icon icon="mdi:book-open" width={18} />
            Docs
          </a>
          <div className="w-px h-5 bg-border" />
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/viteval/viteval"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:text-primary transition-colors"
              title="GitHub"
            >
              <Icon icon="mdi:github" width={20} />
            </a>
            <a
              href="https://discord.gg/2MFYxEdJQB"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:text-primary transition-colors"
              title="Discord"
            >
              <Icon icon="mdi:discord" width={20} />
            </a>
          </div>
        </div>
      </nav>
    </header>
  )
}
