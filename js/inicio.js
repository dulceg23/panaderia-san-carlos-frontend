/* =========================================================
   INICIO.JS
   Panel principal por rol
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    cargarDashboard
);


let graficaPedidos = null;


/* =========================================================
   CARGAR PANEL
========================================================= */

async function cargarDashboard() {

    const usuario =
        obtenerUsuarioDashboard();


    if (!usuario) {

        mostrarErrorDashboard(
            "No fue posible identificar al usuario."
        );

        return;
    }


    const rol =
        String(
            usuario.rol || ""
        )
            .trim()
            .toUpperCase();


    try {

        switch (rol) {

            case "ADMIN":

                await cargarDashboardAdmin();

                break;


            case "PRODUCCION":

                await cargarDashboardProduccion();

                break;


            case "SUCURSAL":

                await cargarDashboardSucursal();

                break;


            default:

                throw new Error(
                    "El rol del usuario no es válido."
                );
        }


    } catch (error) {

        console.error(
            "Error al cargar el panel:",
            error
        );


        mostrarErrorDashboard(
            error.message ||
            "No fue posible cargar el panel."
        );
    }
}


/* =========================================================
   ADMIN
========================================================= */

async function cargarDashboardAdmin() {

    const [
        productos,
        sucursales,
        recetas,
        bajos,
        pedidos
    ] =
        await Promise.all([

            apiGet(
                "/productos"
            ),

            apiGet(
                "/sucursales"
            ),

            apiGet(
                "/recetas"
            ),

            apiGet(
                "/inventario/bajo"
            ),

            apiGet(
                "/pedidos"
            )

        ]);


    configurarTarjeta(
        "totalProductos",
        "Productos",
        productos.length,
        "Productos registrados"
    );


    configurarTarjeta(
        "totalSucursales",
        "Sucursales",
        sucursales.length,
        "Sucursales registradas"
    );


    configurarTarjeta(
        "totalRecetas",
        "Recetas",
        recetas.length,
        "Recetas registradas"
    );


    configurarTarjeta(
        "totalBajos",
        "Existencias bajas",
        bajos.length,
        "Productos por abastecer"
    );


    renderizarGraficaPedidos(
        pedidos
    );
}


/* =========================================================
   PRODUCCION
========================================================= */

async function cargarDashboardProduccion() {

    const [
        recetas,
        bajos,
        producciones,
        pedidos
    ] =
        await Promise.all([

            apiGet(
                "/recetas"
            ),

            apiGet(
                "/inventario/bajo"
            ),

            apiGet(
                "/produccion"
            ),

            apiGet(
                "/pedidos"
            )

        ]);


    const pendientes =
        pedidos.filter(
            pedido =>
                obtenerEstadoPedido(
                    pedido
                ) === "PENDIENTE"
        );


    configurarTarjeta(
        "totalProductos",
        "Recetas",
        recetas.length,
        "Recetas disponibles"
    );


    configurarTarjeta(
        "totalSucursales",
        "Existencias bajas",
        bajos.length,
        "Productos por abastecer"
    );


    configurarTarjeta(
        "totalRecetas",
        "Producciones",
        producciones.length,
        "Registros de producción"
    );


    configurarTarjeta(
        "totalBajos",
        "Pedidos pendientes",
        pendientes.length,
        "Pedidos por procesar"
    );


    renderizarGraficaPedidos(
        pedidos
    );
}


/* =========================================================
   SUCURSAL
========================================================= */

async function cargarDashboardSucursal() {

    const [
        productos,
        pedidos
    ] =
        await Promise.all([

            apiGet(
                "/productos"
            ),

            apiGet(
                "/pedidos"
            )

        ]);


    /*
     * El backend ya entrega únicamente
     * los pedidos de la sucursal actual.
     */

    const productosFinales =
        productos.filter(
            producto =>

                Number(
                    producto.idTipoProducto
                ) === 1

                &&

                Number(
                    producto.estado
                ) === 1
        );


    const pendientes =
        pedidos.filter(
            pedido =>
                obtenerEstadoPedido(
                    pedido
                ) === "PENDIENTE"
        );


    const procesando =
        pedidos.filter(
            pedido =>
                obtenerEstadoPedido(
                    pedido
                ) === "PROCESANDO"
        );


    configurarTarjeta(
        "totalProductos",
        "Productos disponibles",
        productosFinales.length,
        "Productos que puede solicitar"
    );


    configurarTarjeta(
        "totalSucursales",
        "Mis pedidos",
        pedidos.length,
        "Pedidos de su sucursal"
    );


    configurarTarjeta(
        "totalRecetas",
        "Pendientes",
        pendientes.length,
        "Pedidos pendientes"
    );


    configurarTarjeta(
        "totalBajos",
        "En procesamiento",
        procesando.length,
        "Pedidos en producción"
    );


    renderizarGraficaPedidos(
        pedidos
    );
}


