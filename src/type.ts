import { NonIndexRouteObject } from 'react-router-dom';

export type Frontmatter = {
  [key: string]: string;
};

export type Post = {
  path: string;
  title: string;
  place?: string;
  date: string;
  lang?: string;
  desc?: string;
  platform?: string;
  duration?: string;
  recording?: string;
  radio?: boolean;
  video?: boolean;
  inperson?: boolean;
  redirect?: string;
};

export type RouteItem = Omit<NonIndexRouteObject, 'children'> & {
  frontmatter: Record<string, string>;
  children: RouteItem[];
};
