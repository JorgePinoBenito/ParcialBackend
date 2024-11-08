import type { Collection } from "mongodb";
import type { AutorModel, Libro, LibroModel, Autor } from "./types.ts";

export const FromModelToBook = async (
  libro: LibroModel,
  autorCollection: Collection<AutorModel>
): Promise<Libro> => {
  const autores = await autorCollection
    .find({ _id: { $in: libro.autores } })
    .toArray();

  return {
    id: libro._id!.toString(),
    titulo: libro.titulo,
    autores: autores.map((a) => FromModelToAutor(a)),
    copias: libro.copias,
  };
};

export const FromModelToAutor = (autor: AutorModel): Autor => {
  return {
    id: autor._id!.toString(),
    nombre: autor.nombre,
    biografia: autor.biografia,
  };
};
