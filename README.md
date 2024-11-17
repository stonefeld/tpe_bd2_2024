# Trabajo Práctico Obligatorio - Base de Datos II

## Tabla de contenidos

* [Requisitos](#requisitos)
* [Instalación](#instalación)
* [Correr el programa](#correr-el-programa)

## Requisitos

* `node.js`
* `mongodb`
* `redis`

## Instalación

Para instalar el entorno de trabajo simplemente correr el comando 

```bash
$ npm i
```

Además, hay que inicializar las bases de datos. Estas, como ya se mencionó son `mongodb` y `redis`.
Usaremos docker para inicializar dichas bases de datos.

```bash
$ docker run --name bd2-mongo -p 27017:27017 -d mongo
$ docker run --name bd2-redis -p 6379:6379 -d redis
```

## Correr el programa

Para correr el proyecto completo, simplemente interpretarlo con `node`

```bash
$ node .
```

Al ejecutar el proyecto, aparecerá un menú que permite seleccionar el tipo de query que se desea ejecutar.
La primera vez que se ejecute, los datos no estarán cargados, por lo que, como primera instancia recomendamos ejecutar
la query "`0) Cargar datos`"