/* =========================================================
   USUARIOS.JS
   Panadería San Carlos
========================================================= */

const API_USUARIOS =
    "http://localhost:8080/PanaderiaWeb/webapi";

const $ = id =>
    document.getElementById(id);

let usuarios = [];
let roles = [];
let sucursales = [];


/* =========================================================
   INICIO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    iniciarUsuarios
);


async function iniciarUsuarios() {

    const usuario =
        obtenerUsuarioSesion();


    if (
        !usuario ||
        usuario.rol !== "ADMIN"
    ) {

        window.location.replace(
            "panel.html"
        );

        return;
    }


    $("buscarUsuario")
        ?.addEventListener(
            "input",
            renderizarUsuarios
        );


    try {

        await Promise.all([
            cargarRoles(),
            cargarSucursales()
        ]);


        await cargarUsuarios();


    } catch (error) {

        console.error(error);

        mostrarMensajeUsuarios(
            error.message ||
            "No fue posible cargar la información.",
            "danger"
        );
    }
}


/* =========================================================
   SESIÓN
========================================================= */

function obtenerTokenUsuarios() {

    return localStorage.getItem(
        "panaderia_token"
    );
}


function obtenerUsuarioSesion() {

    try {

        const datos =
            localStorage.getItem(
                "panaderia_usuario"
            );


        return datos
            ? JSON.parse(datos)
            : null;


    } catch (error) {

        console.error(error);

        return null;
    }
}


/* =========================================================
   PETICIONES PRIVADAS
========================================================= */

async function fetchPrivado(
    ruta,
    opciones = {}
) {

    const token =
        obtenerTokenUsuarios();


    if (!token) {

        window.location.replace(
            "login.html"
        );

        throw new Error(
            "Debe iniciar sesión."
        );
    }


    const respuesta =
        await fetch(
            API_USUARIOS + ruta,
            {
                ...opciones,

                headers: {

                    "Content-Type":
                        "application/json",

                    "Authorization":
                        "Bearer " + token,

                    ...(opciones.headers || {})
                }
            }
        );


    let datos = null;


    try {

        datos =
            await respuesta.json();

    } catch (error) {

        datos = null;
    }


    if (!respuesta.ok) {

        if (respuesta.status === 401) {

            localStorage.removeItem(
                "panaderia_token"
            );

            localStorage.removeItem(
                "panaderia_usuario"
            );

            window.location.replace(
                "login.html"
            );
        }


        throw new Error(
            datos?.mensaje ||
            "No fue posible realizar la operación."
        );
    }


    return datos;
}


/* =========================================================
   CARGAR USUARIOS
========================================================= */

async function cargarUsuarios() {

    usuarios =
        await fetchPrivado(
            "/usuarios"
        );


    actualizarResumenUsuarios();

    renderizarUsuarios();
}


/* =========================================================
   CARGAR ROLES
========================================================= */

async function cargarRoles() {

    roles =
        await fetchPrivado(
            "/usuarios/roles"
        );


    const select =
        $("rolUsuario");


    if (!select) {
        return;
    }


    select.innerHTML =
        '<option value="">Seleccione...</option>';


    roles.forEach(
        rol => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                rol.idRol;


            option.textContent =
                rol.nombre;


            select.appendChild(
                option
            );
        }
    );
}


/* =========================================================
   CARGAR SUCURSALES
   CORREGIDO: AHORA ENVÍA EL TOKEN
========================================================= */

async function cargarSucursales() {

    sucursales =
        await fetchPrivado(
            "/sucursales"
        );


    const select =
        $("sucursalUsuario");


    if (!select) {
        return;
    }


    select.innerHTML =
        '<option value="">Seleccione...</option>';


    sucursales
        .filter(
            sucursal =>
                Number(
                    sucursal.estado
                ) === 1
        )
        .forEach(
            sucursal => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    sucursal.idSucursal;


                option.textContent =
                    sucursal.nombre;


                select.appendChild(
                    option
                );
            }
        );
}


/* =========================================================
   MOSTRAR USUARIOS
========================================================= */

