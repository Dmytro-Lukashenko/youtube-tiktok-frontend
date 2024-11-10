import {
  ApolloClient,
  InMemoryCache,
  NormalizedCacheObject,
  gql,
  Observable,
  ApolloLink,
  DefaultContext,
} from "@apollo/client";

import { onError } from "@apollo/client/link/error";
import createUploadLink from "apollo-upload-client/createUploadLink.mjs";

const refreshToken = async (client: ApolloClient<NormalizedCacheObject>) => {
  try {
    const { data } = await client.mutate({
      mutation: gql`
        mutation RefreshToken {
          accessToken
        }
      `,
    });

    const newAccessToken = data?.refreshToken;
    if (!newAccessToken) {
      throw new Error("New access token not received.");
    }
    localStorage.setItem("accesToken", newAccessToken);
    return `Bearer ${newAccessToken}`;
  } catch (error: unknown) {
    console.error(error);
    throw new Error("Error getting new access token.");
  }
};

let retryCount = 0;
const maxRetry = 3;

const errorLink = onError(({ graphQLErrors, operation, forward }) => {
  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      if (err.extensions) {
        if (
          err.extensions.code === "UNAUTHENTICATED" &&
          retryCount < maxRetry
        ) {
          retryCount++;
          return new Observable((observer) => {
            refreshToken(client)
              .then((token) => {
                operation.setContext(
                  (previousContext: Partial<DefaultContext>) => ({
                    headers: {
                      ...previousContext.headers,
                      authorization: token,
                    },
                  })
                );
                const forward$ = forward(operation);
                forward$.subscribe(observer);
              })
              .catch((error) => observer.error(error));
          });
        }
      }
    }
  }
});

const uploadLink = createUploadLink({
  uri: "http://localhost:3000/graphql",
  credentials: "include",
  headers: {
    "apollo-require-preflight": "true",
  },
});

export const client = new ApolloClient({
  uri: "http://loaclhost:3001/graphql",
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          getCommentsByPostId: {
            merge(existing, incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
  link: ApolloLink.from([errorLink, uploadLink as unknown as ApolloLink]),
});
