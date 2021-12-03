//**************************************************
// DATABASE SCHEMA GENERATION & DATA IMPORTS
//**************************************************
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import recipes from "./recipes.js";

// Handle for sqlite recipe database used in GRAPHQL
let db;

(async function () {
  db = await open({
    filename: "./recipes.db",
    driver: sqlite3.Database,
  });

  // Dropping table for reset every run
  await db.exec(`DROP TABLE IF EXISTS recipe`);
  await db.exec(`DROP TABLE IF EXISTS cookingstep`);
  await db.exec(`DROP TABLE IF EXISTS spice`);
  await db.exec(`DROP TABLE IF EXISTS ingredient`);

  // TODO: Complete table generation logic for table 'recipe'

  await db.exec(`CREATE TABLE recipe (
    id varchar(255) NOT NULL,
    cookingTime INTEGER,
    description varchar(1000),
    kcal INTEGER,
    name varchar(36),
    picture varchar(500),
    servings INTERGER,
    category varchar(40),
    PRIMARY KEY (id)

  )`);
  await db.exec(`CREATE TABLE cookingstep (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id varchar(36) NOT NULL,
    cookingsteps varchar(2000) NOT NULL,
    FOREIGN KEY (recipe_id) REFERENCES recipe(id) ON DELETE CASCADE

  )`);
  await db.exec(
    `CREATE TABLE spice (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id varchar(36) NOT NULL,
      spices varchar(255) NOT NULL,
      FOREIGN KEY (recipe_id) REFERENCES recipe(id) ON DELETE CASCADE
      )`
  );
  await db.exec(`CREATE TABLE ingredient(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id varchar(36) NOT NULL,
    ingredients varchar(255) NOT NULL,
    FOREIGN KEY (recipe_id) REFERENCES recipe(id) ON DELETE CASCADE
  )`);

  // TODO: Complete data import logic

  for (const recipe of recipes) {
    for (const key in recipe) {
      if (key === "cookingSteps") {
        await db.exec(
          `INSERT INTO cookingstep(recipe_id,cookingsteps)  VALUES ("${recipe.id}","${recipe[key]}")`
        );
      } else if (key === "spices") {
        await db.exec(
          `INSERT INTO spice(recipe_id,spices)  VALUES ("${recipe.id}","${recipe[key]}")`
        );
      } else if (key === "ingredients") {
        await db.exec(
          `INSERT INTO ingredient(recipe_id,ingredients)  VALUES ("${recipe.id}","${recipe[key]}")`
        );
      }
    }

    await db.exec(
      `INSERT INTO recipe(id,cookingTime,description,kcal,name,picture,servings,category) VALUES("${recipe.id}",${recipe.cookingTime},"${recipe.description}",${recipe.kcal},"${recipe.name}","${recipe.picture}",${recipe.servings},"${recipe.category}")`
    );
  }
  await db.run(`PRAGMA foreign_keys = ON`);
})();

const recipesAll = async (category) => {
  db = await open({
    filename: "./recipes.db",
    driver: sqlite3.Database,
  });
  return category
    ? await db.all(
        `SELECT * FROM recipe
    INNER JOIN cookingstep ON recipe.id=cookingstep.recipe_id
    INNER JOIN spice ON cookingstep.recipe_id=spice.recipe_id
    INNER JOIN ingredient ON spice.recipe_id=ingredient.recipe_id where recipe.category ="${category}"`
      )
    : await db.all(
        `SELECT * FROM recipe
    INNER JOIN cookingstep ON recipe.id=cookingstep.recipe_id
    INNER JOIN spice ON cookingstep.recipe_id=spice.recipe_id
    INNER JOIN ingredient ON spice.recipe_id=ingredient.recipe_id`
      );
};
const recipeById = async (id) => {
  db = await open({
    filename: "./recipes.db",
    driver: sqlite3.Database,
  });
  return await db.get(
    `SELECT * FROM recipe
    INNER JOIN cookingstep ON recipe.id=cookingstep.recipe_id
    INNER JOIN spice ON cookingstep.recipe_id=spice.recipe_id
    INNER JOIN ingredient ON spice.recipe_id=ingredient.recipe_id where recipe.id="${id}"`
  );
};

const deleteAllRecipe = async (id) => {
  console.log("donme?");
  db = await open({
    filename: "./recipes.db",
    driver: sqlite3.Database,
  });
  await db.run(`DELETE FROM recipe WHERE id ="${id}"`);
  await db.run(`DELETE FROM cookingstep WHERE recipe_id ="${id}"`);
  await db.run(`DELETE FROM spice WHERE recipe_id ="${id}"`);
  await db.run(`DELETE FROM ingredient WHERE recipe_id ="${id}"`);
};

