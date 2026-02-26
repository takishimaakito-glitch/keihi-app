
import AppRouter from './pages/AppRouter';
import { AppProvider } from './contexts/AppContext';

function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  )
}

export default App
