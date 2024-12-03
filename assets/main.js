/////////////////////////////////////////
//            CARGAR SW                //
/////////////////////////////////////////

if("serviceWorker" in navigator){
    //.register() registra mi Service worker
    navigator.serviceWorker.register("sw.js")
        .then( (registrado) => {
            //registro ok
            console.log("SW registrado correctamente" ,registrado);
        })
        .catch((err) => {
            console.log("registro fallido" ,err);
        })
}


/////////////////////////////////////////
//            NOTIFICACIONES           //
/////////////////////////////////////////

//public vapidkey
const publicVapidKey = 'BNN0KC6LlkNRrB6D4dGrnJd9BxdO0NjB_TMiIweFAtGMSvDem41CIvfRmpSESjQmh68YfCOBi_6NzdxddUPzfT4';

//función para convertir la clave pública VAPID a un formato adecuado
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

//al clickear en la campana, se solicita al usuario permiso de notificaciones
document.getElementById('btn-suscribirse').addEventListener('click', async () => {
    const registration = await navigator.serviceWorker.ready;

    try {
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });

        await fetch(window.location.href, {
            method: 'POST',
            body: JSON.stringify({ subscription }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log("Suscripción a notificaciones exitosa")
    } catch (error) {
        console.error('Error al suscribirse a notificaciones:', error);
    }
});

/////////////////////////////////////////
//           OFFLINE-ONLINE            //
/////////////////////////////////////////

//con esta funcion indicamos al usuario si tiene o no internet
//es un agregado, no se pide en la pauta
(function () {
    //obtengo el metaTema y el header
    let metaTema = document.querySelector('meta[name="theme-color"]');
    let headerEtiqueta = document.querySelector('.header');

    function estado() {
        //si estamos online mostrar fondo negro (original de la app)
        if (navigator.onLine) {
            metaTema.setAttribute("content", "#000000");
            headerEtiqueta.style.backgroundColor = "#000000";
        } else {
            //si estamos offline mostrar gris
            metaTema.setAttribute("content", "#808080");
            headerEtiqueta.style.backgroundColor = "#808080";
        }
    }

    //logica para escuchar cambios entre online - offline
    if (!navigator.onLine) {
        estado(this)
    }
    window.addEventListener("online", estado);
    window.addEventListener("offline", estado);
})();

/////////////////////////////////////////
//      LOGICA/VARIABLES/ESTILOS       //
/////////////////////////////////////////
let btnAgregar = document.querySelector(".btn");
let btnVaciar = document.querySelector(".btn-vaciar");
let ulTareas = document.querySelector(".tareas");
let mensajeTareas = document.getElementById("aparecen-tareas");
let contador = 0;
let mensajeError = document.createElement("p");
let tareaInput = document.querySelector(".tarea");
const formTareas = document.getElementById("formTareas");

//agregar clases y/o estilos
mensajeError.classList.add("error-message");
mensajeError.style.color = "red";
document.querySelector(".form-container").insertBefore(mensajeError, btnAgregar);

//cuando cargue la pagina, obtenemos las tareas desde localStorage
document.addEventListener("DOMContentLoaded", cargarTareas);

//btn agregar tareas

formTareas.addEventListener("submit", function (event) {
    mensajeTareas.style.display = "none";
    mensajeError.textContent = "";
    tareaInput.classList.remove("input-error");
    event.preventDefault();

    let tarea = tareaInput.value.trim();

    // Evitar tareas vacías
    if (tarea === "") {
        mensajeError.textContent = "Por favor, ingresa una tarea válida.";
        tareaInput.classList.add("input-error");
    } else {
        agregarTarea(tarea);
        guardarTareas();
        tareaInput.value = "";
        tareaInput.classList.remove("input-error");

        // Notificación para cuando se agrega la tarea
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(function (registration) {
                registration.active.postMessage({
                    title: 'Nueva tarea añadida',
                    body: `Agregaste: ${tarea}`,
                    icon: 'imgs/512x512.png'
                });
            });
        }
    }
});

//boton para vaciar tareas
btnVaciar.addEventListener("click", function (event) {
    event.preventDefault();
    while (ulTareas.firstChild) {
        ulTareas.removeChild(ulTareas.firstChild);
    }
    mensajeTareas.style.display = "block";
    contador = 0;
    //eliminamos el array de tareas del local
    localStorage.removeItem("tareas");
});


