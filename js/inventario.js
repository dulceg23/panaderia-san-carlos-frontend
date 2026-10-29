/* =========================================================
   INVENTARIO.JS
========================================================= */

const obtener = id => document.getElementById(id);

let inventario = [];
let existenciasBajas = [];
let movimientos = [];

let modalEntrada;


/* =========================================================
   INICIO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    iniciar
);

async function iniciar() {

    modalEntrada =
        new bootstrap.Modal(
            obtener("modalEntrada")
        );

    obtener("buscarInventario")
        .addEventListener(
            "input",
            aplicarFiltros
        );

    obtener("filtroTipoInventario")
        .addEventListener(
            "change",
            aplicarFiltros
        );

    await cargarDatos();
}


/* =========================================================
   CARGAR DATOS
========================================================= */

async function cargarDatos() {

    try {

        inventario =
            await apiGet("/inventario");

        existenciasBajas =
            await apiGet("/inventario/bajo");

        movimientos =
            await apiGet("/inventario/movimientos");


        mostrarInventario(inventario);

        mostrarExistenciasBajas();

        mostrarMovimientos();

        llenarInsumos();

        actualizarResumen();

    }
    catch (error) {

        mostrarMensaje(
            error.message,
            "danger"
        );
    }
}


/* =========================================================
   RESUMEN
========================================================= */

function actualizarResumen() {

    obtener("totalInventario")
        .textContent =
        inventario.length;

    obtener("totalBajos")
        .textContent =
        existenciasBajas.length;

    obtener("totalMovimientos")
        .textContent =
        movimientos.length;
}


/* =========================================================
   MOSTRAR INVENTARIO
========================================================= */

function mostrarInventario(lista) {

    const tabla =
        obtener("tablaInventario");

    if (lista.length === 0) {

        tabla.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="text-center text-muted">

                    No se encontraron productos.

                </td>
            </tr>
        `;

        return;
    }

    tabla.innerHTML =
        lista.map(producto => {

            const existencia =
                Number(producto.existencia);

            const minimo =
                Number(producto.existenciaMinima);

            const bajo =
                existencia <= minimo;

            const activo =
                Number(producto.estado) === 1;

            return `

                <tr>

                    <td>
                        ${producto.idProducto}
                    </td>

                    <td>

                        <strong>
                            ${producto.producto}
                        </strong>

                        ${
                            bajo
                                ? '<span class="badge bg-danger ms-2">Bajo</span>'
                                : ""
                        }

                    </td>

                    <td>
                        ${producto.tipoProducto}
                    </td>

                    <td>
                        ${formatearNumero(existencia)}
                    </td>

                    <td>
                        ${formatearNumero(minimo)}
                    </td>

                    <td>
                        ${producto.unidadMedida}
                    </td>

                    <td>

                        <span class="badge
                            ${activo
                                ? "bg-success"
                                : "bg-secondary"}">

                            ${activo
                                ? "Activo"
                                : "Inactivo"}

                        </span>

                    </td>

                </tr>
            `;

        }).join("");
}


/* =========================================================
   EXISTENCIAS BAJAS
========================================================= */

function mostrarExistenciasBajas() {

    const tabla =
        obtener("tablaBajos");

    if (existenciasBajas.length === 0) {

        tabla.innerHTML = `
            <tr>
                <td
                    colspan="4"
                    class="text-center text-success">

                    No hay productos con existencia baja.

                </td>
            </tr>
        `;

        return;
    }

    tabla.innerHTML =
        existenciasBajas.map(producto => `

            <tr>

                <td>
                    <strong>
                        ${producto.producto}
                    </strong>
                </td>

                <td class="text-danger fw-bold">
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
                    ${producto.unidadMedida}
                </td>

            </tr>

        `).join("");
}


/* =========================================================
   MOVIMIENTOS
========================================================= */

function mostrarMovimientos() {

    const tabla =
        obtener("tablaMovimientos");

    if (movimientos.length === 0) {

        tabla.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="text-center text-muted">

                    No existen movimientos registrados.

                </td>
            </tr>
        `;

        return;
    }

    tabla.innerHTML =
        movimientos.map(movimiento => {

            const entrada =
                movimiento.tipoMovimiento === "ENTRADA";

            return `

                <tr>

                    <td>
                        ${movimiento.idMovimiento}
                    </td>

                    <td>
                        ${formatearFecha(
                            movimiento.fecha
                        )}
                    </td>

                    <td>
                        ${movimiento.producto}
                    </td>

                    <td>

                        <span class="badge
                            ${entrada
                                ? "bg-success"
                                : "bg-danger"}">

                            ${movimiento.tipoMovimiento}

                        </span>

                    </td>

                    <td>
                        ${formatearNumero(
                            movimiento.cantidad
                        )}
                        ${movimiento.unidadMedida || ""}
                    </td>

                    <td>
                        ${movimiento.descripcion || ""}
                    </td>

                </tr>
            `;

        }).join("");
}


