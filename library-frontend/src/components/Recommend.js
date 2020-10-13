import React from "react";

const Recommend = ({ show, books, currentUser }) => {
  if (!show) {
    return null;
  }

  if (books.loading || currentUser.loading) {
    return <div>loading...</div>;
  }

  const genre = currentUser.data.me.favoriteGenre[0];

  return (
    <div>
      <h2>books</h2>
      {genre && (
        <p>
          books in your favorite genre <b>{genre}</b>
        </p>
      )}

      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {books.data.allBooks
            .filter((a) => a.genres.includes(genre))
            .map((a) => (
              <tr key={a.title}>
                <td>{a.title}</td>
                <td>{a.author.name}</td>
                <td>{a.published}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default Recommend;
