import BranchBackground from './components/Background';
import NavBar from '@/components/NavBar';
import { useRoutes } from 'react-router';
import routes from '~react-pages';

function App() {
  return (
    <>
      <BranchBackground />
      <NavBar />
      {useRoutes(routes)}
    </>
  );
}

export default App;
