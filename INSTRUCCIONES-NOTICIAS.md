# Instrucciones — Sección Noticias (Google Sheets)

La sección **Novedades** del sitio carga las noticias automáticamente desde un Google Sheet.
No se necesita acceder al código para agregar o editar noticias.

---

## 1. Crear el Google Sheet

1. Ir a [Google Sheets](https://sheets.google.com) e iniciar sesión con la cuenta de GrupoCEM.
2. Crear una hoja nueva y nombrarla `Noticias GrupoCEM`.
3. En la **primera fila** escribir exactamente estos encabezados (una columna por celda):

| A | B | C | D | E |
|---|---|---|---|---|
| titulo | fecha | marca | imagen_url | descripcion |

4. Completar las filas siguientes con las noticias (una por fila).

### Ejemplo de datos:

| titulo | fecha | marca | imagen_url | descripcion |
|--------|-------|-------|------------|-------------|
| Nueva apertura en Esperanza | Abr 2026 | Carnave | https://... | Nueva esquina en Col. y Rafaela. |
| Visitas en planta Humboldt | Mar 2026 | Avigan | https://... | Alumnos del ITEC visitaron la planta. |

### Valores válidos para la columna **marca**:
- `Carnave`
- `Avigan`
- `Avicola`
- `OvoFood`
- `GrupoCEM`

> El texto de `marca` determina el color del acento en la tarjeta.

---

## 2. Publicar el Sheet como CSV

1. En el Sheet, ir a **Archivo → Compartir → Publicar en la web**.
2. En el desplegable "Hoja", seleccionar la hoja con las noticias.
3. En el desplegable de formato, elegir **Valores separados por coma (.csv)**.
4. Hacer clic en **Publicar** y confirmar.
5. Copiar la URL que aparece. Se ve así:
   ```
   https://docs.google.com/spreadsheets/d/XXXXXXXXXXXXXXXX/pub?gid=0&single=true&output=csv
   ```

---

## 3. Configurar la URL en el sitio

1. Abrir el archivo `js/main.js` con cualquier editor de texto.
2. Buscar la línea:
   ```js
   const SHEET_CSV_URL = '';
   ```
3. Reemplazarla con la URL copiada en el paso anterior:
   ```js
   const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/XXXXXXXXXXXXXXXX/pub?gid=0&single=true&output=csv';
   ```
4. Guardar el archivo y subir al servidor.

---

## 4. Agregar una noticia nueva

Solo completar una nueva fila en el Sheet. La web muestra automáticamente las **3 primeras filas** del Sheet.

> Para destacar una noticia, moverla a la primera fila. Para archivarla, moverla por debajo de la fila 3 o eliminarla.

---

## 5. Columna imagen_url

- Ingresar la URL directa de una imagen (debe comenzar con `https://`).
- Se puede usar una imagen subida a Google Drive (compartida como "Cualquier persona con el enlace"), Imgur, o cualquier hosting de imágenes.
- Si la celda está vacía, la tarjeta muestra un fondo de color sin imagen.
- Tamaño recomendado: **800×450 px** (proporción 16:9).

---

## Preguntas frecuentes

**¿Cuánto tarda en verse el cambio?**
Inmediatamente. El sitio carga las noticias en cada visita.

**¿Qué pasa si hay un error en el Sheet?**
El sitio muestra el mensaje "Las noticias no están disponibles en este momento." sin romperse.

**¿Se puede tener más de 3 noticias?**
Sí, el Sheet puede tener todas las que se quieran. El sitio siempre muestra las primeras 3 filas de datos.

**¿Se necesita contraseña para editar?**
Solo para editar el Sheet (cuenta de Google). La lectura por parte del sitio es pública.
