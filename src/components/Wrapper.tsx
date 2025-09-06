/**
 * @author: luxudongg@gmail.com
 * description
 */

import { Frontmatter } from '@/type';
import { PropsWithChildren } from 'react';
import routes from '~react-pages';
import HeaderPost from './HeaderPost';
console.log(
  '%c [ routes ]',
  'font-size:13px; background:pink; color:#bf2c9f;',
  routes
);

interface WrapperProps extends PropsWithChildren {
  frontmatter: Frontmatter;
}

export default function Wrapper({ frontmatter, children }: WrapperProps) {
  return (
    <>
      {(frontmatter.display || frontmatter.title) && (
        <HeaderPost frontmatter={frontmatter} />
      )}
      <article>{children}</article>
    </>
  );
  return <span>shi</span>;
}
