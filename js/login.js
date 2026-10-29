const API_LOGIN =
    window.PANADERIA_CONFIG.API_BASE;

document.addEventListener(
    "DOMContentLoaded",
    iniciarLogin
);


function iniciarLogin() {

    const form =
        document.getElementById("formLogin");

    const btnMostrar =
        document.getElementById(
            "btnMostrarPassword"
        );


    form.addEventListener(
        "submit",
        iniciarSesion
    );


    btnMostrar.addEventListener(
        "click",
        mostrarOcultarPassword
    );


    // Si quedó una sesión anterior,
    // por ahora la limpiamos al entrar al login.

    localStorage.removeItem(
        "panaderia_token"
    );

    localStorage.removeItem(
        "panaderia_usuario"
    );
}



/* =========================================================
   INICIAR SESION
========================================================= */

async function iniciarSesion(event) {

    event.preventDefault();


    const usuario =
        document
            .getElementById("usuario")
            .value
            .trim();


    const password =
        document
            .getElementById("password")
            .value;


    if (!usuario || !password) {

        mostrarMensaje(
            "Debe ingresar usuario y contraseña.",
            "warning"
        );

        return;
    }


    const boton =
        document.getElementById(
            "btnLogin"
        );


    boton.disabled = true;

    boton.textContent =
        "Ingresando...";


    try {

        const respuesta =
            await fetch(
                API_LOGIN + "/auth/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        usuario: usuario,
                        password: password
                    })
                }
            );


        const datos =
            await respuesta.json();


        if (!respuesta.ok) {

            throw new Error(
                datos.mensaje
                ||
                "No fue posible iniciar sesión."
            );
        }


        if (!datos.token) {

            throw new Error(
                "El servidor no devolvió una sesión válida."
            );
        }


        guardarSesion(datos);


        mostrarMensaje(
            "Inicio de sesión correcto.",
            "success"
        );


        setTimeout(
            function () {

                window.location.href =
                    "panel.html";

            },
            500
        );


    } catch (error) {

        console.error(error);


        mostrarMensaje(
            error.message
            ||
            "No fue posible iniciar sesión.",
            "danger"
        );


    } finally {

        boton.disabled = false;

        boton.textContent =
            "Iniciar sesión";
    }
}



/* =========================================================
   GUARDAR SESION
========================================================= */

function guardarSesion(usuario) {

    localStorage.setItem(
        "panaderia_token",
        usuario.token
    );


    localStorage.setItem(
        "panaderia_usuario",
        JSON.stringify({
            idUsuario:
                usuario.idUsuario,

            nombreCompleto:
                usuario.nombreCompleto,

            idRol:
                usuario.idRol,

            rol:
                usuario.rol,

            idSucursal:
                usuario.idSucursal
        })
    );
}



/* =========================================================
   MOSTRAR / OCULTAR CONTRASEÑA
========================================================= */

function mostrarOcultarPassword() {

    const input =
        document.getElementById(
            "password"
        );


    const boton =
        document.getElementById(
            "btnMostrarPassword"
        );


    if (input.type === "password") {

        input.type = "text";

        boton.textContent =
            "Ocultar";

    } else {

        input.type = "password";

        boton.textContent =
            "Mostrar";
    }
}



/* =========================================================
   MENSAJES
========================================================= */

function mostrarMensaje(
    mensaje,
    tipo
) {

    const contenedor =
        document.getElementById(
            "mensajeLogin"
        );


    contenedor.className =
        "alert alert-" +
        tipo;


    contenedor.textContent =
        mensaje;
}