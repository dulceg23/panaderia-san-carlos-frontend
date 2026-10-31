/* =========================================================
   PEDIDOS.JS
   Panadería San Carlos
========================================================= */
const $ = id => document.getElementById(id);

let pedidos = [];
let sucursales = [];
let productosFinales = [];
let vistaActual = "activos";

let modalPedido;
let modalDetalle;
let modalCantidad;

let usuarioActual = null;


/* =========================================================
   INICIO
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    usuarioActual = obtenerUsuarioActual();

    if (!usuarioActual) {
        window.location.replace("login.html");
        return;
    }

    modalPedido = crearModal("modalPedido");
    modalDetalle = crearModal("modalDetalle");
    modalCantidad = crearModal("modalCantidad");

    $("buscarPedido")
        ?.addEventListener(
            "input",
            renderizarPedidos
        );

    $("filtroEstado")
        ?.addEventListener(
            "change",
            cambiarFiltroEstado
        );

    configurarInterfazPorRol();

    await cargarDatosIniciales();
});


function crearModal(id) {

    const elemento = $(id);

    return elemento
        ? new bootstrap.Modal(elemento)
        : null;
}


/* =========================================================
   USUARIO Y PERMISOS
========================================================= */

function obtenerUsuarioActual() {

    try {

        return JSON.parse(
            localStorage.getItem(
                "panaderia_usuario"
            )
        );

    } catch {

        return null;
    }
}


function rolActual() {

    return String(
        usuarioActual?.rol || ""
    ).toUpperCase();
}


function esSucursal() {

    return rolActual() === "SUCURSAL";
}


function puedeGestionarEstado() {

    return [
        "ADMIN",
        "PRODUCCION"
    ].includes(
        rolActual()
    );
}


/* =========================================================
   INTERFAZ SEGÚN ROL
========================================================= */

function configurarInterfazPorRol() {

    if (!esSucursal()) {
        return;
    }


    const titulo =
        document.querySelector(
            ".contenido h1"
        );

    if (titulo) {
        titulo.textContent =
            "Mis pedidos";
    }


    const contenedorBuscarSucursal =
        $("contenedorBuscarSucursal");

    if (contenedorBuscarSucursal) {

        contenedorBuscarSucursal
            .classList
            .add("d-none");
    }


    const contenedorFiltroEstado =
        $("contenedorFiltroEstado");

    if (contenedorFiltroEstado) {

        contenedorFiltroEstado
            .classList
            .remove("col-md-3");

        contenedorFiltroEstado
            .classList
            .add("col-md-6");
    }


    const contenedorLimpiarFiltros =
        $("contenedorLimpiarFiltros");

    if (contenedorLimpiarFiltros) {

        contenedorLimpiarFiltros
            .classList
            .remove("col-md-3");

        contenedorLimpiarFiltros
            .classList
            .add("col-md-6");
    }


    const selectorSucursal =
        $("sucursalPedido");

    if (selectorSucursal) {

        selectorSucursal.disabled =
            true;

        const grupo =
            selectorSucursal.closest(
                ".mb-3"
            );

        if (grupo) {
            grupo.classList.add(
                "d-none"
            );
        }
    }


    const modalBody =
        $("modalPedido")
            ?.querySelector(
                ".modal-body"
            );

    if (
        modalBody &&
        !$("infoSucursalAutomatica")
    ) {

        const aviso =
            document.createElement(
                "div"
            );

        aviso.id =
            "infoSucursalAutomatica";

        aviso.className =
            "alert alert-info";

        aviso.textContent =
            "El pedido se registrará automáticamente "
            + "para su sucursal.";

        modalBody.prepend(
            aviso
        );
    }
}


/* =========================================================
   CARGA INICIAL
========================================================= */

