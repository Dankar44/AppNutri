import { CrearCuentaForm } from "./crear-cuenta-form";

export default function CrearCuentaPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Crear cuenta nutricionista</h1>
        <p className="text-muted-foreground mt-1">
          La cuenta se crea verificada y lista para usar
        </p>
      </div>
      <CrearCuentaForm />
    </div>
  );
}
