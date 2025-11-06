import './App.css';
import { useUser } from './contexts/UserContext';
import { DocumentProvider } from './contexts/DocumentContext';
import NamePrompt from './components/auth/NamePrompt';
import EditorLayout from './components/EditorLayout';

function App() {
  const { user } = useUser();

  if (!user) {
    return <NamePrompt />;
  }

  return (
    <DocumentProvider>
      <EditorLayout />
    </DocumentProvider>
  );
}

export default App;