async function cargarDatosIniciales() {

    try {

        if (esSucursal()) {

            const productos =
                await apiGet(
                    "/productos"
                );

            productosFinales =
                obtenerProductosFinales(
                    productos
                );

        } else {

            const [
                listaSucursales,
                productos
            ] = await Promise.all([

                apiGet(
                    "/sucursales"
                ),

                apiGet(
                    "/productos"
                )
            ]);


            sucursales =
                listaSucursales.filter(
                    s =>
                        Number(s.estado) === 1
                );


            productosFinales =
                obtenerProductosFinales(
                    productos
                );


            llenarSucursales();
        }


        await cargarPedidos();

    } catch (error) {

        console.error(error);

        mostrarMensaje(
            obtenerMensajeError(error),
            "danger"
        );
    }
}


function obtenerProductosFinales(
    productos
) {

    return productos.filter(
        p =>
            Number(
                p.idTipoProducto
            ) === 1
            &&
            Number(
                p.estado
            ) === 1
    );
}


/* =========================================================
   PEDIDOS
========================================================= */

async function cargarPedidos() {

    pedidos =
        await apiGet(
            "/pedidos"
        );


    pedidos.sort(
        (a, b) =>
            Number(b.idPedido)
            -
            Number(a.idPedido)
    );


    actualizarResumen();

    renderizarPedidos();
}


/* =========================================================
   SUCURSALES
========================================================= */

function llenarSucursales() {

    const select =
        $("sucursalPedido");

    if (!select) {
        return;
    }


    select.innerHTML = `
        <option value="">
            Seleccione...
        </option>
    `;


    select.innerHTML +=
        sucursales
            .map(
                s => `
                    <option
                        value="${s.idSucursal}">

                        ${escapar(
                            s.nombre
                        )}

                    </option>
                `
            )
            .join("");
}


/* =========================================================
   PRODUCTOS
========================================================= */

function llenarProductosPedido(
    idPedido = null
) {

    const select =
        $("productoPedido");

    if (!select) {
        return;
    }


    let disponibles =
        productosFinales;


    if (idPedido) {

        const pedido =
            buscarPedido(
                idPedido
            );


        const existentes =
            new Set(
                (
                    pedido?.detalles
                    ||
                    []
                )
                    .map(
                        d =>
                            Number(
                                d.idProducto
                            )
                    )
            );


        disponibles =
            productosFinales.filter(
                producto =>
                    !existentes.has(
                        Number(
                            producto.idProducto
                        )
                    )
            );
    }


    select.innerHTML = `
        <option value="">
            Seleccione...
        </option>
    `;


    select.innerHTML +=
        disponibles
            .map(
                p => `
                    <option
                        value="${p.idProducto}">

                        ${escapar(
                            p.nombre
                        )}

                    </option>
                `
            )
            .join("");


    if (!disponibles.length) {

        select.innerHTML += `
            <option disabled>
                No hay más productos disponibles
            </option>
        `;
    }
}


/* =========================================================
   RENDERIZAR
========================================================= */

