/**
 * @author: luxudongg@gmail.com
 * SubNav
 */

import { cn } from '@/util';
import { Link, useLocation } from 'react-router';

const inactiveStyle = 'opacity-20 hover:opacity-50 !border-none';
const activeStyle = 'opacity-100 underline !border-none';
const cls = '!border-none';

export default function SubNav() {
  const location = useLocation();

  return (
    <div className="mb-8 flex items-center gap-3 text-3xl">
      <Link
        to="/posts"
        className={cn(
          cls,
          location.pathname.startsWith('/posts') ? activeStyle : inactiveStyle
        )}
      >
        Blog
      </Link>
      {/* <Link
        to="/talks"
        className={cn(
          cls,
          location.pathname.startsWith('/talks') ? activeStyle : inactiveStyle
        )}
      >
        Talks
      </Link>
      <Link
        to="/podcasts"
        className={cn(
          cls,
          location.pathname.startsWith('/podcasts')
            ? activeStyle
            : inactiveStyle
        )}
      >
        Podcasts
      </Link>
      <Link
        to="/notes"
        className={cn(
          cls,
          location.pathname.startsWith('/notes') ? activeStyle : inactiveStyle
        )}
      >
        Notes
      </Link> */}
    </div>
  );
}
