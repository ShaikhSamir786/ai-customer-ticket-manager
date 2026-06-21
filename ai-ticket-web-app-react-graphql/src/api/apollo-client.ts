import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

let accessToken = '';

export const setAccessToken = (token: string) => {
  accessToken = token;
  if (token) {
    localStorage.setItem('has_session', 'true');
  } else {
    localStorage.removeItem('has_session');
  }
};

export const getAccessToken = () => accessToken;

const httpLink = createHttpLink({
  uri: 'http://localhost:4000/graphql',
});

const authLink = setContext((_, { headers }) => {
  return {
    headers: {
      ...headers,
      authorization: accessToken ? `Bearer ${accessToken}` : '',
    },
  };
});

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          tickets: {
            // Simple pagination merge behavior
            merge(_existing, incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
});