function renderizarUsuarios() {

    const tbody =
        $("tablaUsuarios");


    if (!tbody) {
        return;
    }


    const busqueda =
        ($("buscarUsuario")?.value || "")
            .trim()
            .toUpperCase();


    const filtrados =
        usuarios.filter(
            usuario => {

                const texto = [

                    usuario.nombreCompleto,
                    usuario.nombreUsuario,
                    usuario.rol,
                    usuario.sucursal,
                    usuario.estado

                ]
                    .filter(Boolean)
                    .join(" ")
                    .toUpperCase();


                return texto.includes(
                    busqueda
                );
            }
        );


    if (!filtrados.length) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="text-center text-muted">

                    No se encontraron usuarios.

                </td>

            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        filtrados
            .map(crearFilaUsuario)
            .join("");
}


/* =========================================================
   FILA DE USUARIO
========================================================= */

function crearFilaUsuario(
    usuario
) {

    const activo =
        usuario.estado === "ACTIVO";


    const sucursal =
        usuario.sucursal ||
        "No aplica";


    return `

        <tr>

            <td>
                ${usuario.idUsuario}
            </td>

            <td>
                ${escaparUsuario(
                    usuario.nombreCompleto
                )}
            </td>

            <td>
                ${escaparUsuario(
                    usuario.nombreUsuario
                )}
            </td>

            <td>

                <span class="badge bg-secondary">

                    ${escaparUsuario(
                        usuario.rol
                    )}

                </span>

            </td>

            <td>

                ${escaparUsuario(
                    sucursal
                )}

            </td>

            <td>

                <span
                    class="badge ${
                        activo
                            ? "bg-success"
                            : "bg-secondary"
                    }">

                    ${escaparUsuario(
                        usuario.estado
                    )}

                </span>

            </td>

            <td>

                ${formatearFechaUsuario(
                    usuario.fechaCreacion
                )}

            </td>

            <td class="text-center">

                <div class="
                    d-flex
                    gap-1
                    justify-content-center
                    flex-wrap">

                    <button
                        type="button"
                        class="
                            btn
                            btn-sm
                            btn-outline-primary"

                        onclick="
                            editarUsuario(
                                ${usuario.idUsuario}
                            )
                        ">

                        Editar

                    </button>


                    <button
                        type="button"
                        class="
                            btn
                            btn-sm
                            btn-outline-dark"

                        onclick="
                            abrirPassword(
                                ${usuario.idUsuario}
                            )
                        ">

                        Contraseña

                    </button>


                    <button
                        type="button"

                        class="
                            btn
                            btn-sm
                            ${
                                activo
                                    ? "btn-outline-danger"
                                    : "btn-outline-success"
                            }
                        "

                        onclick="
                            cambiarEstadoUsuario(
                                ${usuario.idUsuario}
                            )
                        ">

                        ${
                            activo
                                ? "Desactivar"
                                : "Activar"
                        }

                    </button>

                </div>

            </td>

        </tr>
    `;
}


/* =========================================================
   RESUMEN
========================================================= */

function actualizarResumenUsuarios() {

    if ($("totalUsuarios")) {

        $("totalUsuarios").textContent =
            usuarios.length;
    }


    if ($("totalActivos")) {

        $("totalActivos").textContent =
            usuarios.filter(
                usuario =>
                    usuario.estado ===
                    "ACTIVO"
            ).length;
    }


    if ($("totalInactivos")) {

        $("totalInactivos").textContent =
            usuarios.filter(
                usuario =>
                    usuario.estado ===
                    "INACTIVO"
            ).length;
    }
}


/* =========================================================
   NUEVO USUARIO
========================================================= */

function abrirNuevoUsuario() {

    $("tituloModalUsuario").textContent =
        "Nuevo usuario";


    $("idUsuario").value =
        "";


    $("nombreCompleto").value =
        "";


    $("nombreUsuario").value =
        "";


    $("passwordUsuario").value =
        "";


    $("rolUsuario").value =
        "";


    $("sucursalUsuario").value =
        "";


    $("grupoPassword")
        .classList
        .remove(
            "d-none"
        );


    ocultarSucursalUsuario();


    bootstrap.Modal
        .getOrCreateInstance(
            $("modalUsuario")
        )
        .show();
}


/* =========================================================
   EDITAR USUARIO
========================================================= */

