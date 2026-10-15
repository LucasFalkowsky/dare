import { PrinciplesManagement } from './components/principles-management'
import { HowToPage } from './components/how-to'
import { useRoute } from './lib/useRoute'

function App() {
  const { route, navigate } = useRoute()

  return route === 'how-to' ? (
    <HowToPage onBackToDeck={() => navigate('deck')} />
  ) : (
    <PrinciplesManagement onOpenHowTo={() => navigate('how-to')} />
  )
}

export default App
