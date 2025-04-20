# Auth Context Implementation

This directory contains context providers for the application.

## AuthContext

The `AuthContext.jsx` file provides authentication state management for the entire application. It handles:

- Token validation
- User authentication status
- Login/logout functionality
- User profile information

### Usage

Wrap your application with the `AuthProvider` component:

```jsx
import { AuthProvider } from './context/AuthContext';

const App = () => {
  return (
    <AuthProvider>
      {/* Your app components */}
    </AuthProvider>
  );
};
```

Use the context in components:

```jsx
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';

const YourComponent = () => {
  const { isAuthenticated, user, login, logout } = useContext(AuthContext);
  
  return (
    <div>
      {isAuthenticated ? (
        <button onClick={logout}>Logout</button>
      ) : (
        <button onClick={() => navigate('/signin')}>Login</button>
      )}
    </div>
  );
};
```

## ThemeProvider

The `ThemeProvider.jsx` file manages the application's theme (light/dark mode). 