const API_AUTH =
    window.PANADERIA_CONFIG.API_BASE;

document.addEventListener(
    "DOMContentLoaded",
    validarAcceso
);


/* =========================================================
   PERMISOS POR ROL
========================================================= */

const PERMISOS_ROL = {

    ADMIN: [
        "panel.html",
        "productos.html",
        "sucursales.html",
        "recetas.html",
        "inventario.html",
        "produccion.html",
        "pedidos.html",
        "usuarios.html"
    ],

    PRODUCCION: [
        "panel.html",
        "recetas.html",
        "inventario.html",
        "produccion.html",
        "pedidos.html"
    ],

    SUCURSAL: [
        "panel.html",
        "pedidos.html"
    ]
};



/* =========================================================
   VALIDAR ACCESO
========================================================= */

async function validarAcceso() {

    const token =
        localStorage.getItem(
            "panaderia_token"
        );


    if (!token) {

        enviarAlLogin();

        return;
    }


    try {

        const respuesta =
            await fetch(
                API_AUTH + "/auth/sesion",
                {
                    method: "GET",

                    headers: {

                        "Authorization":
                            "Bearer " + token
                    }
                }
            );


        if (!respuesta.ok) {

            throw new Error(
                "Sesión no válida."
            );
        }


        const usuario =
            await respuesta.json();


        window.USUARIO_ACTUAL =
            usuario;


        localStorage.setItem(
            "panaderia_usuario",
            JSON.stringify(usuario)
        );


        if (!validarPermisoPagina(usuario)) {

            return;
        }


        configurarMenuPorRol(
            usuario
        );


        mostrarSesionSoloEnInicio(
            usuario
        );


    } catch (error) {

        console.error(error);

        limpiarSesion();

        enviarAlLogin();
    }
}



/* =========================================================
   VALIDAR PAGINA ACTUAL
========================================================= */

function validarPermisoPagina(
    usuario
) {

    const paginaActual =
        obtenerPaginaActual();


    const permisos =
        PERMISOS_ROL[
            usuario.rol
        ];


    if (!permisos) {

        limpiarSesion();

        enviarAlLogin();

        return false;
    }


    if (
        !permisos.includes(
            paginaActual
        )
    ) {

        window.location.replace(
            "panel.html"
        );

        return false;
    }


    return true;
}



/* =========================================================
   CONFIGURAR MENU
========================================================= */

function configurarMenuPorRol(
    usuario
) {

    const nav =
        document.querySelector(
            ".sidebar nav"
        );


    if (!nav) {

        return;
    }


    /* -----------------------------------------------------
       AGREGAR USUARIOS PARA ADMIN
    ----------------------------------------------------- */

    let enlaceUsuarios =
        nav.querySelector(
            'a[href="usuarios.html"]'
        );


    if (
        usuario.rol === "ADMIN"
        &&
        !enlaceUsuarios
    ) {

        enlaceUsuarios =
            document.createElement(
                "a"
            );


        enlaceUsuarios.href =
            "usuarios.html";


        enlaceUsuarios.className =
            "menu-link";


        enlaceUsuarios.textContent =
            "Usuarios";


        nav.appendChild(
            enlaceUsuarios
        );
    }


    /* -----------------------------------------------------
       MOSTRAR / OCULTAR OPCIONES
    ----------------------------------------------------- */

    const permisos =
        PERMISOS_ROL[
            usuario.rol
        ] || [];


    const enlaces =
        nav.querySelectorAll(
            ".menu-link"
        );


    enlaces.forEach(
        function (enlace) {

            const href =
                enlace.getAttribute(
                    "href"
                );


            if (!href) {

                return;
            }


            const pagina =
                href
                    .split("/")
                    .pop()
                    .toLowerCase();


            if (
                permisos.includes(
                    pagina
                )
            ) {

                enlace.classList.remove(
                    "d-none"
                );

            } else {

                enlace.classList.add(
                    "d-none"
                );
            }
        }
    );


    /* -----------------------------------------------------
       SUCURSAL: CAMBIAR PEDIDOS POR MIS PEDIDOS
    ----------------------------------------------------- */

    const enlacePedidos =
        nav.querySelector(
            'a[href="pedidos.html"]'
        );


    if (enlacePedidos) {

        if (
            usuario.rol ===
            "SUCURSAL"
        ) {

            enlacePedidos.textContent =
                "Mis pedidos";

        } else {

            enlacePedidos.textContent =
                "Pedidos";
        }
    }


    /* -----------------------------------------------------
       MARCAR USUARIOS ACTIVO
    ----------------------------------------------------- */

    const paginaActual =
        obtenerPaginaActual();


    if (
        enlaceUsuarios
        &&
        paginaActual ===
        "usuarios.html"
    ) {

        enlaceUsuarios
            .classList
            .add("activo");
    }
}