function renderizarPedidos() {

    const texto =
        ($("buscarPedido")?.value || "")
            .trim()
            .toUpperCase();


    const filtroEstado =
        ($("filtroEstado")?.value || "")
            .toUpperCase();


    const estados =
        vistaActual === "activos"
            ? [
                "PENDIENTE",
                "PROCESANDO"
            ]
            : [
                "DESPACHADO",
                "CANCELADO"
            ];


    const resultado =
        pedidos.filter(
            pedido => {

                const estado =
                    obtenerEstado(
                        pedido
                    );


                const productos =
                    (
                        pedido.detalles
                        ||
                        []
                    )
                        .map(
                            d =>
                                d.producto
                        )
                        .join(" ");


                const contenido =
                    [
                        pedido.idPedido,
                        pedido.sucursal,
                        pedido.turno,
                        estado,
                        productos
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toUpperCase();


                return (
                    contenido.includes(texto)
                    &&
                    (
                        !filtroEstado
                        ||
                        estado === filtroEstado
                    )
                    &&
                    estados.includes(
                        estado
                    )
                );
            }
        );


    const contenedor =
        vistaActual === "activos"
            ? $("contenedorPedidosActivos")
            : $("contenedorHistorial");


    if (!contenedor) {
        return;
    }


    if (!resultado.length) {

        contenedor.innerHTML = `

            <div class="card">

                <div class="
                    card-body
                    text-center
                    text-muted">

                    ${
                        vistaActual === "activos"
                            ? "No existen pedidos pendientes o en proceso."
                            : "No existen pedidos en el historial."
                    }

                </div>

            </div>
        `;

        return;
    }


    contenedor.innerHTML =
        resultado
            .map(
                crearTarjetaPedido
            )
            .join("");
}


/* =========================================================
   TARJETA
========================================================= */

function crearTarjetaPedido(
    pedido
) {

    const estado =
        obtenerEstado(
            pedido
        );


    return `

        <div class="card mb-4">

            <div class="
                card-header
                bg-white">

                <div class="
                    d-flex
                    justify-content-between
                    align-items-center
                    flex-wrap
                    gap-2">

                    <div>

                        <h5 class="mb-1">

                            Pedido #${pedido.idPedido}

                        </h5>

                        <small class="text-muted">

                            ${escapar(
                                pedido.sucursal
                            )}

                            |

                            ${formatearFecha(
                                pedido.fecha
                            )}

                            |

                            Turno:
                            ${formatearTurno(
                                pedido.turno
                            )}

                        </small>

                    </div>


                    <span
                        class="badge ${claseEstado(
                            estado
                        )}">

                        ${escapar(
                            estado
                        )}

                    </span>

                </div>

            </div>


            <div class="card-body">

                ${crearAccionesPedido(
                    pedido
                )}

                <div class="
                    table-responsive
                    mt-3">

                    <table class="
                        table
                        table-sm
                        table-hover
                        align-middle">

                        <thead>

                            <tr>

                                <th>
                                    Producto
                                </th>

                                <th>
                                    Cantidad
                                </th>

                                <th class="text-end">
                                    Acciones
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            ${crearDetallesPedido(
                                pedido
                            )}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>
    `;
}


/* =========================================================
   ACCIONES
========================================================= */

function crearAccionesPedido(
    pedido
) {

    const estado =
        obtenerEstado(
            pedido
        );


    if (estado === "PENDIENTE") {

        let acciones = `

            <button
                class="
                    btn
                    btn-sm
                    btn-panaderia"

                onclick="
                    abrirDetalle(
                        ${pedido.idPedido}
                    )
                ">

                + Agregar producto

            </button>
        `;


        if (
            puedeGestionarEstado()
        ) {

            acciones += `

                <button
                    class="
                        btn
                        btn-sm
                        btn-outline-primary"

                    onclick="
                        procesarPedido(
                            ${pedido.idPedido}
                        )
                    ">

                    Procesar pedido

                </button>


                <button
                    class="
                        btn
                        btn-sm
                        btn-outline-danger"

                    onclick="
                        cancelarPedido(
                            ${pedido.idPedido}
                        )
                    ">

                    Cancelar

                </button>
            `;
        }


        return `

            <div class="
                d-flex
                gap-2
                flex-wrap">

                ${acciones}

            </div>
        `;
    }


    if (
        estado === "PROCESANDO"
    ) {

        if (
            !puedeGestionarEstado()
        ) {

            return `
                <span class="
                    text-primary
                    fw-semibold">

                    Pedido en procesamiento.

                </span>
            `;
        }


        return `

            <div class="
                d-flex
                gap-2
                flex-wrap">

                <button
                    class="
                        btn
                        btn-sm
                        btn-success"

                    onclick="
                        despacharPedido(
                            ${pedido.idPedido}
                        )
                    ">

                    Despachar pedido

                </button>


                <button
                    class="
                        btn
                        btn-sm
                        btn-outline-danger"

                    onclick="
                        cancelarPedido(
                            ${pedido.idPedido}
                        )
                    ">

                    Cancelar

                </button>

            </div>
        `;
    }


    return `
        <span class="text-muted">
            Pedido finalizado.
        </span>
    `;
}


/* =========================================================
   DETALLES
========================================================= */

function crearDetallesPedido(
    pedido
) {

    const detalles =
        pedido.detalles
        ||
        [];


    if (!detalles.length) {

        return `

            <tr>

                <td
                    colspan="3"
                    class="
                        text-center
                        text-muted">

                    El pedido todavía
                    no tiene productos.

                </td>

            </tr>
        `;
    }


    const editable =
        obtenerEstado(
            pedido
        ) === "PENDIENTE";


    return detalles
        .map(
            detalle => `

                <tr>

                    <td>

                        <strong>

                            ${escapar(
                                detalle.producto
                            )}

                        </strong>

                    </td>


                    <td>

                        ${formatearNumero(
                            detalle.cantidad
                        )}

                    </td>


                    <td class="text-end">

                        ${
                            editable
                                ? crearBotonesDetalle(
                                    pedido,
                                    detalle
                                )
                                : "-"
                        }

                    </td>

                </tr>
            `
        )
        .join("");
}


function crearBotonesDetalle(
    pedido,
    detalle
) {

    return `

        <button
            class="
                btn
                btn-sm
                btn-outline-primary
                me-1"

            onclick="
                abrirEditarCantidad(
                    ${pedido.idPedido},
                    ${detalle.idProducto}
                )
            ">

            Editar

        </button>


        <button
            class="
                btn
                btn-sm
                btn-outline-danger"

            onclick="
                eliminarProducto(
                    ${pedido.idPedido},
                    ${detalle.idProducto}
                )
            ">

            Eliminar

        </button>
    `;
}


/* =========================================================
   VISTAS
========================================================= */

function mostrarVista(
    vista
) {

    vistaActual =
        vista;


    const filtro =
        $("filtroEstado");


    if (
        vista === "activos"
        &&
        [
            "DESPACHADO",
            "CANCELADO"
        ].includes(
            filtro?.value
        )
    ) {

        filtro.value = "";
    }


    if (
        vista === "historial"
        &&
        [
            "PENDIENTE",
            "PROCESANDO"
        ].includes(
            filtro?.value
        )
    ) {

        filtro.value = "";
    }


    actualizarVistaVisual();

    renderizarPedidos();
}


function cambiarFiltroEstado() {

    const estado =
        $("filtroEstado")
            ?.value;


    if (
        [
            "DESPACHADO",
            "CANCELADO"
        ].includes(
            estado
        )
    ) {

        vistaActual =
            "historial";
    }


    if (
        [
            "PENDIENTE",
            "PROCESANDO"
        ].includes(
            estado
        )
    ) {

        vistaActual =
            "activos";
    }


    actualizarVistaVisual();

    renderizarPedidos();
}


function actualizarVistaVisual() {

    const historial =
        vistaActual ===
        "historial";


    $("seccionActivos")
        ?.classList
        .toggle(
            "d-none",
            historial
        );


    $("seccionHistorial")
        ?.classList
        .toggle(
            "d-none",
            !historial
        );


    if ($("btnActivos")) {

        $("btnActivos").className =
            historial
                ? "btn btn-outline-secondary"
                : "btn btn-panaderia";
    }


    if ($("btnHistorial")) {

        $("btnHistorial").className =
            historial
                ? "btn btn-panaderia"
                : "btn btn-outline-secondary";
    }
}


/* =========================================================
   RESUMEN
========================================================= */

function actualizarResumen() {

    const resumen = {

        totalPedidos:
            pedidos.length,

        totalPendientes:
            contarEstado(
                "PENDIENTE"
            ),

        totalProcesando:
            contarEstado(
                "PROCESANDO"
            ),

        totalDespachados:
            contarEstado(
                "DESPACHADO"
            )
    };


    Object.entries(
        resumen
    ).forEach(
        ([id, valor]) => {

            if ($(id)) {
                $(id).textContent =
                    valor;
            }
        }
    );
}


function contarEstado(
    estado
) {

    return pedidos.filter(
        pedido =>
            obtenerEstado(
                pedido
            ) === estado
    ).length;
}


/* =========================================================
   NUEVO PEDIDO
========================================================= */

function abrirNuevoPedido() {

    if (
        !esSucursal()
        &&
        $("sucursalPedido")
    ) {

        $("sucursalPedido").value =
            "";
    }


    if ($("turnoPedido")) {

        $("turnoPedido").value =
            "";
    }


    modalPedido?.show();
}


async function crearPedido() {

    const turno =
        $("turnoPedido")
            ?.value;


    if (!turno) {

        return mostrarMensaje(
            "Debe seleccionar un turno.",
            "warning"
        );
    }


    const datos = {
        turno
    };


    /*
     * SUCURSAL no manda idSucursal.
     * El backend utiliza la sucursal
     * asociada a su cuenta.
     */

    if (!esSucursal()) {

        const idSucursal =
            Number(
                $("sucursalPedido")
                    ?.value
            );


        if (idSucursal <= 0) {

            return mostrarMensaje(
                "Debe seleccionar una sucursal.",
                "warning"
            );
        }


        datos.idSucursal =
            idSucursal;
    }


    await ejecutarOperacion(
        () =>
            apiPost(
                "/pedidos",
                datos
            ),
        "Pedido creado correctamente.",
        modalPedido
    );
}


/* =========================================================
   AGREGAR PRODUCTO
========================================================= */

function abrirDetalle(
    idPedido
) {

    const pedido =
        buscarPedido(
            idPedido
        );


    if (
        !pedido
        ||
        obtenerEstado(
            pedido
        ) !== "PENDIENTE"
    ) {

        return;
    }


    $("idPedidoDetalle").value =
        idPedido;


    $("cantidadPedido").value =
        "";


    llenarProductosPedido(
        idPedido
    );


    modalDetalle?.show();
}


async function agregarProducto() {

    const idPedido =
        Number(
            $("idPedidoDetalle")
                ?.value
        );


    const idProducto =
        Number(
            $("productoPedido")
                ?.value
        );


    const cantidad =
        Number(
            $("cantidadPedido")
                ?.value
        );


    if (idProducto <= 0) {

        return mostrarMensaje(
            "Debe seleccionar un producto.",
            "warning"
        );
    }


    if (
        !Number.isFinite(
            cantidad
        )
        ||
        cantidad <= 0
    ) {

        return mostrarMensaje(
            "Ingrese una cantidad válida mayor que cero.",
            "warning"
        );
    }


    await ejecutarOperacion(

        () =>
            apiPost(
                `/pedidos/${idPedido}/detalles`,
                {
                    idProducto,
                    cantidad
                }
            ),

        "Producto agregado al pedido.",

        modalDetalle
    );
}


/* =========================================================
   EDITAR CANTIDAD
========================================================= */

function abrirEditarCantidad(
    idPedido,
    idProducto
) {

    const pedido =
        buscarPedido(
            idPedido
        );


    if (
        !pedido
        ||
        obtenerEstado(
            pedido
        ) !== "PENDIENTE"
    ) {

        return;
    }


    const detalle =
        (
            pedido.detalles
            ||
            []
        )
            .find(
                d =>
                    Number(
                        d.idProducto
                    )
                    ===
                    Number(
                        idProducto
                    )
            );


    if (!detalle) {
        return;
    }


    $("idPedidoEditar").value =
        idPedido;


    $("idProductoEditar").value =
        idProducto;


    $("nombreProductoEditar")
        .textContent =
        detalle.producto;


    $("cantidadEditar").value =
        detalle.cantidad;


    modalCantidad?.show();
}


async function actualizarCantidad() {

    const idPedido =
        Number(
            $("idPedidoEditar")
                ?.value
        );


    const idProducto =
        Number(
            $("idProductoEditar")
                ?.value
        );


    const cantidad =
        Number(
            $("cantidadEditar")
                ?.value
        );


    if (
        !Number.isFinite(
            cantidad
        )
        ||
        cantidad <= 0
    ) {

        return mostrarMensaje(
            "Ingrese una cantidad válida mayor que cero.",
            "warning"
        );
    }


    await ejecutarOperacion(

        () =>
            apiPut(
                `/pedidos/${idPedido}/detalles/${idProducto}`,
                {
                    cantidad
                }
            ),

        "Cantidad actualizada correctamente.",

        modalCantidad
    );
}


/* =========================================================
   ELIMINAR PRODUCTO
========================================================= */

async function eliminarProducto(
    idPedido,
    idProducto
) {

    if (
        !confirm(
            "¿Está seguro de quitar este producto del pedido?"
        )
    ) {

        return;
    }


    await ejecutarOperacion(

        () =>
            apiDelete(
                `/pedidos/${idPedido}/detalles/${idProducto}`
            ),

        "Producto eliminado del pedido."
    );
}


/* =========================================================
   PROCESAR / CANCELAR / DESPACHAR
========================================================= */

async function procesarPedido(
    idPedido
) {

    if (!puedeGestionarEstado()) {

        return sinPermiso();
    }


    const pedido =
        buscarPedido(
            idPedido
        );


    if (
        !pedido?.detalles?.length
    ) {

        return mostrarMensaje(
            "Debe agregar al menos un producto antes de procesar el pedido.",
            "warning"
        );
    }


    if (
        !confirm(
            "¿Desea enviar este pedido a procesamiento?"
        )
    ) {

        return;
    }


    await ejecutarOperacion(

        () =>
            apiPut(
                `/pedidos/${idPedido}/estado/PROCESANDO`
            ),

        "Pedido enviado a procesamiento."
    );
}


async function cancelarPedido(
    idPedido
) {

    if (!puedeGestionarEstado()) {

        return sinPermiso();
    }


    if (
        !confirm(
            "¿Está seguro de cancelar este pedido?"
        )
    ) {

        return;
    }


    await ejecutarOperacion(

        () =>
            apiPut(
                `/pedidos/${idPedido}/estado/CANCELADO`
            ),

        "Pedido cancelado correctamente."
    );
}


async function despacharPedido(
    idPedido
) {

    if (!puedeGestionarEstado()) {

        return sinPermiso();
    }


    if (
        !confirm(
            "¿Desea despachar este pedido? "
            +
            "Se descontarán los productos del inventario."
        )
    ) {

        return;
    }


    await ejecutarOperacion(

        () =>
            apiPut(
                `/pedidos/${idPedido}/despachar`
            ),

        "Pedido despachado correctamente."
    );
}


function sinPermiso() {

    mostrarMensaje(
        "No tiene permiso para realizar esta operación.",
        "warning"
    );
}


/* =========================================================
   OPERACIONES
========================================================= */

async function ejecutarOperacion(
    operacion,
    mensajeExito,
    modal = null
) {

    const posicion =
        window.scrollY;


    try {

        const resultado =
            await operacion();


        modal?.hide();


        await cargarPedidos();


        requestAnimationFrame(
            () =>
                window.scrollTo(
                    0,
                    posicion
                )
        );


        mostrarMensaje(
            resultado?.mensaje
            ||
            mensajeExito,
            "success"
        );


    } catch (error) {

        console.error(
            "Error en pedidos:",
            error
        );


        mostrarMensaje(
            obtenerMensajeError(
                error
            ),
            "danger"
        );
    }
}


/* =========================================================
   ERRORES
========================================================= */

function obtenerMensajeError(
    error
) {

    const original =
        String(
            error?.message
            ||
            ""
        );


    const mensaje =
        original.toUpperCase();


    const errores = [

        {
            buscar: [
                "NO TIENE PERMISO"
            ],
            texto:
                "No tiene permiso para realizar esta operación."
        },

        {
            buscar: [
                "SUCURSAL ASIGNADA"
            ],
            texto:
                "Su usuario no tiene una sucursal asignada."
        },

        {
            buscar: [
                "NO HAY SUFICIENTE",
                "INVENTARIO INSUFICIENTE"
            ],
            texto:
                "No hay suficiente producto terminado en inventario."
        },

        {
            buscar: [
                "ORA-00001",
                "YA EXISTE",
                "DUPLIC"
            ],
            texto:
                "Ese producto ya se encuentra en el pedido."
        },

        {
            buscar: [
                "PEDIDO NO EXISTE",
                "NO EXISTE EL PEDIDO"
            ],
            texto:
                "El pedido seleccionado no existe."
        },

        {
            buscar: [
                "SIN DETALLE",
                "NO TIENE DETALLE",
                "NO TIENE PRODUCTOS"
            ],
            texto:
                "El pedido debe contener al menos un producto."
        }
    ];


    const encontrado =
        errores.find(
            errorConfig =>
                errorConfig.buscar.some(
                    texto =>
                        mensaje.includes(
                            texto
                        )
                )
        );


    if (encontrado) {

        return encontrado.texto;
    }


    if (
        original
        &&
        !mensaje.includes(
            "ORA-"
        )
    ) {

        return original;
    }


    return "No se pudo realizar la operación.";
}


/* =========================================================
   FILTROS
========================================================= */

function limpiarFiltros() {

    if ($("buscarPedido")) {
        $("buscarPedido").value =
            "";
    }


    if ($("filtroEstado")) {
        $("filtroEstado").value =
            "";
    }


    renderizarPedidos();
}


/* =========================================================
   AUXILIARES
========================================================= */

function buscarPedido(
    idPedido
) {

    return pedidos.find(
        pedido =>
            Number(
                pedido.idPedido
            )
            ===
            Number(
                idPedido
            )
    );
}


function obtenerEstado(
    pedido
) {

    return String(
        pedido?.estado
        ||
        ""
    ).toUpperCase();
}


function claseEstado(
    estado
) {

    const clases = {

        PENDIENTE:
            "bg-warning text-dark",

        PROCESANDO:
            "bg-primary",

        DESPACHADO:
            "bg-success",

        CANCELADO:
            "bg-danger"
    };


    return clases[estado]
        ||
        "bg-secondary";
}


/* =========================================================
   NOTIFICACIONES
========================================================= */

function mostrarMensaje(
    texto,
    tipo = "info"
) {

    let contenedor =
        $("notificaciones");


    if (!contenedor) {

        contenedor =
            document.createElement(
                "div"
            );


        contenedor.id =
            "notificaciones";


        contenedor.className =
            "position-fixed top-0 end-0 p-3";


        Object.assign(
            contenedor.style,
            {
                zIndex: "3000",
                width: "400px",
                maxWidth: "95%"
            }
        );


        document.body.appendChild(
            contenedor
        );
    }


    const alerta =
        document.createElement(
            "div"
        );


    alerta.className =
        `alert alert-${tipo} `
        +
        "alert-dismissible fade show shadow";


    const mensaje =
        document.createElement(
            "span"
        );


    mensaje.textContent =
        texto;


    const cerrar =
        document.createElement(
            "button"
        );


    cerrar.type =
        "button";


    cerrar.className =
        "btn-close";


    cerrar.setAttribute(
        "data-bs-dismiss",
        "alert"
    );


    alerta.append(
        mensaje,
        cerrar
    );


    contenedor.appendChild(
        alerta
    );


    setTimeout(
        () => {

            if (alerta.isConnected) {

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
   FORMATOS
========================================================= */

function formatearNumero(
    valor
) {

    const numero =
        Number(
            valor
        );


    return Number.isFinite(
        numero
    )
        ? numero.toLocaleString(
            "es-GT",
            {
                maximumFractionDigits:
                    2
            }
        )
        : "0";
}


function formatearFecha(
    fecha
) {

    if (!fecha) {
        return "";
    }


    const valor =
        new Date(
            fecha
        );


    return Number.isNaN(
        valor.getTime()
    )
        ? String(fecha)
        : valor.toLocaleString(
            "es-GT"
        );
}


function formatearTurno(
    turno
) {

    const valor =
        String(
            turno
            ||
            ""
        ).toUpperCase();


    const turnos = {

        MANANA:
            "Mañana",

        TARDE:
            "Tarde"
    };


    return turnos[valor]
        ||
        turno
        ||
        "";
}


/* =========================================================
   SEGURIDAD HTML
========================================================= */

function escapar(
    valor
) {

    if (
        valor === null
        ||
        valor === undefined
    ) {

        return "";
    }


    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(
            valor
        );


    return div.innerHTML;
}