/**
 * @author: luxudongg@gmail.com
 * description
 */
import routes from '~react-pages';
import { Link } from 'react-router';
import { formatDate } from '@/util';
import { Post } from '@/type';
import { getYear, isFuture, isSameGroup } from '@/utils/date';
import React from 'react';
import dayjs from 'dayjs';
import Feature from './Feature';
// import { SafeLink } from './SafeLink';

export default function ListPosts() {
  console.log(
    '%c [ dayjs(item.frontmatter?.date).format("YYYY-MM-DD") ]',
    'font-size:13px; background:pink; color:#bf2c9f;',
    dayjs('2025-08-06').format('YYYY-MM-DD')
  );

  const posts = (routes || [])
    .filter((r) => r.path && r.path.startsWith('posts'))
    .map((i) => i.children || [])
    .flat()
    .filter((i) => i.path);

  const dirs = posts.filter((i) => i.path && !i.element);
  console.log(
    '%c [ dirs ]',
    'font-size:13px; background:pink; color:#bf2c9f;',
    dirs
  );

  const realPosts = posts
    .filter((i) => i.path && i.element)
    .map((item) => ({
      path: item.frontmatter?.redirect || item.path || '',
      title: item.frontmatter?.title,
      date: item.frontmatter?.date,
      lang: item.frontmatter?.lang || 'zh',
      duration: item.frontmatter?.duration,
      // recording: item.frontmatter.recording,
      // upcoming: item.frontmatter.upcoming,
      // redirect: item.frontmatter.redirect,
      // place: item.frontmatter.place,
    }))
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));

  console.log(
    '%c [ posts ]',
    'font-size:13px; background:pink; color:#bf2c9f;',
    posts
  );

  function getGroupName(p: Post) {
    if (isFuture(p.date)) return 'Upcoming';
    return getYear(p.date);
  }

  return (
    <div>
      {/* 专栏 */}
      <Feature dirs={dirs} />

      {realPosts.map((post, index) => {
        const isExternal = post.path.includes('://');

        const groupNode = (
          <div
            className="slide-enter pointer-events-none relative h-20 select-none"
            style={
              {
                '--enter-stage': index - 2,
                '--enter-step': '60ms',
              } as React.CSSProperties
            }
          >
            <span
              className="absolute -top-8 -left-12 text-[8em] font-bold text-transparent opacity-10"
              style={{
                WebkitTextStrokeWidth: '3px',
                WebkitTextStrokeColor: '#aaa',
              }}
            >
              {getGroupName(post)}
            </span>
          </div>
        );

        let renderNode = (
          <li className="flex flex-col gap-2 no-underline md:flex-row md:items-center">
            <div className="title flex flex-wrap gap-2 text-lg leading-[1.2em]">
              <span className="align-middle font-normal">{post.title}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm whitespace-nowrap opacity-50">
                {formatDate(post.date, true)}
              </span>
              {post.duration && (
                <span className="text-sm whitespace-nowrap opacity-40">
                  · {post.duration}
                </span>
              )}
            </div>
          </li>
        );

        if (isExternal) {
          renderNode = (
            <a
              key={index}
              className="item mt-2 mb-6 block font-normal no-underline"
              href={post.path}
              target="_blank"
              rel="noopener noreferrer"
            >
              {renderNode}
            </a>
          );
        } else {
          renderNode = (
            <Link key={index} to={post.path}>
              {renderNode}
            </Link>
            // <SafeLink to={post.path}>{renderNode}</SafeLink>
          );
        }

        if (!isSameGroup(post, realPosts[index - 1])) {
          renderNode = (
            <>
              {groupNode}
              {renderNode}
            </>
          );
        }

        return <React.Fragment key={index}>{renderNode}</React.Fragment>;
      })}
    </div>
  );
}
