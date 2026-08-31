import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BreadcrumbItem {
  label: string;
  path: string;
  icon?: React.ReactNode;
}

interface BreadcrumbProps {
  className?: string;
  separator?: React.ReactNode;
  showHome?: boolean;
}

// Route to breadcrumb mapping
const ROUTE_LABELS: Record<string, string> = {
  '/chat': 'Home',
  '/profile': 'Profile',
  '/friends': 'Friends',
  '/search': 'Search',
};

const ROUTE_ICONS: Record<string, React.ReactNode> = {
  '/chat': <Home className="h-4 w-4" />,
};

export const Breadcrumb = ({
  className,
  separator = <ChevronRight className="h-4 w-4 text-muted-foreground" />,
  showHome = true,
}: BreadcrumbProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Generate breadcrumb items from current route
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname
      .split('/')
      .filter((segment) => segment.length > 0);

    // If no segments or only one segment, show minimal breadcrumbs
    if (pathSegments.length === 0) return [];

    const breadcrumbs: BreadcrumbItem[] = [];

    // Add home if enabled
    if (showHome) {
      breadcrumbs.push({
        label: 'Home',
        path: '/chat',
        icon: ROUTE_ICONS['/chat'],
      });
    }

    // Add current page
    const currentPath = `/${pathSegments[0]}`;
    const label = ROUTE_LABELS[currentPath] || formatLabel(pathSegments[0]);

    breadcrumbs.push({
      label,
      path: currentPath,
      icon: ROUTE_ICONS[currentPath],
    });

    return breadcrumbs;
  };

  // Format label from route segment
  const formatLabel = (segment: string): string => {
    return segment
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't render if no breadcrumbs
  if (breadcrumbs.length === 0) return null;

  return (
    <nav
      className={cn(
        'flex items-center gap-2 text-sm',
        className
      )}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center gap-2">
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.path} className="flex items-center gap-2">
            <button
              onClick={() => navigate(crumb.path)}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded hover:bg-muted transition-colors',
                location.pathname === crumb.path
                  ? 'text-foreground font-semibold cursor-default'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-current={location.pathname === crumb.path ? 'page' : undefined}
            >
              {crumb.icon && <span className="flex-shrink-0">{crumb.icon}</span>}
              <span>{crumb.label}</span>
            </button>

            {/* Separator - only show if not last item */}
            {index < breadcrumbs.length - 1 && (
              <span className="flex-shrink-0" aria-hidden="true">
                {separator}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

// Compact version - icon only
export const BreadcrumbCompact = () => {
  const location = useLocation();
  const navigate = useNavigate();

  if (location.pathname === '/chat') return null;

  return (
    <button
      onClick={() => navigate(-1)}
      className="p-2 hover:bg-muted rounded-lg transition text-muted-foreground hover:text-foreground"
      title="Go back"
    >
      <ChevronRight className="h-5 w-5 rotate-180" />
    </button>
  );
};