/* =========================================================
   TARJETAS
========================================================= */

function configurarTarjeta(
    idValor,
    titulo,
    valor,
    descripcion
) {

    const elemento =
        document.getElementById(
            idValor
        );


    if (!elemento) {
        return;
    }


    elemento.textContent =
        valor;


    const cuerpo =
        elemento.closest(
            ".card-body"
        );


    if (!cuerpo) {
        return;
    }


    const tituloElemento =
        cuerpo.querySelector(
            "h6"
        );


    if (tituloElemento) {

        tituloElemento.textContent =
            titulo;
    }


    const descripcionElemento =
        cuerpo.querySelector(
            "p"
        );


    if (descripcionElemento) {

        descripcionElemento.textContent =
            descripcion;
    }
}


/* =========================================================
   GRAFICA DE PEDIDOS
========================================================= */

function renderizarGraficaPedidos(
    pedidos = []
) {

    const canvas =
        document.getElementById(
            "graficaPedidos"
        );


    if (
        !canvas ||
        typeof Chart === "undefined"
    ) {

        return;
    }


    const estados = {

        PENDIENTE: 0,
        PROCESANDO: 0,
        DESPACHADO: 0,
        CANCELADO: 0
    };


    pedidos.forEach(
        pedido => {

            const estado =
                obtenerEstadoPedido(
                    pedido
                );


            if (
                Object.prototype
                    .hasOwnProperty
                    .call(
                        estados,
                        estado
                    )
            ) {

                estados[estado]++;
            }
        }
    );


    if (graficaPedidos) {

        graficaPedidos.destroy();
    }


    graficaPedidos =
        new Chart(
            canvas,
            {

                type:
                    "doughnut",

                data: {

                    labels: [
                        "Pendientes",
                        "Procesando",
                        "Despachados",
                        "Cancelados"
                    ],

                    datasets: [

                        {

                            data: [
                                estados.PENDIENTE,
                                estados.PROCESANDO,
                                estados.DESPACHADO,
                                estados.CANCELADO
                            ],

                            backgroundColor: [
                                "#d6a64f",
                                "#6b4a3f",
                                "#5f8d6a",
                                "#a55b5b"
                            ],

                            borderWidth:
                                2,

                            borderColor:
                                "#ffffff"
                        }
                    ]
                },


                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    cutout:
                        "62%",

                    plugins: {

                        legend: {

                            position:
                                "bottom",

                            labels: {

                                usePointStyle:
                                    true,

                                padding:
                                    18
                            }
                        }
                    }
                }
            }
        );
}


/* =========================================================
   USUARIO
========================================================= */

function obtenerUsuarioDashboard() {

    const datos =
        localStorage.getItem(
            "panaderia_usuario"
        );


    if (!datos) {

        return null;
    }


    try {

        return JSON.parse(
            datos
        );


    } catch (error) {

        console.error(
            "No fue posible leer el usuario:",
            error
        );


        return null;
    }
}


/* =========================================================
   ESTADO DEL PEDIDO
========================================================= */

function obtenerEstadoPedido(
    pedido
) {

    return String(
        pedido?.estado || ""
    )
        .trim()
        .toUpperCase();
}


/* =========================================================
   ERROR
========================================================= */

function mostrarErrorDashboard(
    mensaje
) {

    const contenedor =
        document.getElementById(
            "mensajeDashboard"
        );


    if (!contenedor) {

        return;
    }


    contenedor.innerHTML = `

        <div
            class="alert alert-danger mb-4">

            ${escaparDashboard(
                mensaje
            )}

        </div>
    `;
}


/* =========================================================
   TEXTO SEGURO
========================================================= */

function escaparDashboard(
    valor
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(
            valor || ""
        );


    return div.innerHTML;
}