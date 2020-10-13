import React, { useState } from "react";

const Books = ({ show, books }) => {
  const [genre, setGenre] = useState(null);

  if (!show) {
    return null;
  }

  if (books.loading) {
    return <div>loading...</div>;
  }

  const genres = [];
  books.data.allBooks.forEach((a) => {
    a.genres.forEach((g) => {
      if (!genres.includes(g)) genres.push(g);
    });
  });

  return (
    <div>
      <h2>books</h2>
      {genre && (
        <p>
          in genre <b>{genre}</b>
        </p>
      )}

      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {genre
            ? books.data.allBooks
                .filter((a) => a.genres.includes(genre))
                .map((a) => (
                  <tr key={a.title}>
                    <td>{a.title}</td>
                    <td>{a.author.name}</td>
                    <td>{a.published}</td>
                  </tr>
                ))
            : books.data.allBooks.map((a) => (
                <tr key={a.title}>
                  <td>{a.title}</td>
                  <td>{a.author.name}</td>
                  <td>{a.published}</td>
                </tr>
              ))}
        </tbody>
      </table>
      {genres.map((g) => (
        <button key={g} onClick={() => setGenre(g)}>
          {g}
        </button>
      ))}
      <button onClick={() => setGenre()}>all genres</button>
    </div>
  );
};

export default Books;
