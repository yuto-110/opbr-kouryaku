import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

import NotFound from '@/pages/not-found';
import HomePage from '@/pages/home';
import CharactersPage from '@/pages/characters';
import CharacterDetailPage from '@/pages/character-detail';
import MedalsPage from '@/pages/medals';
import MedalDetailPage from '@/pages/medal-detail';
import EventsPage from '@/pages/events';
import EventDetailPage from '@/pages/event-detail';
import SupportPage from '@/pages/support';
import MyPage from '@/pages/mypage';
import StrategyPage from '@/pages/strategy';
import RankingsPage from '@/pages/rankings';
import AdminCharactersPage from '@/pages/admin-characters';
import AdminCharacterTagsPage from '@/pages/admin-character-tags';
import AuthPage from '@/pages/auth';
import AdminPage from '@/pages/admin';

import { type ReactNode } from 'react';

import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route
          path="/"
          component={HomePage}
        />

        <Route
          path="/characters"
          component={CharactersPage}
        />

        <Route
          path="/characters/:id"
          component={CharacterDetailPage}
        />

        <Route
          path="/medals"
          component={MedalsPage}
        />

        <Route
          path="/medals/:id"
          component={MedalDetailPage}
        />

        <Route
          path="/events"
          component={EventsPage}
        />

        <Route
          path="/events/:id"
          component={EventDetailPage}
        />

        <Route
          path="/support"
          component={SupportPage}
        />

        <Route
          path="/strategy"
          component={StrategyPage}
        />

        <Route
          path="/rankings"
          component={RankingsPage}
        />

        <Route
          path="/mypage"
          component={MyPage}
        />

        <Route
          path="/auth"
          component={AuthPage}
        />

        <Route
          path="/admin"
          component={AdminPage}
        />

        <Route
          path="/admin/characters"
          component={AdminCharactersPage}
        />

        <Route
          path="/admin/character-tags"
          component={AdminCharacterTagsPage}
        />

        <Route
          path="/admin/character-icons"
          component={AdminCharacterIconsPage}
        />

        <Route component={NotFound} />

      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({
  children,
}: {
  children: ReactNode;
}) {
  const [location] = useLocation();

  return (
    <ErrorBoundary
      resetKey={location}
    >
      {children}
    </ErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider
      client={queryClient}
    >
      <TooltipProvider>
        <WouterRouter
          base={import.meta.env.BASE_URL.replace(
            /\/$/,
            '',
          )}
        >
          <Router />
        </WouterRouter>

        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;