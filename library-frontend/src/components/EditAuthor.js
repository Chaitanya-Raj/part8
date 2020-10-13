import React, { useState } from "react";
import Select from "react-select";

const EditAuthor = ({ show, authors, updateAuthor, handleError }) => {
  const [name, setName] = useState(null);
  const [born, setBorn] = useState("");

  if (!show) {
    return null;
  }

  if (authors.loading) {
    return <div>loading...</div>;
  }

  const options = authors.data.allAuthors.map((author) => {
    return { value: author.name, label: author.name };
  });

  const submit = async (event) => {
    event.preventDefault();
    if (name && born !== "") {
      try {
        await updateAuthor({
          variables: { name: name.value, setBornTo: born },
        });
        setName(null);
        setBorn("");
      } catch (error) {
        handleError(error);
      }
    } else {
      handleError({ message: "No fields should be empty" });
    }
  };

  return (
    <div className="add-birth">
      <h2>set birthyear</h2>
      <form onSubmit={submit}>
        <div>
          name
          <Select defaultValue={name} onChange={setName} options={options} />
        </div>
        <div>
          born
          <input
            type="number"
            value={born}
            onChange={({ target }) => setBorn(+target.value)}
          />
        </div>
        <button type="submit">update author</button>
      </form>
    </div>
  );
};

export default EditAuthor;