//agregar tareas al dom
function agregarTarea(tarea) {
    contador++;

    let numTarea = document.createElement("h2");
    numTarea.textContent = "0" + contador;
    numTarea.classList.add("numero-tarea", "block", "bold");

    let liTarea = document.createElement("li");
    liTarea.classList.add("col-lg-5", "col-md-12", "m-2", "owh");

    let textoTarea = document.createElement("p");
    textoTarea.textContent = tarea;

    let iconoContainer = document.createElement("div");
    iconoContainer.classList.add("container-iconos", "d-block", "mt-2");

    let iconoCheck = document.createElement("i");
    iconoCheck.classList.add("bi", "bi-check-circle-fill", "me-2");

    let iconoBorrar = document.createElement("i");
    iconoBorrar.classList.add("bi", "bi-trash-fill");

    iconoContainer.append(iconoCheck, iconoBorrar);

    liTarea.appendChild(numTarea);
    liTarea.appendChild(textoTarea);
    liTarea.appendChild(iconoContainer);

    ulTareas.appendChild(liTarea);

    //evento completar
    iconoCheck.addEventListener("click", function () {
        if (liTarea.classList.contains("completado")) {
            liTarea.classList.remove("completado");
            iconoCheck.classList.remove("descompletar");
        } else {
            liTarea.classList.add("completado");
            iconoCheck.classList.add("descompletar");
            
            //notificacion para la tarea descompletada
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(function (registration) {
                    registration.active.postMessage({
                        title: 'Marcaste una tarea como completada',
                        body: `Completaste: ${tarea}`,
                        icon: 'imgs/512x512.png'
                    });
                });
            }
    
        }
        guardarTareas();
    });

    //agregar evento de eliminar
    iconoBorrar.addEventListener("click", function () {
        ulTareas.removeChild(liTarea);
        actualizarNumeros();
        guardarTareas();

        //notificacion de eliminar
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(function (registration) {
                registration.active.postMessage({
                    title: 'Eliminaste una tarea',
                    body: `Borraste: ${tarea}`,
                    icon: 'imgs/512x512.png'
                });
            });
        }
    }
);
}

//cargar tareas desde localstorage
function cargarTareas() {
    //parseamos las tareas
    const tareasGuardadas = JSON.parse(localStorage.getItem("tareas")) || [];
    contador = tareasGuardadas.length;

    ulTareas.innerHTML = '';

    tareasGuardadas.forEach((tarea) => {
        agregarTarea(tarea.texto);
        if (tarea.completado) {
            ulTareas.lastElementChild.classList.add("completado");
            ulTareas.lastElementChild.querySelector(".bi-check-circle-fill").classList.add("descompletar");
        }
    });

    actualizarNumeros();

    //mostrar u ocultar el mensaje dependiendo de si hay tareas
    if (contador === 0) {
        mensajeTareas.style.display = "block";
    } else {
        mensajeTareas.style.display = "none";
    }
}

//función para guardar tareas en localStorage
function guardarTareas() {
    const tareas = [];
    ulTareas.querySelectorAll("li").forEach((liTarea) => {
        tareas.push({
            texto: liTarea.querySelector("p").textContent,
            completado: liTarea.classList.contains("completado")
        });
    });
    //stringifeamos la tarea para almacenarla
    localStorage.setItem("tareas", JSON.stringify(tareas));
}

//actualizar numeros de la tarea (esto para el contador de tarea 01, 02, etc)
function actualizarNumeros() {
    const tareas = ulTareas.querySelectorAll("li");
    tareas.forEach((liTarea, index) => {
        const numTarea = liTarea.querySelector(".numero-tarea");
        numTarea.textContent = "0" + (index + 1);
    });
    contador = tareas.length;

    if (contador === 0) {
        mensajeTareas.style.display = "block";
    }
}

/////////////////////////////////////////
//              API SHARE              //
/////////////////////////////////////////
(function () {
    document.querySelector('.btn-compartir').addEventListener('click', function (e) {
        if (navigator.share) {
            navigator.share({
                title: 'Compartir lista',
                text: 'Esta es mi lista!',
                url: window.location.href,
            })
                .then(function () {
                    console.log("Se compartió")
                })
                .catch(function (error) {
                    console.log(error)
                })
        }
    });
})();

/////////////////////////////////////////
//         BOTON PARA INSTALAR         //
/////////////////////////////////////////
let aviso;
window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    aviso = e;

    const alertaDiv = document.querySelector(".alerta");
    alertaDiv.style.display = "flex";

    alertaDiv.addEventListener("click", (e) => {
        e.target.style.display = "none";
        if (aviso) {
            aviso.prompt();
            aviso.userChoice
                .then((resultado) => {
                    if (resultado.outcome === "accepted") {
                        console.log("Aceptado");
                    } else {
                        console.log("Rechazado");
                        e.target.style.display = "block";
                    }
                })
            aviso = null;
        }
    })
})
