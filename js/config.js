/* =========================================================
   CONFIGURACIÓN GENERAL DE LA API
========================================================= */

(function () {

    const API_LOCAL =
        "http://localhost:8080/PanaderiaWeb/webapi";

    const API_PUBLICA =
        "https://loads-drinks-documentary-deviation.trycloudflare.com/PanaderiaWeb/webapi";


    const ES_LOCAL =
        window.location.hostname === "localhost"
        ||
        window.location.hostname === "127.0.0.1";


    window.PANADERIA_CONFIG = {

        API_BASE:
            ES_LOCAL
                ? API_LOCAL
                : API_PUBLICA

    };

})();