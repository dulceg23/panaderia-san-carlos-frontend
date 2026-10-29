/* =========================================================
   RECETAS.JS
========================================================= */

const obtener = id => document.getElementById(id);

let recetas = [];
let productosFinales = [];
let insumos = [];

let modalReceta;
let modalIngrediente;
let modalEditarIngrediente;


/* =========================================================
   INICIO
========================================================= */

document.addEventListener("DOMContentLoaded", iniciar);

async function iniciar() {

    modalReceta =
        new bootstrap.Modal(
            obtener("modalReceta")
        );

    modalIngrediente =
        new bootstrap.Modal(
            obtener("modalIngrediente")
        );

    modalEditarIngrediente =
        new bootstrap.Modal(
            obtener("modalEditarIngrediente")
        );

    obtener("buscarReceta")
        .addEventListener(
            "input",
            aplicarBusqueda
        );

    try {

        const productos =
            await apiGet("/productos");

        productosFinales =
            productos.filter(
                p =>
                    Number(p.idTipoProducto) === 1 &&
                    Number(p.estado) === 1
            );

        insumos =
            productos.filter(
                p =>
                    Number(p.idTipoProducto) === 2 &&
                    Number(p.estado) === 1
            );

        llenarInsumos();

        await cargarRecetas();

    }
    catch (error) {

        mostrarMensaje(
            error.message,
            "danger"
        );
    }
}


/* =========================================================
   CARGAR RECETAS
========================================================= */

async function cargarRecetas() {

    recetas =
        await apiGet("/recetas");

    mostrarRecetas(recetas);

    llenarProductosSinReceta();
}


/* =========================================================
   PRODUCTOS FINALES SIN RECETA
========================================================= */

function llenarProductosSinReceta() {

    const select =
        obtener("productoFinal");

    const idsConReceta =
        recetas.map(
            r => Number(r.idProductoFinal)
        );

    const disponibles =
        productosFinales.filter(
            p =>
                !idsConReceta.includes(
                    Number(p.idProducto)
                )
        );

    select.innerHTML =
        '<option value="">Seleccione...</option>';

    disponibles.forEach(p => {

        select.innerHTML += `
            <option value="${p.idProducto}">
                ${p.nombre}
            </option>
        `;
    });

    if (disponibles.length === 0) {

        select.innerHTML += `
            <option disabled>
                Todos los productos finales ya tienen receta
            </option>
        `;
    }
}


/* =========================================================
   INSUMOS
========================================================= */

function llenarInsumos() {

    const select =
        obtener("insumoIngrediente");

    select.innerHTML =
        '<option value="">Seleccione...</option>';

    insumos.forEach(i => {

        select.innerHTML += `
            <option value="${i.idProducto}">
                ${i.nombre} - ${i.unidadMedida}
            </option>
        `;
    });
}


/* =========================================================
   MOSTRAR RECETAS
========================================================= */

function mostrarRecetas(lista) {

    const contenedor =
        obtener("contenedorRecetas");

    if (lista.length === 0) {

        contenedor.innerHTML = `
            <div class="card">
                <div class="card-body text-center text-muted">
                    No se encontraron recetas.
                </div>
            </div>
        `;

        return;
    }

    contenedor.innerHTML =
        lista
            .map(crearTarjetaReceta)
            .join("");
}


/* =========================================================
   CREAR TARJETA
========================================================= */