const addRecipe = async (recipe) => {
  if (Object.keys(recipe).length !== 11) return "error";
  try {
    db = await open({
      filename: "./recipes.db",
      driver: sqlite3.Database,
    });

    for (const key in recipe) {
      if (key === "cookingsteps") {
        await db.exec(
          `INSERT INTO cookingstep(recipe_id,cookingsteps)  VALUES ("${recipe.id}","${recipe[key]}")`
        );
      } else if (key === "spices") {
        await db.exec(
          `INSERT INTO spice(recipe_id,spices)  VALUES ("${recipe.id}","${recipe[key]}")`
        );
      } else if (key === "ingredients") {
        await db.exec(
          `INSERT INTO ingredient(recipe_id,ingredients)  VALUES ("${recipe.id}","${recipe[key]}")`
        );
      }
    }
    await db.exec(
      `INSERT INTO recipe(id,cookingTime,description,kcal,name,picture,servings,category) VALUES("${recipe.id}",${recipe.cookingTime},"${recipe.description}",${recipe.kcal},"${recipe.name}","${recipe.picture}",${recipe.servings},"${recipe.category}")`
    );
  } catch (err) {
    return err;
  }
};

const modifyRecipe = async (data) => {
  db = await open({
    filename: "./recipes.db",
    driver: sqlite3.Database,
  });

  if (!(await recipeById(data.recipe_id))) return "error";
  let valueData = "";
  let tmp = "";
  for (let key in data) {
    if (key === "cookingsteps")
      await db.run(
        `UPDATE cookingstep SET cookingsteps = "${data[key]}" WHERE recipe_id="${data.recipe_id}"`
      );
    else if (key === "spices")
      await db.run(
        `UPDATE spice SET spices ="${data[key]}" WHERE recipe_id="${data.recipe_id}"`
      );
    else if (key === "ingredients")
      await db.run(
        `UPDATE ingredient SET ingredients ="${data[key]}" WHERE recipe_id="${data.recipe_id}"`
      );
    else if (key !== "recipe_id") {
      if (typeof data[key] === "string") {
        valueData = `"${data[key]}"`;
      } else {
        valueData = `${data[key]}`;
      }
      tmp += `${key} = ${valueData},`;
    }
  }
  tmp = tmp.substr(0, tmp.length - 1);

  await db.run(`UPDATE recipe SET ${tmp} WHERE id="${data.recipe_id}"`);
};

//**************************************************
// GRAPHQL SERVER IMPLEMENTATION
//**************************************************
import { ApolloServer, gql } from "apollo-server";

// 부분 삭제 , 부분 수정 ?

const typeDefs = gql`
  type Query {
    recipes(category: String): [Recipe]
    recipe(id: String): Recipe
  }

  type Mutation {
    addRecipe(
      id: String
      recipe_id: String
      cookingTime: Int
      description: String
      kcal: Int
      name: String
      picture: String
      servings: Int
      category: String
      cookingsteps: String
      spices: String
      ingredients: String
    ): Recipe
    modifyRecipe(
      recipe_id: String
      cookingTime: Int
      description: String
      kcal: Int
      name: String
      picture: String
      servings: Int
      category: String
      cookingsteps: String
      spices: String
      ingredients: String
    ): Recipe
    deleteOfPartRecipe(
      recipe_id: String
      cookingTime: Int
      description: String
      kcal: Int
      name: String
      picture: String
      servings: Int
      category: String
      cookingsteps: String
      spices: String
      ingredients: String
    ): Recipe
    deleteAllRecipe(id: String): Recipe
  }

  type Recipe {
    id: String
    recipe_id: String
    cookingTime: Int
    description: String
    kcal: Int
    name: String
    picture: String
    servings: Int
    category: String
    cookingsteps: String
    spices: String
    ingredients: String
  }

  # TODO: Step 7 - Add RecipeInput input
`;

const resolvers = {
  // TODO: Step 4 - Implement Recipe resolver if necessary

  Query: {
    recipes: async (parent, args, context, info) =>
      await recipesAll(args.category).then((recipes) =>
        recipes.sort((a, b) => {
          let x = a.name.toLowerCase();
          let y = b.name.toLowerCase();
          if (x < y) return -1;
          if (x > y) return 1;
          return 0;
        })
      ),
    // recipe: async (parent, args, context, info) =>
    //   await recipesAll().then(
    //     (recipes) => recipes.filter((recipe) => recipe.recipe_id === args.id)[0]
    //   ),
    recipe: async (parent, args, context, info) => await recipeById(args.id),
    // TODO: Step 6 - Implement recipes resolver
    // TODO: Step 5 - Implement recipeById resolver
  },

  Mutation: {
    addRecipe: async (parent, args, context, info) => {
      await addRecipe(args);
      return args;
    },
    modifyRecipe: async (parent, args, context, info) => {
      return (await modifyRecipe(args)) !== "error" ? args : "error";
    },
    deleteAllRecipe: async (parent, args, context, info) => {
      deleteAllRecipe(args.id);
      return args;
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });
server
  .listen()
  .then(({ url }) => console.log("Apollo GraphQL Server ready at", url));
