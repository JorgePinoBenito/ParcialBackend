import { MongoClient, ObjectId } from "mongodb";
import { LibroModel, type AutorModel } from "./types.ts";
import { FromModelToBook, FromModelToAutor } from "./utils.ts";

const MONGO_URL = Deno.env.get("MONGO_URL");
if (!MONGO_URL) {
  console.log("MONGO_URL is not set");
  Deno.exit(1);
}

const client = new MongoClient(MONGO_URL);
await client.connect();
console.log("Connected successfully to server");

const dbName = "biblioteca";
const db = client.db(dbName);

const LibrosCollection = db.collection<LibroModel>("libros");
const AutoresCollection = db.collection<AutorModel>("autores");

export const handler = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;
  if (method === "GET") {
    if (path === "/libros") {
      const titulo = url.searchParams.get("titulo");
      if (titulo) {
        const librosBD = await LibrosCollection.find({ titulo }).toArray();
        if (!librosBD) {
          return new Response("No se encontraron libros con ese título.", {
            status: 404,
          });
        }
        const libros = await Promise.all(
          librosBD.map((l) => FromModelToBook(l, AutoresCollection))
        );
        return new Response(JSON.stringify(libros), { status: 200 });
      }
      const librosBD = await LibrosCollection.find({}).toArray();
      const libros = await Promise.all(
        librosBD.map((l) => FromModelToBook(l, AutoresCollection))
      );
      return new Response(JSON.stringify(libros), { status: 200 });
    } else if (path === "/libro") {
      const id = url.searchParams.get("id");
      if (!id) {
        return new Response("Introduce id");
      }
      const librosBD = await LibrosCollection.findOne({
        _id: new ObjectId(id),
      });

      if (!librosBD) {
        return new Response("Libro no encontrado.", {
          status: 404,
        });
      }

      const libro = await FromModelToBook(librosBD, AutoresCollection);
      return new Response(JSON.stringify(libro), { status: 200 });
    }
  } else if (method === "POST") {
    if (path === "/libro") {
      const libro = await req.json();
      if (!libro.titulo || !libro.autores || !libro.copias) {
        return new Response("El título y los autores son campos requeridos.", {
          status: 400,
        });
      }
      const autores = await AutoresCollection.find({
        _id: { $in: libro.autores },
      }).toArray();
      if (!autores) {
        return new Response("Autor no existe.", {
          status: 400,
        });
      }

      const { insertedId } = await LibrosCollection.insertOne({
        titulo: libro.titulo,
        autores: libro.autores,
        copias: libro.copias,
      });

      return new Response(
        JSON.stringify({
          id: insertedId,
          titulo: libro.titulo,
          autores: libro.autores,
          copias: libro.copias,
        }),
        { status: 201 }
      );
    } else if (path === "/autor") {
      const autor = await req.json();
      if (!autor.nombre || !autor.biografia) {
        return new Response(
          "El nombre del autor y la biografía son campos requeridos.",
          {
            status: 400,
          }
        );
      }

      const { insertedId } = await AutoresCollection.insertOne({
        nombre: autor.nombre,
        biografia: autor.biografia,
      });

      return new Response(
        JSON.stringify({
          id: insertedId,
          nombre: autor.nombre,
          biografia: autor.biografia,
        }),
        { status: 201 }
      );
    }
  } else if (method === "PUT") {
    if (path === "/libro") {
      const libro = await req.json();
      if (!libro.titulo || !libro.autores || !libro.copias || !libro.id) {
        return new Response("El título y los autores son campos requeridos.", {
          status: 400,
        });
      }

      const autores = await AutoresCollection.find({
        _id: { $in: libro.autores },
      }).toArray();
      if (!autores) {
        return new Response("Autor no existe.", {
          status: 400,
        });
      }

      const librosBD = await LibrosCollection.findOne({
        _id: new ObjectId(libro.id as string),
      });

      if (!librosBD) {
        return new Response("El ID del libro no existe.", {
          status: 404,
        });
      }

      const { modifiedCount } = await LibrosCollection.updateOne(
        { _id: new ObjectId(libro.id as string) },
        {
          $set: {
            titulo: libro.titulo,
            autores: libro.autores,
            copias: libro.copias,
          },
        }
      );

      if (modifiedCount === 0) {
        return new Response("Libro no actualizado.", {
          status: 404,
        });
      }

      return new Response(
        JSON.stringify({
          id: libro.id,
          titulo: libro.titulo,
          autor: libro.autores,
          copias: libro.copias,
        }),
        { status: 200 }
      );
    }
  } else if (method === "DELETE") {
    if (path === "/libro") {
      const id = await req.json();
      if (!id) {
        return new Response("Introduce id");
      }
      const { deletedCount } = await LibrosCollection.deleteOne({
        _id: new ObjectId(id as string),
      });

      if (deletedCount === 0) {
        return new Response("Libro no encontrado.", {
          status: 404,
        });
      }

      return new Response("Libro eliminado exitosamente.", {
        status: 200,
      });
    }
  }
  return new Response("Endpoint not found", { status: 404 });
};

Deno.serve({ port: 3000 }, handler);
