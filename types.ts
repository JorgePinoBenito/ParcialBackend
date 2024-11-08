import { OptionalId, ObjectId } from "mongodb";

export type LibroModel = OptionalId<{
  titulo: string;
  autores: ObjectId[];
  copias: number;
}>;

export type AutorModel = OptionalId<{
  nombre: string;
  biografia: number;
}>;

export type Libro = {
  id: string;
  titulo: string;
  autores: Autor[];
  copias: number;
};

export type Autor = {
  id: string;
  nombre: string;
  biografia: number;
};
