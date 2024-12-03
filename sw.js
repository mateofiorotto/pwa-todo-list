/////////////////////////////////////////
//               CACHE                 //
/////////////////////////////////////////
const nombreCache = "pwaCache_Parcial_Fiorotto_Neto"
let archivosCache = [
    "index.html",
    "assets/styles.css",
    "assets/main.js",
    "imgs/512x512.png",
];

//precaching
//instalamos el SW
self.addEventListener("install", (evento) => {
    //cancelamos la espera
    console.log("SW: Instalado", evento);
    self.skipWaiting();

    //espera a completar el promise
    evento.waitUntil(
        //creamos el cache
        caches.open(nombreCache)
            .then( (cache) => {
                console.log("SW: Cacheado");
                //añadimos los archivos al cache (de la lista especificada antes)
                cache.addAll(archivosCache)
            } )
    )                      
})

//activamos el cache
self.addEventListener("activate", (evento) => { console.log("SW: Activado", evento);})

//realizamos un fetch
self.addEventListener("fetch", (evento) => {
    //console.log("SW: Fetch", evento.request.url)
    //1. verificar si esta en cache
    evento.respondWith(
        caches.match(evento.request)
        .then ((response) => {
            if (response){
                console.log("existe en la cache")
                return response
            }
            
            const requestCopia = evento.request.clone()
            return fetch(requestCopia)
                .then ( response => {
                    if( !response || response.status !== 200){
                        return response
                    }

                    const responseCopia = response.clone()
                    caches.open(nombreCache)
                        .then ((cache) => {
                            console.log("Guardado", evento.request.url)
                            cache.put(evento.request, responseCopia)
                        })
                    return response
                })
        })
    )
})

//NOTIFICACIONES

//pusheo la notificacion
self.addEventListener('push', event => {
    const data = event.data.json();
    console.log('Notificación push recibida:', data);

    event.waitUntil(mostrarNotificacion(event.data.title, event.data.body));
});

//obtengo el mensaje del main.js (desde cada eventlistener)
self.addEventListener('message', event => {
    console.log('Mensaje recibido del hilo principal:', event.data);

    event.waitUntil(mostrarNotificacion(event.data.title, event.data.body));
});

//configuracion de las notificaciones en general
function mostrarNotificacion(title, body) {
    self.registration.showNotification(title, {
        body: body,
        icon: 'imgs/512x512.png',
        vibrate: [200, 100, 200],
        badge: 'imgs/152x152.png',
        actions: [
            {
                "action": "cerrar",
                "title": "Cerrar",
            }
        ]
    } 
);
}

self.addEventListener("notificationclick", function(event) {
    console.log(event)
    if( event.action === "cerrar" ){
        console.log("Se cerró la notificación!");
    }
})
