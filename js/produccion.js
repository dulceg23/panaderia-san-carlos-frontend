/* =========================================================
   PRODUCCION.JS
========================================================= */

const obtener = id => document.getElementById(id);

let producciones = [];
let productosDisponibles = [];
let inventario = [];

let modalProduccion;


/* =========================================================
   INICIO
========================================================= */

document.addEventListener("DOMContentLoaded", iniciar);

async function iniciar() {

    modalProduccion =
        new bootstrap.Modal(
            obtener("modalProduccion")
        );

    obtener("buscarProduccion")
        .addEventListener(
            "input",
            aplicarBusqueda
        );

    await cargarDatos();
}


/* =========================================================
   CARGAR DATOS
========================================================= */

async function cargarDatos() {

    try {

        const productos =
            await apiGet("/productos");

        const recetas =
            await apiGet("/recetas");

        inventario =
            await apiGet("/inventario");

        producciones =
            await apiGet("/produccion");


        prepararProductos(
            productos,
            recetas
        );

        llenarProductos();

        mostrarProducciones(
            producciones
        );

        actualizarResumen();

    }
    catch (error) {

        console.error(
            "Error al cargar producción:",
            error
        );

        mostrarMensaje(
            "No se pudo cargar la información de producción.",
            "danger"
        );
    }
}


/* =========================================================
   PRODUCTOS DISPONIBLES PARA PRODUCIR
========================================================= */

function prepararProductos(
    productos,
    recetas
) {

    /*
     * Producto final:
     * idTipoProducto = 1
     *
     * Además debe estar activo.
     */
    const productosFinales =
        productos.filter(
            producto =>
                Number(producto.idTipoProducto) === 1 &&
                Number(producto.estado) === 1
        );


    /*
     * Obtenemos los productos que tienen
     * una receta activa.
     */
    const productosConReceta =
        recetas
            .filter(
                receta =>
                    Number(receta.estado) === 1
            )
            .map(
                receta =>
                    Number(receta.idProductoFinal)
            );


    /*
     * Solo permitimos producir:
     *
     * - Productos finales
     * - Activos
     * - Con receta activa
     */
    productosDisponibles =
        productosFinales.filter(
            producto =>
                productosConReceta.includes(
                    Number(producto.idProducto)
                )
        );
}


/* =========================================================
   LLENAR COMBO DE PRODUCTOS
========================================================= */

function llenarProductos() {

    const select =
        obtener("productoProduccion");

    select.innerHTML =
        '<option value="">Seleccione...</option>';


    productosDisponibles.forEach(
        producto => {

            select.innerHTML += `
                <option value="${producto.idProducto}">
                    ${producto.nombre}
                </option>
            `;
        }
    );


    if (
        productosDisponibles.length === 0
    ) {

        select.innerHTML += `
            <option disabled>
                No hay productos con receta activa
            </option>
        `;
    }
}


/* =========================================================
   INFORMACIÓN DEL PRODUCTO
========================================================= */

function mostrarInformacionProducto() {

    const idProducto =
        Number(
            obtener(
                "productoProduccion"
            ).value
        );

    const panel =
        obtener(
            "informacionProducto"
        );


    if (idProducto <= 0) {

        panel.classList.add(
            "d-none"
        );

        return;
    }


    const producto =
        inventario.find(
            item =>
                Number(item.idProducto) ===
                idProducto
        );


    if (!producto) {

        panel.classList.add(
            "d-none"
        );

        return;
    }


    obtener(
        "existenciaActual"
    ).textContent =
        formatearNumero(
            producto.existencia
        );


    obtener(
        "unidadProducto"
    ).textContent =
        producto.unidadMedida;


    panel.classList.remove(
        "d-none"
    );
}


/* =========================================================
   MOSTRAR HISTORIAL
========================================================= */

