import React from "react";
import EditAuthor from "./EditAuthor";

const Authors = ({ show, token, authors, updateAuthor, handleError }) => {
  if (!show) {
    return null;
  }

  if (authors.loading) {
    return <div>loading...</div>;
  }

  return (
    <>
      <div>
        <h2>authors</h2>
        <table>
          <tbody>
            <tr>
              <th></th>
              <th>born</th>
              <th>books</th>
            </tr>
            {authors.data.allAuthors.map((a) => (
              <tr key={a.name}>
                <td>{a.name}</td>
                <td>{a.born}</td>
                <td>{a.bookCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <br />
      <EditAuthor
        show={token}
        authors={authors}
        updateAuthor={updateAuthor}
        handleError={handleError}
      />
    </>
  );
};

export default Authors;