function crearTarjetaReceta(receta) {

    const activa =
        Number(receta.estado) === 1;

    return `
        <div class="card mb-4">

            <div class="card-header bg-white">

                <div class="
                    d-flex
                    justify-content-between
                    align-items-center
                    flex-wrap
                    gap-2">

                    <div>

                        <h5 class="mb-1">
                            ${receta.productoFinal}
                        </h5>

                        <small class="text-muted">
                            Receta #${receta.idReceta}
                        </small>

                    </div>

                    <span class="badge
                        ${activa
                            ? "bg-success"
                            : "bg-secondary"}">

                        ${activa
                            ? "Activa"
                            : "Inactiva"}

                    </span>

                </div>

            </div>


            <div class="card-body">

                <p>
                    <strong>
                        Descripción:
                    </strong>

                    ${receta.descripcion || "Sin descripción"}
                </p>


                <div class="
                    d-flex
                    gap-2
                    flex-wrap
                    mb-3">

                    <button
                        class="
                            btn
                            btn-sm
                            btn-panaderia"

                        onclick="abrirIngrediente(
                            ${receta.idReceta}
                        )"

                        ${activa ? "" : "disabled"}>

                        + Agregar ingrediente

                    </button>


                    <button
                        class="
                            btn
                            btn-sm
                            ${activa
                                ? "btn-outline-danger"
                                : "btn-outline-success"}"

                        onclick="cambiarEstadoReceta(
                            ${receta.idReceta},
                            ${receta.estado}
                        )">

                        ${activa
                            ? "Desactivar receta"
                            : "Activar receta"}

                    </button>

                </div>


                <h6>
                    Ingredientes
                </h6>


                <div class="table-responsive">

                    <table class="
                        table
                        table-sm
                        table-hover
                        align-middle">

                        <thead>

                            <tr>
                                <th>Insumo</th>
                                <th>Cantidad</th>
                                <th>Unidad</th>

                                <th class="text-end">
                                    Acciones
                                </th>
                            </tr>

                        </thead>

                        <tbody>

                            ${crearFilasIngredientes(
                                receta,
                                activa
                            )}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>
    `;
}


/* =========================================================
   FILAS DE INGREDIENTES
========================================================= */

function crearFilasIngredientes(
    receta,
    activa
) {

    if (
        !receta.ingredientes ||
        receta.ingredientes.length === 0
    ) {

        return `
            <tr>
                <td
                    colspan="4"
                    class="text-center text-muted">

                    Esta receta todavía no tiene
                    ingredientes registrados.

                </td>
            </tr>
        `;
    }

    return receta.ingredientes
        .map(i => `

            <tr>

                <td>
                    <strong>
                        ${i.nombreInsumo}
                    </strong>
                </td>

                <td>
                    ${formatearNumero(i.cantidad)}
                </td>

                <td>
                    ${i.unidadMedida}
                </td>

                <td class="text-end">

                    <button
                        class="
                            btn
                            btn-sm
                            btn-outline-primary
                            me-1"

                        onclick="abrirEditarIngrediente(
                            ${receta.idReceta},
                            ${i.idInsumo}
                        )"

                        ${activa ? "" : "disabled"}>

                        Editar

                    </button>


                    <button
                        class="
                            btn
                            btn-sm
                            btn-outline-danger"

                        onclick="eliminarIngrediente(
                            ${receta.idReceta},
                            ${i.idInsumo}
                        )"

                        ${activa ? "" : "disabled"}>

                        Eliminar

                    </button>

                </td>

            </tr>

        `)
        .join("");
}


/* =========================================================
   NUEVA RECETA
========================================================= */

function abrirNuevaReceta() {

    llenarProductosSinReceta();

    obtener("productoFinal").value = "";

    obtener("descripcionReceta").value = "";

    modalReceta.show();
}


async function guardarReceta() {

    const idProductoFinal =
        Number(
            obtener("productoFinal").value
        );

    const descripcion =
        obtener("descripcionReceta")
            .value
            .trim();

    if (idProductoFinal <= 0) {

        return mostrarMensaje(
            "Debe seleccionar un producto final sin receta.",
            "warning"
        );
    }

    if (descripcion === "") {

        return mostrarMensaje(
            "Debe ingresar una descripción.",
            "warning"
        );
    }

    await ejecutarOperacion(

        () =>
            apiPost(
                "/recetas",
                {
                    idProductoFinal,
                    descripcion
                }
            ),

        "Receta creada correctamente.",

        modalReceta
    );
}


