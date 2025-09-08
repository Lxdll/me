/**
 * @author: luxudongg@gmail.com
 * 专栏
 */

import { RouteItem } from '@/type';

interface FeatureProps {
  dirs: RouteItem[];
}

export default function Feature(props: FeatureProps) {
  const { dirs } = props;

  return dirs.map((dir, index) => {
    return (
      <a
        href={`/posts/${dir.path}` || '#'}
        key={index}
        className="mb-2 flex cursor-pointer items-center justify-center rounded p-2 font-bold"
      >
        {dir.path} 专栏
      </a>
    );
  });
}