/* =========================================================
   LLENAR COMBO DE INSUMOS
========================================================= */

function llenarInsumos() {

    const select =
        obtener("productoEntrada");

    const insumos =
        inventario.filter(
            p =>
                String(p.tipoProducto)
                    .toUpperCase() === "INSUMO"
                &&
                Number(p.estado) === 1
        );

    select.innerHTML =
        '<option value="">Seleccione...</option>';

    insumos.forEach(producto => {

        select.innerHTML += `
            <option value="${producto.idProducto}">
                ${producto.producto}
                - ${producto.unidadMedida}
            </option>
        `;
    });
}


/* =========================================================
   ABRIR ENTRADA
========================================================= */

function abrirEntrada() {

    obtener("productoEntrada").value = "";

    obtener("cantidadEntrada").value = "";

    obtener("descripcionEntrada").value = "";

    modalEntrada.show();
}


/* =========================================================
   REGISTRAR ENTRADA
========================================================= */

async function registrarEntrada() {

    const idProducto =
        Number(
            obtener("productoEntrada").value
        );

    const cantidad =
        Number(
            obtener("cantidadEntrada").value
        );

    const descripcion =
        obtener("descripcionEntrada")
            .value
            .trim();


    if (idProducto <= 0) {

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


    if (descripcion === "") {

        return mostrarMensaje(
            "Debe ingresar una descripción.",
            "warning"
        );
    }


    try {

        const resultado =
            await apiPost(
                "/inventario/entrada",
                {
                    idProducto,
                    cantidad,
                    descripcion
                }
            );

        modalEntrada.hide();

        await cargarDatos();

        mostrarMensaje(
            resultado.mensaje ||
            "Entrada registrada correctamente.",
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
   FILTROS
========================================================= */

function aplicarFiltros() {

    const texto =
        obtener("buscarInventario")
            .value
            .trim()
            .toUpperCase();

    const tipo =
        obtener("filtroTipoInventario")
            .value
            .toUpperCase();

    const resultado =
        inventario.filter(producto => {

            const coincideNombre =
                String(producto.producto)
                    .toUpperCase()
                    .includes(texto);

            const coincideTipo =
                tipo === ""
                ||
                String(producto.tipoProducto)
                    .toUpperCase() === tipo;

            return (
                coincideNombre &&
                coincideTipo
            );
        });

    mostrarInventario(resultado);
}


function limpiarFiltros() {

    obtener("buscarInventario").value = "";

    obtener("filtroTipoInventario").value = "";

    mostrarInventario(inventario);
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

    if (!contenedor) {

        contenedor =
            document.createElement("div");

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
        document.createElement("div");

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

    contenedor.appendChild(alerta);


    setTimeout(
        () => {

            if (alerta.parentNode) {

                bootstrap.Alert
                    .getOrCreateInstance(alerta)
                    .close();
            }

        },
        3000
    );
}


/* =========================================================
   FORMATO DE NÚMEROS
========================================================= */

function formatearNumero(valor) {

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


/* =========================================================
   FORMATO DE FECHA
========================================================= */

function formatearFecha(fecha) {

    if (!fecha) {
        return "";
    }

    const valor =
        new Date(fecha);

    if (isNaN(valor.getTime())) {
        return fecha;
    }

    return valor.toLocaleString(
        "es-GT"
    );
}