/* =========================================================
   SESION SOLO EN INICIO
========================================================= */

function mostrarSesionSoloEnInicio(
    usuario
) {

    const paginaActual =
        obtenerPaginaActual();


    if (
        paginaActual !==
        "panel.html"
    ) {

        return;
    }


    const anterior =
        document.getElementById(
            "barraSesion"
        );


    if (anterior) {

        anterior.remove();
    }


    const contenido =
        document.querySelector(
            ".contenido"
        );


    if (!contenido) {

        return;
    }


    const barra =
        document.createElement(
            "div"
        );


    barra.id =
        "barraSesion";


    barra.className =
        "barra-sesion";


    let sucursalTexto = "";


    if (
        usuario.rol === "SUCURSAL"
        &&
        usuario.idSucursal
    ) {

        sucursalTexto = `

            <span>
                Sucursal asignada:
                ${usuario.idSucursal}
            </span>
        `;
    }


    barra.innerHTML = `

        <div class="barra-sesion-usuario">

            <div>

                <small>
                    SESIÓN ACTIVA
                </small>

                <strong>
                    ${escaparHtml(
                        usuario.nombreCompleto
                    )}
                </strong>

                <span>
                    ${escaparHtml(
                        usuario.rol
                    )}
                </span>

                ${sucursalTexto}

            </div>

        </div>


        <button
            type="button"
            class="btn btn-cerrar-sesion-superior"
            onclick="cerrarSesion()">

            Cerrar sesión

        </button>
    `;


    contenido.prepend(
        barra
    );
}



/* =========================================================
   OBTENER PAGINA ACTUAL
========================================================= */

function obtenerPaginaActual() {

    const ruta =
        window.location.pathname;


    let pagina =
        ruta.substring(
            ruta.lastIndexOf("/") + 1
        );


    pagina =
        pagina.toLowerCase();


    if (!pagina) {

        return "panel.html";
    }


    return pagina;
}



/* =========================================================
   CERRAR SESION
========================================================= */

async function cerrarSesion() {

    const token =
        localStorage.getItem(
            "panaderia_token"
        );


    try {

        if (token) {

            await fetch(
                API_AUTH + "/auth/logout",
                {
                    method: "POST",

                    headers: {

                        "Authorization":
                            "Bearer " + token
                    }
                }
            );
        }

    } catch (error) {

        console.error(
            "No fue posible cerrar la sesión en el servidor:",
            error
        );

    } finally {

        limpiarSesion();

        enviarAlLogin();
    }
}



/* =========================================================
   LIMPIAR SESION
========================================================= */

function limpiarSesion() {

    localStorage.removeItem(
        "panaderia_token"
    );


    localStorage.removeItem(
        "panaderia_usuario"
    );
}



/* =========================================================
   ENVIAR AL LOGIN
========================================================= */

function enviarAlLogin() {

    window.location.replace(
        "login.html"
    );
}



/* =========================================================
   ESCAPAR HTML
========================================================= */

function escaparHtml(valor) {

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
        String(valor);


    return div.innerHTML;
}