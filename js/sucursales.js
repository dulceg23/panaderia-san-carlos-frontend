let sucursales = [];

let modalSucursal;


/* ==========================================
   INICIO
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        modalSucursal =
            new bootstrap.Modal(
                document.getElementById(
                    "modalSucursal"
                )
            );


        document.getElementById(
            "buscarSucursal"
        ).addEventListener(
            "input",
            aplicarBusqueda
        );


        cargarSucursales();

    }
);


/* ==========================================
   CARGAR SUCURSALES
========================================== */

async function cargarSucursales() {

    try {

        sucursales =
            await apiGet("/sucursales");


        mostrarSucursales(
            sucursales
        );

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

function mostrarSucursales(lista) {

    const tbody =
        document.getElementById(
            "tablaSucursales"
        );


    tbody.innerHTML = "";


    if (lista.length === 0) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    class="text-center text-muted">

                    No se encontraron sucursales.

                </td>

            </tr>

        `;

        return;

    }


    lista.forEach(sucursal => {

        const fila =
            document.createElement("tr");


        const estadoActivo =
            Number(sucursal.estado) === 1;


        const textoEstado =
            estadoActivo
                ? "Activa"
                : "Inactiva";


        const claseEstado =
            estadoActivo
                ? "bg-success"
                : "bg-secondary";


        fila.innerHTML = `

            <td>
                ${sucursal.idSucursal}
            </td>


            <td>

                <strong>
                    ${sucursal.nombre}
                </strong>

            </td>


            <td>

                <span
                    class="badge ${claseEstado}">

                    ${textoEstado}

                </span>

            </td>


            <td class="text-center">

                <button
                    class="
                        btn
                        btn-sm
                        btn-outline-primary
                        me-1"
                    onclick="editarSucursal(
                        ${sucursal.idSucursal}
                    )">

                    Editar

                </button>


                <button
                    class="
                        btn
                        btn-sm
                        ${estadoActivo
                            ? "btn-outline-danger"
                            : "btn-outline-success"}"
                    onclick="cambiarEstadoSucursal(
                        ${sucursal.idSucursal},
                        ${sucursal.estado}
                    )">

                    ${estadoActivo
                        ? "Desactivar"
                        : "Activar"}

                </button>

            </td>

        `;


        tbody.appendChild(
            fila
        );

    });

}


/* ==========================================
   NUEVA SUCURSAL
========================================== */

function abrirNuevaSucursal() {

    document.getElementById(
        "formSucursal"
    ).reset();


    document.getElementById(
        "idSucursal"
    ).value = "";


    document.getElementById(
        "tituloModalSucursal"
    ).textContent =
        "Nueva sucursal";


    modalSucursal.show();

}


/* ==========================================
   EDITAR SUCURSAL
========================================== */

async function editarSucursal(
        idSucursal
) {

    try {

        const sucursal =
            await apiGet(
                "/sucursales/"
                + idSucursal
            );


        document.getElementById(
            "idSucursal"
        ).value =
            sucursal.idSucursal;


        document.getElementById(
            "nombreSucursal"
        ).value =
            sucursal.nombre;


        document.getElementById(
            "tituloModalSucursal"
        ).textContent =
            "Editar sucursal";


        modalSucursal.show();

    }
    catch (error) {

        mostrarMensaje(
            error.message,
            "danger"
        );

    }

}


/* ==========================================
   GUARDAR
========================================== */

async function guardarSucursal() {

    const idSucursal =
        document.getElementById(
            "idSucursal"
        ).value;


    let nombre =
        document.getElementById(
            "nombreSucursal"
        ).value.trim();


    /*
     * Guardaremos nombres en mayúsculas
     * para mantener el formato utilizado
     * en la base de datos.
     */

    nombre =
        nombre.toUpperCase();


    if (nombre === "") {

        mostrarMensaje(
            "Debe ingresar el nombre de la sucursal.",
            "warning"
        );

        return;

    }


    try {

        const datos = {

            nombre: nombre

        };


        /*
         * NUEVA SUCURSAL
         */
        if (idSucursal === "") {

            const resultado =
                await apiPost(
                    "/sucursales",
                    datos
                );


            modalSucursal.hide();


            mostrarMensaje(
                resultado.mensaje ||
                "Sucursal creada correctamente.",
                "success"
            );

        }


        /*
         * EDITAR
         */
        else {

            const resultado =
                await apiPut(
                    "/sucursales/"
                    + idSucursal,
                    datos
                );


            modalSucursal.hide();


            mostrarMensaje(
                resultado.mensaje ||
                "Sucursal actualizada correctamente.",
                "success"
            );

        }


        await cargarSucursales();

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

async function cambiarEstadoSucursal(
        idSucursal,
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
            + " esta sucursal?"
        );


    if (!confirmar) {

        return;

    }


    try {

        const resultado =
            await apiPut(

                "/sucursales/"
                + idSucursal
                + "/estado/"
                + nuevoEstado

            );


        mostrarMensaje(
            resultado.mensaje ||
            "Estado actualizado correctamente.",
            "success"
        );


        await cargarSucursales();

    }
    catch (error) {

        mostrarMensaje(
            error.message,
            "danger"
        );

    }

}


/* ==========================================
   BUSQUEDA
========================================== */

function aplicarBusqueda() {

    const texto =
        document.getElementById(
            "buscarSucursal"
        ).value
            .trim()
            .toUpperCase();


    const filtradas =
        sucursales.filter(
            sucursal =>

                sucursal.nombre
                    .toUpperCase()
                    .includes(texto)

        );


    mostrarSucursales(
        filtradas
    );

}


/* ==========================================
   LIMPIAR BUSQUEDA
========================================== */

function limpiarBusqueda() {

    document.getElementById(
        "buscarSucursal"
    ).value = "";


    mostrarSucursales(
        sucursales
    );

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
            class="
                alert
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