/* =========================================================
   AGREGAR INGREDIENTE
========================================================= */

function abrirIngrediente(
    idReceta
) {

    obtener(
        "idRecetaIngrediente"
    ).value =
        idReceta;

    obtener(
        "insumoIngrediente"
    ).value = "";

    obtener(
        "cantidadIngrediente"
    ).value = "";

    modalIngrediente.show();
}


async function guardarIngrediente() {

    const idReceta =
        Number(
            obtener(
                "idRecetaIngrediente"
            ).value
        );

    const idInsumo =
        Number(
            obtener(
                "insumoIngrediente"
            ).value
        );

    const cantidad =
        Number(
            obtener(
                "cantidadIngrediente"
            ).value
        );

    if (idInsumo <= 0) {

        return mostrarMensaje(
            "Debe seleccionar un insumo.",
            "warning"
        );
    }

    if (
        isNaN(cantidad) ||
        cantidad <= 0
    ) {

        return mostrarMensaje(
            "La cantidad debe ser mayor que cero.",
            "warning"
        );
    }

    await ejecutarOperacion(

        () =>
            apiPost(
                `/recetas/${idReceta}/ingredientes`,
                {
                    idInsumo,
                    cantidad
                }
            ),

        "Ingrediente agregado correctamente.",

        modalIngrediente
    );
}


/* =========================================================
   EDITAR INGREDIENTE
========================================================= */

function abrirEditarIngrediente(
    idReceta,
    idInsumo
) {

    const receta =
        recetas.find(
            r =>
                Number(r.idReceta) ===
                Number(idReceta)
        );

    if (!receta) {
        return;
    }

    const ingrediente =
        receta.ingredientes.find(
            i =>
                Number(i.idInsumo) ===
                Number(idInsumo)
        );

    if (!ingrediente) {
        return;
    }

    obtener(
        "idRecetaEditar"
    ).value =
        idReceta;

    obtener(
        "idInsumoEditar"
    ).value =
        idInsumo;

    obtener(
        "nombreIngredienteEditar"
    ).textContent =
        ingrediente.nombreInsumo;

    obtener(
        "cantidadIngredienteEditar"
    ).value =
        ingrediente.cantidad;

    modalEditarIngrediente.show();
}


async function actualizarIngrediente() {

    const idReceta =
        Number(
            obtener(
                "idRecetaEditar"
            ).value
        );

    const idInsumo =
        Number(
            obtener(
                "idInsumoEditar"
            ).value
        );

    const cantidad =
        Number(
            obtener(
                "cantidadIngredienteEditar"
            ).value
        );

    if (
        isNaN(cantidad) ||
        cantidad <= 0
    ) {

        return mostrarMensaje(
            "La cantidad debe ser mayor que cero.",
            "warning"
        );
    }

    await ejecutarOperacion(

        () =>
            apiPut(
                `/recetas/${idReceta}/ingredientes/${idInsumo}`,
                {
                    cantidad
                }
            ),

        "Cantidad actualizada correctamente.",

        modalEditarIngrediente
    );
}


/* =========================================================
   ELIMINAR INGREDIENTE
========================================================= */

async function eliminarIngrediente(
    idReceta,
    idInsumo
) {

    const receta =
        recetas.find(
            r =>
                Number(r.idReceta) ===
                Number(idReceta)
        );

    let ingrediente = null;

    if (receta && receta.ingredientes) {

        ingrediente =
            receta.ingredientes.find(
                i =>
                    Number(i.idInsumo) ===
                    Number(idInsumo)
            );
    }

    const nombre =
        ingrediente
            ? ingrediente.nombreInsumo
            : "este ingrediente";

    const confirmar =
        confirm(
            `¿Está seguro de eliminar ${nombre} de la receta?`
        );

    if (!confirmar) {
        return;
    }

    await ejecutarOperacion(

        () =>
            apiDelete(
                `/recetas/${idReceta}/ingredientes/${idInsumo}`
            ),

        "Ingrediente eliminado correctamente."
    );
}


