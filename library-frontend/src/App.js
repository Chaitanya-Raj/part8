import React, { useState } from "react";
import {
  useQuery,
  useMutation,
  useApolloClient,
  useSubscription,
} from "@apollo/client";
import Authors from "./components/Authors";
import Books from "./components/Books";
import NewBook from "./components/NewBook";
import LoginForm from "./components/LoginForm";
import Recommend from "./components/Recommend";
import {
  ALL_AUTHORS,
  ALL_BOOKS,
  EDIT_AUTHOR,
  CREATE_BOOK,
  LOGIN,
  ME,
  BOOK_ADDED,
} from "./queries";

const App = () => {
  const [page, setPage] = useState("authors");
  const [errorMessage, setErrorMessage] = useState(null);
  const [token, setToken] = useState(null);
  const authors = useQuery(ALL_AUTHORS);
  const books = useQuery(ALL_BOOKS);
  const currentUser = useQuery(ME);
  const client = useApolloClient();

  const handleError = (error) => {
    setErrorMessage(
      error.graphQLErrors ? error.graphQLErrors[0].message : error.message
    );
    setTimeout(() => {
      setErrorMessage(null);
    }, 10000);
  };

  const [updateAuthor] = useMutation(EDIT_AUTHOR, {
    onError: handleError,
    refetchQueries: [
      {
        query: ALL_AUTHORS,
      },
      {
        query: ALL_BOOKS,
      },
    ],
  });

  const [createBook] = useMutation(CREATE_BOOK, {
    onError: handleError,
    refetchQueries: [
      {
        query: ALL_AUTHORS,
      },
      {
        query: ALL_BOOKS,
      },
    ],
    update: (store, response) => {
      updateCacheWith(response.data.addBook);
    },
  });

  const [login, result] = useMutation(LOGIN, {
    onError: handleError,
    refetchQueries: [
      {
        query: ME,
      },
    ],
  });

  const updateCacheWith = (addedBook) => {
    const dataInStore = client.readQuery({ query: ALL_BOOKS });
    client.writeQuery({
      query: ALL_BOOKS,
      data: { allBooks: dataInStore.allBooks.concat(addedBook) },
    });
  };

  useSubscription(BOOK_ADDED, {
    onSubscriptionData: ({ subscriptionData }) => {
      const addedBook = subscriptionData.data.bookAdded;
      setErrorMessage(`${addedBook.title} added`);
      updateCacheWith(addedBook);
    },
  });

  const logout = () => {
    setToken(null);
    localStorage.clear();
    client.resetStore();
    setPage("login");
  };

  return (
    <div>
      {errorMessage && <div style={{ color: "red" }}>{errorMessage}</div>}
      <div>
        <button onClick={() => setPage("authors")}>authors</button>
        <button onClick={() => setPage("books")}>books</button>
        {!token ? (
          <button onClick={() => setPage("login")}>login</button>
        ) : (
          <>
            <button onClick={() => setPage("add")}>add book</button>
            <button onClick={() => setPage("recommend")}>recommend</button>
            <button onClick={() => logout()}>logout</button>
          </>
        )}
      </div>

      <Authors
        show={page === "authors"}
        token={token}
        authors={authors}
        updateAuthor={updateAuthor}
        handleError={handleError}
      />

      <Books show={page === "books"} books={books} />

      <NewBook
        show={page === "add"}
        createBook={createBook}
        handleError={handleError}
      />

      <Recommend
        show={page === "recommend"}
        books={books}
        currentUser={currentUser}
      />

      <LoginForm
        show={page === "login"}
        setPage={setPage}
        setToken={setToken}
        login={login}
        result={result}
      />
    </div>
  );
};

export default App;