function mostrarProducciones(
    lista
) {

    const tabla =
        obtener("tablaProduccion");


    if (
        lista.length === 0
    ) {

        tabla.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="text-center text-muted">

                    No existen producciones registradas.

                </td>
            </tr>
        `;

        return;
    }


    tabla.innerHTML =
        lista.map(
            produccion => `

                <tr>

                    <td>
                        ${produccion.idProduccion}
                    </td>

                    <td>
                        ${formatearFecha(
                            produccion.fecha
                        )}
                    </td>

                    <td>
                        <strong>
                            ${produccion.producto}
                        </strong>
                    </td>

                    <td>
                        ${formatearNumero(
                            produccion.cantidad
                        )}
                    </td>

                    <td>
                        <span class="badge bg-success">

                            ${
                                produccion.estado
                                ||
                                "REGISTRADA"
                            }

                        </span>
                    </td>

                </tr>
            `
        ).join("");
}


/* =========================================================
   RESUMEN
========================================================= */

function actualizarResumen() {

    obtener(
        "totalProducciones"
    ).textContent =
        producciones.length;


    obtener(
        "totalProductosProduccion"
    ).textContent =
        productosDisponibles.length;
}


/* =========================================================
   ABRIR MODAL
========================================================= */

function abrirProduccion() {

    obtener(
        "productoProduccion"
    ).value = "";


    obtener(
        "cantidadProduccion"
    ).value = "";


    obtener(
        "informacionProducto"
    ).classList.add(
        "d-none"
    );


    modalProduccion.show();
}


/* =========================================================
   REGISTRAR PRODUCCION
========================================================= */

async function registrarProduccion() {

    const idProducto =
        Number(
            obtener(
                "productoProduccion"
            ).value
        );


    const cantidad =
        Number(
            obtener(
                "cantidadProduccion"
            ).value
        );


    /* -----------------------------
       VALIDACIONES
    ----------------------------- */

    if (
        idProducto <= 0
    ) {

        return mostrarMensaje(
            "Debe seleccionar un producto final.",
            "warning"
        );
    }


    if (
        isNaN(cantidad) ||
        !isFinite(cantidad) ||
        cantidad <= 0
    ) {

        return mostrarMensaje(
            "Ingrese una cantidad válida mayor que cero.",
            "warning"
        );
    }


    try {

        const resultado =
            await apiPost(
                "/produccion",
                {
                    idProducto,
                    cantidad
                }
            );


        modalProduccion.hide();


        /*
         * Recargamos los datos porque
         * cambió el inventario y el
         * historial de producción.
         */
        await cargarDatos();


        mostrarMensaje(
            resultado.mensaje ||
            "Producción registrada correctamente.",
            "success"
        );

    }
    catch (error) {

        /*
         * El error completo queda en consola
         * para poder revisarlo como desarrollador.
         */
        console.error(
            "Error técnico de producción:",
            error
        );


        /*
         * El usuario recibe un mensaje
         * sencillo y entendible.
         */
        mostrarMensaje(
            obtenerMensajeError(error),
            "danger"
        );
    }
}


/* =========================================================
   MENSAJES DE ERROR AMIGABLES
========================================================= */

function obtenerMensajeError(
    error
) {

    const mensaje =
        String(
            error.message || ""
        ).toUpperCase();


    /* -----------------------------
       INVENTARIO INSUFICIENTE
    ----------------------------- */

    if (
        mensaje.includes("ORA-20049") ||
        mensaje.includes(
            "NO HAY SUFICIENTE INVENTARIO"
        )
    ) {

        return "No hay suficientes insumos en inventario "
             + "para producir esa cantidad. "
             + "Verifique las existencias disponibles.";
    }


    /* -----------------------------
       SIN RECETA
    ----------------------------- */

    if (
        mensaje.includes(
            "NO TIENE RECETA"
        ) ||
        mensaje.includes(
            "RECETA NO EXISTE"
        ) ||
        mensaje.includes(
            "NO EXISTE RECETA"
        )
    ) {

        return "El producto seleccionado no tiene "
             + "una receta disponible para producción.";
    }


    /* -----------------------------
       RECETA INACTIVA
    ----------------------------- */

    if (
        mensaje.includes(
            "RECETA INACTIVA"
        )
    ) {

        return "La receta de este producto está inactiva. "
             + "Debe activarla antes de producir.";
    }


    /* -----------------------------
       PRODUCTO NO EXISTE
    ----------------------------- */

    if (
        mensaje.includes(
            "PRODUCTO NO EXISTE"
        )
    ) {

        return "El producto seleccionado no existe.";
    }


    /* -----------------------------
       PRODUCTO NO VÁLIDO
    ----------------------------- */

    if (
        mensaje.includes(
            "NO ES PRODUCTO FINAL"
        )
    ) {

        return "Solo se pueden registrar producciones "
             + "de productos finales.";
    }


    /* -----------------------------
       MENSAJE GENERAL
    ----------------------------- */

    return "No se pudo registrar la producción. "
         + "Verifique los datos e inténtelo nuevamente.";
}


/* =========================================================
   BUSQUEDA
========================================================= */

function aplicarBusqueda() {

    const texto =
        obtener(
            "buscarProduccion"
        )
        .value
        .trim()
        .toUpperCase();


    const resultado =
        producciones.filter(
            produccion =>

                String(
                    produccion.producto || ""
                )
                .toUpperCase()
                .includes(texto)
        );


    mostrarProducciones(
        resultado
    );
}


/* =========================================================
   LIMPIAR BUSQUEDA
========================================================= */

function limpiarBusqueda() {

    obtener(
        "buscarProduccion"
    ).value = "";


    mostrarProducciones(
        producciones
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
        obtener(
            "notificaciones"
        );


    /*
     * Crear contenedor solamente
     * la primera vez.
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
            "400px";


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
     * Cerrar automáticamente
     * después de 4 segundos.
     */
    setTimeout(
        () => {

            if (
                alerta.parentNode
            ) {

                bootstrap.Alert
                    .getOrCreateInstance(
                        alerta
                    )
                    .close();
            }

        },
        4000
    );
}


/* =========================================================
   FORMATO NUMERO
========================================================= */

function formatearNumero(
    valor
) {

    const numero =
        Number(valor);


    if (
        isNaN(numero)
    ) {

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
   FORMATO FECHA
========================================================= */

function formatearFecha(
    fecha
) {

    if (!fecha) {
        return "";
    }


    const valor =
        new Date(fecha);


    if (
        isNaN(
            valor.getTime()
        )
    ) {

        return fecha;
    }


    return valor.toLocaleString(
        "es-GT"
    );
}