/* =========================================================
   ACTIVAR / DESACTIVAR RECETA
========================================================= */

async function cambiarEstadoReceta(
    idReceta,
    estadoActual
) {

    const nuevoEstado =
        Number(estadoActual) === 1
            ? 0
            : 1;

    const accion =
        nuevoEstado === 1
            ? "activar"
            : "desactivar";

    const confirmar =
        confirm(
            `¿Está seguro de ${accion} esta receta?`
        );

    if (!confirmar) {
        return;
    }

    await ejecutarOperacion(

        () =>
            apiPut(
                `/recetas/${idReceta}/estado/${nuevoEstado}`
            ),

        "Estado actualizado correctamente."
    );
}


/* =========================================================
   EJECUTAR OPERACIÓN
   CONSERVA LA POSICIÓN DEL SCROLL
========================================================= */

async function ejecutarOperacion(
    operacion,
    mensaje,
    modal = null
) {

    const posicionActual =
        window.scrollY;

    try {

        const resultado =
            await operacion();

        if (modal) {
            modal.hide();
        }

        await cargarRecetas();

        /*
         * Después de volver a dibujar las recetas,
         * regresamos al mismo punto de la página.
         */
        requestAnimationFrame(
            () => {

                window.scrollTo(
                    0,
                    posicionActual
                );
            }
        );

        mostrarMensaje(
            resultado.mensaje ||
            mensaje,
            "success"
        );

    }
    catch (error) {

        mostrarMensaje(
            error.message,
            "danger"
        );
    }
}


/* =========================================================
   BUSCADOR
========================================================= */

function aplicarBusqueda() {

    const texto =
        obtener("buscarReceta")
            .value
            .trim()
            .toUpperCase();

    const resultado =
        recetas.filter(
            r =>
                String(
                    r.productoFinal || ""
                )
                .toUpperCase()
                .includes(texto)
        );

    mostrarRecetas(resultado);
}


function limpiarBusqueda() {

    obtener(
        "buscarReceta"
    ).value = "";

    mostrarRecetas(
        recetas
    );
}


/* =========================================================
   MENSAJES FLOTANTES
========================================================= */

function mostrarMensaje(
    texto,
    tipo
) {

    let contenedor =
        obtener("notificaciones");

    /*
     * Si todavía no existe,
     * se crea automáticamente.
     */
    if (!contenedor) {

        contenedor =
            document.createElement(
                "div"
            );

        contenedor.id =
            "notificaciones";

        contenedor.className =
            "position-fixed top-0 end-0 p-3";

        contenedor.style.zIndex =
            "2000";

        contenedor.style.width =
            "380px";

        contenedor.style.maxWidth =
            "95%";

        document.body.appendChild(
            contenedor
        );
    }

    const alerta =
        document.createElement(
            "div"
        );

    alerta.className = `
        alert
        alert-${tipo}
        alert-dismissible
        fade
        show
        shadow
    `;

    alerta.innerHTML = `
        ${texto}

        <button
            type="button"
            class="btn-close"
            data-bs-dismiss="alert">
        </button>
    `;

    contenedor.appendChild(
        alerta
    );

    /*
     * La notificación desaparece
     * automáticamente en 3 segundos.
     */
    setTimeout(
        () => {

            if (
                alerta.parentNode
            ) {

                const instancia =
                    bootstrap.Alert
                        .getOrCreateInstance(
                            alerta
                        );

                instancia.close();
            }

        },
        3000
    );
}


/* =========================================================
   FORMATEAR NÚMERO
========================================================= */

function formatearNumero(
    valor
) {

    const numero =
        Number(valor);

    if (isNaN(numero)) {
        return "0";
    }

    return numero.toLocaleString(
        "es-GT",
        {
            maximumFractionDigits: 4
        }
    );
}