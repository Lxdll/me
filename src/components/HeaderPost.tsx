/**
 * @author: luxudongg@gmail.com
 * description
 */

import { Frontmatter } from '@/type';
import { cn, formatDate } from '@/util';

interface HeaderPostProps {
  frontmatter: Frontmatter;
}

export default function HeaderPost({ frontmatter }: HeaderPostProps) {
  if (!(frontmatter.display ?? frontmatter.title)) return null;

  return (
    <div
      className={cn('prose m-auto mb-0', frontmatter.wrapperClass)}
      lang={frontmatter.lang}
      style={{ marginBottom: '2rem' }}
    >
      <h1 className="slide-enter-50 mb-0">
        {frontmatter.display ?? frontmatter.title}
      </h1>

      {frontmatter.date && (
        <p className="slide-enter-50 !-mt-6 opacity-50">
          {formatDate(frontmatter.date, false)}
          {frontmatter.duration && <> · {frontmatter.duration}</>}
        </p>
      )}

      {frontmatter.place && (
        <p className="mt--4!">
          <span className="op50">at </span>
          {frontmatter.placeLink ? (
            <a
              href={frontmatter.placeLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              {frontmatter.place}
            </a>
          ) : (
            <span className="font-bold">{frontmatter.place}</span>
          )}
        </p>
      )}

      {frontmatter.subtitle && (
        <p className="slide-enter !-mt-6 italic opacity-50">
          {frontmatter.subtitle}
        </p>
      )}

      {frontmatter.draft && (
        <p className="slide-enter bg-orange-4/10 text-orange-4 border-orange-4 border-l-3 px-4 py-2">
          This is a draft post, the content may be incomplete. Please check back
          later.
        </p>
      )}
    </div>
  );
}
