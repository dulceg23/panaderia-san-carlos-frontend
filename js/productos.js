let productos = [];

let modalProducto;
let modalMinimo;


/* ==========================================
   INICIO
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        modalProducto =
            new bootstrap.Modal(
                document.getElementById(
                    "modalProducto"
                )
            );


        modalMinimo =
            new bootstrap.Modal(
                document.getElementById(
                    "modalMinimo"
                )
            );


        document.getElementById(
            "buscarProducto"
        ).addEventListener(
            "input",
            aplicarFiltros
        );


        document.getElementById(
            "filtroTipo"
        ).addEventListener(
            "change",
            aplicarFiltros
        );


        cargarProductos();

    }
);


/* ==========================================
   CARGAR PRODUCTOS
========================================== */

async function cargarProductos() {

    try {

        productos =
            await apiGet("/productos");

        mostrarProductos(productos);

    }
    catch (error) {

        mostrarMensaje(
            error.message,
            "danger"
        );

    }

}


/* ==========================================
   MOSTRAR TABLA
========================================== */

function mostrarProductos(lista) {

    const tbody =
        document.getElementById(
            "tablaProductos"
        );


    tbody.innerHTML = "";


    if (lista.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="8"
                    class="text-center text-muted">

                    No se encontraron productos.

                </td>
            </tr>
        `;

        return;
    }


    lista.forEach(producto => {

        const fila =
            document.createElement("tr");


        const estadoActivo =
            Number(producto.estado) === 1;


        const claseEstado =
            estadoActivo
                ? "bg-success"
                : "bg-secondary";


        const textoEstado =
            estadoActivo
                ? "Activo"
                : "Inactivo";


        fila.innerHTML = `

            <td>
                ${producto.idProducto}
            </td>

            <td>
                <strong>
                    ${producto.nombre}
                </strong>
            </td>

            <td>
                ${producto.tipoProducto}
            </td>

            <td>
                ${producto.unidadMedida}
            </td>

            <td>
                ${formatearNumero(
                    producto.existencia
                )}
            </td>

            <td>
                ${formatearNumero(
                    producto.existenciaMinima
                )}
            </td>

            <td>

                <span class="badge ${claseEstado}">
                    ${textoEstado}
                </span>

            </td>

            <td class="text-center">

                <button
                    class="btn
                           btn-sm
                           btn-outline-primary
                           me-1"
                    onclick="editarProducto(
                        ${producto.idProducto}
                    )">

                    Editar

                </button>


                <button
                    class="btn
                           btn-sm
                           btn-outline-warning
                           me-1"
                    onclick="abrirMinimo(
                        ${producto.idProducto}
                    )">

                    Mínimo

                </button>


                <button
                    class="btn
                           btn-sm
                           ${estadoActivo
                               ? "btn-outline-danger"
                               : "btn-outline-success"}"
                    onclick="cambiarEstado(
                        ${producto.idProducto},
                        ${producto.estado}
                    )">

                    ${estadoActivo
                        ? "Desactivar"
                        : "Activar"}

                </button>

            </td>
        `;


        tbody.appendChild(fila);

    });

}


/* ==========================================
   NUEVO PRODUCTO
========================================== */

function abrirNuevoProducto() {

    document.getElementById(
        "formProducto"
    ).reset();


    document.getElementById(
        "idProducto"
    ).value = "";


    document.getElementById(
        "existenciaMinima"
    ).value = 0;


    document.getElementById(
        "tipoProducto"
    ).disabled = false;


    document.getElementById(
        "grupoExistenciaMinima"
    ).style.display = "block";


    document.getElementById(
        "tituloModalProducto"
    ).textContent =
        "Nuevo producto";


    modalProducto.show();

}


/* ==========================================
   EDITAR PRODUCTO
========================================== */

async function editarProducto(idProducto) {

    try {

        const producto =
            await apiGet(
                "/productos/" + idProducto
            );


        document.getElementById(
            "idProducto"
        ).value =
            producto.idProducto;


        document.getElementById(
            "nombreProducto"
        ).value =
            producto.nombre;


        document.getElementById(
            "tipoProducto"
        ).value =
            producto.idTipoProducto;


        /*
         * El procedimiento MODIFICAR_PRODUCTO
         * modifica nombre y unidad.
         *
         * No cambia el tipo.
         */
        document.getElementById(
            "tipoProducto"
        ).disabled = true;


        document.getElementById(
            "unidadMedida"
        ).value =
            producto.unidadMedida;


        /*
         * La existencia mínima tiene
         * su propio endpoint.
         */
        document.getElementById(
            "grupoExistenciaMinima"
        ).style.display =
            "none";


        document.getElementById(
            "tituloModalProducto"
        ).textContent =
            "Editar producto";


        modalProducto.show();

    }
    catch (error) {

        mostrarMensaje(
            error.message,
            "danger"
        );

    }

}


/* ==========================================
   GUARDAR PRODUCTO
========================================== */

async function guardarProducto() {

    const idProducto =
        document.getElementById(
            "idProducto"
        ).value;


    const nombre =
        document.getElementById(
            "nombreProducto"
        ).value.trim();


    const idTipoProducto =
        Number(
            document.getElementById(
                "tipoProducto"
            ).value
        );


    const unidadMedida =
        document.getElementById(
            "unidadMedida"
        ).value
            .trim()
            .toUpperCase();


    const existenciaMinima =
        Number(
            document.getElementById(
                "existenciaMinima"
            ).value
        );


    /* ==============================
       VALIDACIONES
    ============================== */

    if (nombre === "") {

        mostrarMensaje(
            "Debe ingresar el nombre del producto.",
            "warning"
        );

        return;
    }


    if (!idProducto && idTipoProducto <= 0) {

        mostrarMensaje(
            "Debe seleccionar el tipo de producto.",
            "warning"
        );

        return;
    }


    if (unidadMedida === "") {

        mostrarMensaje(
            "Debe ingresar la unidad de medida.",
            "warning"
        );

        return;
    }


    if (
        !idProducto &&
        existenciaMinima < 0
    ) {

        mostrarMensaje(
            "La existencia mínima no puede ser negativa.",
            "warning"
        );

        return;
    }


    try {

        /*
         * SI NO HAY ID:
         * crear producto
         */
        if (idProducto === "") {

            const datos = {

                idTipoProducto:
                    idTipoProducto,

                nombre:
                    nombre,

                unidadMedida:
                    unidadMedida,

                existenciaMinima:
                    existenciaMinima
            };


            const resultado =
                await apiPost(
                    "/productos",
                    datos
                );


            modalProducto.hide();


            mostrarMensaje(
                resultado.mensaje ||
                "Producto creado correctamente.",
                "success"
            );

        }


        /*
         * SI HAY ID:
         * modificar producto
         */
        else {

            const datos = {

                nombre:
                    nombre,

                unidadMedida:
                    unidadMedida
            };


            const resultado =
                await apiPut(
                    "/productos/"
                    + idProducto,
                    datos
                );


            modalProducto.hide();


            mostrarMensaje(
                resultado.mensaje ||
                "Producto actualizado correctamente.",
                "success"
            );

        }


        await cargarProductos();

    }
    catch (error) {

        mostrarMensaje(
            error.message,
            "danger"
        );

    }

}


/* ==========================================
   CAMBIAR ESTADO
========================================== */

async function cambiarEstado(
        idProducto,
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
            "¿Está seguro de "
            + accion
            + " este producto?"
        );


    if (!confirmar) {

        return;

    }


    try {

        const resultado =
            await apiPut(
                "/productos/"
                + idProducto
                + "/estado/"
                + nuevoEstado
            );


        mostrarMensaje(
            resultado.mensaje ||
            "Estado actualizado correctamente.",
            "success"
        );


        await cargarProductos();

    }
    catch (error) {

        mostrarMensaje(
            error.message,
            "danger"
        );

    }

}


/* ==========================================
   EXISTENCIA MINIMA
========================================== */

function abrirMinimo(idProducto) {

    const producto =
        productos.find(
            p =>
                Number(p.idProducto)
                === Number(idProducto)
        );


    if (!producto) {

        return;

    }


    document.getElementById(
        "idProductoMinimo"
    ).value =
        producto.idProducto;


    document.getElementById(
        "nombreProductoMinimo"
    ).textContent =
        producto.nombre;


    document.getElementById(
        "nuevaExistenciaMinima"
    ).value =
        producto.existenciaMinima;


    modalMinimo.show();

}


/* ==========================================
   GUARDAR EXISTENCIA MINIMA
========================================== */

async function guardarExistenciaMinima() {

    const idProducto =
        document.getElementById(
            "idProductoMinimo"
        ).value;


    const cantidad =
        Number(
            document.getElementById(
                "nuevaExistenciaMinima"
            ).value
        );


    if (cantidad < 0) {

        mostrarMensaje(
            "La existencia mínima no puede ser negativa.",
            "warning"
        );

        return;
    }


    try {

        const resultado =
            await apiPut(
                "/productos/"
                + idProducto
                + "/existencia-minima/"
                + cantidad
            );


        modalMinimo.hide();


        mostrarMensaje(
            resultado.mensaje ||
            "Existencia mínima actualizada.",
            "success"
        );


        await cargarProductos();

    }
    catch (error) {

        mostrarMensaje(
            error.message,
            "danger"
        );

    }

}


/* ==========================================
   FILTROS
========================================== */

function aplicarFiltros() {

    const texto =
        document.getElementById(
            "buscarProducto"
        ).value
            .trim()
            .toUpperCase();


    const tipo =
        document.getElementById(
            "filtroTipo"
        ).value
            .toUpperCase();


    const filtrados =
        productos.filter(producto => {

            const coincideNombre =
                producto.nombre
                    .toUpperCase()
                    .includes(texto);


            const coincideTipo =
                tipo === ""
                ||
                producto.tipoProducto
                    .toUpperCase()
                    === tipo;


            return (
                coincideNombre
                &&
                coincideTipo
            );

        });


    mostrarProductos(filtrados);

}


/* ==========================================
   LIMPIAR FILTROS
========================================== */

function limpiarFiltros() {

    document.getElementById(
        "buscarProducto"
    ).value = "";


    document.getElementById(
        "filtroTipo"
    ).value = "";


    mostrarProductos(productos);

}


/* ==========================================
   MENSAJES
========================================== */

function mostrarMensaje(
        texto,
        tipo
) {

    const contenedor =
        document.getElementById(
            "mensaje"
        );


    contenedor.innerHTML = `

        <div
            class="alert
                   alert-${tipo}
                   alert-dismissible
                   fade
                   show">

            ${texto}

            <button
                type="button"
                class="btn-close"
                data-bs-dismiss="alert">
            </button>

        </div>

    `;


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* ==========================================
   FORMATO NUMEROS
========================================== */

function formatearNumero(valor) {

    const numero =
        Number(valor);


    if (Number.isNaN(numero)) {

        return "0";

    }


    return numero.toLocaleString(
        "es-GT",
        {
            maximumFractionDigits: 2
        }
    );

}