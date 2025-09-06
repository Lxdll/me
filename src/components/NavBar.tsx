/**
 * @author: luxudongg@gmail.com
 * NavBar
 */
import Logo from '@/Logo';
import { Link } from 'react-router-dom';

export default function NavBar() {
  return (
    <nav className="nav flex h-20 items-center justify-end gap-x-4 px-4">
      <Link to="/posts">Blog</Link>
      <a href="https://github.com/Lxdll" target="_blank">
        <Logo.GithubIcon width={24} height={24} />
      </a>
      <a href="https://github.com/Lxdll" target="_blank">
        <Logo.WeChatIcon width={24} height={24} />
      </a>
    </nav>
  );
}