function editarUsuario(
    idUsuario
) {

    const usuario =
        usuarios.find(
            usuario =>
                Number(
                    usuario.idUsuario
                ) ===
                Number(
                    idUsuario
                )
        );


    if (!usuario) {
        return;
    }


    $("tituloModalUsuario").textContent =
        "Editar usuario";


    $("idUsuario").value =
        usuario.idUsuario;


    $("nombreCompleto").value =
        usuario.nombreCompleto || "";


    $("nombreUsuario").value =
        usuario.nombreUsuario || "";


    $("rolUsuario").value =
        usuario.idRol;


    $("grupoPassword")
        .classList
        .add(
            "d-none"
        );


    cambiarRolUsuario();


    $("sucursalUsuario").value =
        usuario.idSucursal || "";


    bootstrap.Modal
        .getOrCreateInstance(
            $("modalUsuario")
        )
        .show();
}


/* =========================================================
   CAMBIAR ROL
========================================================= */

function cambiarRolUsuario() {

    const idRol =
        Number(
            $("rolUsuario").value
        );


    const rol =
        roles.find(
            rol =>
                Number(
                    rol.idRol
                ) === idRol
        );


    if (
        rol &&
        rol.nombre === "SUCURSAL"
    ) {

        $("grupoSucursalUsuario")
            .classList
            .remove(
                "d-none"
            );

        return;
    }


    ocultarSucursalUsuario();
}


function ocultarSucursalUsuario() {

    $("grupoSucursalUsuario")
        ?.classList
        .add(
            "d-none"
        );


    if ($("sucursalUsuario")) {

        $("sucursalUsuario").value =
            "";
    }
}


/* =========================================================
   GUARDAR USUARIO
========================================================= */

async function guardarUsuario() {

    const idUsuario =
        $("idUsuario")
            .value;


    const nombreCompleto =
        $("nombreCompleto")
            .value
            .trim();


    const nombreUsuario =
        $("nombreUsuario")
            .value
            .trim();


    const password =
        $("passwordUsuario")
            .value;


    const idRol =
        Number(
            $("rolUsuario").value
        );


    const rol =
        roles.find(
            rol =>
                Number(
                    rol.idRol
                ) === idRol
        );


    let idSucursal =
        null;


    if (
        rol?.nombre ===
        "SUCURSAL"
    ) {

        const valor =
            $("sucursalUsuario")
                .value;


        if (!valor) {

            mostrarMensajeUsuarios(
                "Debe seleccionar la sucursal.",
                "warning"
            );

            return;
        }


        idSucursal =
            Number(valor);
    }


    if (
        !nombreCompleto ||
        !nombreUsuario ||
        !idRol
    ) {

        mostrarMensajeUsuarios(
            "Complete todos los campos obligatorios.",
            "warning"
        );

        return;
    }


    if (
        !idUsuario &&
        password.length < 6
    ) {

        mostrarMensajeUsuarios(
            "La contraseña debe tener al menos 6 caracteres.",
            "warning"
        );

        return;
    }


    const datos = {

        nombreCompleto,
        nombreUsuario,
        idRol,
        idSucursal
    };


    try {

        if (idUsuario) {

            await fetchPrivado(
                "/usuarios/"
                +
                idUsuario,
                {
                    method:
                        "PUT",

                    body:
                        JSON.stringify(
                            datos
                        )
                }
            );


            mostrarMensajeUsuarios(
                "Usuario modificado correctamente.",
                "success"
            );


        } else {

            datos.password =
                password;


            await fetchPrivado(
                "/usuarios",
                {
                    method:
                        "POST",

                    body:
                        JSON.stringify(
                            datos
                        )
                }
            );


            mostrarMensajeUsuarios(
                "Usuario creado correctamente.",
                "success"
            );
        }


        cerrarModalUsuario();

        await cargarUsuarios();


    } catch (error) {

        console.error(error);


        mostrarMensajeUsuarios(
            limpiarErrorOracle(
                error.message
            ),
            "danger"
        );
    }
}


/* =========================================================
   ACTIVAR / DESACTIVAR
========================================================= */

