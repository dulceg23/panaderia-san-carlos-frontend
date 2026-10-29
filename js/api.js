const API_BASE =
    window.PANADERIA_CONFIG.API_BASE;
/* =========================================================
   OBTENER TOKEN
========================================================= */

function obtenerTokenApi() {

    return localStorage.getItem(
        "panaderia_token"
    );
}


/* =========================================================
   CREAR HEADERS
========================================================= */

function crearHeadersApi() {

    const token =
        obtenerTokenApi();


    const headers = {

        "Content-Type":
            "application/json"

    };


    if (token) {

        headers["Authorization"] =
            "Bearer " + token;
    }


    return headers;
}


/* =========================================================
   PROCESAR RESPUESTA
========================================================= */

async function procesarRespuestaApi(
    response,
    mensajeDefecto
) {

    let resultado = null;


    try {

        resultado =
            await response.json();

    } catch (error) {

        resultado = null;
    }


    /* SESION NO VALIDA */

    if (response.status === 401) {

        localStorage.removeItem(
            "panaderia_token"
        );


        localStorage.removeItem(
            "panaderia_usuario"
        );


        window.location.replace(
            "login.html"
        );


        throw new Error(
            resultado?.mensaje
            ||
            "La sesión no es válida o ha expirado."
        );
    }


    /* SIN PERMISOS */

    if (response.status === 403) {

        throw new Error(
            resultado?.mensaje
            ||
            "No tiene permiso para realizar esta operación."
        );
    }


    /* OTROS ERRORES */

    if (!response.ok) {

        throw new Error(
            resultado?.mensaje
            ||
            mensajeDefecto
            ||
            (
                "Error HTTP "
                +
                response.status
            )
        );
    }


    return resultado;
}


/* =========================================================
   GET
========================================================= */

async function apiGet(endpoint) {

    const response =
        await fetch(
            API_BASE + endpoint,
            {

                method:
                    "GET",

                headers:
                    crearHeadersApi()

            }
        );


    return await procesarRespuestaApi(
        response,
        "Error al consultar información."
    );
}


/* =========================================================
   POST
========================================================= */

async function apiPost(
    endpoint,
    datos
) {

    const response =
        await fetch(
            API_BASE + endpoint,
            {

                method:
                    "POST",

                headers:
                    crearHeadersApi(),

                body:
                    JSON.stringify(datos)

            }
        );


    return await procesarRespuestaApi(
        response,
        "Error al guardar."
    );
}


/* =========================================================
   PUT
========================================================= */

async function apiPut(
    endpoint,
    datos = null
) {

    const opciones = {

        method:
            "PUT",

        headers:
            crearHeadersApi()

    };


    if (datos !== null) {

        opciones.body =
            JSON.stringify(datos);
    }


    const response =
        await fetch(
            API_BASE + endpoint,
            opciones
        );


    return await procesarRespuestaApi(
        response,
        "Error al actualizar."
    );
}


/* =========================================================
   DELETE
========================================================= */

async function apiDelete(endpoint) {

    const response =
        await fetch(
            API_BASE + endpoint,
            {

                method:
                    "DELETE",

                headers:
                    crearHeadersApi()

            }
        );


    return await procesarRespuestaApi(
        response,
        "Error al eliminar."
    );
}