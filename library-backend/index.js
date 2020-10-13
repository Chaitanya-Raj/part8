const { ApolloServer, UserInputError, gql } = require("apollo-server");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const JWT_SECRET = "Bearer";

const mongoose = require("mongoose");
const Author = require("./models/author");
const Book = require("./models/book");
const User = require("./models/user");

const MONGODB_URI = process.env.MONGODB_URI;

console.log("connecting to", MONGODB_URI);

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  })
  .then(() => {
    console.log("connected to MongoDB");
  })
  .catch((error) => {
    console.log("error connection to MongoDB:", error.message);
  });

{
  // let authors = [
  //   {
  //     name: "Robert Martin",
  //     id: "afa51ab0-344d-11e9-a414-719c6709cf3e",
  //     born: 1952,
  //   },
  //   {
  //     name: "Martin Fowler",
  //     id: "afa5b6f0-344d-11e9-a414-719c6709cf3e",
  //     born: 1963,
  //   },
  //   {
  //     name: "Fyodor Dostoevsky",
  //     id: "afa5b6f1-344d-11e9-a414-719c6709cf3e",
  //     born: 1821,
  //   },
  //   {
  //     name: "Joshua Kerievsky", // birthyear not known
  //     id: "afa5b6f2-344d-11e9-a414-719c6709cf3e",
  //   },
  //   {
  //     name: "Sandi Metz", // birthyear not known
  //     id: "afa5b6f3-344d-11e9-a414-719c6709cf3e",
  //   },
  // ];
  // let books = [
  //   {
  //     title: "Clean Code",
  //     published: 2008,
  //     author: "Robert Martin",
  //     id: "afa5b6f4-344d-11e9-a414-719c6709cf3e",
  //     genres: ["refactoring"],
  //   },
  //   {
  //     title: "Agile software development",
  //     published: 2002,
  //     author: "Robert Martin",
  //     id: "afa5b6f5-344d-11e9-a414-719c6709cf3e",
  //     genres: ["agile", "patterns", "design"],
  //   },
  //   {
  //     title: "Refactoring, edition 2",
  //     published: 2018,
  //     author: "Martin Fowler",
  //     id: "afa5de00-344d-11e9-a414-719c6709cf3e",
  //     genres: ["refactoring"],
  //   },
  //   {
  //     title: "Refactoring to patterns",
  //     published: 2008,
  //     author: "Joshua Kerievsky",
  //     id: "afa5de01-344d-11e9-a414-719c6709cf3e",
  //     genres: ["refactoring", "patterns"],
  //   },
  //   {
  //     title: "Practical Object-Oriented Design, An Agile Primer Using Ruby",
  //     published: 2012,
  //     author: "Sandi Metz",
  //     id: "afa5de02-344d-11e9-a414-719c6709cf3e",
  //     genres: ["refactoring", "design"],
  //   },
  //   {
  //     title: "Crime and punishment",
  //     published: 1866,
  //     author: "Fyodor Dostoevsky",
  //     id: "afa5de03-344d-11e9-a414-719c6709cf3e",
  //     genres: ["classic", "crime"],
  //   },
  //   {
  //     title: "The Demon ",
  //     published: 1872,
  //     author: "Fyodor Dostoevsky",
  //     id: "afa5de04-344d-11e9-a414-719c6709cf3e",
  //     genres: ["classic", "revolution"],
  //   },
  // ];
}

const typeDefs = gql`
  type Book {
    title: String!
    published: Int!
    author: Author!
    genres: [String!]!
    id: ID!
  }

  type Author {
    name: String!
    born: Int
    bookCount: Int!
    id: ID!
  }

  type User {
    username: String!
    favoriteGenre: [String!]
    id: ID!
  }

  type Token {
    value: String!
  }

  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book!]!
    allAuthors: [Author!]!
    me: User
  }

  type Mutation {
    addBook(
      title: String!
      author: String!
      published: Int!
      genres: [String]
    ): Book
    editAuthor(name: String!, setBornTo: Int!): Author
    createUser(username: String!, favoriteGenre: String!): User
    login(username: String!, password: String!): Token
  }

  type Subscription {
    bookAdded: Book!
  }
`;

const { PubSub } = require("apollo-server");
const pubsub = new PubSub();

const resolvers = {
  Book: {
    author: (root) => {
      const author = Author.findOne({ name: root.author });
      // console.log(author._conditions.name);
      return author._conditions.name;
    },
  },
  Author: {
    bookCount: (root) => Book.collection.countDocuments({ author: root._id }),
  },
  Query: {
    bookCount: () => Book.collection.countDocuments(),
    authorCount: () => Author.collection.countDocuments(),
    allBooks: async (root, args) => {
      if (args.genre && args.author) {
        const author = await Author.findOne({ name: args.author });
        return Book.find({
          author: author._id,
          genres: { $in: [args.genre] },
        }).populate("author");
      } else if (args.author) {
        const author = await Author.findOne({ name: args.author });
        return Book.find({ author: author._id }).populate("author");
      } else if (args.genre)
        return Book.find({
          genres: { $in: [args.genre] },
        }).populate("author");
      else return await Book.find({}).populate("author");
    },
    allAuthors: () => Author.find({}),
    me: (root, args, { currentUser }) => {
      return currentUser;
    },
  },
  Mutation: {
    addBook: async (root, args, { currentUser }) => {
      let author = await Author.findOne({ name: args.author });

      if (!currentUser) {
        throw new Error("not authenticated");
      }

      let sbook;

      try {
        if (!author) author = await new Author({ name: args.author }).save();
        const book = new Book({ ...args, author: author._id });
        sbook = await book.save();
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        });
      }
      sbook = sbook._doc;
      sbook = { ...sbook, author };

      pubsub.publish("BOOK_ADDED", { bookAdded: sbook });

      return sbook;
    },
    editAuthor: async (root, args, { currentUser }) => {
      const author = await Author.findOne({ name: args.name });

      if (!currentUser) {
        throw new Error("not authenticated");
      }

      author.born = args.setBornTo;
      try {
        return author.save();
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        });
      }
    },
    createUser: (root, args) => {
      const user = new User({
        username: args.username,
        favoriteGenre: args.favoriteGenre,
      });

      return user.save().catch((error) => {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        });
      });
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username });

      if (!user || args.password !== "lmao") {
        throw new UserInputError("wrong credentials");
      }

      const userForToken = {
        username: user.username,
        id: user._id,
      };

      return { value: jwt.sign(userForToken, JWT_SECRET) };
    },
  },
  Subscription: {
    bookAdded: { subscribe: () => pubsub.asyncIterator(["BOOK_ADDED"]) },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null;
    if (auth && auth.toLowerCase().startsWith("bearer ")) {
      const decodedToken = jwt.verify(auth.substring(7), JWT_SECRET);
      const currentUser = await User.findById(decodedToken.id);
      return { currentUser };
    }
  },
});

server.listen().then(({ url, subscriptionsUrl }) => {
  console.log(`Server ready at ${url}`);
  console.log(`Subscriptions ready at ${subscriptionsUrl}`);
});
