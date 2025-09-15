/**
 * @author: luxudongg@gmail.com
 * description
 */

import routes from '~react-pages';

interface ReactFeatureProps {
  featurePath: string;
}

export default function ReactFeature(props: ReactFeatureProps) {
  const { featurePath } = props;

  const posts = (routes.filter((i) => i.path === 'posts') || []).flatMap(
    (i) => i.children || []
  );

  const p = posts.find((i) => i.path === featurePath);
  if (!p) return null;

  const _p = (p.children || [])
    .filter((i) => i.path)
    .map((i) => {
      const children = i.children || [];
      const homePage = children.find((c) => c.path === '');
      return {
        title: homePage?.frontmatter?.title,
        path: i.path,
      };
    })
    .filter((i) => Boolean(i.title));

  return _p.map(({ title, path }) => {
    return (
      <a
        className="block w-fit cursor-pointer"
        href={`${featurePath}/${path}`}
        key={path}
      >
        {title}
      </a>
    );
  });
}