async function cambiarEstadoUsuario(
    idUsuario
) {

    const usuario =
        usuarios.find(
            usuario =>
                Number(
                    usuario.idUsuario
                ) ===
                Number(
                    idUsuario
                )
        );


    if (!usuario) {
        return;
    }


    const sesion =
        obtenerUsuarioSesion();


    if (
        Number(
            sesion?.idUsuario
        )
        ===
        Number(
            idUsuario
        )
    ) {

        mostrarMensajeUsuarios(
            "No puede desactivar su propio usuario mientras tiene la sesión iniciada.",
            "warning"
        );

        return;
    }


    const nuevoEstado =
        usuario.estado ===
        "ACTIVO"

            ? "INACTIVO"
            : "ACTIVO";


    const accion =
        nuevoEstado ===
        "ACTIVO"

            ? "activar"
            : "desactivar";


    if (
        !confirm(
            `¿Desea ${accion} al usuario ${usuario.nombreUsuario}?`
        )
    ) {

        return;
    }


    try {

        await fetchPrivado(

            `/usuarios/${idUsuario}/estado/${nuevoEstado}`,

            {
                method:
                    "PUT"
            }
        );


        mostrarMensajeUsuarios(
            "Estado actualizado correctamente.",
            "success"
        );


        await cargarUsuarios();


    } catch (error) {

        mostrarMensajeUsuarios(
            limpiarErrorOracle(
                error.message
            ),
            "danger"
        );
    }
}


/* =========================================================
   CONTRASEÑA
========================================================= */

function abrirPassword(
    idUsuario
) {

    const usuario =
        usuarios.find(
            usuario =>
                Number(
                    usuario.idUsuario
                ) ===
                Number(
                    idUsuario
                )
        );


    if (!usuario) {
        return;
    }


    $("idUsuarioPassword").value =
        idUsuario;


    $("nombreUsuarioPassword")
        .textContent =

        `${usuario.nombreCompleto} (${usuario.nombreUsuario})`;


    $("nuevaPassword").value =
        "";


    bootstrap.Modal
        .getOrCreateInstance(
            $("modalPassword")
        )
        .show();
}


async function actualizarPassword() {

    const idUsuario =
        $("idUsuarioPassword")
            .value;


    const password =
        $("nuevaPassword")
            .value;


    if (
        password.length < 6
    ) {

        mostrarMensajeUsuarios(
            "La contraseña debe tener al menos 6 caracteres.",
            "warning"
        );

        return;
    }


    try {

        await fetchPrivado(

            `/usuarios/${idUsuario}/password`,

            {
                method:
                    "PUT",

                body:
                    JSON.stringify({
                        password
                    })
            }
        );


        bootstrap.Modal
            .getInstance(
                $("modalPassword")
            )
            ?.hide();


        mostrarMensajeUsuarios(
            "Contraseña actualizada correctamente.",
            "success"
        );


    } catch (error) {

        mostrarMensajeUsuarios(
            limpiarErrorOracle(
                error.message
            ),
            "danger"
        );
    }
}


/* =========================================================
   CERRAR MODAL
========================================================= */

function cerrarModalUsuario() {

    bootstrap.Modal
        .getInstance(
            $("modalUsuario")
        )
        ?.hide();
}


/* =========================================================
   BÚSQUEDA
========================================================= */

function limpiarBusquedaUsuarios() {

    $("buscarUsuario").value =
        "";


    renderizarUsuarios();
}


/* =========================================================
   MENSAJES
========================================================= */

function mostrarMensajeUsuarios(
    mensaje,
    tipo
) {

    const contenedor =
        $("mensajeUsuarios");


    if (!contenedor) {
        return;
    }


    contenedor.innerHTML = `

        <div
            class="alert alert-${tipo}">

            ${escaparUsuario(
                mensaje
            )}

        </div>
    `;


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    setTimeout(
        () => {

            contenedor.innerHTML =
                "";

        },
        4500
    );
}


/* =========================================================
   LIMPIAR MENSAJE ORACLE
========================================================= */

function limpiarErrorOracle(
    mensaje
) {

    if (!mensaje) {

        return "Ocurrió un error.";
    }


    const coincidencia =
        mensaje.match(
            /ORA-\d+:\s*([^\n\r]+)/
        );


    return coincidencia
        ? coincidencia[1]
        : mensaje;
}


/* =========================================================
   FECHA
========================================================= */

function formatearFechaUsuario(
    fecha
) {

    if (!fecha) {

        return "-";
    }


    const valor =
        new Date(
            fecha
        );


    if (
        Number.isNaN(
            valor.getTime()
        )
    ) {

        return "-";
    }


    return valor.toLocaleDateString(
        "es-GT"
    );
}


/* =========================================================
   TEXTO SEGURO
========================================================= */

function escaparUsuario(
    valor
) {

    if (
        valor === null ||
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